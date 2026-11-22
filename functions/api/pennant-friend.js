// Cloudflare Pages Function: public, short-lived, unverified friendly-match snapshots.
const CAPS={N:1500,R:3000,SR:5000,SSR:6000,UR:8000,LR:9999,MR:12000};
const SKILLS=['contact','power','speed','field','arm','control','stamina','break'];
const TTL=86400000;
function json(data,status=200){return new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}})}
function validate(o){
 if(o?.v!==1||typeof o.team!=='string'||!o.team.trim()||o.team.length>24||!Array.isArray(o.bats)||o.bats.length<1||o.bats.length>9||!Array.isArray(o.pitchers)||o.pitchers.length<1||o.pitchers.length>5)throw Error('invalid');
 const player=(p,kind,i)=>{
  if(!p||!Object.hasOwn(CAPS,p.rar)||typeof p.name!=='string'||p.name.length>40||!['捕','一','二','三','遊','左','中','右','投'].includes(p.pos)||(kind==='pitch'&&p.pos!=='投'))throw Error('invalid');
  const x={id:kind+i,name:p.name,pos:p.pos,rar:p.rar,condition:3,fatigue:0};
  for(const k of SKILLS){if(!Number.isInteger(p[k])||p[k]<1||p[k]>CAPS[p.rar])throw Error('invalid');x[k]=p[k]}
  if(!Number.isInteger(p.velocity)||p.velocity<100||p.velocity>180)throw Error('invalid');x.velocity=p.velocity;return x;
 };
 return {v:1,team:o.team.trim(),bats:o.bats.map((p,i)=>player(p,'bat',i)),pitchers:o.pitchers.map((p,i)=>player(p,'pitch',i))};
}
export async function onRequest({request,env}){
 const db=env.PENNANT_DB;
 if(!db)return json({error:'データベース未接続です。'},503);
 const url=new URL(request.url),now=Date.now();
 try{
  // Idempotent initialization; no manual SQL required.
  await db.prepare('CREATE TABLE IF NOT EXISTS friend_codes (code TEXT PRIMARY KEY, snapshot TEXT NOT NULL, expires INTEGER NOT NULL)').run();
  await db.prepare('CREATE TABLE IF NOT EXISTS friend_limits (bucket TEXT PRIMARY KEY, hits INTEGER NOT NULL, expires INTEGER NOT NULL)').run();
  // Basic per-network throttling. Only a time-bucketed IP digest is stored.
  const window=Math.floor(now/300000);
  const ip=request.headers.get('CF-Connecting-IP')||'unknown';
  const hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(window+':'+ip))),b=>b.toString(16).padStart(2,'0')).join('');
  const bucket=hash+':'+request.method;
  const limit=await db.prepare('INSERT INTO friend_limits(bucket,hits,expires) VALUES(?,1,?) ON CONFLICT(bucket) DO UPDATE SET hits=hits+1 RETURNING hits').bind(bucket,now+600000).first();
  if(limit.hits>(request.method==='POST'?12:60))return json({error:'操作が多すぎます。少し時間をおいてください。'},429);
  if(request.method==='GET'){
   const code=url.searchParams.get('code')||'';
   if(!/^[0-9]{6}$/.test(code))return json({error:'6桁の数字を入力してください。'},400);
   const row=await db.prepare('SELECT snapshot FROM friend_codes WHERE code=? AND expires>?').bind(code,now).first();
   return row?json({snapshot:JSON.parse(row.snapshot)}):json({error:'コードが見つからないか、有効期限が切れています。'},404);
  }
  if(request.method!=='POST')return json({error:'許可されていない操作です。'},405);
  if(request.headers.get('Origin')!==url.origin)return json({error:'同じサイトから操作してください。'},403);
  if(!request.headers.get('Content-Type')?.includes('application/json'))return json({error:'不正なデータ形式です。'},415);
  const length=Number(request.headers.get('Content-Length')||0);
  if(length>24000)return json({error:'データが大きすぎます。'},413);
  const reader=request.body?.getReader();if(!reader)return json({error:'球団データがありません。'},400);
  let size=0,parts=[];while(true){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>24000){await reader.cancel();return json({error:'データが大きすぎます。'},413)}parts.push(value)}
  const bytes=new Uint8Array(size);let offset=0;for(const p of parts){bytes.set(p,offset);offset+=p.byteLength}
  let snapshot;try{snapshot=validate(JSON.parse(new TextDecoder().decode(bytes)))}catch(e){return json({error:'球団データが不正です。'},400)}
  await db.prepare('DELETE FROM friend_codes WHERE expires<=?').bind(now).run();
  await db.prepare('DELETE FROM friend_limits WHERE expires<=?').bind(now).run();
  for(let i=0;i<24;i++){
   const code=String(crypto.getRandomValues(new Uint32Array(1))[0]%1000000).padStart(6,'0');
   const result=await db.prepare('INSERT OR IGNORE INTO friend_codes(code,snapshot,expires) VALUES(?,?,?)').bind(code,JSON.stringify(snapshot),now+TTL).run();
   if(result.meta.changes===1)return json({code,expires:now+TTL},201);
  }
  return json({error:'コードを発行できませんでした。再試行してください。'},503);
 }catch(e){return json({error:'対戦サーバーに接続できません。'},503)}
}
