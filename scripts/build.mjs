import { cp, mkdir, writeFile, readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { root, loadKnowledge } from './load.mjs';
import { validateKnowledge } from '../src/knowledge.mjs';
const kb = await loadKnowledge();
const errors = validateKnowledge(kb);
if (errors.length) throw new Error(errors.join('\n'));
await mkdir(new URL('dist/', root), { recursive: true });
await cp(new URL('web/', root), new URL('dist/', root), { recursive: true });
await cp(new URL('src/', root), new URL('dist/src/', root), { recursive: true });
await mkdir(new URL('dist/data/', root), { recursive: true });
await writeFile(new URL('dist/data/knowledge.json', root), JSON.stringify(kb));
await writeFile(new URL('dist/.nojekyll', root), '');
// Embedded code/data work from file://. Optional official portraits need a network.
const read = path => readFile(new URL(path, root), 'utf8');
const [html, css, knowledge, layout, app] = await Promise.all(['web/index.html','web/style.css','src/knowledge.mjs','src/layout.mjs','web/app.mjs'].map(read));
const data = JSON.stringify(kb).replaceAll('<', '\\u003c');
// A deployment must not combine a new shell with cached code or data.
const revision = createHash('sha256').update(html+css+knowledge+layout+app+data).digest('hex').slice(0,16);
const publishedHtml = html.replace('./style.css', `./style.css?v=${revision}`).replace('./app.mjs', `./app.mjs?v=${revision}`);
const publishedApp = app.replaceAll('./src/knowledge.mjs', `./src/knowledge.mjs?v=${revision}`).replaceAll('./src/layout.mjs', `./src/layout.mjs?v=${revision}`).replace('./data/knowledge.json', `./data/knowledge.json?v=${revision}`);
await writeFile(new URL('dist/index.html', root), publishedHtml);
await writeFile(new URL('dist/app.mjs', root), publishedApp);
const code = knowledge.replaceAll('export ', '') + '\n' + layout.replaceAll('export ', '') + '\n' + app.replace(/^import .*;\n/gm, '').replace(/  const response = await fetch[\s\S]*?  kb = await response.json\(\);/, "  kb = JSON.parse(document.querySelector('#embedded-knowledge').textContent);");
const standalone = html.replace('<link rel="stylesheet" href="./style.css">', `<style>${css}</style>`).replace('<link rel="icon" href="./favicon.svg" type="image/svg+xml">','').replace('<script type="module" src="./app.mjs"></script>','').replace('<a href="./data/knowledge.json" download="athena-knowledge.json">下载当前知识库 JSON</a>','<p>离线审阅版 · 完整数据与出处已内嵌</p>').replace('</body>', `<script id="embedded-knowledge" type="application/json">${data}</script><script type="module">${code.replaceAll('</script', '<\\/script')}</script></body>`);
await writeFile(new URL('dist/preview.html', root), standalone);
console.log(`Built dist/: ${kb.entities.length} entities / ${kb.relations.length} relations. No third-party scripts; official portraits use their recorded CDN.`);
