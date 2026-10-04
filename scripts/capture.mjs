import { createServer } from 'node:http';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { extname, join, normalize, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer-core';

const repositoryRoot = resolve(fileURLToPath(new URL('..', import.meta.url)));
const outputDirectory = resolve(
  process.argv[2] || join(repositoryRoot, '.autopilot', 'review', 'current')
);
const chromePaths = [
  process.env.CHROME_PATH,
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
].filter(Boolean);
const chromeExecutable = chromePaths.find((candidate) => existsSync(candidate));

const contentTypes = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.woff2': 'font/woff2',
  '.webmanifest': 'application/manifest+json',
  '.txt': 'text/plain',
};

const viewports = [
  { name: 'desktop', width: 1440, height: 900, isMobile: false },
  { name: 'tablet', width: 820, height: 1180, isMobile: false },
  { name: 'mobile', width: 390, height: 844, isMobile: true },
];

const sectionSelectors = {
  header: '.site-header',
  hero: '[data-section="hero"]',
  stats: '[data-section="stats"]',
  services: '[data-section="services"]',
  fleet: '[data-section="fleet"]',
  how: '[data-section="how"]',
  business: '[data-section="business"]',
  coverage: '[data-section="coverage"]',
  why: '[data-section="why"]',
  reviews: '[data-section="reviews"]',
  quote: '[data-section="quote"]',
  faq: '[data-section="faq"]',
  footer: '.site-footer',
};

const calmStyles = `
  [data-reveal] { opacity: 1 !important; transform: none !important; transition: none !important; }
`;

const sectionPassStyles = `
  .site-header { position: static !important; }
  .sticky-cta { display: none !important; }
`;

function startStaticServer() {
  const server = createServer(async (request, response) => {
    const requestPath = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
    const relativePath = requestPath === '/' ? 'index.html' : requestPath.slice(1);
    const filePath = normalize(join(repositoryRoot, relativePath));
    if (!filePath.startsWith(repositoryRoot)) {
      response.writeHead(403);
      response.end('Forbidden');
      return;
    }
    try {
      const fileBuffer = await readFile(filePath);
      response.writeHead(200, {
        'Content-Type': contentTypes[extname(filePath)] || 'application/octet-stream',
        'Cache-Control': 'no-store',
      });
      response.end(fileBuffer);
    } catch {
      response.writeHead(404);
      response.end('Not found');
    }
  });
  return new Promise((resolveServer) => {
    server.listen(0, '127.0.0.1', () => resolveServer(server));
  });
}

async function pause(milliseconds) {
  await new Promise((resolvePause) => setTimeout(resolvePause, milliseconds));
}

async function measurePage(page) {
  return page.evaluate(() => {
    const clientWidth = document.documentElement.clientWidth;
    const offenders = Array.from(document.querySelectorAll('body *'))
      .filter((element) => {
        const rectangle = element.getBoundingClientRect();
        const style = getComputedStyle(element);
        return (
          rectangle.width > 0 &&
          rectangle.right > clientWidth + 1 &&
          style.position !== 'fixed' &&
          !element.closest('[class*="marquee"]') &&
          !element.closest('svg')
        );
      })
      .slice(0, 8)
      .map(
        (element) => element.tagName.toLowerCase() + '.' + String(element.className).slice(0, 60)
      );
    const sectionHeights = {};
    document.querySelectorAll('[data-section]').forEach((section) => {
      sectionHeights[section.dataset.section] = Math.round(section.getBoundingClientRect().height);
    });
    return {
      isReady: document.documentElement.classList.contains('is-ready'),
      overflowPx: document.documentElement.scrollWidth - clientWidth,
      offenders,
      sectionHeights,
      documentHeight: document.documentElement.scrollHeight,
    };
  });
}

async function captureSections(page, viewportName, directory) {
  await mkdir(directory, { recursive: true });
  await page.addStyleTag({ content: sectionPassStyles });
  for (const [sectionName, selector] of Object.entries(sectionSelectors)) {
    const handle = await page.$(selector);
    if (!handle) {
      continue;
    }
    try {
      await handle.screenshot({ path: join(directory, sectionName + '.png') });
    } catch {
      continue;
    }
  }
  return viewportName;
}

async function captureState(page, name, directory, selector, actions) {
  try {
    await actions();
    await pause(1400);
    const handle = await page.$(selector);
    if (handle) {
      await handle.screenshot({ path: join(directory, name + '.png') });
    }
    return null;
  } catch (error) {
    return name + ': ' + error.message;
  }
}

async function captureStates(page, viewportName, directory) {
  await mkdir(directory, { recursive: true });
  const problems = [];
  const clickIfPresent = async (selector) => {
    const handle = await page.$(selector);
    if (handle) {
      await handle.evaluate((element) => element.scrollIntoView({ block: 'center' }));
      await handle.click();
    }
  };
  problems.push(
    await captureState(page, 'hero-route', directory, '[data-section="hero"]', async () => {
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.click('#hero-from');
      await page.type('#hero-from', 'Salford');
      await page.keyboard.press('ArrowDown');
      await page.keyboard.press('Enter');
      await page.click('#hero-to');
      await page.type('#hero-to', 'Lond');
      await page.keyboard.press('ArrowDown');
      await page.keyboard.press('Enter');
    })
  );
  problems.push(
    await captureState(page, 'fleet-small-van', directory, '[data-section="fleet"]', () =>
      clickIfPresent('#fleet-tab-sv')
    )
  );
  problems.push(
    await captureState(page, 'fleet-26-tonne', directory, '[data-section="fleet"]', () =>
      clickIfPresent('#fleet-tab-t26')
    )
  );
  problems.push(
    await captureState(page, 'services-international', directory, '[data-section="services"]', () =>
      clickIfPresent('#services-tab-international')
    )
  );
  problems.push(
    await captureState(
      page,
      'coverage-uk-wide',
      directory,
      '[data-section="coverage"]',
      async () => {
        const tabs = await page.$$('[data-js="coverage-tab"]');
        if (tabs[1]) {
          await tabs[1].evaluate((element) => element.scrollIntoView({ block: 'center' }));
          await tabs[1].click();
        }
      }
    )
  );
  if (viewportName === 'mobile') {
    problems.push(
      await captureState(page, 'mobile-menu', directory, 'body', async () => {
        await page.evaluate(() => window.scrollTo(0, 0));
        await clickIfPresent('[data-js="menu-toggle"]');
      })
    );
  }
  return problems.filter(Boolean);
}

async function run() {
  if (!chromeExecutable) {
    console.error('Chrome not found. Set CHROME_PATH.');
    process.exit(2);
  }
  await mkdir(outputDirectory, { recursive: true });
  const server = await startStaticServer();
  const baseUrl = 'http://127.0.0.1:' + server.address().port + '/';
  const browser = await puppeteer.launch({
    executablePath: chromeExecutable,
    headless: true,
    args: ['--no-sandbox', '--hide-scrollbars', '--force-color-profile=srgb'],
  });
  const report = { baseUrl, capturedAt: new Date().toISOString(), viewports: {} };
  try {
    for (const viewport of viewports) {
      const page = await browser.newPage();
      await page.setViewport({
        width: viewport.width,
        height: viewport.height,
        isMobile: viewport.isMobile,
        hasTouch: viewport.isMobile,
        deviceScaleFactor: 1,
      });
      const consoleErrors = [];
      const pageErrors = [];
      const failedRequests = [];
      page.on('console', (message) => {
        if (message.type() === 'error') {
          consoleErrors.push(message.text());
        }
      });
      page.on('pageerror', (error) => pageErrors.push(String(error.message || error)));
      page.on('requestfailed', (request) => failedRequests.push(request.url()));
      page.on('response', (response) => {
        if (response.status() >= 400) {
          failedRequests.push(response.status() + ' ' + response.url());
        }
      });
      await page.goto(baseUrl, { waitUntil: 'networkidle0', timeout: 30000 });
      await page.evaluate(() => document.fonts.ready);
      await page.addStyleTag({ content: calmStyles });
      await page.evaluate(() => {
        document.querySelectorAll('[data-reveal]').forEach((element) => {
          element.classList.add('is-revealed');
        });
      });
      await pause(1200);
      const viewportDirectory = join(outputDirectory, viewport.name);
      await mkdir(viewportDirectory, { recursive: true });
      const measurements = await measurePage(page);
      await page.screenshot({ path: join(viewportDirectory, 'full-page.png'), fullPage: true });
      await captureSections(page, viewport.name, viewportDirectory);
      const stateProblems = await captureStates(
        page,
        viewport.name,
        join(viewportDirectory, 'states')
      );
      report.viewports[viewport.name] = {
        ...measurements,
        consoleErrors,
        pageErrors,
        failedRequests,
        stateProblems,
      };
      await page.close();
    }
  } finally {
    await browser.close();
    server.close();
  }
  await writeFile(join(outputDirectory, 'report.json'), JSON.stringify(report, null, 2));
  const summary = Object.entries(report.viewports).map(
    ([name, data]) =>
      name +
      ': ready=' +
      data.isReady +
      ' overflow=' +
      data.overflowPx +
      'px pageErrors=' +
      data.pageErrors.length +
      ' consoleErrors=' +
      data.consoleErrors.length +
      ' failed=' +
      data.failedRequests.length
  );
  console.log(summary.join('\n'));
}

run().catch((error) => {
  console.error('capture failed', error);
  process.exit(1);
});
