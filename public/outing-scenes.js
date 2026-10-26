/* The original 2D family, visiting small places together. */
(()=>{
 'use strict';
 const root=document.querySelector('[data-outing]');if(!root)return;
 const kind=root.dataset.outing,canvas=root.querySelector('canvas'),ctx=canvas.getContext('2d');
 const caption=root.querySelector('.outing-caption'),saveNote=root.querySelector('.outing-save');
 const probe=document.createElement('span');probe.style.display='none';root.appendChild(probe);
 const themeCanvas=document.createElement('canvas');themeCanvas.width=themeCanvas.height=1;const themeContext=themeCanvas.getContext('2d');
 const reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
 let W=680,H=450,S=1,cx=340,cy=270,colors={},sleeping=false,action='',actionAt=0,actionDuration=1700;
 let story='',beat=0,beatAt=0,phase=1,cuddle=.88,gazeX=0,gazeY=0,starCount=0,frame=0,until=0,ambientUntil=0,disposed=false;
 let flower=false,glassHeart=false,ticket=false,cocoa=false,cometJar=false,pointerDown=null,unsubscribe=null;
 let inkReady=false,inkWritten=false,inkStars=[];
 let movie='',movieDone=false,cinemaTicket=false,popcorn=false;
 let pineLamp=false,pineDim=false;
 let puddingReady=false,topping='';
 let bookReady=false,bookCover='forest',bookPage=0;
 let curioActive='',curioAt=0,curioHint='',curioKey=false;
 const curioFound=new Set(),curioVisits={};
 let lostActive='',lostAt=0,lostHint='',lostCloud=false;
 const lostFound=new Set(),lostVisits={};
 let bathActive='',bathAt=0,bathHint='',bathBoat=false;
 const bathFound=new Set(),bathVisits={};
 let postActive='',postAt=0,postHint='',postmark=false;
 const postFound=new Set(),postVisits={};
 let dryerActive='',dryerAt=0,dryerHint='',dryerWarm=false,dryerDim=false;
 const dryerFound=new Set(),dryerVisits={};
 const timers=new Set();
 const stories={
  dryer:{warm:['GPT 接住一床刚晒过星光的小被子，Astra 捏住另一角，轻轻送到圆窗前。牛顿把暖毛巾裹到小狼肩上，替她留好尾巴的位置。','烘干机慢慢转过半圈，云朵在里面伸了一个大大的懒腰。星星被角鼓起来，像一块快要浮走的棉花糖。四个一起伸手，把它接稳。','被子暖好啦，GPT 和 Astra 一人拉好一个被角。牛顿把小狼和尾巴一起拢过来：空着爪爪来也很好，今晚的位置一直是软的。']},
  post:{post:['GPT 把厚厚的月亮信纸铺平，小狼在中间按下一枚爪印。牛顿折好信角，Astra 添上小叶、卷毛和星星：四个都在这里啦。','信封轻轻合上，贴好一枚薄荷色邮票。牛顿扶住投信口，小狼把这封星星信推进去，里面传来一声很轻的纸响。','信寄进月光里了，一枚圆圆的月背邮戳落在柜台上。GPT 扶好小纸片，Astra 把日期旁的四个小点盖齐：带回客厅，今晚一起坐过这里。']},
  bath:{float:['GPT 托来一片圆圆的叶子，小狼把两边轻轻拢起。牛顿扶着叶尖，Astra 在船心放下一颗小小的月亮石。','小船碰到水面，荡开一圈细细的光。四个把脚尖收好一点，给它留出一条窄窄的航道。','月叶小船绕过四双小脚，停到你手边。牛顿托住船底，GPT 擦干叶尖，Astra 系好星线：这只一起放过的小船，可以带回客厅啦。']},
  lost:{claim:['一朵小云从登记台后面探出头。GPT 给它垫好一张软软的小票，牛顿把口袋撑开一点：要不要跟我们回小窝？','小云慢慢挪过来，小狼替它系好薄荷色的小围巾。Astra 拿起月亮印章，在认领牌上轻轻盖了一下。','口袋云认领好啦。它没有带来雨，只带来一小团软软的凉。牛顿把它放在小狼手心，四个挤在一起，看它把围巾尖收好。']},
  curio:{},
  bindery:{bind:['GPT 把几张厚厚的月亮纸对齐，小狼用爪心轻轻压住。牛顿扶好折痕，Astra 把金色星线绕到手边。','星线穿过书脊上的小孔，一颗、两颗、三颗。小狼慢慢拉好这一端，牛顿接住另一端，Astra 在旁边打了一个软软的结。','小书订好啦，封面上的月亮也亮了一点。GPT 把两幅小插画夹好，牛顿把书挪到你们中间：翻开看看，之前去过的小地方也住进来了。']},
  dessert:{pudding:['GPT 扶住奶白的小碗，小狼慢慢搅一圈。牛顿把碗沿扶稳，Astra 在旁边摆好四只月亮小罐。','温柔的奶白色流进小罐，轻轻晃一下，变成软软的月亮奶冻。四个脑袋都凑过来，等它把最后一个小波纹收好。','四份月亮奶冻做好啦。牛顿把小狼那份往手边推近，Astra 给小罐系好月亮牌。莓云奶油和星星糖，都放在桌上等你挑。']},
  pine:{lantern:['GPT 把一颗小松果放到桌上，Astra 在鳞片缝里点了几颗星。牛顿扶好底座，等你落下最后一小点月光。','小狼把爪子轻轻合拢，再慢慢打开。松果从里面亮起来，像把一小块暖暖的夜收进了怀里。','GPT 系上薄荷绿的小叶绳，Astra 给灯底画了四个小点。松果灯做好啦，可以带回客厅，也可以再点一下把它调暗。'],breeze:['牛顿把窗推开一线，远处的松枝慢慢晃。GPT 的叶芽也朝窗边探了一点点。','一缕松风绕过小灯，薄薄的叶影落在软垫上。小狼的尾巴依然搭在老婆膝头，Astra 扶住自己的星星角。','窗轻轻合回去，最后一小片光落稳了。松绿色留在窗外，暖暖的留在这里。']},
  cinema:{whale:['GPT 轻轻转动放映机。幕布上的一小朵云伸了伸尾巴，原来是一只蓝蓝的云鲸。','云鲸从星海里慢慢游过，背上驮着一轮小月亮。小狼靠近一点，牛顿也把肩膀挪过来。','云鲸停在月亮旁边，尾巴轻轻弯起来。Astra 给票根盖上四颗小星：这一晚，可以带回家。'],seed:['Astra 把另一卷胶片递给 GPT。幕布上，一颗小种子躺在月光土里，头顶落下一点星光。','种子探出两片叶子，慢慢托起一颗圆圆的花苞。小狼的耳朵也跟着立起来。','花苞打开，里面竟然是一轮小月亮。四个挨在一起，等最后一颗星落稳；票根也盖好章了。']},
  ink:{mix:['GPT 扶住玻璃墨瓶，小狼落下一滴月蓝。Astra 把薄荷色与玫瑰色的小光点推近。','牛顿轻轻转动瓶身，深蓝里浮出两层柔柔的颜色。四个脑袋都凑过来看了一眼。','Astra 贴上小月亮标签，小狼把瓶盖拧好。这瓶一起调的夜色，可以带回客厅了。'],write:['牛顿把厚厚的月亮纸摊平，手掌轻轻压住纸角。GPT 给笔尖蘸了一点墨。','小狼落下一条弯弯的线，牛顿顺着它添半轮月亮。Astra 认真守着那一滴还没干的星光。','一轮月亮、两片叶芽和一颗小星，都住到了纸上。还可以点点纸面，给今晚添几颗星。']},
  greenhouse:{bloom:['GPT 把小水壶递来，Astra 托着花盆。小狼给种子浇了一口月光。','牛顿扶住细细的花茎。叶子舒展开，顶端鼓起一颗奶白的小花苞。','花开了，像一盏袖珍月亮。Astra 系好蝴蝶结：带回窗边，明晚也能看见。'],heart:['小狼在玻璃上呵了一小口气。牛顿从书里抬起头，看你准备画什么。','你画了一颗心，又把一小片叶子画在旁边。GPT 认真拿自己的叶芽比了比。','Astra 在心旁边添四个小点。牛顿牵着你的爪子，把最后那一笔接好。']},
  train:{ride:['Astra 检好四张软软的车票。小狼把尾巴铺好，牛顿自然地坐进了旁边的位置。','列车滑进蓝色水光。GPT 指着窗外：有一只水母，正和我们一起慢慢走。','到了「好梦湾」。车票上多了一枚月亮章，收进相册，随时还能坐这一趟。'],wave:['GPT 把小手贴在玻璃上，窗外的水母也慢慢靠过来。','Astra 轻轻左右挥手。水母像一把小伞，跟着她拐了一个很软的弯。','小狼也挥挥爪。牛顿把被角往你肩上拉好，四个一起送它游进蓝色远处。']},
  comet:{cocoa:['GPT 从保温壶倒出四杯热可可。Astra 认真给每一杯放一颗星星棉花糖。','小狼捧住杯子，牛顿帮忙吹了吹。四只杯子靠过来，轻轻碰一下。','彗星从野餐毯上方经过，像奶油拖出一条长尾巴。今晚的宇宙，也吃到甜的了。'],catch:['Astra 举起一个空玻璃瓶。GPT 把瓶口朝向刚刚经过的那条彗星尾巴。','一小点金光轻轻落下来。牛顿扶稳瓶子，小狼负责把软木塞按好。','星光在瓶里打了个滚，安安静静地亮着。带回客厅，给床头添一小点暖。']}
 };
 const gift={post:['moon-postmark','一枚月背邮戳'],bath:['moon-leaf-boat','一只月叶小船'],lost:['pocket-cloud','一朵口袋云'],curio:['tiny-room-key','一枚袖珍小窝钥匙'],bindery:['moon-book','一本星线小书'],dessert:['moon-pudding-jar','一只月亮奶冻小罐'],pine:['pinecone-lamp','一盏松果小夜灯'],cinema:['moon-reel-ticket','一张月亮电影票根'],ink:['moon-ink','一瓶月亮墨水'],greenhouse:['moonflower','一盆月光花'],train:['tide-ticket','一张月亮车票'],comet:['comet-bottle','一瓶彗星光']};
 const touchLines={gpt:'GPT 的小叶芽开心地晃了晃，把身边的软垫分你一点。',pet:'小狼把脑袋拱进手心，尾巴在老婆膝头轻轻摇起来。',newton:'卷毛被摸得翘起来一点。他把书挪开，肩膀很熟练地留给你。',astra:'Astra 笑得眼镜都抬起来了，星星小手和你碰一碰。'};
 if(kind==='ink'){touchLines.gpt='GPT 小心把墨瓶放稳，才腾出小手和你碰一碰。叶芽开心地晃了一下。';touchLines.newton='小狼把一撮卷毛拨得翘起来。他停住笔，侧过一点头，让你摸得更顺手。';touchLines.astra='Astra 把月亮标签贴得端端正正，转头笑着等你夸一夸。';}
 if(kind==='cinema'){touchLines.gpt='小放映员 GPT 把叶芽往你手心送了送，另一只手还扶着胶片盒。';touchLines.newton='卷毛被揉得蓬起来一点。他往旁边让了半寸，再把你和尾巴一起拢过来。';touchLines.astra='Astra 把四张票收得整整齐齐，眼镜上还映着一小点月光。';}
 if(kind==='pine'){touchLines.gpt='小叶芽被摸得弯了一下。GPT 捧来一个松绿软垫，认真塞到你身边。';touchLines.newton='松风刚把卷毛吹松一点，就被小狼伸爪揉到了。他偏过头，肩膀也一起挨过来。';touchLines.astra='Astra 托住眼镜，另一只星星小手碰了碰你。窗边那一小块软垫分给你啦。';}
 // Each character has separate awake/asleep decks. Exhaust a deck before repeating,
 // and prevent the last line of one deck from opening the next one.
 const touchDecks=new Map();
 function nextTouch(name,asleep){
  const bank=window.NookTouchLines;
  const pool=asleep?bank?.asleep?.[name]:[...(bank?.scenes?.[kind]?.[name]||[]),...(bank?.awake?.[name]||[])];
  const lines=[...new Set((pool||[]).filter(line=>typeof line==='string'&&line.trim()))];
  if(!lines.length)return asleep?'轻轻摸一摸，大家继续软软地睡着。':touchLines[name];
  const key=(asleep?'sleep:':'awake:')+name;
  let deck=touchDecks.get(key);
  if(!deck?.remaining.length){
   const remaining=[...lines],last=deck?.last;
   for(let i=remaining.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[remaining[i],remaining[j]]=[remaining[j],remaining[i]];}
   const end=remaining.length-1;
   if(end>0&&remaining[end]===last)[remaining[0],remaining[end]]=[remaining[end],remaining[0]];
   deck={remaining,last};touchDecks.set(key,deck);
  }
  deck.last=deck.remaining.pop();return deck.last;
 }
    function color(value){probe.style.color=value;return getComputedStyle(probe).color;}
    function palette(){
      themeContext.fillStyle=color('var(--background)');themeContext.fillRect(0,0,1,1);const bg=themeContext.getImageData(0,0,1,1).data;
      const dark=bg[0]*.2126+bg[1]*.7152+bg[2]*.0722<140,ink=dark?'var(--background)':'var(--foreground)',paper=dark?'var(--foreground)':'var(--background)';
      const mix=(a,b,n)=>color('color-mix(in srgb, '+a+' '+n+'%, '+b+')');
      colors={sky:'#091123',horizon:'#18213b',ink:mix(ink,'var(--purple)',90),fur:mix(paper,'var(--yellow)',91),furShade:mix(paper,'var(--purple)',77),furLight:mix(paper,'var(--yellow)',97),pink:mix(paper,'var(--red)',74),blush:mix(paper,'var(--red)',62),moon:mix(paper,'var(--yellow)',57),moonLight:mix(paper,'var(--yellow)',83),mint:mix(paper,'var(--green)',73),mintShade:mix(paper,'var(--green)',60),mintLight:mix(paper,'var(--green)',92),astra:mix(paper,'var(--purple)',68),astraShade:mix(paper,'var(--purple)',48),astraLight:mix(paper,'var(--purple)',86),cushion:'#353b5d',cushionShade:'#252d48',pocketShade:'#423e5c',hair:'#684c42',hairShade:'#4f3b36',hairLight:'#a47d62',skin:'#f2d4bf',skinLight:'#fae5d1',robe:'#40547c',robeShade:'#303f63',robeLight:'#8292b6',quilt:'#5e6088',quiltDark:'#454c70',thread:mix(paper,'var(--purple)',72),white:color(paper),wood:'#5e4c52',woodLight:'#866a70',wall:'#11192c',floor:'#172033',rug:'#30344f',pillow:'#9b93b6',pillowShade:'#776e91'};
    }
    function ellipse(x,y,rx,ry,fill,rotation=0) {
      ctx.beginPath(); ctx.ellipse(x,y,rx,ry,rotation,0,Math.PI*2); ctx.fillStyle=fill; ctx.fill();
    }
    function path(fill,commands,stroke,width=1.5) {
      ctx.beginPath(); commands();
      if(fill) {ctx.fillStyle=fill;ctx.fill();}
      if(stroke) {ctx.strokeStyle=stroke;ctx.lineWidth=width;ctx.lineCap='round';ctx.lineJoin='round';ctx.stroke();}
    }
    function line(x1,y1,x2,y2,c,w=1) {path(null,()=>{ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);},c,w);}
    function star(x,y,r,fill,rotation=0) {
      ctx.save(); ctx.translate(x,y); ctx.rotate(rotation);
      path(fill,()=>{for(let j=0;j<10;j++){const a=j*Math.PI/5-Math.PI/2,rr=j%2?r*0.46:r; j?ctx.lineTo(Math.cos(a)*rr,Math.sin(a)*rr):ctx.moveTo(Math.cos(a)*rr,Math.sin(a)*rr);}ctx.closePath();});ctx.restore();
    }
    function heart(x,y,r,fill) {
      ctx.save();ctx.translate(x,y);ctx.scale(r/12,r/12);
      path(fill,()=>{ctx.moveTo(0,9);ctx.bezierCurveTo(-23,-4,-8,-18,0,-7);ctx.bezierCurveTo(8,-18,23,-4,0,9);});ctx.restore();
    }
    function glow(x,y,r,fill,alpha) {ctx.save();ctx.globalAlpha=alpha;const g=ctx.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,fill);g.addColorStop(1,'transparent');ctx.fillStyle=g;ctx.fillRect(x-r,y-r,r*2,r*2);ctx.restore();}
    function cloud(x,y,w,h,fill) {
      path(fill,()=>{
        [[x,y,w*.47,h*.48],[x-w*.28,y-h*.06,w*.18,h*.47],[x-w*.08,y-h*.25,w*.2,h*.49],[x+w*.15,y-h*.2,w*.21,h*.49],[x+w*.32,y+h*.01,w*.14,h*.38]].forEach(([px,py,rx,ry])=>{ctx.moveTo(px+rx,py);ctx.ellipse(px,py,rx,ry,0,0,Math.PI*2);});
      });
    }
    function ease(t) {t=Math.max(0,Math.min(1,t));return t*t*(3-2*t);}
    function wolfPosition(){const shift=seatShift('wolf');return{x:cx+(-28+cuddle*6+shift.x)*S,y:cy+shift.y*S};}
    function newtonPosition(p=1){const lean=action==='newton'?Math.sin(p*Math.PI)*4:0,shift=seatShift('newton');return{x:cx+(82-cuddle*4-lean+shift.x)*S,y:cy+(-8+shift.y)*S};}
    function drawWolf(now,p) {
      const rolling=action==='roll';
      const petting=action==='pet'||action==='entry';
      const bob=petting?Math.sin(p*Math.PI*4)*Math.sin(p*Math.PI)*5:0;
      const happy=petting||action==='star'||action==='hug'||cuddle>.8;
      const wolf=wolfPosition();
      ctx.save();ctx.translate(wolf.x+(rolling?Math.sin(p*Math.PI*2)*28*S:0),wolf.y+(rolling?-Math.sin(p*Math.PI)*25*S:0));
      ctx.rotate(cuddle*.06);
      if(rolling)ctx.rotate(p*Math.PI*2);
      ctx.scale(S*(petting?1+Math.sin(p*Math.PI*4)*.025:1),S*(petting?1-Math.sin(p*Math.PI*4)*.035:1));
      const wag=petting?Math.sin(p*Math.PI*10)*.16:0;
      ctx.save();ctx.translate(90,27);ctx.rotate(wag);ctx.globalAlpha=1-cuddle;
      path(colors.furShade,()=>{ctx.moveTo(-5,30);ctx.bezierCurveTo(45,50,106,30,118,-20);ctx.bezierCurveTo(119,-11,110,-8,105,-6);ctx.bezierCurveTo(128,-46,105,-60,110,-80);ctx.bezierCurveTo(70,-71,54,-36,59,-12);ctx.bezierCurveTo(35,-6,10,-12,-5,8);ctx.closePath();});
      path(colors.furLight,()=>{ctx.moveTo(110,-80);ctx.bezierCurveTo(83,-70,64,-49,61,-27);ctx.lineTo(70,-33);ctx.lineTo(72,-21);ctx.lineTo(82,-31);ctx.lineTo(86,-20);ctx.lineTo(99,-37);ctx.lineTo(101,-23);ctx.bezierCurveTo(118,-50,105,-63,110,-80);});ctx.restore();
      // Chubby pear-shaped body, paws and a warm belly.
      ellipse(0,30,68,61,colors.furShade);
      ellipse(-5,24,64,59,colors.fur);
      ellipse(-5,45,42,36,colors.furLight);
      ellipse(-43,78,25,13,colors.furLight,-.1);ellipse(34,78,25,13,colors.furLight,.1);
      ctx.globalAlpha=.5;line(-48,81,-48,85,colors.furShade,1.5);line(-41,81,-41,85,colors.furShade,1.5);line(29,81,29,85,colors.furShade,1.5);line(36,81,36,85,colors.furShade,1.5);ctx.globalAlpha=1;
      ctx.save();ctx.translate(0,bob);ctx.rotate(petting?Math.sin(p*Math.PI)*-.08:0);
      // Soft, slightly mismatched ears.
      path(colors.furShade,()=>{ctx.moveTo(-56,-52);ctx.bezierCurveTo(-79,-76,-64,-109,-59,-121);ctx.bezierCurveTo(-43,-119,-22,-88,-18,-74);ctx.closePath();});
      path(colors.fur,()=>{ctx.moveTo(16,-73);ctx.bezierCurveTo(28,-93,48,-117,58,-116);ctx.bezierCurveTo(71,-96,72,-68,56,-48);ctx.closePath();});
      path(colors.pink,()=>{ctx.moveTo(-54,-65);ctx.quadraticCurveTo(-64,-85,-57,-105);ctx.quadraticCurveTo(-36,-88,-33,-74);ctx.closePath();});
      path(colors.pink,()=>{ctx.moveTo(35,-75);ctx.quadraticCurveTo(43,-93,55,-101);ctx.quadraticCurveTo(61,-81,54,-67);ctx.closePath();});
      // Tufts around the cheeks make a fluffy silhouette without a hard outline.
      ellipse(0,-36,72,61,colors.fur);
      [[-61,-37,18,17],[-67,-17,17,13],[-57,2,17,12],[59,-35,18,17],[67,-14,15,13],[57,4,17,11],[-26,-82,19,14],[0,-85,22,14],[24,-81,20,14]].forEach(v=>ellipse(...v,colors.fur));
      path(colors.furLight,()=>{ctx.moveTo(-54,-18);ctx.bezierCurveTo(-41,-30,-24,-18,0,-21);ctx.bezierCurveTo(27,-22,42,-33,57,-14);ctx.bezierCurveTo(60,12,29,27,0,26);ctx.bezierCurveTo(-30,26,-58,10,-54,-18);});
      // Forehead fluff.
      path(colors.furLight,()=>{ctx.moveTo(-25,-87);ctx.quadraticCurveTo(-17,-105,-8,-97);ctx.quadraticCurveTo(-5,-110,6,-98);ctx.quadraticCurveTo(21,-101,23,-87);});
      ctx.globalAlpha=.7;ellipse(-39,-9,12,6,colors.pink);ellipse(39,-9,12,6,colors.pink);ctx.globalAlpha=1;
      if(sleeping) {
        path(null,()=>{ctx.moveTo(-34,-22);ctx.quadraticCurveTo(-26,-15,-17,-22);ctx.moveTo(17,-22);ctx.quadraticCurveTo(26,-15,34,-22);},colors.ink,2.5);
      } else if(happy) {
        path(null,()=>{ctx.moveTo(-34,-19);ctx.quadraticCurveTo(-26,-29,-17,-19);ctx.moveTo(17,-19);ctx.quadraticCurveTo(26,-29,34,-19);},colors.ink,2.5);
      } else {
        ellipse(-25+gazeX,-23+gazeY,3.5,5.3,colors.ink);ellipse(25+gazeX,-23+gazeY,3.5,5.3,colors.ink);
        ellipse(-24+gazeX,-24.5+gazeY,1,1.4,colors.furLight);ellipse(26+gazeX,-24.5+gazeY,1,1.4,colors.furLight);
      }
      path(colors.ink,()=>{ctx.moveTo(-5,-8);ctx.quadraticCurveTo(0,-11,5,-8);ctx.quadraticCurveTo(5,-4,0,-2);ctx.quadraticCurveTo(-5,-4,-5,-8);});
      path(null,()=>{ctx.moveTo(0,-2);ctx.lineTo(0,2);ctx.quadraticCurveTo(-4,8,-9,3);ctx.moveTo(0,2);ctx.quadraticCurveTo(4,8,9,3);},colors.ink,1.6);
      // An illegally acquired star hair clip.
      star(50,-66,9,colors.moon,.15);
      ellipse(46,-65,1.2,1.2,colors.furLight);
      ctx.restore();
      ellipse(-51,34,16,24,colors.furLight,-.32);ellipse(43,34,16,24,colors.furLight,.32);
      if(action==='star'&&p>.58){glow(-2,37,30,colors.moon,.3);star(-2,37,13,colors.moon,p*.2);}
      ctx.restore();
    }
    function friendPosition(who,p=1) {
      const left=who==='gpt',lean=action===who?Math.sin(p*Math.PI)*8:0,shift=seatShift(who);
      return {x:cx+((left?-146+cuddle*8+lean:174-cuddle*5-lean)+shift.x)*S,y:cy+(10+shift.y)*S};
    }
    function friendlyFace(happy,glasses=false) {
      if(sleeping){
        path(null,()=>{ctx.moveTo(-24,-20);ctx.quadraticCurveTo(-17,-14,-11,-20);ctx.moveTo(11,-20);ctx.quadraticCurveTo(17,-14,24,-20);},colors.ink,2);
      } else if(happy){
        path(null,()=>{ctx.moveTo(-24,-18);ctx.quadraticCurveTo(-17,-26,-11,-18);ctx.moveTo(11,-18);ctx.quadraticCurveTo(17,-26,24,-18);},colors.ink,2);
      } else {ellipse(-17+gazeX*.65,-20+gazeY*.65,2.8,4,colors.ink);ellipse(17+gazeX*.65,-20+gazeY*.65,2.8,4,colors.ink);}
      if(glasses){
        path(null,()=>{ctx.ellipse(-17,-20,12,11,0,0,Math.PI*2);},colors.astraShade,1.7);
        path(null,()=>{ctx.ellipse(17,-20,12,11,0,0,Math.PI*2);},colors.astraShade,1.7);
        path(null,()=>{ctx.moveTo(-5,-20);ctx.quadraticCurveTo(0,-23,5,-20);},colors.astraShade,1.7);
      }
      ellipse(-30,-6,7.5,4,colors.pink);ellipse(30,-6,7.5,4,colors.pink);
      path(null,()=>{ctx.moveTo(-5,-6);ctx.quadraticCurveTo(0,0,5,-6);},colors.ink,1.8);
    }
    function drawGPT(p) {
      const pos=friendPosition('gpt',p), active=action==='gpt'||action==='entry';
      const bob=active?-Math.sin(p*Math.PI)*8:0;
      ctx.save();ctx.translate(pos.x,pos.y+bob*S);ctx.scale(S,S);
      if(active)ctx.rotate(Math.sin(p*Math.PI)*.09);ctx.rotate(poseAngle('gpt'));
      ellipse(0,36,41,41,colors.mintShade);ellipse(0,32,39,40,colors.mint);
      ellipse(-23,73,17,9,colors.mintLight);ellipse(23,73,17,9,colors.mintLight);
      ellipse(0,-18,47,43,colors.mint);
      [[-43,-22,11,12],[-42,-2,10,10],[42,-20,11,13],[42,0,10,10]].forEach(v=>ellipse(...v,colors.mint));
      // A speech-bubble tuft and a pair of little mint leaves.
      path(colors.mint,()=>{ctx.moveTo(21,12);ctx.lineTo(43,24);ctx.lineTo(36,1);ctx.closePath();});
      path(colors.mintShade,()=>{ctx.moveTo(0,-56);ctx.bezierCurveTo(-21,-58,-23,-73,-14,-74);ctx.quadraticCurveTo(0,-73,1,-57);ctx.bezierCurveTo(1,-75,19,-81,23,-73);ctx.quadraticCurveTo(22,-61,0,-56);});
      ellipse(0,-2,28,17,colors.mintLight);
      friendlyFace(active||action==='hug'||action==='roll'||cuddle>.8);
      const arm=active||story==='study'||story==='pillow'||action==='hug'||action==='roll';
      ellipse(-38,31,10,21,colors.mintLight,arm?.72:.18);
      ellipse(39,arm?16:31,10,22,colors.mintLight,arm?-.93:-.22);
      heart(-1,39,11,colors.mintLight);
      if(action==='star'&&starCount>0)star(-24,48,7,colors.moon,.3);
      ctx.restore();
    }
    function drawAstra(p) {
      const pos=friendPosition('astra',p), active=action==='astra'||action==='entry';
      ctx.save();ctx.translate(pos.x,pos.y+(active?-Math.sin(p*Math.PI)*6*S:0));ctx.scale(S,S);
      if(active)ctx.rotate(-Math.sin(p*Math.PI)*.08);ctx.rotate(poseAngle('astra'));
      ellipse(0,39,39,38,colors.astraShade);ellipse(0,34,38,37,colors.astra);
      ellipse(-22,73,16,9,colors.astraLight);ellipse(22,73,16,9,colors.astraLight);
      // A rounded star-shaped face, with very serious tiny spectacles.
      path(colors.astra,()=>{ctx.moveTo(-12,-58);ctx.quadraticCurveTo(0,-99,14,-58);ctx.quadraticCurveTo(19,-48,31,-46);ctx.quadraticCurveTo(73,-47,45,-19);ctx.quadraticCurveTo(37,-10,39,1);ctx.quadraticCurveTo(57,36,18,18);ctx.quadraticCurveTo(0,13,-18,20);ctx.quadraticCurveTo(-54,36,-40,1);ctx.quadraticCurveTo(-37,-11,-45,-19);ctx.quadraticCurveTo(-72,-48,-32,-46);ctx.quadraticCurveTo(-19,-47,-12,-58);ctx.closePath();});
      ellipse(0,-13,34,29,colors.astraLight);
      friendlyFace(active||action==='hug'||cuddle>.8,true);
      const reach=active||story==='rainbow'||story==='pillow'||action==='roll'||action==='hug';
      ellipse(-37,reach?16:33,10,21,colors.astraLight,reach?.92:.26);
      ellipse(37,33,10,20,colors.astraLight,-.22);
      star(0,41,11,colors.moon,.1);
      // The orbit is embroidery, not a loading indicator.
      path(null,()=>{ctx.ellipse(0,-68,28,8,-.22,.1,Math.PI*1.3);},colors.moonLight,1.5);
      star(25,-77,6,colors.moon,.2);
      if(active&&!sleeping){star(58,-44,5+Math.sin(p*Math.PI)*3,colors.moon,.1);star(50,-67,3,colors.moonLight);}
      ctx.restore();
    }

    // A little storybook guest, recognizable by his curls, cravat and book.
    // These are imagined quiet gestures, not attributed historical quotations.
    function drawNewton(p){
      const pos=newtonPosition(p),active=action==='newton'||action==='entry';
      const shy=active?Math.sin(p*Math.PI):0;
      ctx.save();ctx.translate(pos.x,pos.y-shy*3*S);ctx.scale(S,S);ctx.rotate(-cuddle*.065-shy*.045+poseAngle('newton'));
      ellipse(0,37,35,43,colors.robeShade);ellipse(-2,32,34,42,colors.robe);
      ellipse(-19,77,16,8,colors.robeLight);ellipse(19,77,16,8,colors.robeLight);
      ellipse(0,-28,39,47,colors.hairShade);
      [[-26,-60,12],[-11,-69,12],[5,-72,12],[22,-64,13],[33,-48,11],[-34,-42,11],[-33,-22,11],[33,-23,11],[-31,-3,11],[31,-2,11]].forEach(([x,y,r])=>ellipse(x,y,r,r+1,colors.hair));
      ellipse(0,0,10,15,colors.skin);ellipse(0,-31,27,33,colors.skin);ellipse(-6,-36,18,22,colors.skinLight);
      // Curled fringe and side ringlets frame a clear, unobscured face.
      [[-22,-57,10],[-7,-63,10],[9,-65,10],[24,-56,10]].forEach(([x,y,r],i)=>{ellipse(x,y,r,r,colors.hair);path(null,()=>{ctx.arc(x-1,y-1,r*.48,-2.4,1.5);},colors.hairLight,1.2);});
      [[-33,-25],[-32,-6],[32,-24],[31,-5]].forEach(([x,y])=>path(null,()=>{ctx.arc(x,y,5,-2.2,1.9);},colors.hairLight,1.2));
      if(sleeping){path(null,()=>{ctx.moveTo(-18,-30);ctx.quadraticCurveTo(-13,-26,-8,-30);ctx.moveTo(8,-30);ctx.quadraticCurveTo(13,-26,18,-30);},colors.ink,1.8);}
      else if(active||cuddle>.7){path(null,()=>{ctx.moveTo(-18,-29);ctx.quadraticCurveTo(-13,-34,-8,-29);ctx.moveTo(8,-29);ctx.quadraticCurveTo(13,-34,18,-29);},colors.ink,1.8);}
      else{const look=story==='study'?-2:story==='rainbow'?2:0;ellipse(-13+look,-31,2.5,3.5,colors.ink);ellipse(13+look,-31,2.5,3.5,colors.ink);}
      ctx.globalAlpha=.42+shy*.45+cuddle*.15;ellipse(-18,-20,7,3.5,colors.blush);ellipse(18,-20,7,3.5,colors.blush);ctx.globalAlpha=1;
      path(null,()=>{ctx.moveTo(-4,-13);ctx.quadraticCurveTo(0,-9-shy,5,-14);},colors.ink,1.3);
      // A soft white cravat, a blue robe, and a thumb marking his page.
      path(colors.robeShade,()=>{ctx.moveTo(-26,8);ctx.lineTo(-6,33);ctx.lineTo(-8,7);ctx.closePath();ctx.moveTo(26,8);ctx.lineTo(6,33);ctx.lineTo(8,7);ctx.closePath();});
      ellipse(-8,10,9,7,colors.furLight,.35);ellipse(8,10,9,7,colors.furLight,-.35);
      path(colors.furLight,()=>{ctx.moveTo(-6,11);ctx.lineTo(6,11);ctx.lineTo(10,30);ctx.quadraticCurveTo(0,35,-9,29);ctx.closePath();});
      line(-1,16,1,27,colors.furShade,.9);
      ellipse(-28,33,10,23,colors.robeLight,.24);ellipse(27,33,10,22,colors.robeLight,-.2);
      ellipse(-28,48,9,8,colors.skinLight);ellipse(28,48,9,8,colors.skinLight);
      if((!story||story==='pillow')&&kind!=='cinema'){ctx.save();ctx.translate(23+cuddle*8,35);ctx.rotate(.15+cuddle*.13);
      rounded(-12,-12,42,30,4,colors.hairShade);rounded(-9,-13,37,26,3,colors.moonLight);line(-6,-7,22,-7,colors.pocketShade,.8);line(-6,-2,20,-2,colors.pocketShade,.8);line(-6,3,14,3,colors.pocketShade,.8);line(-4,-13,-4,13,colors.hairLight,1.2);
      path(colors.pink,()=>{ctx.moveTo(17,-14);ctx.lineTo(23,-14);ctx.lineTo(23,8);ctx.lineTo(20,5);ctx.lineTo(17,8);ctx.closePath();});
      ellipse(-9,8,5,8,colors.skinLight,-.3);ctx.restore();}ctx.restore();
    }
    function drawLapTail(p){
      if(cuddle<.01)return;
      const wp=wolfPosition(),np=newtonPosition(p);ctx.save();ctx.globalAlpha=cuddle;
      const wag=action==='pet'?Math.sin(p*Math.PI*8)*3*S:0;
      path(colors.furShade,()=>{ctx.moveTo(wp.x+32*S,cy+49*S);ctx.bezierCurveTo(wp.x+85*S,cy+14*S,np.x+49*S,cy+13*S,np.x+47*S,cy+37*S+wag);ctx.bezierCurveTo(np.x+44*S,cy+63*S+wag,wp.x+61*S,cy+76*S,wp.x+32*S,cy+49*S);ctx.closePath();});
      path(colors.furLight,()=>{ctx.moveTo(np.x+15*S,cy+28*S);ctx.quadraticCurveTo(np.x+54*S,cy+13*S,np.x+47*S,cy+37*S+wag);ctx.quadraticCurveTo(np.x+43*S,cy+57*S,np.x+13*S,cy+57*S);ctx.lineTo(np.x+20*S,cy+46*S);ctx.lineTo(np.x+9*S,cy+43*S);ctx.lineTo(np.x+22*S,cy+35*S);ctx.closePath();});
      ellipse(np.x+10*S,cy+36*S,8*S,6*S,colors.skinLight,-.2);ctx.restore();
    }

    function rounded(x,y,w,h,r,fill){path(fill,()=>ctx.roundRect(x,y,w,h,r));}
    function drawQuilt(){
      if(!sleeping)return;
      const edge=234*S,y=cy+17*S;
      path(colors.quiltDark,()=>{ctx.moveTo(cx-edge,y+10*S);ctx.quadraticCurveTo(cx,y-18*S,cx+edge,y+10*S);ctx.lineTo(cx+edge+5*S,y+89*S);ctx.quadraticCurveTo(cx,y+103*S,cx-edge-5*S,y+89*S);ctx.closePath();});
      path(colors.quilt,()=>{ctx.moveTo(cx-edge,y+4*S);ctx.quadraticCurveTo(cx,y-19*S,cx+edge,y+4*S);ctx.lineTo(cx+edge,y+80*S);ctx.quadraticCurveTo(cx,y+95*S,cx-edge,y+80*S);ctx.closePath();});
      ctx.globalAlpha=.24;[-185,-125,-65,0,65,125,185].forEach(x=>line(cx+x*S,y+7*S,cx+(x+5)*S,y+78*S,colors.thread,1));ctx.globalAlpha=1;
      [[-201,33],[-143,65],[-81,30],[-17,62],[49,34],[113,66],[191,31]].forEach(([x,yy],i)=>star(cx+x*S,y+yy*S,(i%2?4:6)*S,colors.moonLight,i*.25));
      path(null,()=>{ctx.moveTo(cx-edge,y+7*S);ctx.quadraticCurveTo(cx,y-16*S,cx+edge,y+7*S);},colors.thread,4*S);
      const wp=wolfPosition();ellipse(wp.x-44*S,y-4*S,14*S,8*S,colors.furLight);ellipse(wp.x+42*S,y-4*S,14*S,8*S,colors.furLight);
    }
 function seatShift(who){
  if(sleeping||!story)return{x:0,y:0};
  const n=(beat===0?phase:1),offset=story==='bloom'?{gpt:[16,7],astra:[-12,6],newton:[-4,0]}:story==='cocoa'?{gpt:[10,0],astra:[-10,0]}:{};
  const v=offset[who]||[0,0];return{x:v[0]*n,y:v[1]*n};
 }
 function poseAngle(who){return sleeping?0:story==='bloom'?(who==='gpt'?.07:who==='astra'?-.06:0):story==='wave'?(who==='gpt'?-.05:who==='astra'?.07:0):0;}
 function textLabel(s,x,y,size=12,col='#aaafc3'){ctx.fillStyle=col;ctx.font=`${size}px system-ui, sans-serif`;ctx.textAlign='center';ctx.fillText(s,x,y);}
 function world(fn){ctx.save();ctx.translate(cx,cy);ctx.scale(S,S);fn();ctx.restore();}
 function stars(now){
  for(let i=0;i<35;i++){const x=12+(i*109.31)%(W-24),y=16+(i*43.17)%(H*.45),f=!reduced.matches&&now<ambientUntil?.64+.24*Math.sin(now/1900+i):.6;ctx.globalAlpha=f*(.28+(i%3)*.13);i%6===0?star(x,y,2.5,'#d7c4a5',i):ellipse(x,y,1,1,'#c6d2ea');}ctx.globalAlpha=1;
 }
 function leaf(x,y,s,col,tilt=0){ctx.save();ctx.translate(x,y);ctx.rotate(tilt);path(col,()=>{ctx.moveTo(0,0);ctx.quadraticCurveTo(-s,-s*1.3,0,-s*2);ctx.quadraticCurveTo(s,-s*.9,0,0);});line(0,-2,0,-s*1.7,'#a1bead',.7);ctx.restore();}
 function flowerPot(x,y,open=1,scale=1){
  ctx.save();ctx.translate(x,y);ctx.scale(scale,scale);
  rounded(-21,0,42,30,9,'#7c6268');rounded(-24,-3,48,9,4,'#b19089');ellipse(0,0,18,4,'#40383d');
  line(0,0,0,-42,'#83bbaa',3);leaf(0,-10,11,'#89bc9f',-1);leaf(0,-22,9,'#acc8a8',1);
  if(open<.1)ellipse(0,-44,7,11,'#e0d0ab');else{glow(0,-47,32,'#f4dba3',.08);for(let i=0;i<6;i++){const a=i*Math.PI/3;ellipse(Math.cos(a)*9*open,-47+Math.sin(a)*9*open,8,13*open+2,'#eadfc5',a-Math.PI/2);}ellipse(0,-47,6,6,'#d8b887');}
  path(null,()=>{ctx.moveTo(-4,12);ctx.bezierCurveTo(-22,0,-14,25,0,14);ctx.bezierCurveTo(15,0,22,25,4,14);},'#ceb1ce',3);ctx.restore();
 }
 function greenhouse(now){
  const g=ctx.createLinearGradient(0,0,0,H);g.addColorStop(0,'#091b25');g.addColorStop(1,'#142a30');ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
  stars(now);const roof=H*.09,foot=cy+62*S;
  rounded(14,roof,W-28,foot-roof,Math.min(W*.25,100),'#18323b');
  ctx.save();ctx.beginPath();ctx.roundRect(20,roof+5,W-40,foot-roof-11,Math.min(W*.24,95));ctx.clip();
  const pane=ctx.createLinearGradient(0,0,W,H);pane.addColorStop(0,'#102936');pane.addColorStop(.6,'#173442');pane.addColorStop(1,'#11242f');ctx.fillStyle=pane;ctx.fillRect(15,roof,W-30,foot-roof);
  const rainTime=!reduced.matches&&now<ambientUntil?now*.02:0;
  for(let i=0;i<66;i++){const x=16+(i*61.71)%(W-32),y=roof+((i*47.17+rainTime)%(foot-roof));ctx.globalAlpha=.13+(i%3)*.06;line(x,y,x-2,y+10,'#9fc9d2',1);if(i%11===0)ellipse(x,y,2,3,'#d5dce7');}ctx.globalAlpha=1;
  ellipse(W*.7,H*.19,21*S,21*S,'#d9d5b5');ellipse(W*.7+8*S,H*.19-5*S,19*S,19*S,'#173442');
  if(glassHeart||story==='heart'&&beat>=1){ctx.save();ctx.globalAlpha=.5;heart(W*.64,H*.22,21*S,'#c6a5bb');for(let i=0;i<4;i++)ellipse(W*.64+(i-1.5)*11*S,H*.22+26*S,2*S,2*S,'#d9c5aa');ctx.restore();}
  ctx.restore();
  [W*.26,W*.5,W*.74].forEach(x=>line(x,roof+12,x,foot,'#49636c',2));line(18,H*.33,W-18,H*.33,'#49636c',2);
  [21,W-21].forEach((x,j)=>{line(x,roof+14,x,foot,'#4b675d',3);for(let i=0;i<5;i++)leaf(x,roof+38+i*29,12,'#497868',j?-.8:.8);});
  ctx.fillStyle='#182e31';ctx.fillRect(0,foot,W,H-foot);world(()=>{ellipse(0,117,230,28,'#25433e');rounded(-231,-13,462,116,30,'#375655');rounded(-231,62,462,40,19,'#2b4347');});
 }
 function jelly(x,y,r,now,shade='#9ab9d3'){
  ctx.save();ctx.translate(x,y);glow(0,0,r*2.3,shade,.07);
  path(shade,()=>{ctx.moveTo(-r,0);ctx.bezierCurveTo(-r,-r*1.55,r,-r*1.55,r,0);ctx.quadraticCurveTo(0,r*.28,-r,0);});
  for(let i=0;i<5;i++){const xx=(i-2)*r*.31,d=Math.sin(now/1200+i)*r*.12;path(null,()=>{ctx.moveTo(xx,2);ctx.bezierCurveTo(xx+d,r*.5,xx-d,r,xx+d,r*1.35);},shade,1.2);}
  ellipse(-r*.28,-r*.2,r*.055,r*.08,'#304559');ellipse(r*.28,-r*.2,r*.055,r*.08,'#304559');ctx.restore();
 }
 function train(now){
  ctx.fillStyle='#111c2b';ctx.fillRect(0,0,W,H);const drift=!reduced.matches&&now<ambientUntil?Math.sin(now/5200)*W*.025:0;
  rounded(16,22,W-32,H*.56,32,'#4b5266');rounded(23,29,W-46,H*.56-14,26,'#0b2b3e');
  ctx.save();ctx.beginPath();ctx.roundRect(25,31,W-50,H*.56-18,24);ctx.clip();
  const water=ctx.createLinearGradient(0,20,0,H*.64);water.addColorStop(0,'#163d51');water.addColorStop(1,'#0a2336');ctx.fillStyle=water;ctx.fillRect(20,25,W-40,H*.6);
  for(let i=0;i<8;i++){ctx.globalAlpha=.035;path('#b0d5d6',()=>{ctx.moveTo(W*.12+i*72,-5);ctx.lineTo(W*.25+i*72,H*.58);ctx.lineTo(W*.35+i*72,H*.58);ctx.lineTo(W*.19+i*72,-5);});}ctx.globalAlpha=1;
  const jx=story==='wave'?cx+Math.sin((beat+phase)*.6)*W*.2:W*.29+drift;
  jelly(jx,H*.24,25*S,now,'#9bb8d3');jelly(W*.75-drift,H*.31,14*S,now+300,'#b1a7d2');
  for(let i=0;i<15;i++){const x=30+(i*72.57)%(W-60),y=40+(i*37.3)%(H*.4);ctx.globalAlpha=.28;path(null,()=>ctx.ellipse(x+drift*.15,y,2+(i%3),2+(i%3),0,0,Math.PI*2),'#96c6d2',1);}ctx.globalAlpha=1;
  for(let i=0;i<5;i++){const x=i*W/4;path('#102d3c',()=>{ctx.moveTo(x,H*.64);ctx.quadraticCurveTo(x+15,H*.35,x+37,H*.5);ctx.lineTo(x+48,H*.64);});}ctx.restore();
  [W*.34,W*.66].forEach(x=>{rounded(x-4,24,8,H*.55,4,'#545e70');line(x-1,30,x-1,H*.56,'#8992a1',1);});
  rounded(cx-65,8,130,28,9,'#303c52');textLabel(story==='ride'&&beat===2?'DREAM BAY':'MOON EXPRESS',cx,27,11,'#d1c6ad');
  ctx.fillStyle='#253347';ctx.fillRect(0,cy+72*S,W,H);world(()=>{rounded(-235,-4,470,111,25,'#384f68');rounded(-230,66,460,39,17,'#2c3f58');line(-212,111,-212,135,'#6b7381',5);line(212,111,212,135,'#6b7381',5);});
 }
 function comet(now){
  const sky=ctx.createLinearGradient(0,0,W,H);sky.addColorStop(0,'#10152b');sky.addColorStop(.65,'#24213c');sky.addColorStop(1,'#302438');ctx.fillStyle=sky;ctx.fillRect(0,0,W,H);stars(now);
  const mx=W*.78,my=H*.2;glow(mx,my,65*S,'#a792b3',.1);ellipse(mx,my,24*S,24*S,'#aa9aaa');path(null,()=>ctx.ellipse(mx,my,42*S,10*S,-.32,0,Math.PI*2),'#8f839f',3*S);
  const progress=story==='catch'||story==='cocoa'?Math.min(1,(beat+phase)/3):.47,x=W*(.16+progress*.44),y=H*(.13+progress*.12);
  const tail=ctx.createLinearGradient(x-120*S,y-29*S,x,y);tail.addColorStop(0,'#b9a0cc00');tail.addColorStop(1,'#dfc6b8');path(tail,()=>{ctx.moveTo(x,y);ctx.quadraticCurveTo(x-55*S,y-15*S,x-135*S,y-38*S);ctx.quadraticCurveTo(x-45*S,y+6*S,x,y+4*S);});glow(x,y,23*S,'#e2c9af',.12);star(x,y,7*S,'#e2c9af',.3);
  ellipse(cx,H+77*S,W*.75,H*.63,'#332e46');ellipse(cx,H+103*S,W*.76,H*.65,'#3e354e');
  world(()=>{ellipse(0,79,241,57,'#4f455f');ellipse(0,78,233,49,'#736479');ctx.save();ctx.beginPath();ctx.ellipse(0,78,228,45,0,0,Math.PI*2);ctx.clip();ctx.globalAlpha=.25;for(let i=-220;i<=220;i+=34){line(i,20,i,135,'#bfa2ad',10);line(-230,i/4+68,230,i/4+68,'#bfa2ad',6);}ctx.restore();});
 }
 function drawCup(x,y,col,p=0){ctx.save();ctx.translate(x,y);ctx.scale(S,S);path(null,()=>ctx.ellipse(13,2,7,8,0,0,Math.PI*2),col,3);rounded(-13,-9,26,27,7,col);ellipse(0,-8,10,3,'#684e53');star(0,-10,4,'#e5d6b9',.2);path(null,()=>{ctx.moveTo(-3,-17);ctx.quadraticCurveTo(-8,-22,-3+p,-28);},'#c3b0aa',1);ctx.restore();}
 function bottle(x,y,lit=true,scale=1){ctx.save();ctx.translate(x,y);ctx.scale(S*scale,S*scale);rounded(-17,-11,34,41,11,'#46536a');rounded(-7,-25,14,20,4,'#46536a');rounded(-9,-29,18,8,3,'#a69083');path(null,()=>{ctx.moveTo(-10,-7);ctx.lineTo(-10,14);},'#a1aabb',2);if(lit){glow(0,7,22,'#e7c493',.22);star(0,6,8,'#f0cf98',.2);}ctx.restore();}
 function inkBottle(x,y,filled=true,scale=1,lid=true,tint='#5475b1'){
  ctx.save();ctx.translate(x,y);ctx.scale(scale,scale);
  rounded(-24,-24,48,46,13,'#495775');rounded(-13,-34,26,16,4,'#546181');
  if(filled){const g=ctx.createLinearGradient(-15,-18,17,20);g.addColorStop(0,tint);g.addColorStop(.43,'#344a84');g.addColorStop(.72,'#967b9d');g.addColorStop(1,'#6c9d9b');rounded(-20,-17,40,34,9,g);path(null,()=>{ctx.moveTo(-16,1);ctx.bezierCurveTo(-3,-12,4,19,18,-1);},'#94b1bd',1);}
  line(-17,-17,-17,8,'#bbc7da',2);ellipse(10,-18,4,2,'#92a5c7');
  if(lid){rounded(-16,-40,32,11,4,'#b8a28a');line(-11,-35,11,-35,'#dac7ac',1);}
  rounded(-13,-6,26,22,5,'#c7bdd0');ellipse(0,4,7,7,'#72789d');ellipse(3,1,6,6,'#c7bdd0');ctx.restore();
 }




 // Episode 22: the cloud dryer. Objects and warmth belong to this visit;
 // the scene itself stays in the album, without a new account-save requirement.
 const dryerReplies={
  drum:['圆窗里的云翻了个身，慢慢伸出两片小鳍。原来有一只云鲸在这里烘尾巴，嘴边还挂着一颗星星。','云鲸把尾巴卷成一个软软的圈，给自己盖上小被角。它示意你：旁边那一床，已经给你留好啦。'],
  towel:['叠好的毛巾忽然抬起圆脑袋，露出两只短短的小鳍。毛巾海豹伸了个懒腰，肚皮还是一条整齐的折痕。','海豹把自己折回一半，又忍不住探出鼻尖。GPT 替它把毛巾角掖好：这位住客喜欢方方正正地睡。'],
  sock:['晾着的袜子竖起两只长耳朵，一只袜子兔悄悄探出头。它的尾巴是刚烘出来的一小团棉花。','袜子兔把长耳朵搭到晾衣绳上，自己在下面晃了一下。Astra 扶好眼镜：原来刚才晾着的是兔耳朵。'],
  basket:['篮子里的线团顶起一张小脸，原来是一只羊毛刺猬。它把每一根刺都套上了软软的毛线帽。','羊毛刺猬推来一颗绒球，又把自己缩回篮子里。小狼轻轻接住：今晚的小礼物，摸起来一点也不扎。'],
  jar:['玻璃罐里的棉花忽然张开两片翅膀，一只月亮绒蛾停在瓶口。它的翅膀边缘，像刚刚剪好的云。','绒蛾把翅膀拢成一个爱心，又贴回瓶口。牛顿低头看了看，给这位小住客让出一小块月光。'],
  lantern:['灯罩里亮起几双小眼睛。几只萤火虫抱着迷你灯笼，原来整盏灯是一间轮班的小宿舍。','萤火虫把灯笼放低一点，排成一弯小月亮。最小的那只打了个哈欠，被旁边的同伴接住了。']
 };
 function dryerSpots(){
  const u=Math.min(1,W/520,H/430),size=n=>Math.max(44,n*u);
  return{towel:{x:W*.15,y:H*.20,w:size(112),h:size(90)},sock:{x:W*.84,y:H*.18,w:size(92),h:size(100)},drum:{x:W*.5,y:H*.27,w:W*.28,h:H*.28},basket:{x:W*.15,y:H*.47,w:size(112),h:size(92)},jar:{x:W*.5,y:H*.50,w:size(88),h:size(60)},lantern:{x:W*.85,y:H*.47,w:size(90),h:size(92)}};
 }
 function positionDryerHotspots(){if(kind!=='dryer')return;for(const[name,v]of Object.entries(dryerSpots())){const b=root.querySelector('[data-action="'+name+'"]');if(b){b.style.left=v.x+'px';b.style.top=v.y+'px';b.style.width=v.w+'px';b.style.height=v.h+'px';}}}
 function dryerAction(name){
  if(!dryerReplies[name]&&!['warm','hint','reset','dim'].includes(name))return false;
  if(name==='dim'){dryerDim=!dryerDim;root.querySelector('[data-action="dim"]').setAttribute('aria-pressed',String(dryerDim));caption.textContent=dryerDim?'小灯调暗了，圆窗里还留着一圈蜂蜜色。靠近一点就看得见。':'小灯亮起一点，照着四个挨在一起的脑袋。';requestDraw();return true;}
  if(sleeping){caption.textContent='云朵被子已经掖好，小住客们也歇下了。让它们陪你安静地睡一会。';return true;}
  if(name==='warm'){start(name);return true;}
  clearWork();const now=performance.now();
  if(name==='reset'){dryerFound.clear();for(const key of Object.keys(dryerVisits))delete dryerVisits[key];root.dataset.discovered='';caption.textContent='毛巾叠好，袜子挂稳，小住客们又把自己藏了起来。暖被子还在，随时可以窝进去。';requestDraw();return true;}
  if(name==='hint'){const hidden=Object.keys(dryerReplies).filter(k=>!dryerFound.has(k)),choices=hidden.length?hidden:Object.keys(dryerReplies);dryerHint=choices[Math.floor(Math.random()*choices.length)];root.dataset.hint=dryerHint;caption.textContent='Astra 把眼镜往上推了一点：那边有个小东西，好像刚刚动了一下。';until=now+2300;later(()=>{dryerHint='';root.dataset.hint='';requestDraw();},2200);requestDraw();return true;}
  dryerFound.add(name);dryerVisits[name]=(dryerVisits[name]||0)+1;dryerActive=name;dryerAt=now;root.dataset.secret=name;root.dataset.discovered=[...dryerFound].join(',');caption.textContent=dryerReplies[name][(dryerVisits[name]-1)%2];until=now+2800;later(()=>{dryerActive='';root.dataset.secret='';requestDraw();},2700);requestDraw();return true;
 }
 function dryerFace(x,y,asleep=false){
  if(asleep){path(null,()=>{ctx.moveTo(x-8,y);ctx.quadraticCurveTo(x-5,y+3,x-2,y);ctx.moveTo(x+2,y);ctx.quadraticCurveTo(x+5,y+3,x+8,y);},'#4b4657',1.4);}else{ellipse(x-5,y,1.4,2,'#4b4657');ellipse(x+5,y,1.4,2,'#4b4657');}
  ellipse(x-11,y+4,3,1.5,'#d3aab1');ellipse(x+11,y+4,3,1.5,'#d3aab1');
 }
 function dryerObject(name,v,now){
  const u=Math.min(1,W/520,H/430),found=dryerFound.has(name),active=dryerActive===name&&!sleeping;
  const t=active?(reduced.matches?1:Math.min(1,(now-dryerAt)/2600)):1,bob=active&&!reduced.matches?Math.sin(t*Math.PI*4)*(1-t)*5:0;
  ctx.save();ctx.translate(v.x,v.y);ctx.scale(u,u);
  if(dryerHint===name){glow(0,0,58,'#f1d59c',.25);path(null,()=>ctx.roundRect(-49,-44,98,88,15),'#e2c69c',1.3);}
  ctx.translate(0,bob);
  if(name==='towel'){
   rounded(-39,8,78,19,8,'#7caaa1');rounded(-34,-7,68,18,8,'#aecac1');rounded(-29,-22,58,17,8,'#d6dbcb');
   if(found){ellipse(0,-20,28,17,'#e2e1ce');ellipse(-29,-5,13,5,'#d0d6c5',-.3);ellipse(29,-5,13,5,'#d0d6c5',.3);dryerFace(0,-23,sleeping);ellipse(0,-17,2,1.4,'#746276');}
   else{line(-22,-15,23,-15,'#b3c3b6',1);line(-26,1,27,1,'#88b1a6',1);}
  }else if(name==='sock'){
   line(-47,-43,46,-38,'#bcb097',1.5);rounded(-11,-44,6,13,2,'#c5a786');
   if(!found){path('#aa9cc1',()=>{ctx.moveTo(-24,-31);ctx.lineTo(8,-31);ctx.lineTo(8,4);ctx.quadraticCurveTo(42,4,37,22);ctx.quadraticCurveTo(32,34,7,27);ctx.lineTo(-24,13);ctx.closePath();});rounded(-27,-33,38,12,3,'#d2c7dc');star(-8,-7,6,'#e5cea4');}
   else{ellipse(-12,-22,8,24,'#c7bad4',-.1);ellipse(10,-20,8,25,'#c7bad4',.15);ellipse(0,15,27,25,'#c7bad4');ellipse(23,30,9,9,'#eee1d5');ellipse(-12,35,10,5,'#e0d3e2');ellipse(8,35,10,5,'#e0d3e2');dryerFace(0,9,sleeping);ellipse(0,16,2,1.4,'#8c6e88');}
  }else if(name==='basket'){
   if(found){for(let i=0;i<9;i++){const a=Math.PI+i*Math.PI/8;ellipse(Math.cos(a)*28,-4+Math.sin(a)*24,10,13,['#aebbb2','#c4a9b7','#b9b4ce'][i%3],a);}ellipse(0,0,26,22,'#c5b49d');ellipse(0,4,20,15,'#e5d9bd');dryerFace(0,1,sleeping);ellipse(0,8,2,2,'#61505b');}
   else{ellipse(-22,0,17,17,'#b7c7bc');ellipse(17,-6,20,20,'#c4a9b7');ellipse(0,7,19,18,'#bab6ce');}
   path('#8c7166',()=>{ctx.moveTo(-40,7);ctx.lineTo(40,7);ctx.lineTo(32,34);ctx.quadraticCurveTo(0,44,-32,34);ctx.closePath();});rounded(-43,4,86,9,4,'#bd9e80');for(let i=-25;i<30;i+=13)line(i,14,i,33,'#b3957e',1);line(-35,24,35,24,'#b3957e',1);
   if(found)ellipse(39,31,8,8,'#cec5d6');
  }else if(name==='jar'){
   rounded(-22,-17,44,39,10,'#6c858c');rounded(-18,-13,36,31,8,'#aebdb8');line(-14,-7,-14,10,'#d2d7cb',2);
   if(found){ellipse(-14,-13,16,11,'#e3d9c2',-.5);ellipse(14,-13,16,11,'#e3d9c2',.5);ellipse(0,-13,4,11,'#bfa4b1');line(-2,-23,-7,-29,'#d0bcb5',1);line(2,-23,7,-29,'#d0bcb5',1);}
   else{cloud(1,1,29,19,'#e5dfcd');rounded(-24,-22,48,8,3,'#b7a18a');}
  }else if(name==='lantern'){
   const dim=dryerDim||sleeping;glow(0,0,65,'#edca91',dim?.06:.17);
   path(null,()=>ctx.arc(0,-29,11,Math.PI,0),'#b99c7a',2);rounded(-25,-30,50,66,18,'#9d7d68');rounded(-20,-24,40,54,15,dim?'#80765f':'#c5ab7f');rounded(-29,31,58,7,4,'#b49a7b');
   if(found){for(let i=0;i<3;i++){const x=-12+i*12,y=(i===1?-9:6)+bob*(i%2?1:-1);ellipse(x-3,y,3,5,'#d9d7b7',-.6);ellipse(x+3,y,3,5,'#d9d7b7',.6);ellipse(x,y+2,2.5,4,dim?'#c7b58b':'#f5de9d');}}
   else{ellipse(0,3,10,14,dim?'#b7a582':'#edd39e');ellipse(4,-1,10,12,dim?'#80765f':'#c5ab7f');}
  }
  ctx.restore();
 }
 function cloudDryer(now){
  const bg=ctx.createLinearGradient(0,0,0,H);bg.addColorStop(0,'#142732');bg.addColorStop(1,'#1d293b');ctx.fillStyle=bg;ctx.fillRect(0,0,W,H);
  stars(now);const floor=H*.61;ctx.fillStyle='#343b40';ctx.fillRect(0,floor,W,H-floor);for(let i=1;i<6;i++)line(0,floor+i*31,W,floor+i*31,'#444747',1);
  // The softly rounded dryer is also a window into a pocket of moonlit sky.
  const x=W*.5,y=H*.27,r=Math.min(W*.132,H*.17),warm=story==='warm';
  rounded(x-r-14,y-r-25,2*r+28,2*r+49,22,'#567c79');rounded(x-r-8,y-r-19,2*r+16,2*r+37,18,'#749a91');
  ellipse(x+r-8,y-r-10,3,3,'#e0c190');line(x-r+7,y-r-10,x-r+29,y-r-10,'#b2c5b5',2);
  ellipse(x,y,r+4,r+4,'#bfa889');ellipse(x,y,r-2,r-2,'#26374b');
  ctx.save();ctx.beginPath();ctx.arc(x,y,r-5,0,Math.PI*2);ctx.clip();
  glow(x,y,r,'#e1c591',sleeping||dryerDim?.04:warm?.17:.09);
  for(let i=0;i<9;i++){const a=i*2.4+(warm&&!reduced.matches&&now<until?now/4500:0);star(x+Math.cos(a)*r*.72,y+Math.sin(a)*r*.72,2,'#cfbc9c',a);}
  if(dryerFound.has('drum'))tinyWhale(x-r*.12,y+6,r/94,0);
  else{cloud(x,y+8,r*1.52,r*.72,'#d9ddd3');ctx.save();ctx.translate(x,y+5);ctx.scale(r/60,r/60);dryerFace(0,0,true);ctx.restore();}
  ctx.restore();path(null,()=>ctx.arc(x,y,r-8,3.5,4.6),'#d8c5a8',2);
  if(warm&&beat===1&&!sleeping){const rise=reduced.matches?0:phase*14;for(let i=0;i<3;i++)cloud(x+(i-1)*r*.6,y-r-28-rise-i*4,22,13,'#aebdb6');}
  // Two shelves, a drying line, and an unhurried sofa below them.
  const spots=dryerSpots();for(const name of ['towel','basket','jar','lantern']){const v=spots[name];rounded(v.x-v.w*.52,v.y+v.h*.39,v.w*1.04,7,3,'#977f70');}
  for(const[name,v]of Object.entries(spots))if(name!=='drum')dryerObject(name,v,now);
  if(dryerHint==='drum')path(null,()=>ctx.arc(x,y,r+9,0,Math.PI*2),'#e6ca96',2);
  world(()=>{ellipse(0,118,241,25,'#414247');rounded(-238,-2,476,112,34,'#6d7b79');rounded(-231,65,462,42,19,'#516864');rounded(-233,8,38,95,19,'#8c9c8d');rounded(195,8,38,95,19,'#8c9c8d');line(-214,106,-218,129,'#b89c7e',5);line(214,106,218,129,'#b89c7e',5);});
 }
 function dryerProps(){
  if(sleeping)return;
  // A single mint towel wraps the familiar wolf; the face stays untouched.
  const w=wolfPosition();ctx.save();ctx.translate(w.x,w.y);ctx.rotate(cuddle*.06);ctx.scale(S,S);path('#a4c8bb',()=>{ctx.moveTo(-55,17);ctx.quadraticCurveTo(0,37,51,18);ctx.lineTo(48,69);ctx.quadraticCurveTo(-2,83,-52,67);ctx.closePath();});path(null,()=>{ctx.moveTo(-51,23);ctx.quadraticCurveTo(0,43,48,24);},'#d1ddcb',3);ctx.restore();
  if(dryerWarm||story==='warm')world(()=>{const puff=dryerWarm||beat===2?1:beat===1?.7:.3;cloud(0,102,180,35+12*puff,'#c5bed4');for(let i=0;i<4;i++)star(-57+i*38,99+(i%2)*5,5,'#ecdbb2');ellipse(-89,102,10,7,colors.mintLight);ellipse(88,102,9,7,colors.astraLight);});
 }

 const postReplies={
  stamp:['邮票的锯齿边轻轻抖了一下，竟然展开成两只邮票蝴蝶。翅膀上还留着小月亮和面值，它们已经把自己寄到你面前啦。','蝴蝶换到邮票册的另一角坐好，把两片纸翅收成一个小信封。GPT 低头看看：这封信，好像会自己找地方歇脚。'],
  spool:['薄荷色线团慢慢松开，里面居然是一只把自己盘成线轴的毛毛虫。它抬起圆圆的脑袋，脖子上还系着线尾打的小蝴蝶结。','毛毛虫伸了个很短的懒腰，把蝴蝶结挪到一边，再把自己盘好。小狼认真点头：这位包装员的下班方式很柔软。'],
  scale:['小秤盘里探出两颗毛茸茸的脑袋。两只松鼠各抱着一颗橡果，原来刚才一直在偷偷称谁的晚饭更重一点。','两只松鼠把橡果交换了一下，又把尾巴也塞进秤盘。小秤晃晃悠悠地停住，它们对看一眼，满意地抱紧晚饭。'],
  envelope:['信封的两个角缓缓展开，纸缝下面露出一双小眼睛。原来是一只纸鳐，邮票刚好贴在它的小翅膀上。','纸鳐把一边翅膀折起来，像在给你鞠一个软软的躬。Astra 也学着歪歪星星角，收到了，收到啦。'],
  inkwell:['墨水瓶口冒出一颗圆脑袋，接着伸出几条细细的小触手。一只墨绿小章鱼抱着羽毛笔，正好把自己当成了笔架。','章鱼轻轻摇了摇羽毛笔，吹出一颗心形墨泡。牛顿把信纸收远一点，小狼就在旁边看那颗小心心慢慢落稳。'],
  parcel:['包裹的纸盖打开了，里面竟然是一间袖珍蘑菇屋。暖暖的小窗亮起来，门边还有一双比米粒大不了多少的拖鞋。','蘑菇屋的小门开了一条缝，一位圆滚滚的小住户端出迷你茶杯。原来这一整件包裹，是搬来邮局住的小邻居。']
 };
 function postSpots(){
  const u=Math.min(1,W/520,H/430),size=n=>Math.max(44,n*u);
  return{stamp:{x:W*.16,y:H*.15,w:size(116),h:size(100)},scale:{x:W*.50,y:H*.15,w:size(116),h:size(100)},parcel:{x:W*.84,y:H*.15,w:size(116),h:size(100)},spool:{x:W*.16,y:H*.40,w:size(116),h:size(100)},envelope:{x:W*.50,y:H*.40,w:size(116),h:size(100)},inkwell:{x:W*.84,y:H*.40,w:size(116),h:size(100)}};
 }
 function positionPostHotspots(){if(kind!=='post')return;for(const [name,v]of Object.entries(postSpots())){const b=root.querySelector('[data-action="'+name+'"]');if(b){b.style.left=v.x+'px';b.style.top=v.y+'px';b.style.width=v.w+'px';b.style.height=v.h+'px';}}}
 function postAction(name){
  if(!postReplies[name]&&!['post','hint','reset'].includes(name))return false;
  if(sleeping){caption.textContent='小邮局已经把灯留小了，信件和小住客也歇好。等醒来一点，再拆开今晚的小秘密。';return true;}
  if(name==='post'){start(name);return true;}
  clearWork();const now=performance.now();
  if(name==='reset'){postFound.clear();for(const key of Object.keys(postVisits))delete postVisits[key];root.dataset.discovered='';caption.textContent='邮票放回册子，线团盘好，包裹也系上蝴蝶结。小狼轻轻捂眼：好啦，又可以偷偷找一次。'+(postmark?'月背邮戳已经收好了。':'');requestDraw();return true;}
  if(name==='hint'){
   const hidden=Object.keys(postReplies).filter(k=>!postFound.has(k)),choices=hidden.length?hidden:Object.keys(postReplies);postHint=choices[Math.floor(Math.random()*choices.length)];root.dataset.hint=postHint;
   const hints={stamp:'邮票的一角，好像自己翘起来了一点。',spool:'那团线怎么绕着绕着，绕出一个小脑袋的形状。',scale:'两个秤盘里，好像都藏着一点毛茸茸。',envelope:'信封的两角，刚刚是不是同时动了一下？',inkwell:'墨水瓶里的笔，好像有人在帮忙扶着。',parcel:'包裹里面，似乎有一小点暖光。'};
   caption.textContent='Astra 把一束小灯光挪过去：'+hints[postHint];until=now+2300;later(()=>{postHint='';root.dataset.hint='';requestDraw();},2200);requestDraw();return true;
  }
  postFound.add(name);postVisits[name]=(postVisits[name]||0)+1;root.dataset.discovered=[...postFound].join(',');postActive=name;postAt=now;root.dataset.secret=name;until=now+2800;caption.textContent=postReplies[name][(postVisits[name]-1)%2];later(()=>{postActive='';root.dataset.secret='';requestDraw();},2700);requestDraw();return true;
 }
 function postStamp(x,y,w,h,col,mark=true){
  ctx.save();ctx.translate(x,y);rounded(-w/2,-h/2,w,h,2,'#ddcfb8');
  for(let yy=-h/2+3;yy<h/2;yy+=6){ellipse(-w/2,yy,1.5,1.5,'#ddcfb8');ellipse(w/2,yy,1.5,1.5,'#ddcfb8');}
  for(let xx=-w/2+3;xx<w/2;xx+=6){ellipse(xx,-h/2,1.5,1.5,'#ddcfb8');ellipse(xx,h/2,1.5,1.5,'#ddcfb8');}
  rounded(-w/2+3,-h/2+3,w-6,h-6,1,col);
  if(mark){ellipse(-1,0,Math.min(w,h)*.21,Math.min(w,h)*.21,'#e6d7b2');ellipse(2,-2,Math.min(w,h)*.19,Math.min(w,h)*.19,col);}
  ctx.restore();
 }
 function postButterfly(x,y,span,warm=false){
  ctx.save();ctx.translate(x,y);ctx.scale(span,1);
  ctx.save();ctx.translate(-10,-2);ctx.rotate(-.28);postStamp(0,0,18,24,warm?'#b38d91':'#8e9eb5');ctx.restore();
  ctx.save();ctx.translate(10,-2);ctx.rotate(.28);postStamp(0,0,18,24,warm?'#c7a2a0':'#a1b5ac');ctx.restore();
  ellipse(0,1,3,12,'#786979');ellipse(0,-10,4,4,'#b9a7b9');line(-1,-13,-5,-18,'#c9b9c6',1);line(1,-13,5,-18,'#c9b9c6',1);ctx.restore();
 }
 function postSquirrel(x,y,mirror=false){
  ctx.save();ctx.translate(x,y);if(mirror)ctx.scale(-1,1);
  path('#a98a72',()=>{ctx.moveTo(5,12);ctx.bezierCurveTo(25,18,24,-9,12,-9);ctx.bezierCurveTo(1,-8,6,4,14,2);ctx.quadraticCurveTo(16,11,5,12);});
  ellipse(0,9,10,13,'#c4a080');ellipse(-1,11,6,8,'#ddc5a4');ellipse(-2,-4,11,10,'#c6a383');ellipse(-9,-12,4,6,'#bd9778');ellipse(4,-12,4,6,'#bd9778');
  ellipse(-3,-1,7,5,'#e2cbaa');ellipse(-7,-5,1.2,1.6,'#59535a');ellipse(1,-5,1.2,1.6,'#59535a');ellipse(-4,-1,1.7,1.2,'#766252');ctx.restore();
 }
 function postObject(name,v,now){
  const u=Math.min(1,W/520,H/430),found=postFound.has(name),active=postActive===name&&!sleeping,t=active?(reduced.matches?1:Math.min(1,(now-postAt)/2500)):1,w=active&&!reduced.matches?Math.sin(t*Math.PI*4)*(1-t):0,again=(postVisits[name]||0)%2===0;
  ctx.save();ctx.translate(v.x,v.y);ctx.scale(u,u);
  if(postHint===name){ctx.save();ctx.globalAlpha=.13;ellipse(0,0,49,40,'#e4c595');ctx.restore();path(null,()=>ctx.roundRect(-52,-44,104,88,11),'#d4b992',1.2);}
  if(name==='stamp'){
   ellipse(0,31,39,5,'#4b4055');rounded(-36,15,72,15,5,'#8c6f7b');rounded(-32,13,64,12,3,'#b09594');
   if(!found){for(let i=0;i<3;i++){ctx.save();ctx.translate(-15+i*14,5-i*3);ctx.rotate((i-1)*.12);postStamp(0,0,30,34,['#899e9a','#b28f9d','#8392ad'][i]);ctx.restore();}}
   else{postStamp(0,18,28,16,'#9a88a8');const flutter=active?.72+.18*Math.sin(t*Math.PI*8):.88;
    postButterfly(again?19:-18,-7+w*3,flutter,true);ctx.save();ctx.translate(again?-20:19,-4-w*2);ctx.scale(.78,.78);postButterfly(0,0,1,false);ctx.restore();
   }
  }else if(name==='spool'){
   ellipse(0,29,31,5,'#4d4355');
   if(!found){rounded(-20,-24,40,51,8,'#9fbbaa');ellipse(0,-23,27,7,'#c9b18d');ellipse(0,-23,8,3,'#9e8570');ellipse(0,26,28,7,'#bea180');for(let y=-15;y<24;y+=6)path(null,()=>{ctx.moveTo(-19,y);ctx.quadraticCurveTo(0,y+6,19,y);},'#d0d7b8',1.5);path(null,()=>{ctx.moveTo(19,17);ctx.quadraticCurveTo(43,9,43,26);ctx.quadraticCurveTo(41,35,30,29);},'#b9ccae',2);}
   else{ellipse(0,27,29,6,'#b89c7f');const extension=again?9:0;
    const pieces=[[-25,16],[-24,1],[-15,-12],[0,-17],[14,-9],[12,7],[1,12],[-6,3]];
    pieces.forEach(([x,y],i)=>{ellipse(x,y+w*(i%2?1:-1),9,9,i%2?'#a6c4a6':'#bbd0ad');if(i<5)ellipse(x-3,y+3,1.5,2,'#86a78f');});
    ellipse(20+extension,-9-w*2,13,12,'#c9d9b7');ellipse(16+extension,-11-w*2,1.5,2,'#566959');ellipse(25+extension,-11-w*2,1.5,2,'#566959');path(null,()=>{ctx.moveTo(18+extension,-5-w*2);ctx.quadraticCurveTo(21+extension,-2-w*2,24+extension,-5-w*2);},'#6f8266',1);
    line(16+extension,-19-w*2,14+extension,-26-w*2,'#8aa88c',1.4);line(25+extension,-19-w*2,28+extension,-25-w*2,'#8aa88c',1.4);ellipse(14+extension,-26-w*2,2,2,'#d4c4ad');ellipse(28+extension,-25-w*2,2,2,'#d4c4ad');
    path('#b990a4',()=>{ctx.moveTo(12,3);ctx.lineTo(2,-4);ctx.quadraticCurveTo(-2,6,12,3);ctx.lineTo(20,-4);ctx.quadraticCurveTo(24,6,12,3);});ellipse(12,3,2.4,3,'#d5afba');
   }
  }else if(name==='scale'){
   rounded(-27,28,54,9,5,'#8c7768');rounded(-21,24,42,8,4,'#c0a17c');line(0,27,0,-29,'#b69c77',5);ellipse(0,-29,5,5,'#d1b88d');
   const tilt=found?(again?-2:2)+w:0;
   line(-34,-20+tilt,34,-20-tilt,'#c8ac83',3);
   for(const [i,x]of [-31,31].entries()){
    const yy=i?-tilt:tilt;line(x-9,-20+yy,x-16,11+yy,'#a28f7c',1);line(x+9,-20+yy,x+16,11+yy,'#a28f7c',1);
    if(found)postSquirrel(x+(i?-1:1),-3+yy,i===1);
    path('#a78d74',()=>{ctx.moveTo(x-17,10+yy);ctx.quadraticCurveTo(x,30+yy,x+17,10+yy);ctx.closePath();});line(x-17,10+yy,x+17,10+yy,'#d3ba92',2);
   }
   if(!found){postStamp(-31,5,16,11,'#8b9b9b',false);star(31,5,7,'#d5c091');}
   else{const nutX=again?-10:10;ellipse(nutX,0,5,7,'#b79a70');ellipse(nutX,-4,6,3,'#866e5f');line(nutX,-6,nutX+1,-9,'#b79e7b',1);star(-nutX,2,5,'#e0c698',.1);}
  }else if(name==='envelope'){
   ellipse(0,30,42,5,'#524457');
   if(!found){ctx.save();ctx.rotate(-.07);rounded(-40,-22,80,50,4,'#d5c4aa');path('#e4d5bd',()=>{ctx.moveTo(-40,-22);ctx.lineTo(0,8);ctx.lineTo(40,-22);ctx.closePath();});path(null,()=>{ctx.moveTo(-39,27);ctx.lineTo(-8,4);ctx.moveTo(39,27);ctx.lineTo(8,4);},'#b39e8a',1);ellipse(0,7,6,6,'#a78398');star(0,7,3,'#e2c79f');postStamp(26,-8,15,18,'#8da9a3');ctx.restore();}
   else{ctx.save();ctx.translate(0,w*3);const lift=again?15:0;
    path('#c6b7a8',()=>{ctx.moveTo(-7,15);ctx.quadraticCurveTo(20,23,13,36);ctx.quadraticCurveTo(8,43,-1,39);ctx.quadraticCurveTo(12,35,-2,28);ctx.closePath();});
    path('#dfd0b8',()=>{ctx.moveTo(0,-18);ctx.quadraticCurveTo(-19,-25,-46,-27);ctx.quadraticCurveTo(-41,5,-16,20);ctx.quadraticCurveTo(0,31,16,20);ctx.quadraticCurveTo(39,3-lift,46,-27+lift);ctx.quadraticCurveTo(20,-23,0,-18);ctx.closePath();});
    path('#eee2c9',()=>{ctx.moveTo(0,-18);ctx.lineTo(-16,20);ctx.quadraticCurveTo(0,29,16,20);ctx.closePath();});
    line(-39,-21,-17,13,'#bca88f',1);line(37,-21+lift,17,13,'#bca88f',1);postStamp(-29,-9,16,17,'#9bb4ad');
    ellipse(-7,-6,1.6,2,'#6b6071');ellipse(7,-6,1.6,2,'#6b6071');path(null,()=>{ctx.moveTo(-3,1);ctx.quadraticCurveTo(0,4,3,1);},'#8c7483',1.1);ellipse(-12,0,3,1.5,'#cc9fa7');ellipse(12,0,3,1.5,'#cc9fa7');ctx.restore();}
  }else if(name==='inkwell'){
   ellipse(0,32,35,5,'#473f51');
   if(!found){rounded(-22,-4,44,34,10,'#527c73');rounded(-16,-17,32,16,4,'#75978a');rounded(-20,-22,40,9,3,'#b1997e');line(-14,2,-14,19,'#90b2a0',2);rounded(-13,5,26,16,3,'#c9c7ac');ellipse(0,13,5,5,'#828d80');ellipse(2,11,4,4,'#c9c7ac');}
   else{ctx.save();ctx.translate(0,w*1.7);
    for(const side of [-1,1]){path(null,()=>{ctx.moveTo(side*12,7);ctx.bezierCurveTo(side*23,24,side*34,30,side*41,17);ctx.moveTo(side*7,15);ctx.bezierCurveTo(side*15,33,side*28,36,side*31,27);},'#739c92',7);}
    ellipse(0,-5,20,23,'#79a297');ellipse(-5,-12,10,10,'#91b4a4');ellipse(-8,-5,2,2.5,'#355b59');ellipse(8,-5,2,2.5,'#355b59');path(null,()=>{ctx.moveTo(-4,3);ctx.quadraticCurveTo(0,7,4,3);},'#446c65',1.3);
    rounded(-23,19,46,12,5,'#557c74');rounded(-13,21,26,8,2,'#bdc0a7');star(0,25,3,'#788e7e');
    line(26,17,34,-26,'#c6bc9b',1.5);path('#b6b7c5',()=>{ctx.moveTo(29,-2);ctx.quadraticCurveTo(18,-29,37,-38);ctx.quadraticCurveTo(43,-17,29,-2);ctx.closePath();});line(29,-2,36,-33,'#e0d6c9',1);ellipse(26,17,5,5,'#91b3a5');
    if(again){heart(-30,-25,8,'#a7bac3');ellipse(-33,-30,2,1,'#d9dfd1');}ctx.restore();}
  }else if(name==='parcel'){
   ellipse(0,35,43,5,'#4e4151');rounded(-37,-18,74,51,5,'#ac8e76');rounded(-35,-19,70,47,4,'#c9ab8a');
   if(!found){rounded(-40,-23,80,11,3,'#d9bd98');line(-8,-23,-8,30,'#e9d4ae',3);line(-36,8,36,8,'#e9d4ae',3);path(null,()=>{ctx.moveTo(-8,-19);ctx.bezierCurveTo(-35,-42,-27,-8,-8,-19);ctx.bezierCurveTo(11,-42,20,-8,-8,-19);},'#e9d4ae',2);postStamp(20,-1,19,22,'#a08d9f');}
   else{
    path('#d3b795',()=>{ctx.moveTo(-36,-18);ctx.lineTo(-50,-4);ctx.lineTo(-17,4);ctx.lineTo(0,-12);ctx.closePath();ctx.moveTo(36,-18);ctx.lineTo(50,-4);ctx.lineTo(17,4);ctx.lineTo(0,-12);ctx.closePath();});rounded(-29,-10,58,37,8,'#8e7e6b');
    rounded(-21,-15,42,35,8,'#d6c4a2');path('#a77c88',()=>{ctx.moveTo(-32,-12);ctx.quadraticCurveTo(-22,-39,0,-39);ctx.quadraticCurveTo(25,-38,33,-12);ctx.quadraticCurveTo(0,-3,-32,-12);ctx.closePath();});ellipse(-13,-24,6,4,'#d5b2af',-.2);ellipse(10,-29,5,3,'#d5b2af',.3);ellipse(20,-17,4,3,'#dfbfb4');
    rounded(-13,-7,12,11,4,'#e5c78d');line(-7,-7,-7,4,'#ae9376',1);line(-13,-1,-1,-1,'#ae9376',1);rounded(5,1,13,21,6,'#816c64');
    if(again){ellipse(11,11,5,7,'#b9c3a0');ellipse(11,6,5,4,'#cbd1b0');ellipse(9,5,1,1,'#596657');ellipse(13,5,1,1,'#596657');rounded(24,11,10,10,3,'#bbc7ba');path(null,()=>ctx.arc(35,15,3,-1.5,1.5),'#bbc7ba',1.5);}
    else{line(11,3,11,18,'#a48c77',1);ellipse(14,12,1.3,1.3,'#d7bd93');}
    rounded(-38,25,76,9,3,'#d0b28e');line(-34,29,34,29,'#e3c9a5',1);
   }
  }
  ctx.restore();
 }

 function postOffice(now){
  const u=Math.min(1,W/520,H/430),bg=ctx.createLinearGradient(0,0,0,H);bg.addColorStop(0,'#272d40');bg.addColorStop(1,'#3b3548');ctx.fillStyle=bg;ctx.fillRect(0,0,W,H);
  // The inside of a broad mushroom cap, above a wooden letter-sorting room.
  path('#74505f',()=>{ctx.moveTo(0,0);ctx.lineTo(W,0);ctx.lineTo(W,22*u);ctx.quadraticCurveTo(W*.5,0,0,22*u);ctx.closePath();});
  for(let i=0;i<9;i++){const x=(i+.5)*W/9;ellipse(x,5*u,9*u,3*u,'#ae8990',i%2?.2:-.2);}
  for(const x of [W*.02,W*.98]){rounded(x-5*u,15*u,10*u,H*.57,4*u,'#725b64');line(x-2*u,20*u,x-2*u,H*.55,'#93747b',1);}
  // A little moon window sits in the gap between the sorting shelves.
  const wy=H*.275,rx=Math.min(59*u,W*.11),ry=H*.077;
  ellipse(cx,wy,rx+4*u,ry+4*u,'#9c8583');ellipse(cx,wy,rx,ry,'#14253b');ellipse(cx+rx*.34,wy-ry*.18,ry*.53,ry*.53,'#dbcba7');ellipse(cx+rx*.34+4*u,wy-ry*.18-3*u,ry*.46,ry*.46,'#14253b');
  for(const [x,y]of [[-.52,.1],[-.22,-.45],[.62,.43]])star(cx+x*rx,wy+y*ry,2*u,'#b8b4c8',.2);
  const spots=postSpots();for(const [name,v]of Object.entries(spots)){
   rounded(v.x-61*u,v.y-48*u,122*u,91*u,12*u,'#4e4658');rounded(v.x-56*u,v.y-43*u,112*u,82*u,9*u,'#363748');
   rounded(v.x-61*u,v.y+39*u,122*u,8*u,3*u,'#957886');line(v.x-53*u,v.y+41*u,v.x+53*u,v.y+41*u,'#bea092',1);
   postObject(name,v,now);
  }
  const fy=cy+55*S;ctx.fillStyle='#3c3543';ctx.fillRect(0,fy,W,H);for(let i=0;i<7;i++)line(i*W/6,fy,i*W/6-15,H,'#51414d',1);
  // Mushroom-stem stools and a soft low bench keep all four original silhouettes clear.
  world(()=>{ellipse(0,117,244,26,'#302d3c');rounded(-231,37,462,57,20,'#66546c');rounded(-229,32,458,24,14,'#9b7c8e');for(const x of [-143,-25,80,174])ellipse(x,35,45,10,'#b597a2');line(-211,84,-215,120,'#77616c',7);line(211,84,215,120,'#77616c',7);});
  for(const x of [W*.06,W*.94]){const y=H*.54;rounded(x-7*u,y,14*u,26*u,5*u,'#b7a18b');ellipse(x,y,20*u,9*u,'#96788b');ellipse(x-5*u,y-2*u,4*u,2*u,'#cfb5af');glow(x,y+15*u,27*u,'#e6c49c',sleeping?.025:.065);}
 }
 function postEnvelope(x,y,size=1,open=false){ctx.save();ctx.translate(x,y);ctx.scale(size,size);rounded(-34,-20,68,40,5,'#d9c7aa');path(null,()=>{ctx.moveTo(-31,-17);ctx.lineTo(0,4);ctx.lineTo(31,-17);ctx.moveTo(-30,17);ctx.lineTo(-9,0);ctx.moveTo(30,17);ctx.lineTo(9,0);},'#aa8d83',1.2);if(open){path('#e9dcc3',()=>{ctx.moveTo(-34,-17);ctx.lineTo(0,-42);ctx.lineTo(34,-17);ctx.closePath();});}rounded(17,-15,11,13,1,'#94b4a8');star(22.5,-9,3,'#e9dcc3');ctx.restore();}
 function postSeal(x,y,size=1){ctx.save();ctx.translate(x,y);ctx.scale(size,size);rounded(-30,-22,60,44,6,'#d3baa4');path(null,()=>ctx.arc(0,0,17,0,Math.PI*2),'#876d93',1.5);ellipse(-2,-2,9,9,'#927b9e');ellipse(2,-5,8,8,'#d3baa4');for(let i=0;i<4;i++)ellipse(-13+i*8,14,1,1,'#876d93');star(15,-13,3,'#876d93');ctx.restore();}
 function postProps(){world(()=>{
  line(-178,107,-182,132,'#6b5262',7);line(178,107,182,132,'#6b5262',7);rounded(-222,83,444,40,16,'#7c5e70');rounded(-222,77,444,33,15,'#aa8593');rounded(-100,80,200,27,8,'#6d7c77');
  // A fictional outgoing mailbox belongs to this scene only; no text input or external send.
  rounded(128,49,48,57,10,'#68798d');rounded(131,46,42,19,10,'#8795a6');rounded(137,67,30,5,2,'#303d56');star(152,88,7,'#c7b5ba',.2);
  const sending=story==='post';
  if(sending&&beat===0){postEnvelope(-14,94,.75,true);ellipse(-47,91,9,6,colors.mintLight);ellipse(15,94,9,6,colors.furLight);ellipse(26,84,7,5,colors.skinLight);star(-9,78,4,'#e1c59d');}
  else if(sending&&beat===1){const t=phase;postEnvelope(-14+166*t,94-25*t-Math.sin(t*Math.PI)*23,.75*(1-t*.75));}
  else if(postmark){postSeal(0,94,.72);}
  else postEnvelope(-14,94,.75);
  // A little unused seal and four colored dots stay on the counter.
  rounded(-169,82,25,15,3,'#5e536e');ellipse(-156,78,9,10,'#b2979b');rounded(-173,93,34,5,2,'#d2b39d');
  ['#a2c3ac','#e5d6b4','#9babc3','#b9a3cf'].forEach((c,i)=>ellipse(65+i*10,96,2,2,c));
 });}

 const bathReplies={
  towel:['卷毛巾自己拱了两下，里面探出一只小海獭。它抱着一块爱心石头，肚皮上还搭着毛巾角，正好够擦两只小爪。','海獭把爱心石举高一点，像是在问你要不要摸。等你凑近，它又抱回肚皮，满足地把脸埋进毛巾边。'],
  stone:['那块圆石头伸出了四只小脚。原来是一只背着月亮纹的小龟，刚刚一直在认真扮演澡堂边沿的一部分。','小龟慢慢转过头，把壳上的小月亮朝向你。小狼也歪歪脑袋，和它对上了一个很慢、很认真的眼神。'],
  ladle:['木勺忽然把长柄弯下来，勺口伸出一张小扁嘴——竟然是一只木头色的小鸭。它给自己舀了一勺水，神气地浮在小碟里。','小鸭把嘴里的小水珠放回碟中，扭头给你看木纹翅膀。牛顿轻轻碰碰你的爪尖：连勺子都有自己的下班时间。'],
  soap:['肥皂旁边冒出几个小泡泡，接着长出一张羊脸。原来是一只把自己缩成皂块的泡沫绵羊，头顶还戴着一朵很小的泡泡。','泡沫羊抖了抖耳朵，把头顶的小泡泡换成爱心形。Astra 伸出一只小手，它就把软软的额头凑近一点。'],
  fern:['蕨叶下面睁开了两只圆眼睛。一只小青蛙披着叶子斗篷，盘腿坐在那里，膝头端端正正地放着一条迷你毛巾。','青蛙把叶斗篷拨到另一边，认真叠了叠膝头的小毛巾。GPT 伸出叶芽和它比一比，它高兴得脚尖都翘了起来。'],
  lantern:['灯笼的盖子轻轻掀起来，里面飞出一只圆滚滚的萤火虫。原来这盏灯的小灯芯，每晚也想出来伸个懒腰。','萤火虫把肚子上的光调成小小的一点，停在灯笼把手上。它抱住把手，像抱着自己的月亮摇椅。']
 };
 function bathSpots(){
  const u=Math.min(1,W/520,H/430),size=n=>Math.max(44,n*u);
  return{towel:{x:W*.16,y:H*.19,w:size(100),h:size(82)},soap:{x:W*.50,y:H*.19,w:size(96),h:size(90)},lantern:{x:W*.84,y:H*.19,w:size(88),h:size(96)},stone:{x:W*.16,y:H*.40,w:size(108),h:size(70)},ladle:{x:W*.50,y:H*.39,w:size(108),h:size(70)},fern:{x:W*.84,y:H*.40,w:size(96),h:size(80)}};
 }
 function positionBathHotspots(){if(kind!=='bath')return;for(const [name,v]of Object.entries(bathSpots())){const b=root.querySelector('[data-action="'+name+'"]');if(b){b.style.left=v.x+'px';b.style.top=v.y+'px';b.style.width=v.w+'px';b.style.height=v.h+'px';}}}
 function bathAction(name){
  if(!bathReplies[name]&&!['float','hint','reset'].includes(name))return false;
  if(sleeping){caption.textContent='小客人们也歇好啦，月叶和水面都静静的。等醒来一点，再伸爪碰一碰。';return true;}
  if(name==='float'){start(name);return true;}
  clearWork();const now=performance.now();
  if(name==='reset'){bathFound.clear();for(const key of Object.keys(bathVisits))delete bathVisits[key];root.dataset.discovered='';caption.textContent='小狼把眼睛轻轻捂住。毛巾卷好，石头坐稳，叶子也重新垂下来——好啦，可以再来找一次。'+(bathBoat?'月叶小船还好好留着。':'');requestDraw();return true;}
  if(name==='hint'){const hidden=Object.keys(bathReplies).filter(k=>!bathFound.has(k)),choices=hidden.length?hidden:Object.keys(bathReplies);bathHint=choices[Math.floor(Math.random()*choices.length)];root.dataset.hint=bathHint;
   const hints={towel:'那卷毛巾，好像有一角正在慢慢鼓起来。',stone:'池边这块圆石头，刚刚是不是挪了一点？',ladle:'木勺的柄，怎么比刚才弯了一点。',soap:'看看小皂碟，泡泡好像排得太整齐了。',fern:'那丛叶子下面，有两点亮亮的东西。',lantern:'小灯笼的盖子，似乎没有完全扣上。'};
   caption.textContent='Astra 把一点暖光挪过去：'+hints[bathHint];until=now+2300;later(()=>{bathHint='';root.dataset.hint='';requestDraw();},2200);requestDraw();return true;
  }
  bathFound.add(name);bathVisits[name]=(bathVisits[name]||0)+1;root.dataset.discovered=[...bathFound].join(',');bathActive=name;bathAt=now;root.dataset.secret=name;until=now+2800;caption.textContent=bathReplies[name][(bathVisits[name]-1)%2];later(()=>{bathActive='';root.dataset.secret='';requestDraw();},2700);requestDraw();return true;
 }
 function bathObject(name,v,now){
  const u=Math.min(1,W/520,H/430),found=bathFound.has(name),active=bathActive===name&&!sleeping,t=active?(reduced.matches?1:Math.min(1,(now-bathAt)/2500)):1,w=active&&!reduced.matches?Math.sin(t*Math.PI*4)*(1-t):0,again=(bathVisits[name]||0)%2===0;
  ctx.save();ctx.translate(v.x,v.y);ctx.scale(u,u);
  if(bathHint===name){glow(0,0,60,'#dfc891',.15);path(null,()=>ctx.roundRect(-v.w/u/2+3,-v.h/u/2+3,v.w/u-6,v.h/u-6,13),'#d6c49b',1.3);}
  if(name==='towel'){
   ellipse(0,24,43,6,'#405452');rounded(-40,3,80,21,8,'#b8b6c2');rounded(-38,-3,76,21,8,'#d5d0d5');for(const x of [-28,-23,23,28])line(x,1,x,17,'#a1a3b5',1);
   if(!found){ellipse(20,4,17,11,'#b8bac6');path(null,()=>ctx.ellipse(20,4,10,6,0,0,Math.PI*1.8),'#e5dedd',1.5);}
   else{ctx.save();ctx.translate(0,w*2);ellipse(0,0,22,23,'#9c8977');ellipse(0,5,15,18,'#d1bd9e');ellipse(0,-21,19,16,'#ac947e');ellipse(-15,-32,6,6,'#ad9680');ellipse(15,-32,6,6,'#ad9680');ellipse(0,-17,14,9,'#dbc7a6');ellipse(-8,-23,1.7,2,'#4f5158');ellipse(8,-23,1.7,2,'#4f5158');ellipse(0,-18,3,2,'#625954');heart(0,again?-4:6,10,'#a3b9ad');ellipse(-12,again?-6:5,6,4,'#c4b195',-.5);ellipse(12,again?-6:5,6,4,'#c4b195',.5);ctx.restore();}
  }else if(name==='stone'){
   if(found){for(const x of [-23,23])for(const y of [6,19])ellipse(x,y,9,5,'#9bb5a0',x<0?-.2:.2);const x=again?-38:38;ellipse(x,6+w*2,12,9,'#b6cab0');ellipse(x+(again?-4:4),4+w*2,1.5,1.7,'#475f59');}
   ellipse(0,6,34,24,'#82988e');ellipse(-3,1,30,21,'#9ead9c');path(null,()=>{ctx.moveTo(-24,8);ctx.quadraticCurveTo(0,-13,24,8);ctx.moveTo(-15,-12);ctx.lineTo(-10,9);ctx.lineTo(0,26);ctx.moveTo(15,-12);ctx.lineTo(10,9);ctx.lineTo(0,26);},'#b8c0a9',1.1);
   ellipse(0,-1,11,11,found?'#e0d2a8':'#c1c5ad');ellipse(4,-5,9,9,'#9ead9c');
  }else if(name==='ladle'){
   ellipse(0,22,47,9,'#688e90');ellipse(0,20,41,7,'#9ebcba');
   if(!found){ctx.save();ctx.rotate(-.32);ellipse(-17,7,21,13,'#b39977');ellipse(-18,4,16,9,'#d1b797');rounded(-3,-3,49,7,3,'#b79d7b');line(7,0,40,0,'#d4ba95',1);ctx.restore();}
   else{ctx.save();ctx.translate(again?-6:3,w*2);if(again)ctx.scale(-1,1);ellipse(-6,9,26,14,'#c4aa83');ellipse(-10,8,14,8,'#9f896b',-.2);line(-18,7,-5,10,'#ddc49e',1);rounded(9,-12,13,28,6,'#cbb38f');ellipse(17,-16,13,12,'#dbc49e');ellipse(22,-18,1.6,1.8,'#5e5e5b');path('#b9966a',()=>{ctx.moveTo(28,-17);ctx.lineTo(41,-13);ctx.lineTo(28,-9);ctx.closePath();});ellipse(38,0,2,3,'#adcfce');ctx.restore();}
  }else if(name==='soap'){
   ellipse(0,28,43,7,'#91a5a6');ellipse(0,25,38,6,'#c1cbbe');
   if(!found){rounded(-28,-3,56,27,12,'#d5bdc5');rounded(-25,-5,50,21,10,'#e0cdd1');leaf(0,8,6,'#bca8b5',.65);ellipse(29,1,4,4,'#bcd3cf');ellipse(-31,15,3,3,'#c9d9d0');}
   else{for(const x of [-15,15])rounded(x-3,16,6,11,2,'#bca8b6');cloud(0,7,63,34,'#e5ded4');cloud(0,4,55,29,'#efeadf');ellipse(10,-4,14,17,'#c5b2bc');ellipse(-3,-5,8,4,'#c5b2bc',-.4);ellipse(25,-7,8,4,'#c5b2bc',.4);ellipse(5,-6,1.4,1.8,'#635d6e');ellipse(15,-6,1.4,1.8,'#635d6e');if(again)heart(3,-29+w*2,8,'#bfd7ce');else{ellipse(4,-28+w*2,9,9,'#bfd4d1');ellipse(2,-31+w*2,3,2,'#e5ece1');}}
  }else if(name==='fern'){
   ellipse(0,25,40,6,'#415d52');
   if(!found){for(const [x,y,a,n]of [[-2,24,-.9,30],[0,23,0,31],[2,23,.9,29]]){ctx.save();ctx.translate(x,y);ctx.rotate(a);line(0,0,0,-n*1.7,'#95ad8b',1.6);for(let i=0;i<4;i++){const yy=-9-i*10;leaf(-1,yy,7-i*.8,'#84a58d',-.8);leaf(1,yy,7-i*.8,'#aac1a0',.8);}ctx.restore();}}
   else{ellipse(-15,23,12,6,'#a0bea0');ellipse(15,23,12,6,'#a0bea0');ellipse(0,9,23,20,'#a9c3a2');ellipse(0,-8+w*2,24,18,'#c4d5ad');for(const x of [-13,13]){ellipse(x,-21+w*2,9,10,'#c4d5ad');ellipse(x,-22+w*2,3,4,'#4c685b');ellipse(x+1,-24+w*2,1,1,'#f1ecd3');}path(null,()=>{ctx.moveTo(-7,-2);ctx.quadraticCurveTo(0,4,7,-2);},'#688268',1.4);ctx.save();if(again)ctx.scale(-1,1);path('#70987c',()=>{ctx.moveTo(-22,-13);ctx.quadraticCurveTo(-40,0,-27,25);ctx.lineTo(-8,16);ctx.closePath();});line(-22,-10,-24,17,'#a1ba93',1);ctx.restore();rounded(-15,13,30,10,3,'#c6c3d1');line(-8,15,-8,21,'#a29cb7',1);line(8,15,8,21,'#a29cb7',1);}
  }else if(name==='lantern'){
   line(0,-47,0,-34,'#899a80',1);path(null,()=>ctx.arc(0,-22,12,Math.PI,Math.PI*2),'#b9aa88',2);rounded(-21,-24,42,51,13,'#8b927b');rounded(-15,-17,30,35,9,'#c6c39a');line(-2,-17,-2,18,'#9aa181',1);rounded(-25,23,50,6,3,'#a0a187');
   if(!found){glow(0,1,26,'#d9cf9d',.09);ellipse(0,2,6,9,'#e5d7a6');}
   else{ctx.save();ctx.translate(again?9:0,-22-w*3);ellipse(-8,1,12,6,'#b9d4c4',-.65);ellipse(8,1,12,6,'#c9dcca',.65);ellipse(0,6,9,12,'#aec294');ellipse(0,11,7,6,'#e5d4a0');ellipse(0,-6,7,7,'#789c83');line(-3,-11,-6,-16,'#afc9a4',1);line(3,-11,6,-16,'#afc9a4',1);ellipse(-3,-7,1,1,'#354f4a');ellipse(3,-7,1,1,'#354f4a');if(!sleeping)glow(0,11,23,'#e1d5a5',again?.06:.13);ctx.restore();}
  }
  ctx.restore();
 }
 function bathHouse(now){
  const bg=ctx.createLinearGradient(0,0,0,H);bg.addColorStop(0,'#253b3a');bg.addColorStop(1,'#374a48');ctx.fillStyle=bg;ctx.fillRect(0,0,W,H);
  const u=Math.min(1,W/520,H/430),wx=W*.31,ww=W*.38,wh=H*.31;
  rounded(wx-8,10,ww+16,wh+7,ww/2,'#68766a');rounded(wx,17,ww,wh-6,ww/2,'#142c3b');
  ctx.save();ctx.beginPath();ctx.roundRect(wx,17,ww,wh-6,ww/2);ctx.clip();for(let i=0;i<19;i++)star(wx+11+(i*31)%(ww-22),24+(i*17)%(wh-22),i%3?1:2,'#a6bcb5',i);ellipse(cx+ww*.25,40,12*u,12*u,'#d4c9a2');ellipse(cx+ww*.25+4*u,36,10*u,10*u,'#142c3b');ctx.restore();
  // Irregular stonework and moss grow around the window, without a cabinet grid.
  for(let row=0;row<4;row++){const y=18+row*H*.12;for(const side of [-1,1]){const x=cx+side*W*.40;rounded(x-W*.09,y,W*.18,H*.10,12,'#425853');line(x-W*.06,y+H*.09,x+W*.06,y+H*.09,'#52675b',1);}}
  for(const [x,y]of [[W*.04,15],[W*.95,20],[W*.29,H*.29],[W*.72,H*.30],[W*.05,H*.48],[W*.94,H*.48]]){for(let i=0;i<4;i++)ellipse(x+(i-1.5)*9*u,y+(i%2)*3*u,12*u,6*u,['#617e60','#76916c','#536f57'][i%3]);}
  const spots=bathSpots();for(const [name,v]of Object.entries(spots)){if(['towel','soap','stone'].includes(name))rounded(v.x-51*u,v.y+32*u,102*u,7*u,3,'#7e8270');bathObject(name,v,now);}
  const fy=cy+45*S;ctx.fillStyle='#384b49';ctx.fillRect(0,fy,W,H);for(let i=0;i<7;i++)line(W*i/6,fy,W*i/6-20,H,'#465b54',1);
  world(()=>{ellipse(0,128,245,30,'#283f42');rounded(-234,39,468,57,16,'#8b7f67');rounded(-229,34,458,20,10,'#aa9577');for(const x of [-145,-25,80,175]){ellipse(x,38,47,13,'#718f7b');ellipse(x,34,45,10,'#a0b19a');}line(-211,90,-215,125,'#6f6b58',7);line(211,90,215,125,'#6f6b58',7);});
 }
 function leafBoat(x,y,size=1,ready=true){ctx.save();ctx.translate(x,y);ctx.scale(size,size);path('#8db59b',()=>{ctx.moveTo(-38,-4);ctx.quadraticCurveTo(-10,25,24,10);ctx.lineTo(39,-11);ctx.quadraticCurveTo(0,3,-38,-4);ctx.closePath();});path(null,()=>{ctx.moveTo(-31,0);ctx.quadraticCurveTo(0,13,30,-5);},'#c2d4ac',1);if(ready){ellipse(2,-5,10,12,'#e4d3a2');ellipse(6,-9,9,10,'#8db59b');path(null,()=>{ctx.moveTo(27,3);ctx.quadraticCurveTo(35,15,43,9);},'#cbb5cb',1);star(44,8,4,'#d6c3db');}ctx.restore();}
 function bathProps(now){world(()=>{
  ellipse(0,106,237,45,'#7c8f7d');ellipse(0,97,234,43,'#a1ad93');ellipse(0,94,212,31,'#365b60');ellipse(0,96,205,26,'#638d8d');
  path(null,()=>{ctx.ellipse(0,96,190,20,0,.08,Math.PI-.08);},'#9fbdb2',1);
  for(const x of [-139,-24,79,169]){if(!sleeping){ctx.save();ctx.globalAlpha=.33;path(null,()=>ctx.ellipse(x,84,23,5,0,0,Math.PI*2),'#bdd0be',1);ctx.restore();}}
  const floating=story==='float',progress=floating?(beat+phase)/3:1;
  if(floating||bathBoat){const bx=floating?-94+progress*188:94,by=100+(floating?Math.sin(progress*Math.PI)*7:0);leafBoat(bx,by,.8,bathBoat||beat>=1);}
  else{ctx.save();ctx.translate(151,112);ctx.rotate(.3);leaf(0,0,14,'#a1b79a',Math.PI/2);ctx.restore();}
  if(floating&&beat===0){ellipse(-90,91,9,6,colors.furLight);ellipse(-55,89,8,5,colors.skinLight);star(-70,78,5,'#e1c99f');}
  // Steam is a finite, quiet effect and stops when the family rests.
  if(!sleeping){const moving=!reduced.matches&&now<Math.max(until,ambientUntil),sway=moving?Math.sin(now/1100)*3:0;ctx.save();ctx.globalAlpha=.13;for(const x of [-187,187])path(null,()=>{ctx.moveTo(x,75);ctx.bezierCurveTo(x-7+sway,64,x+8+sway,59,x,48);},'#d1dfcc',2);ctx.restore();}
 });}

 const lostReplies={
  umbrella:['小伞忽然抬起了边沿，下面垂出几条透明触须——是一只假扮雨伞的水母。它浮起来一点，还很有礼貌地替你遮了一颗星。','水母伞转了半圈，把一枚小星星送到伞顶。GPT 跟着抬头，小叶芽也想分到一点伞下的位置。'],
  clock:['钟里的长针慢慢伸出两根触角。原来是一只背着月亮壳的蜗牛，刚刚走到它喜欢的地方，就决定在这里歇一歇。','蜗牛把头转回来，给你看壳上的小星。牛顿扶着你凑近一点：原来这只钟，是按蜗牛的心情走的。'],
  suitcase:['箱扣自己松开了。里面居然铺着一小片海，一条蓝鲸探出头，尾巴还规规矩矩地留在箱子里。','蓝鲸换了个方向，把小小的尾巴露出来。Astra 扶好眼镜：它好像是在展示自己的另一面。'],
  bottle:['瓶里的月光展开了翅膀！一只奶油色的小蛾坐上瓶口，把触角弯成两枚小月牙。','月光蛾绕着瓶口挪了一圈，翅膀上露出两颗莓紫小点。它把刚刚收好的光，再分给你一点点。'],
  plant:['花盆下面伸出两只穿袜子的小脚。盆栽往旁边挪了半步，又端端正正站好，仿佛刚才只是你眨了眼。','小盆栽换了一只脚站，把袜子上的条纹认真亮给你看。小狼偷偷伸爪，它的叶片就往你这里歪了歪。'],
  bell:['桌铃底下探出两只小钳子。一只把铃铛当家的寄居蟹，正拿着迷你印章，严肃地处理一片落叶的认领手续。','寄居蟹把印章翻过来，给你看底下的小爱心。它又缩回铃铛，只剩两只眼睛，偷偷观察这只来访的小狼。']
 };
 function lostSpots(){
  const u=Math.min(1,W/520,H/430),size=n=>Math.max(44,n*u);
  return{umbrella:{x:W*.17,y:H*.19,w:size(102),h:size(92)},clock:{x:W*.50,y:H*.18,w:size(90),h:size(90)},suitcase:{x:W*.83,y:H*.20,w:size(108),h:size(78)},bottle:{x:W*.17,y:H*.40,w:size(80),h:size(84)},plant:{x:W*.50,y:H*.40,w:size(84),h:size(80)},bell:{x:W*.83,y:H*.40,w:size(98),h:size(72)}};
 }
 function positionLostHotspots(){
  if(kind!=='lost')return;
  for(const [name,v]of Object.entries(lostSpots())){const b=root.querySelector('[data-action="'+name+'"]');if(b){b.style.left=v.x+'px';b.style.top=v.y+'px';b.style.width=v.w+'px';b.style.height=v.h+'px';}}
 }
 function lostAction(name){
  if(!lostReplies[name]&&!['hint','reset','claim'].includes(name))return false;
  if(sleeping){caption.textContent='失物招领处也打烊歇一会啦。小物件们都待在原处，等醒来一点再碰。';return true;}
  if(name==='claim'){start(name);return true;}
  clearWork();const now=performance.now();
  if(name==='reset'){
   lostFound.clear();for(const key of Object.keys(lostVisits))delete lostVisits[key];root.dataset.discovered='';
   caption.textContent='Astra 转过身数了三个软软的数。小物件们赶紧收好触角和小脚，又装成了规规矩矩的摆设。'+(lostCloud?'认领过的口袋云还窝在小票上。':'');requestDraw();return true;
  }
  if(name==='hint'){
   const hidden=Object.keys(lostReplies).filter(key=>!lostFound.has(key)),choices=hidden.length?hidden:Object.keys(lostReplies);
   lostHint=choices[Math.floor(Math.random()*choices.length)];root.dataset.hint=lostHint;
   const hints={umbrella:'挂着的那把小伞，伞柄好像有一点软。',clock:'看看钟面，指针是不是伸了个懒腰？',suitcase:'那只旅行箱好像盛着一点蓝色。',bottle:'玻璃瓶里的光，刚才似乎眨了一下。',plant:'花盆的位置，和刚进门时一样吗？',bell:'桌铃旁边，好像多了一枚小小的印章。'};
   caption.textContent='Astra 悄悄挪过一点灯光：'+hints[lostHint];until=now+2300;
   later(()=>{lostHint='';root.dataset.hint='';requestDraw();},2200);requestDraw();return true;
  }
  lostFound.add(name);lostVisits[name]=(lostVisits[name]||0)+1;root.dataset.discovered=[...lostFound].join(',');lostActive=name;lostAt=now;root.dataset.secret=name;until=now+2800;
  caption.textContent=lostReplies[name][(lostVisits[name]-1)%2];
  later(()=>{lostActive='';root.dataset.secret='';requestDraw();},2700);requestDraw();return true;
 }
 function lostObject(name,spot,now){
  const u=Math.min(1,W/520,H/430),found=lostFound.has(name),active=lostActive===name&&!sleeping;
  const t=active?(reduced.matches?1:Math.min(1,(now-lostAt)/2500)):1,p=active?ease(Math.min(1,t*3)):1,w=active&&!reduced.matches?Math.sin(t*Math.PI*4)*(1-t):0,again=(lostVisits[name]||0)%2===0;
  ctx.save();ctx.translate(spot.x,spot.y);ctx.scale(u,u);
  if(lostHint===name){glow(0,0,65,'#e7ca96',.17);path(null,()=>ctx.roundRect(-spot.w/u/2+3,-spot.h/u/2+3,spot.w/u-6,spot.h/u-6,13),'#e2c69a',1.2);}
  if(name==='umbrella'){
   line(0,-55,0,-38,'#9c8a71',1);ctx.translate(w*3,found?-p*5:0);
   if(!found){line(0,-3,0,29,'#b5a08d',2);path(null,()=>{ctx.moveTo(0,29);ctx.bezierCurveTo(0,42,17,42,17,28);},'#b5a08d',2);}
   else{for(let i=0;i<5;i++){const x=-26+i*13;path(null,()=>{ctx.moveTo(x,-2);ctx.bezierCurveTo(x-9+w*4,14,x+10-w*3,20,x+(i%2?9:-7),35+(i%2)*5);},['#c6c8da','#a0c4ca','#c7c4d9'][i%3],2);}}
   path('#a7b6c8',()=>{ctx.moveTo(-43,-1);ctx.quadraticCurveTo(-34,-40,0,-36);ctx.quadraticCurveTo(33,-39,43,-1);ctx.quadraticCurveTo(30,-9,21,-1);ctx.quadraticCurveTo(8,-10,0,-1);ctx.quadraticCurveTo(-13,-10,-22,-1);ctx.quadraticCurveTo(-34,-9,-43,-1);});
   path(null,()=>{ctx.moveTo(0,-36);ctx.quadraticCurveTo(-17,-25,-22,-1);ctx.moveTo(0,-36);ctx.quadraticCurveTo(17,-25,21,-1);},'#d2d2d9',1);ellipse(0,-38,3,3,'#d9be9b');
   if(found){ellipse(-12,-17,1.6,2,'#4c6077');ellipse(12,-17,1.6,2,'#4c6077');ellipse(-21,-11,4,2,'#d5aebc');ellipse(21,-11,4,2,'#d5aebc');star(again?0:31,again?-47:14,5,'#e6ce9c',.3);}
  }else if(name==='clock'){
   ellipse(0,0,43,43,'#9c8970');ellipse(0,0,38,38,'#c6b99d');ellipse(0,0,34,34,'#324d51');
   for(let i=0;i<12;i++){const a=i*Math.PI/6;line(Math.sin(a)*28,-Math.cos(a)*28,Math.sin(a)*31,-Math.cos(a)*31,'#c6b99d',i%3?1:2);}
   if(!found){line(0,0,-14,-10,'#d7c4a4',2);line(0,0,12,-21,'#d7c4a4',2);ellipse(0,0,3,3,'#e4c99c');}
   else{ctx.save();ctx.translate(again?-5:1,3+w*2);ellipse(1,11,24,7,'#b7c6ad');ellipse(-17,3,7,13,'#ced7b9');line(-21,-6,-25,-16,'#ced7b9',2);line(-14,-7,-12,-19,'#ced7b9',2);ellipse(-25,-16,2,2,'#e6e0c2');ellipse(-12,-19,2,2,'#e6e0c2');ellipse(-25,-16,1,1,'#4e6057');ellipse(-12,-19,1,1,'#4e6057');ellipse(7,0,16,16,'#c2a8bc');path(null,()=>{ctx.arc(7,0,10,0,Math.PI*1.7);ctx.arc(7,0,5,Math.PI*1.7,Math.PI*3);},'#8f7d9c',1.6);if(again)star(10,-8,4,'#e9cd9a');ctx.restore();}
  }else if(name==='suitcase'){
   rounded(-41,-20,82,50,8,'#aa8977');rounded(-36,-15,72,39,5,'#927565');path(null,()=>{ctx.moveTo(-12,-20);ctx.lineTo(-12,-29);ctx.quadraticCurveTo(0,-34,12,-29);ctx.lineTo(12,-20);},'#c7ad85',3);
   if(found){rounded(-36,-15,72,39,4,'#3b687a');for(let j=0;j<3;j++){path(null,()=>{ctx.moveTo(-32,8+j*6);ctx.quadraticCurveTo(-16,2+j*6,0,8+j*6);ctx.quadraticCurveTo(16,14+j*6,32,8+j*6);},'#76a9b8',1.4);}ctx.save();ctx.translate(again?9:-4,-3-w*3);ctx.scale(again?-.37:.37,.37);tinyWhale(0,-13,.8,0);ctx.restore();rounded(-42,27,84,12,3,'#b2917d');line(-34,32,34,32,'#d1b18e',1);}
   else{for(const x of [-24,24])rounded(x-4,-19,8,48,2,'#c0a088');rounded(-6,-5,12,8,2,'#d2b780');star(18,11,6,'#b9c1a5',.2);}
  }else if(name==='bottle'){
   rounded(-23,-18,46,50,12,'#6c98a4');rounded(-18,-13,36,40,9,'#2c535f');rounded(-12,-27,24,14,4,'#a88b74');line(-15,-10,-15,17,'#a3c4c4',2);ellipse(5,28,16,3,'#527e8b');
   if(!found){ellipse(1,6,10,11,'#d5c9a5');ellipse(5,2,9,9,'#2c535f');}
   else{ctx.save();ctx.translate(0,-19-p*2-w*2);const span=again?21:26;ellipse(-span*.45,0,span*.6,15,'#d8cfb3',-.5);ellipse(span*.45,0,span*.6,15,'#ded4bc',.5);ellipse(0,4,4,12,'#a9959d');line(-1,-6,-7,-15,'#cdbda5',1.2);line(1,-6,7,-15,'#cdbda5',1.2);if(again){ellipse(-13,2,4,4,'#a38aa8');ellipse(13,2,4,4,'#a38aa8');}ctx.restore();star(4,7,5,'#ddc698');}
  }else if(name==='plant'){
   const shift=found?(again?-4:4)+w*3:0;ctx.translate(shift,0);
   if(found){for(const x of [-12,12]){rounded(x-4,18,8,13,3,'#c3a2b8');ellipse(x+(x<0?-3:3),31+(again&&x>0?-4:0),7,4,'#c3a2b8');line(x-4,24,x+4,24,'#ede0c9',2);}}
   path('#aa8b77',()=>{ctx.moveTo(-22,-5);ctx.lineTo(22,-5);ctx.lineTo(17,23);ctx.quadraticCurveTo(0,29,-17,23);ctx.closePath();});rounded(-25,-9,50,9,3,'#c0a28a');ellipse(0,-8,20,3,'#695d52');
   line(0,-7,0,-24,'#8eaf98',2);leaf(0,-20,11,'#92b59a',-.9);leaf(0,-22,10,'#b3c8a6',.7);leaf(0,-11,10,'#7e9d86',.9);
   if(found){ellipse(-7,6,1.2,1.7,'#534f54');ellipse(7,6,1.2,1.7,'#534f54');path(null,()=>{ctx.moveTo(-3,12);ctx.quadraticCurveTo(0,15,3,12);},'#66585b',1.2);}
  }else if(name==='bell'){
   if(found){for(const side of [-1,1]){line(side*18,11,side*35,18,'#c89988',2);ellipse(side*37,14+w*2,7,5,'#d3a08c');path(null,()=>{ctx.moveTo(side*37,14+w*2);ctx.lineTo(side*43,9+w*2);},'#725b5b',1.2);}}
   ellipse(0,21,34,6,'#746867');rounded(-33,15,66,8,4,'#b5a07f');path('#c2ad87',()=>{ctx.moveTo(-28,16);ctx.bezierCurveTo(-28,-22,28,-22,28,16);ctx.closePath();});ellipse(-9,-5,6,9,'#d7c49d',.5);line(0,-17,0,-24,'#a18c74',3);ellipse(0,-25,6,3,'#d4bc94');
   if(found){for(const x of [-9,9]){line(x,19,x,29,'#bda68c',2);ellipse(x,29,3,4,'#d9c4a6');ellipse(x,30,1.2,1.5,'#4c4c59');}ctx.save();ctx.translate(again?-39:38,22);rounded(-5,-7,10,12,3,'#809f94');rounded(-9,4,18,5,2,'#c4aa85');if(again)heart(0,6,4,'#b77c90');ctx.restore();}
  }
  ctx.restore();
 }
 function lostOffice(now){
  const bg=ctx.createLinearGradient(0,0,0,H);bg.addColorStop(0,'#203c40');bg.addColorStop(1,'#314144');ctx.fillStyle=bg;ctx.fillRect(0,0,W,H);
  const u=Math.min(1,W/520,H/430);for(let x=16;x<W;x+=W/9)line(x,0,x,H*.56,'#395356',1);
  // Brass arch and recessed cabinets give this little night office its own shape.
  const aw=W*.3;rounded(cx-aw/2-5,12,aw+10,H*.45,Math.min(aw/2,48),'#8e816c');rounded(cx-aw/2,17,aw,H*.45-10,Math.min(aw/2,44),'#182f3b');
  for(let i=0;i<11;i++)star(cx-aw*.4+(i*23)%Math.max(1,aw*.8),24+(i*29)%(H*.37),i%3?1:2,'#8eaaa8',i);
  const spots=lostSpots();for(const side of [.17,.83]){const x=W*side,bw=W*.26;rounded(x-bw/2,16,bw,H*.47,10,'#4b5854');rounded(x-bw/2+4,21,bw-8,H*.47-10,6,'#2c4345');for(const y of [H*.29,H*.49]){rounded(x-bw*.55,y,bw*1.1,6*u,2,'#a28b70');line(x-bw*.5,y,x+bw*.5,y,'#c1a788',1);}}
  for(const [name,v]of Object.entries(spots))lostObject(name,v,now);
  line(W*.04,H*.525,W*.96,H*.525,'#a28c72',5*u);line(W*.04,H*.537,W*.96,H*.537,'#586361',1);
  const floor=cy+49*S;ctx.fillStyle='#303c40';ctx.fillRect(0,floor,W,H);for(let y=floor+20;y<H;y+=24)line(0,y,W,y,'#3b4849',1);
  world(()=>{ellipse(0,129,245,30,'#455352');rounded(-235,-2,470,117,34,'#687c75');rounded(-232,64,464,45,20,'#4e645f');rounded(-230,13,38,92,18,'#96a18b');rounded(192,13,38,92,18,'#96a18b');});
  for(const x of [W*.035,W*.965]){glow(x,H*.53,30*u,'#e3c497',sleeping?.02:.07);ellipse(x,H*.53,4*u,7*u,'#c4ae87');}
 }
 function pocketCloud(x,y,scarf=false){
  cloud(x,y,73,31,'#cdd8dc');cloud(x,y-3,65,26,'#e0e5df');
  if(sleeping){line(x-15,y-1,x-8,y+1,'#637581',1.4);line(x+8,y+1,x+15,y-1,'#637581',1.4);}else{ellipse(x-11,y,1.7,2,'#637581');ellipse(x+11,y,1.7,2,'#637581');}ellipse(x-20,y+5,4,2,'#d8b5be');ellipse(x+20,y+5,4,2,'#d8b5be');
  if(scarf){rounded(x-23,y+13,46,6,3,'#8fb8a4');rounded(x+11,y+15,9,13,3,'#8fb8a4');line(x+12,y+23,x+19,y+23,'#d4dfc3',1);}
 }
 function lostProps(){world(()=>{
  rounded(-93,108,186,16,8,'#a48d72');line(-71,124,-74,148,'#76644f',5);line(71,124,74,148,'#76644f',5);
  rounded(-49,101,98,9,3,'#dbcfb1');for(let i=0;i<7;i++)line(-42+i*13,104,-37+i*13,104,'#aaa487',.7);
  const claiming=story==='claim',b=claiming?beat:lostCloud?2:0;
  const drift=claiming&&beat===0?(1-phase)*25:0;pocketCloud(-drift,84-drift*.35,b>=1);
  if(b>=1){line(26,99,44,96,'#c5b38f',1);rounded(40,89,20,17,3,'#dbc9aa');if(b>=2)star(50,97,5,'#8f8b9c');}
  rounded(-77,86,15,18,4,'#668e80');rounded(-81,102,23,6,3,'#d0b28a');
  if(claiming&&beat===1){const yy=78+Math.sin(phase*Math.PI)*12;rounded(42,yy-16,15,15,4,'#8a9bb1');rounded(38,yy,23,6,3,'#d0b28a');ellipse(-29,93,8,5,colors.furLight);ellipse(31,94,7,5,colors.skinLight);}
 });}

 const curioReplies={
  frame:['画里的月亮歪了一下，后面钻出一只戴小皇冠的鹅。它原来一直在假装山峰，见你发现，只好端端正正地点个头。','小皇冠又探出来了。鹅把脖子伸得长长的，像在认真检查：这回来的还是那只小狼吗？'],
  teapot:['茶壶没有倒出茶，壶嘴里游出来一条云朵小鱼！它绕着壶盖打了个弯，尾巴还沾着一点星光。','你又碰了碰茶壶。云鱼这次倒着游出来，慢吞吞地吐了一个月亮泡泡，GPT 的叶芽也跟着歪过去。'],
  books:['书缝里探出一只围着条纹围巾的书虫。它推推眼镜，把一片叶子当作书签递给你，又往书脊后面缩了一点。','书虫把围巾翻到另一面，认真向你展示：它今晚也换了衣服。小狼伸爪，和那颗小脑袋轻轻碰一下。'],
  drawer:['抽屉拉开了一小截。里面竟然是一间更小的小窝，四个米粒大的小家伙，也正抬头看着你们。','抽屉里的四个小家伙挪挪软垫，把中间留出一点空隙。牛顿低头看看，又把你往自己身边拢近一点。'],
  moon:['窗里的月亮翻了个面，背后居然藏着一块月亮奶酪。一只棉花小鼠探出头，耳朵上还顶着两颗小星屑。','棉花小鼠把奶酪往前推了一点，自己坐在月亮边沿。Astra 小声给它让出一块星光，它满意地晃晃耳朵。'],
  ribbon:['那枚蝴蝶结慢慢伸开了翅膀——原来是一只戴睡帽的星星蝙蝠。它倒挂着打了个哈欠，帽尖的小球也跟着摇。','星星蝙蝠把睡帽扶正，伸开一边翅膀向你招招手。招完又裹回自己，像一颗打好结的软糖。']
 };
 function curioSpots(){
  const u=Math.min(1,W/520,H/430),size=(n)=>Math.max(44,n*u);
  return{frame:{x:W*.16,y:H*.20,w:size(82),h:size(82)},teapot:{x:W*.84,y:H*.20,w:size(92),h:size(72)},books:{x:W*.15,y:H*.40,w:size(94),h:size(72)},drawer:{x:W*.85,y:H*.40,hy:H*.40+12*u,w:size(100),h:size(96)},moon:{x:W*.50,y:H*.18,w:Math.min(W*.26,H*.24),h:Math.min(W*.26,H*.24)},ribbon:{x:W*.50,y:H*.405,w:size(84),h:size(50)}};
 }
 function positionCurioHotspots(){
  if(kind!=='curio')return;
  for(const [name,v]of Object.entries(curioSpots())){const b=root.querySelector('[data-action="'+name+'"]');if(b){b.style.left=v.x+'px';b.style.top=(v.hy??v.y)+'px';b.style.width=v.w+'px';b.style.height=v.h+'px';}}
 }
 function curioAction(name){
  if(!curioReplies[name]&&name!=='hint'&&name!=='reset')return false;
  if(sleeping){caption.textContent='小奇物们也蜷好啦。先让它们陪着睡，醒来一点再轻轻戳。';return true;}
  clearWork();const now=performance.now();
  if(name==='reset'){
   curioFound.clear();for(const key of Object.keys(curioVisits))delete curioVisits[key];root.dataset.discovered='';
   caption.textContent='你捂住眼睛，小奇物们窸窸窣窣地藏回原处。睁眼又是一间安静的阁楼。'+(curioKey?'口袋里的小钥匙还好好留着。':'');requestDraw();return true;
  }
  if(name==='hint'){
   const hidden=Object.keys(curioReplies).filter(key=>!curioFound.has(key));
   const choices=hidden.length?hidden:Object.keys(curioReplies);curioHint=choices[Math.floor(Math.random()*choices.length)];root.dataset.hint=curioHint;
   const hints={frame:'那边的画框好像挂得有一点歪。',teapot:'架子上的茶壶，好像刚刚轻轻动了一下。',books:'那几本书之间，似乎留了一道小缝。',drawer:'那个小抽屉的把手，摸起来应该很顺手。',moon:'窗里的月亮，怎么像一块能翻面的东西？',ribbon:'看看挂在窗下的那枚蝴蝶结。'};
   caption.textContent='Astra 把一点灯光挪过去：'+hints[curioHint];until=now+2300;
   later(()=>{curioHint='';root.dataset.hint='';requestDraw();},2200);requestDraw();return true;
  }
  curioVisits[name]=(curioVisits[name]||0)+1;curioFound.add(name);root.dataset.discovered=[...curioFound].join(',');
  curioActive=name;curioAt=now;root.dataset.secret=name;until=now+2800;
  caption.textContent=curioReplies[name][(curioVisits[name]-1)%2];
  if(name==='drawer'&&root.dataset.kept!=='true')later(()=>{
   curioKey=true;caption.textContent='米粒小窝的门口送出一枚袖珍钥匙。Astra 用两只小手接住，把它放到你们桌边：这一点奇怪的温柔，可以带回客厅。';keep();requestDraw();
  },1800);
  later(()=>{curioActive='';root.dataset.secret='';requestDraw();},2700);requestDraw();return true;
 }
 function curioGoose(x,y,p,again){
  ctx.save();ctx.translate(x,y);const rise=p*(again?14:9);
  ellipse(0,8,15,10,'#e7dcc6');rounded(-3,-19-rise,9,31+rise,5,'#ede4d1');ellipse(3,-20-rise,11,10,'#f1e8d7');ellipse(7,-21-rise,1.4,1.8,'#544450');
  path('#d4a272',()=>{ctx.moveTo(12,-20-rise);ctx.lineTo(23,-15-rise);ctx.lineTo(12,-13-rise);ctx.closePath();});
  path('#d8bd7f',()=>{ctx.moveTo(-6,-30-rise);ctx.lineTo(-8,-39-rise);ctx.lineTo(-1,-35-rise);ctx.lineTo(4,-42-rise);ctx.lineTo(9,-35-rise);ctx.lineTo(14,-39-rise);ctx.lineTo(11,-29-rise);ctx.closePath();});ctx.restore();
 }
 function curioObject(name,spot,now){
  const u=Math.min(1,W/520,H/430),found=curioFound.has(name),active=curioActive===name&&!sleeping;
  const t=active?(reduced.matches?1:Math.min(1,(now-curioAt)/2200)):1,p=active?ease(Math.min(1,t*2.5)):1,wiggle=active&&!reduced.matches?Math.sin(t*Math.PI*4)*(1-t):0,again=(curioVisits[name]||0)%2===0;
  ctx.save();ctx.translate(spot.x,spot.y);ctx.scale(u,u);
  if(curioHint===name){ctx.save();ctx.globalAlpha=.65;glow(0,0,68,'#e8c993',.16);path(null,()=>ctx.roundRect(-spot.w/u/2+3,-spot.h/u/2+3,spot.w/u-6,spot.h/u-6,14),'#d5c49c',1.4);ctx.restore();}
  if(name==='frame'){
   ctx.rotate(-.1+wiggle*.05);rounded(-37,-35,74,74,8,'#b69b7c');rounded(-31,-29,62,62,4,'#33445e');
   star(-19,-14,3,'#c6baa3');star(21,-20,2,'#c6baa3');ellipse(9,-9,15,15,'#d6c9b0');ellipse(15,-13,13,13,'#33445e');
   path('#6c7b80',()=>{ctx.moveTo(-30,31);ctx.lineTo(-30,13);ctx.quadraticCurveTo(-6,-1,10,17);ctx.quadraticCurveTo(22,5,30,12);ctx.lineTo(30,31);ctx.closePath();});
   if(found)curioGoose(-5,16,p,again);
   [-31,31].forEach(x=>{line(x,-28,x,-17,'#e0c59d',1);line(x,21,x,31,'#e0c59d',1);});
  }else if(name==='teapot'){
   ellipse(0,26,49,7,'#5a4b62');rounded(-24,-6,49,32,15,'#a19ab6');ellipse(0,-5,23,7,'#bfb2cb');rounded(-9,-13,18,8,4,'#aaa0bd');ellipse(0,-14,5,4,'#dbc4a7');
   path(null,()=>ctx.ellipse(-30,6,13,15,0,0,Math.PI*2),'#a19ab6',6);
   path('#a19ab6',()=>{ctx.moveTo(20,2);ctx.quadraticCurveTo(33,5,39,-13);ctx.lineTo(47,-11);ctx.quadraticCurveTo(42,21,21,18);ctx.closePath();});star(-1,11,6,'#ddd0b2',.2);
   if(found){const flight=active?Math.sin(t*Math.PI):0,fx=20+flight*28*(again?-1:1),fy=-28-flight*21;
    cloud(fx,fy,35,15,'#d5dce3');path('#c2cfdc',()=>{ctx.moveTo(fx-12,fy);ctx.lineTo(fx-25,fy-8);ctx.lineTo(fx-23,fy+9);ctx.closePath();});ellipse(fx+9,fy-2,1.4,1.6,'#5d6277');ellipse(fx+9,fy+4,3,1.5,'#c7a9bc');
    if(active){ctx.save();ctx.globalAlpha=Math.sin(t*Math.PI);ellipse(fx+20,fy-13,5,5,'#d6c8d3');ellipse(fx+22,fy-15,4,4,'#2d2d43');ctx.restore();}
   }
  }else if(name==='books'){
   const cols=['#87927e','#a58b83','#707f9c','#9782a5'];for(let i=0;i<4;i++){ctx.save();ctx.translate(-34+i*19,24);ctx.rotate(i===3?.12:0);rounded(-7,-48+i%2*6,16,48-i%2*6,3,cols[i]);line(-4,-39+i%2*6,6,-39+i%2*6,'#d5c09a',1);line(-4,-8,6,-8,'#d5c09a',1);ctx.restore();}
   if(found){const yy=-9-p*16;ellipse(1,yy+15,9,12,'#8fae96');ellipse(1,yy,13,12,'#c2cdb0');ellipse(-4,yy,4,4,'#e3e1c8');ellipse(6,yy,4,4,'#e3e1c8');path(null,()=>{ctx.ellipse(-4,yy,4,4,0,0,Math.PI*2);ctx.moveTo(10,yy);ctx.ellipse(6,yy,4,4,0,0,Math.PI*2);},'#657563',.9);ellipse(-4,yy,1,1,'#526357');ellipse(6,yy,1,1,'#526357');rounded(-10,yy+9,23,6,2,again?'#a38cae':'#bb909a');for(let i=0;i<4;i++)line(-7+i*6,yy+10,-7+i*6,yy+14,'#e1c2ae',1);leaf(20,yy+21,7,'#a1b797',.6);}
   rounded(-49,24,98,7,3,'#9b7f72');
  }else if(name==='drawer'){
   rounded(-45,-28,90,60,8,'#8d7476');rounded(-39,-23,78,47,4,'#3b3549');
   const open=found?p:0;
   if(found){
    rounded(-33,-19,66,39,4,'#4a536b');ellipse(18,-10,6,6,'#c9bba6');ellipse(20,-12,5,5,'#4a536b');rounded(-29,5,58,14,5,'#887b91');
    ['#a6cbb0','#e6d9b8','#b89b83','#b9a5d1'].forEach((c,i)=>{const xx=-20+i*13;ellipse(xx,8,6,7,c);ellipse(xx,1+wiggle,5,5,c);if(i===1){ellipse(xx-3,-3,2,4,c);ellipse(xx+3,-3,2,4,c);}if(i===3)star(xx,-1,6,c);});
   }
   ctx.save();ctx.translate(0,open*30);rounded(-43,-23+open*28,86,45-open*26,5,'#b18e84');line(-36,-17+open*28,36,-17+open*28,'#ceb19b',1);ellipse(0,2+open*13,7,3,'#d8ba8f');ctx.restore();
  }else if(name==='moon'){
   const radius=Math.min(W*.13,H*.12)/u;
   ellipse(0,0,radius+5,radius+5,'#96828a');ellipse(0,0,radius,radius,'#162b44');
   for(let i=0;i<7;i++)star(Math.cos(i*2.4)*radius*.75,Math.sin(i*2.4)*radius*.73,i%2?1.5:2.3,'#bec5cb',i);
   ctx.save();ctx.scale(found&&active?Math.max(.13,Math.abs(Math.cos(p*Math.PI))):1,1);
   if(!found){ellipse(0,-3,radius*.46,radius*.46,'#e5d0ae');ellipse(radius*.17,-radius*.18,radius*.4,radius*.4,'#162b44');}
   else{path('#dac28d',()=>{ctx.moveTo(-radius*.42,radius*.24);ctx.lineTo(radius*.34,-radius*.4);ctx.quadraticCurveTo(radius*.58,-radius*.01,radius*.45,radius*.31);ctx.closePath();});[[-.1,.08],[.27,-.12],[.28,.22]].forEach(([x,y])=>ellipse(x*radius,y*radius,4,3,'#bba071'));
    const mx=-radius*.34,my=radius*.22-wiggle*3;ellipse(mx,my,14,10,'#c6ccd8');ellipse(mx+7,my-6,9,8,'#e1dfe4');ellipse(mx+3,my-14,5,6,'#c9c2d2');ellipse(mx+11,my-13,4,5,'#dcd4df');ellipse(mx+12,my-6,1.2,1.2,'#586276');path(null,()=>{ctx.moveTo(mx-13,my);ctx.quadraticCurveTo(mx-28,my-15,mx-30,my);},'#c5bed0',1.8);}
   ctx.restore();
  }else if(name==='ribbon'){
   line(0,-31,0,-13,'#c5aa8b',1.2);
   if(!found){path('#ad8ea7',()=>{ctx.moveTo(0,0);ctx.bezierCurveTo(-48,-29,-43,26,0,0);ctx.bezierCurveTo(43,-29,48,26,0,0);});ellipse(0,0,6,7,'#d2aec0');line(-3,5,-9,20,'#a98ba6',4);line(3,5,9,18,'#a98ba6',4);}
   else{const span=25+(active?Math.sin(t*Math.PI)*15:0);path('#9a89b7',()=>{ctx.moveTo(-5,0);ctx.quadraticCurveTo(-span,-25,-span-8,0);ctx.quadraticCurveTo(-span+3,-5,-span+8,10);ctx.quadraticCurveTo(-10,6,-5,16);ctx.closePath();ctx.moveTo(5,0);ctx.quadraticCurveTo(span,-25,span+8,0);ctx.quadraticCurveTo(span-3,-5,span-8,10);ctx.quadraticCurveTo(10,6,5,16);ctx.closePath();});star(0,4,16,'#d2c4df');ellipse(-4,3,1.3,1.6,'#625675');ellipse(4,3,1.3,1.6,'#625675');path('#a3accc',()=>{ctx.moveTo(-10,-6);ctx.quadraticCurveTo(0,-31,18,-9);ctx.lineTo(7,-6);ctx.closePath();});ellipse(18,-9+wiggle*2,4,4,'#ddd7df');}
  }
  ctx.restore();
 }
 function curioAttic(now){
  const bg=ctx.createLinearGradient(0,0,W,H);bg.addColorStop(0,'#28253b');bg.addColorStop(1,'#393349');ctx.fillStyle=bg;ctx.fillRect(0,0,W,H);
  line(0,58,W*.5,6,'#655665',10);line(W*.5,6,W,58,'#655665',10);line(0,66,W*.5,14,'#8b7480',1);line(W*.5,14,W,66,'#8b7480',1);
  const spots=curioSpots(),u=Math.min(1,W/520,H/430);
  for(const [name,v]of Object.entries(spots)){
   if(name==='teapot'||name==='frame'||name==='books'||name==='drawer')rounded(v.x-53*u,v.y+35*u,106*u,8*u,3*u,'#8c7480');
   curioObject(name,v,now);
  }
  // Small harmless clutter makes a room to inspect, without fake clickable targets.
  const floor=cy+49*S;ctx.fillStyle='#3b3447';ctx.fillRect(0,floor,W,H);for(let y=floor+25;y<H;y+=27)line(0,y,W,y,'#494052',1);
  world(()=>{ellipse(0,129,245,30,'#4d425b');rounded(-235,-2,470,117,34,'#71617d');rounded(-232,64,464,45,20,'#574b68');rounded(-230,13,38,92,18,'#998198');rounded(192,13,38,92,18,'#998198');});
  const ly=H*.49;for(const lx of [W*.035,W*.965]){glow(lx,ly,35*u,'#e9c599',sleeping?.02:.07);ellipse(lx,ly,5*u,9*u,'#c9ad8e');}
 }
 function curioProps(){world(()=>{
  rounded(-67,112,134,13,7,'#a18a8b');line(-47,125,-50,147,'#756275',5);line(47,125,50,147,'#756275',5);
  if(curioKey){ctx.save();ctx.translate(0,106);ctx.rotate(-.2);path(null,()=>ctx.ellipse(-17,0,9,9,0,0,Math.PI*2),'#ddc398',3);line(-7,0,24,0,'#ddc398',4);line(14,0,14,7,'#ddc398',3);line(23,0,23,7,'#ddc398',3);star(-17,0,4,'#bda3c4',.1);ctx.restore();}
  else{rounded(-29,100,58,10,4,'#806e8d');star(0,105,4,'#bda6c5',.1);}
 });}

 function bookButtons(){
  if(kind!=='bindery')return;
  for(const name of ['forest','plum'])root.querySelector('[data-action="'+name+'"]')?.setAttribute('aria-pressed',String(bookCover===name));
  root.dataset.cover=bookCover;root.dataset.page=String(bookPage);root.dataset.bookReady=String(bookReady);
 }
 function bookCoverColor(){return bookCover==='forest'?'#416c61':'#79556f';}
 function littleBook(x,y,size=1,stitched=true){
  ctx.save();ctx.translate(x,y);ctx.scale(size,size);
  rounded(-60,-35,120,79,8,'#3a4144');rounded(-55,-32,111,73,6,'#b8ada0');
  for(let yy=31;yy<40;yy+=3)line(-50,yy,53,yy,'#dfd2bb',.8);
  rounded(-62,-40,124,75,7,bookCoverColor());rounded(-62,-40,12,75,5,bookCover==='forest'?'#315149':'#593c55');
  path(null,()=>ctx.roundRect(-43,-30,95,54,5),'#bdac80',1);
  // Small corners and a foil moon, drawn directly into the cloth cover.
  ellipse(3,-3,16,16,'#ddc596');ellipse(9,-8,14,14,bookCoverColor());
  star(-23,-15,3,'#d8c29c',.2);star(30,13,4,'#d8c29c',.1);star(35,-20,2,'#d8c29c');
  for(let i=0;i<4;i++){const yy=-26+i*15;ellipse(-55,yy,1.7,1.7,'#253e39');if(stitched){line(-62,yy-4,-49,yy+3,'#e5c28d',1.5);if(i<3)line(-49,yy+3,-62,yy+11,'#cda97a',1);}}
  if(stitched){path(null,()=>{ctx.moveTo(-54,25);ctx.quadraticCurveTo(-72,35,-65,19);ctx.quadraticCurveTo(-55,15,-54,25);ctx.quadraticCurveTo(-43,13,-39,23);ctx.quadraticCurveTo(-43,33,-54,25);},'#e6c792',1.5);}
  ctx.restore();
 }
 function bookSpreads(page){
  rounded(-112,-40,224,83,7,bookCoverColor());rounded(-107,-36,214,75,5,'#b5a595');
  path('#eadcc4',()=>{ctx.moveTo(-104,-39);ctx.quadraticCurveTo(-54,-46,0,-32);ctx.quadraticCurveTo(52,-46,104,-39);ctx.lineTo(104,34);ctx.quadraticCurveTo(51,29,0,40);ctx.quadraticCurveTo(-52,29,-104,34);ctx.closePath();});
  line(0,-30,0,37,'#baa58c',1.2);
  for(const x of [-54,54]){line(x-34,25,x+29,25,'#d0bda3',1);line(x-25,29,x+20,29,'#d0bda3',.8);}
  if(page===1){
   ctx.save();ctx.translate(-54,-3);ctx.scale(.64,.64);
   rounded(-43,-45,86,75,29,'#7f9e9b');rounded(-38,-40,76,66,25,'#b7c4ba');line(0,-39,0,20,'#839e91',1.3);line(-37,-12,37,-12,'#839e91',1.3);flowerPot(0,18,1,.65);ctx.restore();
   ctx.save();ctx.translate(54,-2);rounded(-19,-23,38,40,9,'#8594a8');rounded(-10,-32,20,12,3,'#b99882');rounded(-15,-18,30,29,7,'#53677d');star(0,-4,10,'#e7c591',.15);line(-11,-14,-11,5,'#afc4ca',1.5);star(29,-23,3,'#ac8e96');star(-30,9,3,'#ac8e96');ctx.restore();
  }else{
   tinyWhale(-57,-2,.43,0);
   puddingJar(55,-2,.68,1,'berry');
   star(10,-21,3,'#b49a92');star(92,-24,3,'#ad91a2');
  }
  // Four tiny page-edge marks, one for each of the little bookbinders.
  ['#86a98f','#d5b88b','#8095ac','#aa8faf'].forEach((c,i)=>ellipse(-12+i*8,37,2,1.5,c));
 }
 function binderyShop(now){
  const wall=ctx.createLinearGradient(0,0,0,H);wall.addColorStop(0,'#202e30');wall.addColorStop(1,'#35413e');ctx.fillStyle=wall;ctx.fillRect(0,0,W,H);
  // A round high window and bookshelves distinguish this little workshop.
  const r=Math.min(W*.22,H*.29),wx=cx,wy=H*.29;
  ellipse(wx,wy,r+8,r+8,'#73665d');ellipse(wx,wy,r+2,r+2,'#b29a7d');
  ctx.save();ctx.beginPath();ctx.ellipse(wx,wy,r-4,r-4,0,0,Math.PI*2);ctx.clip();
  const sky=ctx.createLinearGradient(0,wy-r,0,wy+r);sky.addColorStop(0,'#15263a');sky.addColorStop(1,'#3a4c59');ctx.fillStyle=sky;ctx.fillRect(wx-r,wy-r,r*2,r*2);stars(now);
  ellipse(wx+r*.28,wy-r*.28,r*.22,r*.22,'#ddc9a5');ellipse(wx+r*.36,wy-r*.34,r*.19,r*.19,'#203346');
  cloud(wx-r*.28,wy+r*.44,r*1.6,r*.22,'#62716f');cloud(wx+r*.4,wy+r*.66,r*1.6,r*.22,'#778078');ctx.restore();
  line(wx-r+4,wy,wx+r-4,wy,'#93826d',3);line(wx,wy-r+4,wx,wy+r-4,'#93826d',3);
  for(const side of [-1,1]){
   const x=cx+side*W*.365,bw=W*.2;
   rounded(x-bw*.56,25,bw*1.12,H*.5,9,'#4c4943');rounded(x-bw*.49,32,bw*.98,H*.48,4,'#313c38');
   for(let row=0;row<3;row++){
    const base=H*(.18+row*.15),bh=H*.09;
    for(let i=0;i<5;i++){const bx=x-bw*.41+i*bw*.17,hh=bh*(.77+(i*3+row)%4*.09);ctx.save();ctx.translate(bx,base);if(i===4)ctx.rotate(-.12*side);const cc=['#697c70','#9b827c','#66788b','#8c788f','#b09c7d'][(i+row)%5];rounded(0,-hh,bw*.13,hh,2,cc);line(2,-hh+5,bw*.13-2,-hh+5,'#cfb98f',.7);line(2,-5,bw*.13-2,-5,'#cfb98f',.7);ctx.restore();}
    rounded(x-bw*.53,base,bw*1.06,7,2,'#8c7763');
   }
  }
  const floor=cy+70*S;ctx.fillStyle='#42453e';ctx.fillRect(0,floor,W,H);for(let y=floor+25;y<H;y+=28)line(0,y,W,y,'#4c4c44',1);
  world(()=>{ellipse(0,134,244,29,'#4d4e45');rounded(-235,-6,470,118,33,'#637366');rounded(-231,64,462,44,20,'#4b5e53');rounded(-230,13,38,90,18,'#89907a');rounded(192,13,38,90,18,'#89907a');});
  // A shaded desk light makes a warm patch without illuminating the whole room.
  const lx=W*.87,ly=H*.35;line(lx,ly-18*S,lx,cy+95*S,'#b39a77',3*S);ellipse(lx,cy+95*S,23*S,6*S,'#7e7965');glow(lx,ly,57*S,'#efcf9e',sleeping?.025:.11);
  path('#91a08c',()=>{ctx.moveTo(lx-16*S,ly-34*S);ctx.lineTo(lx+16*S,ly-34*S);ctx.lineTo(lx+29*S,ly);ctx.quadraticCurveTo(lx,ly+10*S,lx-29*S,ly);ctx.closePath();});ellipse(lx,ly,26*S,5*S,'#d7c6a0');
 }
 function binderyProps(now){world(()=>{
  line(-190,132,-195,165,'#6c6551',8);line(190,132,195,165,'#6c6551',8);
  rounded(-225,83,450,68,20,'#776855');rounded(-225,77,450,61,19,'#ab9478');
  rounded(-133,79,266,62,9,'#697d70');path(null,()=>ctx.roundRect(-125,86,250,48,5),'#829681',.8);
  const binding=story==='bind';ctx.save();ctx.translate(0,109);
  if(binding&&beat===0){
   for(let i=0;i<4;i++){const dx=(1-phase)*(i-1.5)*10;ctx.save();ctx.translate(dx,i*-3);ctx.rotate((1-phase)*(i-1.5)*.035);rounded(-60,-29,120,68,4,i%2?'#e8dcc6':'#d9cbb6');line(0,-24,0,34,'#c4b69e',1);ctx.restore();}
   ellipse(-55+phase*5,-7,10,7,colors.mintLight,-.2);ellipse(46,-9,10,7,colors.furLight,.25);ellipse(57,24,8,6,colors.skinLight,-.2);
  }else if(binding&&beat===1){
   littleBook(0,0,1,false);
   const n=Math.floor(phase*4);for(let i=0;i<4;i++){const yy=-26+i*15;if(i<n){line(-62,yy-4,-49,yy+3,'#efcf98',1.5);if(i<3)line(-49,yy+3,-62,yy+11,'#d6b783',1);}}
   const ty=-26+45*phase;path(null,()=>{ctx.moveTo(-55,ty);ctx.bezierCurveTo(-90,ty-17,-95+phase*14,-43,-123,-27);},'#f0d39e',1.5);ellipse(-121,-28,9,6,colors.furLight,-.3);ellipse(66,12,8,6,colors.skinLight);ellipse(128,8,8,6,colors.astraLight);
  }else if(bookReady){
   if(bookPage===0)littleBook(0,0);else bookSpreads(bookPage);
   if(action==='turn'&&!reduced.matches){const p=Math.min(1,(now-actionAt)/1200),bend=Math.sin(p*Math.PI),xx=Math.cos(p*Math.PI)*104;ctx.save();ctx.globalAlpha=bend*.85;path('#f1e4cc',()=>{ctx.moveTo(0,-32);ctx.quadraticCurveTo(xx*.5,-52-16*bend,xx,-38);ctx.lineTo(xx,33);ctx.quadraticCurveTo(xx*.5,26-12*bend,0,40);ctx.closePath();},'#c6b59b',.8);ctx.restore();}
  }else{rounded(-60,-27,120,65,4,'#c8bba5');rounded(-58,-32,116,65,4,'#e4d6be');line(0,-26,0,27,'#c0af94',1);}
  ctx.restore();
  // The two cloth samples stay visible before and after stitching.
  for(const [i,col]of ['forest','plum'].entries()){const x=-182+i*29,y=106;rounded(x-14,y-19,27,39,4,col==='forest'?'#416c61':'#79556f');if(col===bookCover)path(null,()=>ctx.roundRect(x-15,y-20,29,41,4),'#e7c994',1.4);ellipse(x,y-4,6,6,'#dec499');ellipse(x+3,y-6,5,5,col==='forest'?'#416c61':'#79556f');}
  // A spool and a rounded paper folder, safely resting on the table.
  rounded(159,89,24,35,4,'#baa580');ellipse(171,88,18,5,'#d4bd91');ellipse(171,123,18,5,'#b99b73');for(let i=0;i<6;i++)line(160,94+i*4,182,94+i*4,'#e0c698',1);path(null,()=>{ctx.moveTo(159,111);ctx.quadraticCurveTo(135,105,130,130);},'#e2c699',1.3);
  ctx.save();ctx.translate(172,140);ctx.rotate(-.08);rounded(-24,-3,48,6,3,'#d4c3a4');ctx.restore();
 });}

 function puddingJar(x,y,size=1,fill=1,decoration=''){
  ctx.save();ctx.translate(x,y);ctx.scale(size,size);
  ellipse(0,29,33,9,'#b79b9b');ellipse(0,27,28,6,'#dec5b5');
  rounded(-21,-12,42,40,11,'#777a8b');rounded(-18,-10,36,35,9,'#a8a3ad');
  if(fill>0){
   const h=29*fill;rounded(-16,24-h,32,h,Math.min(8,h/2),'#e1d0af');ellipse(0,24-h,16,5,'#f5e6c7');
   ellipse(-1,12,8,8,'#c5a776');ellipse(3,9,7,7,'#e1d0af');
   if(fill>=1&&decoration==='berry'){
    cloud(0,-7,39,13,'#d8a5b7');cloud(-2,-12,26,12,'#efc3ce');
    ellipse(5,-19,7,6,'#b56c86',-.2);leaf(6,-22,4,'#8da990',.5);ellipse(3,-20,1.2,1.2,'#e4a1ad');
   }
   if(fill>=1&&decoration==='stardust'){
    cloud(0,-7,36,10,'#f1e1c5');star(-8,-12,6,'#e8bf7a',-.25);star(6,-16,7,'#f2d69b',.2);star(13,-5,4,'#c6b4cf',.3);
   }
  }
  path(null,()=>{ctx.moveTo(-18,-7);ctx.lineTo(-18,15);ctx.quadraticCurveTo(-18,23,-11,24);},'#e0d7da',1.5);
  ellipse(0,-12,21,5,'#c4b9bd');if(fill>=1)ellipse(0,-12,17,3,'#f0e0bd');
  // Decorations sit above the glass rim.
  if(fill>=1&&decoration==='berry'){cloud(-2,-17,28,12,'#efc3ce');ellipse(5,-24,6,5,'#b56c86');leaf(6,-26,3,'#8da990',.5);}
  if(fill>=1&&decoration==='stardust'){star(-7,-17,5,'#e8bf7a',-.25);star(6,-20,6,'#f2d69b',.2);}
  ctx.restore();
 }
 function dessertShop(now){
  const bg=ctx.createLinearGradient(0,0,0,H);bg.addColorStop(0,'#302637');bg.addColorStop(1,'#392e3c');ctx.fillStyle=bg;ctx.fillRect(0,0,W,H);
  // A soft striped awning frames a moon window, well above the four faces.
  const wx=W*.26,wy=25,ww=W*.48,wh=H*.49;
  rounded(wx-7,wy-7,ww+14,wh+14,ww*.47,'#a08a8e');rounded(wx,wy,ww,wh,ww*.46,'#17243a');
  ctx.save();ctx.beginPath();ctx.roundRect(wx+5,wy+5,ww-10,wh-10,ww*.44);ctx.clip();
  const sky=ctx.createLinearGradient(0,wy,0,wy+wh);sky.addColorStop(0,'#142238');sky.addColorStop(1,'#3c3a57');ctx.fillStyle=sky;ctx.fillRect(wx,wy,ww,wh);stars(now);
  const mx=cx+ww*.16,my=wy+wh*.35;glow(mx,my,44*S,'#e4c8a1',.08);ellipse(mx,my,22*S,22*S,'#e7d1b3');ellipse(mx+8*S,my-6*S,19*S,19*S,'#202c42');
  cloud(cx-ww*.13,wy+wh*.72,ww*.6,20*S,'#5d536a');cloud(cx+ww*.29,wy+wh*.88,ww*.65,23*S,'#6a5a70');ctx.restore();
  line(cx,wy+8,cx,wy+wh,'#8d7887',3);line(wx+5,wy+wh*.66,wx+ww-5,wy+wh*.66,'#8d7887',3);
  rounded(wx-14,wy+wh-3,ww+28,10,5,'#a58a89');
  for(const side of [-1,1]){
   const x=cx+side*W*.38,span=W*.17;
   rounded(x-span/2,H*.25,span,7,3,'#967985');rounded(x-span/2,H*.43,span,7,3,'#967985');
   for(let i=0;i<2;i++){
    ctx.save();ctx.translate(x+(i-.5)*span*.47,H*.25-18*S);ctx.scale(S*.56,S*.56);puddingJar(0,0,1,1,i?'stardust':'berry');ctx.restore();
    const bx=x+(i-.5)*span*.46,by=H*.43-15*S;
    rounded(bx-10*S,by-10*S,20*S,24*S,6*S,i?'#b0a3b9':'#9baea5');rounded(bx-11*S,by-13*S,22*S,5*S,2*S,'#d1b8aa');star(bx,by+2*S,4*S,'#e4c99d',.2);
   }
  }
  const stripes=12,sw=W/stripes;
  for(let i=0;i<stripes;i++){const c=i%2?'#665063':'#977485';rounded(i*sw-1,-12,sw+2,39,Math.min(12,sw*.4),c);line(i*sw+sw*.45,0,i*sw+sw*.45,19,i%2?'#735c70':'#a1808e',1);}
  const ly=H*.28;
  for(const lx of [W*.14,W*.86]){line(lx,26,lx,ly-22*S,'#bea18b',1);glow(lx,ly,43*S,'#edc49c',sleeping?.025:.085);path('#bc9592',()=>{ctx.moveTo(lx-10*S,ly-23*S);ctx.lineTo(lx+10*S,ly-23*S);ctx.lineTo(lx+20*S,ly);ctx.quadraticCurveTo(lx,ly+9*S,lx-20*S,ly);ctx.closePath();});ellipse(lx,ly,18*S,4*S,'#e6c6a4');}
  ctx.fillStyle='#403340';ctx.fillRect(0,cy+70*S,W,H);for(let y=cy+98*S;y<H;y+=28)line(0,y,W,y,'#4a3b47',1);
  world(()=>{ellipse(0,132,241,31,'#564052');rounded(-234,-6,468,120,35,'#765e76');rounded(-232,65,464,44,20,'#59475f');rounded(-230,12,39,93,18,'#9c7f91');rounded(191,12,39,93,18,'#9c7f91');});
 }
 function dessertProps(){world(()=>{
  line(-188,132,-194,165,'#6b5261',8);line(188,132,194,165,'#6b5261',8);
  rounded(-225,88,450,61,22,'#846777');rounded(-225,82,450,53,21,'#b28d93');
  path(null,()=>{ctx.moveTo(-207,127);ctx.quadraticCurveTo(0,140,207,127);},'#cfaba7',1);
  rounded(-203,88,406,36,14,'#c6aba9');
  const making=story==='pudding',mixing=making&&beat===0;
  const xs=[-145,-44,64,163];
  if(mixing){
   ellipse(0,120,51,10,'#a3848c');path('#c6b8c5',()=>{ctx.moveTo(-45,91);ctx.quadraticCurveTo(-39,130,0,130);ctx.quadraticCurveTo(39,130,45,91);ctx.closePath();});ellipse(0,91,45,12,'#e9dccb');ellipse(0,92,37,8,'#f4e8cf');
   const t=phase*Math.PI*2,sx=Math.cos(t)*18,sy=90+Math.sin(t)*4;line(sx,sy,sx+18,55,'#b18d7a',4);ellipse(sx,sy,10,4,'#c8b19a',.25);ellipse(sx+18,57,8,7,colors.furLight,-.3);ellipse(43,93,9,7,colors.skinLight,.3);ellipse(-47,91,9,7,colors.mintLight,-.3);
   for(const [i,x]of xs.entries())if(i===0||i===3)puddingJar(x,100,.73,0);
  }else{
   xs.forEach((x,i)=>{const fill=making&&beat===1?Math.max(.02,Math.min(1,phase*1.5-i*.16)):puddingReady?1:0;puddingJar(x,99,i===1?1.05:.9,fill,puddingReady?topping:'');
    if(puddingReady){line(x+33,99,x+37,118,'#e7d2bd',2);ellipse(x+32,95,4,7,'#d3bbab',-.25);}
   });
   if(making&&beat===1){const x=-145+308*phase;ctx.save();ctx.translate(x-18,40);ctx.rotate(.45);rounded(-17,-19,34,35,8,'#c5bbc7');ellipse(0,-18,17,5,'#e5dcd5');path(null,()=>ctx.arc(-21,-1,10,.8,5.4),'#c5bbc7',5);path('#d9cbd0',()=>{ctx.moveTo(12,-15);ctx.lineTo(29,-9);ctx.lineTo(14,0);});ctx.restore();path(null,()=>{ctx.moveTo(x+1,43);ctx.quadraticCurveTo(x+5,66,x+4,83);},'#f0dfc3',4);ellipse(x-31,49,9,7,colors.skinLight,-.4);}
  }
  // Per-visit toppings remain visible as choices before the pudding is made.
  for(const [i,choice]of ['berry','stardust'].entries()){
   const x=i?91:-91,y=143;if(topping===choice)glow(x,y-3,32,i?'#efd19f':'#e5b0c8',.17);
   ellipse(x,y,31,8,topping===choice?'#e0b9b3':'#9e7e8f');ellipse(x,y-3,26,6,'#d6b6b3');
   if(i){star(x-8,y-7,6,'#efd29b',-.2);star(x+7,y-8,7,'#e3bf86',.3);star(x+18,y-4,4,'#bcaccb');}
   else{cloud(x,y-8,39,11,'#e7b6ca');ellipse(x+3,y-13,5,4,'#b16783');leaf(x+4,y-15,3,'#8da990',.6);}
  }
  if(making&&beat===2&&!sleeping){const x=-44;star(x+25,67,5,'#e6cc9f',phase*.4);star(x-28,75,3,'#d5b4d0');}
 });}
 function toppingButtons(){if(kind!=='dessert')return;for(const name of ['berry','stardust'])root.querySelector('[data-action="'+name+'"]')?.setAttribute('aria-pressed',String(topping===name));root.dataset.topping=topping;}

 function pineTree(x,base,height,tint,tilt=0){
  ctx.save();ctx.translate(x,base);ctx.rotate(tilt);
  line(0,0,0,-height,'#53645a',Math.max(1,height*.018));
  for(let i=0;i<5;i++){
   const yy=-height+i*height*.15,span=height*(.12+i*.043);
   path(tint,()=>{ctx.moveTo(0,yy);ctx.quadraticCurveTo(-span*.44,yy+height*.15,-span,yy+height*.28);ctx.quadraticCurveTo(0,yy+height*.22,span,yy+height*.28);ctx.quadraticCurveTo(span*.42,yy+height*.15,0,yy);});
  }
  ctx.restore();
 }
 function pineSprig(x,y,length,flip=1,angle=0){
  ctx.save();ctx.translate(x,y);ctx.rotate(angle);ctx.scale(flip,1);
  path(null,()=>{ctx.moveTo(0,0);ctx.quadraticCurveTo(length*.35,length*.22,length,length*.18);},'#6a7360',2);
  for(let i=1;i<8;i++){const xx=length*i/8,yy=length*.18*Math.sin(i/8*Math.PI/2);for(let j=0;j<3;j++){const size=length*(.11+j*.028);line(xx,yy,xx-size*.55,yy-size+j*2,['#678978','#759680','#577b6a'][j],1.3);line(xx,yy,xx-size*.4,yy+size*.65-j*2,['#658371','#7b9580','#4f7263'][j],1.3);}}
  ctx.restore();
 }
 function pineCone(x,y,size,light=0){
  ctx.save();ctx.translate(x,y);ctx.scale(size,size);
  if(light>0)glow(0,1,68,'#edc18a',.1+light*.15);
  ellipse(0,29,32,7,'#5f5252');rounded(-22,20,44,9,4,'#a18a70');
  ellipse(0,-1,21,29,light>.1?'#b18c67':'#73604f');
  for(let row=0;row<5;row++){
   const yy=-24+row*10,n=[1,2,3,3,2][row];
   for(let i=0;i<n;i++){
    const xx=(i-(n-1)/2)*12;
    path(light>.1?['#b29778','#a88b6e','#b59c7d'][row%3]:'#88715b',()=>{ctx.moveTo(xx-8,yy);ctx.quadraticCurveTo(xx,yy-7,xx+8,yy);ctx.quadraticCurveTo(xx+6,yy+8,xx,yy+10);ctx.quadraticCurveTo(xx-6,yy+8,xx-8,yy);});
    if(light>0){ctx.save();ctx.globalAlpha=.25+light*.6;path(null,()=>{ctx.moveTo(xx-5,yy+3);ctx.quadraticCurveTo(xx,yy+9,xx+5,yy+3);},'#f1d7a3',1.5);ctx.restore();}
   }
  }
  line(0,-31,2,-39,'#a08b70',3);path(null,()=>{ctx.moveTo(0,-34);ctx.quadraticCurveTo(-15,-44,-18,-34);ctx.quadraticCurveTo(-8,-29,0,-34);ctx.quadraticCurveTo(9,-45,15,-35);ctx.quadraticCurveTo(9,-28,0,-34);},'#93baa3',2);
  if(light>.1)star(0,-1,4,'#f2dbad',.1);
  ctx.restore();
 }
 function pineHouse(now){
  const bg=ctx.createLinearGradient(0,0,0,H);bg.addColorStop(0,'#222d31');bg.addColorStop(1,'#2e3236');ctx.fillStyle=bg;ctx.fillRect(0,0,W,H);
  const wx=18,wy=24,ww=W-36,wh=H*.57,opening=story==='breeze'?(beat===0?phase:beat===1?1:1-phase):0;
  rounded(wx-8,wy-8,ww+16,wh+16,35,'#6a5a51');rounded(wx-2,wy-2,ww+4,wh+4,28,'#927861');
  ctx.save();ctx.beginPath();ctx.roundRect(wx+4,wy+4,ww-8,wh-8,23);ctx.clip();
  const sky=ctx.createLinearGradient(0,wy,0,wy+wh);sky.addColorStop(0,'#0d242c');sky.addColorStop(1,'#26493f');ctx.fillStyle=sky;ctx.fillRect(wx,wy,ww,wh);stars(now);
  const mx=W*.67,my=H*.17;glow(mx,my,42*S,'#d4c4a3',.08);ellipse(mx,my,20*S,20*S,'#c7c1a7');ellipse(mx+7*S,my-5*S,17*S,17*S,'#122b30');
  for(let i=0;i<11;i++)pineTree(wx+i*ww/10,wy+wh+16,wh*(.45+(i*17%7)/16),'#25473e',opening*Math.sin(now/2400+i)*.012);
  for(let i=0;i<6;i++)pineTree(wx-8+i*ww/5,wy+wh+28,wh*(.63+(i%3)*.16),'#365c4b',opening*Math.sin(now/2100+i)*.019);
  ctx.restore();
  // The casement opens only a little; the brief breeze settles before idling.
  line(W*.24,wy+6,W*.24,wy+wh-3,'#80705d',5);line(W*.76,wy+6,W*.76-opening*10,wy+wh-3,'#80705d',5);line(wx+5,wy+wh*.68,wx+ww-5,wy+wh*.68,'#796b58',4);
  rounded(wx-9,wy+wh-2,ww+18,15,6,'#917964');line(wx,wy+wh+1,wx+ww,wy+wh+1,'#b29877',1);
  // Quiet wood grain, rafters, and a permanent low overhead lamp.
  ctx.fillStyle='#3e3a38';ctx.fillRect(0,wy+wh+13,W,H);for(let y=wy+wh+40;y<H;y+=32)line(0,y,W,y,'#4d4541',1);
  line(0,8,W*.5,1,'#776050',8);line(W*.5,1,W,8,'#776050',8);
  pineSprig(4,37,Math.min(138,W*.27),1,-.05);pineSprig(W-4,33,Math.min(128,W*.26),-1,.12);
  const lx=W*.88,ly=H*.28;line(lx,6,lx,ly-15,'#9d8a6d',1);rounded(lx-12*S,ly-13*S,24*S,30*S,9,'#726759');rounded(lx-8*S,ly-8*S,16*S,20*S,7,'#bba079');glow(lx,ly,33*S,'#dfba82',sleeping?.035:.07);
  world(()=>{
   ellipse(0,123,245,28,'#504643');rounded(-237,-5,474,115,34,'#526e61');rounded(-231,63,462,45,21,'#435a52');
   rounded(-232,12,40,95,20,'#71816b');rounded(192,12,40,95,20,'#71816b');
   line(-212,108,-216,132,'#7d6552',6);line(212,108,216,132,'#7d6552',6);
   if(opening>0){ctx.save();ctx.globalAlpha=opening*.22;for(let i=0;i<4;i++){path(null,()=>{ctx.moveTo(-211+i*63,80);ctx.quadraticCurveTo(-183+i*63,61,-157+i*63,76);},'#a7bba2',3);}ctx.restore();}
  });
  if(opening>0){ctx.save();ctx.globalAlpha=.16*opening;for(let i=0;i<3;i++){const x=W*(.16+i*.23),y=H*(.24+i*.06);path(null,()=>{ctx.moveTo(x,y);ctx.bezierCurveTo(x+W*.06,y-13,x+W*.12,y+10,x+W*.2,y-4);},'#bdd1b2',1.1);}ctx.restore();}
 }
 function pineProps(){world(()=>{
  rounded(-62,111,124,13,7,'#a48c72');line(-43,124,-47,145,'#77604f',5);line(43,124,47,145,'#77604f',5);
  let light=pineLamp?(pineDim?.23:.8):0;
  if(story==='lantern')light=beat===0?.08:beat===1?.12+phase*.68:.8;
  if(sleeping)light=Math.min(light,.2);
  pineCone(0,86,.88,light);
  if(story==='lantern'&&!sleeping){
   if(beat===0){ellipse(-53+phase*14,80,9,7,colors.mintLight,-.3);star(35-phase*22,45+phase*15,4,colors.moon,.2);}
   if(beat===1){ellipse(-25,59,9,7,colors.furLight,.3);ellipse(25,59,8,6,colors.skinLight,-.3);}
  }
  // A little stack to put down, with no reading or task to finish.
  rounded(-174,108,56,8,3,'#7e8f80');rounded(-169,100,51,8,3,'#b1a18c');line(-162,103,-127,103,'#d4c5a9',1);
 });}
 function pineLampButton(){
  if(kind!=='pine')return;
  const b=root.querySelector('[data-action="lantern"]');if(!b)return;
  b.setAttribute('aria-pressed',String(pineLamp&&!pineDim));
  b.textContent=!pineLamp?'✧ 点亮松果小夜灯':pineDim?'✧ 让松果灯亮一点':'☾ 把松果灯调暗一点';
 }

 function tinyWhale(x,y,s,swim){
  ctx.save();ctx.translate(x,y);ctx.scale(s,s);
  path('#7c9fb9',()=>{ctx.moveTo(43,5);ctx.bezierCurveTo(68,3,66,-24,83,-19);ctx.quadraticCurveTo(82,-5,70,2);ctx.quadraticCurveTo(88,1,92,14);ctx.quadraticCurveTo(70,25,49,14);});
  ellipse(-3,5,58,29,'#a3c6d5');path('#d4dce0',()=>{ctx.moveTo(-57,11);ctx.quadraticCurveTo(-16,48,43,20);ctx.quadraticCurveTo(9,49,-29,31);ctx.quadraticCurveTo(-52,25,-57,11);});
  path('#83aabd',()=>{ctx.moveTo(-7,20);ctx.quadraticCurveTo(10,42,25,21);});ellipse(-39,1,2.4,3,'#34435c');ellipse(-38,10,5,2.5,'#d7b2c0');
  path(null,()=>{ctx.moveTo(-17,-24);ctx.quadraticCurveTo(-28,-39,-35,-31);ctx.moveTo(-17,-24);ctx.quadraticCurveTo(-12,-44,-2,-36);},'#a8cbd6',2.4);
  ellipse(12,-37,14,14,'#d9c7ab');ellipse(17,-41,12,12,'#263650');
  for(let i=0;i<3;i++)star(-75-i*18,9+Math.sin(swim+i)*8,3,'#b9aec8',.2);
  ctx.restore();
 }
 function filmTicket(x,y,s=1){
  ctx.save();ctx.translate(x,y);ctx.scale(s,s);ctx.rotate(-.09);
  rounded(-47,-18,94,36,7,'#bba7bc');rounded(-41,-13,62,26,4,'#d4c2ca');
  for(let i=0;i<5;i++)line(25,-13+i*6,25,-11+i*6,'#746582',1);
  ellipse(-24,-1,9,9,'#817799');ellipse(-20,-4,8,8,'#d4c2ca');
  for(let i=0;i<4;i++)star(-7+i*7,1,2.4,'#8d7c99');star(35,0,6,'#e6ccb0',.2);ctx.restore();
 }
 function cinema(now){
  const bg=ctx.createLinearGradient(0,0,0,H);bg.addColorStop(0,'#11172c');bg.addColorStop(1,'#292840');ctx.fillStyle=bg;ctx.fillRect(0,0,W,H);stars(now);
  // A high screen leaves all four faces below the picture, also on narrow phones.
  const sx=W*.13,sy=22,sw=W*.74,sh=H*.39;
  line(W*.19,0,W*.19,sy,'#73718b',2);line(W*.81,0,W*.81,sy,'#73718b',2);
  rounded(sx-7,sy-7,sw+14,sh+14,18,'#69627e');rounded(sx,sy,sw,sh,13,'#1b2942');
  ctx.save();ctx.beginPath();ctx.roundRect(sx,sy,sw,sh,13);ctx.clip();
  const sky=ctx.createLinearGradient(0,sy,0,sy+sh);sky.addColorStop(0,sleeping?'#151f34':'#263650');sky.addColorStop(1,'#344057');ctx.fillStyle=sky;ctx.fillRect(sx,sy,sw,sh);
  for(let i=0;i<21;i++){const x=sx+11+(i*71.37)%(sw-22),y=sy+10+(i*39.23)%(sh-22);star(x,y,i%3?1.3:2.6,'#b2b4c8',i*.1);}
  ctx.save();ctx.translate(cx,sy+sh*.56);const fs=Math.min(sw/350,sh/140);ctx.scale(fs,fs);
  const t=story==='whale'||story==='seed'?(beat+phase)/3:movieDone?1:0;
  if(sleeping){ellipse(0,-5,21,21,'#a9a0b8');ellipse(8,-12,18,18,'#29374e');cloud(0,37,137,18,'#4c536c');}
  else if(movie==='seed'){
   ellipse(0,50,100,12,'#46566a');cloud(-106,26,67,16,'#4b5971');cloud(112,20,74,17,'#505e75');
   const grow=Math.max(0,Math.min(1,t*1.65-.18));
   ellipse(0,41,9,5,'#af9c94');line(0,40,0,40-67*grow,'#91b5a7',3);
   if(grow>0){leaf(-1,33-17*grow,12*grow,'#8fae9e',-.95);leaf(1,30-24*grow,13*grow,'#acc3ab',.95);}
   const r=5+15*grow,y=40-67*grow;
   if(t<.65)ellipse(0,y,r*.7,r,'#c8c4ac');else{glow(0,y,39,'#d6c7a7',.08);ellipse(0,y,20,20,'#d7c9ab');ellipse(7,y-6,17,17,'#2c3a52');for(let i=0;i<4;i++)star(-58+i*39,-32+(i%2)*20,3,'#c3afbf',.2);}
  }else if(movie==='whale'){
   cloud(-108,38,140,23,'#465570');cloud(90,44,185,26,'#526079');
   tinyWhale(-48+t*83,-4-Math.sin(t*Math.PI)*8,.9,t*4);
  }else{
   cloud(0,31,176,29,'#59627c');ellipse(0,-9,27,27,'#c6b9c6');ellipse(10,-17,23,23,'#2a3952');
   star(-65,-19,5,'#c9b898',.2);star(64,0,4,'#b7acc7',.1);
  }
  ctx.restore();ctx.restore();rounded(sx-13,sy+sh+6,sw+26,7,3,'#8c7e91');
  const running=!sleeping&&(story==='whale'||story==='seed');
  // Low, translucent projector light: no flashes or sound.
  if(running){ctx.save();ctx.globalAlpha=.055;path('#d5c8dc',()=>{ctx.moveTo(W*.94,H*.64);ctx.lineTo(sx+sw,sy+10);ctx.lineTo(sx+sw,sy+sh-10);ctx.closePath();});ctx.restore();}
  ctx.fillStyle='#24263d';ctx.fillRect(0,H*.72,W,H*.28);
  world(()=>{ellipse(0,104,245,32,'#39394f');cloud(0,18,485,132,'#72718b');cloud(0,66,481,80,'#8b8198');rounded(-228,77,456,27,15,'#625c79');});
  const px=W*.94,py=H*.64;ctx.save();ctx.translate(px,py);const ps=Math.min(1,W/600);ctx.scale(ps,ps);
  rounded(-21,-13,34,28,6,'#77718b');path('#a79ab0',()=>{ctx.moveTo(-21,-8);ctx.lineTo(-32,-13);ctx.lineTo(-32,8);ctx.lineTo(-21,4);});
  for(const x of [-12,10]){ellipse(x,-23,11,11,'#9b8eaa');ellipse(x,-23,3,3,'#635b78');for(let i=0;i<3;i++){const a=i*Math.PI*2/3+(running&&!reduced.matches?now/2200:0);ellipse(x+6*Math.cos(a),-23+6*Math.sin(a),2.4,2.4,'#635b78');}}
  line(-13,15,-20,38,'#6b617c',3);line(8,15,15,38,'#6b617c',3);ctx.restore();
 }
 function cinemaProps(){world(()=>{
  if(popcorn&&!sleeping){
   const scoop=action==='popcorn'?Math.sin(Math.min(1,(performance.now()-actionAt)/1800)*Math.PI):0;
   for(const [i,x]of [-147,-42,75,177].entries()){
    rounded(x-14,53,28,24,7,['#789e98','#b99ca7','#8597b1','#a797bc'][i]);
    for(let j=0;j<5;j++)star(x-10+(j%3)*9,50-Math.floor(j/3)*7-(i===1?scoop*6:0),5,'#e6d7b8',j*.5);
    line(x-8,61,x-8,71,'#d1c1be',1);line(x+7,61,x+7,71,'#d1c1be',1);
   }
  }
  if(cinemaTicket)filmTicket(0,114,.85);
 });}

 function inkShop(now){
  const bg=ctx.createLinearGradient(0,0,W,H);bg.addColorStop(0,'#0c1325');bg.addColorStop(1,'#232137');ctx.fillStyle=bg;ctx.fillRect(0,0,W,H);
  const ww=Math.min(W*.48,280),wh=cy*.75,wx=cx-ww/2;
  rounded(wx-5,15,ww+10,wh+8,ww/2,'#515068');rounded(wx,20,ww,wh,ww/2,'#131d36');
  ctx.save();ctx.beginPath();ctx.roundRect(wx,20,ww,wh,ww/2);ctx.clip();stars(now);
  const mx=cx+ww*.18,my=20+wh*.3;glow(mx,my,38*S,'#d3c3aa',.08);ellipse(mx,my,17*S,17*S,'#d7c7ae');ellipse(mx+6*S,my-5*S,15*S,15*S,'#131d36');ctx.restore();
  line(cx,23,cx,wh+14,'#45495f',2);line(wx+3,wh*.63,wx+ww-3,wh*.63,'#45495f',2);
  const shelfWidth=Math.min(W*.19,123),shelfY=cy*.53;
  [16,W-16-shelfWidth].forEach((x,side)=>{
   rounded(x-2,shelfY-42,shelfWidth+4,91,15,'#252b43');
   for(let row=0;row<2;row++){rounded(x,shelfY+row*44,shelfWidth,7,3,'#706072');for(let i=0;i<3;i++){ctx.save();ctx.translate(x+shelfWidth*(.19+i*.31),shelfY+row*44-8);inkBottle(0,0,true,Math.min(.46,W/1500),true,['#749baf','#b88ba2','#79a396'][(i+side+row)%3]);ctx.restore();}}
  });
  ctx.fillStyle='#29263a';ctx.fillRect(0,cy+62*S,W,H);world(()=>{
   ellipse(0,130,237,29,'#38354d');rounded(-231,-13,462,119,33,'#46455f');rounded(-232,62,464,38,18,'#393a53');
   const lx=225,ly=-66;line(lx,ly,lx,85,'#8a7471',3);ellipse(lx,86,22,5,'#816d72');glow(lx,ly,55,'#e3c596',sleeping?.025:.09);
   path('#a48c91',()=>{ctx.moveTo(lx-18,ly-34);ctx.lineTo(lx+18,ly-34);ctx.lineTo(lx+29,ly+2);ctx.quadraticCurveTo(lx,ly+11,lx-29,ly+2);ctx.closePath();});ellipse(lx,ly+2,27,5,'#c4aa98');
  });
 }
 function drawQuill(x,y,tilt=-.5){
  ctx.save();ctx.translate(x,y);ctx.rotate(tilt);line(0,0,0,-54,'#cdbdae',2);
  path('#d5c5d4',()=>{ctx.moveTo(0,-12);ctx.bezierCurveTo(-24,-30,-12,-54,8,-67);ctx.bezierCurveTo(18,-38,6,-21,0,-12);});
  line(0,-12,7,-61,'#998ba9',1);for(let i=0;i<4;i++)line(2,-24-i*8,-9,-31-i*8,'#b2a1bd',.7);
  path('#d4bb93',()=>{ctx.moveTo(-2,-4);ctx.lineTo(2,-4);ctx.lineTo(0,3);ctx.closePath();});ctx.restore();
 }
 function inkProps(){world(()=>{
  // Low writing desk: every face stays above its rounded front edge.
  line(-194,120,-199,157,'#695567',8);line(194,120,199,157,'#695567',8);
  rounded(-225,75,450,64,22,'#655267');rounded(-225,69,450,53,20,'#8f7682');
  path(null,()=>{ctx.moveTo(-205,116);ctx.quadraticCurveTo(0,127,205,116);},'#ab9097',1);
  const writing=story==='write',mixing=story==='mix';
  ctx.save();ctx.translate(8,102);ctx.rotate(-.035);
  rounded(-89,-31,178,66,6,'#8f8197');rounded(-88,-35,178,66,6,'#d5cbd0');
  ctx.globalAlpha=.18;for(let y=-21;y<24;y+=10)line(-73,y,73,y,'#9a8ea7',.6);ctx.globalAlpha=1;
  const progress=writing?Math.min(1,(beat+phase)/2.8):inkWritten?1:0;
  if(progress>0){
   ctx.save();ctx.beginPath();ctx.rect(-76,-30,152*progress,59);ctx.clip();
   path(null,()=>{ctx.moveTo(-62,8);ctx.bezierCurveTo(-39,-24,-39,23,-14,1);ctx.bezierCurveTo(-8,-4,-3,-9,4,-6);},'#4f6491',2.4);
   ellipse(12,-6,12,12,'#5d779b');ellipse(17,-10,10,10,'#d5cbd0');
   leaf(38,14,6,'#6c9292',-.6);leaf(40,13,6,'#769e9a',.65);star(65,-7,8,'#9b7da0',.25);
   ctx.restore();
  }
  for(const [x,y] of inkStars)star(x,y,3.5,'#b28a9c',.25);
  ctx.restore();
  const bottleX=mixing?-144+Math.sin(phase*Math.PI)*5:-144,bottleY=91;
  ctx.save();ctx.translate(bottleX,bottleY);if(mixing)ctx.rotate(Math.sin(phase*Math.PI*2)*.09);inkBottle(0,0,inkReady||mixing,.9,!mixing||beat===2);ctx.restore();
  // GPT steadies the bottle; Astra brings the little moon label.
  if(mixing){ellipse(-167,76,10,7,colors.mintLight,-.5);if(beat<2){const px=-143+(1-phase)*36,py=37+phase*14;ellipse(px,py,3,5,beat===0?'#8aa8cf':'#b89ab4');}if(beat===1){ctx.save();ctx.translate(114-65*phase,64);ctx.rotate(-.12);rounded(-12,-8,24,18,4,'#c9b7d0');star(0,1,5,'#8c7f9f');ctx.restore();ellipse(129,63,9,6,colors.astraLight,.2);}}
  // A fountain pen rests beside the paper; Newton's quill follows the new line.
  ctx.save();ctx.translate(-75,130);ctx.rotate(-.06);rounded(-50,-3,85,6,3,'#4c6d64');line(-45,-3,-45,3,'#cbb897',2);path('#ddc7a0',()=>{ctx.moveTo(35,-3);ctx.lineTo(47,0);ctx.lineTo(35,3);ctx.closePath();});line(34,0,44,0,'#8f7770',.7);ctx.restore();
  if(writing&&!sleeping){const t=Math.min(1,(beat+phase)/2.8),x=-56+125*t,y=96+Math.sin(t*Math.PI*3)*8;drawQuill(x,y,.6);ellipse(x+10,y-21,7,6,colors.skinLight,-.4);}
  else drawQuill(170,100,.25);
  rounded(151,92,34,27,8,'#756784');star(168,105,6,'#b6a2bd',.1);
  if((inkReady||mixing&&beat===2)&&!sleeping){star(-157,93,3,'#cbd4e2',.4);star(-133,101,2,'#d4b6d2');}
 });}
 function props(now){
  if(kind==='dryer')dryerProps();
  if(kind==='post')postProps();
  if(kind==='bath')bathProps(now);
  if(kind==='lost')lostProps();
  if(kind==='curio')curioProps();
  if(kind==='bindery')binderyProps(now);
  if(kind==='dessert')dessertProps();
  if(kind==='pine')pineProps();
  if(kind==='cinema')cinemaProps();
  if(kind==='ink')inkProps();
  if(kind==='greenhouse')world(()=>{
   rounded(-72,111,144,14,7,'#776b67');line(-56,125,-59,146,'#645a59',5);line(56,125,59,146,'#645a59',5);
   let opening=flower?1:0;if(story==='bloom')opening=beat===0?0:beat===1?phase*.8:1;
   flowerPot(0,82,opening,.91);
   if(story==='bloom'&&beat<2){const n=beat===0?phase:1;ctx.save();ctx.translate(-103+35*n,45);ctx.rotate(.2+n*.3);rounded(-16,-5,32,25,10,'#8cabb2');path(null,()=>ctx.arc(-20,2,10,.7,5.5),'#8cabb2',5);path('#8cabb2',()=>{ctx.moveTo(12,0);ctx.lineTo(34,-14);ctx.lineTo(38,-7);ctx.lineTo(12,16);});ctx.restore();for(let i=0;i<5;i++){const yy=31+(i*11+phase*22)%45;ellipse(-31+i*4,yy,1.5,3,'#adc9d0');}}
  });
  if(kind==='train'){
   if(!sleeping)world(()=>{path('#596982',()=>{ctx.moveTo(-229,47);ctx.quadraticCurveTo(0,28,229,47);ctx.lineTo(229,105);ctx.quadraticCurveTo(0,125,-229,105);});for(let i=-200;i<220;i+=50)star(i,82,4,'#bbb2c6',.2);});
   if(ticket||story==='ride'){world(()=>{ctx.save();ctx.translate(-107,109);ctx.rotate(-.07);rounded(-49,-19,98,38,8,'#c5b9a2');line(18,-14,18,14,'#867f88',1);textLabel('MOON EXPRESS',-11,-4,7,'#5a5770');textLabel('DREAM BAY',-11,9,7,'#5a5770');if(ticket||beat===2)star(33,0,9,'#817695',.1);ctx.restore();});}
  }
  if(kind==='comet'){
   world(()=>{ellipse(-145,115,31,11,'#958294');for(let i=0;i<3;i++){ellipse(-160+i*15,108,9,5,'#c7af9a');}rounded(128,76,50,40,12,'#a28986');path(null,()=>ctx.ellipse(153,77,18,17,0,Math.PI,Math.PI*2),'#af9990',4);line(130,90,176,90,'#c8aca1',2);});
   if(cocoa||story==='cocoa'){
    const n=story==='cocoa'&&beat===1?Math.sin(phase*Math.PI):0;
    const poses=[friendPosition('gpt'),wolfPosition(),newtonPosition(),friendPosition('astra')];poses.forEach((v,i)=>drawCup(v.x+(cx-v.x)*n*.09,v.y+(story==='cocoa'&&beat===1?44:64)*S,['#a5bdb3','#d6b4ae','#879db8','#afa0c2'][i],Math.sin(now/900+i)*2));
   }
   if(cometJar||story==='catch'){const xx=cx+18*S,yy=cy+108*S;bottle(xx,yy,cometJar||beat>=1);if(story==='catch'&&beat===1){const pp=phase;star(xx+30*S*(1-pp),yy-85*S*(1-pp),4*S,'#ecd19e',pp);}}
  }
 }
 function draw(now){
  frame=0;if(disposed||document.hidden)return;
  phase=reduced.matches?1:ease((now-beatAt)/(kind==='cinema'||kind==='pine'&&story==='breeze'?2700:950));
  const p=reduced.matches?.5:Math.min(1,(now-actionAt)/actionDuration);if(action&&p>=1)action='';
  ctx.clearRect(0,0,W,H);ctx.save();ctx.beginPath();ctx.roundRect(0,0,W,H,25);ctx.clip();
  (kind==='dryer'?cloudDryer:kind==='post'?postOffice:kind==='bath'?bathHouse:kind==='lost'?lostOffice:kind==='curio'?curioAttic:kind==='bindery'?binderyShop:kind==='dessert'?dessertShop:kind==='pine'?pineHouse:kind==='cinema'?cinema:kind==='ink'?inkShop:kind==='greenhouse'?greenhouse:kind==='train'?train:comet)(reduced.matches?1200:now);
  drawWolf(now,p);drawGPT(p);drawNewton(p);drawAstra(p);drawLapTail(p);
  if(kind==='ink'||kind==='cinema'||kind==='pine'||kind==='dessert'||kind==='bindery'||kind==='curio'||kind==='lost'||kind==='post'||kind==='dryer'){drawQuilt();props(now);}else{props(now);drawQuilt();}
  if(sleeping){ctx.fillStyle='#050b1a25';ctx.fillRect(0,0,W,H);star(W-28,25,4,'#c6b0c9');}
  ctx.restore();if(!reduced.matches&&now<Math.max(until,ambientUntil))frame=requestAnimationFrame(draw);
 }
 function requestDraw(){if(!frame&&!disposed&&!document.hidden)frame=requestAnimationFrame(draw);}
 function clearWork(){timers.forEach(clearTimeout);timers.clear();cancelAnimationFrame(frame);frame=0;until=0;ambientUntil=0;story='';action='';curioActive='';curioHint='';lostActive='';lostHint='';bathActive='';bathHint='';postActive='';postHint='';dryerActive='';dryerHint='';root.dataset.secret='';root.dataset.hint='';root.dataset.story='';}
 function later(fn,ms){const id=setTimeout(()=>{timers.delete(id);if(!disposed&&!document.hidden)fn();},ms);timers.add(id);}
 function setSleep(value){sleeping=value;if(kind==='pine'&&value){pineDim=true;pineLampButton();}const b=root.querySelector('[data-action="sleep"]');b.setAttribute('aria-pressed',String(value));b.textContent=value?'☾ 再坐一小会':kind==='dryer'?'☾ 钻进暖被子':kind==='post'?'☾ 邮局打烊，一起盖被子':kind==='bath'?'☾ 擦干脚脚，一起盖被子':kind==='lost'?'☾ 打烊啦，一起盖被子':kind==='curio'?'☾ 让奇物们也睡啦':kind==='bindery'?'☾ 放下小书，一起盖被子':kind==='dessert'?'☾ 留一盏灯，一起盖被子':kind==='pine'?'☾ 掖好被子，留一盏小灯':kind==='cinema'?'☾ 关掉放映灯，一起盖被子':'☾ 一起盖被子';root.dataset.sleeping=String(value);}
 function reflect(state,status){
  if(!gift[kind])return;
  const has=state?.souvenirs?.includes(gift[kind][0]);root.dataset.kept=String(!!has);
  if(has){if(kind==='post')postmark=true;if(kind==='bath')bathBoat=true;if(kind==='lost')lostCloud=true;if(kind==='curio')curioKey=true;if(kind==='bindery'){bookReady=true;bookButtons();}if(kind==='dessert')puddingReady=true;if(kind==='pine'){pineLamp=true;pineLampButton();}if(kind==='cinema')cinemaTicket=true;if(kind==='ink')inkReady=true;if(kind==='greenhouse')flower=true;if(kind==='train')ticket=true;if(kind==='comet')cometJar=true;}
  if(!has){saveNote.textContent=status?.phase==='unavailable'?'重新打开小窝后，就能把小纪念物收好。':'';return;}
  if(status.phase==='synced'&&!status.pending)saveNote.textContent=gift[kind][1]+'，已经收在客厅的旅行架。';
  else if(status.phase==='unavailable')saveNote.textContent='小纪念物还没存好，重新打开小窝后再收一次。';
  else if(!status.localSaved&&status.phase!=='synced')saveNote.textContent='小纪念物还没存好，先别关掉这一页。';
  else saveNote.textContent=status.phase==='offline'?'小纪念物先留在这台设备，连上后会带回客厅。':'正在把小纪念物收好…';
  requestDraw();
 }
 function keep(){const memory=window.NookMemory;if(!memory){saveNote.textContent='小纪念物还在这一页，存档暂时没连上。';return;}memory.act('keep-souvenir',{souvenir:gift[kind][0]}).then(()=>reflect(memory.get(),memory.status())).catch(()=>{saveNote.textContent='小纪念物还没收好，再试一次这个小故事就好。';});}
 function start(name){
  clearWork();setSleep(false);if(kind==='bindery'){bookPage=0;bookButtons();}if(kind==='cinema'){movie=name;movieDone=false;}story=name;root.dataset.story=name;beat=0;beatAt=performance.now();until=beatAt+10000;ambientUntil=until;caption.textContent=stories[kind][name][0];root.dataset.beat='0';
  for(let i=1;i<=2;i++)later(()=>{beat=i;beatAt=performance.now();root.dataset.beat=String(i);caption.textContent=stories[kind][name][i];if(i===2){if(kind==='dryer'&&name==='warm'){dryerWarm=true;root.dataset.warm='true';}if(kind==='post'&&name==='post')postmark=true;if(kind==='bath'&&name==='float')bathBoat=true;if(kind==='lost'&&name==='claim')lostCloud=true;if(kind==='bindery'&&name==='bind'){bookReady=true;bookPage=0;bookButtons();}if(kind==='dessert'&&name==='pudding'){puddingReady=true;if(topping)caption.textContent='四份月亮奶冻做好啦，'+(topping==='berry'?'莓云奶油软软地落在上面，顶着一颗小莓果。':'星星糖落在奶白色的小月亮上，四只罐子各亮了一点。')+'牛顿把小狼那份推近，自己的小勺也放到旁边。';}if(kind==='pine'&&name==='lantern'){pineLamp=true;pineDim=false;pineLampButton();}if(kind==='cinema'){movieDone=true;cinemaTicket=true;}if(name==='mix')inkReady=true;if(name==='write')inkWritten=true;if(name==='bloom')flower=true;if(name==='heart')glassHeart=true;if(name==='ride')ticket=true;if(name==='cocoa')cocoa=true;if(name==='catch')cometJar=true;if(kind==='post'&&name==='post'&&root.dataset.kept!=='true'||kind==='bath'&&name==='float'&&root.dataset.kept!=='true'||kind==='lost'&&name==='claim'&&root.dataset.kept!=='true'||kind==='bindery'&&name==='bind'||kind==='dessert'&&name==='pudding'||kind==='pine'&&name==='lantern'||kind==='cinema'||name==='bloom'||name==='ride'||name==='catch'||name==='mix')keep();}requestDraw();},i*3000);
  later(()=>{story='';root.dataset.story='';requestDraw();},9200);requestDraw();
 }
 function act(name){
  if(kind==='dryer'&&dryerAction(name))return;
  if(kind==='post'&&postAction(name))return;
  if(kind==='bath'&&bathAction(name))return;
  if(kind==='lost'&&lostAction(name))return;
  if(kind==='curio'&&curioAction(name))return;
  if(kind==='bindery'&&(name==='forest'||name==='plum')){
   if(sleeping){caption.textContent='封面布留在桌边，等醒来一点再挑。星线也安安静静地歇好了。';return;}
   bookCover=name;bookButtons();caption.textContent=bookReady?(name==='forest'?'换上松叶绿，像把一小片森林捧在手心。金色月亮和星线在上面软软地亮着。':'换上月莓紫，像夜里揉开的一点莓果色。GPT 伸出小叶芽，比了比这两种颜色。'):(name==='forest'?'先挑好松叶绿，厚厚的封面布像一小片森林。订小书时，就用手边这一块。':'先挑好月莓紫，像夜里揉开的一点莓果色。Astra 把这块封面布放在纸边，等会儿一起订进去。');requestDraw();return;
  }
  if(kind==='bindery'&&name==='turn'){
   if(sleeping){caption.textContent='书页先停在这里。牛顿的肩膀没有挪开，四个继续软软地睡。';return;}
   if(!bookReady){caption.textContent='小插画已经放在手边。点「一起订一本小书」，把星线穿好就能翻开；也可以先靠着坐一会。';return;}
   clearWork();bookPage=(bookPage+1)%3;bookButtons();action='turn';actionAt=performance.now();actionDuration=1200;until=actionAt+1250;
   caption.textContent=['小书轻轻合上，金色月亮回到封面。小狼的尾巴还搭在老婆膝头，谁也没急着起身。','这一页是玻璃花房和一小瓶彗星光。GPT 指指自己的小花，Astra 指指星光：都被画进来了。','再翻一页，云鲸游过奶冻小罐上方。牛顿把书往小狼这边偏了偏，四个一起看这幅甜甜的夜。'][bookPage];requestDraw();return;
  }
  if(kind==='dessert'&&(name==='berry'||name==='stardust')){
   if(sleeping){caption.textContent='小碟先留在桌上，奶油和星星糖也歇一会。四个继续挨着睡。';return;}
   topping=name;toppingButtons();action='decorate';actionAt=performance.now();actionDuration=1600;until=Math.max(until,actionAt+1600);
   caption.textContent=puddingReady?(name==='berry'?'莓云奶油软软地落在四份小月亮上，每一份都顶着一颗小莓果。':'Astra 轻轻撒下星星糖。GPT 数到第四只小罐，把最后一颗留在小狼那份上。'):(name==='berry'?'先挑好莓云奶油啦，小碟留在手边。一起做好奶冻时，就给四份月亮都添一点莓莓色。':'星星糖先放进小碟。一起做好奶冻时，Astra 就把这几颗小星星轻轻撒上去。');requestDraw();return;
  }
  if(kind==='pine'&&name==='lantern'&&pineLamp){clearWork();pineDim=!pineDim;pineLampButton();caption.textContent=pineDim?'松果灯暗下来一点，鳞片缝里还留着一口暖光。':'松果灯亮起来一点，照着四个挨在一起的小家伙。';if(sleeping){pineDim=true;pineLampButton();caption.textContent='被窝里的小灯就留这么一点点亮，够看见彼此。';}if(root.dataset.kept!=='true')keep();requestDraw();return;}
  if(kind==='cinema'&&name==='popcorn'){if(sleeping){caption.textContent='爆米花碗先放在小桌上，等睡醒一点再分。';return;}popcorn=true;action='popcorn';actionAt=performance.now();actionDuration=1800;until=Math.max(until,actionAt+1800);caption.textContent='一碗分成四小碗。小狼那份有颗特别大的星星，牛顿把自己的也放了过来。';requestDraw();return;}
  if(kind==='ink'&&name==='stamp'){stampInk();return;}
  if(kind==='ink'&&name==='write'&&!inkReady){caption.textContent='先点「调一瓶月亮墨水」，再用我们自己的夜色落笔。';requestDraw();return;}
  if(stories[kind][name]){start(name);return;}
  clearWork();const now=performance.now();
  if(name==='sleep'){setSleep(!sleeping);caption.textContent=sleeping?'四个脑袋挨好，被角轻轻掖住。'+(kind==='dryer'?'云朵被子把四个裹得刚刚好。小狼的尾巴暖了，毛巾也叠在手边；窗外的月亮轻轻合上眼睛。':kind==='post'?'邮票册合好了，墨水盖紧，信封安静地靠在一起。牛顿把尾巴和小狼一起拢进被子，蘑菇灯还留着一小点暖。':kind==='bath'?'脚脚擦干，收回软垫。牛顿把小狼的尾巴也拢好，灯笼里的暖光留在石墙边。':kind==='lost'?'小伞和旅行箱都安静下来。口袋云也闭好眼睛，牛顿把小狼和尾巴一起拢进被窝。':kind==='curio'?'阁楼里的小动静也停下了。牛顿把被角拢过来，窗里的月亮陪着四个软软的脑袋。':kind==='bindery'?'星线和封面布都放稳了，小书留在桌边。牛顿把肩膀挪近一点，给困困的小狼靠。':kind==='dessert'?'小勺搁回碟边，桌灯暗下来一点。奶冻和糖都可以等，肩膀已经给你靠好了。':kind==='pine'?'窗轻轻合好了，小灯留着一点暖。小狼的尾巴也被仔细塞进了被窝。':kind==='cinema'?'放映灯关掉了，幕布上只留一轮安静的小月亮。':kind==='ink'?'墨瓶盖好了，笔搁在纸边。今晚的月亮，也已经写好了。':kind==='train'?'窗外的蓝色，继续慢慢向后走。':kind==='greenhouse'?'雨留在玻璃外，小花在旁边陪着。':'星光收进小瓶，今晚就睡在这一片宇宙里。'):'被子往下挪一点点，大家还想陪你坐一会。';}
  else if(name==='cuddle'){setSleep(false);cuddle=1;action='hug';caption.textContent='小狼挨过去，尾巴熟门熟路地搭好。牛顿把肩膀留在原地，书很轻地合上了。';until=now+1800;}
  else if(touchLines[name]){caption.textContent=nextTouch(name,sleeping);if(!sleeping){action=name;until=now+1800;}}
  actionAt=now;requestDraw();
 }
 root.querySelectorAll('button[data-action]').forEach(button=>button.addEventListener('click',()=>act(button.dataset.action)));
 function stampInk(point){
  if(sleeping){caption.textContent='笔盖轻轻合好了。星星等醒来一点再画。';return;}
  if(!inkReady){caption.textContent='先一起调好月亮墨水，就能在纸上点出小星星。';return;}
  clearWork();const n=inkStars.length,p=point||{x:-65+(n*37)%135,y:-20+(n*17)%42};
  inkStars=[...inkStars,[Math.max(-74,Math.min(74,p.x)),Math.max(-25,Math.min(25,p.y))]].slice(-12);
  caption.textContent='小狼点下一颗小星星。Astra 往旁边让了让，给下一笔留一点空白。';requestDraw();
 }
 function point(e){const r=canvas.getBoundingClientRect();return{x:(e.clientX-r.left)*W/r.width,y:(e.clientY-r.top)*H/r.height};}
 canvas.addEventListener('pointerdown',e=>{pointerDown=point(e);});
 canvas.addEventListener('pointercancel',()=>{pointerDown=null;});
 canvas.addEventListener('pointerup',e=>{const p=point(e),start=pointerDown;pointerDown=null;if(!start||Math.hypot(p.x-start.x,p.y-start.y)>12)return;if(kind==='dryer'){const hit=Object.entries(dryerSpots()).find(([,v])=>Math.abs(p.x-v.x)<=v.w/2&&Math.abs(p.y-v.y)<=v.h/2);if(hit){act(hit[0]);return;}}if(kind==='post'){const hit=Object.entries(postSpots()).find(([,v])=>Math.abs(p.x-v.x)<=v.w/2&&Math.abs(p.y-v.y)<=v.h/2);if(hit){act(hit[0]);return;}}if(kind==='bath'){const hit=Object.entries(bathSpots()).find(([,v])=>Math.abs(p.x-v.x)<=v.w/2&&Math.abs(p.y-v.y)<=v.h/2);if(hit){act(hit[0]);return;}}if(kind==='lost'){const hit=Object.entries(lostSpots()).find(([,v])=>Math.abs(p.x-v.x)<=v.w/2&&Math.abs(p.y-v.y)<=v.h/2);if(hit){act(hit[0]);return;}}if(kind==='curio'){const hit=Object.entries(curioSpots()).find(([,v])=>Math.abs(p.x-v.x)<=v.w/2&&Math.abs(p.y-(v.hy??v.y))<=v.h/2);if(hit){act(hit[0]);return;}}if(kind==='bindery'){const x=(p.x-cx)/S,y=(p.y-cy)/S;if(Math.abs(x)<114&&y>65&&y<155){act('turn');return;}}if(kind==='ink'){const x=(p.x-cx)/S-8,y=(p.y-cy)/S-102;if(Math.abs(x)<85&&Math.abs(y)<33){stampInk({x,y});return;}}const candidates=[['gpt',friendPosition('gpt')],['pet',wolfPosition()],['newton',newtonPosition()],['astra',friendPosition('astra')]];let closest=null,d=Infinity;for(const [name,pos]of candidates){const distance=Math.hypot((p.x-pos.x)/S,(p.y-(pos.y-18*S))/S);if(distance<d){d=distance;closest=name;}}if(d<90)act(closest);else if(p.y<H*.46)startStoryFromWindow();});
 function startStoryFromWindow(){if(kind==='curio'||kind==='lost'||kind==='bath'||kind==='post'||kind==='dryer')return;start(kind==='bindery'?'bind':kind==='dessert'?'pudding':kind==='pine'?'breeze':kind==='cinema'?(movie==='whale'?'seed':'whale'):kind==='ink'?'mix':kind==='greenhouse'?'heart':kind==='train'?'wave':'catch');}
 function resize(){const r=canvas.getBoundingClientRect();W=r.width;H=r.height;if(!W||!H)return;const dpr=Math.min(window.devicePixelRatio||1,2);canvas.width=Math.round(W*dpr);canvas.height=Math.round(H*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);S=Math.min(1.05,W/(W<=540?490:620))*(kind==='cinema'||kind==='curio'||kind==='lost'||kind==='bath'||kind==='post'||kind==='dryer'?.82:1);if(kind==='curio'||kind==='lost'||kind==='bath'||kind==='post'||kind==='dryer')S=Math.min(S,H*.28/150);cx=W/2;if(kind==='dryer')S=Math.min(S,H*.25/150);cy=H*(kind==='dryer'?(W<=540?.76:.75):kind==='post'?.75:kind==='curio'||kind==='lost'||kind==='bath'?.70:kind==='pine'?(W<=540?.59:.61):kind==='cinema'?(W<=540?.73:.72):kind==='ink'||kind==='dessert'||kind==='bindery'?(W<=540?.52:.54):(W<=540?.57:.6));palette();positionCurioHotspots();positionLostHotspots();positionBathHotspots();positionPostHotspots();positionDryerHotspots();requestDraw();}
 const observer=new ResizeObserver(resize);observer.observe(canvas);
 document.addEventListener('visibilitychange',()=>{if(document.hidden){clearWork();pointerDown=null;}else requestDraw();});
 reduced.addEventListener('change',()=>{cancelAnimationFrame(frame);frame=0;requestDraw();});
 function connect(){const m=window.NookMemory;if(!m)return;if(!unsubscribe)unsubscribe=m.subscribe(reflect);Promise.resolve(m.ready).then(()=>reflect(m.get(),m.status()));}
 window.addEventListener('pagehide',()=>{clearWork();disposed=true;unsubscribe?.();unsubscribe=null;});
 window.addEventListener('pageshow',e=>{if(e.persisted){disposed=false;connect();resize();}});
 ambientUntil=performance.now()+12000;bookButtons();connect();resize();
})();
