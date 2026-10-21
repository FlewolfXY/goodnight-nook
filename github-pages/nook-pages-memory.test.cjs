const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const code=fs.readFileSync(path.join(__dirname,'nook-memory.js'),'utf8');
const gifts=['moonflower','tide-ticket','comet-bottle','moon-ink','moon-reel-ticket','pinecone-lamp','moon-pudding-jar','moon-book','tiny-room-key','pocket-cloud','moon-leaf-boat','moon-postmark'];
function browser({map=new Map(),base='/goodnight-nook/',page='index.html',parent=null,blocked=false}={}){
 const events={},docEvents={},gate={blocked};let fetches=0;
 const location={origin:'https://flewolfxy.github.io',href:'https://flewolfxy.github.io'+base+page};
 const window={location,addEventListener:(name,fn)=>events[name]=fn};window.parent=parent||window;
 const document={hidden:false,currentScript:{src:location.origin+base+'nook-memory.js'},addEventListener:(name,fn)=>docEvents[name]=fn};
 const localStorage={getItem:key=>map.get(key)||null,setItem:(key,value)=>{if(gate.blocked)throw Error('storage blocked');map.set(key,value);}};
 const context={window,document,location,localStorage,URL,console,fetch(){fetches++;throw Error('Static pages cannot use cloud API');}};
 vm.createContext(context);vm.runInContext(code,context);
 return{api:window.NookMemory,window,map,events,docEvents,gate,get fetches(){return fetches;}};
}
test('all souvenirs, paper and placed/welcomed pillow survive reopening a deep scene without any API request',async()=>{
 const a=browser();await a.api.ready;
 await a.api.act('mark-paper');await a.api.act('make-pillow');await a.api.act('place-pillow',{place:'wolf'});await a.api.act('welcome-pillow');
 for(const souvenir of gifts)await a.api.act('keep-souvenir',{souvenir});
 const b=browser({map:a.map,page:'scenes/moon-mushroom-post-office.html'});await b.api.ready;
 assert.deepEqual([...b.api.get().souvenirs],gifts);
 for(const key of ['paper','pillow','pillowWelcomed'])assert.equal(b.api.get()[key],true);
 assert.equal(b.api.get().pillowPlace,'wolf');assert.equal(b.api.status().mode,'local');assert.equal(b.api.status().localSaved,true);
 assert.equal(a.fetches+b.fetches,0);
});
test('two already-open tabs preserve independent new objects and update the latest pillow placement',async()=>{
 const map=new Map(),a=browser({map}),b=browser({map});await Promise.all([a.api.ready,b.api.ready]);
 await a.api.act('keep-souvenir',{souvenir:'moon-postmark'});await b.api.act('keep-souvenir',{souvenir:'pocket-cloud'});
 await a.api.act('make-pillow');await b.api.act('place-pillow',{place:'wolf'});await a.api.act('mark-paper');
 await b.api.refresh();assert.deepEqual([...b.api.get().souvenirs],['pocket-cloud','moon-postmark']);assert.equal(b.api.get().paper,true);assert.equal(b.api.get().pillowPlace,'wolf');
 await a.api.act('place-pillow',{place:'newton'});await b.api.refresh();assert.equal(b.api.get().pillowPlace,'newton');
});
test('storage denial keeps session progress, reports unsaved and retries when storage becomes available',async()=>{
 const a=browser({blocked:true});await a.api.ready;await a.api.act('make-pillow');await a.api.act('keep-souvenir',{souvenir:'moon-postmark'});
 assert.equal(a.api.get().pillow,true);assert.equal(a.api.status().localSaved,false);assert.equal(a.api.status().pending,2);assert.equal(a.api.status().phase,'local');
 a.gate.blocked=false;await a.api.refresh();assert.equal(a.api.status().localSaved,true);assert.equal(a.api.status().pending,0);
 const b=browser({map:a.map});await b.api.ready;assert.equal(b.api.get().pillow,true);assert.deepEqual([...b.api.get().souvenirs],['moon-postmark']);
});
test('idempotence, snapshot isolation and invalid actions preserve saves',async()=>{
 const a=browser();await a.api.ready;await a.api.act('keep-souvenir',{souvenir:'moon-postmark'});const before=a.api.get().revision;
 await a.api.act('keep-souvenir',{souvenir:'moon-postmark'});assert.equal(a.api.get().revision,before);
 a.api.get().souvenirs.push('moonflower');assert.deepEqual([...a.api.get().souvenirs],['moon-postmark']);
 await assert.rejects(a.api.act('keep-souvenir',{souvenir:'unknown'}),/Unknown room action/);
 await assert.rejects(a.api.act('place-pillow',{place:'elsewhere'}),/Unknown room action/);
 await a.api.act('place-pillow',{place:'wolf'});assert.equal(a.api.get().pillowPlace,'newton');
});
test('same-origin iframe shares parent memory and another Pages repository uses its own saves',async()=>{
 const a=browser();await a.api.ready;await a.api.act('mark-paper');
 const child=browser({map:a.map,parent:a.window,page:'scenes/moonlit-parlor-night.html'});assert.equal(child.api,a.api);
 const other=browser({map:a.map,base:'/another-project/'});await other.api.ready;assert.equal(other.api.get().paper,false);
});
test('external tab storage clear is reflected and malformed records are ignored',async()=>{
 const a=browser();await a.api.ready;await a.api.act('mark-paper');a.map.clear();await a.api.refresh();assert.equal(a.api.get().paper,false);
 a.map.set('goodnight-nook:pages-memory:v1:/goodnight-nook/:paper','{bad');await a.api.refresh();assert.equal(a.api.get().paper,false);assert.equal(a.api.status().localSaved,true);
});
