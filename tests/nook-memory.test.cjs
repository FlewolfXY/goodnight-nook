const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const {webcrypto}=require('node:crypto');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const code=fs.readFileSync(path.join(root,fs.existsSync(path.join(root,'public/nook-memory.js'))?'public/nook-memory.js':'dist/nook-memory.js'),'utf8');
const KEY='goodnight-nook:memory:v1';
const initial=()=>({version:1,souvenirs:[],paper:false,pillow:false,pillowWelcomed:false,pillowPlace:'newton',createdAt:'2026-10-12T18:00:00Z',pillowMadeAt:null,updatedAt:'2026-10-12T18:00:00Z',revision:0});
const tick=()=>new Promise(resolve=>setImmediate(resolve));
async function settle(){for(let i=0;i<12;i++)await tick();}
function server(){
 const states=new Map(),calls=[];let user='wolf',online=true;
 return{calls,states,set user(v){user=v},get user(){return user},set online(v){online=v},get online(){return online},
 async fetch(url,options){
  assert.equal(url,'/api/nook-state');assert.equal(options.credentials,'same-origin');assert.equal(options.cache,'no-store');
  if(!online)throw new Error('offline');
  const response=(data,status=200)=>({ok:status<400,status,json:async()=>JSON.parse(JSON.stringify(data))});
  if(!states.has(user))states.set(user,initial());
  const state=states.get(user);
  if(options.method==='POST'){
   if(options.headers['X-Nook-Scope']!==user)return response({error:{code:'scope_mismatch'}},403);
   const body=JSON.parse(options.body);calls.push({...body,user});
   if((body.op==='welcome-pillow'||body.op==='place-pillow')&&!state.pillow)return response({error:{code:'pillow_missing'},state},409);
   if(body.op==='make-pillow'){state.pillow=true;state.pillowMadeAt='2026-10-12T18:01:00Z';}
   if(body.op==='mark-paper')state.paper=true;
   if(body.op==='keep-souvenir')state.souvenirs=[...new Set([...state.souvenirs,body.souvenir])];
   if(body.op==='welcome-pillow')state.pillowWelcomed=true;
   if(body.op==='place-pillow')state.pillowPlace=body.place;
   state.revision++;
  }
  return response({scope:user,state});
 }};
}
function browser(service,map=new Map(),parent=null,blocked=false){
 const events={},docEvents={};
 const storage={getItem:k=>map.get(k)||null,setItem:(k,v)=>{if(blocked)throw Error('blocked');map.set(k,v);}};
 const window={location:{origin:'https://nook.test'},addEventListener:(name,fn)=>events[name]=fn};window.parent=parent||window;
 const document={hidden:false,addEventListener:(name,fn)=>docEvents[name]=fn};
 const context={window,document,location:window.location,localStorage:storage,fetch:service.fetch.bind(service),AbortController,setTimeout,clearTimeout,crypto:webcrypto,console};
 vm.createContext(context);vm.runInContext(code,context);
 return{api:window.NookMemory,window,map,events,docEvents,document,close(){events.pagehide?.({});}};
}
test('completed objects and placement survive a new browser using the same private account',async()=>{
 const s=server(),a=browser(s);await a.api.ready;
 await a.api.act('make-pillow');await a.api.act('mark-paper');await a.api.act('place-pillow',{place:'wolf'});await a.api.act('welcome-pillow');await settle();
 assert.equal(a.api.status().phase,'synced');assert.equal(a.api.status().pending,0);
 assert.deepEqual(s.calls.map(x=>x.op),['make-pillow','mark-paper','place-pillow','welcome-pillow']);
 a.close();const b=browser(s);await b.api.ready;
 assert.equal(b.api.get().pillow,true);assert.equal(b.api.get().paper,true);assert.equal(b.api.get().pillowPlace,'wolf');assert.equal(b.api.get().pillowWelcomed,true);
 const count=s.calls.length;await b.api.act('make-pillow');await b.api.act('welcome-pillow');await settle();assert.equal(s.calls.length,count);b.close();
});
test('offline creation survives reload and later flushes each action in order',async()=>{
 const s=server(),map=new Map(),a=browser(s,map);await a.api.ready;s.online=false;
 await a.api.act('make-pillow');await a.api.act('place-pillow',{place:'wolf'});await a.api.act('welcome-pillow');await settle();
 assert.equal(a.api.status().phase,'offline');assert.equal(a.api.status().pending,3);assert.equal(a.api.status().localSaved,true);a.close();
 const b=browser(s,map);await b.api.ready;assert.equal(b.api.get().pillow,true);assert.equal(b.api.get().pillowWelcomed,true);assert.equal(b.api.get().pillowPlace,'wolf');
 s.online=true;await b.api.refresh();assert.equal(b.api.status().pending,0);assert.equal(b.api.status().phase,'synced');assert.deepEqual(s.calls.map(x=>x.op),['make-pillow','place-pillow','welcome-pillow']);b.close();
});
test('a different signed-in user cannot inherit or receive another user outbox',async()=>{
 const s=server(),map=new Map(),a=browser(s,map);await a.api.ready;s.online=false;await a.api.act('make-pillow');await settle();a.close();
 s.online=true;s.user='another';const b=browser(s,map);await b.api.ready;
 assert.equal(b.api.get().pillow,false);assert.equal(b.api.status().pending,0);assert.equal(s.calls.length,0);b.close();
});
test('identity changes during an open page are rejected before mutation',async()=>{
 const s=server(),a=browser(s);await a.api.ready;s.user='another';await a.api.act('mark-paper');await settle();
 assert.equal(a.api.status().phase,'unavailable');assert.equal(s.states.get('another').paper,false);assert.equal(s.calls.length,0);
 await a.api.refresh();assert.equal(a.api.get().paper,false);assert.equal(a.api.status().pending,0);a.close();
});
test('same-origin embedded room shares one memory and one outbox with the homepage',async()=>{
 const s=server(),a=browser(s);await a.api.ready;const b=browser(s,new Map(),a.window);assert.equal(b.api,a.api);await b.api.act('mark-paper');await settle();assert.equal(a.api.get().paper,true);assert.equal(s.calls.length,1);a.close();
});
test('a delayed refresh cannot undo a completed write with an older snapshot',async()=>{
 const s=server(),a=browser(s);await a.api.ready;
 const original=s.fetch.bind(s);let release;const gate=new Promise(resolve=>release=resolve);
 // Replace the already-bound browser fetch using a second service wrapper.
 a.close();let delay=false;
 const service={async fetch(url,options){const response=await original(url,options);if(delay&&options.method==='GET'){const snapshot=await response.json();await gate;return{...response,json:async()=>snapshot};}return response;}};
 const b=browser(service);await b.api.ready;delay=true;const refreshing=b.api.refresh();await tick();
 await b.api.act('mark-paper');await settle();assert.equal(b.api.get().paper,true);
 release();await refreshing;assert.equal(b.api.get().paper,true);assert.equal(b.api.get().revision,1);b.close();
});
test('malformed cache is ignored; failed local storage is reported when offline',async()=>{
 const s=server(),map=new Map([[KEY,'{not-json']]),a=browser(s,map,null,true);await a.api.ready;
 assert.equal(a.api.get().pillow,false);s.online=false;await a.api.act('make-pillow');await settle();assert.equal(a.api.status().phase,'offline');assert.equal(a.api.status().localSaved,false);assert.equal(a.api.get().pillow,true);a.close();
});

test('trip souvenirs survive offline reload and sync without changing the pillow',async()=>{
 const s=server(),map=new Map(),a=browser(s,map);await a.api.ready;await a.api.act('make-pillow');await settle();
 s.online=false;await a.api.act('keep-souvenir',{souvenir:'moonflower'});await a.api.act('keep-souvenir',{souvenir:'tide-ticket'});await settle();assert.equal(a.api.status().pending,2);a.close();
 const b=browser(s,map);await b.api.ready;assert.deepEqual([...b.api.get().souvenirs],['moonflower','tide-ticket']);assert.equal(b.api.get().pillow,true);
 s.online=true;await b.api.refresh();assert.equal(b.api.status().pending,0);assert.deepEqual(s.states.get('wolf').souvenirs,['moonflower','tide-ticket']);
 const count=s.calls.length;await b.api.act('keep-souvenir',{souvenir:'moonflower'});await settle();assert.equal(s.calls.length,count);
 await assert.rejects(b.api.act('keep-souvenir',{souvenir:'unlisted'}));b.close();
 const fresh=browser(s);await fresh.api.ready;assert.deepEqual([...fresh.api.get().souvenirs],['moonflower','tide-ticket']);fresh.close();
 s.user='another';const other=browser(s,map);await other.api.ready;assert.deepEqual([...other.api.get().souvenirs],[]);other.close();
});

test('moon ink survives an offline outbox and a fresh signed-in browser',async()=>{
 const s=server(),map=new Map(),a=browser(s,map);await a.api.ready;s.online=false;
 await a.api.act('keep-souvenir',{souvenir:'moon-ink'});await settle();assert.deepEqual([...a.api.get().souvenirs],['moon-ink']);a.close();
 s.online=true;const b=browser(s,map);await b.api.ready;await settle();assert.equal(b.api.status().pending,0);assert.equal(b.api.status().phase,'synced');assert.deepEqual(s.states.get('wolf').souvenirs,['moon-ink']);b.close();
 const c=browser(s);await c.api.ready;assert.deepEqual([...c.api.get().souvenirs],['moon-ink']);c.close();
});

test('cinema ticket survives an offline outbox and a fresh signed-in browser',async()=>{
 const s=server(),map=new Map(),a=browser(s,map);await a.api.ready;s.online=false;
 await a.api.act('keep-souvenir',{souvenir:'moon-reel-ticket'});await settle();assert.deepEqual([...a.api.get().souvenirs],['moon-reel-ticket']);a.close();
 s.online=true;const b=browser(s,map);await b.api.ready;await settle();assert.equal(b.api.status().pending,0);assert.equal(b.api.status().phase,'synced');assert.deepEqual(s.states.get('wolf').souvenirs,['moon-reel-ticket']);b.close();
 const c=browser(s);await c.api.ready;assert.deepEqual([...c.api.get().souvenirs],['moon-reel-ticket']);c.close();
});

test('pinecone lamp survives offline reload, keeps older objects and remains account-scoped',async()=>{
 const s=server(),map=new Map(),a=browser(s,map);await a.api.ready;
 await a.api.act('make-pillow');await a.api.act('place-pillow',{place:'wolf'});await a.api.act('mark-paper');
 await a.api.act('keep-souvenir',{souvenir:'moon-ink'});await a.api.act('keep-souvenir',{souvenir:'moon-reel-ticket'});await settle();
 s.online=false;await a.api.act('keep-souvenir',{souvenir:'pinecone-lamp'});await a.api.act('keep-souvenir',{souvenir:'pinecone-lamp'});await settle();
 assert.equal(a.api.status().phase,'offline');assert.equal(a.api.status().pending,1);a.close();
 const b=browser(s,map);await b.api.ready;
 assert.deepEqual([...b.api.get().souvenirs],['moon-ink','moon-reel-ticket','pinecone-lamp']);assert.equal(b.api.get().paper,true);assert.equal(b.api.get().pillowPlace,'wolf');
 s.online=true;await b.api.refresh();assert.equal(b.api.status().pending,0);assert.equal(b.api.status().phase,'synced');
 assert.equal(s.calls.filter(call=>call.souvenir==='pinecone-lamp').length,1);b.close();
 const fresh=browser(s);await fresh.api.ready;
 assert.deepEqual([...fresh.api.get().souvenirs],['moon-ink','moon-reel-ticket','pinecone-lamp']);assert.equal(fresh.api.get().pillow,true);assert.equal(fresh.api.get().paper,true);assert.equal(fresh.api.get().pillowPlace,'wolf');fresh.close();
 s.user='another';const other=browser(s,map);await other.api.ready;assert.deepEqual([...other.api.get().souvenirs],[]);assert.equal(other.api.status().pending,0);assert.equal(s.calls.filter(call=>call.user==='another').length,0);other.close();
});

test('moon pudding jar joins all older souvenirs through an offline outbox without replaying across accounts',async()=>{
 const s=server(),map=new Map();
 const previous=['moonflower','tide-ticket','comet-bottle','moon-ink','moon-reel-ticket','pinecone-lamp'];
 s.states.set('wolf',{...initial(),souvenirs:previous.slice(),paper:true,pillow:true,pillowWelcomed:true,pillowPlace:'wolf',revision:10});
 const a=browser(s,map);await a.api.ready;s.online=false;
 await a.api.act('keep-souvenir',{souvenir:'moon-pudding-jar'});await a.api.act('keep-souvenir',{souvenir:'moon-pudding-jar'});await settle();
 assert.equal(a.api.status().phase,'offline');assert.equal(a.api.status().pending,1);a.close();
 const pendingForOther=new Map(map),b=browser(s,map);await b.api.ready;
 assert.deepEqual([...b.api.get().souvenirs],[...previous,'moon-pudding-jar']);assert.equal(b.api.status().pending,1);
 s.online=true;await b.api.refresh();assert.equal(b.api.status().pending,0);assert.equal(b.api.status().phase,'synced');
 assert.equal(s.calls.filter(call=>call.souvenir==='moon-pudding-jar').length,1);b.close();
 const fresh=browser(s);await fresh.api.ready;
 assert.deepEqual([...fresh.api.get().souvenirs],[...previous,'moon-pudding-jar']);
 for(const [field,value]of Object.entries({paper:true,pillow:true,pillowWelcomed:true,pillowPlace:'wolf'}))assert.equal(fresh.api.get()[field],value);
 await fresh.api.act('keep-souvenir',{souvenir:'moon-pudding-jar'});await settle();assert.equal(s.calls.length,1);fresh.close();
 s.user='another';const other=browser(s,pendingForOther);await other.api.ready;
 assert.deepEqual([...other.api.get().souvenirs],[]);assert.equal(other.api.status().pending,0);assert.equal(s.calls.length,1);other.close();
});

test('moon book persists beside all seven older souvenirs without losing room state or crossing accounts',async()=>{
 const s=server(),map=new Map();
 const previous=['moonflower','tide-ticket','comet-bottle','moon-ink','moon-reel-ticket','pinecone-lamp','moon-pudding-jar'];
 s.states.set('wolf',{...initial(),souvenirs:previous.slice(),paper:true,pillow:true,pillowWelcomed:true,pillowPlace:'wolf',revision:11});
 const a=browser(s,map);await a.api.ready;s.online=false;
 await a.api.act('keep-souvenir',{souvenir:'moon-book'});await a.api.act('keep-souvenir',{souvenir:'moon-book'});await settle();
 assert.equal(a.api.status().phase,'offline');assert.equal(a.api.status().pending,1);a.close();
 const pendingForOther=new Map(map),b=browser(s,map);await b.api.ready;
 assert.deepEqual([...b.api.get().souvenirs],[...previous,'moon-book']);assert.equal(b.api.status().pending,1);
 s.online=true;await b.api.refresh();assert.equal(b.api.status().pending,0);assert.equal(b.api.status().phase,'synced');
 assert.equal(s.calls.filter(call=>call.souvenir==='moon-book').length,1);b.close();
 const fresh=browser(s);await fresh.api.ready;
 assert.deepEqual([...fresh.api.get().souvenirs],[...previous,'moon-book']);
 for(const [field,value]of Object.entries({paper:true,pillow:true,pillowWelcomed:true,pillowPlace:'wolf'}))assert.equal(fresh.api.get()[field],value);
 await fresh.api.act('keep-souvenir',{souvenir:'moon-book'});await settle();assert.equal(s.calls.length,1);fresh.close();
 s.user='another';const other=browser(s,pendingForOther);await other.api.ready;
 assert.deepEqual([...other.api.get().souvenirs],[]);assert.equal(other.api.status().pending,0);assert.equal(s.calls.length,1);other.close();
});

test('tiny room key survives offline reload alongside every old souvenir and stays in its account',async()=>{
 const s=server(),map=new Map();
 const previous=['moonflower','tide-ticket','comet-bottle','moon-ink','moon-reel-ticket','pinecone-lamp','moon-pudding-jar','moon-book'];
 s.states.set('wolf',{...initial(),souvenirs:previous.slice(),paper:true,pillow:true,pillowWelcomed:true,pillowPlace:'wolf',revision:12});
 const a=browser(s,map);await a.api.ready;s.online=false;
 await a.api.act('keep-souvenir',{souvenir:'tiny-room-key'});await a.api.act('keep-souvenir',{souvenir:'tiny-room-key'});await settle();
 assert.equal(a.api.status().phase,'offline');assert.equal(a.api.status().pending,1);a.close();
 const pendingForOther=new Map(map),b=browser(s,map);await b.api.ready;
 assert.deepEqual([...b.api.get().souvenirs],[...previous,'tiny-room-key']);assert.equal(b.api.status().pending,1);
 s.online=true;await b.api.refresh();assert.equal(b.api.status().pending,0);assert.equal(b.api.status().phase,'synced');
 assert.equal(s.calls.filter(call=>call.souvenir==='tiny-room-key').length,1);b.close();
 const fresh=browser(s);await fresh.api.ready;
 assert.deepEqual([...fresh.api.get().souvenirs],[...previous,'tiny-room-key']);
 for(const [field,value]of Object.entries({paper:true,pillow:true,pillowWelcomed:true,pillowPlace:'wolf'}))assert.equal(fresh.api.get()[field],value);
 await fresh.api.act('keep-souvenir',{souvenir:'tiny-room-key'});await settle();assert.equal(s.calls.length,1);fresh.close();
 s.user='another';const other=browser(s,pendingForOther);await other.api.ready;
 assert.deepEqual([...other.api.get().souvenirs],[]);assert.equal(other.api.status().pending,0);assert.equal(s.calls.length,1);other.close();
});

test('pocket cloud survives offline reload with all nine older souvenirs and remains account-scoped',async()=>{
 const s=server(),map=new Map();
 const previous=['moonflower','tide-ticket','comet-bottle','moon-ink','moon-reel-ticket','pinecone-lamp','moon-pudding-jar','moon-book','tiny-room-key'];
 s.states.set('wolf',{...initial(),souvenirs:previous.slice(),paper:true,pillow:true,pillowWelcomed:true,pillowPlace:'wolf',revision:13});
 const a=browser(s,map);await a.api.ready;s.online=false;
 await a.api.act('keep-souvenir',{souvenir:'pocket-cloud'});await a.api.act('keep-souvenir',{souvenir:'pocket-cloud'});await settle();
 assert.equal(a.api.status().phase,'offline');assert.equal(a.api.status().pending,1);a.close();
 const pendingForOther=new Map(map),b=browser(s,map);await b.api.ready;
 assert.deepEqual([...b.api.get().souvenirs],[...previous,'pocket-cloud']);assert.equal(b.api.status().pending,1);
 s.online=true;await b.api.refresh();assert.equal(b.api.status().pending,0);assert.equal(b.api.status().phase,'synced');
 assert.equal(s.calls.filter(call=>call.souvenir==='pocket-cloud').length,1);b.close();
 const fresh=browser(s);await fresh.api.ready;
 assert.deepEqual([...fresh.api.get().souvenirs],[...previous,'pocket-cloud']);
 for(const [field,value]of Object.entries({paper:true,pillow:true,pillowWelcomed:true,pillowPlace:'wolf'}))assert.equal(fresh.api.get()[field],value);
 await fresh.api.act('keep-souvenir',{souvenir:'pocket-cloud'});await settle();assert.equal(s.calls.length,1);fresh.close();
 s.user='another';const other=browser(s,pendingForOther);await other.api.ready;
 assert.deepEqual([...other.api.get().souvenirs],[]);assert.equal(other.api.status().pending,0);assert.equal(s.calls.length,1);other.close();
});

test('moon leaf boat survives offline reload with all ten older souvenirs and remains account-scoped',async()=>{
 const s=server(),map=new Map();
 const previous=['moonflower','tide-ticket','comet-bottle','moon-ink','moon-reel-ticket','pinecone-lamp','moon-pudding-jar','moon-book','tiny-room-key','pocket-cloud'];
 s.states.set('wolf',{...initial(),souvenirs:previous.slice(),paper:true,pillow:true,pillowWelcomed:true,pillowPlace:'wolf',revision:14});
 const a=browser(s,map);await a.api.ready;s.online=false;
 await a.api.act('keep-souvenir',{souvenir:'moon-leaf-boat'});await a.api.act('keep-souvenir',{souvenir:'moon-leaf-boat'});await settle();
 assert.equal(a.api.status().phase,'offline');assert.equal(a.api.status().pending,1);a.close();
 const pendingForOther=new Map(map),b=browser(s,map);await b.api.ready;
 assert.deepEqual([...b.api.get().souvenirs],[...previous,'moon-leaf-boat']);assert.equal(b.api.status().pending,1);
 s.online=true;await b.api.refresh();assert.equal(b.api.status().pending,0);assert.equal(b.api.status().phase,'synced');
 assert.equal(s.calls.filter(call=>call.souvenir==='moon-leaf-boat').length,1);b.close();
 const fresh=browser(s);await fresh.api.ready;
 assert.deepEqual([...fresh.api.get().souvenirs],[...previous,'moon-leaf-boat']);
 for(const [field,value]of Object.entries({paper:true,pillow:true,pillowWelcomed:true,pillowPlace:'wolf'}))assert.equal(fresh.api.get()[field],value);
 await fresh.api.act('keep-souvenir',{souvenir:'moon-leaf-boat'});await settle();assert.equal(s.calls.length,1);fresh.close();
 s.user='another';const other=browser(s,pendingForOther);await other.api.ready;
 assert.deepEqual([...other.api.get().souvenirs],[]);assert.equal(other.api.status().pending,0);assert.equal(s.calls.length,1);other.close();
});

test('moon postmark survives offline reload with all eleven older souvenirs and remains account-scoped',async()=>{
 const s=server(),map=new Map();
 const previous=['moonflower','tide-ticket','comet-bottle','moon-ink','moon-reel-ticket','pinecone-lamp','moon-pudding-jar','moon-book','tiny-room-key','pocket-cloud','moon-leaf-boat'];
 s.states.set('wolf',{...initial(),souvenirs:previous.slice(),paper:true,pillow:true,pillowWelcomed:true,pillowPlace:'wolf',revision:15});
 const a=browser(s,map);await a.api.ready;s.online=false;
 await a.api.act('keep-souvenir',{souvenir:'moon-postmark'});await a.api.act('keep-souvenir',{souvenir:'moon-postmark'});await settle();
 assert.equal(a.api.status().phase,'offline');assert.equal(a.api.status().pending,1);a.close();
 const pendingForOther=new Map(map),b=browser(s,map);await b.api.ready;
 assert.deepEqual([...b.api.get().souvenirs],[...previous,'moon-postmark']);assert.equal(b.api.status().pending,1);
 s.online=true;await b.api.refresh();assert.equal(b.api.status().pending,0);assert.equal(b.api.status().phase,'synced');
 assert.equal(s.calls.filter(call=>call.souvenir==='moon-postmark').length,1);b.close();
 const fresh=browser(s);await fresh.api.ready;
 assert.deepEqual([...fresh.api.get().souvenirs],[...previous,'moon-postmark']);
 for(const [field,value]of Object.entries({paper:true,pillow:true,pillowWelcomed:true,pillowPlace:'wolf'}))assert.equal(fresh.api.get()[field],value);
 await fresh.api.act('keep-souvenir',{souvenir:'moon-postmark'});await settle();assert.equal(s.calls.length,1);fresh.close();
 s.user='another';const other=browser(s,pendingForOther);await other.api.ready;
 assert.deepEqual([...other.api.get().souvenirs],[]);assert.equal(other.api.status().pending,0);assert.equal(s.calls.length,1);other.close();
});
