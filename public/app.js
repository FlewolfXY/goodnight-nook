const $=selector=>document.querySelector(selector);
const frame=$('#scene-frame'),shelf=$('#shelf'),label=$('#current-label');
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
const defaultId='moonlit-parlor-night';
const homeEntry={id:defaultId,title:'月光客厅',path:'scenes/moonlit-parlor-night.html',episode:9};
const sceneStage=$('.scene-stage'),lamp=$('#lamp-toggle'),roomNote=$('#room-note');
const albumToggle=$('#album-toggle'),backHome=$('#back-home');
let entries=[],current=homeEntry,frameObserver=null,resizeRequest=0,animateNextLoad=false;
let roomSleeping=false,sceneReady=false,albumExpanded=false,navigationTouched=false,pendingFocus=null;
let roomTheme=document.documentElement.dataset.theme==='cream'?'cream':'night';

function currentDocument({complete=false}={}){
 try{
  const doc=frame.contentDocument;
  if(!doc||new URL(doc.URL).href!==new URL(frame.getAttribute('src'),location.href).href)return null;
  if(complete&&doc.readyState!=='complete')return null;
  return doc;
 }catch{return null;}
}
function applyTheme(theme,doc=document){
 if(window.nookTheme?.apply)window.nookTheme.apply(theme,doc);
 else doc.documentElement.dataset.theme=theme;
}
function setRoomTheme(value,{persist=false,announce=true}={}){
 const next=value==='cream'?'cream':'night',changed=next!==roomTheme;roomTheme=next;
 applyTheme(next);
 const doc=currentDocument();if(doc)applyTheme(next,doc);
 if(persist){try{localStorage.setItem('goodnight-nook:theme',next);}catch{}}
 const action=next==='night'?'切换到奶油模式':'切换到夜间模式';
 lamp.setAttribute('aria-pressed',String(next==='night'));lamp.setAttribute('aria-label',action);lamp.title=action;
 $('#lamp-label').textContent=next==='night'?'夜间模式':'奶油模式';
 if(changed&&announce)roomNote.textContent=next==='night'?'夜色轻轻合拢，小窝留着一点暖光。':'奶油色的小窝亮起来，大家还在原来的地方。';
}
function frameSleepState(){
 if(!sceneReady)return null;
 const state=currentDocument({complete:true})?.documentElement.dataset.sleeping;
 return state==='true'?true:state==='false'?false:null;
}
function setRoomSleep(value,{announce=true}={}){
 const next=Boolean(value),changed=next!==roomSleeping;roomSleeping=next;
 document.body.dataset.sleeping=String(next);
 const doc=currentDocument();if(doc)doc.documentElement.dataset.roomSleeping=String(next);
 if(changed&&next)setRoomTheme('night',{announce:false});
 if(changed&&announce)roomNote.textContent=next?'夜色轻轻合拢。相册也陪大家一起窝好了。':'大家醒来一点，夜色还软软地留着。';
 if(!announce)roomNote.textContent='';
}
function flushFocus(){
 if(!pendingFocus||!sceneReady||current.id!==defaultId||!currentDocument({complete:true}))return;
 const object=pendingFocus;pendingFocus=null;
 frame.contentWindow?.postMessage({type:'nook-focus',object},location.origin);
}
window.addEventListener('message',event=>{
 if(event.source!==frame.contentWindow||event.origin!==location.origin)return;
 if(event.data?.type==='nook-sleep'&&typeof event.data.sleeping==='boolean'&&frameSleepState()===event.data.sleeping)setRoomSleep(event.data.sleeping);
 if(event.data?.type==='nook-ready'&&currentDocument({complete:true})){sceneReady=true;flushFocus();}
});
lamp.addEventListener('click',()=>setRoomTheme(roomTheme==='night'?'cream':'night',{persist:true}));

const keepsakeLines={
 whale:['云鲸抱枕陷下去一点，又慢吞吞地鼓回来。软度：刚好。','这只云鲸，载过三只穿过萤火森林。现在负责被窝里的航线。'],
 sock:['Astra 的小袜子晃了晃：今天也没有走丢，只是在床边休假。','从星星洗衣店一路旅行来的袜子，又多了一晚小故事。'],
 leaf:['GPT 的小叶芽被戳得一颤，悄悄往你的指尖靠。','小叶芽认真摇了两下，像是在说：嗯嗯，我听着呢。']
};
const keepsakeCounts={whale:0,sock:0,leaf:0},keepsakeTimers=new WeakMap();
document.querySelectorAll('[data-keepsake]').forEach(button=>button.addEventListener('click',()=>{
 const kind=button.dataset.keepsake;$('#keepsake-note').textContent=keepsakeLines[kind][keepsakeCounts[kind]++%keepsakeLines[kind].length];
 clearTimeout(keepsakeTimers.get(button));button.classList.remove('pop');
 if(!reduced.matches){void button.offsetWidth;button.classList.add('pop');keepsakeTimers.set(button,setTimeout(()=>button.classList.remove('pop'),850));}
}));
function fitFrame(){
 cancelAnimationFrame(resizeRequest);
 resizeRequest=requestAnimationFrame(()=>{
  const content=currentDocument()?.querySelector('.archive-frame');if(!content)return;
  const height=Math.max(420,Math.ceil(content.getBoundingClientRect().height)+2);
  if(Math.abs(frame.getBoundingClientRect().height-height)>1)frame.style.height=height+'px';
 });
}
function frameLoaded(){
 const doc=currentDocument({complete:true});sceneReady=Boolean(doc);if(!doc)return;
 setRoomTheme(roomTheme,{announce:false});setRoomSleep(false,{announce:false});
 if(animateNextLoad&&!reduced.matches){sceneStage.classList.remove('turning');void sceneStage.offsetWidth;sceneStage.classList.add('turning');}animateNextLoad=false;
 if(frameSleepState()===true)setRoomSleep(true);
 frame.contentWindow?.postMessage({type:'nook-state-request'},location.origin);
 frameObserver?.disconnect();frameObserver=null;
 const content=doc.querySelector('.archive-frame');
 if(content){frameObserver=new ResizeObserver(fitFrame);frameObserver.observe(content);doc.fonts?.ready.then(fitFrame);}
 fitFrame();flushFocus();
}
frame.addEventListener('load',frameLoaded);
window.addEventListener('resize',fitFrame);
// The parlor remains the first view even when the album cannot be fetched.
frameLoaded();

function markSelected(){
 shelf.querySelectorAll('button[data-id]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.id===current.id)));
}
function select(entry,{scroll=false,restart=false,object=null}={}){
 if(!entry)return;
 pendingFocus=object==='pillow'||object==='paper'?object:null;
 const path='./'+entry.path,willNavigate=restart||frame.getAttribute('src')!==path;
 if(willNavigate){sceneReady=false;animateNextLoad=true;setRoomSleep(false,{announce:false});}
 current=entry;
 label.textContent=entry.id===defaultId?'月光客厅':entry.title;
 backHome.hidden=entry.id===defaultId;
 $('#restart-scene').textContent=entry.id===defaultId?'↺ 重新坐一会':'↺ 重新玩这一晚';
 frame.title=entry.title+' · 可以直接摸摸小伙伴的互动小场景';
 $('#scene-link').href=path;markSelected();
 if(willNavigate){frameObserver?.disconnect();frameObserver=null;frame.src=path;}
 else flushFocus();
 if(scroll)$('#nook').scrollIntoView({behavior:reduced.matches?'instant':'smooth',block:'start'});
}
function requestedScene(){
 const url=new URL(location.href),query=url.searchParams.get('scene');
 if(query)return query;
 try{return url.hash.startsWith('#scene=')?decodeURIComponent(url.hash.slice(7)):null;}catch{return null;}
}
function clearSceneRoute(){
 const url=new URL(location.href);url.searchParams.delete('scene');
 if(url.hash.startsWith('#scene='))url.hash='';
 if(url.href!==location.href)history.replaceState(null,'',url);
}
backHome.addEventListener('click',()=>{navigationTouched=true;clearSceneRoute();select(entries.find(e=>e.id===defaultId)||homeEntry,{scroll:true});});
$('#restart-scene').addEventListener('click',()=>{navigationTouched=true;select(current,{restart:true});});

function applyAlbumView(){
 const cards=[...shelf.querySelectorAll('button[data-id]')];
 cards.forEach((button,index)=>{button.hidden=!albumExpanded&&index>=4;});
 albumToggle.hidden=cards.length<=4;
 albumToggle.setAttribute('aria-expanded',String(albumExpanded));
 albumToggle.textContent=albumExpanded?'合上相册，留最近四晚':'翻开整本相册';
 $('#shelf-count').textContent=albumExpanded?`${new Set(entries.map(e=>e.episode)).size} 个小梦 · ${entries.length} 份珍藏`:`最近 ${Math.min(4,entries.length)} 晚 · ${entries.length} 份珍藏`;
}
albumToggle.addEventListener('click',()=>{albumExpanded=!albumExpanded;applyAlbumView();});
function renderShelf(){
 shelf.replaceChildren();
 for(const entry of [...entries].sort((a,b)=>(b.order||0)-(a.order||0))){
  const button=document.createElement('button');button.type='button';button.className='memory-card';button.dataset.id=entry.id;button.setAttribute('aria-pressed','false');button.setAttribute('aria-label','回到'+entry.title);
  const art=document.createElement('div');art.className='memory-art';
  const preview=document.createElement('img');preview.src='./previews/'+entry.id+'.png';preview.alt='';preview.loading='lazy';preview.width=680;preview.height=420;art.appendChild(preview);
  const selected=document.createElement('span');selected.className='card-selected';selected.textContent='★';selected.setAttribute('aria-hidden','true');art.appendChild(selected);
  const copy=document.createElement('div');copy.className='card-copy';
  for(const [className,text] of [['card-type',`小梦 ${String(entry.episode).padStart(2,'0')} · ${entry.type}`],['card-title',entry.title],['card-subtitle',entry.subtitle]]){const span=document.createElement('span');span.className=className;span.textContent=text;copy.appendChild(span);}
  button.append(art,copy);button.addEventListener('click',()=>{navigationTouched=true;select(entry,{scroll:true});});shelf.appendChild(button);
 }
 applyAlbumView();markSelected();
}

// The home page only reads shared memories. The scene writes completed actions.
let memoryReady=false,memoryState={};
function renderMemory(state,status={}){
 if(memoryReady&&state&&typeof state==='object'){
  memoryState=state;
  const souvenirs=Array.isArray(state.souvenirs)?state.souvenirs:[];
  document.querySelectorAll("[data-souvenir]").forEach(button=>button.hidden=!souvenirs.includes(button.dataset.souvenir));
  $("#travel-shelf").hidden=!souvenirs.length;
  $('#kept-pillow').hidden=state.pillow!==true;
  $('#kept-paper').hidden=state.paper!==true;
  $('#kept-memories').hidden=state.pillow!==true&&state.paper!==true;
 }
 const note=$('#save-note');let text='';
 if(status.phase==='offline')text=status.pending>0?(status.localSaved===true?'小变化先存在这台设备，连上后会接着收好。':'这一小会还没存好，先别关掉页面。'):'暂时离线，正在等存档重新连上。';
 if(status.phase==='unavailable')text='共同存档需要重新开门。';
 note.hidden=!text;note.textContent=text;
 if(status.phase==='unavailable'){
  const reopen=document.createElement('a');reopen.href='/signin-with-chatgpt?return_to=%2F';reopen.target='_top';reopen.textContent='重新开门';note.appendChild(reopen);
 }
}
document.querySelectorAll('[data-object]').forEach(button=>button.addEventListener('click',()=>{
 const object=button.dataset.object;
 if(!memoryReady||memoryState[object]!==true)return;
 navigationTouched=true;clearSceneRoute();
 select(entries.find(e=>e.id===defaultId)||homeEntry,{scroll:true,object});
}));
function connectMemory(){
 const memory=window.NookMemory;
 if(!memory){renderMemory(null,{phase:'unavailable'});return;}
 memory.subscribe((state,status)=>renderMemory(state,status||memory.status()));
 Promise.resolve(memory.ready).then(state=>{
  memoryReady=true;renderMemory(memory.get()||state,memory.status());
 }).catch(()=>renderMemory(null,{phase:'unavailable'}));
}
connectMemory();
async function init(){
 try{
  const response=await fetch('./scenes.json');if(!response.ok)throw new Error('catalogue unavailable');
  entries=await response.json();renderShelf();
  if(!navigationTouched){
   const requested=requestedScene();const initial=entries.find(e=>e.id===requested)||entries.find(e=>e.id===defaultId)||homeEntry;
   if(requested&&[...shelf.querySelectorAll('button[data-id]')].findIndex(button=>button.dataset.id===initial.id)>=4){albumExpanded=true;applyAlbumView();}
   select(initial);
  }
 }catch{
  const message=$('#shelf-message');message.hidden=false;message.textContent='相册暂时没翻开，客厅还在这里。刷新一下就能再找找。';
 }
}
init();

// Invitations and souvenirs lead into the same playable album scenes.
document.querySelectorAll('[data-visit]').forEach(button=>button.addEventListener('click',()=>{
 const entry=entries.find(e=>e.id===button.dataset.visit);if(!entry)return;
 navigationTouched=true;clearSceneRoute();select(entry,{scroll:true});
}));
