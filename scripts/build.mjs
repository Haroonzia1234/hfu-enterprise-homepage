import { stat, readdir, readFile, mkdir, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createHash } from 'node:crypto';

const currentDir = dirname(fileURLToPath(import.meta.url));
const rootDir = join(currentDir, '..');
const isProduction = process.argv.includes('--production');

const siteUrl = (
  process.env.SITE_URL || 'https://haroonzia1234.github.io/hfu-enterprise-homepage/'
).replace(/\/?$/, '/');
const canonicalUrl = siteUrl;
const robotsTag = isProduction
  ? '<meta name="robots" content="index, follow, max-image-preview:large">'
  : '<meta name="robots" content="noindex, nofollow">';
const pageTitle = 'HFU Enterprise Ltd | Same Day Courier and Pallet Delivery, Quoted in 15 Minutes';
const pageDescription =
  'same day courier, scheduled delivery, pallet delivery and vans from Manchester across the UK and abroad. Open 24/7. Get a quote in 15 minutes.';

async function checkFileExists(filePath) {
  try {
    await stat(filePath);
    return true;
  } catch {
    return false;
  }
}

async function readDirectoryRecursive(directoryPath) {
  const directoryEntries = await readdir(directoryPath, { withFileTypes: true });
  const filePaths = [];
  for (const entry of directoryEntries) {
    const resolvedPath = resolve(directoryPath, entry.name);
    if (entry.isDirectory()) {
      filePaths.push(...(await readDirectoryRecursive(resolvedPath)));
    } else if (entry.isFile()) {
      filePaths.push(resolvedPath);
    }
  }
  return filePaths;
}

async function buildSite() {
  let htmlContent = await readFile(join(rootDir, 'src', 'template.html'), 'utf-8');

  const partialRegex = /\{\{>\s*([a-zA-Z0-9_-]+)\s*\}\}/g;
  let regexMatch;
  while ((regexMatch = partialRegex.exec(htmlContent)) !== null) {
    const partialName = regexMatch[1];
    const partialPath = join(rootDir, 'src', 'sections', `${partialName}.html`);
    if (!(await checkFileExists(partialPath))) {
      throw new Error(`Missing partial: ${partialPath}`);
    }
    const partialContent = (await readFile(partialPath, 'utf-8')).trim();
    htmlContent = htmlContent.replace(regexMatch[0], partialContent);
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
    ].map((sectionName) => `sections/${sectionName}.css`),
  ];

  let combinedCss = '';
  for (const cssFileName of cssOrder) {
    const cssFilePath = join(rootDir, 'src', 'css', cssFileName);
    if (await checkFileExists(cssFilePath)) {
      combinedCss += (await readFile(cssFilePath, 'utf-8')) + '\n';
    } else {
      if (cssFileName.startsWith('sections/')) {
        console.warn(`Warning: Missing section CSS file: ${cssFilePath}`);
      } else {
        throw new Error(`Missing required CSS file: ${cssFilePath}`);
      }
    }
  }

  await mkdir(join(rootDir, 'css'), { recursive: true });
  await writeFile(join(rootDir, 'css', 'styles.css'), combinedCss);

  const cssHash = createHash('sha256').update(combinedCss).digest('hex').substring(0, 8);

  const javascriptDirectory = join(rootDir, 'js');
  let javascriptFiles = [];
  if (await checkFileExists(javascriptDirectory)) {
    javascriptFiles = await readDirectoryRecursive(javascriptDirectory);
    javascriptFiles.sort();
  }
  let combinedJavascript = '';
  for (const javascriptFile of javascriptFiles) {
    combinedJavascript += await readFile(javascriptFile, 'utf-8');
  }
  const jsHash = createHash('sha256').update(combinedJavascript).digest('hex').substring(0, 8);

  const companyModule = await import(pathToFileURL(join(rootDir, 'js', 'data', 'company.js')).href);
  const servicesModule = await import(
    pathToFileURL(join(rootDir, 'js', 'data', 'services.js')).href
  );
  const faqsModule = await import(pathToFileURL(join(rootDir, 'js', 'data', 'faqs.js')).href);

  const companyData = companyModule.COMPANY;
  const servicesData = servicesModule.SERVICES;
  const faqsData = faqsModule.FAQS;

  const jsonLdObject = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'LocalBusiness',
        name: companyData.legalName,
        url: siteUrl,
        telephone: companyData.phones.map((phoneItem) => phoneItem.display),
        email: companyData.email,
        address: {
          '@type': 'PostalAddress',
          streetAddress: companyData.address.street,
          addressLocality: companyData.address.city,
          postalCode: companyData.address.postcode,
          addressCountry: 'GB',
        },
        openingHoursSpecification: {
          '@type': 'OpeningHoursSpecification',
          dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
          opens: '00:00',
          closes: '23:59',
        },
        areaServed: [
          ...companyData.localAreas.map((areaName) => ({ '@type': 'Place', name: areaName })),
          { '@type': 'Country', name: 'United Kingdom' },
        ],
        description: pageDescription,
        makesOffer: servicesData.map((serviceItem) => ({
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Service',
            name: serviceItem.name,
            description: serviceItem.description,
          },
        })),
      },
      {
        '@type': 'FAQPage',
        mainEntity: faqsData.map((faqItem) => ({
          '@type': 'Question',
          name: faqItem.question,
          acceptedAnswer: {
            '@type': 'Answer',
            text: faqItem.answer,
          },
        })),
      },
    ],
  };

  const jsonLdString = JSON.stringify(jsonLdObject).replace(/</g, '\\u003c');
  const jsonLdScript = `<script type="application/ld+json">\n${jsonLdString}\n</script>`;

  htmlContent = htmlContent
    .replace(/\{\{SITE_URL\}\}/g, siteUrl)
    .replace(/\{\{CANONICAL\}\}/g, canonicalUrl)
    .replace(/\{\{ROBOTS\}\}/g, robotsTag)
    .replace(/\{\{TITLE\}\}/g, pageTitle)
    .replace(/\{\{DESCRIPTION\}\}/g, pageDescription)
    .replace(/\{\{CSS_HASH\}\}/g, cssHash)
    .replace(/\{\{JS_HASH\}\}/g, jsHash)
    .replace(/\{\{JSON_LD\}\}/g, jsonLdScript);

  const indexFilePath = join(rootDir, 'index.html');
  await writeFile(indexFilePath, htmlContent);

  const htmlSize = (await stat(indexFilePath)).size;
  const cssSize = (await stat(join(rootDir, 'css', 'styles.css'))).size;

  console.log(`Build complete. index.html: ${htmlSize} bytes, css/styles.css: ${cssSize} bytes.`);
}

buildSite().catch((buildError) => {
  console.error(buildError);
  process.exit(1);
});
