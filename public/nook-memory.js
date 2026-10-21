/* A small shared memory for the room. The private server is the durable record;
   the browser keeps a copy and an outbox so a short disconnection loses nothing. */
(()=>{
 'use strict';
 try{if(window.parent!==window&&window.parent.location.origin===location.origin&&window.parent.NookMemory){window.NookMemory=window.parent.NookMemory;return;}}catch{}
 const KEY='goodnight-nook:memory:v1';
 const souvenirNames=['moonflower','tide-ticket','comet-bottle','moon-ink','moon-reel-ticket','pinecone-lamp','moon-pudding-jar','moon-book','tiny-room-key','pocket-cloud','moon-leaf-boat','moon-postmark'];
 const empty=()=>({version:1,souvenirs:[],paper:false,pillow:false,pillowWelcomed:false,pillowPlace:'newton',createdAt:null,pillowMadeAt:null,updatedAt:null,revision:0});
 const cleanState=value=>{
  if(!value||typeof value!=='object')return empty();
  const pillow=value.pillow===true;
  return {version:1,souvenirs:souvenirNames.filter(name=>Array.isArray(value.souvenirs)&&value.souvenirs.includes(name)),paper:value.paper===true,pillow,pillowWelcomed:pillow&&value.pillowWelcomed===true,pillowPlace:pillow&&value.pillowPlace==='wolf'?'wolf':'newton',createdAt:typeof value.createdAt==='string'?value.createdAt:null,pillowMadeAt:typeof value.pillowMadeAt==='string'?value.pillowMadeAt:null,updatedAt:typeof value.updatedAt==='string'?value.updatedAt:null,revision:Number.isSafeInteger(value.revision)&&value.revision>=0?value.revision:0};
 };
 const validOp=value=>value&&typeof value.id==='string'&&value.id.length<120&&['mark-paper','make-pillow','welcome-pillow','place-pillow','keep-souvenir'].includes(value.op)&&(value.op!=='place-pillow'||['wolf','newton'].includes(value.place))&&(value.op!=='keep-souvenir'||souvenirNames.includes(value.souvenir));
 function readCache(){try{const c=JSON.parse(localStorage.getItem(KEY));if(c?.version===1)return{scope:typeof c.scope==='string'?c.scope:null,state:cleanState(c.state),pending:Array.isArray(c.pending)?c.pending.filter(validOp).slice(-100):[]};}catch{}return null;}
 const cached=readCache();
 let scope=cached?.scope||null,base=cached?.state||empty(),pending=cached?.pending||[],state=base,phase='loading',flushPromise=null,refreshPromise=null,retryTimer=0,retryDelay=2500,disposed=false,serial=0,localSaved=true;
 const subscribers=new Set();
 function apply(s,item){
  const n={...s};
  if(item.op==='keep-souvenir')n.souvenirs=[...new Set([...n.souvenirs,item.souvenir])];
  if(item.op==='mark-paper')n.paper=true;
  if(item.op==='make-pillow'){n.pillow=true;if(!n.pillowMadeAt)n.pillowMadeAt=new Date().toISOString();}
  if(item.op==='welcome-pillow'&&n.pillow)n.pillowWelcomed=true;
  if(item.op==='place-pillow'&&n.pillow)n.pillowPlace=item.place;
  return n;
 }
 function materialize(){state=pending.reduce(apply,{...base});}
 function status(){return{phase,pending:pending.length,localSaved};}
 function notify(){materialize();for(const fn of subscribers){try{fn({...state},status());}catch{}}}
 function persist(){try{localStorage.setItem(KEY,JSON.stringify({version:1,scope,state:base,pending}));localSaved=true;}catch{localSaved=false;}return localSaved;}
 function update(){persist();notify();}
 async function request(method,body){
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),6000);
  try{
   const headers={'Accept':'application/json'};
   if(method==='POST'){headers['Content-Type']='application/json';headers['X-Nook-Scope']=scope;}
   const response=await fetch('/api/nook-state',{method,headers,body:body?JSON.stringify(body):undefined,credentials:'same-origin',cache:'no-store',signal:controller.signal});
   const data=await response.json().catch(()=>null);
   if(!response.ok){const error=new Error(data?.error?.code||'unavailable');error.status=response.status;error.data=data;throw error;}
   if(typeof data?.scope!=='string'||!data.scope||data.state?.version!==1||typeof data.state.paper!=='boolean'||typeof data.state.pillow!=='boolean')throw new Error('invalid_response');
   return{scope:data.scope,state:cleanState(data.state)};
  }finally{clearTimeout(timer);}
 }
 function absorb(data){
  // An outbox belongs to the account that created it. Never replay across users.
  const changed=scope!==data.scope;
  if(scope&&changed)pending=[];
  if(changed||data.state.revision>=base.revision)base=data.state;
  scope=data.scope;retryDelay=2500;
 }
 function planRetry(){
  clearTimeout(retryTimer);retryTimer=0;
  if(disposed||!pending.length||document.hidden||phase==='unavailable')return;
  retryTimer=setTimeout(()=>{retryTimer=0;refresh();},retryDelay);retryDelay=Math.min(60000,retryDelay*2);
 }
 function failed(error){phase=error?.status===401||error?.status===403?'unavailable':'offline';update();planRetry();}
 async function flush(){
  if(flushPromise)return flushPromise;
  if(!scope||phase==='unavailable')return;
  flushPromise=(async()=>{
   while(pending.length&&!disposed){
    const item=pending[0];
    try{
     const body={op:item.op};if(item.op==='place-pillow')body.place=item.place;if(item.op==='keep-souvenir')body.souvenir=item.souvenir;
     const result=await request('POST',body);
     if(result.scope!==scope){pending=[];absorb(result);phase='synced';update();break;}
     if(result.state.revision>=base.revision)base=result.state;pending=pending.filter(x=>x.id!==item.id);phase=pending.length?'loading':'synced';retryDelay=2500;update();
    }catch(error){
     if(error.status===409&&error.data?.scope===scope&&error.data?.state){const current=cleanState(error.data.state);if(current.revision>=base.revision)base=current;pending=pending.filter(x=>x.id!==item.id);phase=pending.length?'loading':'synced';update();continue;}
     failed(error);break;
    }
   }
  })().finally(()=>{flushPromise=null;});
  return flushPromise;
 }
 async function refresh(){
  if(refreshPromise)return refreshPromise;
  refreshPromise=(async()=>{
   if(flushPromise)await flushPromise;
   try{absorb(await request('GET'));phase=pending.length?'loading':'synced';update();await flush();}
   catch(error){failed(error);}
   return{...state};
  })().finally(()=>{refreshPromise=null;});
  return refreshPromise;
 }
 const api={
  ready:null,
  get:()=>({...state}),status,
  subscribe(fn){subscribers.add(fn);return()=>subscribers.delete(fn);},
  async act(op,payload={}){
   await api.ready;
   const item={id:globalThis.crypto?.randomUUID?.()||`${Date.now()}-${++serial}-${Math.random().toString(36).slice(2)}`,op};
   if(op==='place-pillow')item.place=payload.place;
   if(op==='keep-souvenir')item.souvenir=payload.souvenir;
   if(!validOp(item))throw new Error('Unknown room action');
   if(op==='keep-souvenir'&&state.souvenirs.includes(item.souvenir))return{...state};
   if((op==='welcome-pillow'||op==='place-pillow')&&!state.pillow)return{...state};
   if(op==='mark-paper'&&state.paper||op==='make-pillow'&&state.pillow||op==='welcome-pillow'&&state.pillowWelcomed||op==='place-pillow'&&state.pillowPlace===item.place)return{...state};
   pending.push(item);if(phase==='synced')phase='loading';update();
   if(scope&&phase!=='unavailable')void flush();else planRetry();
   return{...state};
  },
  refresh
 };
 materialize();window.NookMemory=api;api.ready=refresh();
 window.addEventListener('online',()=>refresh());
 window.addEventListener('focus',()=>{if(!document.hidden)refresh();});
 document.addEventListener('visibilitychange',()=>{if(document.hidden){clearTimeout(retryTimer);retryTimer=0;}else refresh();});
 window.addEventListener('storage',event=>{
  if(event.key!==KEY)return;
  const incoming=readCache();if(!incoming||incoming.scope!==scope)return;
  // Another tab may have placed something. Keep this tab's unsent actions.
  if(incoming.state.revision>=base.revision){base=incoming.state;notify();}
 });
 window.addEventListener('pagehide',()=>{disposed=true;clearTimeout(retryTimer);persist();});
 window.addEventListener('pageshow',event=>{if(event.persisted){disposed=false;refresh();}});
})();
