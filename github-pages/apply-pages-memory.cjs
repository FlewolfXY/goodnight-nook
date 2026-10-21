/* Apply only to a staged public/ directory, never the canonical Site source. */
const fs=require('node:fs');
const path=require('node:path');
const target=path.resolve(process.argv[2]||'');
if(!process.argv[2])throw new Error('Provide the staged public directory');
if(target===path.resolve(__dirname,'../public'))throw new Error('Use a separate Pages staging directory');
function replace(file,before,after){const name=path.join(target,file),source=fs.readFileSync(name,'utf8');if(!source.includes(before))throw new Error('Expected source missing: '+file);fs.writeFileSync(name,source.replace(before,after));}
fs.copyFileSync(path.join(__dirname,'nook-memory.js'),path.join(target,'nook-memory.js'));
replace('app.js',"if(status.phase==='offline')text=", "if(status.mode==='local')text=status.localSaved?'备份页 · 小纪念保存在当前浏览器。':'浏览器暂时没有存好这次变化，先别关掉页面。';\n else if(status.phase==='offline')text=");
replace('outing-scenes.js',"if(status.phase==='synced'&&!status.pending)saveNote.textContent=gift[kind][1]+'，已经收在客厅的旅行架。';", "if(status.mode==='local')saveNote.textContent=status.localSaved?gift[kind][1]+'，已收在这台浏览器的小窝里。':'小纪念物还没存好，先别关掉这一页。';\n  else if(status.phase==='synced'&&!status.pending)saveNote.textContent=gift[kind][1]+'，已经收在客厅的旅行架。';");
console.log('Applied browser-local memory and accurate save copy to '+target);
