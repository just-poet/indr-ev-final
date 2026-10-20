const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const root = path.resolve(__dirname, '..');
const types = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.json': 'application/json' };
http.createServer((request, response) => {
    const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
    const file = path.resolve(root, '.' + (pathname === '/' ? '/index.html' : pathname));
    if (!file.startsWith(root + path.sep) || pathname.split('/').some(part => part.startsWith('.'))) {
        response.writeHead(403).end();
        return;
    }
    try {
        // Read original binary assets from Git to avoid OneDrive hydration delays.
        const content = /^\/assets\/[^/]+$/.test(pathname)
            ? execFileSync('git', ['show', 'HEAD:' + pathname.slice(1)], { cwd: root, maxBuffer: 10000000 })
            : fs.readFileSync(file);
        response.writeHead(200, { 'Content-Type': types[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
        response.end(content);
    } catch {
        response.writeHead(404).end('Not found');
    }
}).listen(4173, '127.0.0.1', () => console.log('Preview: http://localhost:4173'));
