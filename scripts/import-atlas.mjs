import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { loadKnowledge } from './load.mjs';
import { stageAtlas } from '../src/atlas-import.mjs';
const [input, commit, expectedBlob] = process.argv.slice(2);
if (!input || !commit || !expectedBlob) {
  console.error('Usage: npm run import:atlas -- <local-codex-v5.json> <commit-sha> <blob-sha>');
  process.exitCode = 1;
} else {
  const raw = await readFile(input);
  if (raw.length > 10 * 1024 * 1024) throw new Error('Input exceeds 10 MiB');
  const blob = createHash('sha1').update(`blob ${raw.length}\0`).update(raw).digest('hex');
  if (blob !== expectedBlob) throw new Error('Input bytes do not match the supplied Git blob SHA');
  console.log(JSON.stringify(stageAtlas(JSON.parse(raw), await loadKnowledge(), { commit, blob }), null, 2));
}
