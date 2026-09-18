export const statuses = { verified: '已核验', pending: '待核验', disputed: '有争议' };
export const periods = { all: '全部时期', early: '早期守望先锋', recall: '召回时期', family: '亲属与成长', unspecified: '时期未明' };
export const predicates = {
  protected: { label: '保护', from: ['person'], to: ['person'] },
  'cared-for': { label: '照料', from: ['person'], to: ['person'] },
  fought: { label: '曾交战', from: ['person','organization'], to: ['person','organization'], symmetric: true },
  'attempted-capture': { label: '试图劫走', from: ['person','organization'], to: ['person'] },
  guarded: { label: '看守 / 收容', from: ['person','organization'], to: ['person'] },
  gifted: { label: '赠予装备', from: ['person'], to: ['person'] },
  father: { label: '父亲 → 女儿', from: ['person'], to: ['person'] },
  godparent: { label: '教父', from: ['person'], to: ['person'] },
  squire: { label: '侍从 → 骑士', from: ['person'], to: ['person'] },
  created: { label: '创造 / 开发', from: ['person'], to: ['person'] },
  freed: { label: '帮助脱困', from: ['person'], to: ['person'] },
  founder: { label: '创始成员', from: ['person'], to: ['organization'] },
  member: { label: '曾隶属', from: ['person'], to: ['organization'] },
  leader: { label: '曾领导', from: ['person'], to: ['organization'] },
  branch: { label: '秘密行动部门', from: ['organization'], to: ['organization'] },
  mother: { label: '母亲 → 女儿', from: ['person'], to: ['person'] },
  brother: { label: '兄长 → 弟弟', from: ['person'], to: ['person'] },
  mentor: { label: '导师 → 学生', from: ['person'], to: ['person'] },
  rescued: { label: '救治', from: ['person', 'organization'], to: ['person'] },
  colleague: { label: '合作', from: ['person'], to: ['person'] },
  contacted: { label: '联络', from: ['person'], to: ['person'] },
  friend: { label: '朋友', from: ['person'], to: ['person'], symmetric: true },
  answered: { label: '响应召唤', from: ['person'], to: ['person'] },
  related: { label: '关联待判定', from: ['person', 'organization'], to: ['person', 'organization'], symmetric: true }
};

export function normalize(text) {
  return String(text).normalize('NFKC').toLocaleLowerCase().replace(/[\s:：._-]/g, '');
}

export function termFor(kb, id) { return kb.glossary.find(t => t.entityId === id); }
export function labelFor(kb, id) {
  const term = termFor(kb, id);
  return term?.zh || kb.entities.find(e => e.id === id)?.name || id;
}

// Explicit entity IDs avoid homonym/replacement errors in translation.
export function translateRelation(kb, relation) {
  const a = termFor(kb, relation.from), b = termFor(kb, relation.to);
  if (!a || !b || a.status !== 'approved' || b.status !== 'approved') {
    return { status: 'pending', text: null, missing: [relation.from, relation.to].filter(id => termFor(kb, id)?.status !== 'approved') };
  }
  const pred = predicates[relation.predicate];
  if (!pred) throw new Error(`Unknown predicate: ${relation.predicate}`);
  return { status: 'approved', text: `${a.zh} — ${pred.label} — ${b.zh}`, termIds: [a.id, b.id], glossaryVersion: kb.glossaryVersion };
}

export function filterGraph(kb, { query = '', kind = 'all', status = 'all', period = 'all', predicate = 'all', focus = null } = {}) {
  const q = normalize(query);
  const hits = new Set(kb.entities.filter(e => [e.name, labelFor(kb, e.id), ...(termFor(kb, e.id)?.aliases || [])].some(s => normalize(s).includes(q))).map(e => e.id));
  let relations = kb.relations.filter(r => (status === 'all' || r.status === status) && (period === 'all' || r.period === period) && (predicate === 'all' || r.predicate === predicate));
  const eligible = new Set(kb.entities.filter(e => kind === 'all' || e.kind === kind).map(e => e.id));
  relations = relations.filter(r => eligible.has(r.from) && eligible.has(r.to));
  if (q) relations = relations.filter(r => hits.has(r.from) || hits.has(r.to));
  if (focus) relations = relations.filter(r => r.from === focus || r.to === focus);
  const connected = new Set(relations.flatMap(r => [r.from, r.to]));
  const entities = kb.entities.filter(e => eligible.has(e.id) && (connected.has(e.id) || ((!q || hits.has(e.id)) && (!focus || e.id === focus) && status === 'all' && period === 'all' && predicate === 'all')));
  return { entities, relations };
}

export function safeUrl(url) {
  try { const u = new URL(url); return u.protocol === 'https:' && !u.username && !u.password; } catch { return false; }
}

export function validateKnowledge(kb) {
  const errors = [];
  const fail = (condition, message) => { if (!condition) errors.push(message); };
  for (const name of ['entities', 'relations', 'sources', 'glossary', 'candidates']) {
    if (!Array.isArray(kb[name])) return [`${name} must be an array`];
    const ids = kb[name].map(x => x.id);
    fail(ids.every(x => typeof x === 'string' && /^[a-z0-9][a-z0-9-]*$/.test(x)), `${name}: invalid id`);
    fail(new Set(ids).size === ids.length, `${name}: duplicate id`);
  }
  fail(kb.schemaVersion === 1, 'Unsupported schemaVersion');
  fail(typeof kb.glossaryVersion === 'string' && kb.glossaryVersion.length > 0, 'Missing glossary version');
  const entities = new Map(kb.entities.map(x => [x.id, x]));
  const sources = new Map(kb.sources.map(x => [x.id, x]));
  const candidates = new Map(kb.candidates.map(x => [x.id, x]));
  const date = value => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value));
  for (const s of kb.sources) {
    fail(safeUrl(s.url), `${s.id}: unsafe URL`);
    fail(['official', 'community'].includes(s.kind), `${s.id}: invalid source kind`);
    fail(date(s.accessedAt), `${s.id}: missing access date`);
    fail(s.title && s.locator && s.accessMethod, `${s.id}: missing source metadata`);
  }
  for (const e of kb.entities) {
    fail(['person', 'organization'].includes(e.kind), `${e.id}: invalid entity kind`);
    fail(typeof e.name === 'string' && e.name.length > 0, `${e.id}: missing name`);
    if (e.visual) {
      fail(['official-portrait','name-icon'].includes(e.visual.kind), `${e.id}: invalid visual kind`);
      if(e.visual.kind==='official-portrait') {
        fail(safeUrl(e.visual.url) && new URL(e.visual.url).hostname === 'ld5.res.netease.com', `${e.id}: untrusted image URL`);
        fail(sources.get(e.visual.sourceId)?.kind==='official' && sources.get(e.visual.sourceId)?.read===true && safeUrl(e.visual.sourcePage) && date(e.visual.checkedAt) && Boolean(e.visual.rights), `${e.id}: missing image provenance`);
      }
    }
    for (const origin of e.origins || []) {
      fail(sources.has(origin.sourceId) && /^\/(nodes|connections)\/\d+(\/(subjectName|linkedName))?$/.test(origin.pointer || '') && origin.commit === kb.atlasVersion?.commit && origin.blob === kb.atlasVersion?.blob && Boolean(origin.originalName), `${e.id}: invalid entity provenance`);
    }
    fail(kb.glossary.filter(t => t.entityId === e.id).length === 1, `${e.id}: needs exactly one glossary record`);
  }
  for (const t of kb.glossary) {
    fail(entities.has(t.entityId), `${t.id}: unknown entity`);
    fail(['approved', 'pending'].includes(t.status), `${t.id}: invalid translation status`);
    fail(typeof t.zh === 'string' && t.zh.length > 0 && Array.isArray(t.aliases), `${t.id}: malformed term`);
    if (t.status === 'approved') {
      fail(t.sourceIds?.length > 0 && t.sourceIds.every(id => sources.get(id)?.kind === 'official' && sources.get(id)?.read === true), `${t.id}: approved term requires read official source`);
      fail(Boolean(t.locator) && date(t.reviewedAt), `${t.id}: missing term review`);
    }
  }
  for (const c of kb.candidates) {
    fail(entities.has(c.from) && entities.has(c.to), `${c.id}: dangling candidate`);
    fail(sources.get(c.sourceId)?.kind === 'community', `${c.id}: missing community source`);
    fail(Boolean(c.pointer) && /^[0-9a-f]{40}$/.test(c.commit || '') && /^[0-9a-f]{40}$/.test(c.blob || ''), `${c.id}: missing Atlas provenance`);
    fail(['pending', 'corroborated'].includes(c.status), `${c.id}: invalid candidate status`);
    if (c.status === 'corroborated') fail(kb.relations.some(r => r.status === 'verified' && r.candidateIds?.includes(c.id) && new Set([r.from, r.to]).has(c.from) && new Set([r.from, r.to]).has(c.to)), `${c.id}: no corroborating relation`);
  }
  const seen = new Set();
  for (const r of kb.relations) {
    const a = entities.get(r.from), b = entities.get(r.to), p = predicates[r.predicate];
    fail(a && b, `${r.id}: dangling entity`);
    fail(r.from !== r.to, `${r.id}: self relationship`);
    fail(p && p.from.includes(a?.kind) && p.to.includes(b?.kind), `${r.id}: invalid predicate endpoints`);
    fail(Object.hasOwn(statuses, r.status), `${r.id}: invalid review status`);
    fail(Object.hasOwn(periods, r.period) && r.period !== 'all', `${r.id}: invalid period`);
    fail(typeof r.summaryZh === 'string' && r.summaryZh.length > 0, `${r.id}: missing independent Chinese summary`);
    fail(r.candidateIds?.every(id => candidates.has(id)), `${r.id}: unknown candidate`);
    for (const id of r.candidateIds || []) {
      const c = candidates.get(id);
      fail(c && [r.from, r.to].includes(c.from) && [r.from, r.to].includes(c.to), `${r.id}: candidate endpoint mismatch`);
    }
    const pair = p?.symmetric ? [r.from, r.to].sort() : [r.from, r.to];
    const key = [pair.join('|'), r.predicate, r.period].join('|');
    fail(!seen.has(key), `${r.id}: duplicate relationship`); seen.add(key);
    fail(Array.isArray(r.evidence), `${r.id}: missing evidence array`);
    for (const ev of r.evidence || []) fail(sources.has(ev.sourceId) && ev.locator && ev.noteZh, `${r.id}: invalid evidence`);
    if (r.status === 'verified') {
      fail(r.predicate !== 'related', `${r.id}: unspecified relation cannot be verified`);
      fail(r.evidence?.some(ev => sources.get(ev.sourceId)?.kind === 'official' && sources.get(ev.sourceId)?.read === true), `${r.id}: verified relation requires read official evidence`);
      fail(r.review?.reviewer && date(r.review?.date), `${r.id}: missing review`);
      fail(translateRelation(kb, r).status === 'approved', `${r.id}: unresolved translation`);
      fail(r.translation?.glossaryVersion === kb.glossaryVersion && r.translation?.method === 'knowledge-base-guided-summary', `${r.id}: missing translation provenance`);
      fail(JSON.stringify(r.translation?.termIds) === JSON.stringify([termFor(kb, r.from)?.id, termFor(kb, r.to)?.id]), `${r.id}: translation term IDs mismatch`);
    }
  }
  if (kb.atlasVersion?.entityNodes) {
    const origins = kb.entities.flatMap(e => e.origins || []).filter(o => /^\/nodes\/\d+$/.test(o.pointer));
    fail(new Set(origins.map(o => o.pointer)).size === kb.atlasVersion.entityNodes, 'Atlas entity inventory coverage mismatch');
    for (const [kind, key] of [['hero','heroNodes'],['npc','npcNodes'],['faction','organizationNodes']]) fail(origins.filter(o=>o.kind===kind).length === kb.atlasVersion[key], `Atlas ${kind} coverage mismatch`);
    const pointers = new Set(kb.candidates.map(c=>c.pointer));
    fail(pointers.size === kb.atlasVersion.connections && kb.candidates.length === kb.atlasVersion.importedCandidates, 'Atlas connection coverage mismatch');
    for(let i=0;i<kb.atlasVersion.connections;i++) fail(pointers.has(`/connections/${i}`), `Atlas connection ${i} missing`);
    for(const c of kb.candidates) fail(kb.relations.some(r=>r.candidateIds.includes(c.id)), `${c.id}: candidate not represented in graph`);
  }
  return errors;
}
