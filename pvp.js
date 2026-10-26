import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.180.0/+esm';
import {makeJobWeaponModel,jobHeldBladeYaw,jobHeldWeaponScale,JOBS} from './job-system.js?v=20261022heldBladeEdgeForward21';
import {makeFirstPersonHand} from './first-person-hand.js?v=20261022pvpFirst01';
import {makeAvatarHeldItems} from './avatar-held-items.js?v=20261022pvpFirst01';

const $=id=>document.getElementById(id);
const CLASSES={
  sword:{name:'剣士',hp:120,speed:7.1,range:3.0,damage:18,cooldown:630,arc:.18},
  merc:{name:'傭兵',hp:105,speed:8.6,range:2.65,damage:10,cooldown:300,arc:.05},
  shield:{name:'盾兵',hp:155,speed:5.7,range:2.6,damage:13,cooldown:850,arc:.05,block:.70},
  archer:{name:'弓兵',hp:90,speed:7.5,range:13,damage:16,cooldown:900,arc:.78},
  mage:{name:'魔術師',hp:100,speed:6.9,range:7.3,damage:21,cooldown:1150,arc:.38}
};
const PEER_URL='https://cdn.jsdelivr.net/npm/peerjs@1.5.5/+esm';
const PEER_PREFIX='nexacraft-pvp-arena-v1-';
const roundLength=180;
let myClass='sword',enemyClass='sword',role='',state='menu',roomCode='',peer=null,connection=null,peerLoader=null;
let me=null,rival=null,myAvatar=null,enemyAvatar=null,roundEnd=0,remaining=roundLength,lastSync=0,lastClock=0;
let keys=new Set(),clock=new THREE.Clock(),effects=[],noticeTimeout=0;
// Analog mobile joystick: x = strafe (+right), y = backward (+down).
const joystick={x:0,y:0,pointerId:null};
const JUMP_SPEED=7.4,GRAVITY=19.5;
let lookPitch=0,walkMotion=0,walkPhase=0,lastHurtUntil=0,attackVisualAt=0,enemyAttackAt=-Infinity;
// CPU-only projectiles. PvP between human players keeps its existing rules.
let cpuProjectiles=[];
let entranceStart=0,entranceFightAnnounced=false;
const entranceDuration=6500;
const gateCloseDuration=1600; // The iron gates descend after the fighters enter.
const GATE_OPEN_HEIGHT=12;
const ENTRANCE_Z=64,ENTRANCE_END_Z=12;
const arenaGates=[];
let cpuAim={x:0,z:0,nextUpdate:0};
const touchLooks=new Map();
const clampPitch=v=>THREE.MathUtils.clamp(v,-1.28,1.28);
function rotateView(dx,dy,sensitivity=.0034){
 if(state!=='playing'||!me)return;
 // Camera faces sin(face),cos(face); moving the pointer right decreases face.
 me.face=(me.face-dx*sensitivity+Math.PI*4)%(Math.PI*2);
 lookPitch=clampPitch(lookPitch-dy*sensitivity);
}

const scene=new THREE.Scene();
scene.background=new THREE.Color(0x0d1d2d);
scene.fog=new THREE.FogExp2(0x0d1d2d,.020);
const camera=new THREE.PerspectiveCamera(73,1,.1,130);
camera.rotation.order='YXZ';
camera.position.set(0,15,19);
const renderer=new THREE.WebGLRenderer({antialias:false,powerPreference:'high-performance'});
renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1));
renderer.shadowMap.enabled=false;
renderer.shadowMap.type=THREE.PCFSoftShadowMap;
renderer.outputColorSpace=THREE.SRGBColorSpace;
$('stage').append(renderer.domElement);
const firstPersonHand=makeFirstPersonHand(THREE,{
 scene,camera,drawItemIcon:()=>{},
 getHeld:()=>state==='playing'?{id:JOBS[myClass]?.weapon,qty:1}:null,
 getOffhand:()=>null,
 isGuarding:()=>state==='playing'&&!!me?.guard,
 isVisible:()=>state==='playing',
 getMovement:()=>walkMotion,
 isMining:()=>false,
 isHurt:()=>performance.now()<lastHurtUntil
});
const avatarItems=makeAvatarHeldItems(THREE,()=>{});

const PLAY_RADIUS=48;
scene.background=new THREE.Color(0x7898af);
scene.fog=new THREE.FogExp2(0x7898af,.005);
camera.far=240;camera.updateProjectionMatrix();
const ambient=new THREE.HemisphereLight(0xc2d4e7,0x342a23,1.05);scene.add(ambient);
const sun=new THREE.DirectionalLight(0xffd09b,3.15);
sun.position.set(-35,60,35);sun.castShadow=true;sun.shadow.mapSize.set(512,512);
sun.shadow.camera.left=-75;sun.shadow.camera.right=75;sun.shadow.camera.top=75;sun.shadow.camera.bottom=-75;scene.add(sun);
const mat=(color,metalness=0,roughness=.92)=>new THREE.MeshStandardMaterial({color,metalness,roughness});
function block(w,h,d,color,x,y,z){
 const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat(color));m.position.set(x,y,z);
 m.castShadow=true;m.receiveShadow=true;scene.add(m);return m;
}
const sand=mat(0x967655),stone=mat(0x776554),dark=mat(0x40352f);
const ground=new THREE.Mesh(new THREE.CylinderGeometry(55,55,1,96),sand);
ground.position.y=-.52;ground.receiveShadow=true;scene.add(ground);
for(const radius of [8,24,39,48]){
 const ring=new THREE.Mesh(new THREE.RingGeometry(radius,radius+.24,96),dark);
 ring.rotation.x=-Math.PI/2;ring.position.y=.02;scene.add(ring);
}
// Multi-level Roman-style arena: vaulted galleries, audience, royal box and stone paving.
const TAU=Math.PI*2,SECTIONS=48,archCount=24;
const limestone=mat(0x8d7865),mortar=mat(0x41362f),lightStone=mat(0xb09a80);
const bronze=mat(0xc49b50,.35),cloth=mat(0x9d2535),shade=mat(0x392c2a);
function polar(radius,angle,y=0){return [Math.sin(angle)*radius,y,Math.cos(angle)*radius]}
function radialBlock(w,h,d,material,radius,angle,y){
 const [x,yy,z]=polar(radius,angle,y);
 const obj=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),material);
 obj.position.set(x,yy,z);obj.rotation.y=angle;
 obj.castShadow=false;obj.receiveShadow=false;scene.add(obj);return obj;
}
function arcStrip(radius,y,thickness,material){
 const m=new THREE.Mesh(new THREE.TorusGeometry(radius,thickness,6,96),material);
 m.rotation.x=Math.PI/2;m.position.y=y;scene.add(m);return m;
}
// Large individually laid flagstones, dark joints and central circular motif.
const paving=mat(0x8e745d),pavingAlt=mat(0xb69a79);
for(let r=5;r<49;r+=4.5){
 const count=Math.max(12,Math.floor(r*.7));
 for(let i=0;i<count;i++){
  const angle=(i+(Math.floor(r)%2)*.5)*TAU/count;
  const width=Math.min(3.9,r*TAU/count*.83);
  const tile=radialBlock(width,.055,3.7,i%3===0?pavingAlt:paving,r,angle,-.012);
  tile.castShadow=false;
 }
}
for(const radius of [8,24,39,48])arcStrip(radius,.065,.13,mortar);
const medallion=new THREE.Mesh(new THREE.RingGeometry(3.1,3.7,32),bronze);
medallion.rotation.x=-Math.PI/2;medallion.position.y=.09;scene.add(medallion);
// The seating is made of stepped horizontal rings, with stairs between sections.
const seatMats=[limestone,lightStone,mat(0x77614e)];
// Preserve two full-width entrance corridors centred on +/-Z.
// Previously every tier was an unbroken solid cylinder: fighters walked
// THROUGH its walls between the rear tunnel and the battle floor.
const GATE_CLEAR_HALF_ANGLE=.17;
const seatArcs=[
 [GATE_CLEAR_HALF_ANGLE,Math.PI-2*GATE_CLEAR_HALF_ANGLE],
 [Math.PI+GATE_CLEAR_HALF_ANGLE,Math.PI-2*GATE_CLEAR_HALF_ANGLE]
];
function insideEntranceLane(angle){
 const t=((angle%TAU)+TAU)%TAU;
 return Math.min(t,Math.abs(t-Math.PI),TAU-t)<GATE_CLEAR_HALF_ANGLE;
}
for(let tier=0;tier<8;tier++){
 const inner=55.3+tier*2.9,outer=inner+2.87,height=.75+tier*1.75;
 for(const [start,arcLength] of seatArcs){
  const seat=new THREE.Mesh(
   // Horizontal rings use X=cos(theta),Z=-sin(theta), unlike CylinderGeometry.
   // Rotate their missing wedge by 90 degrees to line up with the +/-Z gates.
   new THREE.RingGeometry(inner,outer,48,1,start+Math.PI/2,arcLength),seatMats[tier%3]);
  seat.rotation.x=-Math.PI/2;seat.position.y=height;seat.receiveShadow=true;scene.add(seat);
  const rise=new THREE.Mesh(
   new THREE.CylinderGeometry(outer,outer,1.75,48,1,true,start,arcLength),mortar);
  rise.material.side=THREE.DoubleSide;
  rise.position.y=height-.875;scene.add(rise);
 }
 for(let i=0;i<archCount;i++){
  const angle=i*TAU/archCount;
  if(insideEntranceLane(angle))continue;
  radialBlock(.28,.14,2.7,mortar,inner+1.4,angle,height+.09);
 }
}
// Solid masonry foundations under the seating: no more sky visible below the terraces.
const foundationMaterial=mat(0x796654);
const foundation=new THREE.Mesh(new THREE.CylinderGeometry(78.9,78.9,13.8,96,1,true),foundationMaterial);
foundation.position.y=6.9;foundation.material.side=THREE.DoubleSide;foundation.receiveShadow=true;scene.add(foundation);
// Vertical stone courses support the uppermost seats without covering the battle floor.
for(let tier=0;tier<8;tier+=2){
 const radius=56.75+tier*2.9,level=.75+tier*1.75;
 for(let i=0;i<archCount;i++){
  const a=(i+.5)*TAU/archCount;
  if(insideEntranceLane(a))continue;
  radialBlock(1.15,Math.max(.6,level),.7,limestone,radius,a,level*.5);
 }
}
// Two arcaded levels. Each bay has a real arched opening, not just columns and a straight beam.
const arcadeRadius=82,archSpan=TAU/archCount;
function addArcadeLevel(baseY,height){
 const beamY=baseY+height;
 // Three radial layers give every arcade a real walkable-looking depth.
 for(let i=0;i<archCount;i++){
  const angle=i*archSpan,mid=angle+archSpan*.5;
  for(const radius of [arcadeRadius-4.8,arcadeRadius+4.8]){
   radialBlock(4.7,height,5.2,limestone,radius,angle,baseY+height*.5);
   radialBlock(5.6,1.5,5.8,mortar,radius,angle,baseY+.75);
   radialBlock(5.7,1.7,5.9,lightStone,radius,angle,beamY-.85);
   const span=radius*archSpan;
   const archWidth=Math.max(2.4,span-4.7);
   const archRadius=archWidth*.5;
   for(let k=0;k<=7;k++){
    const t=Math.PI*k/7,offset=Math.cos(t)*archRadius,rise=Math.sin(t)*archRadius*.6;
    const segment=radialBlock(archWidth/7+.65,2.2,5.3,k%2?limestone:lightStone,
      radius,mid+offset/radius,beamY-3.6+rise);
    segment.rotation.z=-Math.cos(t)*.65;
   }
  }
  // Thick radial cross-walls visually connect the front and rear arch rings.
  radialBlock(4.8,2.1,14.8,mortar,arcadeRadius,angle,beamY-1.1);
  radialBlock(4.8,1.5,14.8,limestone,arcadeRadius,angle,baseY+.75);
 }
 for(const radius of [arcadeRadius-5.4,arcadeRadius+5.4]){
  arcStrip(radius,beamY,.75,mortar);
 }
}
addArcadeLevel(14,10);
addArcadeLevel(26,9);
for(let i=0;i<archCount;i++){
 const angle=i*archSpan;
 radialBlock(5.5,3.3,14.2,limestone,arcadeRadius,angle,37);
 if(i%4===0){
  const banner=radialBlock(3.5,7,.2,cloth,arcadeRadius-2,angle,28.2);
  const crest=radialBlock(1,1.5,.24,bronze,arcadeRadius-1.85,angle,29.1);
  const fringe=radialBlock(3.5,.35,.24,bronze,arcadeRadius-1.8,angle,24.7);
 }
 if(i%2===0){
  const x=Math.sin(angle)*arcadeRadius,z=Math.cos(angle)*arcadeRadius;
  const bowl=new THREE.Mesh(new THREE.CylinderGeometry(1.15,.7,.65,8),mortar);
  bowl.position.set(x,39,z);scene.add(bowl);
  const fire=new THREE.Mesh(new THREE.ConeGeometry(.85,2.5,7),new THREE.MeshBasicMaterial({color:0xff982c}));
  fire.position.set(x,40.5,z);scene.add(fire);
 }
}
// Continuous rear galleries and walkways give the arcade a real enclosed depth.
for(const [radius,y] of [[76.2,14.05],[87.8,14.05],[76.2,26.05],[87.8,26.05]]){
 const gallery=new THREE.Mesh(new THREE.RingGeometry(radius-1.6,radius+1.6,96),lightStone);
 gallery.rotation.x=-Math.PI/2;gallery.position.y=y;gallery.receiveShadow=true;scene.add(gallery);
}
for(let i=0;i<archCount;i++){
 const angle=(i+.5)*archSpan;
 // Recessed back-wall piers create shadows while preserving the open arch silhouette.
 for(const level of [14,26]){
  radialBlock(5.5,5,1.3,mortar,arcadeRadius+7.4,angle,level+3.1);
  radialBlock(5.8,1.1,1.5,lightStone,arcadeRadius+7.4,angle,level+6.2);
 }
}
// Brighten the spectator bowl independently from the shaded arch interiors.
const bowlFill=new THREE.DirectionalLight(0xffe1b6,1.3);
bowlFill.position.set(25,32,-22);scene.add(bowlFill);
// Crimson fabric canopies hung between high parapet posts.
for(let i=0;i<archCount;i+=4){
 const angle=(i+2)*archSpan;
 const canopy=radialBlock(arcadeRadius*archSpan*3.4,.22,7,cloth,arcadeRadius-1.2,angle,37.8);
 canopy.rotation.z=.035;
}
// Spectator silhouettes grouped into merged geometry for mobile performance.
const crowdGeometry=new THREE.BoxGeometry(.55,1.05,.55);
const crowdMaterial=mat(0x28221f);
const audience=new THREE.InstancedMesh(crowdGeometry,crowdMaterial,1100);
const dummy=new THREE.Object3D();
for(let i=0;i<1100;i++){
 const tier=i%8,seatAngle=((i*37)%1100)/1100*TAU;
 const radius=56.6+tier*2.9;
 dummy.position.set(Math.sin(seatAngle)*radius,1.35+tier*1.75,Math.cos(seatAngle)*radius);
 dummy.rotation.y=seatAngle;
 dummy.scale.setScalar(insideEntranceLane(seatAngle)?0:.75+(i%5)*.08);
 dummy.updateMatrix();
 audience.setMatrixAt(i,dummy.matrix);
}
audience.instanceMatrix.needsUpdate=true;audience.castShadow=false;scene.add(audience);
// Real staggered masonry courses: each joint belongs to a laid paving stone.
const jointMat=mat(0x66503e);
const jointGeom=new THREE.BoxGeometry(1,.012,.045);
const jointCount=1600;
const pavingJoints=new THREE.InstancedMesh(jointGeom,jointMat,jointCount);
const jointDummy=new THREE.Object3D();
let jointIndex=0;
for(let row=-23;row<=23&&jointIndex<jointCount;row++){
 const z=row*2.05;
 for(let col=-23;col<=23&&jointIndex<jointCount;col++){
  const x=(col+(row%2)*.5)*2.4;
  if(x*x+z*z>47*47)continue;
  jointDummy.position.set(x,.087,z);jointDummy.rotation.set(0,0,0);
  jointDummy.scale.set(2.15,1,1);jointDummy.updateMatrix();
  pavingJoints.setMatrixAt(jointIndex++,jointDummy.matrix);
 }
}
pavingJoints.count=jointIndex;pavingJoints.instanceMatrix.needsUpdate=true;scene.add(pavingJoints);
// Colour variation and stone courses on the spectator terraces.
const spectatorStone=mat(0xb49a7e);
for(let tier=0;tier<8;tier+=2){
 const radius=56.9+tier*2.9;
 for(let i=0;i<archCount;i++){
  const a=(i+.5)*archSpan;
  if(insideEntranceLane(a))continue;
  radialBlock(2.6,.28,.7,spectatorStone,radius,a,1.03+tier*1.75);
 }
}
// Simple recognizable heads above the dark spectator torsos.
const headGeometry=new THREE.BoxGeometry(.52,.52,.52);
const headMaterial=mat(0xc6a080);
const heads=new THREE.InstancedMesh(headGeometry,headMaterial,650);
const headDummy=new THREE.Object3D();
for(let i=0;i<650;i++){
 const tier=i%8,angle=((i*37)%653)/653*TAU,radius=56.6+tier*2.9;
 headDummy.position.set(Math.sin(angle)*radius,2.15+tier*1.75,Math.cos(angle)*radius);
 headDummy.rotation.y=angle;
 headDummy.scale.setScalar(insideEntranceLane(angle)?0:.78+(i%4)*.08);
 headDummy.updateMatrix();
 heads.setMatrixAt(i,headDummy.matrix);
}
heads.instanceMatrix.needsUpdate=true;scene.add(heads);
// Coloured crowd silhouettes, kept in two instanced batches for tablet performance.
for(const [tone,shift] of [[0x8e3c32,0],[0xb49a6e,1]]){
 const people=new THREE.InstancedMesh(new THREE.BoxGeometry(.62,1.25,.55),mat(tone),420);
 const person=new THREE.Object3D();
 for(let i=0;i<420;i++){
  const tier=(i*3+shift)%8,angle=((i*71+shift*19)%421)/421*TAU;
  const rad=56.6+tier*2.9;
  person.position.set(Math.sin(angle)*rad,1.48+tier*1.75,Math.cos(angle)*rad);
  person.rotation.y=angle;
  person.scale.setScalar(insideEntranceLane(angle)?0:.8+(i%4)*.07);
  person.updateMatrix();
  people.setMatrixAt(i,person.matrix);
 }
 people.instanceMatrix.needsUpdate=true;scene.add(people);
}
// Stone keystones, banner hems and flame glows make the upper arcade less bare.
const keystone=mat(0xc5ad91);
for(let i=0;i<archCount;i++){
 const angle=(i+.5)*archSpan;
 for(const y of [22.8,33.8])radialBlock(1.5,1.25,6.2,keystone,arcadeRadius-5,angle,y);
 if(i%4===0){
  radialBlock(4.2,.3,.35,bronze,arcadeRadius-2.1,i*archSpan,24.6);
  const p=polar(arcadeRadius,i*archSpan,39.8);
  const glow=new THREE.PointLight(0xffa247,1.1,13,2);glow.position.set(...p);scene.add(glow);
 }
}
// Monumental gate integrated into the seating wall, with a stone arch rather than a box.
for(const sign of [-1,1]){
 const z=sign*55.2;
 const movingGate=new THREE.Group();scene.add(movingGate);arenaGates.push(movingGate);
 const gateStone=mat(0xa58d73),gateDark=mat(0x4a4039);
 for(const x of [-8.2,8.2]){
  block(4.1,12.5,6.5,0x8c7761,x,6.25,z);
  block(5.4,1.4,7.4,0xb7a38c,x,12.6,z);
 }
 const archRadius=7.3;
 for(let i=0;i<=18;i++){
  const t=Math.PI*i/18;
  const x=Math.cos(t)*archRadius;
  const y=12.6+Math.sin(t)*5.4;
  const stone=new THREE.Mesh(new THREE.BoxGeometry(1.55,2.1,6.8),i%2?gateStone:lightStone);
  stone.position.set(x,y,z);stone.rotation.z=-Math.cos(t)*.7;stone.castShadow=true;scene.add(stone);
 }
 block(20,2.1,7.4,0x9e8870,0,18.8,z);
 block(21,1,8,0x5e4d3f,0,20.3,z);
 // Deep iron gate set back under the arched opening.
 // Raised portcullis is animated when fighters enter the arena.
 const gatePanel=new THREE.Mesh(new THREE.BoxGeometry(14.1,1,.5),gateDark);
 gatePanel.position.set(0,10,z+sign*2.5);movingGate.add(gatePanel);
 for(let i=-6;i<=6;i++){
  const bar=new THREE.Mesh(new THREE.BoxGeometry(.19,10,.65),mortar);
  bar.position.set(i,5,z-sign*1.1);movingGate.add(bar);
 }
 for(const x of [-11.8,11.8]){
  block(3.2,1.5,3.3,0x746251,x,1,z-sign*2.4);
  block(2,6.2,2,0xb7a38c,x,4.8,z-sign*2.4);
 }
 const royal=block(17,1.2,9,0x8b735e,0,22,z+sign*1.2);
 for(const x of [-7,0,7])block(1.3,7,1.5,0xb7a38c,x,25,z+sign*1.2);
 block(20,1.5,10,0x685242,0,29,z+sign*1.2);
 const royalBanner=block(5.5,7,.2,0x9d2535,0,24,z-sign*4.2);
 // Empty grey-stone entrance passage: no decorative posts, flames or protrusions.
 // Keep only the level floor, flat enclosing walls and roof.
 const tunnelCenter=sign*63.2;
 block(17,.55,19,0x888d92,0,-.28,tunnelCenter); // grey stone floor
 for(const x of [-8.2,8.2]){
  block(2.6,11.8,19,0x737981,x,5.9,tunnelCenter); // smooth grey side wall
 }
 block(17,1.4,19,0x666e76,0,12.4,tunnelCenter); // plain grey ceiling
 // Neutral fill keeps the grey interior readable without adding objects.
 const entryLight=new THREE.PointLight(0xe1ebff,1.8,25,2);
 entryLight.position.set(0,6,sign*58.5);scene.add(entryLight);
}
// Fighters spawn INSIDE the passages, behind the iron gates at z ±55.2.
const spawning=[new THREE.Vector3(0,0,-ENTRANCE_Z),new THREE.Vector3(0,0,ENTRANCE_Z)];
function createAvatar(team,job){
  const cube=(parent,w,h,d,color,x=0,y=0,z=0)=>{
    const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),new THREE.MeshLambertMaterial({color}));
    mesh.position.set(x,y,z);mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);return mesh;
  };
  const g=new THREE.Group(),limbs={};
  const skin=0xd4a078,skinShade=0xb98059,hair=0x392921,hairLight=0x53392c;
  const jacket=0x247f9b,jacketLight=0x38a5b6,jacketDark=0x185569;
  const pants=0x34466b,pantsShade=0x25334f,boots=0x332d2e,sole=0x18191c;
  const pack=0xc08a46,packTrim=0xe4b76d,eye=0x24242a;

  // Shorter head and taller torso, preserving the character's overall height.
  // The model's feet stand at y=0, and its face points along local -Z.
  cube(g,.66,.52,.53,skin,0,1.53,0);
  cube(g,.68,.16,.55,hair,0,1.77,.005);
  cube(g,.69,.11,.34,hair,-.005,1.69,-.155);
  cube(g,.17,.11,.10,hairLight,-.24,1.69,-.290);
  cube(g,.13,.12,.09,hair,.17,1.69,-.295);
  cube(g,.08,.10,.022,eye,-.16,1.53,-.279);
  cube(g,.08,.10,.022,eye,.16,1.53,-.279);
  cube(g,.15,.04,.025,skinShade,0,1.40,-.281);
  cube(g,.07,.11,.055,skinShade,-.335,1.52,.01);
  cube(g,.07,.11,.055,skinShade,.335,1.52,.01);

  cube(g,.74,.85,.42,jacket,0,1.00,0);
  cube(g,.69,.10,.44,jacketLight,0,1.37,0);
  cube(g,.12,.64,.025,jacketDark,0,1.00,-.224);
  cube(g,.20,.18,.04,jacketLight,0,1.24,-.234);
  cube(g,.11,.07,.035,packTrim,.17,.99,-.231);
  // The backpack also extends to match the longer torso.
  cube(g,.53,.67,.19,pack,0,1.01,.31);
  cube(g,.51,.11,.205,packTrim,0,1.29,.32);
  cube(g,.13,.47,.035,packTrim,-.21,1.02,.427);
  cube(g,.13,.47,.035,packTrim,.21,1.02,.427);

  for(const [name,side] of [['left',-1],['right',1]]){
    const arm=new THREE.Group();
    arm.position.set(side*.36,1.30,0);
    cube(arm,.255,.45,.35,jacket,0,-.22,0);
    cube(arm,.262,.12,.36,jacketDark,0,-.47,0);
    cube(arm,.225,.18,.29,skin,0,-.61,0);
    g.add(arm);limbs[name+'Arm']=arm;
    const leg=new THREE.Group();
    leg.position.set(side*.20,.69,0);
    cube(leg,.29,.54,.34,pants,0,-.24,0);
    cube(leg,.29,.11,.345,pantsShade,0,-.51,0);
    cube(leg,.32,.14,.43,boots,0,-.61,-.04);
    cube(leg,.325,.055,.45,sole,0,-.69,-.045);
    g.add(leg);limbs[name+'Leg']=leg;
  }
  g.userData.limbs=limbs;
  // Slimmer silhouette: original arm-to-arm width 0.982 blocks -> 0.707 blocks.
  // Only the horizontal axis is scaled; height and animation remain unchanged.
  g.scale.x=.72;
  g.scale.z=.88;
  avatarItems.sync(g,JOBS[job]?.weapon,null);
  return g;
}
function replaceAvatars(){
 if(myAvatar){scene.remove(myAvatar);myAvatar=null;}
 if(enemyAvatar){avatarItems.dispose(enemyAvatar);scene.remove(enemyAvatar);}
 // In first person the user's own body must not obstruct the view.
 // The exact NEXACRAFT right-hand viewmodel is attached directly to camera.
 enemyAvatar=createAvatar('enemy',enemyClass);
 scene.add(enemyAvatar); // Previously missing: the rival model was never rendered.
 syncAvatars();
}
function makeFighter(job,x,z){
 const c=CLASSES[job]||CLASSES.sword;
 return {x,y:0,vy:0,grounded:true,z,face:x<0?Math.PI/2:-Math.PI/2,hp:c.hp,max:c.hp,guard:false,lastAttack:-100000};
}
let remoteVisualReady=false;
function syncAvatars(dt=1/60){
 if(!rival||!enemyAvatar)return;
 const targetX=rival.x,targetY=rival.y||0,targetZ=rival.z;
 const gap=Math.hypot(enemyAvatar.position.x-targetX,enemyAvatar.position.z-targetZ);
 // Remote packets arrive at ~14Hz. Smooth only the visual avatar; retain
 // authoritative network coordinates for combat and hit validation.
 const blend=!remoteVisualReady||gap>12?1:1-Math.exp(-dt*16);
 enemyAvatar.position.x+= (targetX-enemyAvatar.position.x)*blend;
 enemyAvatar.position.y+= (targetY-enemyAvatar.position.y)*blend;
 enemyAvatar.position.z+= (targetZ-enemyAvatar.position.z)*blend;
 const yaw=rival.face+Math.PI;
 enemyAvatar.rotation.y+=Math.atan2(Math.sin(yaw-enemyAvatar.rotation.y),Math.cos(yaw-enemyAvatar.rotation.y))*blend;
 remoteVisualReady=true;
}
function resize(){
 const w=innerWidth,h=innerHeight;renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();
}
addEventListener('resize',resize);resize();
function uiNotice(msg,err=false){
 $('notice').textContent=msg;$('notice').classList.toggle('error',err);
}
function flash(msg){
 $('status').textContent=msg;$('status').style.display='block';
 clearTimeout(noticeTimeout);noticeTimeout=setTimeout(()=>$('status').style.display='none',1700);
}
function updateRoomStatus(){
 $('roomCode').textContent=roomCode||'------';
 $('roomState').textContent=state==='hosting'?(connection?.open?'対戦相手が入室':'参加を待っています'):state==='joining'?'接続中':state==='lobby'?'2人接続済み':'ルーム未接続';
 $('startMatch').disabled=role!=='host'||!connection?.open||state!=='lobby';
 $('startMatch').textContent=role==='guest'?'ホストの開始を待つ':connection?.open?'対戦開始':'2人そろったら対戦開始';
 $('hostBtn').disabled=state!=='menu';
 $('joinCode').disabled=state!=='menu';
 $('practiceBtn').disabled=state!=='menu';
 for(const b of $('jobs').querySelectorAll('button'))b.disabled=state!=='menu';
}
function setClass(job){
 if(state!=='menu'||!CLASSES[job])return;
 myClass=job;
 for(const b of $('jobs').querySelectorAll('.job'))b.classList.toggle('selected',b.dataset.job===job);
}
$('jobs').addEventListener('click',e=>{const b=e.target.closest('[data-job]');if(b)setClass(b.dataset.job)});
function generatedCode(){
 const letters='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
 const bytes=new Uint8Array(6);crypto.getRandomValues(bytes);
 return Array.from(bytes,n=>letters[n%letters.length]).join('');
}
async function loadPeer(){if(!peerLoader)peerLoader=import(PEER_URL).then(m=>m.Peer||m.default?.Peer||m.default);return peerLoader}
function shutdown(sendLeave=true){
 if(sendLeave&&connection?.open)try{connection.send({t:'leave'})}catch{}
 try{connection?.close()}catch{}
 try{peer?.destroy()}catch{}
 connection=null;peer=null;roomCode='';role='';
}
function showMenu(message=''){
 clearCpuProjectiles();
 resetJoystick();
 if(document.pointerLockElement===renderer.domElement)document.exitPointerLock?.();
 state='menu';keys.clear();touchLooks.clear();shutdown(false);
 // Restore the entrance to its initial closed state in the menu.
 arenaGates.forEach(g=>g.position.y=0);
 $('screen').style.display='flex';$('finish').style.display='none';$('top').classList.remove('show');
 $('mobileControls').classList.remove('show');$('controlsHelp').classList.remove('show');
 $('leaveButton').style.display='none';$('lookHelp').classList.remove('show');$('crosshair').classList.remove('show');$('weaponHud').classList.remove('show');
 $('backHome').style.display='block';updateRoomStatus();
 if(message)uiNotice(message,true);
}
function connectWire(conn,isHost){
 connection=conn;
 conn.on('open',()=>{
  state=isHost?'hosting':'joining';
  conn.send({t:'hello',class:myClass,name:isHost?'HOST':'GUEST'});
  uiNotice(isHost?'対戦相手と接続しました。':'接続成功。ホストの開始を待っています。');
  updateRoomStatus();
 });
 conn.on('data',data=>receive(data));
 conn.on('close',()=>{if(state!=='menu')showMenu('相手が退出したため接続が終了しました。')});
 conn.on('error',err=>{if(state!=='menu')showMenu('通信エラー: '+(err.message||'不明'))});
}
$('hostBtn').addEventListener('click',async()=>{
 if(state!=='menu')return;
 state='hosting';role='host';roomCode=generatedCode();
 updateRoomStatus();uiNotice('対戦ルームを準備しています…');
 try{
  const Peer=await loadPeer();
  const p=new Peer(PEER_PREFIX+roomCode);peer=p;
  p.on('open',()=>{uiNotice('ルームコードを友達に教えてください。');updateRoomStatus()});
  p.on('connection',conn=>{
   if(connection&&connection.open){conn.on('open',()=>{conn.send({t:'reject'});conn.close()});return}
   connectWire(conn,true);
  });
  p.on('error',e=>{if(state!=='menu')showMenu('ルーム作成失敗: '+(e.message||'接続エラー'))});
 }catch(e){showMenu('接続を開始できません: '+e.message)}
});
$('joinForm').addEventListener('submit',async e=>{
 e.preventDefault();if(state!=='menu')return;
 const code=$('joinCode').value.trim().toUpperCase();
 if(!/^[A-Z0-9]{6}$/.test(code)){uiNotice('6文字のコードを入力してください。',true);return}
 role='guest';roomCode=code;state='joining';updateRoomStatus();uiNotice('ルームに接続しています…');
 try{
  const Peer=await loadPeer(),p=new Peer();peer=p;
  const timeout=setTimeout(()=>{if(state==='joining')showMenu('ルームが見つからないか、応答しません。')},14000);
  p.on('open',()=>{
   if(state!=='joining')return;
   const conn=p.connect(PEER_PREFIX+code,{reliable:true});
   connectWire(conn,false);
  });
  p.on('error',e=>{clearTimeout(timeout);if(state!=='menu')showMenu('参加に失敗しました: '+(e.message||'接続エラー'))});
 }catch(e){showMenu('通信の準備に失敗: '+e.message)}
});
function receive(data){
 if(!data||typeof data!=='object'||typeof data.t!=='string')return;
 if(data.t==='reject'){showMenu('このルームは満員です。');return}
 if(data.t==='leave'){showMenu('相手が退出しました。');return}
 if(data.t==='hello'&&CLASSES[data.class]){
  enemyClass=data.class;
  state='lobby';updateRoomStatus();
  uiNotice('相手のジョブ: '+CLASSES[enemyClass].name+'。'+(role==='host'?'「対戦開始」を押してください。':'開始を待っています。'));
  if(role==='host'&&connection?.open)connection.send({t:'helloAck',class:myClass});
  return;
 }
 if(data.t==='helloAck'&&CLASSES[data.class]){
  enemyClass=data.class;state='lobby';updateRoomStatus();uiNotice('準備完了。ホストの開始を待っています。');return;
 }
 if(data.t==='start'&&role==='guest'){beginMatch();return}
 if(data.t==='state'&&state==='playing'&&Number.isFinite(data.x)&&Number.isFinite(data.z)&&Number.isFinite(data.face)){
  // Position updates are cosmetic until verified by the host on attack.
  const remoteDistance=Math.hypot(data.x,data.z);
  const remoteScale=remoteDistance>PLAY_RADIUS?PLAY_RADIUS/remoteDistance:1;
  rival.x=data.x*remoteScale;
  rival.z=data.z*remoteScale;
  rival.face=data.face;
  rival.y=Number.isFinite(data.y)?THREE.MathUtils.clamp(data.y,0,2.6):0;
  rival.guard=!!data.guard;
  return;
 }
 if(data.t==='attack'&&role==='host'&&state==='playing'){
  if(data.class!==enemyClass||!Number.isFinite(data.seq))return;
  animateSwing(enemyAvatar);
  resolveAttack(false);
  return;
 }
 if(data.t==='swing'&&role==='guest'&&state==='playing'){animateSwing(enemyAvatar);return}
 if(data.t==='hit'&&role==='guest'&&state==='playing'){
  if(!Number.isFinite(data.hostHp)||!Number.isFinite(data.guestHp))return;
  rival.hp=THREE.MathUtils.clamp(data.hostHp,0,rival.max);
  me.hp=THREE.MathUtils.clamp(data.guestHp,0,me.max);
  if(data.attackFromHost){flash('攻撃を受けた！');lastHurtUntil=performance.now()+280;effectLine(rival,me,enemyClass)}
  else {flash('HIT!');effectLine(me,rival,myClass)}
  updateHud();return;
 }
 if(data.t==='time'&&role==='guest'&&state==='playing'&&Number.isFinite(data.remaining)){
  remaining=Math.max(0,data.remaining);updateHud();return;
 }
 if(data.t==='end'&&role==='guest'&&state==='playing'){
  // hostWinner is translated into the guest's perspective.
  finishMatch(data.winner==='guest'?'win':data.winner==='host'?'lose':'draw',false);return;
 }
}
$('startMatch').addEventListener('click',()=>{
 if(role!=='host'||state!=='lobby'||!connection?.open)return;
 connection.send({t:'start'});beginMatch();
});
$('practiceBtn').addEventListener('click',()=>{
 if(state!=='menu')return;
 role='cpu';enemyClass=['sword','merc','shield','archer','mage'][Math.floor(Math.random()*5)];
 beginMatch();
});
function beginMatch(){
 clearCpuProjectiles();
 resetJoystick();
 state='playing';keys.clear();touchLooks.clear();lookPitch=0;walkMotion=0;walkPhase=0;
 entranceStart=performance.now();entranceFightAnnounced=false;
 arenaGates.forEach(g=>g.position.y=0);
 const onLeft=role!=='guest';
 const a=onLeft?spawning[0]:spawning[1],b=onLeft?spawning[1]:spawning[0];
 me=makeFighter(myClass,a.x,a.z);rival=makeFighter(enemyClass,b.x,b.z);
 if(role==='cpu'){
  rival=makeFighter(enemyClass,b.x,b.z);
  // The ranged CPU must spend time drawing its bow or preparing a spell.
  if(enemyClass==='archer'||enemyClass==='mage')rival.lastAttack=performance.now();
 }
 cpuAim={x:me.x,z:me.z,nextUpdate:0};
 roundEnd=entranceStart+entranceDuration+roundLength*1000;remaining=roundLength;lastSync=0;
 replaceAvatars();
 $('screen').style.display='none';$('finish').style.display='none';
 $('top').classList.add('show');$('controlsHelp').classList.add('show');
 $('mobileControls').classList.add('show');$('leaveButton').style.display='block';
 $('lookHelp').classList.add('show');
 window.setTimeout(()=>$('lookHelp').classList.remove('show'),4400);
 $('crosshair').classList.add('show');
 $('weaponHud').classList.add('show');
 $('weaponName').textContent=CLASSES[myClass].name+' / '+(JOBS[myClass]?.kind==='dual'?'双剣':JOBS[myClass]?.kind==='bow'?'弓':JOBS[myClass]?.kind==='staff'?'魔法の杖':JOBS[myClass]?.kind==='shield'?'盾':'剣');
 updateHud();flash('門が開く… 出陣！');
}
function updateHud(){
 if(!me||!rival)return;
 $('myName').textContent='YOU / '+CLASSES[myClass].name;
 $('enemyName').textContent=(role==='cpu'?'CPU':'RIVAL')+' / '+CLASSES[enemyClass].name;
 $('myHealth').textContent=Math.ceil(me.hp)+' / '+me.max;
 $('enemyHealth').textContent=Math.ceil(rival.hp)+' / '+rival.max;
 $('myBar').style.width=(100*me.hp/me.max)+'%';
 $('enemyBar').style.width=(100*rival.hp/rival.max)+'%';
 const time=Math.max(0,Math.ceil(remaining));
 $('clock').textContent=String(Math.floor(time/60)).padStart(2,'0')+':'+String(time%60).padStart(2,'0');
}
function animateSwing(avatar){if(avatar)enemyAttackAt=performance.now()}
function effectLine(from,to,job){
 if(!from||!to)return;
 const a=new THREE.Vector3(from.x,1.55,from.z),b=new THREE.Vector3(to.x,1.45,to.z);
 const diff=b.clone().sub(a);
 const color=job==='mage'?0xc77fff:job==='archer'?0xfce3a4:0xffc98b;
 const mesh=new THREE.Mesh(new THREE.CylinderGeometry(job==='mage'?.13:.06,job==='mage'?.18:.045,diff.length(),8),
  new THREE.MeshBasicMaterial({color,transparent:true,opacity:.85}));
 mesh.position.copy(a).addScaledVector(diff,.5);
 mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),diff.normalize());
 scene.add(mesh);effects.push({mesh,life:.23});
}
function resolveAttack(attackerIsHost){
 if(performance.now()<entranceStart+entranceDuration)return;
 if(state!=='playing'||!me||!rival)return;
 if(!attackerIsHost)animateSwing(enemyAvatar);
 const attacker=attackerIsHost?me:rival,target=attackerIsHost?rival:me;
 const job=attackerIsHost?myClass:enemyClass,c=CLASSES[job];
 const now=performance.now();
 if(now-attacker.lastAttack<c.cooldown)return;
 attacker.lastAttack=now;
 if(attacker.guard)return;
 const dx=target.x-attacker.x,dz=target.z-attacker.z;
 const dist=Math.hypot(dx,dz);
 const facing=(Math.sin(attacker.face)*dx+Math.cos(attacker.face)*dz)/(dist||1);
 if(dist>c.range||facing<c.arc)return;
 const targetJob=attackerIsHost?enemyClass:myClass;
 const block=target.guard?(CLASSES[targetJob].block||.42):0;
 const dealt=Math.max(1,Math.round(c.damage*(1-block)));
 target.hp=Math.max(0,target.hp-dealt);
 effectLine(attacker,target,job);
 if(!attackerIsHost){flash('攻撃を受けた！');lastHurtUntil=now+280;}
 else flash('HIT! -'+dealt);
 updateHud();
 if(role==='host'&&connection?.open)connection.send({t:'hit',hostHp:me.hp,guestHp:rival.hp,attackFromHost:attackerIsHost});
 if(me.hp<=0||rival.hp<=0)endByHealth();
}
function endByHealth(){
 if(me.hp===rival.hp)finishMatch('draw',true);
 else finishMatch(me.hp>rival.hp?'win':'lose',true);
}
function finishMatch(outcome,decidedLocally){
 if(state!=='playing')return;
 clearCpuProjectiles();
 resetJoystick();
 if(document.pointerLockElement===renderer.domElement)document.exitPointerLock?.();
 $('lookHelp').classList.remove('show');$('crosshair').classList.remove('show');$('weaponHud').classList.remove('show');
 state='ended';
 if(decidedLocally&&role==='host'&&connection?.open){
  connection.send({t:'end',winner:outcome==='win'?'host':outcome==='lose'?'guest':'draw'});
 }
 const win=outcome==='win',draw=outcome==='draw';
 $('resultTitle').textContent=draw?'DRAW':win?'VICTORY':'DEFEAT';
 $('resultTitle').style.color=win?'#8df5c9':draw?'#a9e5ef':'#ffb1a0';
 $('resultText').textContent=draw?'引き分け！':win?'勝利！ 相手を倒した！':'敗北。次の試合でリベンジしよう。';
 $('againBtn').disabled=role==='guest';
 $('againBtn').textContent=role==='guest'?'ホストの再戦を待つ':'もう一度対戦';
 $('finish').style.display='flex';$('controlsHelp').classList.remove('show');$('mobileControls').classList.remove('show');
 keys.clear();resetJoystick();
}
$('againBtn').addEventListener('click',()=>{
 if(role==='guest')return;
 if(role==='host'){
  if(!connection?.open)return showMenu('相手が退出しました。');
  connection.send({t:'start'});
 }
 if(role==='cpu')enemyClass=['sword','merc','shield','archer','mage'][Math.floor(Math.random()*5)];
 beginMatch();
});
$('menuBtn').addEventListener('click',()=>{shutdown();showMenu()});
$('leaveButton').addEventListener('click',()=>{shutdown();showMenu()});
function requestAttack(){
 if(state!=='playing'||!me)return;
 const now=performance.now();
 if(now-me.lastAttack<CLASSES[myClass].cooldown)return;
 if(keys.has('KeyG'))return;
 // Unlike the top-down prototype, attacks follow actual first-person aim.
 const kind=JOBS[myClass]?.kind;
 firstPersonHand.swing(1,kind==='spear'?'thrust':'swing');
 attackVisualAt=now;
 if(role==='host'&&connection?.open)connection.send({t:'swing'});
 if(role==='host'||role==='cpu')resolveAttack(true);
 else {
  me.lastAttack=now;
  if(connection?.open)connection.send({t:'attack',class:myClass,seq:Math.floor(now)});
 }
}
window.addEventListener('keydown',e=>{
 if(state!=='playing')return;
 if(['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code))e.preventDefault();
 keys.add(e.code);
 if(e.code==='Space'&&!e.repeat)requestJump();
 if(e.code==='KeyF'&&!e.repeat)requestAttack();
});
window.addEventListener('keyup',e=>keys.delete(e.code));
window.addEventListener('blur',()=>{keys.clear();resetJoystick();});
document.addEventListener('visibilitychange',()=>{if(document.hidden){keys.clear();resetJoystick();}});
function requestJump(){
 if(state!=='playing'||!me||!me.grounded)return;
 me.vy=JUMP_SPEED;
 me.grounded=false;
}
function advanceJump(dt){
 if(!me||me.grounded)return;
 me.y+=me.vy*dt-.5*GRAVITY*dt*dt;
 me.vy-=GRAVITY*dt;
 if(me.y<=0){me.y=0;me.vy=0;me.grounded=true;}
}
function resetJoystick(){
 joystick.x=0;joystick.y=0;joystick.pointerId=null;
 const thumb=$('stickThumb'),base=$('moveStick');
 if(thumb)thumb.style.transform='translate(-50%, -50%)';
 if(base)base.classList.remove('active');
}
const hitUi=e=>!!e.target.closest('button, input, .panel, #top, #mobileControls');
renderer.domElement.addEventListener('pointerdown',e=>{
 if(state!=='playing')return;
 if(e.pointerType==='touch'){
  touchLooks.set(e.pointerId,{x:e.clientX,y:e.clientY});renderer.domElement.setPointerCapture(e.pointerId);return;
 }
 if(e.button!==0)return;
 if(document.pointerLockElement!==renderer.domElement&&renderer.domElement.requestPointerLock){
  // First click captures the mouse; subsequent clicks swing the weapon.
  try{Promise.resolve(renderer.domElement.requestPointerLock()).catch(()=>{});}catch(e){console.warn(e)}
  return;
 }
 requestAttack();
});
renderer.domElement.addEventListener('pointermove',e=>{
 if(state!=='playing')return;
 if(e.pointerType==='touch'){
  const prev=touchLooks.get(e.pointerId);if(!prev)return;
  rotateView(e.clientX-prev.x,e.clientY-prev.y,.006);
  prev.x=e.clientX;prev.y=e.clientY;
 }else if(document.pointerLockElement===renderer.domElement||(e.buttons&1)){
  rotateView(e.movementX,e.movementY,.0031);
 }
});
renderer.domElement.addEventListener('pointerup',e=>touchLooks.delete(e.pointerId));
renderer.domElement.addEventListener('pointercancel',e=>touchLooks.delete(e.pointerId));
// Stable, multi-touch analog joystick. Capture only its own pointer, so the
// other thumb can aim and press attack/jump simultaneously.
const moveStick=$('moveStick'),stickThumb=$('stickThumb');
const JOYSTICK_DEADZONE=.10;
function updateJoystickPointer(e){
 const rect=moveStick.getBoundingClientRect();
 const radius=Math.max(1,Math.min(rect.width,rect.height)*.5-stickThumb.offsetWidth*.5-5);
 const dx=e.clientX-(rect.left+rect.width*.5);
 const dy=e.clientY-(rect.top+rect.height*.5);
 const length=Math.hypot(dx,dy);
 const capped=Math.min(length,radius);
 const activeMagnitude=length>0?Math.max(0,(capped/radius-JOYSTICK_DEADZONE)/(1-JOYSTICK_DEADZONE)):0;
 joystick.x=length>0?dx/length*activeMagnitude:0;
 joystick.y=length>0?dy/length*activeMagnitude:0;
 const thumbX=length>0?dx/length*capped:0,thumbY=length>0?dy/length*capped:0;
 stickThumb.style.transform='translate(-50%, -50%) translate('+thumbX+'px, '+thumbY+'px)';
}
moveStick.addEventListener('pointerdown',e=>{
 if(state!=='playing'||joystick.pointerId!==null)return;
 e.preventDefault();
 joystick.pointerId=e.pointerId;
 moveStick.classList.add('active');
 moveStick.setPointerCapture(e.pointerId);
 updateJoystickPointer(e);
});
moveStick.addEventListener('pointermove',e=>{
 if(joystick.pointerId!==e.pointerId)return;
 e.preventDefault();updateJoystickPointer(e);
});
function releaseJoystick(e){
 if(joystick.pointerId!==e.pointerId)return;
 e.preventDefault();resetJoystick();
}
for(const eventName of ['pointerup','pointercancel','lostpointercapture']){
 moveStick.addEventListener(eventName,releaseJoystick);
}
for(const b of document.querySelectorAll('#mobileControls button')){
 const key=b.dataset.key,action=b.dataset.action;
 const release=e=>{e.preventDefault();if(key)keys.delete(key)};
 b.addEventListener('pointerdown',e=>{
  if(state!=='playing')return;
  e.preventDefault();b.setPointerCapture(e.pointerId);
  if(key)keys.add(key);
  else if(action==='jump')requestJump();
  else if(action==='attack')requestAttack();
 });
 b.addEventListener('pointerup',release);
 b.addEventListener('pointercancel',release);
 b.addEventListener('lostpointercapture',release);
}
function moveLocal(dt){
 if(performance.now()<entranceStart+entranceDuration)return;
 const keyX=(keys.has('KeyD')||keys.has('ArrowRight')?1:0)-(keys.has('KeyA')||keys.has('ArrowLeft')?1:0);
 const keyZ=(keys.has('KeyS')||keys.has('ArrowDown')?1:0)-(keys.has('KeyW')||keys.has('ArrowUp')?1:0);
 const x=keyX+joystick.x,z=keyZ+joystick.y;
 const len=Math.hypot(x,z),scale=len>1?1/len:1;
 const c=CLASSES[myClass];
 const speed=c.speed*(keys.has('ShiftLeft')||keys.has('ShiftRight')?1.4:1);
 const forward=-z*scale,strafe=x*scale;
 const yaw=me.face;
 // Analog motion is proportional to joystick tilt, including diagonals.
 const dx=(Math.sin(yaw)*forward-Math.cos(yaw)*strafe)*speed*dt;
 const dz=(Math.cos(yaw)*forward+Math.sin(yaw)*strafe)*speed*dt;
 const nx=me.x+dx,nz=me.z+dz,dist=Math.hypot(nx,nz);
 const boundaryScale=dist>PLAY_RADIUS?PLAY_RADIUS/dist:1;
 me.x=nx*boundaryScale;me.z=nz*boundaryScale;
 walkMotion=Math.hypot(dx,dz)/Math.max(dt,.001);
 me.guard=keys.has('KeyG');
 advanceJump(dt);
 // Optional keyboard turning works without pointer lock.
 if(keys.has('KeyQ'))rotateView(dt*135,0);
 if(keys.has('KeyE'))rotateView(-dt*135,0);
}
// Ranged CPU: imperfect tracking, actual moving arrows/orbs and dodgeable hits.
function clearCpuProjectiles(){
 for(const shot of cpuProjectiles){
  scene.remove(shot.mesh);
  shot.mesh.geometry.dispose();
  shot.mesh.material.dispose();
 }
 cpuProjectiles.length=0;
}
function fireCpuRanged(now){
 if(role!=='cpu'||state!=='playing'||!rival||!me)return;
 const archer=enemyClass==='archer';
 rival.lastAttack=now;
 animateSwing(enemyAvatar);
 // Spread is independent per shot, so standing still is easier to hit than
 // a moving player. The aim direction is already based on a delayed snapshot.
 const spread=(Math.random()-.5)*(archer?.26:.32);
 const angle=rival.face+spread;
 const speed=archer?12.5:9;
 const mesh=archer
  ?new THREE.Mesh(new THREE.CylinderGeometry(.022,.022,.75,7),
    new THREE.MeshStandardMaterial({color:0xf5d19a,emissive:0x392508,metalness:.14}))
  :new THREE.Mesh(new THREE.SphereGeometry(.19,12,8),
    new THREE.MeshBasicMaterial({color:0xc88cff}));
 const vx=Math.sin(angle),vz=Math.cos(angle);
 const startX=rival.x+vx*.65,startZ=rival.z+vz*.65;
 mesh.position.set(startX,1.42,startZ);
 if(archer)mesh.quaternion.setFromUnitVectors(
  new THREE.Vector3(0,1,0),new THREE.Vector3(vx,0,vz));
 scene.add(mesh);
 cpuProjectiles.push({
  mesh,x:startX,z:startZ,vx,vz,speed,travelled:0,
  range:CLASSES[enemyClass].range,damage:archer?12:15,
  radius:archer?.56:.79
 });
}
function updateCpuProjectiles(dt){
 if(role!=='cpu'||state!=='playing')return;
 for(let i=cpuProjectiles.length-1;i>=0;i--){
  const shot=cpuProjectiles[i],px=shot.x,pz=shot.z;
  const sx=shot.vx*shot.speed*dt,sz=shot.vz*shot.speed*dt;
  shot.x+=sx;shot.z+=sz;shot.travelled+=Math.hypot(sx,sz);
  shot.mesh.position.set(shot.x,1.42,shot.z);
  // Segment collision avoids arrows passing through the player at low FPS.
  const segmentLengthSq=sx*sx+sz*sz;
  const t=segmentLengthSq
    ?THREE.MathUtils.clamp(((me.x-px)*sx+(me.z-pz)*sz)/segmentLengthSq,0,1)
    :0;
  const hx=px+t*sx,hz=pz+t*sz;
  const verticalGap=Math.abs(1.42-(me.y+1.2));
  const hit=verticalGap<.78&&(me.x-hx)**2+(me.z-hz)**2<shot.radius**2;
  const expired=shot.travelled>=shot.range||
    Math.abs(shot.x)>PLAY_RADIUS+1||Math.abs(shot.z)>PLAY_RADIUS+1;
  if(hit){
   const blocking=me.guard?(CLASSES[myClass].block||.42):0;
   const damage=Math.max(1,Math.round(shot.damage*(1-blocking)));
   me.hp=Math.max(0,me.hp-damage);
   lastHurtUntil=performance.now()+280;
   flash('攻撃を受けた！ -'+damage);
   updateHud();
  }
  if(hit||expired){
   scene.remove(shot.mesh);
   shot.mesh.geometry.dispose();
   shot.mesh.material.dispose();
   cpuProjectiles.splice(i,1);
  }
  if(hit&&me.hp<=0){endByHealth();return}
 }
}
function stepCPU(dt){
 const c=CLASSES[enemyClass],dx=me.x-rival.x,dz=me.z-rival.z,d=Math.hypot(dx,dz)||1;
 const now=performance.now();
 const ranged=enemyClass==='archer'||enemyClass==='mage';
 if(ranged){
  if(now>=cpuAim.nextUpdate){
   // Updates are deliberately infrequent; the aim won't follow dodges instantly.
   const jitter=(enemyClass==='archer'?1.10:1.30)*(.65+.45*Math.min(d/c.range,1));
   cpuAim.x=me.x+(Math.random()*2-1)*jitter;
   cpuAim.z=me.z+(Math.random()*2-1)*jitter;
   cpuAim.nextUpdate=now+470+Math.random()*360;
  }
  const wanted=Math.atan2(cpuAim.x-rival.x,cpuAim.z-rival.z);
  const delta=Math.atan2(Math.sin(wanted-rival.face),Math.cos(wanted-rival.face));
  rival.face+=THREE.MathUtils.clamp(delta,-dt*2.3,dt*2.3);
 }else rival.face=Math.atan2(dx,dz);
 const safeRange=Math.max(2.2,c.range*.67);
 if(d>safeRange){
  rival.x=THREE.MathUtils.clamp(rival.x+dx/d*c.speed*.66*dt,-PLAY_RADIUS,PLAY_RADIUS);
  rival.z=THREE.MathUtils.clamp(rival.z+dz/d*c.speed*.66*dt,-PLAY_RADIUS,PLAY_RADIUS);
 }else if(d<c.range*.42){
  rival.x=THREE.MathUtils.clamp(rival.x-dx/d*c.speed*.3*dt,-PLAY_RADIUS,PLAY_RADIUS);
  rival.z=THREE.MathUtils.clamp(rival.z-dz/d*c.speed*.3*dt,-PLAY_RADIUS,PLAY_RADIUS);
 }
 rival.guard=enemyClass==='shield'&&d<3.4&&Math.sin(now/700)>0.15;
 if(ranged){
  // Longer intervals + real projectile flight instead of unavoidable instant hits.
  const interval=c.cooldown*(enemyClass==='archer'?1.45:1.5);
  if(d<c.range&&now-rival.lastAttack>=interval)fireCpuRanged(now);
 }else if(d<c.range&&now-rival.lastAttack>c.cooldown+200){
  resolveAttack(false);
 }
}
function update(dt,t){
 if(state!=='playing'||!me||!rival)return;
 const entryProgress=THREE.MathUtils.clamp((t-entranceStart)/entranceDuration,0,1);
 if(entryProgress<1){
  // Stay behind the bars for the opening beat; only then walk out.
  const travel=THREE.MathUtils.smoothstep(entryProgress,.23,.90);
  const startSide=role==='guest'?1:-1;
  const zDistance=ENTRANCE_Z-(ENTRANCE_Z-ENTRANCE_END_Z)*travel;
  me.z=startSide*zDistance;
  me.x=0;me.face=startSide>0?Math.PI:0;
  rival.z=-startSide*zDistance;
  rival.x=0;rival.face=startSide>0?0:Math.PI;
  const gateLift=GATE_OPEN_HEIGHT*THREE.MathUtils.smoothstep(entryProgress,.02,.27);
  arenaGates.forEach(g=>g.position.y=gateLift);
  remaining=roundLength;updateHud();syncAvatars(dt);
  if(entryProgress>.92&&!entranceFightAnnounced){
   entranceFightAnnounced=true;flash('FIGHT!');
  }
  return;
 }
 // Both fighters have safely crossed the portcullis (at Z +/-55).
 // Close both iron gates smoothly after FIGHT, without blocking the battle.
 const closingProgress=THREE.MathUtils.clamp(
  (t-entranceStart-entranceDuration)/gateCloseDuration,0,1);
 const gateHeight=GATE_OPEN_HEIGHT*(1-THREE.MathUtils.smoothstep(closingProgress,0,1));
 arenaGates.forEach(g=>g.position.y=gateHeight);
 moveLocal(dt);
 if(role==='cpu'){
  stepCPU(dt);
  updateCpuProjectiles(dt);
 }
 if(role==='host'||role==='cpu'){
  remaining=Math.max(0,(roundEnd-t)/1000);
  if(remaining===0){
   const score=me.hp/me.max-rival.hp/rival.max;
   finishMatch(Math.abs(score)<.0001?'draw':score>0?'win':'lose',true);
  }
 }
 if(role!=='cpu'&&connection?.open&&t-lastSync>70){
  connection.send({t:'state',x:me.x,y:me.y,z:me.z,face:me.face,guard:me.guard});
  if(role==='host'&&t-lastClock>350){
   lastClock=t;
   connection.send({t:'time',remaining});
  }
  lastSync=t;
 }
 if(Math.floor(t/100)!==Math.floor((t-dt*1000)/100))updateHud();
}
function animate(){
 requestAnimationFrame(animate);
 const dt=Math.min(clock.getDelta(),.04),t=performance.now();
 update(dt,t);
 if(state==='playing'&&me){
  syncAvatars(dt);
  // Actual player eye height, view direction controlled by mouse / swipe.
  walkPhase+=dt*(walkMotion>0.1?9:0);
  camera.position.set(me.x,1.62+me.y+(me.grounded?Math.sin(walkPhase)*.018*Math.min(walkMotion/6,1):0),me.z);
  camera.rotation.set(lookPitch,me.face+Math.PI,0,'YXZ');
 }else{
  camera.position.lerp(new THREE.Vector3(0,15,19),Math.min(1,dt*3));
  camera.lookAt(0,0,0);
 }
 if(enemyAvatar){
  const limbs=enemyAvatar.userData.limbs;
  if(limbs){
   const stride=Math.min(1,Math.hypot(rival.x-(enemyAvatar.userData.lastX??rival.x),rival.z-(enemyAvatar.userData.lastZ??rival.z))*12);
   const phase=t*.008;
   limbs.leftLeg.rotation.x=Math.sin(phase)*stride*.6;
   limbs.rightLeg.rotation.x=-Math.sin(phase)*stride*.6;
   limbs.rightArm.rotation.set(-Math.sin(phase)*stride*.23,0,.05);
   limbs.leftArm.rotation.set(Math.sin(phase)*stride*.23,0,-.05);
   enemyAvatar.userData.lastX=rival.x;enemyAvatar.userData.lastZ=rival.z;
  }
  avatarItems.animate(enemyAvatar,t,{kind:'attack',at:enemyAttackAt,guarding:rival.guard});
 }
 firstPersonHand.update(dt,t);
 for(let i=effects.length-1;i>=0;i--){
  const e=effects[i];e.life-=dt;e.mesh.material.opacity=Math.max(0,e.life/.23)*.85;
  if(e.life<=0){scene.remove(e.mesh);e.mesh.geometry.dispose();e.mesh.material.dispose();effects.splice(i,1)}
 }
 renderer.render(scene,camera);
}
animate();
uiNotice('ジョブを選んでルームを作成するか、CPUと練習しよう。');
