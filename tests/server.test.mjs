import test from 'node:test';
import assert from 'node:assert/strict';
import { makeServer } from '../scripts/server.mjs';
import { loadKnowledge } from '../scripts/load.mjs';
const kb = await loadKnowledge();
test('read-only HTTP boundary serves app and data without leaking repository files', async t => {
  const server=makeServer(kb);await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  t.after(()=>new Promise(resolve=>{server.closeAllConnections();server.close(resolve);}));
  const base=`http://127.0.0.1:${server.address().port}`;
  await t.test('health and client data shape',async()=>{assert.equal((await (await fetch(base+'/api/health')).json()).status,'ok');assert.deepEqual(await (await fetch(base+'/data/knowledge.json')).json(),kb);});
  await t.test('HTML, JS and CSS content types and CSP',async()=>{for(const [path,type] of [['/','text/html'],['/app.mjs','text/javascript'],['/src/knowledge.mjs','text/javascript'],['/style.css','text/css']]){const r=await fetch(base+path);assert.equal(r.status,200);assert.ok(r.headers.get('content-type').startsWith(type));assert.ok(r.headers.get('content-security-policy').includes("script-src 'self'"));}});
  await t.test('entity endpoint returns correct incident relationships',async()=>{const r=await(await fetch(base+'/api/entities/ana')).json();assert.equal(r.entity.id,'ana');assert.equal(r.relations.length,8);assert.equal((await fetch(base+'/api/entities/missing')).status,404);});
  await t.test('POST is forbidden',async()=>{assert.equal((await fetch(base+'/api/graph',{method:'POST'})).status,405);});
  await t.test('private paths, encoded traversal, and scripts are not served',async()=>{for(const path of ['/.git/config','/.env','/scripts/server.mjs','/package.json','/src/%2e%2e%2fpackage.json','/%2e%2e%2f.git/config'])assert.equal((await fetch(base+path)).status,404,path);});
  await t.test('HEAD sends no body',async()=>{const r=await fetch(base+'/',{method:'HEAD'});assert.equal(r.status,200);assert.equal(await r.text(),'');});
});
