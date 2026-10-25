import { readFile } from 'node:fs/promises';
import { resolve, dirname, posix } from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';
import { gzipSync } from 'node:zlib';
import { transform } from 'lightningcss';

const manifestPath = 'src/retired-style-symbols.json';
const checkerPath = 'scripts/check-retired-styles.mjs';
const protectedSymbols = new Set(['js', 'open', 'show', 'is-zoomed', 'motion-paused', 'hidden']);
const safePath = value => typeof value === 'string' && !value.includes('\\')
  && !value.startsWith('/') && !value.includes(':') && !value.split('/').includes('..');

export function findRetiredStyleUsages(symbols, sources) {
  const usages = [];
  for (const source of sources) {
    const text = source.data.toString('utf8');
    for (const symbol of symbols) {
      const index = text.indexOf(symbol);
      if (index !== -1) usages.push({ symbol, path: source.path, line: text.slice(0, index).split('\n').length });
    }
  }
  return usages;
}

// Follow the scripts actually loaded by the homepage, including the optional search
// modules. Resolve copied modules to their source so an old dist copy cannot hide reuse.
export async function auditRetiredStyles(root) {
  const inputs = new Map();
  async function input(path) {
    if (!safePath(path)) throw new Error('Unsafe retired-style audit source: ' + path);
    if (!inputs.has(path)) inputs.set(path, { path, data: await readFile(resolve(root, path)) });
    return inputs.get(path);
  }
  const manifestInput = await input(manifestPath);
  await input(checkerPath);
  const manifest = JSON.parse(manifestInput.data.toString('utf8'));
  if (manifest.version !== 1 || !Array.isArray(manifest.groups)
    || !Array.isArray(manifest.entrypoints) || !manifest.entrypoints.length
    || !manifest.sourceAliases || typeof manifest.sourceAliases !== 'object') {
    throw new Error('Invalid retired-style manifest');
  }
  const unusedSymbols = manifest.groups.flatMap(group => {
    if (!group.id || !group.reason || !Array.isArray(group.symbols)) throw new Error('Invalid retired-style group');
    return group.symbols;
  });
  if (!unusedSymbols.length || new Set(unusedSymbols).size !== unusedSymbols.length
    || unusedSymbols.some(name => typeof name !== 'string' || !/^[a-z][a-z0-9-]+$/.test(name) || protectedSymbols.has(name))) {
    throw new Error('Retired-style names must be unique class names and must not include runtime states');
  }
  for (const [served, source] of Object.entries(manifest.sourceAliases)) {
    if (!safePath(served) || !served.startsWith('dist/') || !safePath(source)) throw new Error('Invalid retired-style source alias');
  }
  const sources = [];
  const visited = new Set();
  const queue = [...manifest.entrypoints];
  function enqueue(specifier, from) {
    if (/^(?:[a-z]+:|\/\/)/i.test(specifier)) throw new Error('Retired-style audit cannot verify external script: ' + specifier);
    const path = specifier.split(/[?#]/)[0];
    const served = posix.normalize(path.startsWith('/') ? 'dist/' + path.slice(1) : posix.join(posix.dirname(from), path));
    if (!safePath(served) || !served.startsWith('dist/')) throw new Error('Script leaves the published site: ' + specifier);
    queue.push(served);
  }
  function scanImports(text, served, sourcePath) {
    const dynamic = [...text.matchAll(/\bimport\s*\(\s*(['"])([^'"]+)\1\s*\)/g)];
    if ([...text.matchAll(/\bimport\s*\(/g)].length !== dynamic.length) {
      throw new Error('Retired-style audit needs an explicit source for computed import() in ' + sourcePath);
    }
    for (const match of dynamic) enqueue(match[2], served);
    for (const match of text.matchAll(/\b(?:import|export)\s+(?:[^'";]*?\sfrom\s*)?(['"])([^'"]+)\1/g)) enqueue(match[2], served);
  }
  while (queue.length) {
    const served = queue.shift();
    if (visited.has(served)) continue;
    visited.add(served);
    const source = await input(manifest.sourceAliases[served] || served);
    sources.push(source);
    const text = source.data.toString('utf8');
    if (/\.html?$/.test(served)) {
      for (const match of text.matchAll(/<script\b[^>]*\bsrc\s*=\s*(['"])(.*?)\1[^>]*>/gi)) enqueue(match[2], served);
      for (const match of text.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script\s*>/gi)) {
        if (!/\bsrc\s*=/i.test(match[1])) scanImports(match[2], served, source.path);
      }
    } else {
      scanImports(text, served, source.path);
    }
  }
  const usages = findRetiredStyleUsages(unusedSymbols, sources);
  if (usages.length) throw new Error('Retired style is referenced by runtime source; remove it from the manifest before building:\n'
    + usages.map(item => `  ${item.path}:${item.line} ${item.symbol}`).join('\n'));
  return {
    unusedSymbols,
    inputs: [...inputs.values()],
    report: {
      manifest: manifestPath, symbolCount: unusedSymbols.length,
      groups: manifest.groups.map(group => ({ id: group.id, symbolCount: group.symbols.length })),
      runtimeSources: sources.map(source => source.path),
      policy: 'Explicit allowlist only; fail on runtime reuse or an unverified script import. Source CSS is preserved.'
    }
  };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
  const audit = await auditRetiredStyles(root);
  // Check the guard, not merely the current clean state: every listed name must be
  // detected in both initial markup and a later classList mutation.
  for (const symbol of audit.unusedSymbols) {
    for (const text of [`<div class="${symbol}"></div>`, `element.classList.add('${symbol}')`]) {
      assert.equal(findRetiredStyleUsages(audit.unusedSymbols, [{ path: 'fixture', data: Buffer.from(text) }]).some(item => item.symbol === symbol), true);
    }
  }
  assert.equal(audit.unusedSymbols.some(symbol => protectedSymbols.has(symbol)), false);
  const build = await readFile(resolve(root, 'scripts/build-assets.mjs'), 'utf8');
  const files = [...build.match(/const cssFiles = \[([\s\S]*?)\];/)[1].matchAll(/'([^']+)'/g)].map(match => match[1]);
  const source = Buffer.concat((await Promise.all(files.map(file => readFile(resolve(root, 'dist', file))))).flatMap(data => [data, Buffer.from('\n')]));
  const targets = { chrome: 110 << 16, safari: (16 << 16) | (4 << 8), firefox: 115 << 16 };
  function measure(unusedSymbols) {
    const { code, warnings } = transform({ filename: 'site.css', code: source, minify: true, targets, unusedSymbols });
    assert.deepEqual(warnings, []);
    return { bytes: code.length, gzipBytes: gzipSync(code).length };
  }
  const before = measure([]);
  const after = measure(audit.unusedSymbols);
  console.log(JSON.stringify({ ...audit.report, reuseGuardChecks: audit.unusedSymbols.length * 2, before, after,
    savedBytes: before.bytes - after.bytes, savedGzipBytes: before.gzipBytes - after.gzipBytes,
    note: 'Read-only validation and in-memory compilation. No generated assets are written.' }, null, 2));
}
