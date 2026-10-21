const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const assert=require('node:assert/strict');
const test=require('node:test');
const rootPath=path.join(__dirname,'..');
const engine=fs.readFileSync(path.join(rootPath,'public/outing-scenes.js'),'utf8');
const dialogue=()=>fs.readFileSync(path.join(rootPath,'public/outing-touch-lines.js'),'utf8');
const characters=['gpt','pet','newton','astra'];
const scenes={post:'moon-mushroom-post-office',bath:'moss-moon-bathhouse',lost:'moonlit-lost-and-found',curio:'starlit-curio-attic',bindery:'moon-bookbindery',dessert:'moon-pudding-parlor',pine:'pine-bough-treehouse',cinema:'cloud-cinema-night',ink:'moon-ink-studio',greenhouse:'rain-glass-garden',train:'undersea-quilt-train',comet:'comet-picnic-night'};
function page(kind,withBank=true){
 let serial=0,now=0;const timers=new Map(),frames=new Map(),calls=[],nodes=new Map();
 const target=(obj={})=>{const events={};return Object.assign(obj,{addEventListener(k,f){(events[k]??=[]).push(f)},emit(k,e={}){for(const f of events[k]||[])f(e)}})};
 const node=()=>target({style:{},dataset:{},textContent:'',setAttribute(k,v){this[k]=v},appendChild(){}});
 const ctx={fillRect(){},setTransform(){},getImageData(){return{data:[24,24,24,255]}}};
 const canvas=target({getContext:()=>ctx,getBoundingClientRect:()=>({width:680,height:460,left:0,top:0})});
 const actions={post:['stamp','spool','scale','envelope','inkwell','parcel','hint','reset','post'],bath:['towel','stone','ladle','soap','fern','lantern','hint','reset','float'],lost:['umbrella','clock','suitcase','bottle','plant','bell','hint','reset','claim'],curio:['frame','teapot','books','drawer','moon','ribbon','hint','reset'],bindery:['bind','forest','plum','turn'],dessert:['pudding','berry','stardust'],pine:['lantern','breeze'],cinema:['whale','seed','popcorn'],ink:['mix','write','stamp'],greenhouse:['bloom','heart'],train:['ride','wave'],comet:['cocoa','catch']}[kind];
 const buttons=[...characters,'sleep','cuddle',...actions].map(a=>Object.assign(node(),{dataset:{action:a}}));
 const named=s=>{if(!nodes.has(s))nodes.set(s,node());return nodes.get(s)};
 const root=node();root.dataset.outing=kind;root.querySelector=s=>s==='canvas'?canvas:s.includes('data-action=')?buttons.find(b=>b.dataset.action===s.match(/data-action="([^"]+)/)[1]):named(s);root.querySelectorAll=()=>buttons;
 const document=target({hidden:false,querySelector:()=>root,createElement:t=>t==='canvas'?{getContext:()=>ctx}:node()});
 const window=target({devicePixelRatio:1,matchMedia:()=>target({matches:false}),NookMemory:{ready:Promise.resolve(),get:()=>({souvenirs:[]}),status:()=>({phase:'synced',pending:0}),subscribe:()=>()=>{},act:async(op,payload)=>{calls.push({op,...payload});return{souvenirs:[]}}}});
 const context={window,document,console,getComputedStyle:()=>({color:'#fff'}),ResizeObserver:class{observe(){}},performance:{now:()=>now},requestAnimationFrame:fn=>{const id=++serial;frames.set(id,fn);return id},cancelAnimationFrame:id=>frames.delete(id),setTimeout:(fn,delay)=>{const id=++serial;timers.set(id,{fn,at:now+delay});return id},clearTimeout:id=>timers.delete(id)};
 vm.createContext(context);if(withBank)vm.runInContext(dialogue(),context);vm.runInContext(engine,context);
 return {root,canvas,calls,bank:window.NookTouchLines,caption:()=>named('.outing-caption').textContent,click(a){buttons.find(b=>b.dataset.action===a).emit('click')},advance(ms){const end=now+ms;while(true){const next=[...timers.entries()].filter(([,v])=>v.at<=end).sort((a,b)=>a[1].at-b[1].at)[0];if(!next)break;const[id,v]=next;timers.delete(id);now=v.at;v.fn()}now=end},get timers(){return timers.size}};
}
for(const [kind,id]of Object.entries(scenes)){
 test(`${kind}: varied, independent awake and asleep decks, including cycle boundaries`,()=>{
  const p=page(kind);
  for(const who of characters){
   const expected=[...p.bank.scenes[kind][who],...p.bank.awake[who]];
   assert.equal(expected.length,8);assert.equal(new Set(expected).size,8);
   let last;
   for(let cycle=0;cycle<3;cycle++){
    const seen=new Set();
    for(let i=0;i<8;i++){p.click(who);const line=p.caption();assert(expected.includes(line));assert.notEqual(line,last);seen.add(line);last=line;}
    assert.equal(seen.size,8);
   }
  }
  p.click('sleep');assert.equal(p.root.dataset.sleeping,'true');
  for(const who of characters){
   const expected=p.bank.asleep[who];assert.equal(expected.length,4);assert.equal(new Set(expected).size,4);
   let last;
   for(let cycle=0;cycle<3;cycle++){
    const seen=new Set();
    for(let i=0;i<4;i++){p.click(who);const line=p.caption();assert(expected.includes(line));assert.notEqual(line,last);seen.add(line);last=line;assert.equal(p.root.dataset.sleeping,'true');}
    assert.equal(seen.size,4);
   }
  }
  assert.equal(p.calls.length,0);
 });
 test(`${kind}: dialogue loads before engine and standalone/source copies match`,()=>{
  const html=fs.readFileSync(path.join(rootPath,'public/scenes',id+'.html'),'utf8');
  const fragment=fs.readFileSync(path.join(rootPath,'source-scenes',id+'.html'),'utf8').trim();
  assert(html.includes(fragment));assert(html.indexOf('../outing-touch-lines.js')>=0);assert(html.indexOf('../outing-touch-lines.js')<html.indexOf('../outing-scenes.js'));
 });
}
test('interleaving characters retains each deck; canvas touches and buttons share it',()=>{
 const p=page('pine'),seen=new Set();
 // GPT centre in the unchanged pine scene geometry.
 const pointer={clientX:340+(-146+.88*8)*1.05,clientY:460*.61+(10-18)*1.05};
 for(let i=0;i<8;i++){
  if(i%2){p.canvas.emit('pointerdown',pointer);p.canvas.emit('pointerup',pointer)}else p.click('gpt');
  seen.add(p.caption());p.click('astra');
 }
 assert.equal(seen.size,8);assert.equal(p.calls.length,0);
});
for(const [kind,action]of [['post','post'],['pine','lantern'],['dessert','pudding'],['bindery','bind'],['lost','claim'],['bath','float']])test(`${kind}: petting cancels unfinished souvenir work; changing sleep state resumes the awake deck`,()=>{
 const p=page(kind);p.click(action);p.advance(3100);assert.equal(p.root.dataset.story,action);assert(p.timers>0);p.click('pet');assert.equal(p.timers,0);p.advance(10000);assert.equal(p.calls.length,0);
 const awake=new Set();p.click('gpt');awake.add(p.caption());p.click('sleep');p.click('gpt');p.click('sleep');for(let i=0;i<7;i++){p.click('gpt');awake.add(p.caption())}assert.equal(awake.size,8);
});
test('a missing optional dialogue asset keeps petting functional',()=>{const p=page('pine',false);p.click('newton');assert(p.caption().length>10);p.click('sleep');p.click('newton');assert.match(p.caption(),/睡/)});
test('curio: petting stops the drawer before its key is found',()=>{
 const p=page('curio');p.click('drawer');p.advance(800);p.click('pet');assert.equal(p.timers,0);p.advance(10000);assert.equal(p.calls.length,0);
});
test('curio: exploring the other five objects does not write a souvenir',()=>{
 const p=page('curio');for(const action of ['frame','teapot','books','moon','ribbon']){p.click(action);p.advance(10000)}assert.equal(p.calls.length,0);
});
test('lost: exploring the six objects does not write the pocket-cloud souvenir',()=>{
 const p=page('lost');for(const action of ['umbrella','clock','suitcase','bottle','plant','bell']){const before=p.caption();p.click(action);assert.notEqual(p.caption(),before);p.advance(10000)}assert.equal(p.calls.length,0);
});
test('bath: exploring the six objects does not write the moon-leaf-boat souvenir',()=>{
 const p=page('bath');for(const action of ['towel','stone','ladle','soap','fern','lantern']){const before=p.caption();p.click(action);assert.notEqual(p.caption(),before);p.advance(10000)}assert.equal(p.calls.length,0);
});

test('post: secrets have replay replies and do not write the postmark souvenir',()=>{
 const p=page('post');
 for(const action of ['stamp','spool','scale','envelope','inkwell','parcel']){
  p.click(action);const first=p.caption();assert(first.length>10);p.advance(3000);
  p.click(action);assert.notEqual(p.caption(),first);p.advance(3000);
 }
 assert.equal(p.calls.length,0);
});
test('post: sleeping blocks a letter or secret from starting',()=>{
 const p=page('post');p.click('sleep');
 for(const action of ['post','stamp','spool','scale','envelope','inkwell','parcel','hint','reset']){
  p.click(action);assert.equal(p.root.dataset.sleeping,'true');assert.equal(p.root.dataset.story,'');
 }
 p.advance(12000);assert.equal(p.calls.length,0);assert.equal(p.timers,0);
});
