import test from 'node:test';
import assert from 'node:assert/strict';
import {loadKnowledge} from '../scripts/load.mjs';
import {validateKnowledge, filterGraph} from '../src/knowledge.mjs';
import {layoutGraph} from '../src/layout.mjs';
const kb=await loadKnowledge();
test('official portraits have source provenance and unknown images stay named placeholders',()=>{
  assert.equal(kb.entities.filter(e=>e.visual?.kind==='official-portrait').length,53);
  assert.ok(kb.entities.every(e=>e.visual));
  const k=structuredClone(kb);k.entities.find(e=>e.visual.kind==='official-portrait').visual.url='https://untrusted.example/portrait.png';
  assert.ok(validateKnowledge(k).some(e=>e.includes('untrusted image')));
});
test('missing source inventory or connection is caught',()=>{
  const k=structuredClone(kb); k.entities.find(e=>e.origins?.some(o=>o.pointer.startsWith('/nodes/'))).origins=[];
  assert.ok(validateKnowledge(k).some(e=>e.includes('coverage mismatch')));
  const c=structuredClone(kb);c.candidates.pop();assert.ok(validateKnowledge(c).some(e=>e.includes('connection coverage')));
});
test('reverse input retains both pointers without duplicating a semantic edge',()=>{
  const cs=kb.candidates.filter(c=>[c.from,c.to].includes('liao')&&[c.from,c.to].includes('echo'));
  assert.equal(cs.length,2);assert.equal(new Set(cs.map(c=>c.pointer)).size,2);
  const rs=kb.relations.filter(r=>r.from==='liao'&&r.to==='echo');assert.equal(rs.length,1);assert.equal(rs[0].candidateIds.length,2);
});
test('every hero has a reviewed Chinese term, unknown organization spelling stays separate',()=>{
  for(const e of kb.entities.filter(e=>e.origins?.some(o=>o.kind==='hero')))assert.equal(kb.glossary.find(t=>t.entityId===e.id).status,'approved');
  assert.ok(kb.entities.some(e=>e.id==='colosseo-gladiatori'));assert.ok(kb.entities.some(e=>e.id==='colloseo-gladiatori'));
});
test('layout covers isolated and connected entities without node overlap',()=>{
  for(const graph of [kb,filterGraph(kb,{focus:'ana'}),filterGraph(kb,{query:'unknown'})]) {
    const result=layoutGraph(graph.entities,graph.relations,'ana');
    assert.equal(result.positions.size,graph.entities.length);
    const coords=[...result.positions.values()];
    for(const [i,[x,y]]of coords.entries()){
      assert.ok(Number.isFinite(x)&&Number.isFinite(y));assert.ok(x>=100&&x<=result.width-100);assert.ok(y>=80&&y<=result.height-80);
      for(const [xx,yy] of coords.slice(i+1))assert.ok(Math.hypot(x-xx,y-yy)>150);
    }
    assert.deepEqual(result,layoutGraph(graph.entities,graph.relations,'ana'));
  }
});
