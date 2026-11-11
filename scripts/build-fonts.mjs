// Subsets 得意黑 Smiley Sans to the characters the display type actually uses,
// and copies the annotation library. Runs at the end of `npm run build`,
// after the reference page exists, so new headings are picked up automatically.
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve, dirname } from 'node:path';
import subsetFont from 'subset-font';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const pages = ['dist/index.html', 'dist/references.html', 'dist/404.html'];
// Display type: headings plus the few classes styled with the display face.
const displayClasses = ['hero-lead', 'footer-cta', 'footer-wordmark', 'archive-heading', 'archive-deck',
  'qr-person', 'ref-intro', 'number', 'shelf-title', 'about-statement', 'case-deck', 'live-badge', 'section-number',
  'reference-teaser-label', 'eyebrow', 'ref-kicker', 'hero-shot-label'];
// Headings written by scripts at run time (comparison dialog, viewer).
const runtimeText = '案例概览业务问题做法借鉴到项目资料边界原文与核验补充资料作品实屏逐项对照需求已整理。';
const always = ' !"#$%&\'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_`abcdefghijklmnopqrstuvwxyz{|}~'
  + '，。、：；！？·—…“”‘’（）《》／↗↓→↑×＋';

const decode = text => text.replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'");
const characters = new Set([...always, ...runtimeText]);
for (const page of pages) {
  const html = await readFile(resolve(root, page), 'utf8');
  for (const match of html.matchAll(/<(h[1-4])\b[^>]*>([\s\S]*?)<\/\1>/g)) for (const ch of decode(match[2])) characters.add(ch);
  for (const name of displayClasses) {
    const pattern = new RegExp(`<(\\w+)[^>]*class="[^"]*\\b${name}\\b[^"]*"[^>]*>([\\s\\S]*?)</\\1>`, 'g');
    for (const match of html.matchAll(pattern)) for (const ch of decode(match[2])) characters.add(ch);
  }
  for (const match of html.matchAll(/<(b|dd|strong)\b[^>]*>([^<]{1,12})<\/\1>/g)) for (const ch of match[2]) characters.add(ch);
}
const text = [...characters].filter(ch => ch >= ' ').sort().join('');
const source = await readFile(resolve(root, 'node_modules/@fontpkg/smiley-sans/SmileySans-Oblique.ttf'));
const subset = await subsetFont(source, text, { targetFormat: 'woff2' });
await mkdir(resolve(root, 'dist/assets/fonts'), { recursive: true });
await writeFile(resolve(root, 'dist/assets/fonts/smiley-sans-subset.woff2'), subset);
await writeFile(resolve(root, 'dist/assets/vendor/rough-notation.esm.js'),
  await readFile(resolve(root, 'node_modules/rough-notation/lib/rough-notation.esm.js')));
console.log(`Display font subset: ${text.length} characters, ${subset.length} bytes.`);
