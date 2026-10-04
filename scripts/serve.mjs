import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { dirname, join, normalize, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const currentDir = dirname(fileURLToPath(import.meta.url));
const rootDir = join(currentDir, '..');
const serverPort = process.env.PORT || 5173;

const mimeTypes = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'text/javascript',
  '.mjs': 'text/javascript',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.webmanifest': 'application/manifest+json',
  '.txt': 'text/plain',
  '.xml': 'application/xml',
};

const server = createServer(async (request, response) => {
  try {
    let urlPath = new URL(request.url, `http://${request.headers.host}`).pathname;
    if (urlPath === '/') {
      urlPath = '/index.html';
    }

    const safePath = normalize(urlPath).replace(/^(\.\.[\/\\])+/, '');
    const filePath = join(rootDir, safePath);

    if (!filePath.startsWith(rootDir)) {
      response.writeHead(403, { 'Content-Type': 'text/plain' });
      response.end('Forbidden');
      return;
    }

    let fileStat;
    try {
      fileStat = await stat(filePath);
    } catch {
      response.writeHead(404, { 'Content-Type': 'text/plain' });
      response.end('404 Not Found');
      return;
    }

    if (fileStat.isDirectory()) {
      response.writeHead(403, { 'Content-Type': 'text/plain' });
      response.end('Forbidden');
      return;
    }

    const extension = extname(filePath).toLowerCase();
    const mimeType = mimeTypes[extension] || 'application/octet-stream';
    const content = await readFile(filePath);

    response.writeHead(200, {
      'Content-Type': mimeType,
      'Cache-Control': 'no-store',
    });
    response.end(content);
  } catch (error) {
    console.error(error);
    response.writeHead(500, { 'Content-Type': 'text/plain' });
    response.end('Internal Server Error');
  }
});

server.listen(serverPort, () => {
  console.log(`Server running at http://localhost:${serverPort}/`);
});
