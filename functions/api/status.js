export async function onRequestGet({env}) {
 return Response.json({enabled:!!env.AI,model:"Cloudflare Workers AI / Llama 3.1 8B",setup:env.AI?null:"Cloudflare PagesのSettings > BindingsでWorkers AIをAIという名前で追加して再デプロイしてください。"},{headers:{"cache-control":"no-store"}});
}
