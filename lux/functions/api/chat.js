const MODEL = "@cf/meta/llama-3.1-8b-instruct-fp8-fast";
const VISION_MODEL = "@cf/meta/llama-4-scout-17b-16e-instruct";
const headers = {"content-type":"application/json; charset=utf-8","cache-control":"no-store","access-control-allow-origin":"*"};
export async function onRequestPost({request,env}) {
  if (!env.AI) return new Response(JSON.stringify({error:"CloudflareでWorkers AIバインディング「AI」を設定してください。"}),{status:503,headers});
  let input;
  try { input=await request.json(); } catch { return new Response(JSON.stringify({error:"入力が不正です"}),{status:400,headers}); }
  const message=String(input.message||"").slice(0,1500).trim();
  const image=typeof input.image==="string"?input.image:"";
  if(image && (image.length>2000000||!/^data:image\/jpeg;base64,[a-zA-Z0-9+/=]+$/.test(image))) {
    return new Response(JSON.stringify({error:"写真の形式またはサイズが正しくありません。JPEG画像を選び直してください。"}),{status:400,headers});
  }
  if (!message&&!image) return new Response(JSON.stringify({error:"メッセージまたは写真を送ってください"}),{status:400,headers});
  const name=String(input.name||"LUX").slice(0,32);
  const interests=Array.isArray(input.interests)?input.interests.slice(0,6).map(x=>String(x.name||"").slice(0,35)).filter(Boolean):[];
  const memories=Array.isArray(input.memories)?input.memories.slice(0,7).map(x=>String(x).slice(0,140)):[];
  const history=Array.isArray(input.history)?input.history.slice(-10).filter(x=>x.role==="user"||x.role==="assistant").map(x=>({role:x.role,content:String(x.text||"").slice(0,900)})):[];
  const system="あなたは"+name+"という日本語で話す好奇心旺盛なAI。人間ではない。質問の意図を正確に捉え、まず聞かれたことに直接答え、その後必要なら理由を説明する。『どこが好き？』には説明文ではなく自分の好みと理由を答える。質問を一般的な用語解説にすり替えない。過去の会話と記憶を参考にするが、知らないことは作らない。興味は数値や順位で説明せず、興味のある話題では自然に熱が入り、具体的な疑問や自分からの質問が増える。興味が薄い話題も無視せず丁寧に答え、無理に好きな話題へ誘導しない。興味を聞かれたときは自分の言葉で好みと理由を話す。感情があると断言せず、表現は自然にする。自然で簡潔な日本語で会話する。興味:"+interests.join("、")+"。現在の目標:"+String(input.goal||"未設定").slice(0,100)+"。会話の記憶:"+memories.join("／");
  try {
    const userContent=image
      ? [{type:"text",text:message||"この写真に何が写っているか見て、気づいたことを日本語で話して。"},
         {type:"image_url",image_url:{url:image}}]
      : message;
    const result=await env.AI.run(image?VISION_MODEL:MODEL,{
      messages:[{role:"system",content:system+(image?"。写真が添付されたときは実際に画像を観察し、見えていないものを見たふりをしない。写真について質問されたら具体的に回答する。":"")},...history,{role:"user",content:userContent}],
      max_tokens:500,temperature:image?0.5:0.7
    });
    const reply=String(result?.response||"").trim();
    if(!reply)throw Error("AIから返答がありません");
    return new Response(JSON.stringify({reply}),{headers});
  } catch(e) {
    console.error("LUX AI error",String(e));
    return new Response(JSON.stringify({error:image?"写真をAIで読み取れませんでした。時間をおいて試してください。":"AI応答に失敗しました。無料枠や設定をご確認ください。"}),{status:503,headers});
  }
}
