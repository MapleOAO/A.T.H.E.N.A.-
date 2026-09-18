import { readFile } from 'node:fs/promises';
export const root = new URL('../', import.meta.url);
export async function loadKnowledge() {
  const read = async name => JSON.parse(await readFile(new URL(`data/${name}.json`, root), 'utf8'));
  const names = ['entities', 'relations', 'sources', 'glossary', 'candidates'];
  const [metadata, ...parts] = await Promise.all(['metadata', ...names].map(read));
  return { ...metadata, ...Object.fromEntries(names.map((n, i) => [n, parts[i]])) };
}
