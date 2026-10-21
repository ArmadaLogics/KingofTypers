'use strict';
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const port = Number(process.env.PORT || 8080);
const types = {'.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.png': 'image/png', '.webp': 'image/webp', '.webm': 'audio/webm', '.json': 'application/json; charset=utf-8'};
http.createServer((req, res) => {
  let target;
  try {
    let name = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    if (name.endsWith('/')) name += 'index.html';
    target = path.resolve(root, '.' + name);
    if (!target.startsWith(root + path.sep)) throw Error('Outside game folder');
  } catch {
    res.writeHead(400); res.end('Bad path'); return;
  }
  fs.stat(target, (error, stat) => {
    if (error || !stat.isFile()) {res.writeHead(404); res.end('Not found'); return;}
    res.writeHead(200, {'Content-Type': types[path.extname(target)] || 'application/octet-stream', 'Cache-Control': 'no-store'});
    fs.createReadStream(target).pipe(res);
  });
}).listen(port, '127.0.0.1', () => console.log(`KEYWARD preview: http://127.0.0.1:${port}/ (Ctrl+C to stop)`));
