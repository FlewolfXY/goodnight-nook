import { cpSync, mkdirSync, writeFileSync, readFileSync, existsSync, rmSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const output=join(root,'_site');
rmSync(output,{recursive:true,force:true});
mkdirSync(output,{recursive:true});
cpSync(join(root,'public'),output,{recursive:true});
execFileSync(process.execPath,[join(root,'github-pages/apply-pages-memory.cjs'),output],{stdio:'inherit'});
writeFileSync(join(output,'.nojekyll'),'');
// Keep this personal backup out of search-engine indexes.
writeFileSync(join(output,'robots.txt'),'User-agent: *\nDisallow: /\n');
const catalogue=JSON.parse(readFileSync(join(output,'scenes.json'),'utf8'));
const scenes=Array.isArray(catalogue)?catalogue:catalogue.scenes;
if(!Array.isArray(scenes)||!scenes.length)throw new Error('Missing scenes');
for(const scene of scenes){
 const file=join(output,scene.path);
 if(!existsSync(file))throw new Error('Missing scene: '+scene.path);
}
console.log(`Exported ${scenes.length} scenes to ${output}; browser-local saves, no server dependency.`);
