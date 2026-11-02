/* Username/password account and cloud memory sync for LUX/NOX. */
"use strict";
const bridge=window.companionSyncBridge;
if(!bridge)throw Error("Companion bridge unavailable");
const companion=bridge.appId, COMPANION=companion.toUpperCase();
const CONFIG_KEY="companion-firebase-config-v1";
const OWNER_KEY="companion-firebase-owner-v1-"+companion;
const backupKey=uid=>"companion-firebase-backup-v1-"+companion+"-"+uid;
const pendingImportKey=uid=>backupKey(uid)+":pending-import";
const SDK="https://www.gstatic.com/firebasejs/12.19.0/";
let appSdk,authSdk,storeSdk,auth,db,user=null,configured=null;
let profileRef=null,chatsRef=null,unsubs=[],connected=false,initializing=false;
let profileRemote=null,chatsRemote=null,gotProfile=false,gotChats=false;
let dirty=false,writing=false,writeTimer=null,writeAt=0,profileHash="";
let knownChats=new Map(),knownPhotos=new Set();
const el=id=>document.getElementById(id);

const css=document.createElement("style");
css.textContent=[
".cloudAccount{padding:10px 8px;margin-bottom:9px;border:1px solid #8885aa44;border-radius:12px;background:#7d79a312;color:inherit}",
".cloudAccount button{cursor:pointer}",
".cloudLogin{display:flex;align-items:center;justify-content:center;gap:9px;width:100%;padding:9px;border:1px solid #c7c9d7;border-radius:9px;background:#fff;color:#24303b;font-weight:700;font-size:13px}",
".cloudG{font-size:19px;font-weight:900;background:conic-gradient(#4285f4 0 90deg,#34a853 90deg 175deg,#fbbc05 175deg 260deg,#ea4335 260deg 325deg,#4285f4 325deg);background-clip:text;-webkit-background-clip:text;color:transparent}",
".cloudStatus{font-size:11px;line-height:1.6;min-height:16px;margin-top:7px;opacity:.9;overflow-wrap:anywhere}",
".cloudIdentity{font-size:12px;font-weight:700;overflow-wrap:anywhere}",
".cloudActions{display:flex;gap:6px;flex-wrap:wrap;margin-top:8px}",
".cloudActions button{padding:5px 7px;font-size:11px;border-radius:7px;border:1px solid currentColor;background:transparent;color:inherit;opacity:.85}",
".cloudAccount [hidden]{display:none!important}",
".cloudAccount input{box-sizing:border-box;width:100%;padding:9px 10px;margin:4px 0 8px;border:1px solid #b7c4d3;border-radius:9px;font-size:14px;background:#fff;color:#24303b}",
".cloudAccount label{display:block;font-size:12px;font-weight:700}",
".cloudTabs{display:flex;gap:7px;margin-bottom:9px}",
".cloudTabs button{flex:1;border-radius:8px;padding:8px 4px;border:1px solid #9da7bb;background:transparent;color:inherit}",
".cloudTabs button.active{background:#31588a;color:white;border-color:#31588a}",
".cloudDialog{width:min(560px,92vw);max-width:92vw;border:1px solid #cad4dc;border-radius:16px;background:#fff;color:#243541;padding:22px;box-shadow:0 15px 50px #0005}",
".cloudDialog::backdrop{background:#080c1dcc}",
".cloudDialog h2{font-size:19px;margin:0 0 11px}",
".cloudDialog p,.cloudDialog small{font-size:12px;line-height:1.7}",
".cloudDialog textarea{display:block;box-sizing:border-box;width:100%;height:165px;border-radius:10px;padding:12px;margin:9px 0;background:#f8fafc;color:#223;border:1px solid #adbfc8;font-size:12px;font-family:monospace}",
".cloudDialog .cloudDlgActions{display:flex;gap:9px;justify-content:flex-end;margin-bottom:10px}",
".cloudDlgActions button{border-radius:9px;padding:8px 13px;border:1px solid #b9c4d0;background:#f5f7fb;color:#243b48}",
".cloudDlgActions #cloudSave{background:#256f9c;color:#fff;border-color:#256f9c}",
".cloudDialog a{color:#1766ad}"
].join("\n");
document.head.append(css);
const box=document.querySelector(".accountBox")||document.createElement("section");
const wasExisting=box.isConnected;
box.className="cloudAccount";
box.innerHTML='<form id="cloudAccountForm" autocomplete="on">'+
 '<div class="cloudTabs"><button type="button" id="cloudTabLogin" class="active">ログイン</button><button type="button" id="cloudTabCreate">新規アカウント作成</button></div>'+
 '<label>名前<input id="cloudUsername" name="username" autocomplete="username" maxlength="20" required></label>'+
 '<label>パスワード<input id="cloudPassword" name="password" type="password" autocomplete="current-password" minlength="8" maxlength="128" required></label>'+
 '<button type="submit" id="cloudLogin" class="cloudLogin">ログイン</button></form>'+
 '<div id="cloudIdentity" class="cloudIdentity" hidden></div>'+
 '<div id="cloudStatus" class="cloudStatus" aria-live="polite">端末内に保存中</div>'+
 '<div class="cloudActions"><button type="button" id="cloudSyncNow" hidden>今すぐ同期</button>'+
 '<button type="button" id="cloudImport" hidden>端末データを統合</button>'+
 '<button type="button" id="cloudLogout" hidden>ログアウト</button>'+
 '<button type="button" id="cloudConfigure">連携設定</button></div>';
if(!wasExisting)document.querySelector(".sidebarBottom")?.prepend(box);
const dlg=document.createElement("dialog");dlg.className="cloudDialog";
dlg.innerHTML='<h2>'+COMPANION+' のアカウント同期設定</h2>'+
 '<p>端末間同期に必要なFirebaseのWebアプリ設定を貼り付けてね。LUXとNOXで同じ設定を使えるよ。</p>'+
 '<textarea id="cloudConfigText" spellcheck="false" aria-label="FirebaseのWeb設定" placeholder="Firebase Webアプリの設定を貼り付けてね"></textarea>'+
 '<div class="cloudDlgActions"><button id="cloudCancel" type="button">キャンセル</button><button id="cloudSave" type="button">保存して接続</button></div>'+
 '<small><a href="https://console.firebase.google.com/" rel="noopener" target="_blank">Firebase Console</a> でWebアプリを登録し、Authenticationのメール/パスワード認証とFirestoreを有効にしてね。利用サイトのドメインも承認が必要。サービスアカウント秘密鍵は貼り付けないでね。</small>';
document.body.append(dlg);
function notice(text){el("cloudStatus").textContent=text}
function ui(){
 const signed=!!user;
 el("cloudAccountForm").hidden=signed;el("cloudIdentity").hidden=!signed;
 for(const key of ["cloudSyncNow","cloudImport","cloudLogout"])el(key).hidden=!signed;
 if(signed)el("cloudIdentity").textContent="☁ "+(user.displayName||user.email?.split("@")[0]||"アカウント");
}
function parseConfig(input){
 let t=input.trim();
 if(/^(const|let|var)\s+/.test(t)){
  const i=t.indexOf("{"),j=t.lastIndexOf("}");
  if(i<0||j<=i)throw Error("firebaseConfig の { } を含めて貼り付けてね");
  t=t.slice(i,j+1);
 }
 let c;
 try{c=JSON.parse(t)}catch{
  const fixed=t.replace(/([{,]\s*)([A-Za-z_$][\w$]*)\s*:/g,'$1"$2":')
   .replace(/'([^'\n]*)'/g,(_,v)=>JSON.stringify(v))
   .replace(/,\s*([}\]])/g,'$1');
  try{c=JSON.parse(fixed)}catch{throw Error("FirebaseのWeb設定を読み取れなかったよ")}
 }
 for(const k of ["apiKey","authDomain","projectId","appId"])
  if(typeof c[k]!=="string"||!c[k])throw Error("Firebase設定に "+k+" がないよ");
 if(!/^[A-Za-z0-9_.:-]+$/.test(c.apiKey)||!/^[A-Za-z0-9.-]+$/.test(c.authDomain)||
    !/^[a-z0-9][a-z0-9-]+$/.test(c.projectId))throw Error("Firebase設定の形式が正しくないよ");
 return {apiKey:c.apiKey,authDomain:c.authDomain,projectId:c.projectId,appId:c.appId};
}
function openDialog(){el("cloudConfigText").value=configured?JSON.stringify(configured,null,2):"";dlg.showModal()}
el("cloudConfigure").onclick=openDialog;
el("cloudCancel").onclick=()=>dlg.close();
el("cloudSave").onclick=()=>{
 try{
  const value=parseConfig(el("cloudConfigText").value);
  localStorage.setItem(CONFIG_KEY,JSON.stringify(value));
  location.reload();
 }catch(e){alert(e.message)}
};
function errorText(e){
 const code=String(e?.code||"");
 if(code.includes("email-already-in-use"))return "その名前はすでに使われているよ";
 if(code.includes("invalid-credential")||code.includes("wrong-password")||code.includes("user-not-found"))return "名前かパスワードが違うよ";
 if(code.includes("weak-password"))return "もっと長いパスワードにしてね";
 if(code.includes("too-many-requests"))return "ログイン試行が多すぎるよ。しばらく待ってね";
 if(code.includes("operation-not-allowed"))return "Firebaseでメール/パスワード認証を有効にしてね";
 if(code.includes("unauthorized-domain"))return "このURLをFirebaseの承認済みドメインに登録してね";
 if(code.includes("popup-blocked"))return "Googleログイン用のポップアップがブロックされたよ";
 if(code.includes("popup-closed"))return "ログインがキャンセルされたよ";
 if(code.includes("permission-denied"))return "Firestoreのルールでアクセスが拒否されたよ";
 if(code.includes("network")||code.includes("unavailable"))return "ネットワーク接続に問題があるよ。端末内のデータは残っているよ";
 return "接続エラー："+(code||String(e?.message||"不明").slice(0,110));
}
async function start(){
 if(!configured){notice("クラウド同期が未設定（端末内に保存中）");return}
 try{
  [appSdk,authSdk,storeSdk]=await Promise.all([
   import(SDK+"firebase-app.js"),import(SDK+"firebase-auth.js"),import(SDK+"firebase-firestore.js")
  ]);
  const a=appSdk.initializeApp(configured,companion+"-"+configured.projectId);
  auth=authSdk.getAuth(a);db=storeSdk.getFirestore(a);
  notice("アカウントを確認中…");
  authSdk.onAuthStateChanged(auth,userChanged,e=>notice(errorText(e)));
 }catch(e){notice(errorText(e))}
}
let accountMode="login";
function setAccountMode(mode){
 accountMode=mode;
 el("cloudTabLogin").classList?.toggle("active",mode==="login");
 el("cloudTabCreate").classList?.toggle("active",mode==="create");
 el("cloudLogin").textContent=mode==="create"?"アカウントを作成":"ログイン";
 el("cloudPassword").autocomplete=mode==="create"?"new-password":"current-password";
}
el("cloudTabLogin").onclick=()=>setAccountMode("login");
el("cloudTabCreate").onclick=()=>setAccountMode("create");
function usernameEmail(name){
 const n=name.trim().toLowerCase();
 if(!/^[a-z0-9_]{3,20}$/.test(n))throw Error("名前は半角英数字と _ の3〜20文字で入力してね");
 // Internal Firebase Auth identifier. No real email address is collected.
 return n+"@accounts.luxnox.example.com";
}
el("cloudAccountForm").onsubmit=async event=>{
 event.preventDefault();
 if(!configured){openDialog();return}
 if(!auth){notice("認証機能を準備中。少し待ってね");return}
 let name,email;
 try{
  name=el("cloudUsername").value.trim();
  email=usernameEmail(name);
  const password=el("cloudPassword").value;
  if(password.length<8)throw Error("パスワードは8文字以上にしてね");
  el("cloudLogin").disabled=true;
  notice(accountMode==="create"?"アカウントを作成中…":"ログイン中…");
  if(accountMode==="create"){
   const credential=await authSdk.createUserWithEmailAndPassword(auth,email,password);
   await authSdk.updateProfile(credential.user,{displayName:name});
   notice("アカウントを作成したよ。同期を準備中…");
  }else{
   await authSdk.signInWithEmailAndPassword(auth,email,password);
  }
  el("cloudPassword").value="";
 }catch(e){notice(e.message?.startsWith("名前は")||e.message?.startsWith("パスワードは")?e.message:errorText(e))}
 finally{el("cloudLogin").disabled=false}
};
el("cloudLogout").onclick=async()=>{
 if(!auth||!confirm("ログアウトする？ この端末の会話はアカウント別に保管して、画面から閉じるよ"))return;
 try{if(connected)await flush();await authSdk.signOut(auth)}catch(e){notice(errorText(e))}
};
el("cloudSyncNow").onclick=()=>schedule(0,true);
el("cloudImport").onclick=async()=>{
 if(!user||!connected)return;
 const raw=localStorage.getItem(pendingImportKey(user.uid))||localStorage.getItem(backupKey(user.uid));
 if(!raw){alert("この端末に統合できる履歴はないよ");return}
 if(!confirm("保存しておいたこの端末の履歴を、クラウドに統合する？"))return;
 try{
  const local=JSON.parse(raw),remote=bridge.read();
  if(local.version!==1)throw Error("古い履歴の形式が違うよ");
  if(!bridge.apply(mergeState(local,remote)))throw Error("会話中は統合できないよ");
  dirty=true;await flush(true);localStorage.removeItem(pendingImportKey(user.uid));notice("履歴の統合が完了したよ");
 }catch(e){notice(errorText(e))}
};
function snapshotProfile(st){
 const p=JSON.parse(JSON.stringify(st));
 delete p.chats;delete p.messages;delete p.activeChat;delete p.photoArchive;
 return p;
}
function snapshotChat(chat){
 const c=JSON.parse(JSON.stringify(chat));
 c.messages=(c.messages||[]).slice(-100).map(m=>{
  const v={role:m.role,text:String(m.text||"").slice(0,4000),time:Number(m.time)||Date.now()};
  if(m.photoId)v.photoId=m.photoId;
  else if(m.photoData)v.photoId="photo-"+(m.time||0)+"-inline";
  return v;
 });
 return c;
}
function fromRemote(profile,chats,local){
 const out={...(profile||bridge.initial())};
 out.version=1;out.chats=chats;
 out.activeChat=chats.some(c=>c.id===local.activeChat)?local.activeChat:chats[0]?.id;
 out.messages=chats.find(c=>c.id===out.activeChat)?.messages||[];
 return out;
}
function isMeaningful(st){
 if(!st)return false;
 // Automatic background thinking on a new device is not user data to import.
 if((st.chats||[]).length>1)return true;
 if(st.name&&st.name.toUpperCase()!==COMPANION)return true;
 if((st.memories||[]).some(m=>m.kind==="会話"))return true;
 return (st.chats?.[0]?.messages||st.messages||[]).some(m=>m.role==="user");
}
function mergeState(local,remote){
 const result={...remote},map=new Map((remote.chats||[]).map(c=>[c.id,c]));
 for(const lc of local.chats||[]){
  const rc=map.get(lc.id);
  if(!rc){map.set(lc.id,lc);continue}
  const messages=new Map();
  for(const m of [...(rc.messages||[]),...(lc.messages||[])])
   messages.set(String(m.time)+"|"+m.role+"|"+m.text+"|"+(m.photoId||""),m);
  const newest=Number(lc.updatedAt||0)>Number(rc.updatedAt||0)?lc:rc;
  map.set(lc.id,{...newest,messages:[...messages.values()].sort((a,b)=>a.time-b.time).slice(-100)});
 }
 result.chats=[...map.values()];
 const unique=(items,key,n)=>{
  const map=new Map();for(const item of items)map.set(key(item),item);
  return [...map.values()].sort((a,b)=>(b.time||0)-(a.time||0)).slice(0,n);
 };
 result.memories=unique([...(remote.memories||[]),...(local.memories||[])],m=>m.time+"|"+m.text,35);
 result.journal=unique([...(remote.journal||[]),...(local.journal||[])],m=>m.time+"|"+m.text,35);
 result.goals=[...new Map([...(remote.goals||[]),...(local.goals||[])].map(g=>[g.id,g])).values()].slice(-30);
 result.interests={...(remote.interests||{})};
 for(const [key,v] of Object.entries(local.interests||{}))result.interests[key]=Math.max(result.interests[key]||0,v||0);
 result.steps=Math.max(remote.steps||0,local.steps||0);
 result.activeChat=result.chats.some(c=>c.id===local.activeChat)?local.activeChat:result.chats[0]?.id;
 result.messages=result.chats.find(c=>c.id===result.activeChat)?.messages||[];
 return result;
}
function remember(uid,st){try{localStorage.setItem(backupKey(uid),JSON.stringify(st))}catch(e){console.warn(e)}}
function base(){return "users/"+user.uid+"/companions/"+companion}
function photoRef(id){return storeSdk.doc(db,base()+"/photos/"+id)}
async function userChanged(next){
 if(next?.uid===user?.uid)return;
 const former=user;
 for(const u of unsubs){try{u()}catch{}}
 unsubs=[];connected=false;initializing=false;gotProfile=false;gotChats=false;profileRemote=null;chatsRemote=null;
 profileHash="";knownChats.clear();knownPhotos.clear();dirty=false;
 if(writeTimer){clearTimeout(writeTimer);writeTimer=null}
 user=next||null;ui();
 if(!user){
  if(former){remember(former.uid,bridge.read());bridge.fresh()}
  else{
   // A remembered account must not show private history on a signed-out device.
   const previousOwner=localStorage.getItem(OWNER_KEY);
   if(previousOwner){remember(previousOwner,bridge.read());bridge.fresh()}
  }
  notice("ログインしていないよ（端末内に保存中）");
  return;
 }
 try{
  initializing=true;notice("クラウドの記憶を確認中…");
  const owner=localStorage.getItem(OWNER_KEY);
  if(owner&&owner!==user.uid){
   remember(owner,bridge.read());
   if(!bridge.fresh())throw Error("会話が終わってから切り替えてね");
  }
  let local=bridge.read();
  // New conversations created after logout are intentional offline edits.
  const offlineEdits=isMeaningful(local);
  if(owner===user.uid&&!offlineEdits){
   const saved=localStorage.getItem(backupKey(user.uid));
   if(saved)try{const backup=JSON.parse(saved);if(isMeaningful(backup))local=backup}catch{}
  }
  profileRef=storeSdk.doc(db,base());
  chatsRef=storeSdk.collection(db,base()+"/chats");
  const [prof,docs]=await Promise.all([storeSdk.getDoc(profileRef),storeSdk.getDocs(chatsRef)]);
  if(user.uid!==next.uid)return;
  const remote=prof.exists()||!docs.empty?fromRemote(prof.exists()?prof.data().data:null,docs.docs.map(d=>d.data()),local):null;
  const shouldMerge=!owner&&isMeaningful(local)||owner===user.uid&&offlineEdits;
  if(remote&&!shouldMerge&&isMeaningful(local)){
   // Keep a recovery copy rather than resurrecting deleted cloud history.
   try{localStorage.setItem(pendingImportKey(user.uid),JSON.stringify(local))}catch{}
  }
  const combined=!remote?local:shouldMerge?mergeState(local,remote):remote;
  if(!bridge.apply(combined))throw Error("会話が終わってから同期してね");
  localStorage.setItem(OWNER_KEY,user.uid);
  remember(user.uid,combined);
  profileHash=remote?JSON.stringify(snapshotProfile(remote)):"";
  knownChats=new Map((remote?.chats||[]).map(c=>[c.id,JSON.stringify(snapshotChat(c))]));
  connected=true;initializing=false;
  bridge.refreshCloudPhotos?.();
  dirty=!remote||profileHash!==JSON.stringify(snapshotProfile(combined))||
   combined.chats.some(c=>JSON.stringify(snapshotChat(c))!==knownChats.get(c.id));
  if(dirty){notice("初回の記憶を保存中…");await flush(true)}
  else notice("クラウドと同期済み ✓");
  if(user?.uid===next.uid)listen(next.uid);
 }catch(e){initializing=false;connected=false;notice(errorText(e))}
}
function listen(uid){
 const bad=e=>notice(errorText(e));
 unsubs.push(storeSdk.onSnapshot(profileRef,s=>{
  if(user?.uid!==uid)return;
  profileRemote=s.exists()?s.data().data:null;gotProfile=true;receive();
 },bad));
 unsubs.push(storeSdk.onSnapshot(chatsRef,s=>{
  if(user?.uid!==uid)return;
  chatsRemote=s.docs.map(d=>d.data());gotChats=true;receive();
 },bad));
}
function receive(){
 if(!connected||initializing||dirty||writing||bridge.isBusy()||!gotProfile||!gotChats||!profileRemote)return;
 const old=bridge.read(),newState=fromRemote(profileRemote,chatsRemote,old);
 const oldP=JSON.stringify(snapshotProfile(old)),newP=JSON.stringify(snapshotProfile(newState));
 const oldC=JSON.stringify((old.chats||[]).map(snapshotChat));
 const newC=JSON.stringify((newState.chats||[]).map(snapshotChat));
 if(oldP!==newP||oldC!==newC){
  const nextPhotos=new Set(newState.chats.flatMap(c=>(c.messages||[]).map(m=>m.photoId).filter(Boolean)));
  const removed=old.chats.flatMap(c=>(c.messages||[]).map(m=>m.photoId).filter(id=>id&&!nextPhotos.has(id)));
  bridge.apply(newState);
  for(const id of new Set(removed))bridge.removePhoto?.(id);
  bridge.refreshCloudPhotos?.();
 }
 profileHash=newP;knownChats=new Map(newState.chats.map(c=>[c.id,JSON.stringify(snapshotChat(c))]));
 remember(user.uid,bridge.read());
 notice("クラウドと同期済み ✓");
}
function schedule(delay=1800,force=false){
 if(!connected||!user)return;
 dirty=true;
 if(force){if(writeTimer)clearTimeout(writeTimer);writeTimer=null;void flush(true);return}
 const when=Date.now()+delay;
 if(!writeTimer||when<writeAt){
  if(writeTimer)clearTimeout(writeTimer);
  writeAt=when;
  writeTimer=setTimeout(()=>{writeTimer=null;void flush()},delay);
 }
}
bridge.onChange(()=>{
 if(!connected||initializing||!user)return;
 const snap=bridge.read();
 const changed=(snap.chats||[]).some(c=>JSON.stringify(snapshotChat(c))!==knownChats.get(c.id))||
  [...knownChats.keys()].some(id=>!(snap.chats||[]).some(c=>c.id===id));
 schedule(changed?1500:35000);
});
async function uploadPhoto(id){
 if(!id||knownPhotos.has(id))return;
 const reference=photoRef(id);
 if((await storeSdk.getDoc(reference)).exists()){knownPhotos.add(id);return}
 let data;try{data=await bridge.getPhoto(id)}catch{}
 if(!data&&id.endsWith("-inline")){
  const old=bridge.read().chats.flatMap(c=>c.messages||[]).find(m=>m.photoData&&"photo-"+(m.time||0)+"-inline"===id);
  data=old?.photoData||null;
 }
 if(!data||!/^data:image\/jpeg;base64,[A-Za-z0-9+/=]+$/.test(data))return;
 const payload=data.slice("data:image/jpeg;base64,".length),partSize=170000;
 const fragments=[];for(let i=0;i<payload.length;i+=partSize)fragments.push(payload.slice(i,i+partSize));
 if(fragments.length>18)throw Error("画像サイズが大きすぎるよ");
 for(let i=0;i<fragments.length;i++)await storeSdk.setDoc(
  storeSdk.doc(db,base()+"/photos/"+id+"/parts/p"+String(i).padStart(3,"0")),
  {index:i,data:fragments[i]}
 );
 await storeSdk.setDoc(reference,{parts:fragments.length,format:"image/jpeg",size:payload.length});
 knownPhotos.add(id);
}
async function loadPhoto(id){
 if(!connected||!user||!/^photo-[A-Za-z0-9-]{1,120}$/.test(id))return null;
 const ref=await storeSdk.getDoc(photoRef(id));
 if(!ref.exists())return null;
 const count=ref.data()?.parts;if(!Number.isInteger(count)||count<1||count>18)return null;
 const result=await storeSdk.getDocs(storeSdk.collection(db,base()+"/photos/"+id+"/parts"));
 const parts=result.docs.map(x=>x.data()).sort((a,b)=>a.index-b.index);
 if(parts.length!==count)return null;
 return "data:image/jpeg;base64,"+parts.map(x=>x.data).join("");
}
window.companionCloud={get active(){return connected&&!!user},loadPhoto};
if(window.AGENT_SYNC_BRIDGE){
 window.AGENT_SYNC_BRIDGE.fetchPhoto=loadPhoto;
 window.AGENT_SYNC_BRIDGE.savePhoto=(id)=>{if(connected&&user)void uploadPhoto(id).catch(e=>console.warn("Cloud photo sync",e))};
}
async function flush(force=false){
 if(!connected||!user||writing)return;
 if(writeTimer){clearTimeout(writeTimer);writeTimer=null}
 if(bridge.isBusy()){schedule(4000);return}
 writing=true;
 const uid=user.uid;
 try{
  const state=bridge.read();
  const oldPhotoIds=new Set();
  for(const oldWire of knownChats.values())try{
   const chat=JSON.parse(oldWire);
   for(const m of chat.messages||[])if(m.photoId)oldPhotoIds.add(m.photoId);
  }catch{}
  const profile=snapshotProfile(state),finger=JSON.stringify(profile);
  if(force||finger!==profileHash){
   await storeSdk.setDoc(profileRef,{data:profile,updatedAt:Date.now()});
   profileHash=finger;
  }
  for(const chat of state.chats||[]){
   if(user?.uid!==uid)break;
   const wire=snapshotChat(chat);
   if(!force&&JSON.stringify(wire)===knownChats.get(chat.id))continue;
   for(const m of wire.messages||[])if(m.photoId)await uploadPhoto(m.photoId);
   await storeSdk.setDoc(storeSdk.doc(chatsRef,chat.id),{...wire,updatedAt:Date.now()});
   knownChats.set(chat.id,JSON.stringify(wire));
  }
  const ids=new Set((state.chats||[]).map(x=>x.id));
  for(const id of [...knownChats.keys()]){
   if(!ids.has(id)){await storeSdk.deleteDoc(storeSdk.doc(chatsRef,id));knownChats.delete(id)}
  }
  // Delete photos no longer used by any chat. Firestore does not cascade deletes.
  const keepPhotos=new Set((state.chats||[]).flatMap(c=>(c.messages||[]).map(m=>m.photoId||m.photoData&&"photo-"+(m.time||0)+"-inline").filter(Boolean)));
  for(const id of oldPhotoIds){
   if(keepPhotos.has(id)||!/^photo-[A-Za-z0-9-]{1,120}$/.test(id))continue;
   try{
    const parts=await storeSdk.getDocs(storeSdk.collection(db,base()+"/photos/"+id+"/parts"));
    for(const p of parts.docs)await storeSdk.deleteDoc(storeSdk.doc(db,base()+"/photos/"+id+"/parts/"+p.id));
    await storeSdk.deleteDoc(photoRef(id));
    knownPhotos.delete(id);
   }catch(error){console.warn("Unable to delete unused cloud photo",error)}
  }
  if(user?.uid===uid){
   dirty=false;remember(uid,bridge.read());notice("クラウドと同期済み ✓");
  }
 }catch(e){
  dirty=true;notice(errorText(e));
  if(navigator.onLine&&user?.uid===uid)writeTimer=setTimeout(()=>{writeTimer=null;void flush()},15000);
 }finally{writing=false}
}
window.addEventListener("online",()=>{if(connected&&dirty)schedule(1000,true)});
window.addEventListener("beforeunload",()=>{if(user)remember(user.uid,bridge.read())});
try{configured=JSON.parse(localStorage.getItem(CONFIG_KEY)||"null")||window.AGENTS_FIREBASE_CONFIG||null;if(configured)configured=parseConfig(JSON.stringify(configured))}catch{configured=null}
ui();
start();
