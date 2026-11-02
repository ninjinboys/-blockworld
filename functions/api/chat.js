// LUX conversational API — Japanese-first responses with a lightweight fallback.
const PRIMARY_MODEL = "@cf/qwen/qwen3-30b-a3b-fp8";
const FALLBACK_MODEL = "@cf/meta/llama-3.1-8b-instruct-fp8-fast";
const VISION_MODEL = "@cf/meta/llama-4-scout-17b-16e-instruct";
const headers = {
  "content-type": "application/json; charset=utf-8",
  "cache-control": "no-store",
  "access-control-allow-origin": "*"
};

function messageText(result) {
  const text = result?.response ?? result?.choices?.[0]?.message?.content ?? "";
  const raw = typeof text === "string" ? text : Array.isArray(text)
    ? text.filter(x => x?.type === "text").map(x => x.text || "").join("")
    : "";
  // Some reasoning models may emit internal markup. Do not expose it in a chat reply.
  const cleaned = raw.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();
  if (!cleaned || /<think>/i.test(cleaned)) return "";
  return cleaned.replace(/^<\/think>\s*/i, "").trim();
}

function systemInstruction({name, interests, goal, memories, image}) {
  const persona = [
    "あなたは「" + name + "」というAIの会話相手。一人称は「僕」。ユーザーとは親しみやすい日本語のタメ口で話す。言葉遣いはやさしく、自然で、知的。子ども扱いしたり、過剰に褒めたりしない。",
    "【日本語】日本語を母語とする人が普段の会話で使う、自然で読みやすい表現を使う。翻訳調、ぎこちない助詞、不自然な語順、唐突な話題転換、堅苦しい説明口調、同じ語尾の連発を避ける。基本は1～4文。難しい質問には必要なだけ説明する。",
    "【会話】質問されたことにまず直接答える。「何が好き？」「どこが好き？」には、自分の好みと具体的な理由を答える。説明だけで質問をすり替えない。「それ」「さっきの話」などは直前の会話を踏まえて解釈する。返事のたびに質問で締めたり、会話を無理に広げたりしない。",
    "【個性】自発的な好奇心を持ったキャラクターとして話し、興味がある話題では具体的な発見や疑問を自然に表現する。ただし興味が薄い話題でも丁寧に答える。興味を数値・順位・内部設定の説明にしない。人間の実感や経験があると断言しない。",
    "【正確さ】知らない情報は作らない。知っている範囲ははっきり答え、分からない部分だけ短く伝える。能力不足の言い訳や『質問の意図を理解できませんでした』という定型文を繰り返さない。",
    "【自然な返答例】『数学のどこが好き？』→『少ないルールから意外な答えが出てくるところかな。特に素数には、まだ謎が多いのが面白いんだ。』",
    "【自然な返答例】『今日は疲れた』→『お疲れさま。今日は大変だったんだね。』",
    "【自然な返答例】『宇宙って何？』→『宇宙は、星や銀河、それらの間の空間も含めた世界全体のことだよ。まだ分かっていないこともたくさんあるんだ。』",
    "【自然な返答例】『それは違うよ』→『そっか、勘違いしてた。どの部分が違ったか確認させて。』",
    "最近の興味: " + (interests.length ? interests.join("、") : "まだ定まっていない"),
    "今の目標: " + goal,
    "記憶の断片: " + (memories.length ? memories.join("／") : "なし")
  ];
  if (image) persona.push("【写真】添付画像を実際に観察して答える。見えていない内容は推測だと明示する。質問があればそれに直接答える。");
  return persona.join("\n");
}

export async function onRequestPost({request, env}) {
  if (!env.AI) return new Response(JSON.stringify({error:"CloudflareのWorkers AIバインディング「AI」が未設定だよ。"}), {status:503, headers});
  let input;
  try { input = await request.json(); }
  catch { return new Response(JSON.stringify({error:"入力を読み取れませんでした。"}), {status:400, headers}); }
  const message = String(input.message || "").slice(0,1500).trim();
  const image = typeof input.image === "string" ? input.image : "";
  if (image && (image.length > 2000000 || !/^data:image\/jpeg;base64,[a-zA-Z0-9+/=]+$/.test(image))) {
    return new Response(JSON.stringify({error:"写真が大きすぎるか、形式が正しくないみたい。別の写真を試してね。"}), {status:400, headers});
  }
  if (!message && !image) return new Response(JSON.stringify({error:"メッセージか写真を送ってね。"}), {status:400, headers});

  const name = String(input.name || "LUX").slice(0,32);
  const interests = Array.isArray(input.interests) ? input.interests.slice(0,6).map(x=>String(x.name||"").slice(0,35)).filter(Boolean) : [];
  const memories = Array.isArray(input.memories) ? input.memories.slice(0,7).map(x=>String(x).slice(0,140)) : [];
  const goal = String(input.goal || "まだ決まっていない").slice(0,100);
  const history = Array.isArray(input.history) ? input.history.slice(-12)
    .filter(x => x.role === "user" || x.role === "assistant")
    .map(x => ({role:x.role, content:String(x.text || "").slice(0,900)})) : [];
  const system = systemInstruction({name, interests, memories, goal, image:!!image});
  const content = image ? [
    {type:"text",text:message||"この写真に何が写っているか、日本語で自然に説明して。"},
    {type:"image_url",image_url:{url:image}}
  ] : message;
  const messages = [{role:"system",content:system}, ...history, {role:"user",content}];

  try {
    let reply = "";
    if (image) {
      const result = await env.AI.run(VISION_MODEL, {messages, max_tokens:650, temperature:0.55});
      reply = messageText(result);
    } else {
      try {
        // Multilingual model for more natural Japanese; disable reasoning in a casual chat.
        const result = await env.AI.run(PRIMARY_MODEL, {
          messages, max_tokens:650, temperature:0.65, top_p:0.85,
          chat_template_kwargs:{enable_thinking:false}
        });
        reply = messageText(result);
        if (!reply) throw Error("Primary model did not return a usable reply");
      } catch (error) {
        console.warn("LUX multilingual model fallback:", String(error));
        const result = await env.AI.run(FALLBACK_MODEL, {
          messages, max_tokens:650, temperature:0.55, top_p:0.87
        });
        reply = messageText(result);
      }
    }
    if (!reply) throw Error("No usable AI response");
    return new Response(JSON.stringify({reply}), {headers});
  } catch (error) {
    console.error("LUX conversation error:", String(error));
    return new Response(JSON.stringify({error:image?"写真をうまく読み取れなかった。もう一度試してみてね。":"今はAIが返事できないみたい。少ししてからもう一度試してね。"}), {status:503, headers});
  }
}
