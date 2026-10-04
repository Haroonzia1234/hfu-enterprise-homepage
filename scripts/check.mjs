import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { execSync } from 'node:child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');

const errors = [];
const warnings = [];

function addError(msg) {
  errors.push(msg);
}

function addWarning(msg) {
  warnings.push(msg);
}

async function readDirRecursive(dir) {
  const entries = await fsp.readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const res = path.resolve(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await readDirRecursive(res)));
    } else if (entry.isFile()) {
      files.push(res);
    }
  }
  return files;
}

function isTextFile(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (['.png', '.jpg', '.jpeg', '.webp', '.ico', '.woff2'].includes(ext)) {
    return false;
  }
  if (filePath.includes('.git')) {
    return false;
  }
  return true;
}

async function check() {
  const allFiles = [];
  const dirsToCheck = ['src', 'js', 'scripts', 'docs', 'assets/img'];
  for (const d of dirsToCheck) {
    const p = path.join(ROOT, d);
    if (fs.existsSync(p)) {
      allFiles.push(...(await readDirRecursive(p)));
    }
  }
  for (const f of ['README.md', 'SUBMISSION.md', 'index.html', 'package.json']) {
    const p = path.join(ROOT, f);
    if (fs.existsSync(p)) {
      allFiles.push(p);
    }
  }

  for (const file of allFiles) {
    if (!isTextFile(file)) {
      continue;
    }
    const content = await fsp.readFile(file, 'utf8');
    if (/[^\x00-\x7F]/.test(content)) {
      addError(`Non-ASCII character found in ${path.relative(ROOT, file)}`);
    }
  }

  for (const file of allFiles) {
    if (!isTextFile(file)) {
      continue;
    }
    if (file.endsWith('.md') || file.endsWith('.json')) {
      continue;
    }
    const content = await fsp.readFile(file, 'utf8');

    let stripped = content.replace(/(['"`])(?:\\[\s\S]|(?!\1)[^\\])*\1/g, '""');
    stripped = stripped.replace(/:\/\//g, '');

    if (file.endsWith('.html') || file.endsWith('.svg')) {
      if (/<!--/.test(stripped)) {
        addError(`HTML comment found in ${path.relative(ROOT, file)}`);
      }
    }
    if (file.endsWith('.css') || file.endsWith('.js') || file.endsWith('.mjs')) {
      if (/\/\*/.test(stripped)) {
        addError(`Block comment found in ${path.relative(ROOT, file)}`);
      }
    }
    if (file.endsWith('.js') || file.endsWith('.mjs')) {
      if (/\/\//.test(stripped)) {
        addError(`Line comment found in ${path.relative(ROOT, file)}`);
      }
    }
  }

  for (const file of allFiles) {
    if (!file.endsWith('.js') && !file.endsWith('.mjs')) {
      continue;
    }
    const content = await fsp.readFile(file, 'utf8');
    const stripped = content.replace(/(['"`])(?:\\[\s\S]|(?!\1)[^\\])*\1/g, '""');

    const sameLineBody = stripped.match(/\)\s*\{\s*[^\s}][^\n]*\n/);
    if (sameLineBody) {
      addError(
        `Body on same line as condition in ${path.relative(ROOT, file)}: ${sameLineBody[0].trim()}`
      );
    }

    const lines = stripped.split('\n');
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      const nextLine = i + 1 < lines.length ? lines[i + 1].trim() : '';

      const matchIf = line.match(/^(if|for|while)\s*\(.*\)/);
      if (matchIf) {
        if (!line.endsWith('{') && !nextLine.startsWith('{')) {
          addError(
            `Missing brace for ${matchIf[1]} in ${path.relative(ROOT, file)} on line ${i + 1}`
          );
        }
      }

      const matchElse = line.match(/^else\b/);
      if (matchElse && !line.startsWith('else if')) {
        if (!line.endsWith('{') && !nextLine.startsWith('{')) {
          addError(`Missing brace for else in ${path.relative(ROOT, file)} on line ${i + 1}`);
        }
      }
    }
  }

  for (const file of allFiles) {
    if (!file.endsWith('.js') && !file.endsWith('.mjs')) {
      continue;
    }
    try {
      execSync(`node --check "${file}"`, { stdio: 'ignore' });
    } catch (e) {
      addError(`Syntax error in ${path.relative(ROOT, file)}`);
    }
  }

  const jsDir = path.join(ROOT, 'js');
  if (fs.existsSync(jsDir)) {
    const jsFiles = await readDirRecursive(jsDir);
    for (const file of jsFiles) {
      if (!file.endsWith('.js') && !file.endsWith('.mjs')) {
        continue;
      }
      const content = await fsp.readFile(file, 'utf8');
      const importRegex = /import\s+\{([^}]+)\}\s+from\s+['"]([^'"]+)['"]/g;
      let m;
      while ((m = importRegex.exec(content)) !== null) {
        const imports = m[1]
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean);
        const target = m[2];
        const targetPath = path.join(path.dirname(file), target);
        try {
          const mod = await import(pathToFileURL(targetPath).href);
          for (const imp of imports) {
            const exportName = imp.includes(' as ') ? imp.split(' as ')[0].trim() : imp;
            if (!(exportName in mod)) {
              addError(
                `Export '${exportName}' not found in ${target} (imported by ${path.relative(ROOT, file)})`
              );
            }
          }
        } catch (e) {
          addError(`Could not load import ${target} in ${path.relative(ROOT, file)}: ${e.message}`);
        }
      }
    }
  }

  const indexPath = path.join(ROOT, 'index.html');
  if (!fs.existsSync(indexPath)) {
    try {
      execSync(`node "${path.join(ROOT, 'scripts', 'build.mjs')}"`, { stdio: 'ignore' });
    } catch (e) {
      addError(`Failed to build index.html: ${e.message}`);
    }
  }

  const htmlClasses = new Set();
  if (fs.existsSync(indexPath)) {
    const html = await fsp.readFile(indexPath, 'utf8');

    const ids = new Set();
    const idRegex = /id=["']([^"']+)["']/g;
    let m;
    while ((m = idRegex.exec(html)) !== null) {
      if (ids.has(m[1])) {
        addError(`Duplicate id attribute in index.html: ${m[1]}`);
      }
      ids.add(m[1]);
    }

    const hrefRegex = /href=["']#([^"']+)["']/g;
    while ((m = hrefRegex.exec(html)) !== null) {
      if (m[1] && !ids.has(m[1])) {
        addError(`Anchor href="#${m[1]}" target does not exist in index.html`);
      }
    }

    const symbols = new Set();
    const symbolRegex = /<symbol[^>]+id=["']([^"']+)["']/g;
    while ((m = symbolRegex.exec(html)) !== null) {
      symbols.add(m[1]);
    }

    const useRegex = /<use[^>]+href=["']#([^"']+)["']/g;
    while ((m = useRegex.exec(html)) !== null) {
      if (!symbols.has(m[1])) {
        addError(`<use href="#${m[1]}"> reference has no matching <symbol> in index.html`);
      }
    }

    const classRegex = /class=["']([^"']+)["']/g;
    while ((m = classRegex.exec(html)) !== null) {
      m[1].split(/\s+/).forEach((c) => c && htmlClasses.add(c));
    }
  }

  const cssPath = path.join(ROOT, 'css', 'styles.css');
  const cssClasses = new Set();
  if (fs.existsSync(cssPath)) {
    const css = await fsp.readFile(cssPath, 'utf8');
    const classRegex = /\.([a-zA-Z0-9_-]+)/g;
    let m;
    while ((m = classRegex.exec(css)) !== null) {
      cssClasses.add(m[1]);
    }
  }

  let jsContent = '';
  if (fs.existsSync(jsDir)) {
    const jsFiles = await readDirRecursive(jsDir);
    for (const f of jsFiles) {
      if (f.endsWith('.js') || f.endsWith('.mjs')) {
        jsContent += await fsp.readFile(f, 'utf8');
      }
    }
  }

  for (const c of htmlClasses) {
    if (!cssClasses.has(c)) {
      addWarning(`CSS class '${c}' used in HTML but not defined in CSS`);
    }
  }

  for (const c of cssClasses) {
    if (!htmlClasses.has(c) && !jsContent.includes(c)) {
      addWarning(`CSS class '${c}' defined in CSS but never used in HTML or JS`);
    }
  }

  const badVars = ['e', 'el', 'i', 'm', 'st', 'cb', 'fn', 'res', 'btn', 'evt'];
  if (fs.existsSync(jsDir)) {
    const jsFiles = await readDirRecursive(jsDir);
    for (const f of jsFiles) {
      if (!f.endsWith('.js') && !f.endsWith('.mjs')) {
        continue;
      }
      const content = await fsp.readFile(f, 'utf8');

      const varRegex = new RegExp(
        `\\b(?:const|let|var|function)\\s+(${badVars.join('|')})\\b`,
        'g'
      );
      let m;
      while ((m = varRegex.exec(content)) !== null) {
        addWarning(
          `Single letter/abbreviated identifier '${m[1]}' used in ${path.relative(ROOT, f)}`
        );
      }

      const paramRegex = new RegExp(`\\(\\s*(${badVars.join('|')})\\s*[\\),]`, 'g');
      while ((m = paramRegex.exec(content)) !== null) {
        addWarning(
          `Single letter/abbreviated parameter '${m[1]}' used in ${path.relative(ROOT, f)}`
        );
      }
    }
  }

  if (warnings.length > 0) {
    console.log('WARNINGS:');
    warnings.forEach((w) => console.log(` - ${w}`));
  }

  if (errors.length > 0) {
    console.error('\nERRORS:');
    errors.forEach((e) => console.error(` - ${e}`));
    process.exit(1);
  }

  console.log('\nAll checks passed!');
}

check().catch((e) => {
  console.error(e);
  process.exit(1);
});
