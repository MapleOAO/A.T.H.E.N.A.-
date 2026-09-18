import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { root } from './load.mjs';

// Only reviewed, content-addressed JPEG excerpts can be shipped locally.
export async function loadExcerptAssets(kb) {
  const images = {};
  for (const entity of kb.entities.filter(e => e.visual?.kind === 'official-excerpt')) {
    const v = entity.visual;
    if (!/^\.\/assets\/portraits\/[a-z0-9-]+-[a-f0-9]{12}\.jpg$/.test(v.url)) throw new Error(`${entity.id}: unsafe excerpt path`);
    const bytes = await readFile(new URL(`web/${v.url.slice(2)}`, root));
    if (bytes[0] !== 0xff || bytes[1] !== 0xd8 || createHash('sha256').update(bytes).digest('hex') !== v.extraction.sha256) throw new Error(`${entity.id}: excerpt checksum mismatch`);
    images[v.url] = `data:image/jpeg;base64,${bytes.toString('base64')}`;
  }
  return images;
}
