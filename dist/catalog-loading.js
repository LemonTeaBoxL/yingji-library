'use strict';
(function(){
  const loading={version:'0.4.15',timeoutMs:26000,emptyPageLimit:3};
  const visibleIds=()=>new Set((window.YingjiUsability?.catalogVisible?.()||catalogClient.items).map(item=>item.id));
  const message=error=>String(error?.message||error||'读取失败，请重试').replace(/^Error invoking remote method '[^']+': (?:Error: )?/,'');

  loadCatalog=async function(refresh=false,append=false){
    window.YingjiSourceOrder?.sync();
    if(catalogClient.forceRefresh){refresh=true;catalogClient.forceRefresh=false}
    const previousPage=catalogClient.result?.page||catalogClient.page||1;
    const page=append?Math.min(1000,previousPage+1):Math.max(1,Number(catalogClient.page)||1);
    const before=append?visibleIds():new Set(),requestId=++catalogClient.requestId;
    const args={provider:catalogClient.provider,kind:catalogClient.kind,year:catalogClient.year,quarter:catalogClient.quarter,region:catalogClient.region,sort:catalogClient.sort,query:catalogClient.query,page,refresh,sourceOrder:true,format:catalogClient.format};
    catalogClient.loading=true;catalogClient.appending=append;catalogClient.pendingPage=page;catalogClient.error='';
    if(!append){catalogClient.items=[];catalogClient.result=null;catalogClient.hasMore=false;catalogClient.autoEmptyPages=0;catalogClient.autoPaused=false}
    let timer;
    try{
      renderCatalogResults();
      const deadline=new Promise((_,reject)=>{timer=setTimeout(()=>reject(Error('读取超时，已停止等待；请点击重试。')),loading.timeoutMs)});
      const result=await Promise.race([invoke('catalogBrowse',args),deadline]);
      if(requestId!==catalogClient.requestId)return;
      if(!Array.isArray(result?.items))throw Error('数据源返回的作品列表无效，请重试');
      catalogClient.items=append?[...new Map([...catalogClient.items,...result.items].map(item=>[item.id,item])).values()]:result.items;
      catalogClient.page=page;catalogClient.total=result.total;catalogClient.hasMore=!!result.hasMore&&page<1000;catalogClient.result={...result,page};
      for(const item of result.items)catalogClient.byId.set(item.id,item);
      if(catalogClient.byId.size>1400)for(const id of [...catalogClient.byId.keys()].slice(0,400))if(!state.library.items.some(item=>item.id===id))catalogClient.byId.delete(id);
      const added=[...visibleIds()].some(id=>!before.has(id));
      catalogClient.autoEmptyPages=added?0:(catalogClient.autoEmptyPages||0)+1;
      catalogClient.autoPaused=catalogClient.hasMore&&catalogClient.autoEmptyPages>=loading.emptyPageLimit;
      catalogClient.autoPauseReason=catalogClient.autoPaused?'empty':'';
      setTaskStatus(result.offline?'网络不可用，显示本地缓存':'作品资料已载入 · '+catalogClient.items.length+' 部');
      if(result.coverage&&state.tab==='catalog'&&$('.catalog-note>span'))$('.catalog-note>span').textContent=result.coverage;
    }catch(error){
      if(requestId!==catalogClient.requestId)return;
      catalogClient.error=message(error);catalogClient.autoPaused=true;catalogClient.autoPauseReason='error';
      if(append)catalogClient.page=previousPage;
      setTaskStatus(catalogClient.items.length?'继续载入失败，已保留现有作品':'作品资料暂未载入');
    }finally{
      clearTimeout(timer);
      if(requestId===catalogClient.requestId){
        catalogClient.loading=false;catalogClient.pendingPage=null;
        try{if(state.tab==='catalog')renderCatalogResults()}finally{catalogClient.appending=false}
      }
    }
  };

  loadMoreMasonry=async function(automatic=false){
    if(catalogClient.loading||!catalogClient.hasMore||automatic&&catalogClient.autoPaused)return;
    if(!automatic){catalogClient.autoEmptyPages=0;catalogClient.autoPaused=false;catalogClient.autoPauseReason=''}
    await loadCatalog(false,true);
  };

  function stop(){
    if(!catalogClient.loading)return;
    ++catalogClient.requestId;catalogClient.loading=false;catalogClient.appending=false;catalogClient.pendingPage=null;
    catalogClient.autoPaused=true;catalogClient.autoPauseReason='canceled';
    if(!catalogClient.items.length)catalogClient.error='已暂停载入，可以点击重新读取继续。';
    setTaskStatus('已暂停载入，现有作品保留');if(state.tab==='catalog')renderCatalogResults();
  }

  loading.footer=function(masonry){
    const c=catalogClient,page=c.pendingPage||c.page||1,total=c.result?.sourcePageCount;
    const progress=total?`源网页第 ${page} / ${total} 页`:`源网页第 ${page} 页`;
    if(!masonry)return `<div class="catalog-pagination"><button class="button secondary" data-catalog-page="prev" ${c.loading||c.page<=1?'disabled':''}>上一页</button><span>${progress}</span><button class="button secondary" data-catalog-page="next" ${c.loading||!c.hasMore?'disabled':''}>下一页</button>${c.loading?'<button class="action-pill" data-catalog-stop>暂停载入</button>':''}</div>${c.error?`<p class="catalog-load-note" role="status">${esc(c.error)} <button class="action-pill" data-catalog-retry>重试</button></p>`:''}`;
    const label=c.loading?`正在读取第 ${page} 页…`:c.error?'重试载入':c.hasMore?'继续载入':'已经到底了';
    const note=c.error||(!c.hasMore&&total>1000?'已到单次浏览上限，可按年份缩小范围继续浏览。':c.hasMore&&c.autoPaused?(c.autoPauseReason==='empty'?`连续 ${c.autoEmptyPages} 页没有新增符合条件的作品，已暂停自动载入；可点击继续，或调整筛选。`:'已暂停自动载入，点击继续可恢复。'):'');
    return `<div class="masonry-sentinel"><div class="catalog-load-actions"><button class="button secondary" data-masonry-more ${c.loading||!c.hasMore?'disabled':''}>${label}</button>${c.loading?'<button class="action-pill" data-catalog-stop>暂停载入</button>':''}</div><small class="catalog-load-progress">${progress}</small>${note?`<p class="catalog-load-note" role="status">${esc(note)}</p>`:''}</div>`;
  };
  document.addEventListener('click',event=>{if(!event.target.closest('[data-catalog-stop]'))return;event.preventDefault();event.stopImmediatePropagation();stop()},true);
  loading.stop=stop;window.YingjiCatalogLoading=loading;
})();
