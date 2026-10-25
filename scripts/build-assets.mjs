import { readFile, writeFile, mkdir, rename, unlink } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve, dirname } from 'node:path';
import { createHash } from 'node:crypto';
import { performance } from 'node:perf_hooks';
import { gzipSync } from 'node:zlib';
import { transform } from 'lightningcss';
import sharp from 'sharp';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const startedAt = performance.now();
const force = process.argv.includes('--force');
const unknownArgs = process.argv.slice(2).filter(arg => arg !== '--force');
if (unknownArgs.length) throw new Error('Unknown build argument: ' + unknownArgs.join(', '));
const cachePath = resolve(root, '.cache/assets-build.json');
const cacheSchema = 1;
const targets = { chrome: 110 << 16, safari: (16 << 16) | (4 << 8), firefox: 115 << 16 };
const cssFiles = [
  'styles.css', 'enhancements.css', 'projects.css', 'ui-refresh.css',
  'portfolio.css', 'atelier.css', 'refinements.css', 'experience.css',
  'search.css', 'services-v15.css', 'polish-v15.css', 'showcase-v16.css', 'reference-teaser.css', 'editorial.css', 'editorial-motion.css', 'navigation-editorial.css', 'contact-editorial.css', 'project-viewer.css', 'about-editorial.css'
];
const captures = [
  { id: 'worldcup', source: 'src/project-captures/worldcup.png' }
];
const sha256 = data => createHash('sha256').update(data).digest('hex');
const stable = value => JSON.stringify(value, function (_key, item) {
  return item && typeof item === 'object' && !Array.isArray(item)
    ? Object.fromEntries(Object.keys(item).sort().map(key => [key, item[key]]))
    : item;
});
const elapsed = start => Math.round((performance.now() - start) * 10) / 10;

async function optionalRead(path) {
  try { return await readFile(path); }
  catch (error) { if (error.code === 'ENOENT') return null; throw error; }
}
async function input(path) {
  let data;
  try { data = await readFile(resolve(root, path)); }
  catch (error) {
    if (error.code === 'ENOENT') throw new Error('Required build input is missing: ' + path);
    throw error;
  }
  return { path, data, sha256: sha256(data) };
}
async function writeChanged(path, data) {
  const existing = await optionalRead(path);
  if (existing?.equals(data)) return false;
  await mkdir(dirname(path), { recursive: true });
  const temporary = path + '.tmp-' + process.pid;
  try {
    await writeFile(temporary, data);
    await rename(temporary, path);
  } finally {
    await unlink(temporary).catch(error => { if (error.code !== 'ENOENT') throw error; });
  }
  return true;
}

// Validate every required input before touching generated assets.
const [styles, vector, card, captureInputs, fuse, fuseLicense, quickSearch, baselineInput, lightningInput] = await Promise.all([
  Promise.all(cssFiles.map(name => input('dist/' + name))),
  input('dist/assets/field-sculpture.svg'),
  input('src/share-card.svg'),
  Promise.all(captures.map(capture => input(capture.source))),
  input('node_modules/fuse.js/dist/fuse.basic.min.mjs'),
  input('node_modules/fuse.js/LICENSE'),
  input('src/quick-search.mjs'),
  input('src/build-baseline.json'),
  input('node_modules/lightningcss/package.json')
]);
const baseline = JSON.parse(baselineInput.data.toString('utf8'));
if (baseline.version !== 15 || !Number.isFinite(baseline.css?.outputBytes) || !Number.isFinite(baseline.css?.outputGzipBytes)) {
  throw new Error('Expected a frozen v15 CSS baseline in src/build-baseline.json');
}
const lightningVersion = JSON.parse(lightningInput.data.toString('utf8')).version;
let previousCache = { schema: cacheSchema, tasks: {} };
const cachedBytes = await optionalRead(cachePath);
if (cachedBytes) {
  try {
    const parsed = JSON.parse(cachedBytes.toString('utf8'));
    if (parsed.schema === cacheSchema && parsed.tasks && typeof parsed.tasks === 'object') previousCache = parsed;
  } catch {
    console.warn('Ignoring invalid local asset cache; generated assets will be rebuilt.');
  }
}
const nextCache = { schema: cacheSchema, tasks: {} };
const taskResults = [];

async function resource({ id, output, inputs, recipe, options, tool, kind = 'asset', generate }) {
  const start = performance.now();
  const dependencies = inputs.map(({ path, sha256 }) => ({ path, sha256 }));
  const fingerprint = sha256(stable({ cacheSchema, id, output, dependencies, recipe, options, tool }));
  const cached = previousCache.tasks[id];
  const outputPath = resolve(root, output);
  let data = await optionalRead(outputPath);
  let reason = force ? 'forced' : !cached ? 'no-cache-entry'
    : cached.fingerprint !== fingerprint ? 'input-or-options-changed'
    : !data ? 'output-missing'
    : sha256(data) !== cached.outputSha256 ? 'output-hash-mismatch' : null;
  let written = false;
  if (reason) {
    data = await generate();
    if (!Buffer.isBuffer(data)) throw new TypeError(id + ' did not return a Buffer');
    written = await writeChanged(outputPath, data);
  }
  const outputHash = sha256(data);
  let image;
  if (kind === 'image') {
    const meta = await sharp(data).metadata();
    image = { format: meta.format, width: meta.width, height: meta.height, channels: meta.channels, hasAlpha: meta.hasAlpha };
  }
  nextCache.tasks[id] = { fingerprint, output, outputSha256: outputHash, outputBytes: data.length, ...(image ? { image } : {}) };
  const result = {
    id, kind, output, status: reason ? 'built' : 'skipped', reason: reason || 'verified-cache-hit',
    written, bytes: data.length, sha256: outputHash, elapsedMs: elapsed(start), ...(image ? { image } : {})
  };
  taskResults.push(result);
  return { data, result };
}

const cssSource = Buffer.concat(styles.flatMap(style => [style.data, Buffer.from('\n')]));
const css = await resource({
  id: 'site-css', kind: 'css', output: 'dist/site.css', inputs: styles,
  recipe: 'ordered-css-v1', options: { minify: true, targets },
  tool: { lightningcss: lightningVersion },
  generate: async () => {
    // Preserve the existing cascade and interactive states.
    const { code, warnings } = transform({ filename: 'site.css', code: cssSource, minify: true, targets });
    if (warnings.length) console.warn(warnings);
    return code;
  }
});
for (const [id, source, output] of [
  ['fuse-basic', fuse, 'dist/assets/vendor/fuse.basic.min.mjs'],
  ['fuse-license', fuseLicense, 'dist/assets/vendor/Fuse-LICENSE.txt'],
  ['quick-search', quickSearch, 'dist/assets/quick-search.mjs']
]) {
  await resource({ id, kind: 'copy', output, inputs: [source], recipe: 'byte-copy-v1', options: {}, tool: {},
    generate: async () => source.data });
}

const sharpTool = { versions: sharp.versions, platform: process.platform, arch: process.arch };
const sculptureVariants = [];
for (const width of [320, 640, 960, 1280]) {
  const options = { density: 192, width, height: width, webp: { quality: 88, alphaQuality: 100, effort: 6 } };
  const task = await resource({
    id: 'sculpture-' + width, kind: 'image', output: 'dist/assets/field-sculpture-' + width + '.webp',
    inputs: [vector], recipe: 'sculpture-webp-v1', options, tool: sharpTool,
    generate: () => sharp(vector.data, { density: options.density }).resize(width, width).webp(options.webp).toBuffer()
  });
  sculptureVariants.push({ ...task.result.image, path: task.result.output, bytes: task.result.bytes, status: task.result.status });
}

const screenshotVariants = [];
for (const [index, capture] of captures.entries()) {
  const source = captureInputs[index];
  const variants = [];
  for (const width of [700, 1400]) {
    const options = { width, withoutEnlargement: true, webp: { quality: 84, effort: 5 } };
    const task = await resource({
      id: capture.id + '-screen-' + width, kind: 'image',
      output: 'dist/assets/' + capture.id + '-screen-' + width + '.webp',
      inputs: [source], recipe: 'project-screenshot-webp-v1', options, tool: sharpTool,
      generate: () => sharp(source.data).rotate().resize({ width, withoutEnlargement: true }).webp(options.webp).toBuffer()
    });
    variants.push({ requestedWidth: width, ...task.result.image, path: task.result.output, bytes: task.result.bytes, status: task.result.status });
  }
  screenshotVariants.push({ project: capture.id, source: source.path, sourceBytes: source.data.length, variants });
}

const shareOptions = { png: { compressionLevel: 9, adaptiveFiltering: true, palette: false } };
const shareCard = await resource({
  id: 'share-card', kind: 'image', output: 'dist/assets/share-card.png', inputs: [card],
  recipe: 'editorial-share-card-v21', options: shareOptions, tool: sharpTool,
  generate: () => sharp(card.data).png(shareOptions.png).toBuffer()
});
const cssGzipBytes = gzipSync(css.data).length;
const report = {
  version: 28,
  baseline: { source: baselineInput.path, ...baseline },
  css: {
    sourceFiles: cssFiles, sourceFileCount: cssFiles.length,
    sourceBytes: styles.reduce((bytes, source) => bytes + source.data.length, 0),
    concatenatedSourceBytes: cssSource.length, concatenatedSourceGzipBytes: gzipSync(cssSource).length,
    requests: 1, outputBytes: css.data.length, outputGzipBytes: cssGzipBytes,
    baselineVersion: baseline.version,
    deltaBytes: css.data.length - baseline.css.outputBytes,
    deltaGzipBytes: cssGzipBytes - baseline.css.outputGzipBytes
  },
  sculpture: { sourceBytes: vector.data.length, sourceGzipBytes: gzipSync(vector.data).length, variants: sculptureVariants },
  projectScreenshots: screenshotVariants,
  projectScreenshotFallbacks: [{ project: 'astrrot', status: 'labelled-illustration-retained', reason: 'No verified screenshot supplied for this release.' }],
  shareCard: { ...shareCard.result.image, bytes: shareCard.result.bytes, baselineBytes: baseline.shareCard.bytes,
    deltaBytes: shareCard.result.bytes - baseline.shareCard.bytes, losslessEncoding: true },
  optionalSearch: { bytes: fuse.data.length, loading: 'on first search open; exact matching works without this module' },
  build: {
    forced: force, elapsedMs: elapsed(startedAt),
    built: taskResults.filter(task => task.status === 'built').length,
    skipped: taskResults.filter(task => task.status === 'skipped').length
  },
  tasks: taskResults,
  note: 'Byte counts and local build timings only, not measured network speed or LCP. CSS comparison uses the frozen published v15 baseline and all ordered source files. Screenshot filenames show requested widths; use reported actual dimensions for srcset. Cache stays outside dist and verifies output SHA-256 before skipping.'
};
await writeChanged(resolve(root, 'build-report.json'), Buffer.from(JSON.stringify(report, null, 2) + '\n'));
// A failed build never updates the cache manifest.
await writeChanged(cachePath, Buffer.from(JSON.stringify(nextCache, null, 2) + '\n'));
console.log(JSON.stringify(report));
await import('./build-references.mjs');
