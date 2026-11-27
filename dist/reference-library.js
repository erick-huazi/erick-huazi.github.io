(() => {
  'use strict';
  const controls = document.querySelector('.ref-controls');
  const search = document.querySelector('#ref-search');
  const reset = document.querySelector('#ref-reset');
  const status = document.querySelector('#ref-results-status');
  const empty = document.querySelector('#ref-empty');
  const emptyMessage = document.querySelector('#ref-empty-message');
  const emptyTopic = document.querySelector('#ref-empty-topic');
  const resultsLink = document.querySelector('#ref-results-link');
  const cards = [...document.querySelectorAll('[data-case-topics]')];
  if (!controls || !search || !cards.length) return;

  const normalize = value => value.normalize('NFKC').toLowerCase();
  const records = cards.map(card => ({
    card,
    topics: card.dataset.caseTopics.split(' '),
    text: normalize([...card.querySelectorAll('.ref-card-top span:first-child,.ref-type,h3,.ref-description,.ref-tags span,.ref-facts dd,.ref-note')]
      .map(node => node.textContent).join(' '))
  }));
  const buttons = [...controls.querySelectorAll('[data-ref-topic]')];
  const topicNames = new Map(buttons.map(button => [button.dataset.refTopic, button.dataset.topicName]));
  const canonical = document.querySelector('link[rel="canonical"]').href;
  let topic = 'all';
  let editing = false;
  let composing = false;
  let hashScrollFrame = null;

  function setQuery(url) {
    const query = search.value.trim();
    if (query) url.searchParams.set('q', query);
    else url.searchParams.delete('q');
    if (topic !== 'all') url.searchParams.set('topic', topic);
    else url.searchParams.delete('topic');
    return url;
  }

  function render(historyMode, preserveHash = false) {
    const terms = normalize(search.value).replace(/([a-z0-9])(\p{Script=Han})/gu, '$1 $2')
      .replace(/(\p{Script=Han})([a-z0-9])/gu, '$1 $2').trim().split(/\s+/).filter(Boolean);
    // Count each facet before applying the chosen topic so its number predicts the next click.
    const counts = new Map(buttons.map(button => [button.dataset.refTopic, 0]));
    for (const record of records) {
      const match = terms.every(term => record.text.includes(term));
      if (match) {
        counts.set('all', counts.get('all') + 1);
        for (const id of record.topics) counts.set(id, counts.get(id) + 1);
      }
      record.card.hidden = !match || (topic !== 'all' && !record.topics.includes(topic));
    }
    for (const button of buttons) {
      const id = button.dataset.refTopic;
      button.setAttribute('aria-pressed', String(id === topic));
      const badge = button.querySelector('span');
      const nextCount = String(counts.get(id));
      if (badge.textContent !== nextCount) badge.textContent = nextCount;
    }
    const count = counts.get(topic);
    const summary = `显示 ${count} / ${cards.length} 个公开案例${topic === 'all' ? '' : ' · ' + topicNames.get(topic)}`;
    if (status.textContent !== summary) status.textContent = summary;
    empty.hidden = count !== 0;
    const matchesElsewhere = count === 0 && counts.get('all') > 0;
    if (emptyTopic) emptyTopic.hidden = !matchesElsewhere;
    if (emptyMessage && !count) emptyMessage.textContent = matchesElsewhere
      ? `「${topicNames.get(topic)}」中没有匹配，其他场景有 ${counts.get('all')} 个相关案例。`
      : '所有场景都没有匹配。试试公司名、工具名，或删去一个关键词。';
    reset.disabled = topic === 'all' && !search.value;
    if (resultsLink) {
      const share = setQuery(new URL(canonical));
      share.hash = 'cases';
      resultsLink.href = share.href;
    }

    if (!historyMode) return false;
    const url = setQuery(new URL(location.href));
    if (!preserveHash) {
      url.hash = 'cases';
      url.searchParams.delete('compare');
    }
    if (url.href === location.href) return false;
    if (historyMode === 'replace') history.replaceState(history.state, '', url);
    else history.pushState(null, '', url);
    return true;
  }

  function restore({ followHash = false, initial = false } = {}) {
    if (hashScrollFrame !== null) {
      cancelAnimationFrame(hashScrollFrame);
      hashScrollFrame = null;
    }
    editing = false;
    composing = false;
    const url = new URL(location.href);
    const storedTopic = url.searchParams.get('topic');
    topic = topicNames.has(storedTopic) ? storedTopic : 'all';
    search.value = (url.searchParams.get('q') || '').slice(0, search.maxLength);
    render();
    if (!followHash) return;
    let id;
    try { id = decodeURIComponent(url.hash.slice(1)); } catch { return; }
    const target = cards.find(card => card.id === id);
    if (target) {
      const wasHidden = target.hidden;
      if (wasHidden) {
        topic = 'all';
        search.value = '';
        render('replace', true);
      }
      target.querySelector('details').open = true;
      if (initial || wasHidden) hashScrollFrame = requestAnimationFrame(() => {
        hashScrollFrame = null;
        if (location.hash === url.hash) target.scrollIntoView({ block: 'start', behavior: 'instant' });
      });
    } else if (initial && !url.hash && (topic !== 'all' || search.value.trim())) {
      hashScrollFrame = requestAnimationFrame(() => {
        hashScrollFrame = null;
        document.querySelector('#cases').scrollIntoView({ block: 'start', behavior: 'instant' });
      });
    }
  }

  for (const button of buttons) button.addEventListener('click', () => {
    editing = false;
    topic = button.dataset.refTopic;
    render('push');
  });
  function updateSearch() {
    if (search.value.trim() === (new URLSearchParams(location.search).get('q') || '')) {
      render();
      return;
    }
    // Preserve the pre-search list. Further keystrokes refine a single history entry.
    if (render(editing ? 'replace' : 'push')) editing = true;
  }
  search.addEventListener('input', event => { if (!composing && !event.isComposing) updateSearch(); });
  search.addEventListener('compositionstart', () => { composing = true; });
  search.addEventListener('compositionend', () => { composing = false; updateSearch(); });
  search.addEventListener('blur', () => { editing = false; });
  search.addEventListener('keydown', event => {
    if (event.key === 'Enter' && !composing && !event.isComposing && event.keyCode !== 229) editing = false;
  });
  function resetFilters(keepQuery = false) {
    editing = false;
    topic = 'all';
    if (!keepQuery) search.value = '';
    render('push');
    search.focus();
  }
  reset.addEventListener('click', () => resetFilters());
  document.querySelector('#ref-empty-reset').addEventListener('click', () => resetFilters());
  emptyTopic?.addEventListener('click', () => resetFilters(true));
  window.addEventListener('popstate', () => restore());
  window.addEventListener('hashchange', () => restore({ followHash: true }));
  restore({ followHash: true, initial: true });
  controls.hidden = false;
})();
