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
const roundLength=90;
let myClass='sword',enemyClass='sword',role='',state='menu',roomCode='',peer=null,connection=null,peerLoader=null;
let me=null,rival=null,myAvatar=null,enemyAvatar=null,roundEnd=0,remaining=roundLength,lastSync=0,lastClock=0;
let keys=new Set(),clock=new THREE.Clock(),effects=[],noticeTimeout=0;
let lookPitch=0,walkMotion=0,walkPhase=0,lastHurtUntil=0,attackVisualAt=0,enemyAttackAt=-Infinity;
const touchLooks=new Map();
const clampPitch=v=>THREE.MathUtils.clamp(v,-1.28,1.28);
function rotateView(dx,dy,sensitivity=.0034){
 if(state!=='playing'||!me)return;
 me.face=(me.face+dx*sensitivity+Math.PI*4)%(Math.PI*2);
 lookPitch=clampPitch(lookPitch-dy*sensitivity);
}

const scene=new THREE.Scene();
scene.background=new THREE.Color(0x0d1d2d);
scene.fog=new THREE.FogExp2(0x0d1d2d,.020);
const camera=new THREE.PerspectiveCamera(73,1,.1,130);
camera.rotation.order='YXZ';
camera.position.set(0,15,19);
const renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance'});
renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.7));
renderer.shadowMap.enabled=true;
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

const ambient=new THREE.HemisphereLight(0xaad8ff,0x233a2b,2.1);scene.add(ambient);
const sun=new THREE.DirectionalLight(0xffe9c9,2.3);sun.position.set(-10,24,17);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);sun.shadow.camera.left=-25;sun.shadow.camera.right=25;sun.shadow.camera.top=25;sun.shadow.camera.bottom=-25;scene.add(sun);
const mat=(color,metalness=0,roughness=.7)=>new THREE.MeshStandardMaterial({color,metalness,roughness});
const ground=new THREE.Mesh(new THREE.BoxGeometry(34,1,25),mat(0x304c54));ground.position.y=-.55;ground.receiveShadow=true;scene.add(ground);
const ring=new THREE.Mesh(new THREE.RingGeometry(8.3,8.55,90),new THREE.MeshBasicMaterial({color:0x65dacd,side:THREE.DoubleSide,transparent:true,opacity:.55}));ring.rotation.x=-Math.PI/2;ring.position.y=.018;scene.add(ring);
const grid=new THREE.GridHelper(34,17,0x5a9c9c,0x365a62);grid.position.y=.028;scene.add(grid);
function block(w,h,d,color,x,y,z){
 const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat(color,.18,.7));m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;scene.add(m);return m;
}
for(const x of [-17,17])block(.75,2.7,26,0x213a4b,x,1.15,0);
for(const z of [-12.5,12.5])block(34,.75,.75,0x213a4b,0,.22,z);
for(const x of [-14.8,14.8])for(const z of [-10.2,10.2]){
 block(1.1,5,1.1,0x273e50,x,2.5,z);
 const cap=block(1.9,.25,1.9,0x67bdc0,x,5.05,z);
 cap.material.emissive=new THREE.Color(0x175d68);
 const lamp=new THREE.PointLight(0x5feadd,2,9);lamp.position.set(x,5.3,z);scene.add(lamp);
}
for(const z of [-8,8]){block(6,.15,.12,0x4d8487,0,.09,z)}
const spawning=[new THREE.Vector3(-6,0,0),new THREE.Vector3(6,0,0)];

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
 syncAvatars();
}
function makeFighter(job,x,z){
 const c=CLASSES[job]||CLASSES.sword;
 return {x,z,face:x<0?Math.PI/2:-Math.PI/2,hp:c.hp,max:c.hp,guard:false,lastAttack:-100000};
}
function syncAvatars(){
 if(rival&&enemyAvatar){enemyAvatar.position.set(rival.x,0,rival.z);enemyAvatar.rotation.y=rival.face+Math.PI;}
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
 if(document.pointerLockElement===renderer.domElement)document.exitPointerLock?.();
 state='menu';keys.clear();touchLooks.clear();shutdown(false);
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
  const maxX=14.9,maxZ=10.8;
  rival.x=THREE.MathUtils.clamp(data.x,-maxX,maxX);
  rival.z=THREE.MathUtils.clamp(data.z,-maxZ,maxZ);
  rival.face=data.face;
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
 state='playing';keys.clear();touchLooks.clear();lookPitch=0;walkMotion=0;walkPhase=0;
 const onLeft=role!=='guest';
 const a=onLeft?spawning[0]:spawning[1],b=onLeft?spawning[1]:spawning[0];
 me=makeFighter(myClass,a.x,a.z);rival=makeFighter(enemyClass,b.x,b.z);
 if(role==='cpu')rival=makeFighter(enemyClass,6,0);
 roundEnd=performance.now()+roundLength*1000;remaining=roundLength;lastSync=0;
 replaceAvatars();
 $('screen').style.display='none';$('finish').style.display='none';
 $('top').classList.add('show');$('controlsHelp').classList.add('show');
 $('mobileControls').classList.add('show');$('leaveButton').style.display='block';
 $('lookHelp').classList.add('show');
 window.setTimeout(()=>$('lookHelp').classList.remove('show'),4400);
 $('crosshair').classList.add('show');
 $('weaponHud').classList.add('show');
 $('weaponName').textContent=CLASSES[myClass].name+' / '+(JOBS[myClass]?.kind==='dual'?'双剣':JOBS[myClass]?.kind==='bow'?'弓':JOBS[myClass]?.kind==='staff'?'魔法の杖':JOBS[myClass]?.kind==='shield'?'盾':'剣');
 updateHud();flash('FIGHT!');
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
 keys.clear();
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
 if((e.code==='Space'||e.code==='KeyF')&&!e.repeat)requestAttack();
});
window.addEventListener('keyup',e=>keys.delete(e.code));
window.addEventListener('blur',()=>keys.clear());
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
for(const b of document.querySelectorAll('#mobileControls button')){
 const key=b.dataset.key;
 const release=e=>{e.preventDefault();if(key)keys.delete(key)};
 b.addEventListener('pointerdown',e=>{e.preventDefault();b.setPointerCapture(e.pointerId);if(key)keys.add(key);else requestAttack()});
 b.addEventListener('pointerup',release);b.addEventListener('pointercancel',release);b.addEventListener('lostpointercapture',release);
}
function moveLocal(dt){
 let x=(keys.has('KeyD')||keys.has('ArrowRight')?1:0)-(keys.has('KeyA')||keys.has('ArrowLeft')?1:0);
 let z=(keys.has('KeyS')||keys.has('ArrowDown')?1:0)-(keys.has('KeyW')||keys.has('ArrowUp')?1:0);
 const len=Math.hypot(x,z)||1;
 const c=CLASSES[myClass];
 const speed=c.speed*(keys.has('ShiftLeft')||keys.has('ShiftRight')?1.4:1);
 const forward=-z/len,strafe=x/len;
 const yaw=me.face;
 const dx=(Math.sin(yaw)*forward+Math.cos(yaw)*strafe)*speed*dt;
 const dz=(Math.cos(yaw)*forward-Math.sin(yaw)*strafe)*speed*dt;
 me.x=THREE.MathUtils.clamp(me.x+dx,-14.7,14.7);
 me.z=THREE.MathUtils.clamp(me.z+dz,-10.5,10.5);
 walkMotion=Math.hypot(dx,dz)/Math.max(dt,.001);
 me.guard=keys.has('KeyG');
 // Optional keyboard turning is useful without a pointer-lock-compatible mouse.
 if(keys.has('KeyQ'))rotateView(-dt*135,0);
 if(keys.has('KeyE'))rotateView(dt*135,0);
}
function stepCPU(dt){
 const c=CLASSES[enemyClass],dx=me.x-rival.x,dz=me.z-rival.z,d=Math.hypot(dx,dz)||1;
 rival.face=Math.atan2(dx,dz);
 const safeRange=Math.max(2.2,c.range*.67);
 if(d>safeRange){
  rival.x=THREE.MathUtils.clamp(rival.x+dx/d*c.speed*.66*dt,-14.7,14.7);
  rival.z=THREE.MathUtils.clamp(rival.z+dz/d*c.speed*.66*dt,-10.5,10.5);
 }else if(d<c.range*.42){
  rival.x-=dx/d*c.speed*.3*dt;rival.z-=dz/d*c.speed*.3*dt;
 }
 rival.guard=enemyClass==='shield'&&d<3.4&&Math.sin(performance.now()/700)>0.15;
 if(d<c.range&&performance.now()-rival.lastAttack>c.cooldown+200)resolveAttack(false);
}
function update(dt,t){
 if(state!=='playing'||!me||!rival)return;
 moveLocal(dt);
 if(role==='cpu')stepCPU(dt);
 if(role==='host'||role==='cpu'){
  remaining=Math.max(0,(roundEnd-t)/1000);
  if(remaining===0){
   const score=me.hp/me.max-rival.hp/rival.max;
   finishMatch(Math.abs(score)<.0001?'draw':score>0?'win':'lose',true);
  }
 }
 if(role!=='cpu'&&connection?.open&&t-lastSync>70){
  connection.send({t:'state',x:me.x,z:me.z,face:me.face,guard:me.guard});
  if(role==='host'&&t-lastClock>350){
   lastClock=t;
   connection.send({t:'time',remaining});
  }
  lastSync=t;
 }
 if(Math.floor(t/100)!==Math.floor((t-dt*1000)/100))updateHud();
 syncAvatars();
}
function animate(){
 requestAnimationFrame(animate);
 const dt=Math.min(clock.getDelta(),.04),t=performance.now();
 update(dt,t);
 if(state==='playing'&&me){
  // Actual player eye height, view direction controlled by mouse / swipe.
  walkPhase+=dt*(walkMotion>0.1?9:0);
  camera.position.set(me.x,1.62+Math.sin(walkPhase)*.018*Math.min(walkMotion/6,1),me.z);
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
