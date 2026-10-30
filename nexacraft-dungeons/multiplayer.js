/* NEXACRAFT DUNGEONS: 1-4 player WebRTC co-op with room chat.
 * GitHub Pages is static; PeerJS Cloud is signaling and WebRTC is transport.
 * Host authoritative: enemies, HP, key and door all originate with the host.
 * No passwords, account data or chat messages are persisted on the website.
 */
const $=id=>document.getElementById(id);
const bridge=window.NEXA_DUNGEON_BRIDGE;
const players=new Map(); // guest PeerJS IDs -> host-owned pose + health
let peer=null,hostConn=null,mode='solo',roomCode='',selfId='',myName='冒険者',lastMessage=0;
let sendTimer=null,peerOpen=false,starting=false;
const MAX_PLAYERS=4;
const roomPeerId=code=>'nexacraft-dungeons-v1-'+code;
const safeName=s=>String(s||'冒険者').trim().slice(0,12)||'冒険者';
const safeText=s=>String(s||'').trim().slice(0,160);
const finite=v=>typeof v==='number'&&Number.isFinite(v);
const validPose=p=>p&&finite(p.x)&&finite(p.z)&&finite(p.yaw)&&p.x>=0&&p.x<=45&&p.z>=0&&p.z<=45;
const limit=(x,a,b)=>Math.max(a,Math.min(b,x));
const button=$('multiStatus'),setup=$('multiOptions'),nameInput=$('multiName'),codeInput=$('multiCode'),roomHud=$('multiRoomHud');
const chatToggle=$('chatToggle'),chatPanel=$('chatPanel'),chatLog=$('chatLog'),chatForm=$('chatForm'),chatInput=$('chatInput');
const inviteButton=$('inviteLink'),leaveButton=$('leaveRoom'),roomMembers=$('roomMembers'),chatNotice=$('chatNotice');
const paramCode=new URLSearchParams(location.search).get('room');
if(/^[A-Z0-9]{6}$/i.test(paramCode||'')){codeInput.value=paramCode.toUpperCase();setup.open=true;}
function setStatus(message,error=false){button.textContent=message;button.style.color=error?'#ff9a89':'#b5f7cf';}
function addChat(who,message,system=false){
 const line=document.createElement('div');line.className=system?'chat-line system':'chat-line';
 if(system){line.textContent=String(message).slice(0,200);}
 else {
  const b=document.createElement('b');b.textContent=safeName(who)+'：';
  line.append(b,document.createTextNode(safeText(message)));
 }
 chatLog.appendChild(line);while(chatLog.children.length>50)chatLog.firstChild.remove();
 chatLog.scrollTop=chatLog.scrollHeight;
 if(!chatPanel.open&&!system)chatToggle.classList.add('unread');
}
function currentPeers(){
 if(mode==='host')return [...players.values()].map(p=>({...p}));
 return bridge.getPeers();
}
function memberCount(){return mode==='host'?1+players.size:1+bridge.getPeers().length;}
function refreshMembers(){
 const names=(mode==='host'?[myName,...[...players.values()].map(p=>p.name)]:[myName,...bridge.getPeers().map(p=>p.name)]);
 roomMembers.textContent=names.join(' · ');
 roomHud.textContent='🌐 '+roomCode+'  '+names.length+'/'+MAX_PLAYERS+'人';
}
function uiRoom(){
 const active=mode!=='solo';
 roomHud.hidden=!active;chatToggle.hidden=!active;chatNotice.hidden=!active;leaveButton.hidden=!active;inviteButton.hidden=!active;
 if(!active){roomMembers.textContent='';chatPanel.open=false;}
 refreshMembers();
}
function notifyAll(data){
 if(mode!=='host')return;
 for(const p of players.values())if(p.conn?.open)p.conn.send(data);
}
function sendTo(id,data){const p=players.get(id);if(p?.conn?.open)p.conn.send(data);}
function snapshot(){
 return {
  t:'snapshot',world:bridge.snapshot(),players:[
   {...bridge.pose(),id:'host',name:myName,hp:bridge.getHealth()},
   ...[...players.values()].map(({id,name,x,z,yaw,hp})=>({id,name,x,z,yaw,hp}))
  ]
 };
}
function refreshWorld(){
 if(mode!=='host')return;
 bridge.setPeers(currentPeers());
 notifyAll(snapshot());
 refreshMembers();
}
function hostMessage(id,raw){
 const p=players.get(id);
 if(!p||!raw||typeof raw.t!=='string')return;
 if(raw.t==='hello'){
  p.name=safeName(raw.name);p.hello=true;
  sendTo(id,{t:'welcome',you:id,room:roomCode,...snapshot()});
  addChat('',p.name+' が参加しました',true);notifyAll({t:'system',text:p.name+' が参加しました'});
  refreshWorld();return;
 }
 if(!p.hello)return;
 if(raw.t==='pose'){
  if(!validPose(raw))return;
  if(!bridge.isPassable(raw.x,raw.z))return;
  const now=performance.now(),dt=Math.max(.05,(now-(p.lastPose||now))/1000);
  if(p.lastPose&&Math.hypot(raw.x-p.x,raw.z-p.z)>Math.max(1.75,9*dt))return;
  p.x=raw.x;p.z=raw.z;p.yaw=raw.yaw;p.lastPose=now;
  if(p.hp>0 && bridge.isKeyNear(p.x,p.z))bridge.collectKey();
  if(p.hp>0 && bridge.isExitNear(p.x,p.z))clearRoom();
  return;
 }
 if(raw.t==='attack'){
  const now=performance.now();if(p.hp>0&&now-(p.lastAttack||0)>420){
   p.lastAttack=now;bridge.remoteAttack(p.x,p.z,p.yaw);
  }return;
 }
 if(raw.t==='chat'){
  const msg=safeText(raw.text),now=performance.now();
  if(!msg||now-(p.lastChat||0)<500)return;
  p.lastChat=now;addChat(p.name,msg);notifyAll({t:'chat',name:p.name,text:msg});
 }
}
function guestMessage(raw){
 if(!raw||typeof raw.t!=='string')return;
 if(raw.t==='welcome'){selfId=String(raw.you||'');setStatus('接続成功！ '+roomCode);addChat('','部屋に参加しました',true);uiRoom();}
 if(raw.t==='welcome'||raw.t==='snapshot'){
  if(!raw.world||!Array.isArray(raw.players))return;
  const me=raw.players.find(p=>p.id===selfId),others=raw.players.filter(p=>p.id!==selfId&&validPose(p));
  bridge.receiveSnapshot(raw.world,me?.hp);
  bridge.setPeers(others);
  refreshMembers();return;
 }
 if(raw.t==='chat')addChat(raw.name,raw.text);
 if(raw.t==='system')addChat('',raw.text,true);
 if(raw.t==='clear')bridge.finish('win');
 if(raw.t==='roomClosed'||raw.t==='reject')handleLoss(raw.reason||'ホストが部屋を終了しました');
}
function clearRoom(){
 if(mode!=='host'||bridge.phase()!=='play')return;
 notifyAll({t:'clear'});bridge.finish('win');
 addChat('','全員でダンジョンをクリアしました！',true);
}
function connectionLost(){
 const old=mode;closeNetwork();
 if(old!=='solo')setStatus('通信が切断されました。ソロで継続できます。',true);
}
function handleLoss(msg){addChat('',msg,true);connectionLost();}
function wireConnection(conn,id,guest=false){
 conn.on('data',message=>{try{guest?guestMessage(message):hostMessage(id,message)}catch(e){console.error('Dungeons multiplayer message',e)}});
 conn.on('close',()=>{
  if(guest){if(mode==='guest')handleLoss('ホストとの通信が切断されました');}
  else if(mode==='host'&&players.has(id)){
   const p=players.get(id);players.delete(id);addChat('',p.name+' が退出しました',true);
   notifyAll({t:'system',text:p.name+' が退出しました'});refreshWorld();
  }
 });
 conn.on('error',err=>setStatus('通信エラー: '+String(err?.message||err).slice(0,90),true));
}
async function loadPeer(){
 const m=await import('https://cdn.jsdelivr.net/npm/peerjs@1.5.5/+esm');
 const ctor=m.Peer||m.default?.Peer||m.default;
 if(typeof ctor!=='function')throw new Error('PeerJSを読み込めません');
 return ctor;
}
function awaitOpen(p,ms=14000){
 return new Promise((resolve,reject)=>{
  const t=setTimeout(()=>reject(Error('通信開始がタイムアウトしました')),ms);
  p.once('open',id=>{clearTimeout(t);resolve(id)});
  p.once('error',e=>{clearTimeout(t);reject(e)});
 });
}
function closeNetwork(){
 clearInterval(sendTimer);sendTimer=null;
 const oldPeer=peer,oldHost=hostConn;peer=null;hostConn=null;
 for(const p of players.values())try{p.conn.close()}catch{}
 players.clear();
 try{oldHost?.close()}catch{}try{oldPeer?.destroy()}catch{}
 peerOpen=false;mode='solo';roomCode='';selfId='';
 bridge.setRole('solo');bridge.setPeers([]);
 uiRoom();
}
function link(){const u=new URL(location.href);u.searchParams.set('room',roomCode);u.searchParams.set('v','coop1');return u.toString();}
async function begin(asHost){
 if(starting)return;starting=true;
 $('createRoom').disabled=true;$('joinRoom').disabled=true;
 closeNetwork();
 try{
  myName=safeName(nameInput.value);nameInput.value=myName;
  const Peer=await loadPeer();
  roomCode=String(codeInput.value||'').trim().toUpperCase().replace(/[^A-Z0-9]/g,'');
  if(asHost&&!roomCode)roomCode=Array.from(crypto.getRandomValues(new Uint8Array(6)),v=>'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'[v%32]).join('');
  if(!/^[A-Z0-9]{6}$/.test(roomCode))throw Error('部屋コードは英数字6文字で入力してください');
  codeInput.value=roomCode;
  setStatus(asHost?'部屋を作成中…':'部屋に接続中…');
  peer=new Peer(asHost?roomPeerId(roomCode):undefined);
  if(asHost){
   peer.on('connection',conn=>{
    if(mode!=='host')return conn.close();
    if(players.size>=3){conn.on('open',()=>{conn.send({t:'reject',reason:'満員です（最大4人）'});conn.close()});return;}
    players.set(conn.peer,{id:conn.peer,conn,name:'冒険者',x:bridge.spawn().x,z:bridge.spawn().z,yaw:Math.PI,hp:100,hello:false,lastPose:0,lastAttack:0,lastChat:0});
    wireConnection(conn,conn.peer);
    conn.on('open',()=>refreshWorld());
   });
  }
  await awaitOpen(peer);
  mode=asHost?'host':'guest';bridge.setRole(mode);
  if(asHost){
   bridge.begin();
   setStatus('部屋を作成しました：'+roomCode);
   addChat('','部屋コード '+roomCode+' を共有すると友達が参加できます',true);
  }else{
   const conn=peer.connect(roomPeerId(roomCode),{reliable:true});
   hostConn=conn;wireConnection(conn,conn.peer,true);
   await new Promise((resolve,reject)=>{
    const t=setTimeout(()=>reject(Error('部屋が見つからないか、接続できません')),12000);
    conn.once('open',()=>{clearTimeout(t);resolve()});
    conn.once('error',e=>{clearTimeout(t);reject(e)});
   });
   bridge.begin();conn.send({t:'hello',name:myName});
   setStatus('参加しました：'+roomCode);
  }
  uiRoom();
  sendTimer=setInterval(()=>{
   if(mode==='host'){refreshWorld();}
   else if(mode==='guest'&&hostConn?.open&&bridge.phase()==='play'){
    const pos=bridge.pose();hostConn.send({t:'pose',...pos});
    if(bridge.isKeyNear(pos.x,pos.z))hostConn.send({t:'pickup'});
   }
  },125);
 }catch(error){
  closeNetwork();setStatus('接続失敗：'+String(error?.message||error).slice(0,100),true);
 }finally{starting=false;$('createRoom').disabled=false;$('joinRoom').disabled=false;}
}
function sendChat(raw){
 const text=safeText(raw),now=performance.now();if(!text||mode==='solo'||now-lastMessage<400)return;
 lastMessage=now;
 if(mode==='host'){addChat(myName,text);notifyAll({t:'chat',name:myName,text});}
 else if(mode==='guest'&&hostConn?.open){hostConn.send({t:'chat',text});addChat(myName,text);}
}
$('createRoom').addEventListener('click',()=>begin(true));
$('joinRoom').addEventListener('click',()=>begin(false));
inviteButton.addEventListener('click',async()=>{
 if(mode==='solo')return;
 try{await navigator.clipboard.writeText(link());addChat('','招待リンクをコピーしました',true);}
 catch{prompt('このリンクを友達に送ってください',link());}
});
leaveButton.addEventListener('click',()=>{
 if(mode==='host')notifyAll({t:'roomClosed'});
 closeNetwork();setStatus('部屋を退出しました。ソロで続けられます。');
});
chatToggle.addEventListener('click',()=>{
 chatPanel.open=!chatPanel.open;chatToggle.classList.remove('unread');
 if(chatPanel.open){try{document.exitPointerLock?.()}catch{}chatInput.focus();}
});
$('chatClose').addEventListener('click',()=>chatPanel.open=false);
chatForm.addEventListener('submit',e=>{
 e.preventDefault();const value=chatInput.value;chatInput.value='';sendChat(value);chatInput.focus();
});
chatForm.addEventListener('keydown',e=>e.stopPropagation());
chatInput.addEventListener('pointerdown',e=>e.stopPropagation());
window.addEventListener('beforeunload',()=>closeNetwork());
window.NEXA_MP={
 get role(){return mode;},
 attack(){if(mode==='guest'&&hostConn?.open)hostConn.send({t:'attack'});},
 hostDamage(id,value){
  if(mode!=='host')return;
  const p=players.get(id);if(!p||p.hp<=0)return;
  p.hp=limit(p.hp-value,0,100);
  if(!p.hp)sendTo(id,{t:'system',text:'HPが0になりました。'});
 },
 clear:clearRoom,
 sendChat,
 get members(){return memberCount();},
 get code(){return roomCode;}
};
uiRoom();
