/* NEXACRAFT secure cross-device account-transfer format (v1).
 * Static GitHub Pages has no shared account server. Transfer files are
 * encrypted with PBKDF2/AES-GCM; no plaintext credential or save data leaves
 * the device except inside the encrypted file.
 */
const FORMAT = 'nexacraft-encrypted-account-v1';
const ITERATIONS = 260000;
const MAX_BYTES = 35 * 1024 * 1024;
const utf8 = new TextEncoder();
const decoder = new TextDecoder('utf-8', {fatal:true});

function b64(bytes) {
  let raw = '';
  for (let i=0; i<bytes.length; i+=8192) {
    raw += String.fromCharCode(...bytes.subarray(i,i+8192));
  }
  return btoa(raw);
}
function bytes(t) {
  if(typeof t!=='string' || t.length>MAX_BYTES*1.6 || !/^[A-Za-z0-9+/]*={0,2}$/.test(t))
    throw new Error('引き継ぎファイルの形式が不正です');
  const raw=atob(t), out=new Uint8Array(raw.length);
  for(let i=0;i<raw.length;i++)out[i]=raw.charCodeAt(i);
  return out;
}
async function keyFromPassword(password,salt) {
  if(typeof password!=='string'||password.length<6||password.length>64)
    throw new Error('アカウントのパスワード（6～64文字）を入力してください');
  const material=await crypto.subtle.importKey('raw',utf8.encode(password),
    'PBKDF2',false,['deriveKey']);
  return crypto.subtle.deriveKey(
    {name:'PBKDF2',salt,hash:'SHA-256',iterations:ITERATIONS},
    material,{name:'AES-GCM',length:256},false,['encrypt','decrypt']);
}
/**
 * Encrypt a complete, single-account bundle. Only the display name, date,
 * encryption salt and IV appear outside the AES-GCM authenticated ciphertext.
 */
export async function encryptAccountBundle(payload,password) {
  if(!crypto?.subtle)throw new Error('このブラウザでは暗号化に対応していません');
  const data=utf8.encode(JSON.stringify(payload));
  if(data.byteLength>MAX_BYTES)throw new Error('データが大きすぎます（上限35MB）');
  const salt=crypto.getRandomValues(new Uint8Array(16));
  const iv=crypto.getRandomValues(new Uint8Array(12));
  const key=await keyFromPassword(password,salt);
  const ciphertext=new Uint8Array(await crypto.subtle.encrypt({name:'AES-GCM',iv},key,data));
  return JSON.stringify({
    format:FORMAT,
    version:1,
    accountName:payload.account?.name || '',
    date:new Date().toISOString(),
    kdf:'PBKDF2-SHA256',
    rounds:ITERATIONS,
    salt:b64(salt),iv:b64(iv),data:b64(ciphertext)
  });
}
export async function decryptAccountBundle(fileText,password) {
  if(typeof fileText!=='string'||fileText.length>MAX_BYTES*1.6)
    throw new Error('引き継ぎファイルが大きすぎます');
  let file;
  try{file=JSON.parse(fileText)}catch{throw new Error('引き継ぎファイルを読み取れません')}
  if(file?.format!==FORMAT||file?.version!==1||file.rounds!==ITERATIONS||
     file.kdf!=='PBKDF2-SHA256')
    throw new Error('NEXACRAFTの暗号化引き継ぎファイルではありません');
  const salt=bytes(file.salt),iv=bytes(file.iv),data=bytes(file.data);
  if(salt.length!==16||iv.length!==12||data.length<16||data.length>MAX_BYTES+16)
    throw new Error('引き継ぎファイルが破損しています');
  const key=await keyFromPassword(password,salt);
  let plaintext;
  try {plaintext=await crypto.subtle.decrypt({name:'AES-GCM',iv},key,data)}
  catch {throw new Error('パスワードが違うか、ファイルが破損しています')}
  let result;
  try{result=JSON.parse(decoder.decode(plaintext))}
  catch{throw new Error('復号後のデータが破損しています')}
  if(!result||result.version!==1||typeof result.accountKey!=='string'||
     !result.account||typeof result.entries!=='object'||!result.entries)
    throw new Error('アカウント情報の形式が不正です');
  return result;
}
