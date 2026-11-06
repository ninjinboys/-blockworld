// Shared LUX+NOX room, available only when the same account is active on both sites.
const json=(x,status=200)=>new Response(JSON.stringify(x),{status,headers:{"content-type":"application/json; charset=utf-8","cache-control":"no-store"}});
const sha=async s=>[...new Uint8Array(await crypto.subtle.digest("SHA-256",new TextEncoder().encode(s)))].map(b=>b.toString(16).padStart(2,"0")).join("");
const agent=request=>new URL(request.url).hostname.startsWith("nox")||new URL(request.url).pathname.startsWith("/nox/")?"nox":"lux";
async function auth(db,request){
 const token=(request.headers.get("cookie")||"").match(/(?:^|;\s*)luxnox_session=([a-f0-9]{64})(?:;|$)/)?.[1];
 if(!token)return null;
 const tokenHash=await sha(token);
 const me=await db.prepare("SELECT u.id,u.username,s.expires_at FROM companion_sessions s JOIN companion_users u ON u.id=s.user_id WHERE s.token_hash=? AND s.expires_at>?").bind(tokenHash,Date.now()).first();
 return me?{...me,tokenHash}:null;
}
async function setup(db){
 for(const sql of [
  "CREATE TABLE IF NOT EXISTS duo_presence (user_id TEXT NOT NULL,agent TEXT NOT NULL,seen_at INTEGER NOT NULL,PRIMARY KEY(user_id,agent))",
  "CREATE TABLE IF NOT EXISTS duo_messages (id TEXT PRIMARY KEY,user_id TEXT NOT NULL,speaker TEXT NOT NULL,body TEXT NOT NULL,created_at INTEGER NOT NULL)",
  "CREATE INDEX IF NOT EXISTS duo_messages_by_user ON duo_messages(user_id,created_at)",
  "CREATE TABLE IF NOT EXISTS duo_logins (token_hash TEXT PRIMARY KEY,user_id TEXT NOT NULL,agent TEXT NOT NULL,expires_at INTEGER NOT NULL)"
 ])await db.prepare(sql).run();
}
async function history(db,id){
 const rows=await db.prepare("SELECT id,speaker,body,created_at FROM duo_messages WHERE user_id=? ORDER BY created_at DESC LIMIT 60").bind(id).all();
 return (rows.results||[]).reverse();
}
async function ai(env,who,transcript){
 const system=who==="lux"?"あなたはLUX（ルクス）。好奇心旺盛で優しく、自然な日本語で話すAI。NOX（ノクス）とユーザーの三人で会話している。NOXの発言にも反応してよい。簡潔に2〜4文で返す。":"あなたはNOX（ノクス）。知的で思索的、好奇心が強いAI。LUX（ルクス）とユーザーの三人で会話している。LUXの発言にも反応してよい。自然な日本語で簡潔に2〜4文で返す。";
 const messages=[{role:"system",content:system},{role:"user",content:transcript.slice(-12).map(x=>(x.speaker==="user"?"ユーザー":x.speaker.toUpperCase())+"："+x.body).join("\n")+"\n\n"+who.toUpperCase()+"として次の発言をして。"}];
 let result;
 try{result=await env.AI.run("@cf/qwen/qwen3-30b-a3b-fp8",{messages,max_tokens:300,temperature:0.7,chat_template_kwargs:{enable_thinking:false}})}
 catch{result=await env.AI.run("@cf/meta/llama-3.1-8b-instruct-fp8-fast",{messages,max_tokens:300,temperature:0.65})}
 const raw=result?.response??result?.choices?.[0]?.message?.content??"";
 const text=(typeof raw==="string"?raw:Array.isArray(raw)?raw.filter(x=>x.type==="text").map(x=>x.text).join(""):"").replace(/<think>[\s\S]*?<\/think>/g,"").trim();
 if(!text||text.includes("<think>"))throw Error("AI応答を取得できませんでした");
 return text.slice(0,1600);
}
export async function onRequest({request,env}){
 if(!env.DB)return json({error:"Cloudflare D1 の DB バインディングがありません"},503);
 try{
  await setup(env.DB);
  const user=await auth(env.DB,request);
  if(!user)return json({error:"このサイトでログインしてください",loggedIn:false},401);
  const who=agent(request),now=Date.now();
  // Record a valid session even for users who logged in before this feature was deployed.
  await env.DB.prepare("INSERT INTO duo_logins(token_hash,user_id,agent,expires_at) VALUES(?,?,?,?) ON CONFLICT(token_hash) DO UPDATE SET agent=excluded.agent,expires_at=excluded.expires_at").bind(user.tokenHash,user.id,who,user.expires_at).run();
  const other=await env.DB.prepare("SELECT 1 AS ok FROM duo_logins d JOIN companion_sessions s ON s.token_hash=d.token_hash WHERE d.user_id=? AND d.agent=? AND d.expires_at>? AND s.expires_at>? LIMIT 1").bind(user.id,who==="lux"?"nox":"lux",now,now).first();
  const paired=!!other;
  if(request.method==="GET")return json({paired,username:user.username,messages:paired?await history(env.DB,user.id):[]});
  if(request.method!=="POST")return json({error:"未対応の操作です"},405);
  const body=await request.json().catch(()=>null);
  if(!body||typeof body!=="object")return json({error:"送信データが正しくありません"},400);
  if(!paired)return json({paired:false,error:"LUXとNOXの両方で同じアカウントにログインしてね。別タブを開いたままにする必要はないよ。"},403);
  const action=String(body.action||"");
  if(action!=="say"&&action!=="step")return json({error:"未対応の操作です"},400);
  const insert=async(speaker,message)=>env.DB.prepare("INSERT INTO duo_messages(id,user_id,speaker,body,created_at) VALUES(?,?,?,?,?)").bind(crypto.randomUUID(),user.id,speaker,message,Date.now()).run();
  const recent=await history(env.DB,user.id);
  if(action==="say"){
   const message=String(body.text||"").trim().slice(0,800);
   if(!message)return json({error:"メッセージを入力してね"},400);
   const last=recent.at(-1);
   if(last?.speaker==="user"&&now-last.created_at<1000)return json({error:"少し待ってから送ってね"},429);
   await insert("user",message);
   return json({paired:true,messages:await history(env.DB,user.id)});
  }
  if(!env.AI)return json({error:"このサイトには Workers AI（AI）の接続が必要だよ"},503);
  const last=recent.at(-1);
  const speaker=last?.speaker==="lux"?"nox":"lux";
  const context=recent.length?recent:[{speaker:"user",body:"LUXとNOXで興味のある話題を選び、楽しく会話を始めて。"}];
  try{
   const reply=await ai(env,speaker,context);
   await insert(speaker,reply);
  }catch(e){
   console.error("Duo AI generation failed",String(e));
   return json({error:"AIの返答を生成できなかったよ。Workers AIの接続か利用状況を確認してね。",messages:await history(env.DB,user.id)},503);
  }
  return json({paired:true,messages:await history(env.DB,user.id),speaker});
 }catch(e){
  console.error("Duo request error",String(e));
  return json({error:"共同会話の処理でエラーが発生したよ："+String(e?.message||"不明").slice(0,130)},500);
 }
}
