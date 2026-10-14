/* NEXACRAFT cloud authentication and save adapter.
 * Uses Firebase client auth (email/password internally). Users enter only a
 * username + password. Generated internal addresses are NOT deliverable
 * email, so there is no email-based account recovery.
 * All Firestore reads/writes require uid-scoped rules (firestore.rules).
 */
import {firebaseConfig} from './firebase-config.js?v=20261014firebaseRegistered01';

// Never switch every player away from local login until the Firebase
// Authentication provider AND owner-only Firestore rules are configured.
export const cloudEnabled=!!(
  firebaseConfig?.enabled === true &&
  firebaseConfig?.apiKey && firebaseConfig?.authDomain &&
  firebaseConfig?.projectId && firebaseConfig?.appId
);
let firebase=null;
async function backend(){
  if(!cloudEnabled)throw Error('クラウド接続が未設定です');
  if(firebase)return firebase;
  const v='12.4.0';
  const [app,auth,fs]=await Promise.all([
    import('https://www.gstatic.com/firebasejs/'+v+'/firebase-app.js'),
    import('https://www.gstatic.com/firebasejs/'+v+'/firebase-auth.js'),
    import('https://www.gstatic.com/firebasejs/'+v+'/firebase-firestore.js')
  ]);
  const instance=app.initializeApp(firebaseConfig);
  const a=auth.getAuth(instance);
  await auth.setPersistence(a,auth.browserLocalPersistence);
  firebase={a,db:fs.getFirestore(instance),auth,fs};
  return firebase;
}
const canonical=name=>name.normalize('NFKC').trim().toLocaleLowerCase('ja-JP');
async function loginAddress(name){
  const key=canonical(name);
  if(key.length<2||key.length>20)throw Error('名前は2～20文字で入力してください');
  const h=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(key));
  const hex=[...new Uint8Array(h)].map(x=>x.toString(16).padStart(2,'0')).join('');
  return 'user-'+hex.slice(0,48)+'@accounts.nexacraft.invalid';
}
function readableAuthError(e){
  const t=e?.code||'';
  if(t==='auth/email-already-in-use')return Error('このユーザー名はすでに登録されています。「ログイン」してください');
  if(['auth/invalid-credential','auth/wrong-password','auth/user-not-found'].includes(t))
    return Error('ユーザー名かパスワードが違います');
  if(t==='auth/weak-password')return Error('パスワードは6文字以上にしてください');
  if(t==='auth/network-request-failed'||t.includes('unavailable'))
    return Error('インターネット接続を確認してください');
  if(t==='permission-denied')return Error('クラウド保存のセキュリティ設定を確認してください');
  return Error('クラウド接続エラー: '+(e?.message||t||'不明'));
}
export async function cloudRegister(name,password){
  const {a,db,auth,fs}=await backend();
  const email=await loginAddress(name);
  try{
    const c=await auth.createUserWithEmailAndPassword(a,email,password);
    const key=canonical(name);
    await fs.setDoc(fs.doc(db,'users',c.user.uid),
      {name:name.normalize('NFKC').trim(),key,createdAt:Date.now()});
    return {uid:c.user.uid,key,name:name.normalize('NFKC').trim()};
  }catch(e){throw readableAuthError(e)}
}
export async function cloudLogin(name,password){
  const {a,db,auth,fs}=await backend();
  try{
    const c=await auth.signInWithEmailAndPassword(a,await loginAddress(name),password);
    const snap=await fs.getDoc(fs.doc(db,'users',c.user.uid));
    if(!snap.exists())throw Error('アカウント情報が見つかりません');
    const profile=snap.data();
    if(profile?.key!==canonical(name))
      throw Error('別のアカウントです');
    return {uid:c.user.uid,key:profile.key,name:profile.name};
  }catch(e){throw readableAuthError(e)}
}
export async function cloudRestore(){
  if(!cloudEnabled)return null;
  const {a,auth,db,fs}=await backend();
  await a.authStateReady();
  const user=a.currentUser;
  if(!user)return null;
  const snap=await fs.getDoc(fs.doc(db,'users',user.uid));
  if(!snap.exists())return null;
  const d=snap.data();
  if(!d?.key||!d?.name)return null;
  return {uid:user.uid,key:d.key,name:d.name};
}
export async function cloudSignOut(){
  if(!cloudEnabled)return;
  const {a,auth}=await backend();
  await auth.signOut(a);
}
function toB64(a){
  let t='';
  for(let i=0;i<a.length;i+=8192)
    t+=String.fromCharCode(...a.subarray(i,i+8192));
  return btoa(t);
}
function fromB64(t){
  const s=atob(t),a=new Uint8Array(s.length);
  for(let i=0;i<a.length;i++)a[i]=s.charCodeAt(i);
  return a;
}
async function encode(raw){
  let b=new TextEncoder().encode(JSON.stringify(raw));
  let codec='json';
  if(typeof CompressionStream!=='undefined'){
    const stream=new Blob([b]).stream().pipeThrough(new CompressionStream('gzip'));
    b=new Uint8Array(await new Response(stream).arrayBuffer());
    codec='gzip';
  }
  const enc=toB64(b);
  if(enc.length>6_400_000)throw Error('ワールドが大きすぎてクラウドへ保存できません');
  return {encoded:enc,codec};
}
async function decode(encoded,codec){
  let b=fromB64(encoded);
  if(codec==='gzip'){
    if(typeof DecompressionStream==='undefined')throw Error('この端末はgzip展開に対応していません');
    const stream=new Blob([b]).stream().pipeThrough(new DecompressionStream('gzip'));
    b=new Uint8Array(await new Response(stream).arrayBuffer());
  }
  return JSON.parse(new TextDecoder().decode(b));
}
const CHARS_PER_PART=100000;
let queue=Promise.resolve();
export function cloudQueueSave(slot,save){
  if(!cloudEnabled)return Promise.resolve();
  // Serialize writes so an older world cannot finish uploading after newer.
  const pending=queue.catch(()=>{}).then(()=>cloudSave(slot,save));
  queue=pending;
  return pending;
}
export async function cloudFlush(){
  if(!cloudEnabled)return;
  await queue;
}
export async function cloudSave(slot,save){
  if(!cloudEnabled)return;
  const {a,db,fs}=await backend();
  const uid=a.currentUser?.uid;
  if(!uid)throw Error('クラウドログインが必要です');
  if(!Number.isInteger(slot)||slot<1||slot>5)throw Error('ワールド番号が不正です');
  const {encoded,codec}=await encode(save);
  const chunks=[];
  for(let i=0;i<encoded.length;i+=CHARS_PER_PART)
    chunks.push(encoded.slice(i,i+CHARS_PER_PART));
  if(!chunks.length)throw Error('保存データが空です');
  const head=fs.doc(db,'users',uid,'worlds',String(slot));
  const old=(await fs.getDoc(head)).data();
  const version=crypto.randomUUID().replace(/-/g,'').slice(0,20);
  // Write all chunks before switching the pointer; failed uploads leave
  // the last committed snapshot untouched.
  for(let start=0;start<chunks.length;start+=40){
    const batch=fs.writeBatch(db);
    chunks.slice(start,start+40).forEach((data,i)=>{
      batch.set(fs.doc(db,'users',uid,'worlds',String(slot),'chunks',
        version+'_'+(start+i)),{data});
    });
    await batch.commit();
  }
  await fs.setDoc(head,{
    revision:version,parts:chunks.length,codec, savedAt:save.savedAt||Date.now(),
    writtenAt:Date.now(),schema:1
  });
  // Cleanup previous revision, after the new revision is committed.
  if(old?.revision && old.revision!==version && old.parts>0 && old.parts<=100){
    try{
      for(let start=0;start<old.parts;start+=40){
        const batch=fs.writeBatch(db);
        for(let i=start;i<Math.min(old.parts,start+40);i++)
          batch.delete(fs.doc(db,'users',uid,'worlds',String(slot),'chunks',old.revision+'_'+i));
        await batch.commit();
      }
    }catch(e){console.warn('Old cloud snapshot cleanup failed',e)}
  }
}
export async function cloudReadAll(){
  if(!cloudEnabled)return new Map();
  const {a,db,fs}=await backend();
  const uid=a.currentUser?.uid;
  if(!uid)throw Error('クラウドにログインしてください');
  const docs=await fs.getDocs(fs.collection(db,'users',uid,'worlds'));
  const out=new Map();
  for(const row of docs.docs){
    const slot=Number(row.id),meta=row.data();
    if(!Number.isInteger(slot)||slot<1||slot>5||
      meta?.schema!==1||!meta.revision||
      !Number.isInteger(meta.parts)||meta.parts<1||meta.parts>100)continue;
    try{
      const raws=await Promise.all(Array.from({length:meta.parts},(_,i)=>
        fs.getDoc(fs.doc(db,'users',uid,'worlds',row.id,'chunks',
          meta.revision+'_'+i))));
      if(raws.some(d=>!d.exists()||typeof d.data()?.data!=='string'))
        throw Error('クラウド保存の一部が欠けています');
      const save=await decode(raws.map(d=>d.data().data).join(''),meta.codec);
      if(save?.version && typeof save==='object')out.set(slot,save);
    }catch(e){
      console.warn('Could not restore cloud world',slot,e);
    }
  }
  return out;
}
