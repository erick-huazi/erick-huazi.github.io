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
  let hashScrollFrame=null;
  const topics=new Set(buttons.map(b=>b.dataset.refTopic));
  function render(historyMode,{preserveHash=false}={}){
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
      // A filter is a results view. Retaining a card fragment would make the
      // browser jump back to that card when traversing filter history.
      if(!preserveHash)url.hash='';
      if(url.href!==location.href)history[historyMode+'State'](null,'',url);
    }
  }
  function restore({followHash=false,initial=false}={}){
    if(hashScrollFrame!==null){cancelAnimationFrame(hashScrollFrame);hashScrollFrame=null;}
    const url=new URL(location.href);
    topic=topics.has(url.searchParams.get('topic'))?url.searchParams.get('topic'):'all';
    search.value=(url.searchParams.get('q')||'').slice(0,100);
    render();
    if(!followHash)return;
    let id='';try{id=decodeURIComponent(url.hash.slice(1));}catch{return;}
    const target=cards.find(card=>card.id===id);
    if(target){
      const wasHidden=target.hidden;
      if(wasHidden){topic='all';search.value='';render('replace',{preserveHash:true});}
      target.querySelector('details').open=true;
      // Visible hash targets already receive native fragment scrolling. Repeating it
      // on history traversal would overwrite the browser's saved scroll position.
      if(initial||wasHidden)hashScrollFrame=requestAnimationFrame(()=>{
        hashScrollFrame=null;
        if(location.hash===url.hash)target.scrollIntoView({block:'start',behavior:'instant'});
      });
    }else if(initial&&!url.hash&&(topic!=='all'||search.value.trim())){
      hashScrollFrame=requestAnimationFrame(()=>{
        hashScrollFrame=null;
        document.querySelector('#cases').scrollIntoView({block:'start',behavior:'instant'});
      });
    }
  }
  buttons.forEach(button=>button.addEventListener('click',()=>{topic=button.dataset.refTopic;render('push');}));
  search.addEventListener('input',event=>{if(!event.isComposing)render('replace');});
  search.addEventListener('compositionend',()=>render('replace'));
  function clear(){topic='all';search.value='';render('push');search.focus();}
  reset.addEventListener('click',clear);
  document.querySelector('#ref-empty-reset').addEventListener('click',clear);
  window.addEventListener('popstate',()=>restore());
  window.addEventListener('hashchange',()=>restore({followHash:true}));
  restore({followHash:true,initial:true});
  controls.hidden=false;
})();
