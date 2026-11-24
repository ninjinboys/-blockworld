const PRIME_HOST = 'baseball-prime.pages.dev';

export async function onRequestGet({request, env, next}) {
  const url = new URL(request.url);
  if (url.hostname !== PRIME_HOST || url.pathname !== '/') return next();

  url.pathname = '/baseball-prime/';
  const game = await env.ASSETS.fetch(new Request(url, request));
  if (!game.ok) return game;
  return new HTMLRewriter()
    .on('title', {
      element(title) {
        title.before('<base href="/baseball-prime/">', {html: true});
      },
    })
    .transform(game);
}
