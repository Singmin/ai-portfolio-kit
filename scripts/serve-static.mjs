import { createServer } from 'node:http';
import { existsSync, readFileSync, realpathSync, statSync } from 'node:fs';
import path from 'node:path';
import { parseArgs } from 'node:util';
const { values } = parseArgs({ options: { directory: { type: 'string' }, port: { type: 'string', default: '3300' } } });
if (!values.directory) throw new Error('static preview: provide --directory');
const root = realpathSync(values.directory); const port = Number(values.port);
if (!Number.isInteger(port) || port < 1024 || port > 65535) throw new Error('static preview: invalid port');
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8', '.txt': 'text/plain; charset=utf-8', '.xml': 'application/xml', '.png': 'image/png', '.woff2': 'font/woff2', '.svg': 'image/svg+xml' };
createServer((request, response) => {
  try {
    const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
    let file = path.resolve(root, `.${pathname}`);
    if (file !== root && !file.startsWith(root + path.sep)) throw new Error('outside');
    if (existsSync(file) && statSync(file).isDirectory()) file = path.join(file, 'index.html');
    if (!existsSync(file) || !statSync(file).isFile() || !realpathSync(file).startsWith(root + path.sep)) {
      response.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' }); response.end(existsSync(path.join(root, '404.html')) ? readFileSync(path.join(root, '404.html')) : 'Not found'); return;
    }
    response.writeHead(200, { 'Content-Type': types[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-store' }); response.end(readFileSync(file));
  } catch { response.writeHead(404); response.end('Not found'); }
}).listen(port, '127.0.0.1', () => console.log(`Static preview: http://127.0.0.1:${port}`));
