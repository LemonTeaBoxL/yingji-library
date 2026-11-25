'use strict';
// Keep interactive cards alive while personal records and background caches change.
(function(){
  let libraryOrderDirty=true,catalogOrderDirty=true,refreshBusy=false,libraryMoreObserver=null,libraryMoreEpoch=0;
  const ratios=new Map();state.markedView='all';catalogClient.format='all';catalogClient.ratedOnly=false;catalogClient.order='source';
  const orderOptions=YingjiOrder.options;
  const originalFiltered=filtered;
  filtered=function(){return YingjiOrder.sort(originalFiltered(),state.sort,state.sortDirection)};
  function directionButton(scope){return `<button class="sort-direction action-pill" data-order-direction="${scope}" aria-label="切换升降序" title="切换升降序">${svg('sortDirection')}<span>${(scope==='catalog'?catalogClient.orderDirection:state.sortDirection)==='asc'?'升序':'降序'}</span></button>`}
  Object.assign(icons,{sortDirection:'<path d="M8 4v16m-4-4 4 4 4-4M16 20V4m-4 4 4-4 4 4"/>',up:'<path d="m6 13 6-6 6 6M12 7v14M4 3h16"/>'});
  function updateActions(article,work){
    const cover=article.querySelector('[data-thumbnail]');if(work.type==='record'&&cover&&cover.dataset.thumbnail!==(work.coverId||work.id)){const template=document.createElement('template');template.innerHTML=recordCover(work);cover.replaceWith(template.content)}
    for(const button of article.querySelectorAll('[data-entry-action],[data-catalog-action]')){
      const action=button.dataset.entryAction||button.dataset.catalogAction,yes=action==='favorite'?!!work.favorite:work.status==='watched';
      button.classList.toggle(action==='favorite'?'favorite':'done',yes);const unmarked=!state.library.items.some(i=>i.id===work.id)||work.status==='unmarked';const label=action==='favorite'?(yes?'已收藏':'收藏'):(unmarked?'标记':yes?'看过':work.status==='watching'?'在看':'待看');
      const span=button.querySelector('span');if(span&&span.textContent!==label)span.textContent=label;
      const icon=action==='favorite'?'heart':unmarked?'mark':yes?'check':work.status==='watching'?'play':'pending';if(button.dataset.currentIcon!==icon){const old=button.querySelector('svg');if(old)old.outerHTML=svg(icon);button.dataset.currentIcon=icon}
      if(action==='watched')button.title='点击切换看过／待看；右键移出个人库（需确认删除副本与缓存）';button.setAttribute('aria-label',(action==='favorite'?(yes?'取消收藏':'收藏'):(yes?'切换为待看':'标记看过'))+' '+work.title);
    }
    const pair=article.querySelector('.rating-pair');if(pair){const key=[work.personalScore||0,work.sourceScore||0].join(':');if(pair.dataset.values!==key){pair.innerHTML=ratingPair(work).replace(/^<div class="rating-pair">|<\/div>$/g,'');pair.dataset.values=key}}
  }
  function reconcile(container,items,view,attribute,markup,dirty){
    const ids=items.map(i=>i.id),wanted=new Map(items.map(i=>[i.id,i])),signature=ids.slice().sort().join('|'),old=[...container.children],sameMembers=container.dataset.members===signature;
    const nodes=new Map(old.map(n=>[n.dataset[attribute],n]));
    for(const node of old)if(!wanted.has(node.dataset[attribute]))node.remove();
    const ordered=!dirty&&sameMembers?old.map(n=>wanted.get(n.dataset[attribute])).filter(Boolean):items;
    let cursor=container.firstElementChild;
    for(const work of ordered){let node=nodes.get(work.id);if(!node){const template=document.createElement('template');template.innerHTML=markup(work);node=template.content.firstElementChild;const ratio=ratios.get(work.coverId||work.id),cover=node.querySelector('.media-cover');if(ratio&&cover){cover.style.aspectRatio=ratio;cover.classList.add('ratio-ready')}}
      if(node!==cursor)container.insertBefore(node,cursor);cursor=node.nextElementSibling;updateActions(node,work);
    }
    container.dataset.members=signature;container.dataset.layoutView=view;
  }
  decorateLibraryItems=function(){document.querySelectorAll('#resultList [data-open]').forEach(article=>{const id=article.dataset.open;article.querySelector('.entry-selection')?.remove();article.classList.toggle('entry-selected',selection.has(id));article.classList.toggle('selection-mode',selectionMode);article.setAttribute('aria-pressed',String(selectionMode&&selection.has(id)));article.setAttribute('aria-label',(selectionMode?(selection.has(id)?'取消选择 ':'选择 '):'打开 ')+(state.library.items.find(i=>i.id===id)?.title||'条目'));if(!article.querySelector('.entry-delete'))article.insertAdjacentHTML('afterbegin',`<button class="entry-delete" data-delete-one="${esc(id)}" aria-label="移除条目">${svg('trash')}</button>`)})};
  function watchLibraryMore(){
    libraryMoreObserver?.disconnect();const epoch=++libraryMoreEpoch;
    // Absolute masonry cards need their layout frame before observing the footer.
    requestAnimationFrame(()=>requestAnimationFrame(()=>{
      const sentinel=$('#resultList>.library-more-sentinel');
      if(epoch!==libraryMoreEpoch||state.tab!=='library'||state.view!=='masonry'||!sentinel||sentinel.dataset.more!=='true'||!$('#overlay').hidden)return;
      let queued=false;
      libraryMoreObserver=new IntersectionObserver(entries=>{
        if(queued||epoch!==libraryMoreEpoch||!sentinel.isConnected||!entries.some(entry=>entry.isIntersecting)||!$('#overlay').hidden)return;
        queued=true;libraryMoreObserver.disconnect();
        requestAnimationFrame(()=>{
          if(epoch!==libraryMoreEpoch||state.tab!=='library'||state.view!=='masonry'||!sentinel.isConnected||!$('#overlay').hidden)return;
          state.limit+=40;renderResults();
        });
      },{root:mainElement,rootMargin:'400px 0px'});
      libraryMoreObserver.observe(sentinel);
    }));
  }
  const libraryNavigate=navigate;navigate=function(...args){libraryMoreObserver?.disconnect();++libraryMoreEpoch;return libraryNavigate(...args)};
  renderResults=function(){
    const result=$('#resultList');if(!result)return;const all=filtered(),items=all.slice(0,state.limit),view=state.view;
    $('#resultCount').textContent=all.length+' 项';let grid=result.firstElementChild;
    if(!grid||grid.dataset.layoutView!==view){result.innerHTML=`<div class="${view==='masonry'?'masonry-grid library-masonry':view==='list'?'file-list':'file-grid'}" data-layout-view="${view}"></div>`;grid=result.firstElementChild;libraryOrderDirty=true}
    reconcile(grid,items,view,'open',view==='list'?listRow:card,libraryOrderDirty);libraryOrderDirty=false;
    let more=result.querySelector(':scope>[data-action=more]'),sentinel=result.querySelector(':scope>.library-more-sentinel');
    if(view==='masonry'){
      more?.remove();if(all.length){if(!sentinel){sentinel=document.createElement('div');sentinel.className='library-more-sentinel';sentinel.setAttribute('role','status');sentinel.setAttribute('aria-live','polite');result.append(sentinel)}sentinel.dataset.more=String(all.length>items.length);sentinel.textContent=all.length>items.length?`已显示 ${items.length} / ${all.length} 项`:`已显示全部 ${all.length} 项`}else sentinel?.remove();
    }else{sentinel?.remove();if(all.length>state.limit){if(!more){more=document.createElement('button');more.className='load-more';more.dataset.action='more';more.textContent='显示更多';result.append(more)}}else more?.remove()}
    let empty=result.querySelector(':scope>.empty-reader');if(!all.length){if(!empty){result.insertAdjacentHTML('beforeend','<div class="empty-reader"><h3>这里还没有条目</h3><p>可以调整筛选，或添加你的作品。</p><button data-action="clear-filters">清除筛选</button><button data-action="edit-new">添加条目</button></div>')}}else empty?.remove();decorateLibraryItems();updateBatchBar();queueThumbnails();scheduleCatalogWalls();watchLibraryMore();
  };
  const libraryBase=renderLibrary;
  renderLibrary=function(){libraryOrderDirty=true;libraryBase();const sort=$('#filterSort');sort.innerHTML=options(orderOptions,state.sort);sort.setAttribute('aria-label','条目排序');sort.closest('.select-wrap').insertAdjacentHTML('afterend',directionButton('library'));
    if(state.collectionMode==='watched'){
      const records=state.library.items.filter(i=>i.type==='record');$('.library-toolbar').insertAdjacentHTML('beforebegin',`<div class="marked-tabs" role="tablist" aria-label="标记条目">${[['all','全部'],['watched','看过'],['pending','待看'],['watching','在看']].map(([value,label])=>`<button role="tab" data-marked-view="${value}" aria-selected="${state.markedView===value}">${svg(value==='all'?'grid':value==='watched'?'check':value==='watching'?'play':'pending')}${label}<small>${YingjiMarks.count(records,value)}</small></button>`).join('')}</div>`);
    }
    YingjiMenus.hydrate();
  };
  const catalogBase=renderCatalog;
  renderCatalog=function(){catalogOrderDirty=true;catalogBase();const toolbar=$('.catalog-toolbar');if(!toolbar)return;
    toolbar.insertAdjacentHTML('beforeend',select('catalogFormat',[['all','全部形式'],...['TV','剧场版','OVA','OAD','WEB','短片','其他'].map(f=>[f,f])],catalogClient.format)+`<label class="rating-filter"><input type="checkbox" id="catalogRatedOnly" ${catalogClient.ratedOnly?'checked':''}><span>仅显示源站有评分</span></label>`);
    $('.discovery-layout').insertAdjacentHTML('afterbegin','<div class="discovery-order"></div><small class="filter-scope">按网站拉取方式连续载入；季度、有评分筛选作用于已载入作品。</small>');
    $('#catalogFormat').setAttribute('aria-label','作品形式');$('#catalogSort').setAttribute('aria-label','网站拉取方式');
    $('#catalogFormat').onchange=e=>{catalogClient.format=e.target.value;catalogClient.page=1;catalogOrderDirty=true;loadCatalog()};$('#catalogRatedOnly').onchange=e=>{catalogClient.ratedOnly=e.target.checked;catalogOrderDirty=true;renderCatalogResults()};
    sourceSortScope();YingjiMenus.hydrate();
  };
  function sourceSortScope(){window.YingjiSourceOrder?.sync()}
  function catalogVisible(){const items=catalogClient.items.filter(w=>(!catalogClient.ratedOnly||Number(w.sourceScore)>0)&&(catalogClient.format==='all'||String(w.format||'其他').toUpperCase()===catalogClient.format.toUpperCase()));return items.map(savedWork)}
  renderCatalogResults=function(){
    sourceSortScope();
    const result=$('#catalogResults');if(!result)return;const formats=$('#catalogFormat');if(formats){for(const value of [...new Set(catalogClient.items.map(i=>i.format).filter(Boolean))])if(![...formats.options].some(o=>o.value===value))formats.add(new Option(value,value))}masonryObserver?.disconnect();const view=catalogClient.view,masonry=view==='masonry',items=catalogVisible();
    document.querySelectorAll('[data-catalog-view]').forEach(b=>b.classList.toggle('active',b.dataset.catalogView===view));
    if(catalogClient.loading&&!catalogClient.appending&&!catalogClient.items.length){if(!result.querySelector('.catalog-loading'))result.innerHTML='<div class="catalog-loading" role="status">'+Array.from({length:6},()=>'<div class="catalog-skeleton"></div>').join('')+'</div>';return}
    if(catalogClient.error&&!catalogClient.items.length){result.innerHTML=`<div class="catalog-empty"><b>作品资料暂未载入</b>${esc(catalogClient.error)}<br><button class="button secondary" data-catalog-retry>重新读取</button>${catalogClient.provider==='bangumi'?'<button class="button secondary" data-catalog-login>登录 Bangumi</button>':''}</div>`;return}
    let grid=result.querySelector(':scope>[data-layout-view]');if(!grid||grid.dataset.layoutView!==view){result.innerHTML=`<div class="${masonry?'masonry-grid':view==='grid'?'catalog-grid':'catalog-list'}" data-layout-view="${view}"></div><p class="catalog-empty filtered-empty" hidden>已载入的作品中没有符合条件的条目，可继续载入或调整筛选。</p><div class="catalog-page-footer"></div>`;grid=result.firstElementChild;catalogOrderDirty=true}
    reconcile(grid,items,view,'catalogOpen',view==='list'?catalogRow:catalogCard,catalogOrderDirty);catalogOrderDirty=false;
    result.querySelector('.filtered-empty').hidden=items.length>0;
    $('#catalogSummary').innerHTML=`<b>${items.length} 部作品</b> · 已载入 ${catalogClient.items.length} 部 <span class="source-pill">${catalogClient.result?.offline?'离线缓存':catalogClient.result?.cached?'本地缓存':'在线资料'}</span>`;
    const footer=result.querySelector('.catalog-page-footer');const html=window.YingjiCatalogLoading?YingjiCatalogLoading.footer(masonry):masonry?`<div class="masonry-sentinel"><button class="button secondary" data-masonry-more ${catalogClient.loading||!catalogClient.hasMore?'disabled':''}>${catalogClient.loading?'正在载入…':catalogClient.hasMore?'继续载入':'已经到底了'}</button>${catalogClient.error?`<p>${esc(catalogClient.error)}</p>`:''}</div>`:`<div class="catalog-pagination"><button class="button secondary" data-catalog-page="prev" ${catalogClient.page<=1?'disabled':''}>上一页</button><span>第 ${catalogClient.page} 页</span><button class="button secondary" data-catalog-page="next" ${!catalogClient.hasMore?'disabled':''}>下一页</button></div>`;
    if(footer.innerHTML!==html)footer.innerHTML=html;queueThumbnails();scheduleCatalogWalls();
    if(masonry&&catalogClient.hasMore&&!catalogClient.loading&&!catalogClient.error&&!catalogClient.autoPaused){masonryObserver=new IntersectionObserver(entries=>{if(entries.some(e=>e.isIntersecting)&&$('#overlay').hidden)loadMoreMasonry(true)},{root:mainElement,rootMargin:'280px'});masonryObserver.observe(result.querySelector('.masonry-sentinel'))}
  };
  // Thumbnail aspect ratio is shared by subsequent cards and the detail panel.
  const thumbBase=setThumbnail;
  setThumbnail=function(node,url){if(node.querySelector('img')?.getAttribute('src')===url)return;thumbBase(node,url);const image=node.querySelector('img');if(!image)return;const fit=()=>{if(!image.naturalWidth||!image.naturalHeight)return;const ratio=image.naturalWidth/image.naturalHeight;ratios.set(node.dataset.thumbnail,ratio);const cover=node.closest('.media-cover,.detail-cover');if(cover&&(cover.closest('.masonry-grid')||cover.matches('.detail-cover'))){cover.style.aspectRatio=String(ratio);cover.classList.add('ratio-ready')}scheduleCatalogWalls()};image.addEventListener('load',fit,{once:true});if(image.complete)fit()};
  const detailBase=renderCatalogDetail;
  const closeBase=closeSheet;closeSheet=function(...args){const result=closeBase(...args);requestAnimationFrame(()=>{if($('#overlay').hidden){queueThumbnails();if(state.tab==='catalog'&&catalogClient.view==='masonry')renderCatalogResults();else if(state.tab==='library')watchLibraryMore()}});return result};
  renderCatalogDetail=function(...args){detailBase(...args);const cover=$('#sheet .detail-cover'),id=cover?.querySelector('[data-thumbnail]')?.dataset.thumbnail;if(cover&&ratios.has(id)){cover.style.aspectRatio=ratios.get(id);cover.classList.add('ratio-ready')}const materials=$('#sheet .materials-heading');if(materials){materials.insertAdjacentHTML('afterend',`<div class="material-sort">${select('materialSort',[['linked','关联顺序'],...orderOptions.filter(o=>['name','added','date','size'].includes(o[0]))],state.materialSort||'linked')}<button class="action-pill" data-material-direction>${state.materialDirection==='asc'?'升序':'降序'}</button></div>`);$('#materialSort').onchange=e=>{state.materialSort=e.target.value;sortMaterials()};sortMaterials()}YingjiMenus.hydrate();YingjiLiquidGlass?.sync()};
  function sortMaterials(){const wall=$('#sheet .materials-masonry');if(!wall)return;const ids=current?.materialIds||[],items=ids.map(id=>state.library.items.find(i=>i.id===id)).filter(Boolean),sorted=state.materialSort&&state.materialSort!=='linked'?YingjiOrder.sort(items,state.materialSort,state.materialDirection):items;const nodes=new Map([...wall.children].map(n=>[n.dataset.materialId,n]));let cursor=wall.firstElementChild;for(const item of sorted){const node=nodes.get(item.id);if(!node)continue;if(node!==cursor)wall.insertBefore(node,cursor);cursor=node.nextElementSibling}scheduleMaterialLayout()}
  const navBase=updateNavigation;updateNavigation=function(){navBase();const count=$('[data-route-count=watched]');if(count)count.textContent=YingjiMarks.count(state.library.items)||''};
  function updateDirection(scope){const button=$('[data-order-direction='+scope+'] span');if(button)button.textContent=(scope==='catalog'?catalogClient.orderDirection:state.sortDirection)==='asc'?'升序':'降序'}
  window.addEventListener('click',event=>{const article=event.target.closest('#resultList [data-open]');if(selectionMode&&article){event.preventDefault();event.stopImmediatePropagation();const id=article.dataset.open;selection.has(id)?selection.delete(id):selection.add(id);decorateLibraryItems();updateBatchBar();return}
    const marked=event.target.closest('[data-marked-view]');if(marked){event.preventDefault();event.stopImmediatePropagation();state.markedView=marked.dataset.markedView;state.status=state.markedView;selection.clear();renderLibrary();return}
    const direction=event.target.closest('[data-order-direction]');if(direction){event.preventDefault();event.stopImmediatePropagation();const scope=direction.dataset.orderDirection;if(scope==='catalog'){catalogClient.orderDirection=catalogClient.orderDirection==='asc'?'desc':'asc';catalogOrderDirty=true;renderCatalogResults()}else{state.sortDirection=state.sortDirection==='asc'?'desc':'asc';libraryOrderDirty=true;renderResults()}updateDirection(scope);return}
    if(event.target.closest('[data-material-direction]')){state.materialDirection=state.materialDirection==='asc'?'desc':'asc';event.target.closest('button').textContent=state.materialDirection==='asc'?'升序':'降序';sortMaterials()}
  },true);
  window.addEventListener('keydown',event=>{const article=event.target.closest?.('#resultList [data-open]');if(selectionMode&&article&&['Enter',' '].includes(event.key)){event.preventDefault();event.stopImmediatePropagation();article.click()}},true);
  document.addEventListener('change',e=>{if(e.target.id==='filterSort'){state.sortDirection=e.target.value==='name'?'asc':'desc';libraryOrderDirty=true;updateDirection('library')}if(e.target.closest('.library-filters,.library-layout-bar'))libraryOrderDirty=true},true);
  document.addEventListener('input',e=>{if(e.target.id==='searchInput')libraryOrderDirty=true},true);
  // A quiet glass rail follows the active page or detail scroll area.
  const rail=document.createElement('nav');rail.className='page-rail';rail.setAttribute('aria-label','页面操作');rail.innerHTML=`<button data-page-top aria-label="回到顶部" title="回到顶部">${svg('up')}<span>回到顶部</span></button><button data-page-refresh aria-label="刷新页面" title="刷新页面">${svg('refresh')}<span>刷新页面</span></button>`;document.body.append(rail);
  function scrollTarget(){return !$('#overlay').hidden?$('#detailScroll')||$('#sheet .sheet-scroll'):mainElement}
  function positionRail(){const target=scrollTarget();rail.hidden=!target;if(!target)return;const r=target.getBoundingClientRect(),height=92;rail.style.right=Math.max(14,innerWidth-r.right+14)+'px';rail.style.top=Math.min(innerHeight-height-64,Math.max(r.top+70,r.top+r.height*.70))+'px';rail.classList.toggle('in-detail',!$('#overlay').hidden);rail.querySelector('[data-page-top]').disabled=target.scrollTop<32}
  rail.onclick=async e=>{const target=scrollTarget();if(e.target.closest('[data-page-top]'))target?.scrollTo({top:0,behavior:preferences.glassMotion===false?'instant':'smooth'});if(!e.target.closest('[data-page-refresh]')||refreshBusy)return;refreshBusy=true;rail.querySelector('[data-page-refresh]').disabled=true;try{const scroll=target?.scrollTop||0;if(!$('#overlay').hidden&&catalogDetailState&&$('#sheet').matches('.feature-detail')){await flushPersonalDrafts();const id=current.id;if(current.provider){const data=await invoke('refreshWork',id);state.library=await invoke('load');catalogDetailState={...data,id}}else state.library=await invoke('load');renderCatalogDetail();scrollTarget().scrollTop=scroll}else if(!$('#overlay').hidden){if(current?.type==='database')await openDatabase(current);else if(current)await openItem(current.id)}else if(state.tab==='catalog'){catalogClient.page=1;await loadCatalog(true)}else{state.library=await invoke('load');render();mainElement.scrollTop=scroll}toast('页面已刷新')}catch(error){toast(error.message)}finally{refreshBusy=false;rail.querySelector('[data-page-refresh]').disabled=false;positionRail()}};
  let railFrame=0;function scheduleRail(){if(!railFrame)railFrame=requestAnimationFrame(()=>{railFrame=0;positionRail()})}new MutationObserver(scheduleRail).observe($('#overlay'),{childList:true,subtree:true,attributes:true,attributeFilter:['hidden']});document.addEventListener('scroll',scheduleRail,true);window.addEventListener('resize',scheduleRail);new ResizeObserver(scheduleRail).observe(mainElement);scheduleRail();
  window.YingjiUsability={version:'0.4.15',catalogVisible,ratios,refreshLayout:scheduleCatalogWalls};
  YingjiFeatures.version='0.4.15';updateNavigation();if(state.tab==='catalog')renderCatalog();else render();
})();
