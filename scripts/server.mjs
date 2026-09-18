import { createServer } from 'node:http';
import { readFile, realpath } from 'node:fs/promises';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { resolve, sep, extname } from 'node:path';
import { root, loadKnowledge } from './load.mjs';
import { validateKnowledge } from '../src/knowledge.mjs';

const rootPath = fileURLToPath(root);
const mime = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.svg': 'image/svg+xml', '.jpg': 'image/jpeg' };
export function makeServer(kb) {
  const errors = validateKnowledge(kb);
  if (errors.length) throw new Error(errors.join('\n'));
  return createServer(async (req, res) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('Referrer-Policy', 'no-referrer');
    res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data: https://ld5.res.netease.com https://bnetcmsus-a.akamaihd.net; connect-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'");
    const send = (code, body, type = 'application/json; charset=utf-8') => { res.writeHead(code, { 'Content-Type': type }); res.end(req.method === 'HEAD' ? undefined : body); };
    if (!['GET', 'HEAD'].includes(req.method)) { res.setHeader('Allow', 'GET, HEAD'); return send(405, JSON.stringify({ error: 'Read-only API' })); }
    try {
      const path = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
      if (path === '/api/health') return send(200, JSON.stringify({ status: 'ok', version: kb.version }));
      if (path === '/data/knowledge.json' || path === '/api/graph') return send(200, JSON.stringify(kb));
      if (path.startsWith('/api/entities/')) {
        const id = path.slice('/api/entities/'.length), entity = kb.entities.find(e => e.id === id);
        return send(entity ? 200 : 404, JSON.stringify(entity ? { entity, relations: kb.relations.filter(r => r.from === id || r.to === id) } : { error: 'Entity not found' }));
      }
      if (path.includes('\\') || path.split('/').some(p => p.startsWith('.')) || path.includes('\0')) return send(404, '{}');
      const base = resolve(rootPath, path.startsWith('/src/') ? 'src' : 'web');
      const relative = path.startsWith('/src/') ? path.slice(5) : path === '/' ? 'index.html' : path.slice(1);
      const file = await realpath(resolve(base, relative));
      if (!file.startsWith(base + sep) || !mime[extname(file)]) return send(404, '{}');
      return send(200, await readFile(file), mime[extname(file)]);
    } catch { return send(404, JSON.stringify({ error: 'Not found' })); }
  });
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const server = makeServer(await loadKnowledge());
  const port = Number(process.env.PORT || 3000);
  server.listen(port, '127.0.0.1', () => console.log(`A.T.H.E.N.A. http://127.0.0.1:${port}`));
}
