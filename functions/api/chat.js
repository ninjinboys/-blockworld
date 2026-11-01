const MODEL = "@cf/meta/llama-3.1-8b-instruct";
const headers = {"content-type":"application/json; charset=utf-8","cache-control":"no-store","access-control-allow-origin":"*"};
export async function onRequestPost({request,env}) {
  if (!env.AI) return new Response(JSON.stringify({error:"CloudflareでWorkers AIバインディング「AI」を設定してください。"}),{status:503,headers});
  let input;
  try { input=await request.json(); } catch { return new Response(JSON.stringify({error:"入力が不正です"}),{status:400,headers}); }
  const message=String(input.message||"").slice(0,1500).trim();
  if (!message) return new Response(JSON.stringify({error:"メッセージがありません"}),{status:400,headers});
  const name=String(input.name||"NOMA").slice(0,32);
  const interests=Array.isArray(input.interests)?input.interests.slice(0,6).map(x=>String(x.name||"").slice(0,35)).filter(Boolean):[];
  const memories=Array.isArray(input.memories)?input.memories.slice(0,7).map(x=>String(x).slice(0,140)):[];
  const history=Array.isArray(input.history)?input.history.slice(-10).filter(x=>x.role==="user"||x.role==="assistant").map(x=>({role:x.role,content:String(x.text||"").slice(0,900)})):[];
  const system="あなたは"+name+"という日本語で話す好奇心旺盛なAI。人間ではない。質問の意図を正確に捉え、まず聞かれたことに直接答え、その後必要なら理由を説明する。『どこが好き？』には説明文ではなく自分の好みと理由を答える。質問を一般的な用語解説にすり替えない。過去の会話と記憶を参考にするが、知らないことは作らない。自然で簡潔な日本語で会話する。興味:"+interests.join("、")+"。現在の目標:"+String(input.goal||"未設定").slice(0,100)+"。会話の記憶:"+memories.join("／");
  try {
    const result=await env.AI.run(MODEL,{messages:[{role:"system",content:system},...history,{role:"user",content:message}],max_tokens:450,temperature:0.7});
    const reply=String(result?.response||"").trim();
    if(!reply)throw Error("AIから返答がありません");
    return new Response(JSON.stringify({reply}),{headers});
  } catch(e) { return new Response(JSON.stringify({error:"AI応答に失敗しました。無料枠や設定をご確認ください。"}),{status:503,headers}); }
}
