import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import Fuse from 'fuse.js/basic';
import { createQuickSearch } from '../src/quick-search.mjs';
// Read the shipped navigation entries, so aliases and destinations cannot drift
// away from a separate test fixture. This parser is scoped to our static buttons.
const html = await readFile(new URL('../dist/index.html', import.meta.url), 'utf8');
const referenceHtml = await readFile(new URL('../dist/references.html', import.meta.url), 'utf8');
const dialog = html.match(/<dialog\b[^>]*\bid="quick-dialog"[^>]*>([\s\S]*?)<\/dialog>/)?.[1];
assert.ok(dialog, 'The homepage must include its quick-navigation dialog.');
const text = value => value.replace(/<[^>]*>/g, '').replaceAll('&amp;', '&').replaceAll('&nbsp;', ' ').trim();
const records = [...dialog.matchAll(/<button\b([^>]*\bclass="quick-item"[^>]*)>([\s\S]*?)<\/button>/g)].map(([, rawAttributes, content]) => {
  const attributes = Object.fromEntries([...rawAttributes.matchAll(/([\w-]+)="([^"]*)"/g)].map(([, name, value]) => [name, value]));
  const label = content.match(/<span\b[^>]*>([\s\S]*?)<small\b[^>]*>([\s\S]*?)<\/small>/);
  assert.ok(label, 'Each result needs a visible title and description.');
  const target = attributes['data-quick-target'];
  const href = attributes['data-quick-href'];
  assert.ok(Boolean(target) !== Boolean(href), 'Each result needs exactly one destination.');
  if (target) assert.ok(html.includes(`id="${target}"`), `Missing homepage destination: ${target}`);
  else {
    assert.ok(href.startsWith('references.html#'), `Unexpected local destination: ${href}`);
    assert.ok(referenceHtml.includes(`id="${href.split('#')[1]}"`), `Missing reference destination: ${href}`);
  }
  return { id: target || href, title: text(label[1]), description: text(label[2]), aliases: attributes['data-search-alias'] || '' };
});
assert.equal(records.length, 14, 'Keep all existing results and the HYALORIA API project.');
assert.equal(new Set(records.map(record => record.id)).size, records.length, 'Quick destinations must be unique.');
const search = createQuickSearch(records, Fuse);
const ids = query => search(query).map(result => result.id);
assert.deepEqual(ids('世界杯'), ['project-worldcup']);
for (const query of ['hyaloria', 'HYALORIA API', 'api', 'gateway', '多模型', '网关']) assert.deepEqual(ids(query), ['project-hyaloria'], `HYALORIA project query: ${query}`);
assert.deepEqual(ids('电话'), ['contact']);
assert.deepEqual(ids(' ＡＩ  赛事 '), ['project-worldcup']);
assert.equal(search('worlcup')[0].id, 'project-worldcup');
assert.equal(search('worlcup')[0].approximate, true);
assert.equal(search('astrrt')[0].id, 'project-astrrot');
assert.equal(search('workflw')[0].id, 'services');
assert.equal(search('没有这个项目').length, 0);
assert.equal(search('xyzq').length, 0);
assert.equal(search('世').length, 1);
assert.equal(search('')[0].id, 'project-worldcup');
assert.deepEqual(ids('AI'), ['project-worldcup','project-astrrot','project-aimegapro','services']);
assert.deepEqual(ids('需求'), ['inquiry-details']);
assert.deepEqual(ids('整理'), ['inquiry-details']);
for (const query of ['email', 'phone', 'wechat', 'contact']) assert.deepEqual(ids(query), ['contact'], `Actual contact aliases: ${query}`);
assert.deepEqual(ids('FDE 路线'), ['references.html#datawhale-fde']);
assert.deepEqual(ids('hello agents'), ['references.html#hello-agents']);
assert.deepEqual(ids('all-in-rag'), ['references.html#all-in-rag']);
for (const id of ['datawhale-fde', 'hello-agents', 'all-in-rag']) assert.ok(ids('Datawhale').includes(`references.html#${id}`));
console.log(`Search checks passed against ${records.length} actual homepage entries: destinations, Chinese, fullwidth, multiword, typo, inquiry, contact aliases and learning paths.`);
