export async function onRequestGet({env}) {
 return Response.json({enabled:!!env.AI,model:"Cloudflare Workers AI / Qwen3 30B (Llama 3.1 fallback)",setup:env.AI?null:"Cloudflare PagesのSettings > BindingsでWorkers AIをAIという名前で追加して再デプロイしてください。"},{headers:{"cache-control":"no-store"}});
}
