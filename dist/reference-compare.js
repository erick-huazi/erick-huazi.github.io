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
    status.textContent = selected.size === 2 ? '已选 2 个案例，可以开始对照' : '已选 1 个案例，再选一个';
    openButton.disabled = selected.size !== 2;
    openButton.textContent = `查看对照 ${selected.size}/2`;
    selectedItems.replaceChildren();
    selected.forEach(id => {
      const record = records.get(id);
      const name = record.provider.split('×').pop().trim();
      const remove = element('button', '', name + ' ×');
      remove.type = 'button';
      remove.setAttribute('aria-label', '移除 ' + record.provider);
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
    content.replaceChildren();
    selected.forEach(id => {
      const record = records.get(id);
      const article = element('article', 'ref-comparison-case');
      article.append(element('p', 'ref-kicker', record.provider), element('h3', '', record.title), element('p', 'ref-type', record.type), element('p', 'ref-description', record.description));
      const facts = element('dl', 'ref-facts');
      record.facts.forEach(([label, text]) => {
        const row = element('div');
        row.append(element('dt', '', label), element('dd', '', text));
        facts.append(row);
      });
      article.append(facts);
      if (record.note) article.append(element('p', 'ref-note', record.note));
      const links = element('div', 'ref-links');
      record.links.forEach(source => {
        const link = element('a', '', source.label + '（新窗口）');
        link.href = source.url; link.target = '_blank'; link.rel = 'noopener noreferrer';
        links.append(link);
      });
      const reviewed = element('p', 'ref-reviewed', '来源核验 ');
      const time = element('time', '', record.reviewedAt); time.dateTime = record.reviewedAt;
      reviewed.append(time); article.append(links, reviewed); content.append(article);
    });
    dialog.showModal();
    document.body.classList.add('ref-dialog-open');
    document.querySelector('#ref-compare-close').focus();
  });
  document.querySelector('#ref-compare-close').addEventListener('click', () => dialog.close());
  dialog.addEventListener('close', () => {
    document.body.classList.remove('ref-dialog-open');
    openButton.focus();
  });
  document.querySelector('#ref-compare-download').addEventListener('click', () => {
    const notes = ['FDE 案例对照笔记 / Erick 张建华', '外部公开资料摘要与本站借鉴建议，不代表本人项目或合作背书。', ...[...selected].map(id => {
      const item = records.get(id);
      return [item.provider, item.title, item.type, item.description, ...item.facts.map(([label, text]) => label + '：' + text), item.note, '来源核验：' + item.reviewedAt, ...item.links.map(link => link.url)].filter(Boolean).join('\n');
    }), '我的项目讨论提纲\n当前业务问题：\n可以借鉴的做法：\n需要验证的数据、权限与系统：\n最小验证范围与验收依据：\n人工确认或回退方式：', '参考库：https://erick-huazi.github.io/references.html'].join('\n\n');
    const url = URL.createObjectURL(new Blob(['\ufeff', notes], {type:'text/plain;charset=utf-8'}));
    const link = element('a'); link.href = url; link.download = 'FDE-案例对照笔记.txt';
    dialog.append(link); link.click(); link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  });
})();
