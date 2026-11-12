import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import { createServer } from 'node:http';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../public/', import.meta.url));
const port = Number.parseInt(process.env.PREVIEW_PORT ?? '4173', 10);
const mimeTypes = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.svg': 'image/svg+xml',
};

createServer(async (request, response) => {
  const urlPath = decodeURIComponent(new URL(request.url, `http://${request.headers.host}`).pathname);
  const requestedPath = urlPath === '/' ? 'index.html' : urlPath.slice(1);
  const filePath = normalize(join(root, requestedPath));

  if (!filePath.startsWith(root)) {
    response.writeHead(403).end('Forbidden');
    return;
  }

  try {
    const info = await stat(filePath);
    if (!info.isFile()) throw new Error('Not a file');
    response.writeHead(200, { 'Content-Type': mimeTypes[extname(filePath)] ?? 'application/octet-stream' });
    createReadStream(filePath).pipe(response);
  } catch {
    response.writeHead(404).end('Not found');
  }
}).listen(port, '127.0.0.1', () => {
  console.log(`Preview: http://127.0.0.1:${port}`);
});
