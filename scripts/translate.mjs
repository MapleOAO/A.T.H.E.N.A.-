import { loadKnowledge } from './load.mjs';
import { translateRelation } from '../src/knowledge.mjs';
const kb = await loadKnowledge();
const id = process.argv[2];
const rows = id ? kb.relations.filter(r => r.id === id) : kb.relations;
if (!rows.length) throw new Error('Unknown relationship');
console.log(JSON.stringify(rows.map(r => ({ id: r.id, ...translateRelation(kb, r) })), null, 2));
