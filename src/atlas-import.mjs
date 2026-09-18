import { normalize } from './knowledge.mjs';

// Independent adapter. Read only factual endpoints in v5 connections; ignore
// coordinates, rendering junctions, arbitrary prose, assets and upstream code.
export function stageAtlas(data, kb, provenance) {
  if (data?.v !== 5 || !Array.isArray(data.connections)) throw new Error('Expected Atlas v5 connections array');
  if (!/^[0-9a-f]{40}$/.test(provenance.commit) || !/^[0-9a-f]{40}$/.test(provenance.blob)) throw new Error('Pinned commit and blob SHA are required');
  const names = new Map();
  for (const t of kb.glossary) {
    for (const name of [t.en, ...t.aliases]) {
      const key = normalize(name);
      if (names.has(key) && names.get(key) !== t.entityId) throw new Error(`Ambiguous term: ${name}`);
      names.set(key, t.entityId);
    }
  }
  const entityById = new Map(kb.entities.map(e => [e.id, e]));
  const expectedKind = { hero: 'person', npc: 'person', faction: 'organization' };
  const candidates = [], unresolved = [], duplicates = [], seen = new Set();
  for (const [i, c] of data.connections.entries()) {
    const from = typeof c.subjectName === 'string' ? names.get(normalize(c.subjectName)) : undefined;
    const to = typeof c.linkedName === 'string' ? names.get(normalize(c.linkedName)) : undefined;
    if (!from || !to || !expectedKind[c.subjectKind] || !expectedKind[c.linkedKind] || entityById.get(from)?.kind !== expectedKind[c.subjectKind] || entityById.get(to)?.kind !== expectedKind[c.linkedKind]) {
      unresolved.push({ pointer: `/connections/${i}`, names: [c.subjectName, c.linkedName], reason: 'Unmapped name or mismatched kind' }); continue;
    }
    if (from === to) { unresolved.push({ pointer: `/connections/${i}`, reason: 'Self relationship' }); continue; }
    const key = [from, to].sort().join('|');
    if (seen.has(key)) { duplicates.push(`/connections/${i}`); continue; }
    seen.add(key);
    candidates.push({ id: `atlas-${provenance.commit.slice(0, 8)}-${i}`, from, to, sourceId: 'atlas-codex', pointer: `/connections/${i}`, ...provenance, originalNames: [c.subjectName, c.linkedName], status: 'pending', note: 'Relation semantics require independent evidence.' });
  }
  return { candidates, unresolved, duplicates, ignored: 'nodes and edges: layout is not semantic evidence', canonicalMutations: 0 };
}
