import {encryptAccountBundle,decryptAccountBundle} from './account-transfer.js?v=20261014transfer01';

// Main game is hosted on GitHub Pages (static, no account database).
// This helper supports password-encrypted first-time account migration.
// It deliberately does not promise automatic cloud synchronization.
const $=id=>document.getElementById(id);
const REGISTRY='blockworld_accounts_v1',SESSION='blockworld_session_v1';
const SAVE='blockworld_save_v3:',LEGACY='blockworld_save_v2:';
const HOST='blockworld_multi_host_v1:',MEMBER='blockworld_multi_member_v1:';
const HANDOFF='blockworld_multi_handoff_v1:',FRIEND_ID='blockworld_friend_id_v1:';
const FRIENDS='blockworld_friends_v1:',MAX_TRANSFER=35*1024*1024;
const norm=name=>name.normalize('NFKC').trim().toLocaleLowerCase('ja-JP');
let transferMode=null,pendingFile=null;

function readRegistry(){
  const reg=JSON.parse(localStorage.getItem(REGISTRY)||'{"version":1,"accounts":{}}');
  if(!reg||typeof reg!=='object'||!reg.accounts||typeof reg.accounts!=='object')
    throw Error('アカウント情報を読み取れません');
  return reg;
}
function activeAccount(){
  let session=null;
  try{session=JSON.parse(localStorage.getItem(SESSION)||'null')}catch{}
  const account=session?.key && readRegistry().accounts[session.key];
  if(!account)throw Error('先に元の端末でログインしてください');
  return {key:session.key,account};
}
function isOwned(k,key){
  const e=encodeURIComponent(key);
  return (
    [SAVE+e+':', HOST+key+':', HANDOFF+key+':', MEMBER+key+':',
     MEMBER+'single:'+key+':'].some(p=>k.startsWith(p)) ||
    k===LEGACY+e || k===FRIEND_ID+key || k===FRIENDS+key
  );
}
function localDataFor(key){
  const entries=Object.create(null);
  for(let i=0;i<localStorage.length;i++){
    const k=localStorage.key(i);
    if(k && isOwned(k,key))entries[k]=localStorage.getItem(k);
  }
  return entries;
}
function toBytes(t){
  const raw=atob(t), out=new Uint8Array(raw.length);
  for(let i=0;i<raw.length;i++)out[i]=raw.charCodeAt(i);
  return out;
}
function b64(bytes){
  let raw='';
  for(const b of bytes)raw+=String.fromCharCode(b);
  return btoa(raw);
}
async function hashPassword(password,salt){
  const material=await crypto.subtle.importKey('raw',new TextEncoder().encode(password),
    'PBKDF2',false,['deriveBits']);
  const bits=await crypto.subtle.deriveBits({
    name:'PBKDF2',hash:'SHA-256',salt:toBytes(salt),iterations:120000
  },material,256);
  return b64(new Uint8Array(bits));
}
function safeEqual(a,b){
  if(typeof a!=='string'||typeof b!=='string'||a.length!==b.length)return false;
  let result=0;
  for(let i=0;i<a.length;i++)result|=a.charCodeAt(i)^b.charCodeAt(i);
  return result===0;
}
async function checkPassword(account,password){
  if(!account||typeof account.salt!=='string'||typeof account.hash!=='string')
    throw Error('アカウントのパスワード情報が不正です');
  return safeEqual(await hashPassword(password,account.salt),account.hash);
}
function message(value,isError=false){
  const el=$('transferStatus');
  el.textContent=value;
  el.style.color=isError?'#ffaaa0':'#f5d091';
}
function openDialog(mode,file=null){
  transferMode=mode;pendingFile=file;
  $('accountTransferCover').hidden=false;
  $('transferPassword').value='';
  $('transferTitle').textContent=mode==='export'
    ?'別の端末にアカウントを引き継ぐ'
    :'引き継ぎファイルからログイン';
  $('transferHelp').textContent=mode==='export'
    ?'いまのアカウントとワールドを暗号化ファイルに保存します。\n保存したファイルをAirDrop・ファイル共有などで別の端末に渡してください。'
    :'選んだファイル：'+file.name+'\n元のアカウントと同じパスワードを入力してください。';
  $('transferGo').textContent=mode==='export'
    ?'暗号化ファイルを保存':'この端末へアカウントを引き継ぐ';
  $('transferGo').disabled=false;
  message('自動同期ではなく、ファイルを使った引き継ぎです。');
  $('transferPassword').focus();
}
function closeDialog(){
  if($('transferGo').disabled)return;
  $('accountTransferCover').hidden=true;
  $('transferPassword').value='';
  $('accountImportFile').value='';
  pendingFile=null;transferMode=null;
}
function downloadBackup(fileText,name){
  const safeName=(name||'player').replace(/[^a-zA-Z0-9ぁ-んァ-ヶ一-龠_-]/g,'_').slice(0,25);
  const date=new Date().toISOString().slice(0,10);
  const blob=new Blob([fileText],{type:'application/json'});
  const url=URL.createObjectURL(blob);
  const a=document.createElement('a');
  a.href=url;a.download='NEXACRAFT_'+safeName+'_'+date+'.nexa';
  a.style.display='none';
  document.body.appendChild(a);a.click();a.remove();
  setTimeout(()=>URL.revokeObjectURL(url),15000);
}
async function exportBundle(password){
  const {key,account}=activeAccount();
  if(!(await checkPassword(account,password)))
    throw Error('元のアカウントのパスワードが違います');
  const payload={
    version:1,accountKey:key,account,entries:localDataFor(key),
    exportedAt:Date.now()
  };
  const encrypted=await encryptAccountBundle(payload,password);
  downloadBackup(encrypted,account.name);
  return Object.keys(payload.entries).length;
}
function parseBundlePayload(payload){
  const key=payload.accountKey,account=payload.account;
  if(typeof key!=='string'||key.length>60||key!==norm(account.name||'')||
     !account.name||typeof account.salt!=='string'||typeof account.hash!=='string'||
     account.salt.length>128||account.hash.length>128)
    throw Error('引き継ぎファイルのアカウント情報が不正です');
  if(!payload.entries || Object.getPrototypeOf(payload.entries)!==Object.prototype)
    throw Error('引き継ぎファイルの保存情報が不正です');
  const writes=Object.create(null);
  let total=0,n=0;
  for(const [k,v] of Object.entries(payload.entries)){
    if(!isOwned(k,key)||typeof v!=='string')throw Error('想定外の保存データを検出しました');
    total+=k.length+v.length;n++;
    if(total>MAX_TRANSFER||n>1500)throw Error('保存データが大きすぎます');
    writes[k]=v;
  }
  return {key,account,writes,n};
}
async function importBundle(file,password){
  if(file.size>MAX_TRANSFER*1.6)throw Error('ファイルが大きすぎます');
  const contents=await file.text();
  const raw=await decryptAccountBundle(contents,password);
  const {key,account,writes,n}=parseBundlePayload(raw);
  if(!(await checkPassword(account,password)))
    throw Error('引き継ぎデータとアカウントのパスワードが一致しません');
  const registry=readRegistry();
  const existing=registry.accounts[key];
  if(existing && !(await checkPassword(existing,password)))
    throw Error('この端末に同じ名前の別アカウントがあります。上書きできません');
  const collisions=Object.keys(writes).filter(k=>localStorage.getItem(k)!==null);
  if(collisions.length && !confirm('既存のアカウント保存データが'+collisions.length+
    '件あります。引き継ぎ元のデータで上書きしますか？'))return {cancelled:true};
  // Roll back on quota or storage errors, preserving unrelated accounts.
  const accountStore={...registry,accounts:{...registry.accounts,[key]:account}};
  const changes=Object.assign(Object.create(null),writes,{
    [REGISTRY]:JSON.stringify(accountStore),
    [SESSION]:JSON.stringify({key,rememberedAt:Date.now()})
  });
  const backup=Object.create(null);
  const keys=Object.keys(changes);
  for(const k of keys)backup[k]=localStorage.getItem(k);
  try{
    for(const k of keys)localStorage.setItem(k,changes[k]);
  }catch(error){
    for(const k of keys){
      try{
        if(backup[k]===null)localStorage.removeItem(k);
        else localStorage.setItem(k,backup[k]);
      }catch{}
    }
    throw Error('保存領域が足りないため、引き継ぎできませんでした');
  }
  return {account:account.name,n};
}
$('exportAccount')?.addEventListener('click',()=>openDialog('export'));
$('importAccount')?.addEventListener('click',()=>{$('accountImportFile').click()});
$('accountImportFile')?.addEventListener('change',event=>{
  const file=event.target.files?.[0];
  if(!file)return;
  if(file.size>MAX_TRANSFER*1.6){
    alert('引き継ぎファイルが大きすぎます');event.target.value='';return;
  }
  openDialog('import',file);
});
$('transferCancel')?.addEventListener('click',closeDialog);
$('accountTransferCover')?.addEventListener('click',event=>{
  if(event.target===$('accountTransferCover'))closeDialog();
});
$('transferPassword')?.addEventListener('keydown',event=>{
  if(event.key==='Enter'){event.preventDefault();$('transferGo').click()}
});
$('transferGo')?.addEventListener('click',async()=>{
  const button=$('transferGo'),password=$('transferPassword').value;
  if(password.length<6){message('アカウントのパスワードを入力してください',true);return}
  button.disabled=true;message('処理しています…');
  try{
    if(transferMode==='export'){
      const n=await exportBundle(password);
      message('暗号化した引き継ぎファイルを保存しました（保存データ'+n+'件）。\n別の端末でログイン画面の「引き継ぐ」を押してください。');
    }else if(transferMode==='import'){
      if(!pendingFile)throw Error('引き継ぎファイルを選んでください');
      const result=await importBundle(pendingFile,password);
      if(result.cancelled){message('引き継ぎをキャンセルしました');return}
      message(result.account+' のデータ（'+result.n+'件）を引き継ぎました。画面を更新します。');
      $('transferPassword').value='';
      setTimeout(()=>location.reload(),850);
      return;
    }
  }catch(error){
    console.warn('NEXACRAFT account transfer error',error);
    message(error?.message||'アカウントの引き継ぎに失敗しました',true);
  }finally{button.disabled=false}
});
