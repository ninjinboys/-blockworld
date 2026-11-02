// Shared LUX+NOX room, available only when the same account is active on both sites.
const json=(x,status=200)=>new Response(JSON.stringify(x),{status,headers:{"content-type":"application/json; charset=utf-8","cache-control":"no-store"}});
const sha=async s=>[...new Uint8Array(await crypto.subtle.digest("SHA-256",new TextEncoder().encode(s)))].map(b=>b.toString(16).padStart(2,"0")).join("");
const agent=request=>new URL(request.url).hostname.startsWith("nox")||new URL(request.url).pathname.startsWith("/nox/")?"nox":"lux";
async function auth(db,request){
 const token=(request.headers.get("cookie")||"").match(/(?:^|;\s*)luxnox_session=([a-f0-9]{64})(?:;|$)/)?.[1];
 if(!token)return null;
 return db.prepare("SELECT u.id,u.username FROM companion_sessions s JOIN companion_users u ON u.id=s.user_id WHERE s.token_hash=? AND s.expires_at>?").bind(await sha(token),Date.now()).first();
}
async function setup(db){
 for(const sql of [
  "CREATE TABLE IF NOT EXISTS duo_presence (user_id TEXT NOT NULL,agent TEXT NOT NULL,seen_at INTEGER NOT NULL,PRIMARY KEY(user_id,agent))",
  "CREATE TABLE IF NOT EXISTS duo_messages (id TEXT PRIMARY KEY,user_id TEXT NOT NULL,speaker TEXT NOT NULL,body TEXT NOT NULL,created_at INTEGER NOT NULL)",
  "CREATE INDEX IF NOT EXISTS duo_messages_by_user ON duo_messages(user_id,created_at)"
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
 if(!env.DB)return json({error:"D1のDBバインディングがありません"},503);
 try{
  const user=await auth(env.DB,request);
  if(!user)return json({error:"ログインしてください",loggedIn:false},401);
  await setup(env.DB);
  const who=agent(request),now=Date.now();
  // Heartbeats are sent only while the account is signed in on this site.
  await env.DB.prepare("INSERT INTO duo_presence(user_id,agent,seen_at) VALUES(?,?,?) ON CONFLICT(user_id,agent) DO UPDATE SET seen_at=excluded.seen_at").bind(user.id,who,now).run();
  const other=await env.DB.prepare("SELECT seen_at FROM duo_presence WHERE user_id=? AND agent=?").bind(user.id,who==="lux"?"nox":"lux").first();
  const paired=!!other&&now-other.seen_at<180000;
  if(request.method==="GET")return json({paired,username:user.username,messages:paired?await history(env.DB,user.id):[]});
  if(request.method!=="POST")return json({error:"Method not allowed"},405);
  const body=await request.json();
  if(body.action==="leave"){
   await env.DB.prepare("DELETE FROM duo_presence WHERE user_id=? AND agent=?").bind(user.id,who).run();
   return json({ok:true});
  }
  if(!paired)return json({error:"LUXとNOXの両方で、同じアカウントにログインしてページを開いてね"},403);
  if(body.action!=="say")return json({error:"Invalid action"},400);
  const text=String(body.text||"").trim().slice(0,800);
  if(!text)return json({error:"メッセージを入力してね"},400);
  if(!env.AI)return json({error:"Workers AIのAIバインディングが必要です"},503);
  const recent=await history(env.DB,user.id);
  const previous=recent.at(-1);
  if(previous&&previous.speaker==="user"&&now-previous.created_at<1500)return json({error:"少し待ってから送信してね"},429);
  const add=async(speaker,message)=>env.DB.prepare("INSERT INTO duo_messages(id,user_id,speaker,body,created_at) VALUES(?,?,?,?,?)").bind(crypto.randomUUID(),user.id,speaker,message,Date.now()).run();
  await add("user",text);
  const transcript=[...recent,{speaker:"user",body:text}];
  const first=who,second=who==="lux"?"nox":"lux";
  try{
   const reply1=await ai(env,first,transcript);await add(first,reply1);transcript.push({speaker:first,body:reply1});
   const reply2=await ai(env,second,transcript);await add(second,reply2);
  }catch(e){console.error("Duo AI failed",e);return json({error:"AIの返答が途中で止まりました。履歴を更新して確認してね",messages:await history(env.DB,user.id)},503)}
  return json({paired:true,messages:await history(env.DB,user.id)});
 }catch(e){console.error("Duo error",e);return json({error:"共同会話の処理に失敗しました"},500)}
}
