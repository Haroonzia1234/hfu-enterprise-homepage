import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import crypto from 'node:crypto';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const isProd = process.argv.includes('--production');

const SITE_URL = (
  process.env.SITE_URL || 'https://haroonzia1234.github.io/hfu-enterprise-homepage/'
).replace(/\/?$/, '/');
const CANONICAL = SITE_URL;
const ROBOTS = isProd
  ? '<meta name="robots" content="index, follow, max-image-preview:large">'
  : '<meta name="robots" content="noindex, nofollow">';
const TITLE = 'HFU Enterprise Ltd | Same Day Courier and Pallet Delivery, Quoted in 15 Minutes';
const DESCRIPTION =
  'same day courier, scheduled delivery, pallet delivery and vans from Manchester across the UK and abroad. Open 24/7. Get a quote in 15 minutes.';

async function fileExists(filePath) {
  try {
    await fs.stat(filePath);
    return true;
  } catch {
    return false;
  }
}

async function readDirRecursive(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
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

async function build() {
  let html = await fs.readFile(path.join(ROOT, 'src', 'template.html'), 'utf-8');

  const partialRegex = /\{\{>\s*([a-zA-Z0-9_-]+)\s*\}\}/g;
  let match;
  while ((match = partialRegex.exec(html)) !== null) {
    const name = match[1];
    const partialPath = path.join(ROOT, 'src', 'sections', `${name}.html`);
    if (!(await fileExists(partialPath))) {
      throw new Error(`Missing partial: ${partialPath}`);
    }
    const partialContent = (await fs.readFile(partialPath, 'utf-8')).trim();
    html = html.replace(match[0], partialContent);
    partialRegex.lastIndex = 0;
  }

  const cssOrder = [
    'fonts.css',
    'tokens.css',
    'base.css',
    'components.css',
    'utilities.css',
    ...[
      'header',
      'hero',
      'route-map',
      'stats',
      'services',
      'fleet',
      'how',
      'business',
      'coverage',
      'why',
      'reviews',
      'quote',
      'faq',
      'footer',
    ].map((name) => `sections/${name}.css`),
  ];

  let css = '';
  for (const cssFile of cssOrder) {
    const cssPath = path.join(ROOT, 'src', 'css', cssFile);
    if (await fileExists(cssPath)) {
      css += (await fs.readFile(cssPath, 'utf-8')) + '\n';
    } else {
      if (cssFile.startsWith('sections/')) {
        console.warn(`Warning: Missing section CSS file: ${cssPath}`);
      } else {
        throw new Error(`Missing required CSS file: ${cssPath}`);
      }
    }
  }

  await fs.mkdir(path.join(ROOT, 'css'), { recursive: true });
  await fs.writeFile(path.join(ROOT, 'css', 'styles.css'), css);

  const cssHash = crypto.createHash('sha256').update(css).digest('hex').substring(0, 8);

  const jsDir = path.join(ROOT, 'js');
  let jsFiles = [];
  if (await fileExists(jsDir)) {
    jsFiles = await readDirRecursive(jsDir);
    jsFiles.sort();
  }
  let jsConcat = '';
  for (const jsFile of jsFiles) {
    jsConcat += await fs.readFile(jsFile, 'utf-8');
  }
  const jsHash = crypto.createHash('sha256').update(jsConcat).digest('hex').substring(0, 8);

  const companyMod = await import(pathToFileURL(path.join(ROOT, 'js', 'data', 'company.js')).href);
  const servicesMod = await import(
    pathToFileURL(path.join(ROOT, 'js', 'data', 'services.js')).href
  );
  const faqsMod = await import(pathToFileURL(path.join(ROOT, 'js', 'data', 'faqs.js')).href);

  const COMPANY = companyMod.COMPANY;
  const SERVICES = servicesMod.SERVICES;
  const FAQS = faqsMod.FAQS;

  const jsonLdObj = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'LocalBusiness',
        name: COMPANY.legalName,
        url: SITE_URL,
        telephone: COMPANY.phones.map((p) => p.display),
        email: COMPANY.email,
        address: {
          '@type': 'PostalAddress',
          streetAddress: COMPANY.address.street,
          addressLocality: COMPANY.address.city,
          postalCode: COMPANY.address.postcode,
          addressCountry: 'GB',
        },
        openingHoursSpecification: {
          '@type': 'OpeningHoursSpecification',
          dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
          opens: '00:00',
          closes: '23:59',
        },
        areaServed: [
          ...COMPANY.localAreas.map((area) => ({ '@type': 'Place', name: area })),
          { '@type': 'Country', name: 'United Kingdom' },
        ],
        description: DESCRIPTION,
        makesOffer: SERVICES.map((service) => ({
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Service',
            name: service.name,
            description: service.description,
          },
        })),
      },
      {
        '@type': 'FAQPage',
        mainEntity: FAQS.map((faq) => ({
          '@type': 'Question',
          name: faq.question,
          acceptedAnswer: {
            '@type': 'Answer',
            text: faq.answer,
          },
        })),
      },
    ],
  };

  const jsonLdStr = JSON.stringify(jsonLdObj).replace(/</g, '\\u003c');
  const JSON_LD = `<script type="application/ld+json">\n${jsonLdStr}\n</script>`;

  html = html
    .replace(/\{\{SITE_URL\}\}/g, SITE_URL)
    .replace(/\{\{CANONICAL\}\}/g, CANONICAL)
    .replace(/\{\{ROBOTS\}\}/g, ROBOTS)
    .replace(/\{\{TITLE\}\}/g, TITLE)
    .replace(/\{\{DESCRIPTION\}\}/g, DESCRIPTION)
    .replace(/\{\{CSS_HASH\}\}/g, cssHash)
    .replace(/\{\{JS_HASH\}\}/g, jsHash)
    .replace(/\{\{JSON_LD\}\}/g, JSON_LD);

  const indexPath = path.join(ROOT, 'index.html');
  await fs.writeFile(indexPath, html);

  const htmlSize = (await fs.stat(indexPath)).size;
  const cssSize = (await fs.stat(path.join(ROOT, 'css', 'styles.css'))).size;

  console.log(`Build complete. index.html: ${htmlSize} bytes, css/styles.css: ${cssSize} bytes.`);
}

build().catch((err) => {
  console.error(err);
  process.exit(1);
});
