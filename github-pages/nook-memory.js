/* GitHub Pages keeps this room's memories in the current browser.
   Separate object records prevent different tabs from replacing one another's gifts. */
(()=>{
 'use strict';
 try{if(window.parent!==window&&window.parent.location.origin===location.origin&&window.parent.NookMemory){window.NookMemory=window.parent.NookMemory;return;}}catch{}
 const scriptBase=new URL('.',document.currentScript?.src||new URL('nook-memory.js',location.href)).pathname;
 const PREFIX='goodnight-nook:pages-memory:v1:'+scriptBase+':';
 const souvenirNames=['moonflower','tide-ticket','comet-bottle','moon-ink','moon-reel-ticket','pinecone-lamp','moon-pudding-jar','moon-book','tiny-room-key','pocket-cloud','moon-leaf-boat','moon-postmark'];
 const names=['paper','pillow','pillow-welcome','pillow-place',...souvenirNames.map(name=>'souvenir:'+name)];
 const records=new Map(),unsaved=new Set(),subscribers=new Set();
 let storageReadable=true;
 const empty=()=>({version:1,souvenirs:[],paper:false,pillow:false,pillowWelcomed:false,pillowPlace:'newton',createdAt:null,pillowMadeAt:null,updatedAt:null,revision:0});
 let state=empty();
 const snapshot=()=>({...state,souvenirs:[...state.souvenirs]});
 const status=()=>({phase:'local',mode:'local',pending:unsaved.size,localSaved:storageReadable&&unsaved.size===0});
 function valid(name,value){return value&&value.version===1&&typeof value.at==='string'&&Number.isFinite(Date.parse(value.at))&&Number.isSafeInteger(value.revision)&&value.revision>0&&(name==='pillow-place'?['wolf','newton'].includes(value.value):value.value===true);}
 function materialize(){
  const n=empty(),dates=[];
  for(const record of records.values()){dates.push(record.at);n.revision+=record.revision;}
  dates.sort();n.createdAt=dates[0]||null;n.updatedAt=dates.at(-1)||null;
  n.paper=records.has('paper');n.pillow=records.has('pillow');
  n.pillowMadeAt=records.get('pillow')?.at||null;
  n.pillowWelcomed=n.pillow&&records.has('pillow-welcome');
  n.pillowPlace=n.pillow&&records.get('pillow-place')?.value==='wolf'?'wolf':'newton';
  n.souvenirs=souvenirNames.filter(name=>records.has('souvenir:'+name));state=n;
 }
 function notify(){materialize();for(const fn of subscribers){try{fn(snapshot(),status());}catch{}}}
 function read(){
  storageReadable=true;
  for(const name of names){
   try{
    const raw=localStorage.getItem(PREFIX+name);let value=null;
    try{value=raw?JSON.parse(raw):null;}catch{}
    if(unsaved.has(name))continue;
    if(valid(name,value))records.set(name,value);else records.delete(name);
   }catch{storageReadable=false;}
  }
  materialize();
 }
 function persist(name){
  try{localStorage.setItem(PREFIX+name,JSON.stringify(records.get(name)));unsaved.delete(name);return true;}
  catch{unsaved.add(name);return false;}
 }
 async function refresh(){
  read();for(const name of [...unsaved])persist(name);notify();return snapshot();
 }
 function target(op,payload){
  if(op==='mark-paper')return['paper',true];
  if(op==='make-pillow')return['pillow',true];
  if(op==='welcome-pillow')return['pillow-welcome',true];
  if(op==='place-pillow'&&['wolf','newton'].includes(payload.place))return['pillow-place',payload.place];
  if(op==='keep-souvenir'&&souvenirNames.includes(payload.souvenir))return['souvenir:'+payload.souvenir,true];
  throw new Error('Unknown room action');
 }
 const api={
  ready:null,get:snapshot,status,
  subscribe(fn){subscribers.add(fn);return()=>subscribers.delete(fn);},
  async act(op,payload={}){
   await api.ready;
   const [name,value]=target(op,payload);read();
   if((op==='welcome-pillow'||op==='place-pillow')&&!state.pillow)return snapshot();
   const previous=records.get(name);
   if(previous?.value===value){if(unsaved.has(name))persist(name);notify();return snapshot();}
   records.set(name,{version:1,value,at:new Date().toISOString(),revision:(previous?.revision||0)+1});
   persist(name);notify();return snapshot();
  },refresh
 };
 read();window.NookMemory=api;api.ready=Promise.resolve(snapshot());
 window.addEventListener('storage',event=>{if(event.key===null||event.key?.startsWith(PREFIX))void refresh();});
 window.addEventListener('focus',()=>{if(!document.hidden)void refresh();});
 document.addEventListener('visibilitychange',()=>{if(!document.hidden)void refresh();});
 window.addEventListener('pageshow',event=>{if(event.persisted)void refresh();});
 window.addEventListener('pagehide',()=>{for(const name of [...unsaved])persist(name);});
})();
