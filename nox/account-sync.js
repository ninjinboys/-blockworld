/* LUX + NOX account sync. Same Firebase project, isolated per-user/per-agent documents.
   Requires Firebase Auth Google provider and owner-only Firestore rules. */
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js";
import { getFirestore, doc, collection, getDoc, getDocs, setDoc, deleteDoc, onSnapshot, serverTimestamp } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js";

const bridge=window.AGENT_SYNC_BRIDGE;
const agent=document.documentElement.dataset.agent;
const cfg=window.AGENTS_FIREBASE_CONFIG;
const login=document.getElementById("googleLogin");
const logout=document.getElementById("googleLogout");
const status=document.getElementById("cloudStatus");
const identity=document.getElementById("cloudIdentity");
const validConfig=cfg && cfg.apiKey && cfg.projectId && cfg.authDomain && cfg.appId;
let auth=null,db=null,uid=null,ready=false,working=false,dirty=false,changedAt=0;
let syncTimer=null,session=0,unsubs=[],knownProfile="",knownChats=new Map();
let remoteProfile=null,remoteChats=new Map(),seenProfile=false,seenChats=false;
let lastCloudError=0;
const sleep=(ms)=>new Promise(resolve=>setTimeout(resolve,ms));
const clone=x=>JSON.parse(JSON.stringify(x));
const accountKey=id=>bridge.baseKey+":google:"+id;
const dirtyKey=id=>accountKey(id)+":unsynced";
const importedKey=id=>accountKey(id)+":anonymous-imported";
const root=id=>["users",id,"agents",agent];
function setStatus(message,kind="info"){
  if(status){status.textContent=message;status.dataset.state=kind;}
}
function readableError(error){
 const code=String(error?.code||"");
 if(code.includes("popup-closed"))return "ログイン画面が閉じられたよ。もう一度押してね。";
 if(code.includes("popup-blocked"))return "ポップアップがブロックされたよ。Safariの設定を確認してね。";
 if(code.includes("unauthorized-domain"))return "Firebaseの許可済みドメインに、このサイトのドメインを追加してね。";
 if(code.includes("permission-denied"))return "Firestoreのアクセス権限が未設定だよ。セキュリティルールを確認してね。";
 if(code.includes("unavailable")||code.includes("network"))return "ネットワークに接続できないみたい。端末内のデータは残っているよ。";
 return "同期に失敗したよ。Firebaseの設定と接続を確認してね。";
}
function cloudDoc(id){return doc(db,...root(id));}
function chatCollection(id){return collection(db,...root(id),"chats");}
function chatDoc(id,chatId){return doc(db,...root(id),"chats",chatId);}
function mediaDoc(id,photoId){return doc(db,...root(id),"media",photoId);}
function partDoc(id,photoId,i){return doc(db,...root(id),"media",photoId,"parts",String(i));}
function validId(id){return typeof id==="string"&&id.length>0&&id.length<160&&!id.includes("/")&&!id.includes("..");}
function profileOf(s){
 const {chats,messages,activeChat,photoArchive,...rest}=s;
 return clone(rest);
}
function chatOf(c){
 return clone({title:c.title||"新しいチャット",messages:(c.messages||[]).map(m=>{
  const {photoData,...withoutLargePhoto}=m;
  return withoutLargePhoto;
 })});
}
function hasContent(s){
 return !!((s.chats||[]).some(c=>(c.messages||[]).some(m=>m.role==="user"))||(s.memories||[]).length||(s.goals||[]).length);
}
function uniqueUnion(a,b,idFn,limit){
 const out=[],seen=new Set();
 for(const item of [...(a||[]),...(b||[])]){
  const id=idFn(item);
  if(!seen.has(id)){seen.add(id);out.push(item);}
 }
 return limit ? out.slice(0,limit):out;
}
function combine(remote,local){
 const result=clone(remote),chats=clone(remote.chats||[]);
 const original=new Map(chats.map(c=>[c.id,c]));
 for(const localChat of local.chats||[]){
  if(!(localChat.messages||[]).some(m=>m.role==="user"))continue;
  const match=original.get(localChat.id);
  if(!match){
   chats.push(clone(localChat));continue;
  }
  const both=JSON.stringify(chatOf(match))===JSON.stringify(chatOf(localChat));
  if(both)continue;
  const imported=clone(localChat);
  imported.id="import-"+Date.now()+"-"+Math.random().toString(36).slice(2,9);
  imported.title=(imported.title||"チャット")+"（この端末）";
  chats.push(imported);
 }
 result.chats=chats;
 result.memories=uniqueUnion(result.memories,local.memories,m=>[m.time,m.text,m.kind].join("|"),35);
 result.goals=uniqueUnion(result.goals,local.goals,g=>g.id||g.title,30);
 result.journal=uniqueUnion(result.journal,local.journal,j=>[j.time,j.text].join("|"),35);
 result.interests={...(local.interests||{}),...(result.interests||{})};
 result.steps=Math.max(Number(result.steps||0),Number(local.steps||0));
 return result;
}
function buildState(profile,chats,current){
 const s={...clone(profile||{}),chats:[...chats].map(([id,data])=>({id,...clone(data)}))};
 if(!s.chats.length)s.chats=[{id:"chat-"+Date.now(),title:"新しいチャット",messages:[]}];
 s.activeChat=s.chats.some(c=>c.id===current)?current:s.chats[0].id;
 s.messages=s.chats.find(c=>c.id===s.activeChat).messages;
 return s;
}
function baselineOf(s){
 knownProfile=JSON.stringify(profileOf(s));
 knownChats=new Map((s.chats||[]).map(c=>[c.id,JSON.stringify(chatOf(c))]));
}
function stopListening(){
 for(const fn of unsubs){try{fn()}catch{}}
 unsubs=[];seenProfile=false;seenChats=false;
 remoteProfile=null;remoteChats=new Map();
}
function applyCloud(){
 if(!ready||dirty||working||bridge.isBusy?.()||!seenProfile||!seenChats||!remoteProfile)return;
 const previous=bridge.read();
 const result=buildState(remoteProfile,remoteChats,previous.activeChat);
 const serialized=JSON.stringify(result.chats)+"|"+JSON.stringify(profileOf(result));
 const localSerialized=JSON.stringify(previous.chats)+"|"+JSON.stringify(profileOf(previous));
 if(serialized===localSerialized)return;
 baselineOf(result);
 bridge.apply(result);
 setStatus("同期済み","ok");
}
function listen(){
 stopListening();
 if(!uid)return;
 const me=uid;
 unsubs.push(onSnapshot(cloudDoc(me),snap=>{
  if(uid!==me||snap.metadata.hasPendingWrites)return;
  remoteProfile=snap.exists()?snap.data().value:null;
  seenProfile=true;applyCloud();
 },err=>setStatus(readableError(err),"error")));
 unsubs.push(onSnapshot(chatCollection(me),snap=>{
  if(uid!==me||snap.metadata.hasPendingWrites)return;
  remoteChats=new Map(snap.docs.map(d=>[d.id,d.data().value||{title:"チャット",messages:[]}]));
  seenChats=true;applyCloud();
 },err=>setStatus(readableError(err),"error")));
}
function schedule(){
 if(syncTimer)clearTimeout(syncTimer);
 syncTimer=setTimeout(()=>{syncTimer=null;flush()},850);
}
async function flush(){
 if(!ready||!uid||working)return;
 working=true;
 const me=uid,revision=changedAt;
 const snap=bridge.read();
 try{
  const p=profileOf(snap);
  const pString=JSON.stringify(p);
  const nextChats=new Map((snap.chats||[]).map(c=>[c.id,JSON.stringify(chatOf(c))]));
  const jobs=[];
  if(pString!==knownProfile)jobs.push(setDoc(cloudDoc(me),{value:p,updatedAt:serverTimestamp()}));
  for(const [id,value] of nextChats){
   if(!validId(id))continue;
   if(knownChats.get(id)!==value)jobs.push(setDoc(chatDoc(me,id),{value:JSON.parse(value),updatedAt:serverTimestamp()}));
  }
  for(const oldId of knownChats.keys()){
   if(!nextChats.has(oldId)&&validId(oldId))jobs.push(deleteDoc(chatDoc(me,oldId)));
  }
  if(jobs.length)await Promise.all(jobs);
  if(uid!==me)return;
  knownProfile=pString;knownChats=nextChats;
  if(changedAt===revision){dirty=false;localStorage.removeItem(dirtyKey(me));setStatus("同期済み","ok");}
  else{dirty=true;schedule();}
 }catch(e){
  if(uid===me){
   dirty=true;
   setStatus(readableError(e),"error");
   console.error("Cloud sync error",e);
  }
 }finally{working=false;}
}
async function uploadPhoto(id,data){
 if(!ready||!uid||!validId(id)||typeof data!=="string"||!/^data:image\/jpeg;base64,/.test(data))return;
 if(data.length>1900000){setStatus("写真が大きく、同期対象外だよ","warning");return;}
 const me=uid;
 const exists=await getDoc(mediaDoc(me,id));
 if(exists.exists())return;
 const chunks=data.match(/.{1,380000}/g)||[];
 if(chunks.length<1||chunks.length>6)return;
 for(let i=0;i<chunks.length;i++)await setDoc(partDoc(me,id,i),{data:chunks[i]});
 await setDoc(mediaDoc(me,id),{parts:chunks.length,kind:"image/jpeg",updatedAt:serverTimestamp()});
}
async function downloadPhoto(id){
 if(!ready||!uid||!validId(id))return null;
 const me=uid,record=await getDoc(mediaDoc(me,id));
 if(!record.exists())return null;
 const count=record.data().parts;
 if(!Number.isInteger(count)||count<1||count>6)return null;
 const chunks=await Promise.all(Array.from({length:count},(_,i)=>getDoc(partDoc(me,id,i))));
 if(chunks.some(d=>!d.exists()||typeof d.data().data!=="string"))return null;
 const data=chunks.map(d=>d.data().data).join("");
 return /^data:image\/jpeg;base64,/.test(data)?data:null;
}
async function uploadOlderPhotos(s){
 for(const c of s.chats||[]){
  for(const m of c.messages||[]){
   if(!uid)return;
   if(!m.photoId||!validId(m.photoId))continue;
   try{
    // readLocalPhoto checks IndexedDB; if absent, remote fetch is allowed.
    const data=await bridge.readLocalPhoto(m.photoId);
    if(data)await uploadPhoto(m.photoId,data);
   }catch(e){console.warn("Photo sync postponed",e);}
  }
 }
}
async function establish(nextUser){
 const token=++session;
 ready=false;dirty=false;working=false;
 if(syncTimer){clearTimeout(syncTimer);syncTimer=null;}
 stopListening();
 if(!nextUser){
  uid=null;identity.hidden=true;logout.hidden=true;login.hidden=false;
  const raw=localStorage.getItem(bridge.baseKey);
  try{bridge.apply(raw?JSON.parse(raw):bridge.empty());}
  catch{bridge.apply(bridge.empty());}
  if(validConfig)setStatus("Googleでログインすると端末間で同期","info");
  return;
 }
 uid=nextUser.uid;login.hidden=true;logout.hidden=false;
 identity.hidden=false;identity.textContent=nextUser.displayName||nextUser.email||"Googleアカウント";
 setStatus("クラウドの会話を読み込み中…","info");
 const me=uid, key=accountKey(me);
 const anonymous=bridge.read();
 const cached=localStorage.getItem(key);
 let backup;
 try{backup=cached?JSON.parse(cached):anonymous}catch{backup=anonymous}
 try{
  const [profileSnap,chatSnaps]=await Promise.all([getDoc(cloudDoc(me)),getDocs(chatCollection(me))]);
  if(session!==token||uid!==me)return;
  const cloudProfile=profileSnap.exists()?profileSnap.data().value:null;
  const cloudChats=new Map(chatSnaps.docs.map(d=>[d.id,d.data().value]));
  const exists=!!cloudProfile||cloudChats.size>0;
  let cloudState=exists?buildState(cloudProfile||profileOf(bridge.empty()),cloudChats,backup.activeChat):null;
  let result=cloudState||backup;
  let needsSave=!exists;
  const uncommitted=cached&&localStorage.getItem(dirtyKey(me))==="1";
  if(exists&&uncommitted){result=combine(cloudState,backup);needsSave=true;}
  if(exists&&!cached&&!localStorage.getItem(importedKey(me))&&hasContent(anonymous)){
   const importOk=confirm("この端末に保存した"+agent.toUpperCase()+"の会話・記憶をGoogleアカウントに追加する？\n「キャンセル」ならクラウドの内容だけを表示するよ。端末の元データは残るよ。");
   if(importOk){result=combine(result,anonymous);needsSave=true;}
   localStorage.setItem(importedKey(me),"1");
  }
  if(!result||typeof result!=="object")result=bridge.empty();
  if(!Array.isArray(result.chats)||!result.chats.length){
   result.chats=[{id:"chat-"+Date.now(),title:"新しいチャット",messages:[]}];
  }
  if(exists)baselineOf(cloudState);
  else{knownProfile='';knownChats=new Map();}
  ready=true;
  bridge.apply(result);
  if(needsSave){
   dirty=true;changedAt++;localStorage.setItem(dirtyKey(me),"1");
   await flush();
  }
  if(session!==token||uid!==me)return;
  listen();setStatus(dirty?"未同期の変更あり":"同期済み",dirty?"warning":"ok");
  uploadOlderPhotos(bridge.read()).catch(e=>console.warn("Photo background sync",e));
 }catch(e){
  if(uid===me&&session===token){
   ready=false;
   setStatus(readableError(e),"error");
   console.error("Cloud sign-in initialization error",e);
  }
 }
}
// The legacy app calls this bridge on every local state change.
window.AGENT_SYNC_BRIDGE.storageKey=()=>uid&&ready?accountKey(uid):bridge.baseKey;
window.AGENT_SYNC_BRIDGE.changed=()=>{
 if(!ready||!uid)return;
 dirty=true;changedAt++;localStorage.setItem(dirtyKey(uid),"1");
 setStatus("同期中…","info");schedule();
};
window.AGENT_SYNC_BRIDGE.savePhoto=(id,data)=>uploadPhoto(id,data).catch(e=>{
 console.warn("Photo upload failed",e);setStatus("写真の同期を再試行してね","warning");
});
window.AGENT_SYNC_BRIDGE.fetchPhoto=id=>downloadPhoto(id);
if(!validConfig){
 setStatus("Google同期の初期設定が必要","warning");
 login.addEventListener("click",()=>alert("Firebase設定がまだ登録されていないよ。FirebaseでGoogle認証とFirestoreを有効にして、WebアプリのfirebaseConfigを設定してね。"));
}else{
 try{
  const app=initializeApp(cfg,"agents-sync-"+agent);
  auth=getAuth(app);db=getFirestore(app);
  login.addEventListener("click",async()=>{
   login.disabled=true;
   try{await signInWithPopup(auth,new GoogleAuthProvider());}
   catch(e){setStatus(readableError(e),"error");console.warn("Google sign-in",e);}
   finally{login.disabled=false;}
  });
  logout.addEventListener("click",async()=>{
   logout.disabled=true;
   try{
    if(dirty)await flush();
    if(dirty&&!confirm("まだ同期できていない変更があるよ。ログアウトしても、この端末には残るけれど、ほかの端末には反映されない場合があるよ。続ける？"))return;
    await signOut(auth);
   }catch(e){setStatus(readableError(e),"error");}
   finally{logout.disabled=false;}
  });
  onAuthStateChanged(auth,establish,e=>setStatus(readableError(e),"error"));
 }catch(e){setStatus("Firebase設定を確認してね","error");console.error(e);}
}
