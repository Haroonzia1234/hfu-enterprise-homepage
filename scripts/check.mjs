import { readdir, readFile, stat } from 'node:fs/promises';
import { join, relative, extname } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import * as acorn from 'acorn';

const currentDirectory = fileURLToPath(new URL('.', import.meta.url));
const rootDirectory = join(currentDirectory, '..');

let totalErrorCount = 0;
let totalWarningCount = 0;

function reportError(filePath, messageText) {
  console.log(`ERROR: ${filePath} - ${messageText}`);
  totalErrorCount++;
}

function reportWarning(filePath, messageText) {
  console.log(`WARNING: ${filePath} - ${messageText}`);
  totalWarningCount++;
}

async function getFilesRecursively(directoryPath) {
  const allFilesList = [];
  try {
    const directoryEntries = await readdir(directoryPath, { withFileTypes: true });
    for (const directoryEntry of directoryEntries) {
      const entryFullPath = join(directoryPath, directoryEntry.name);
      if (directoryEntry.isDirectory()) {
        const nestedFilesList = await getFilesRecursively(entryFullPath);
        for (const nestedFile of nestedFilesList) {
          allFilesList.push(nestedFile);
        }
      } else if (directoryEntry.isFile()) {
        allFilesList.push(entryFullPath);
      }
    }
  } catch {}
  return allFilesList;
}

function isTextExtension(fileExtension) {
  const lowercaseExtension = fileExtension.toLowerCase();
  const binaryExtensions = ['.png', '.jpg', '.jpeg', '.webp', '.ico', '.woff2'];
  return !binaryExtensions.includes(lowercaseExtension);
}

async function runAllChecks() {
  const textDirectories = ['src', 'js', 'scripts', 'docs'];
  const textFilesList = [
    'README.md',
    'SUBMISSION.md',
    'index.html',
    'package.json',
    'eslint.config.js',
  ];
  const allTextFilePaths = [];

  for (const directoryName of textDirectories) {
    const directoryFiles = await getFilesRecursively(join(rootDirectory, directoryName));
    for (const directoryFile of directoryFiles) {
      allTextFilePaths.push(directoryFile);
    }
  }

  for (const textFileName of textFilesList) {
    const textFilePath = join(rootDirectory, textFileName);
    try {
      const fileStat = await stat(textFilePath);
      if (fileStat.isFile()) {
        allTextFilePaths.push(textFilePath);
      }
    } catch {}
  }

  for (const textFilePath of allTextFilePaths) {
    const fileExtension = extname(textFilePath);
    if (!isTextExtension(fileExtension)) {
      continue;
    }
    const fileContent = await readFile(textFilePath, 'utf8');
    if (/[^\x00-\x7F]/.test(fileContent)) {
      reportError(relative(rootDirectory, textFilePath), 'Contains non-ASCII characters');
    }
  }

  const javascriptDirectories = ['js', 'scripts'];
  const javascriptFilesList = ['eslint.config.js'];
  const allJavascriptFilePaths = [];

  for (const directoryName of javascriptDirectories) {
    const directoryFiles = await getFilesRecursively(join(rootDirectory, directoryName));
    for (const directoryFile of directoryFiles) {
      if (directoryFile.endsWith('.js') || directoryFile.endsWith('.mjs')) {
        allJavascriptFilePaths.push(directoryFile);
      }
    }
  }

  for (const javascriptFileName of javascriptFilesList) {
    const javascriptFilePath = join(rootDirectory, javascriptFileName);
    try {
      const fileStat = await stat(javascriptFilePath);
      if (fileStat.isFile()) {
        allJavascriptFilePaths.push(javascriptFilePath);
      }
    } catch {}
  }

  for (const javascriptFilePath of allJavascriptFilePaths) {
    const fileContent = await readFile(javascriptFilePath, 'utf8');
    const commentsList = [];
    try {
      acorn.parse(fileContent, {
        ecmaVersion: 'latest',
        sourceType: 'module',
        onComment: commentsList,
      });
      if (commentsList.length > 0) {
        reportError(relative(rootDirectory, javascriptFilePath), 'Contains JavaScript comments');
      }
    } catch (parseError) {
      const errorMessage = `Acorn parse error: ${parseError.message}`;
      reportError(relative(rootDirectory, javascriptFilePath), errorMessage);
    }
  }

  const cssFilesList = await getFilesRecursively(join(rootDirectory, 'src', 'css'));
  for (const cssFile of cssFilesList) {
    if (cssFile.endsWith('.css')) {
      const fileContent = await readFile(cssFile, 'utf8');
      if (/\/\*/.test(fileContent)) {
        reportError(relative(rootDirectory, cssFile), 'Contains CSS comments');
      }
    }
  }

  const htmlFilesList = await getFilesRecursively(join(rootDirectory, 'src'));
  for (const htmlFile of htmlFilesList) {
    if (htmlFile.endsWith('.html')) {
      const fileContent = await readFile(htmlFile, 'utf8');
      if (/<!--/.test(fileContent)) {
        reportError(relative(rootDirectory, htmlFile), 'Contains HTML comments');
      }
    }
  }

  const eslintArguments = ['eslint', 'js', 'scripts', 'eslint.config.js', '--format', 'json'];
  const lintProcess = spawnSync('npx', eslintArguments, {
    cwd: rootDirectory,
    encoding: 'utf8',
  });

  if (lintProcess.stdout) {
    try {
      const lintResultsList = JSON.parse(lintProcess.stdout);
      for (const resultItem of lintResultsList) {
        const filePathRelative = relative(rootDirectory, resultItem.filePath);
        for (const lintMessage of resultItem.messages) {
          if (lintMessage.severity === 2) {
            reportError(filePathRelative, `ESLint Error: ${lintMessage.message}`);
          }
        }
        if (resultItem.warningCount > 0) {
          reportWarning(filePathRelative, `ESLint warnings count: ${resultItem.warningCount}`);
        }
      }
    } catch (parseError) {
      const errorMessage = `Failed to parse ESLint JSON output: ${parseError.message}`;
      reportError('ESLint output', errorMessage);
    }
  }

  const applicationJsFilesList = await getFilesRecursively(join(rootDirectory, 'js'));
  for (const javascriptFile of applicationJsFilesList) {
    if (javascriptFile.endsWith('.js') || javascriptFile.endsWith('.mjs')) {
      const fileContent = await readFile(javascriptFile, 'utf8');
      const importRegex = /import\s+\{([^}]+)\}\s+from\s+['"]([^'"]+)['"]/g;
      let importMatch;
      while ((importMatch = importRegex.exec(fileContent)) !== null) {
        const importedNamesString = importMatch[1];
        const importTarget = importMatch[2];
        const importedNamesList = importedNamesString
          .split(',')
          .map((importName) => {
            const trimmedName = importName.trim();
            if (trimmedName.includes(' as ')) {
              return trimmedName.split(' as ')[0].trim();
            }
            return trimmedName;
          })
          .filter((importName) => {
            return importName.length > 0;
          });

        const targetPath = join(javascriptFile, '..', importTarget);
        try {
          const importedModule = await import(pathToFileURL(targetPath).href);
          for (const importedName of importedNamesList) {
            if (!(importedName in importedModule)) {
              const errorMessage = `Export '${importedName}' not found in ${importTarget}`;
              reportError(relative(rootDirectory, javascriptFile), errorMessage);
            }
          }
        } catch (importError) {
          const errorMessage = `Failed to import ${importTarget}: ${importError.message}`;
          reportError(relative(rootDirectory, javascriptFile), errorMessage);
        }
      }
    }
  }

  const indexHtmlPath = join(rootDirectory, 'index.html');
  try {
    const indexHtmlContent = await readFile(indexHtmlPath, 'utf8');
    const htmlIdsSet = new Set();
    const idRegex = /\sid=["']([^"']+)["']/g;
    let idMatch;
    while ((idMatch = idRegex.exec(indexHtmlContent)) !== null) {
      const idValue = idMatch[1];
      if (htmlIdsSet.has(idValue)) {
        reportError('index.html', `Duplicate id attribute: ${idValue}`);
      } else {
        htmlIdsSet.add(idValue);
      }
    }

    const anchorRegex = /href=["']#([^"']+)["']/g;
    let anchorMatch;
    while ((anchorMatch = anchorRegex.exec(indexHtmlContent)) !== null) {
      const anchorTarget = anchorMatch[1];
      if (anchorTarget !== '' && !htmlIdsSet.has(anchorTarget)) {
        reportError('index.html', `Link href="#${anchorTarget}" points to non-existent id`);
      }
    }

    const symbolRegex = /<symbol[^>]+id=["']([^"']+)["']/g;
    const svgSymbolsSet = new Set();
    let symbolMatch;
    while ((symbolMatch = symbolRegex.exec(indexHtmlContent)) !== null) {
      svgSymbolsSet.add(symbolMatch[1]);
    }

    const useRegex = /<use[^>]+href=["']#([^"']+)["']/g;
    let useMatch;
    while ((useMatch = useRegex.exec(indexHtmlContent)) !== null) {
      const useTarget = useMatch[1];
      if (useTarget !== '' && !svgSymbolsSet.has(useTarget)) {
        reportError('index.html', `<use href="#${useTarget}"> references non-existent symbol`);
      }
    }

    const cssClassesSet = new Set();
    const stylesCssPath = join(rootDirectory, 'css', 'styles.css');
    try {
      const cssContent = await readFile(stylesCssPath, 'utf8');
      const cssClassRegex = /\.([a-zA-Z][a-zA-Z0-9_-]*)/g;
      let cssClassMatch;
      while ((cssClassMatch = cssClassRegex.exec(cssContent)) !== null) {
        cssClassesSet.add(cssClassMatch[1]);
      }
    } catch {}

    const htmlClassRegex = /class=["']([^"']+)["']/g;
    let htmlClassMatch;
    while ((htmlClassMatch = htmlClassRegex.exec(indexHtmlContent)) !== null) {
      const htmlClassesList = htmlClassMatch[1].split(/\s+/);
      for (const htmlClassName of htmlClassesList) {
        if (htmlClassName === '') {
          continue;
        }
        if (
          htmlClassName.startsWith('is-') ||
          htmlClassName.startsWith('has-') ||
          htmlClassName.startsWith('js-')
        ) {
          continue;
        }
        if (!cssClassesSet.has(htmlClassName)) {
          const warningMessage = `CSS class '${htmlClassName}' not found in css/styles.css`;
          reportWarning('index.html', warningMessage);
        }
      }
    }
  } catch {
    reportError('index.html', 'Failed to read index.html');
  }

  console.log(`\nSummary: ${totalErrorCount} errors, ${totalWarningCount} warnings`);
  if (totalErrorCount > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runAllChecks().catch((executionError) => {
  console.error(executionError);
  process.exit(1);
});
