"use strict";
const bridge=window.companionSyncBridge,app=bridge.appId;
const api=(location.pathname.startsWith("/nox/")?"/nox/api":"/api")+"/account";
const ownerKey="d1-owner-"+app,backupKey=name=>"d1-backup-"+app+"-"+name;
let account=null,revision=0,busy=false,dirty=false,timer=null,mode="login",checking=false;
const $=id=>document.getElementById(id);
const style=document.createElement("style");
style.textContent=".d1panel{padding:10px;margin:8px 0;border:1px solid #8791ae77;border-radius:12px;color:inherit}.d1panel [hidden]{display:none!important}.d1panel label{display:block;font-size:12px}.d1panel input{box-sizing:border-box;width:100%;font-size:16px;padding:9px;margin:4px 0 8px;border-radius:8px;border:1px solid #aab9c7;background:white;color:#223}.d1panel button{cursor:pointer;border-radius:8px;padding:8px;border:1px solid #9aa6bc;background:white;color:#223;font-size:12px}.d1tabs{display:flex;gap:6px;margin-bottom:8px}.d1tabs button{flex:1}.d1tabs button.active{background:#405e90;color:white}.d1status{font-size:11px;line-height:1.5;margin-top:8px;overflow-wrap:anywhere}";
document.head.append(style);
const panel=document.createElement("section");panel.className="d1panel";
panel.innerHTML='<form id="d1Form"><div class="d1tabs"><button type="button" id="d1LoginTab" class="active">ログイン</button><button type="button" id="d1CreateTab">新規アカウント作成</button></div><label>名前<input id="d1Name" autocomplete="username" minlength="3" maxlength="20" required></label><label>パスワード<input id="d1Pass" type="password" autocomplete="current-password" minlength="10" maxlength="128" required></label><button type="submit" id="d1Submit">ログイン</button></form><div id="d1Identity" hidden></div><div id="d1Status" class="d1status">端末に保存中</div><button type="button" id="d1Sync" hidden>今すぐ同期</button> <button type="button" id="d1Logout" hidden>ログアウト</button>';
document.querySelector(".sidebarBottom")?.prepend(panel);
const status=msg=>$("d1Status").textContent=msg;
function ui(){const yes=!!account;$("d1Form").hidden=yes;$("d1Identity").hidden=!yes;$("d1Sync").hidden=!yes;$("d1Logout").hidden=!yes;if(yes)$("d1Identity").textContent="☁ "+account}
async function post(action,params={}){
 const res=await fetch(api,{method:"POST",credentials:"same-origin",headers:{"content-type":"application/json"},body:JSON.stringify({action,...params})});
 const data=await res.json().catch(()=>({error:"サーバーからの応答が不正です"}));
 if(!res.ok){const e=new Error(data.error||"通信エラー");e.conflict=!!data.conflict;throw e}return data;
}
async function get(){const r=await fetch(api,{credentials:"same-origin",cache:"no-store"});const j=await r.json();if(!r.ok)throw Error(j.error||"通信エラー");return j}
function backup(name,state){try{localStorage.setItem(backupKey(name),JSON.stringify(state))}catch{}}
function meaningful(s){return(s.chats||[]).some(c=>(c.messages||[]).some(m=>m.role==="user"))||(s.chats||[]).length>1}
function merge(a,b){
 if(!b)return a;
 const result={...b},chats=new Map((b.chats||[]).map(c=>[c.id,c]));
 for(const c of a.chats||[]){
  const old=chats.get(c.id);
  if(!old){chats.set(c.id,c);continue}
  const messages=new Map();
  for(const m of [...(old.messages||[]),...(c.messages||[])])messages.set([m.role,m.time,m.text,m.photoId||""].join("|"),m);
  chats.set(c.id,{...old,...c,messages:[...messages.values()].sort((x,y)=>(x.time||0)-(y.time||0)).slice(-100)});
 }
 result.chats=[...chats.values()];
 const uniq=(xs,k,n)=>[...new Map(xs.map(x=>[k(x),x])).values()].slice(-n);
 result.memories=uniq([...(b.memories||[]),...(a.memories||[])],x=>x.time+"|"+x.text,35);
 result.journal=uniq([...(b.journal||[]),...(a.journal||[])],x=>x.time+"|"+x.text,35);
 result.goals=uniq([...(b.goals||[]),...(a.goals||[])],x=>x.id,30);
 result.interests={...(b.interests||{})};
 for(const [k,v] of Object.entries(a.interests||{}))result.interests[k]=Math.max(v||0,result.interests[k]||0);
 result.steps=Math.max(a.steps||0,b.steps||0);
 result.activeChat=result.chats.some(c=>c.id===a.activeChat)?a.activeChat:result.chats[0]?.id;
 result.messages=result.chats.find(c=>c.id===result.activeChat)?.messages||[];
 return result;
}
async function connect(remote){
 const name=remote.username,owner=localStorage.getItem(ownerKey);
 let local=bridge.read();
 if(owner&&owner!==name){backup(owner,local);if(!bridge.fresh())throw Error("会話が終わってから切り替えてね");local=bridge.read()}
 if(!remote.state&&owner===name&&!meaningful(local))try{const saved=JSON.parse(localStorage.getItem(backupKey(name))||"null");if(saved&&meaningful(saved))local=saved}catch{}
 const combined=remote.state?(!owner&&meaningful(local)?merge(local,remote.state):remote.state):local;
 if(!bridge.apply(combined))throw Error("会話が終わってからログインしてね");
 account=name;revision=remote.revision||0;localStorage.setItem(ownerKey,name);backup(name,combined);ui();bridge.refreshCloudPhotos?.();
 if(!remote.state||JSON.stringify(combined)!==JSON.stringify(remote.state)){dirty=true;await save()}
 status("クラウドと同期済み ✓");
}
async function save(){
 if(!account||busy||bridge.isBusy())return;
 busy=true;
 try{
  const state=bridge.read();
  for(const id of new Set((state.chats||[]).flatMap(c=>(c.messages||[]).map(m=>m.photoId).filter(Boolean)))){
   const data=await bridge.getPhoto(id).catch(()=>null);
   if(data&&data.length<800000)await post("photo-save",{id,data});
  }
  const result=await post("save",{state,revision});revision=result.revision;dirty=false;backup(account,state);status("クラウドと同期済み ✓");
 }catch(e){
  dirty=true;status("同期エラー: "+e.message);
  if(e.conflict)try{const remote=await get();if(remote.authenticated&&remote.username===account){revision=remote.revision;bridge.apply(merge(bridge.read(),remote.state));status("別端末の記憶を統合中…")}}catch{}
 }finally{busy=false}
}
bridge.onChange(()=>{if(!account)return;dirty=true;if(timer)clearTimeout(timer);timer=setTimeout(()=>{timer=null;void save()},1700)});
window.companionCloud={get active(){return!!account},async loadPhoto(id){if(!account)return null;try{return(await post("photo-get",{id})).data}catch{return null}}};
function tab(m){mode=m;$("d1LoginTab").classList.toggle("active",m==="login");$("d1CreateTab").classList.toggle("active",m==="register");$("d1Submit").textContent=m==="login"?"ログイン":"アカウント作成";$("d1Pass").autocomplete=m==="login"?"current-password":"new-password"}
$("d1LoginTab").onclick=()=>tab("login");$("d1CreateTab").onclick=()=>tab("register");
$("d1Form").onsubmit=async e=>{
 e.preventDefault();const username=$("d1Name").value.trim().toLowerCase(),password=$("d1Pass").value;
 if(!/^[a-z0-9_]{3,20}$/.test(username)){status("名前は半角英数字・_ の3〜20文字にしてね");return}
 if(password.length<10){status("パスワードは10文字以上にしてね");return}
 $("d1Submit").disabled=true;
 try{status("認証中…");await post(mode,{username,password});$("d1Pass").value="";await connect(await get())}
 catch(err){status(err.message)}finally{$("d1Submit").disabled=false}
};
$("d1Sync").onclick=async()=>{await save();if(dirty)await save()};
$("d1Logout").onclick=async()=>{
 if(!account||!confirm("ログアウトする？"))return;
 await save();try{await post("logout");backup(account,bridge.read());account=null;revision=0;bridge.fresh();ui();status("ログアウトしました")}catch(e){status(e.message)}
};
async function check(){
 if(checking||busy)return;checking=true;
 try{
  const remote=await get();
  if(remote.authenticated){
   if(!account)await connect(remote);
   else if(!dirty&&remote.revision!==revision&&!bridge.isBusy()){
    revision=remote.revision;
    if(remote.state)bridge.apply(merge(bridge.read(),remote.state));
    status("別端末の記憶を受信したよ");
   }
  }else if(account){backup(account,bridge.read());account=null;revision=0;bridge.fresh();ui()}
  else if(localStorage.getItem(ownerKey)){const owner=localStorage.getItem(ownerKey);backup(owner,bridge.read());bridge.fresh()}
 }catch(e){status("Cloudflare接続待ち: "+e.message)}
 finally{checking=false}
}
ui();void check();
setInterval(()=>{if(dirty&&!busy)void save();else void check()},12000);
window.addEventListener("online",()=>{if(dirty)void save();else void check()});
window.addEventListener("beforeunload",()=>{if(account)backup(account,bridge.read())});
