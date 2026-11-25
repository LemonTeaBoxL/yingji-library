'use strict';
(function(){
  const choices=[['rank','排名'],['trends','热度'],['collects','收藏'],['date','日期'],['title','名称']],pending=new Set();
  
  function sync(){
    const bangumi=catalogClient.provider==='bangumi',search=!!catalogClient.query.trim();
    const available=bangumi?search?['rank','collects']:choices.map(c=>c[0]):['rank','date'];
    if(!available.includes(catalogClient.sort))catalogClient.sort='rank';
    const select=$('#catalogSort');if(select){
      const rows=bangumi?choices:[['rank','热度'],['date','日期']];
      const html=rows.map(([value,label])=>`<option value="${value}" ${available.includes(value)?'':'disabled'}>${label}</option>`).join('');
      const changed=select.dataset.sourceOptions!==html||select.value!==catalogClient.sort;
      if(select.dataset.sourceOptions!==html){select.innerHTML=html;select.dataset.sourceOptions=html}
      select.value=catalogClient.sort;select.title='网站拉取方式';select.setAttribute('aria-label','网站拉取方式');if(changed)YingjiMenus.hydrate();
    }
    const scope=$('.discovery-layout .filter-scope');if(scope)scope.textContent=bangumi?(search?'关键词搜索支持排名、收藏人数排序；清空关键词可使用五种网页浏览方式。':'按源网页顺序连续载入；季度、有评分筛选作用于已载入作品。'):'按 TMDB 返回顺序载入；有评分筛选作用于已载入作品。';
  }
  // A context click only clears the watching mark, keeping the saved work and its annotations.
  document.addEventListener('contextmenu',async event=>{
    const button=event.target.closest('[data-entry-action="watched"],[data-catalog-action="watched"],[data-detail-action="watched"]');
    if(!button)return;event.preventDefault();event.stopImmediatePropagation();const id=button.dataset.id;
    const work=state.library.items.find(i=>i.id===id);if(!work||work.status==='unmarked'||pending.has(id))return;
    pending.add(id);try{const result=await persistWatch(id,{status:'unmarked'},false);if(result&&!result.canceled)toast('已移出个人资料库，关联副本与该作品缓存已清理')}finally{pending.delete(id)}
  },true);
  document.addEventListener('click',async event=>{
    const button=event.target.closest('[data-catalog-login]');if(!button)return;event.preventDefault();event.stopImmediatePropagation();
    button.disabled=true;try{await invoke('catalogLogin');if(state.tab==='catalog')await loadCatalog(true)}catch(error){toast(error.message)}finally{if(button.isConnected)button.disabled=false}
  },true);
  const renderBase=renderCatalogResults;renderCatalogResults=function(){renderBase();sync();
    if(catalogClient.provider==='bangumi'&&catalogClient.error?.includes('登录')&&!$('#catalogResults [data-catalog-login]'))$('#catalogResults .catalog-page-footer')?.insertAdjacentHTML('beforeend','<button class="button secondary" data-catalog-login>登录 Bangumi 后重试</button>');
  };
  window.YingjiSourceOrder={version:'0.4.14',sync};sync();
})();
