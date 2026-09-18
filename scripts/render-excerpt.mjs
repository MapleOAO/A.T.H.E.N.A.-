import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { readFile, mkdir, mkdtemp, copyFile, rm } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { loadKnowledge, root } from './load.mjs';
import { validateKnowledge } from '../src/knowledge.mjs';

const [id, input] = process.argv.slice(2);
if (!id || !input) throw new Error('Usage: node scripts/render-excerpt.mjs <entity-id> <official-source.pdf>');
const kb=await loadKnowledge(), errors=validateKnowledge(kb);
if(errors.length) throw new Error(errors.join('\n'));
const v=kb.entities.find(e=>e.id===id)?.visual;
if(v?.kind!=='official-excerpt') throw new Error('Entity has no reviewed PDF excerpt');
const digest=b=>createHash('sha256').update(b).digest('hex');
if(digest(await readFile(input))!==v.extraction.sourceSha256) throw new Error('Source PDF does not match reviewed document');
const dir=await mkdtemp(join(tmpdir(),'athena-excerpt-'));
try {
  const x=v.extraction, [left,top,width,height]=x.region, output=join(dir,'excerpt');
  await promisify(execFile)('pdftoppm',['-f',String(x.page),'-l',String(x.page),'-singlefile','-scale-to',String(x.scaleTo),'-x',String(left),'-y',String(top),'-W',String(width),'-H',String(height),'-jpeg','-jpegopt','quality=90',input,output]);
  if(digest(await readFile(output+'.jpg'))!==x.sha256) throw new Error('Renderer output differs from reviewed image; inspect before changing provenance');
  const target=new URL('web/'+v.url.slice(2),root);
  await mkdir(new URL('./',target),{recursive:true});
  await copyFile(output+'.jpg',target);
  console.log(`Restored reviewed excerpt for ${id}`);
} finally { await rm(dir,{recursive:true,force:true}); }
