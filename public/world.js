import * as THREE from './vendor/three.module.js';
import {createTrio} from './characters.js';

export function buildWorld(){
 const scene=new THREE.Scene();
 const camera=new THREE.OrthographicCamera(-5,5,4.4,-4.4,.1,90);
 const materials=new Map();
 const mat=(color,extra={})=>{const key=color+JSON.stringify(extra);if(!materials.has(key))materials.set(key,new THREE.MeshStandardMaterial({color,roughness:.85,metalness:0,...extra}));return materials.get(key)};
 const mesh=(geo,color,parent,x=0,y=0,z=0,extra={})=>{const m=new THREE.Mesh(geo,mat(color,extra));m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m};
 const sphereGeo=new THREE.SphereGeometry(1,28,18);
 const ball=(parent,color,x,y,z,sx,sy=sx,sz=sx)=>{const b=mesh(sphereGeo,color,parent,x,y,z);b.scale.set(sx,sy,sz);return b};
 const world=new THREE.Group();scene.add(world);
 const ambient=new THREE.HemisphereLight('#e9e0ff','#777096',2.2);scene.add(ambient);
 const key=new THREE.DirectionalLight('#ffdfba',3.6);key.position.set(-4,8,6);key.castShadow=true;key.shadow.mapSize.set(1024,1024);key.shadow.camera.left=-5;key.shadow.camera.right=5;key.shadow.camera.top=6;key.shadow.camera.bottom=-4;key.shadow.normalBias=.04;key.shadow.bias=-.0003;scene.add(key);
 const fill=new THREE.DirectionalLight('#b4c9ff',1.8);fill.position.set(6,4,-3);scene.add(fill);
 const floor=mesh(new THREE.CylinderGeometry(3.35,3.5,.3,80),'#7d789b',world,0,-.2,0);
 mesh(new THREE.CylinderGeometry(3.30,3.30,.045,80),'#b0a7c4',world,0,-.033,0);
 mesh(new THREE.CylinderGeometry(3.08,3.08,.027,80),'#c7b6cd',world,0,.002,0);
 // A small stage, like a treasured handmade music box, with a soft bed at its centre.
 ball(world,'#a9a2c5',0,.16,.2,2.50,.26,1.62);
 ball(world,'#e4d8dd',0,.37,.24,2.36,.30,1.53);
 for(let i=0;i<7;i++){const a=Math.PI+(i/6)*Math.PI;ball(world,'#e9dfe8',Math.cos(a)*2.02,.56,Math.sin(a)*1.08-.15,.52,.37,.52)}
 ball(world,'#d7c9df',-1.1,.62,-.32,.77,.25,.67).rotation.z=.12;
 ball(world,'#d7c9df',1.1,.62,-.32,.77,.25,.67).rotation.z=-.12;
 const trio=createTrio();trio.group.position.set(0,.64,.38);world.add(trio.group);
 const blanketGroup=new THREE.Group();world.add(blanketGroup);blanketGroup.position.set(0,1.1,1.03);
 const quilt=ball(blanketGroup,'#a5b1d2',0,-.04,0,2.1,.19,.66);
 for(let row=0;row<3;row++)for(let i=0;i<10;i++){const x=-1.78+i*.395;const z=-.39+row*.33;const y=.08+Math.sqrt(Math.max(0,1-(x/2.1)**2-(z/.74)**2))*.085;ball(blanketGroup,'#d1d5e5',x,y,z,.024,.01,.025)}
 const blanketEdge=ball(blanketGroup,'#c5c6df',0,.01,-.48,2.02,.10,.13);
 blanketGroup.visible=false;
 // Brass moon arch and suspended clay stars.
 const arch=mesh(new THREE.TorusGeometry(2.72,.035,10,100,Math.PI),'#d9b78e',world,0,.69,-1.35);arch.rotation.z=0;
 function star(parent,color,x,y,z,r=.18){const shape=new THREE.Shape();for(let i=0;i<10;i++){const a=i*Math.PI/5+Math.PI/2,rr=i%2?r*.47:r;const px=Math.cos(a)*rr,py=Math.sin(a)*rr;i?shape.lineTo(px,py):shape.moveTo(px,py)}shape.closePath();const g=new THREE.ExtrudeGeometry(shape,{depth:.065,bevelEnabled:true,bevelSegments:3,steps:1,bevelSize:.028,bevelThickness:.027});return mesh(g,color,parent,x,y,z)}
 function thread(x,yTop,yBottom,z){return mesh(new THREE.CylinderGeometry(.009,.009,yTop-yBottom,6),'#b99b8f',world,x,(yTop+yBottom)/2,z)}
 const mobiles=[];[[-1.95,2.55,2.1],[-.87,3.27,2.62],[.7,3.33,2.86],[1.83,2.71,2.17]].forEach(([x,yt,yb],i)=>{thread(x,yt,yb+.15,-1.32);const s=star(world,i%2?'#b4d9ca':'#eed3a6',x,yb,-1.30,.16+i%2*.015);s.rotation.z=i*.3;mobiles.push(s)});
 // Crescent is a filled concave extrusion, not a bright light in the eyes.
 const moonShape=new THREE.Shape();moonShape.absarc(0,0,.52,Math.PI*.34,Math.PI*1.66,false);moonShape.quadraticCurveTo(-.15,-.14,Math.cos(Math.PI*.34)*.52,Math.sin(Math.PI*.34)*.52);
 const moon=mesh(new THREE.ExtrudeGeometry(moonShape,{depth:.16,bevelEnabled:true,bevelThickness:.06,bevelSize:.055,bevelSegments:5,steps:1}),'#f0d69c',world,-2.02,3.0,-1.25,{emissive:'#c6a472',emissiveIntensity:.13});moon.rotation.z=-.27;
 // A warm mushroom lamp and a tiny bedside book stack.
 const lamp=new THREE.Group();lamp.position.set(-2.65,.12,.38);world.add(lamp);
 ball(lamp,'#dfc29e',0,.11,0,.36,.13,.30);mesh(new THREE.CylinderGeometry(.055,.075,.64,12),'#d7b388',lamp,0,.45,0);
 const lampShade=ball(lamp,'#f2d7a7',0,.8,0,.49,.26,.41);ball(lamp,'#f9e6c1',0,.68,0,.44,.035,.36);
 const lampLight=new THREE.PointLight('#ffd7a0',3.0,7,2);lampLight.position.set(-2.65,1,.55);world.add(lampLight);
 for(let i=0;i<3;i++){const b=mesh(new THREE.BoxGeometry(.55,.115,.39),['#beabbf','#a2beb6','#d9bea9'][i],world,-2.23,.1+i*.12,1.26);b.rotation.y=i*.15-.1;mesh(new THREE.BoxGeometry(.49,.05,.398),'#eee0cc',b,0,.005,0)}
 // Little pine: the travelling sock has finally acquired a branch.
 const tree=new THREE.Group();tree.position.set(2.6,.04,-.45);world.add(tree);mesh(new THREE.CylinderGeometry(.12,.15,.52,12),'#a88981',tree,0,.26,0);
 for(let i=0;i<3;i++){const cone=mesh(new THREE.ConeGeometry(.52-i*.10,.85-i*.1,32),'#a3c6bb',tree,0,.66+i*.36,0);cone.scale.z=.84;ball(tree,'#e5dddf',0,.89+i*.34,0,.33-i*.075,.055,.25-i*.05)}
 const sock=new THREE.Group();tree.add(sock);sock.position.set(-.34,.75,.33);sock.rotation.z=-.3;ball(sock,'#ceb5db',0,0,0,.09,.2,.07);ball(sock,'#ceb5db',.065,-.14,0,.14,.075,.075);ball(sock,'#e4d4e5',0,.17,0,.11,.047,.08);
 const props=new THREE.Group();world.add(props);
 // A plush cloud-whale souvenir. It rests beside the trio across scenes.
 const whale=new THREE.Group();whale.position.set(1.68,.66,1.09);whale.scale.setScalar(.6);whale.rotation.y=-.2;world.add(whale);
 ball(whale,'#a9cadd',0,0,0,.62,.35,.36);ball(whale,'#e4e5e1',-.13,-.15,.05,.43,.17,.31);ball(whale,'#92b4d0',.6,.16,0,.24,.12,.21).rotation.z=.5;ball(whale,'#92b4d0',.78,.24,0,.18,.12,.24).rotation.z=-.5;ball(whale,'#3a3f55',-.35,.07,.327,.037);ball(whale,'#e2b5c2',-.32,-.01,.339,.077,.037,.018);
 const snow=new THREE.Group();world.add(snow);const snowItems=[];for(let i=0;i<48;i++){const s=star(snow,i%3===0?'#e4bbd5':i%3===1?'#f2d8aa':'#cdd8e9',0,0,0,.035+(i%4)*.011);s.userData.seed=i;s.visible=false;snowItems.push(s)}
 const sparkles=new THREE.Group();world.add(sparkles);for(let i=0;i<13;i++){const x=Math.sin(i*3.81)*3.45,y=.9+(i*1.39%2.95),z=-1.5-Math.cos(i*8)*.5;const s=star(sparkles,'#e2cda7',x,y,z,.035+i%3*.022);s.rotation.z=i}
 let sceneId='starlight-snowglobe';
 function setTheme(id){sceneId=id;props.traverse(o=>{if(o.geometry&&o.geometry!==sphereGeo)o.geometry.dispose();if(o.isLine)o.material.dispose()});props.clear();if(id==='star-laundry-night'){for(let i=0;i<5;i++){star(props,['#efd2a2','#c5b1d9','#acd0bf'][i%3],-1.8+i*.88,2.87-(Math.sin(i)*.16),-.9,.17);}}
  if(id==='pillow-planetarium'){const points=[[-1.8,2.85],[-.5,3.5],[.7,3.1],[1.9,3.65]];const geom=new THREE.BufferGeometry().setFromPoints(points.map(p=>new THREE.Vector3(p[0],p[1],-.8)));props.add(new THREE.Line(geom,new THREE.LineBasicMaterial({color:'#bdc6e5',transparent:true,opacity:.65})));points.forEach(([x,y])=>star(props,'#e9d3a8',x,y,-.8,.09));}
  if(id==='rain-cloud-bath'){for(let i=0;i<5;i++){const b=ball(props,'#cad5e8',-1.0+i*.5,3.18+Math.sin(i)*.13,-.85,.49,.22,.25);b.material=mat('#cad5e8',{transparent:true,opacity:.72})}for(let i=0;i<8;i++)ball(props,'#bdd3e4',-1.3+i*.37,2.6-(i%3)*.14,-.85,.029,.10,.035);}
  if(id==='cloud-whale-night'){whale.scale.setScalar(.92);whale.position.set(2.05,1.0,.8)}else{whale.scale.setScalar(.6);whale.position.set(1.68,.66,1.09)}
  floor.material=mat(id==='rain-cloud-bath'?'#78939a':id==='star-laundry-night'?'#93809f':'#7d789b');
 }
 let isSleeping=false;
 function setSleep(value){isSleeping=value;trio.setSleep(value);blanketGroup.visible=value;whale.visible=!value;lampLight.intensity=value?1.1:3;key.intensity=value?2.5:3.6;ambient.intensity=value?1.65:2.2;}
 function animate(t,pet,magicElapsed,reduced){trio.animate(reduced?0:t,pet,reduced);mobiles.forEach((m,i)=>m.rotation.z=reduced?i*.3:i*.3+Math.sin(t*.5+i)*.07);if(magicElapsed>=0){const p=Math.min(magicElapsed/18,1);snowItems.forEach((s,i)=>{s.visible=true;const seed=i*12.9898;const x=Math.sin(seed)*2.8,z=Math.cos(seed*1.73)*1.5;const start=1.8+(i%8)*.38;const end=.09+(i%3)*.03;s.position.set(x+(reduced?0:Math.sin(t+i)*.11),start*(1-p)+end*p,z);s.rotation.set(i*.37,t*.16+i*.3,i*.47)})}else snowItems.forEach(s=>s.visible=false);}
 function setView(yaw=.12,pitch=.43,aspect=1.7){const radius=12,target=new THREE.Vector3(0,1.4,0);camera.position.set(Math.sin(yaw)*Math.cos(pitch)*radius,Math.sin(pitch)*radius+target.y,Math.cos(yaw)*Math.cos(pitch)*radius);camera.lookAt(target);const height=aspect<1.0?7.8/aspect:6.2;camera.left=-height*aspect/2;camera.right=height*aspect/2;camera.top=height/2;camera.bottom=-height/2;camera.updateProjectionMatrix();camera.updateMatrixWorld();}
 setView();setTheme(sceneId);
 return {scene,camera,world,trio,props,materials,setTheme,setSleep,animate,setView,blanketGroup,snowItems};
}
