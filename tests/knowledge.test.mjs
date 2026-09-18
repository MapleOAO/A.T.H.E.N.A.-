import test from 'node:test';
import assert from 'node:assert/strict';
import { loadKnowledge } from '../scripts/load.mjs';
import { validateKnowledge, filterGraph, translateRelation, normalize, safeUrl } from '../src/knowledge.mjs';
import { stageAtlas } from '../src/atlas-import.mjs';
const kb = await loadKnowledge();
const clone = () => structuredClone(kb);
test('seed data passes all cross-reference checks', () => assert.deepEqual(validateKnowledge(kb), []));
test('coverage distinguishes complete inventory from pending evidence', () => {
  assert.ok(kb.entities.length>=172); assert.ok(kb.relations.filter(r=>r.status==='verified').length>=22);
  assert.equal(kb.relations.filter(r=>r.status==='pending').length,39); assert.equal(kb.candidates.length,57);
});
test('department recruitment retains Atlas lineage without implying membership or leadership', () => {
  const r=kb.relations.find(r=>r.id==='ana-recruited-for-search-rescue-early');
  assert.equal(r.status,'verified');
  assert.equal(r.predicate,'recruited-for');
  assert.deepEqual(r.candidateIds,['atlas-ana-7']);
  assert.equal(kb.candidates.find(c=>c.id==='atlas-ana-7').status,'corroborated');
  assert.ok(r.evidence.some(e=>e.sourceId==='atlas-codex' && e.locator==='/connections/7'));
  assert.equal(translateRelation(kb,r).text,'安娜 — 为其招募人员 — 搜救部门');
  assert.ok(!kb.relations.some(x=>x.from==='ana' && x.to==='search-rescue' && ['member','leader'].includes(x.predicate)));
  const d=clone(); d.relations.find(x=>x.id===r.id).to='freja';
  assert.ok(validateKnowledge(d).some(x=>x.includes('invalid predicate endpoints')));
});
test('dangling endpoints fail', () => { const d=clone();d.relations[0].from='missing';assert.ok(validateKnowledge(d).some(x=>x.includes('dangling'))); });
test('duplicate IDs fail', () => { const d=clone();d.entities.push(d.entities[0]);assert.ok(validateKnowledge(d).some(x=>x.includes('duplicate id'))); });
test('unread official sources cannot approve a fact', () => { const d=clone();d.sources.find(s=>s.id==='en-ana').read=false;assert.ok(validateKnowledge(d).some(x=>x.includes('read official evidence'))); });
test('community-only evidence cannot approve a fact', () => { const d=clone();d.relations[0].evidence[0].sourceId='atlas-codex';assert.ok(validateKnowledge(d).some(x=>x.includes('official evidence'))); });
test('wrong entity types fail', () => { const d=clone();d.relations[0].to='genji';assert.ok(validateKnowledge(d).some(x=>x.includes('predicate endpoints'))); });
test('duplicate semantic edges fail', () => { const d=clone();d.relations.push({...d.relations[0],id:'duplicate-relation'});assert.ok(validateKnowledge(d).some(x=>x.includes('duplicate relationship'))); });
test('unknown relation status and period fail', () => { const d=clone();d.relations[0].status='sure';d.relations[0].period='today';assert.ok(validateKnowledge(d).some(x=>x.includes('invalid review status')));assert.ok(validateKnowledge(d).some(x=>x.includes('invalid period'))); });
test('translation provenance requires actual term IDs', () => { const d=clone();d.relations[0].translation.termIds=['term-genji'];assert.ok(validateKnowledge(d).some(x=>x.includes('term IDs mismatch'))); });
test('candidate provenance cannot be attached to unrelated facts', () => { const d=clone();d.relations[0].candidateIds=['atlas-ana-2'];assert.ok(validateKnowledge(d).some(x=>x.includes('endpoint mismatch'))); });
test('unsafe source URLs fail', () => { const d=clone();d.sources[0].url='javascript:alert(1)';assert.ok(validateKnowledge(d).some(x=>x.includes('unsafe URL'))); });
test('identity corrections require read official evidence and a precise locator', () => {
  for (const field of ['sourceId','locator','reviewedAt']) {
    const d=clone(), entity=d.entities.find(e=>e.id==='the-sombra-collective');
    entity.researchNote[field]=field==='sourceId'?'atlas-codex':'';
    assert.ok(validateKnowledge(d).some(x=>x.includes('invalid research note evidence')));
  }
  const d=clone(), note=d.entities.find(e=>e.id==='the-sombra-collective').researchNote;
  d.sources.find(s=>s.id===note.sourceId).read=false;
  assert.ok(validateKnowledge(d).some(x=>x.includes('invalid research note evidence')));
});
test('normalization handles fullwidth punctuation and aliases', () => { assert.equal(normalize('Ｓｏｌｄｉｅｒ：７６'),normalize('Soldier 76')); const result=filterGraph(kb,{query:'士兵76'});assert.ok(result.entities.some(e=>e.id==='soldier-76')); });
test('Chinese and English search return the same incident graph', () => { assert.deepEqual(filterGraph(kb,{query:'安娜'}),filterGraph(kb,{query:'ANA'})); });
test('verified filter never returns uncertain edges', () => { const r=filterGraph(kb,{status:'verified'});assert.equal(r.relations.length,kb.relations.filter(r=>r.status==='verified').length);assert.ok(r.relations.every(x=>x.status==='verified')); });
test('period filter does not invent dates', () => { const r=filterGraph(kb,{period:'recall'});assert.ok(r.relations.length>0);assert.ok(r.relations.every(x=>x.period==='recall')); });
test('entity type filtering removes dangling graph edges', () => { const r=filterGraph(kb,{kind:'organization'});assert.ok(r.entities.every(x=>x.kind==='organization'));assert.ok(r.relations.every(x=>r.entities.some(e=>e.id===x.from)&&r.entities.some(e=>e.id===x.to))); });
test('focus is one hop and zero results stay empty', () => { assert.ok(filterGraph(kb,{focus:'ana'}).relations.every(r=>r.from==='ana'||r.to==='ana'));assert.deepEqual(filterGraph(kb,{query:'nonexistent-hero'}),{entities:[],relations:[]}); });
test('Chinese relation output resolves approved terms', () => { const r=translateRelation(kb,kb.relations.find(r=>r.id==='ana-mother'));assert.equal(r.text,'安娜 — 母亲 → 女儿 — 法老之鹰');assert.equal(r.glossaryVersion,kb.glossaryVersion); });
test('unknown Chinese terms stop automatic approval', () => { const d=clone();d.glossary.find(t=>t.entityId==='search-rescue').status='pending';const r=translateRelation(d,d.relations.find(r=>r.to==='search-rescue'));assert.equal(r.status,'pending');assert.equal(r.text,null);assert.deepEqual(r.missing,['search-rescue']); });
test('unsafe and credential-bearing URLs are rejected', () => { assert.equal(safeUrl('https://example.org'),true);for(const x of ['javascript:alert(1)','data:text/html,x','https://user:pass@example.org'])assert.equal(safeUrl(x),false); });
const provenance={commit:'a'.repeat(40),blob:'b'.repeat(40)};
const entry={subjectKind:'hero',subjectName:'Ana',linkedKind:'hero',linkedName:'Pharah'};
test('Atlas import stages names only, strips prose, ignores layout and never approves', () => {
  const r=stageAtlas({v:5,nodes:[{kind:'junction'}],edges:[{fromId:'x',toId:'y'}],connections:[{...entry,reasoningSubjectToLinked:'untrusted prose',x:9000}]},kb,provenance);
  assert.equal(r.candidates.length,1);assert.equal(r.candidates[0].status,'pending');assert.equal(r.candidates[0].from,'ana');assert.equal(r.candidates[0].reasoningSubjectToLinked,undefined);assert.equal(r.canonicalMutations,0);
});
test('Atlas reverse duplicates are de-duplicated without guessing directions', () => {const r=stageAtlas({v:5,connections:[entry,{subjectKind:'hero',subjectName:'Pharah',linkedKind:'hero',linkedName:'Ana'}]},kb,provenance);assert.equal(r.candidates.length,1);assert.equal(r.duplicates.length,1);});
test('Atlas missing names and kind mismatches are quarantined', () => { const r=stageAtlas({v:5,connections:[{...entry,linkedName:'Unknown'},{...entry,linkedKind:'faction'}]},kb,provenance);assert.equal(r.candidates.length,0);assert.equal(r.unresolved.length,2); });
test('Atlas schema drift and unpinned imports fail', () => {assert.throws(()=>stageAtlas({v:6,connections:[]},kb,provenance));assert.throws(()=>stageAtlas({v:5,connections:[]},kb,{commit:'main',blob:'x'}));});

test('official expansion preserves discovery evidence and search', () => {
  for(const id of ['kohaku-ogata','tsubaki-serizawa','yaemon-iju uin'.replace(' ',''),'seira-horvath']) {
    const e=kb.entities.find(e=>e.id===id),t=kb.glossary.find(t=>t.entityId===id);
    assert.equal(e.origins.length,0);assert.equal(t.status,'approved');
    assert.ok(filterGraph(kb,{query:t.zh}).entities.some(e=>e.id===id));
  }
  for(const field of ['sourceId','locator','reviewedAt','missing']) {
    const d=clone(),e=d.entities.find(e=>e.id==='kohaku-ogata');
    if(field==='missing')delete e.discovery;else e.discovery[field]='';
    assert.ok(validateKnowledge(d).some(x=>x.includes('discovery')));
  }
});
