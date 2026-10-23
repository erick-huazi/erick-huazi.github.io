(() => {
  'use strict';
  const controls=document.querySelector('.ref-controls');
  const search=document.querySelector('#ref-search');
  const reset=document.querySelector('#ref-reset');
  const status=document.querySelector('#ref-results-status');
  const empty=document.querySelector('#ref-empty');
  const cards=[...document.querySelectorAll('[data-case-topics]')];
  const buttons=[...document.querySelectorAll('[data-ref-topic]')];
  if(!controls||!search||!cards.length) return;
  const normalize=s=>s.normalize('NFKC').toLocaleLowerCase().trim();
  const records=cards.map(card=>({card,topics:card.dataset.caseTopics.split(' '),text:normalize(card.textContent)}));
  let topic='all';
  const topics=new Set(buttons.map(b=>b.dataset.refTopic));
  function render(historyMode){
    const terms=normalize(search.value).split(/\s+/).filter(Boolean);
    let count=0;
    records.forEach(record=>{
      const show=(topic==='all'||record.topics.includes(topic))&&terms.every(term=>record.text.includes(term));
      record.card.hidden=!show;
      if(show)count++;
    });
    buttons.forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.refTopic===topic)));
    status.textContent=`显示 ${count} / ${cards.length} 个公开案例${topic==='all'?'':' · '+buttons.find(b=>b.dataset.refTopic===topic).dataset.topicName}`;
    empty.hidden=count!==0;
    reset.disabled=topic==='all'&&!search.value;
    if(historyMode){
      const url=new URL(location.href);
      topic==='all'?url.searchParams.delete('topic'):url.searchParams.set('topic',topic);
      search.value.trim()?url.searchParams.set('q',search.value.trim()):url.searchParams.delete('q');
      // Filtering must not retain a deep link to a now-hidden card.
      if(cards.some(card=>url.hash==='#'+card.id&&card.hidden))url.hash='cases';
      if(url.href!==location.href)history[historyMode+'State'](null,'',url);
    }
  }
  function restore(){
    const url=new URL(location.href);
    topic=topics.has(url.searchParams.get('topic'))?url.searchParams.get('topic'):'all';
    search.value=(url.searchParams.get('q')||'').slice(0,100);
    render();
    let id='';try{id=decodeURIComponent(url.hash.slice(1));}catch{return;}
    const target=cards.find(card=>card.id===id);
    if(target){
      if(target.hidden){topic='all';search.value='';render('replace');}
      target.querySelector('details').open=true;
      requestAnimationFrame(()=>target.scrollIntoView({block:'start',behavior:'instant'}));
    }
  }
  buttons.forEach(button=>button.addEventListener('click',()=>{topic=button.dataset.refTopic;render('push');}));
  search.addEventListener('input',event=>{if(!event.isComposing)render('replace');});
  search.addEventListener('compositionend',()=>render('replace'));
  function clear(){topic='all';search.value='';render('push');search.focus();}
  reset.addEventListener('click',clear);
  document.querySelector('#ref-empty-reset').addEventListener('click',clear);
  window.addEventListener('popstate',restore);
  window.addEventListener('hashchange',restore);
  restore();
  controls.hidden=false;
})();
