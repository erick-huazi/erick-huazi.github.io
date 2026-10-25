import { cp, copyFile, lstat, mkdir, readFile, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const dist = resolve(root, 'dist');
const qa = resolve(root, '.qa');
const require = createRequire(import.meta.url);

// This function is serialized into .qa/audit.js; it never runs in Node.
function installLocalAudit() {
  'use strict';
  if (document.getElementById('qa-tools')) return;

  const tags = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice'];
  const tools = document.createElement('aside');
  tools.id = 'qa-tools';
  tools.setAttribute('aria-label', '本地无障碍检查工具');
  tools.innerHTML = `
    <button id="qa-run" type="button" aria-keyshortcuts="Control+Alt+A">检查当前页面状态 · Ctrl+Alt+A</button>
    <section id="qa-panel" aria-labelledby="qa-heading" hidden>
      <div class="qa-heading-row"><h2 id="qa-heading">本地 axe 检查</h2><button id="qa-collapse" type="button">收起</button></div>
      <p id="qa-status" role="status" aria-live="polite">等待检查。</p>
      <p class="qa-note">保持要检查的页面或弹窗状态，按 Ctrl+Alt+A。弹窗打开时工具面板可能不可操作；检查结束后可关闭弹窗查看结果。自动检查不能替代人工键盘与读屏检查。</p>
      <pre id="qa-results" tabindex="0" aria-label="无障碍检查 JSON 结果"></pre>
      <button id="qa-download" type="button" disabled>下载检查 JSON</button>
    </section>`;
  const style = document.createElement('style');
  style.textContent = `
    #qa-tools{position:fixed;left:14px;bottom:14px;z-index:2147483646;max-width:calc(100vw - 28px);width:530px;color:#172c26;font:13px/1.6 system-ui,sans-serif;pointer-events:none}
    #qa-tools>*{pointer-events:auto}#qa-tools button{font:inherit;line-height:1.4;min-height:40px;border:1px solid #66796a;border-radius:5px;padding:8px 12px;background:#fff;color:#173c2c;cursor:pointer}
    #qa-tools button:disabled{opacity:.6;cursor:wait}#qa-run{box-shadow:0 2px 14px #0003}#qa-panel{max-height:75vh;overflow:auto;margin-top:8px;padding:16px;border:1px solid #66796a;border-radius:8px;background:#fff;box-shadow:0 6px 30px #0003}
    #qa-panel[hidden]{display:none!important}#qa-tools .qa-heading-row{display:flex;align-items:center;justify-content:space-between;gap:14px}#qa-tools h2{font:600 18px/1.4 system-ui,sans-serif;margin:0}
    #qa-tools p{font:13px/1.6 system-ui,sans-serif;margin:12px 0;color:#172c26}#qa-tools .qa-note{font-size:12px;color:#47594e}#qa-results{font:12px/1.5 ui-monospace,Consolas,monospace;color:#152d23;background:#f2f6ef;border:1px solid #ccd7c8;border-radius:4px;padding:12px;max-height:35vh;overflow:auto;white-space:pre-wrap;overflow-wrap:anywhere;margin:12px 0}
    #qa-tools :focus-visible{outline:3px solid #7c4320;outline-offset:3px}@media print{#qa-tools{display:none!important}}`;
  tools.prepend(style);
  document.body.append(tools);

  const runButton = tools.querySelector('#qa-run');
  const panel = tools.querySelector('#qa-panel');
  const status = tools.querySelector('#qa-status');
  const output = tools.querySelector('#qa-results');
  const downloadButton = tools.querySelector('#qa-download');
  let running = false;
  let lastResult = null;

  function describeElement(element) {
    if (!(element instanceof Element)) return null;
    return {
      tag: element.tagName.toLowerCase(),
      id: element.id || null,
      name: element.getAttribute('aria-label') || null,
      labelledBy: element.getAttribute('aria-labelledby') || null,
    };
  }

  function summarizeRule(rule) {
    return {
      id: rule.id,
      impact: rule.impact || null,
      description: rule.description,
      help: rule.help,
      helpUrl: rule.helpUrl,
      tags: rule.tags,
      nodes: rule.nodes.map(node => ({
        target: node.target,
        failureSummary: node.failureSummary || null,
        impact: node.impact || null,
      })),
    };
  }

  async function runAudit(trigger) {
    if (running) return;
    running = true;
    const timestamp = new Date().toISOString();
    const context = {
      timestamp,
      trigger,
      page: { title: document.title, url: location.href },
      viewport: { width: innerWidth, height: innerHeight, devicePixelRatio },
      activeElement: describeElement(document.activeElement),
      openDialogs: [...document.querySelectorAll('dialog[open]')].map(describeElement),
      runOnlyTags: tags,
      excluded: ['#qa-tools'],
    };
    runButton.disabled = true;
    downloadButton.disabled = true;
    runButton.textContent = 'axe 检查中…';
    status.textContent = '正在检查当前页面状态，请等待完成后再切换弹窗或筛选。';

    try {
      if (!window.axe?.run) throw new Error('本地 axe-core 未加载，请使用 .qa 目录中的页面。');
      // axe's context object scans the document while excluding the entire QA UI.
      // Keeping focus untouched lets the same audit capture an open native dialog.
      const result = await window.axe.run({ include: [document], exclude: ['#qa-tools'] }, {
        runOnly: { type: 'tag', values: tags },
        resultTypes: ['violations', 'incomplete', 'passes'],
        iframes: false,
      });
      lastResult = {
        ...context,
        completedAt: new Date().toISOString(),
        testEngine: result.testEngine,
        passesCount: result.passes.length,
        violationsCount: result.violations.length,
        incompleteCount: result.incomplete.length,
        violations: result.violations.map(summarizeRule),
        incomplete: result.incomplete.map(summarizeRule),
      };
      status.textContent = `检查完成：${lastResult.violationsCount} 项违规，${lastResult.incompleteCount} 项需人工确认，${lastResult.passesCount} 项通过规则。`;
    } catch (error) {
      lastResult = {
        ...context,
        completedAt: new Date().toISOString(),
        error: { name: error?.name || 'Error', message: error?.message || String(error) },
      };
      status.textContent = `检查未完成：${lastResult.error.message}`;
    } finally {
      output.textContent = JSON.stringify(lastResult, null, 2);
      panel.hidden = false;
      runButton.disabled = false;
      downloadButton.disabled = false;
      runButton.textContent = '再次检查当前状态 · Ctrl+Alt+A';
      running = false;
    }
  }

  runButton.addEventListener('click', () => runAudit('button'));
  tools.querySelector('#qa-collapse').addEventListener('click', () => {
    panel.hidden = true;
    runButton.focus();
  });
  window.addEventListener('keydown', event => {
    if (event.isComposing || event.repeat) return;
    if (event.ctrlKey && event.altKey && !event.metaKey && (event.code === 'KeyA' || event.key.toLowerCase() === 'a')) {
      event.preventDefault();
      event.stopPropagation();
      runAudit('Control+Alt+A');
    }
  }, true);
  downloadButton.addEventListener('click', () => {
    if (!lastResult) return;
    const filename = `axe-${lastResult.timestamp.replace(/[:.]/g, '-')}.json`;
    const url = URL.createObjectURL(new Blob([JSON.stringify(lastResult, null, 2) + '\n'], { type: 'application/json;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    tools.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  });
}

async function prepare() {
  if (process.argv.includes('--help')) {
    console.log('Prepare local-only axe QA: node scripts/prepare-a11y.mjs\nThen: python -m http.server 8461 --bind 127.0.0.1 --directory .qa\nOpen http://127.0.0.1:8461/ and click the audit button, or press Ctrl+Alt+A while a dialog is open.');
    return;
  }
  const html = await readFile(resolve(dist, 'index.html'), 'utf8');
  if (!/<\/head\s*>/i.test(html)) throw new Error('dist/index.html must have a closing head element.');
  const axeFile = require.resolve('axe-core/axe.min.js');
  const axeRoot = dirname(axeFile);
  const axePackage = JSON.parse(await readFile(resolve(axeRoot, 'package.json'), 'utf8'));
  const existing = await lstat(qa).catch(error => { if (error.code === 'ENOENT') return null; throw error; });
  if (existing && (!existing.isDirectory() || existing.isSymbolicLink())) throw new Error('.qa must be a real local directory, not a file or symlink.');

  // Only copy into the fixed sibling .qa directory. Never write to dist or delete user files.
  await mkdir(qa, { recursive: true });
  await cp(dist, qa, { recursive: true, force: true });
  // A self-ignoring file keeps all generated QA content out of Git without editing the root ignore file.
  await writeFile(resolve(qa, '.gitignore'), '*\n');
  await copyFile(axeFile, resolve(qa, 'axe.min.js'));
  await copyFile(resolve(axeRoot, 'LICENSE'), resolve(qa, 'axe-LICENSE.txt'));
  await writeFile(resolve(qa, 'audit.js'), `(${installLocalAudit.toString()})();\n`);
  const injection = '\n<!-- LOCAL QA ONLY: generated by scripts/prepare-a11y.mjs -->\n<script src="axe.min.js" defer></script>\n<script src="audit.js" defer></script>\n';
  await writeFile(resolve(qa, 'index.html'), html.replace(/<\/head\s*>/i, `${injection}</head>`));
  for (const page of ['references.html', '404.html']) {
    const pageHtml = await readFile(resolve(dist, page), 'utf8').catch(error => {
      if (error.code === 'ENOENT') return null;
      throw error;
    });
    if (pageHtml) await writeFile(resolve(qa, page), pageHtml.replace(/<\/head\s*>/i, `${injection}</head>`));
  }
  await writeFile(resolve(qa, 'README.txt'), [
    `Local-only axe-core ${axePackage.version} accessibility QA`,
    'Generated copy of dist. Do not publish this directory.',
    'Serve from the project root: python -m http.server 8461 --bind 127.0.0.1 --directory .qa',
    'Open http://127.0.0.1:8461/ in your browser.',
    'Click the fixed audit button to scan the current page state.',
    'Open any site dialog, then press Ctrl+Alt+A to scan it without moving focus.',
    'After completion, close the site dialog normally to inspect #qa-results or download JSON.',
    'The QA controls are excluded from the scan. No remote scripts, API calls, or uploads are used.',
    'Incomplete results require manual review; automated checks are not a complete accessibility assessment.',
    'Rerun node scripts/prepare-a11y.mjs after rebuilding dist to refresh this copy.',
    '',
  ].join('\n'));
  console.log(`Prepared ${qa}\naxe-core ${axePackage.version}; all QA assets are local and ignored.\nServe: python -m http.server 8461 --bind 127.0.0.1 --directory .qa\nOpen http://127.0.0.1:8461/ · Audit button or Ctrl+Alt+A · Results: #qa-results`);
}

prepare().catch(error => { console.error(error.message); process.exitCode = 1; });
