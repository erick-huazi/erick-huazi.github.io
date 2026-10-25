(() => {
  'use strict';
  const dialog = document.querySelector('#ref-compare-dialog');
  if (!dialog || typeof dialog.showModal !== 'function') return;
  const choices = [...document.querySelectorAll('[data-compare-id]')];
  const tray = document.querySelector('#ref-compare-tray');
  const selectedItems = document.querySelector('#ref-selected-items');
  const status = document.querySelector('#ref-selection-status');
  const openButton = document.querySelector('#ref-compare-open');
  const content = document.querySelector('#ref-comparison-content');
  const heading = dialog.querySelector('.ref-compare-heading');
  const downloadStatus = document.querySelector('#ref-compare-download-status');
  const selected = new Set();
  const tracksTrayHeight = document.body.classList.contains('ref-v23');
  function syncTrayHeight() {
    if (!tracksTrayHeight) return;
    const value = `${tray.hidden ? 0 : Math.ceil(tray.getBoundingClientRect().height)}px`;
    const rootStyle = document.documentElement.style;
    if (rootStyle.getPropertyValue('--ref-tray-height') !== value) rootStyle.setProperty('--ref-tray-height', value);
  }
  if (tracksTrayHeight) {
    syncTrayHeight();
    if (typeof ResizeObserver === 'function') new ResizeObserver(syncTrayHeight).observe(tray);
    else window.addEventListener('resize', syncTrayHeight);
  }
  function syncHeadingHeight() {
    if (!dialog.open) return;
    dialog.style.setProperty('--ref-compare-header-height', `${Math.ceil(heading.getBoundingClientRect().height)}px`);
  }
  if (typeof ResizeObserver === 'function') new ResizeObserver(syncHeadingHeight).observe(heading);
  else window.addEventListener('resize', syncHeadingHeight);
  const records = new Map(choices.map(button => {
    const card = button.closest('article');
    return [card.id, {
      provider: card.querySelector('.ref-card-top span').textContent.trim(),
      title: card.querySelector('h3').textContent,
      type: card.querySelector('.ref-type').textContent,
      description: card.querySelector('.ref-description').textContent,
      facts: [...card.querySelectorAll('.ref-facts > div')].map(row => [row.querySelector('dt').textContent, row.querySelector('dd').textContent]),
      note: card.querySelector('.ref-note')?.textContent || '',
      links: [...card.querySelectorAll('.ref-links a')].map(link => ({url:link.href, label:link.childNodes[0].textContent.trim()})),
      reviewedAt: card.querySelector('time').dateTime,
    }];
  }));
  function element(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text) node.textContent = text;
    return node;
  }
  function shortProvider(record) {
    return record.provider.split(/[×/]/).pop().trim();
  }
  function caseIdentity(record, index, full = false) {
    const identity = element('p', 'ref-compare-identity');
    const letter = String.fromCharCode(65 + index);
    const marker = element('span', 'ref-compare-letter', letter);
    marker.setAttribute('aria-hidden', 'true');
    const name = element('span', '', full ? record.provider : shortProvider(record));
    name.prepend(element('span', 'ref-sr-only', `案例 ${letter}：`));
    identity.append(marker, name);
    return identity;
  }
  function comparisonGroup(id, title, number) {
    const section = element('section', 'ref-compare-group');
    section.id = id;
    section.tabIndex = -1;
    section.setAttribute('aria-labelledby', `${id}-title`);
    const titleNode = element('h3', 'ref-compare-group-title');
    titleNode.id = `${id}-title`;
    const marker = element('span', '', String(number).padStart(2, '0'));
    marker.setAttribute('aria-hidden', 'true');
    titleNode.append(marker, document.createTextNode(title));
    const grid = element('div', 'ref-compare-pair');
    section.append(titleNode, grid);
    content.append(section);
    return grid;
  }
  function renderComparison() {
    const pair = [...selected].map(id => ({id, ...records.get(id)}));
    content.replaceChildren();
    let number = 1;
    const overview = comparisonGroup('ref-compare-overview', '案例概览', number++);
    pair.forEach((record, index) => {
      const cell = element('article', 'ref-compare-cell ref-compare-overview-cell');
      const title = element('h4', '', record.title);
      title.id = `ref-compare-case-${index}-title`;
      cell.setAttribute('aria-labelledby', title.id);
      cell.append(caseIdentity(record, index, true), title, element('p', 'ref-compare-type', record.type), element('p', 'ref-compare-description', record.description));
      overview.append(cell);
    });
    // Pair the existing fact positions; retain every source label and value.
    const dimensions = [
      ['ref-compare-problem', '业务问题'],
      ['ref-compare-method', '做法'],
      ['ref-compare-application', '借鉴到项目'],
    ];
    const factCount = Math.max(dimensions.length, ...pair.map(record => record.facts.length));
    for (let factIndex = 0; factIndex < factCount; factIndex++) {
      const [id, title] = dimensions[factIndex] || [`ref-compare-fact-${factIndex + 1}`, '补充资料'];
      const grid = comparisonGroup(id, title, number++);
      pair.forEach((record, index) => {
        const cell = element('div', 'ref-compare-cell');
        cell.append(caseIdentity(record, index));
        const fact = record.facts[factIndex];
        if (fact) {
          const list = element('dl', 'ref-compare-fact');
          list.append(element('dt', '', fact[0]), element('dd', '', fact[1]));
          cell.append(list);
        } else cell.append(element('p', 'ref-compare-missing', '本案例未单列此项资料。'));
        grid.append(cell);
      });
    }
    const boundaries = comparisonGroup('ref-compare-boundaries', '资料边界', number++);
    pair.forEach((record, index) => {
      const cell = element('div', 'ref-compare-cell');
      cell.append(caseIdentity(record, index), element('p', 'ref-compare-boundary', record.note || '本案例未另列边界说明，请以原文为准。'));
      boundaries.append(cell);
    });
    const sources = comparisonGroup('ref-compare-sources', '原文与核验', number);
    pair.forEach((record, index) => {
      const cell = element('div', 'ref-compare-cell');
      const links = element('div', 'ref-compare-source-links');
      record.links.forEach(source => {
        const link = element('a', '', source.label);
        const arrow = element('span', '', '↗');
        arrow.setAttribute('aria-hidden', 'true');
        link.append(arrow, element('span', 'ref-sr-only', '（新窗口）'));
        link.href = source.url;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        links.append(link);
      });
      const reviewed = element('p', 'ref-compare-reviewed', '来源核验 ');
      const time = element('time', '', record.reviewedAt);
      time.dateTime = record.reviewedAt;
      reviewed.append(time);
      cell.append(caseIdentity(record, index), links, reviewed);
      sources.append(cell);
    });
  }
  function update() {
    choices.forEach(button => {
      const isSelected = selected.has(button.dataset.compareId);
      button.setAttribute('aria-pressed', String(isSelected));
      button.textContent = isSelected ? '已加入对照 · 移除' : '加入对照';
      button.setAttribute('aria-label', button.textContent + '：' + records.get(button.dataset.compareId).provider);
      button.disabled = !isSelected && selected.size === 2;
    });
    tray.hidden = !selected.size;
    document.body.classList.toggle('ref-compare-active', selected.size > 0);
    status.textContent = selected.size === 2 ? '已选 2 个案例 · 更换请先移除一项' : selected.size === 1 ? '已选 1 个案例，再选一个' : '尚未选择案例';
    openButton.disabled = selected.size !== 2;
    openButton.textContent = `查看对照 ${selected.size}/2`;
    selectedItems.replaceChildren();
    selected.forEach(id => {
      const record = records.get(id);
      const remove = element('button');
      const label = element('span', 'ref-selected-label', record.title);
      const cross = element('span', 'ref-selected-remove', '×');
      cross.setAttribute('aria-hidden', 'true');
      remove.append(label, cross);
      remove.type = 'button';
      remove.setAttribute('aria-label', `移除案例：${record.title}（${record.provider}）`);
      remove.addEventListener('click', () => {
        selected.delete(id); update();
        const target = selectedItems.querySelector('button') || choices.find(button => !button.closest('article').hidden) || document.querySelector('#ref-search');
        target?.focus();
      });
      selectedItems.append(remove);
    });
    syncTrayHeight();
  }
  choices.forEach(button => {
    button.hidden = false;
    button.addEventListener('click', () => {
      const id = button.dataset.compareId;
      if (selected.has(id)) selected.delete(id);
      else if (selected.size < 2) selected.add(id);
      update();
    });
  });
  document.querySelector('#ref-compare-clear').addEventListener('click', () => {
    selected.clear(); update();
    (choices.find(button => !button.closest('article').hidden) || document.querySelector('#ref-search')).focus();
  });
  openButton.addEventListener('click', () => {
    if (selected.size !== 2) return;
    renderComparison();
    downloadStatus.textContent = '';
    dialog.showModal();
    document.body.classList.add('ref-dialog-open');
    syncHeadingHeight();
    document.querySelector('#ref-compare-close').focus({preventScroll:true});
    dialog.scrollTop = 0;
  });
  dialog.addEventListener('click', event => {
    if (!dialog.open || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || !(event.target instanceof Element)) return;
    const link = event.target.closest('.ref-compare-chapters a, .ref-compare-footer a');
    if (!link || (link.target && link.target !== '_self') || link.hasAttribute('download')) return;
    const fragment = link.getAttribute('href');
    if (!fragment?.startsWith('#ref-compare-')) return;
    const target = document.getElementById(fragment.slice(1));
    if (!target || !content.contains(target) || !target.classList.contains('ref-compare-group')) return;
    // These sections exist only while comparing. Keep the page URL and history intact.
    event.preventDefault();
    syncHeadingHeight();
    target.scrollIntoView({block:'start', behavior:'instant'});
    target.focus({preventScroll:true});
  });
  document.querySelector('#ref-compare-close').addEventListener('click', () => dialog.close());
  dialog.addEventListener('close', () => {
    document.body.classList.remove('ref-dialog-open');
    openButton.focus();
  });
  document.querySelector('#ref-compare-download').addEventListener('click', () => {
    const notes = ['FDE 案例对照笔记 / Erick 张建华', '外部公开资料摘要与本站借鉴建议，不代表本人项目或合作背书。', ...[...selected].map(id => {
      const item = records.get(id);
      return [item.provider, item.title, item.type, item.description, ...item.facts.map(([label, text]) => label + '：' + text), item.note, '来源核验：' + item.reviewedAt, ...item.links.map(link => link.url), '案例链接：https://erick-huazi.github.io/references.html#' + encodeURIComponent(id)].filter(Boolean).join('\n');
    }), '我的项目讨论提纲\n当前业务问题：\n可以借鉴的做法：\n需要验证的数据、权限与系统：\n最小验证范围与验收依据：\n人工确认或回退方式：', '参考库：https://erick-huazi.github.io/references.html'].join('\n\n');
    try {
      const url = URL.createObjectURL(new Blob(['\ufeff', notes], {type:'text/plain;charset=utf-8'}));
      const link = element('a'); link.href = url; link.download = 'FDE-案例对照笔记.txt';
      dialog.append(link); link.click(); link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      downloadStatus.textContent = '笔记已准备，请查看浏览器下载。';
    } catch {
      downloadStatus.textContent = '暂时无法准备下载，请稍后重试。';
    }
  });
})();
