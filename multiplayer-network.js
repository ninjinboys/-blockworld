// BLOCKWORLD temporary host-to-guest transport over WebRTC data channels.
// GitHub Pages stays static. Public PeerJS Cloud supplies signaling only;
// remaining players can take over the room when the host leaves.
const CLIENT_URL='https://cdn.jsdelivr.net/npm/peerjs@1.5.5/+esm';
let peerConstructorPromise;
async function loadPeer(){
  if(!peerConstructorPromise)peerConstructorPromise=import(CLIENT_URL).then(module=>{
    const ctor=module.Peer||module.default?.Peer||module.default;
    if(typeof ctor!=='function')throw new Error('PeerJSモジュールを読み込めません');
    return ctor;
  }).catch(error=>{peerConstructorPromise=null;throw error});
  return peerConstructorPromise;
}
const roomId=code=>'blockworld-room-v1-'+code;
const presenceId=id=>'blockworld-friend-v1-'+id;
function waitForOpen(peer){
  return new Promise((resolve,reject)=>{
    const timer=setTimeout(()=>reject(new Error('接続がタイムアウトしました')),15000);
    peer.on('open',id=>{clearTimeout(timer);resolve(id)});
    peer.on('error',error=>{clearTimeout(timer);reject(error)});
  });
}
export function createBlockworldNetwork(onEvent,getStatus){
  let presence=null,room=null,hostConnection=null,role=null,roomCode='';
  const clients=new Map();
  let myId='',myName='';
  function emit(type,extra={}){onEvent({type,...extra})}
  function status(){return {name:myName,friendId:myId,...getStatus()}}
  function openConnection(conn,handler){
    conn.on('data',data=>{
      if(!data||typeof data!=='object'||typeof data.t!=='string')return;
      handler(data,conn);
    });
    conn.on('error',e=>emit('error',{message:e.message||'通信エラー'}));
  }
  async function startPresence(friendId,name){
    myId=friendId;myName=name;
    if(presence&&!presence.destroyed)return;
    const Peer=await loadPeer(),p=new Peer(presenceId(friendId));presence=p;
    p.on('connection',conn=>{
      conn.on('open',()=>{});
      openConnection(conn,data=>{
        if(data.t==='status'){
          if(conn.open)conn.send({t:'status',...status()});
        }else if(data.t==='friendRequest'){
          if(typeof data.friendId==='string'&&typeof data.name==='string')
            emit('friendRequest',{id:data.friendId,name:data.name,connection:conn});
        }else if(data.t==='friendAccepted'){
          emit('friendAccepted',{id:data.friendId,name:data.name});
        }
      });
    });
    p.on('disconnected',()=>{try{p.reconnect()}catch{}});
    p.on('error',err=>emit('presenceError',{message:err.message||'フレンド通信エラー'}));
    await waitForOpen(p);
    emit('presenceReady',{id:friendId});
  }
  async function talkToFriend(id,message,timeout=6500){
    if(!presence||presence.destroyed)throw new Error('フレンド通信の接続がありません');
    return new Promise((resolve,reject)=>{
      const conn=presence.connect(presenceId(id),{reliable:true});
      const timer=setTimeout(()=>{conn.close();reject(new Error('相手はオフラインです'))},timeout);
      let done=false;
      function complete(value){if(done)return;done=true;clearTimeout(timer);resolve(value);setTimeout(()=>conn.close(),300)}
      conn.on('error',e=>{if(done)return;done=true;clearTimeout(timer);reject(e)});
      conn.on('open',()=>{
        conn.send(message);
        if(message.t==='friendRequest'||message.t==='friendAccepted')complete(true);
      });
      conn.on('data',reply=>{if(reply?.t==='status')complete(reply)});
    });
  }
  async function host(code){
    leaveRoom();
    const Peer=await loadPeer();role='host';roomCode=code;
    const p=new Peer(roomId(code));room=p;
    p.on('connection',conn=>{
      if(clients.size>=3){
        conn.on('open',()=>{conn.send({t:'reject',reason:'満員です（最大4人）'});setTimeout(()=>conn.close(),150)});
        return;
      }
      clients.set(conn.peer,conn);
      openConnection(conn,(message,c)=>emit('roomData',{message,peerId:c.peer}));
      conn.on('close',()=>{clients.delete(conn.peer);emit('peerLeft',{peerId:conn.peer})});
      conn.on('open',()=>emit('peerOpen',{peerId:conn.peer}));
    });
    p.on('disconnected',()=>{if(role==='host'&&room===p)emit('roomLost',{reason:'通信サーバーとの接続が切れました'})});
    p.on('error',e=>emit('roomError',{reason:e.message||'部屋の作成に失敗しました'}));
    await waitForOpen(p);
    emit('hosting',{code});
  }
  async function join(code){
    leaveRoom();
    const Peer=await loadPeer();
    role='guest';roomCode=code;
    const p=new Peer();room=p;
    p.on('disconnected',()=>{if(role==='guest'&&room===p)emit('roomLost',{reason:'通信サーバーとの接続が切れました'})});
    p.on('error',e=>emit('roomError',{reason:e.message||'接続エラー'}));
    await waitForOpen(p);
    const conn=p.connect(roomId(code),{reliable:true}); // BinaryPack supports chunking large world saves.
    hostConnection=conn;
    openConnection(conn,(message)=>emit('roomData',{message,peerId:conn.peer}));
    conn.on('close',()=>{if(role==='guest'&&hostConnection===conn)emit('roomLost',{reason:'ホストとの接続が切れました'})});
    await new Promise((resolve,reject)=>{
      let settled=false;
      const timer=setTimeout(()=>{if(!settled){settled=true;reject(new Error('部屋が見つからないか、応答がありません'))}},12000);
      conn.on('open',()=>{if(settled)return;settled=true;clearTimeout(timer);resolve()});
      conn.on('error',e=>{if(settled)return;settled=true;clearTimeout(timer);reject(e)});
    });
    emit('joined',{code});
  }
  function send(message,to=null){
    if(role==='host'){
      if(to){const c=clients.get(to);if(c?.open)c.send(message);return}
      for(const c of clients.values())if(c.open)c.send(message);
    }else if(role==='guest'&&hostConnection?.open)hostConnection.send(message);
  }
  function leaveRoom(options={}){
    const handoff=options.handoff===true;
    const wasHost=role==='host',oldRoom=room,oldConnections=[...clients.values()];
    if(wasHost&&!handoff)send({t:'roomClosed'});
    role=null;roomCode='';
    clients.clear();
    if(hostConnection)try{hostConnection.close()}catch{}
    hostConnection=null;room=null;
    const finish=()=>{
      for(const c of oldConnections)try{c.close()}catch{}
      if(oldRoom)try{oldRoom.destroy()}catch{}
    };
    // Allow the full migration snapshot to reach guests before releasing the
    // room ID so the elected successor can claim the same join code.
    if(wasHost)setTimeout(finish,handoff?650:350);
    else finish();
  }
  return {
    startPresence,talkToFriend,host,join,send,leaveRoom,
    get role(){return role},
    get code(){return roomCode},
    get connected(){return role==='host'?!!room?.open:!!hostConnection?.open},
    get guests(){return [...clients.keys()]},
    get ownId(){return myId}
  };
}
