import test from 'node:test';
import assert from 'node:assert/strict';
import { loadKnowledge } from '../scripts/load.mjs';
import { loadExcerptAssets } from '../scripts/assets.mjs';
import { validateKnowledge } from '../src/knowledge.mjs';
const kb = await loadKnowledge();
test('comic excerpts require a matching document, hash and bounded local path', () => {
  for (const change of [v => { v.url='./assets/portraits/../../package.json'; }, v => { v.extraction.sourceSha256='0'.repeat(64); }, v => { v.extraction.page=0; }, v => { v.extraction.region=[0,0,99999,99999]; }]) {
    const d=structuredClone(kb);change(d.entities.find(e=>e.visual.kind==='official-excerpt').visual);
    assert.ok(validateKnowledge(d).some(e=>/excerpt|image URL/.test(e)));
  }
});
test('shipped excerpts match provenance and can be embedded without network access', async () => {
  const images=await loadExcerptAssets(kb);
  assert.equal(Object.keys(images).length,kb.entities.filter(e=>e.visual.kind==='official-excerpt').length);
  assert.ok(Object.values(images).every(x=>x.startsWith('data:image/jpeg;base64,/9j/')));
  const d=structuredClone(kb);d.entities.find(e=>e.visual.kind==='official-excerpt').visual.extraction.sha256='0'.repeat(64);
  await assert.rejects(loadExcerptAssets(d),/checksum mismatch/);
});
