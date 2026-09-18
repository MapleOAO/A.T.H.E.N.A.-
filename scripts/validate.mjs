import { loadKnowledge } from './load.mjs';
import { validateKnowledge } from '../src/knowledge.mjs';
const kb = await loadKnowledge();
const errors = validateKnowledge(kb);
if (errors.length) { console.error(errors.join('\n')); process.exitCode = 1; }
else console.log(`OK: ${kb.entities.length} entities, ${kb.relations.length} relations, ${kb.sources.length} sources; ${kb.relations.filter(r => r.status === 'pending').length} pending.`);
