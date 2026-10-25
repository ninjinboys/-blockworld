// Cloudflare Pages build for the standalone NEXACRAFT PvP project.
// In Cloudflare Pages set:
//   Project name: nexacraftpvp
//   Build command: node build-pvp-pages.mjs
//   Build output directory: dist-pvp
//   Production branch: main
//
// The existing NEXACRAFT Pages project continues to use its original index.html.
import { mkdirSync, copyFileSync, readFileSync, writeFileSync, rmSync, statSync } from 'node:fs';
import { join } from 'node:path';

const out = 'dist-pvp';
const dependencies = [
  'pvp-title.avif',
  'pvp.js',
  'job-system.js',
  'job-weapon-models.js',
  'reference-weapon-models.js',
  'first-person-hand.js',
  'avatar-held-items.js',
  'item-held-models.js',
];

rmSync(out, { recursive: true, force: true });
mkdirSync(out, { recursive: true });

for (const file of dependencies) {
  if (!statSync(file).isFile()) throw new Error('Missing PvP dependency: ' + file);
  copyFileSync(file, join(out, file));
}

// On the dedicated PvP hostname, the root must launch PvP rather than the
// NEXACRAFT main game's index.html.
const pvpHtml = readFileSync('pvp.html', 'utf8').replace(
  'href="./index.html">本編 NEXACRAFT に戻る',
  'href="https://nexacraft.pages.dev/">本編 NEXACRAFT に戻る',
);
if (!pvpHtml.includes('src="./pvp.js?')) {
  throw new Error('PvP entrypoint is missing its game module');
}
writeFileSync(join(out, 'index.html'), pvpHtml, 'utf8');
writeFileSync(join(out, 'pvp.html'), pvpHtml, 'utf8');

console.log('Prepared independent PvP Pages output: ' + out);
console.log(['index.html', 'pvp.html', ...dependencies].join(', '));
