// Cloudflare Pages Function: private username/password accounts and LUX/NOX state.
// Bind a D1 database to this Pages project as DB.
const headers={"content-type":"application/json; charset=utf-8","cache-control":"no-store","x-content-type-options":"nosniff"};
const response=(data,status=200,extra={})=>new Response(JSON.stringify(data),{status,headers:{...headers,...extra}});
const bytes=new TextEncoder();
const hex=b=>[...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,"0")).join("");
const digest=async x=>hex(await crypto.subtle.digest("SHA-256",bytes.encode(x)));
const derive=async(pass,salt)=>{
 const key=await crypto.subtle.importKey("raw",bytes.encode(pass),"PBKDF2",false,["deriveBits"]);
 return hex(await crypto.subtle.deriveBits({name:"PBKDF2",salt:bytes.encode(salt),iterations:210000,hash:"SHA-256"},key,256));
};
const random=()=>crypto.randomUUID().replace(/-/g,"")+crypto.randomUUID().replace(/-/g,"");
const compare=(a,b)=>{if(typeof a!=="string"||typeof b!=="string")return false;let diff=a.length^b.length;for(let i=0;i<Math.max(a.length,b.length);i++)diff|=(a.charCodeAt(i)||0)^(b.charCodeAt(i)||0);return diff===0};
const cookie=(token,maxAge)=>"luxnox_session="+token+"; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age="+maxAge;
async function tables(db){
 await db.batch([
  db.prepare("CREATE TABLE IF NOT EXISTS companion_users (id TEXT PRIMARY KEY, username TEXT NOT NULL UNIQUE, salt TEXT NOT NULL, password_hash TEXT NOT NULL, created_at INTEGER NOT NULL)"),
  db.prepare("CREATE TABLE IF NOT EXISTS companion_sessions (token_hash TEXT PRIMARY KEY, user_id TEXT NOT NULL, expires_at INTEGER NOT NULL)"),
  db.prepare("CREATE TABLE IF NOT EXISTS companion_state (user_id TEXT NOT NULL, companion TEXT NOT NULL, payload TEXT NOT NULL, revision INTEGER NOT NULL DEFAULT 1, updated_at INTEGER NOT NULL, PRIMARY KEY(user_id, companion))"),
  db.prepare("CREATE TABLE IF NOT EXISTS companion_photos (user_id TEXT NOT NULL, companion TEXT NOT NULL, photo_id TEXT NOT NULL, payload TEXT NOT NULL, PRIMARY KEY(user_id,companion,photo_id))")
 ]);
}
async function actor(db,request){
 const token=(request.headers.get("cookie")||"").match(/(?:^|;\s*)luxnox_session=([a-f0-9]{128})(?:;|$)/)?.[1];
 if(!token)return null;
 const hash=await digest(token);
 return db.prepare("SELECT u.id,u.username FROM companion_sessions s JOIN companion_users u ON u.id=s.user_id WHERE s.token_hash=? AND s.expires_at>?").bind(hash,Date.now()).first();
}
const maxBody=async req=>{
 const length=Number(req.headers.get("content-length")||0);
 if(length>1300000)throw Error("too_large");
 const text=await req.text();
 if(text.length>1300000)throw Error("too_large");
 return JSON.parse(text);
};
export async function onRequest({request,env}){
 if(!env.DB)return response({error:"Cloudflare D1のDBバインディングが必要です"},503);
 try{
  await tables(env.DB);
  const url=new URL(request.url);
  const companion=url.pathname.includes("/nox/")||url.hostname.startsWith("nox")?"nox":"lux";
  const now=Date.now();
  if(request.method==="GET"){
   const me=await actor(env.DB,request);
   if(!me)return response({authenticated:false});
   const row=await env.DB.prepare("SELECT payload,revision FROM companion_state WHERE user_id=? AND companion=?").bind(me.id,companion).first();
   return response({authenticated:true,username:me.username,state:row?JSON.parse(row.payload):null,revision:row?.revision||0});
  }
  if(request.method!=="POST")return response({error:"Method not allowed"},405);
  const body=await maxBody(request),action=String(body.action||"");
  if(action==="register"||action==="login"){
   const name=String(body.username||"").trim().toLowerCase(),pass=String(body.password||"");
   if(!/^[a-z0-9_]{3,20}$/.test(name)||pass.length<10||pass.length>128)return response({error:"名前は半角英数字・_ の3〜20文字、パスワードは10文字以上にしてね"},400);
   let user;
   if(action==="register"){
    const existing=await env.DB.prepare("SELECT id FROM companion_users WHERE username=?").bind(name).first();
    if(existing)return response({error:"その名前はすでに使われているよ"},409);
    const salt=random(),hash=await derive(pass,salt),id=crypto.randomUUID();
    try{await env.DB.prepare("INSERT INTO companion_users (id,username,salt,password_hash,created_at) VALUES (?,?,?,?,?)").bind(id,name,salt,hash,now).run()}
    catch{return response({error:"その名前はすでに使われているよ"},409)}
    user={id,username:name};
   }else{
    const row=await env.DB.prepare("SELECT * FROM companion_users WHERE username=?").bind(name).first();
    const salt=row?.salt||"dummy-fixed-salt-for-timing",hash=await derive(pass,salt);
    if(!row||!compare(hash,row.password_hash))return response({error:"名前かパスワードが違うよ"},401);
    user=row;
   }
   const token=random();
   await env.DB.prepare("INSERT INTO companion_sessions(token_hash,user_id,expires_at) VALUES(?,?,?)").bind(await digest(token),user.id,now+30*86400000).run();
   return response({ok:true,username:user.username},200,{"set-cookie":cookie(token,30*86400)});
  }
  const me=await actor(env.DB,request);
  if(!me)return response({error:"ログインが必要です"},401);
  if(action==="logout"){
   const token=(request.headers.get("cookie")||"").match(/luxnox_session=([a-f0-9]{128})/)?.[1];
   if(token)await env.DB.prepare("DELETE FROM companion_sessions WHERE token_hash=?").bind(await digest(token)).run();
   return response({ok:true},200,{"set-cookie":cookie("",0)});
  }
  if(action==="save"){
   const state=body.state;
   if(!state||state.version!==1||!Array.isArray(state.chats))return response({error:"記憶データが不正です"},400);
   const json=JSON.stringify(state);
   if(json.length>850000)return response({error:"記憶が大きすぎるため保存できません"},413);
   const revision=Number(body.revision||0);
   const current=await env.DB.prepare("SELECT revision FROM companion_state WHERE user_id=? AND companion=?").bind(me.id,companion).first();
   if(current&&current.revision!==revision)return response({error:"別端末で更新されました。同期し直してください",conflict:true},409);
   if(!current&&revision!==0)return response({error:"同期し直してください",conflict:true},409);
   await env.DB.prepare("INSERT INTO companion_state(user_id,companion,payload,revision,updated_at) VALUES(?,?,?,?,?) ON CONFLICT(user_id,companion) DO UPDATE SET payload=excluded.payload,revision=excluded.revision,updated_at=excluded.updated_at").bind(me.id,companion,json,revision+1,now).run();
   return response({ok:true,revision:revision+1});
  }
  if(action==="photo-save"){
   const id=String(body.id||""),data=String(body.data||"");
   if(!/^photo-[a-zA-Z0-9-]{1,120}$/.test(id)||!/^data:image\/(jpeg|png|webp);base64,[a-zA-Z0-9+/=]+$/.test(data)||data.length>850000)return response({error:"画像の形式またはサイズが不正です"},400);
   await env.DB.prepare("INSERT INTO companion_photos(user_id,companion,photo_id,payload) VALUES(?,?,?,?) ON CONFLICT(user_id,companion,photo_id) DO UPDATE SET payload=excluded.payload").bind(me.id,companion,id,data).run();
   return response({ok:true});
  }
  if(action==="photo-get"){
   const id=String(body.id||"");
   if(!/^photo-[a-zA-Z0-9-]{1,120}$/.test(id))return response({error:"Invalid image ID"},400);
   const row=await env.DB.prepare("SELECT payload FROM companion_photos WHERE user_id=? AND companion=? AND photo_id=?").bind(me.id,companion,id).first();
   return response({data:row?.payload||null});
  }
  return response({error:"Unknown action"},400);
 }catch(error){
  if(String(error.message)==="too_large")return response({error:"データが大きすぎます"},413);
  console.error("Companion account error",error);
  return response({error:"サーバー処理に失敗しました。D1の接続を確認してください"},500);
 }
}
