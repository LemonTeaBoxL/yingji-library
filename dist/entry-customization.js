'use strict';
(function(){
 let menu=null;
 const close=()=>{menu?.remove();menu=null};
 function syncFormat(){const field=$('#catalogFormat');if(!field)return;const limited=['book','music'].includes(catalogClient.kind);field.disabled=limited;if(limited){catalogClient.format='all';field.value='all'}YingjiMenus.hydrate()}
 const catalogBase=renderCatalog;renderCatalog=function(...args){const result=catalogBase(...args);syncFormat();return result};
 document.addEventListener('change',event=>{if(['catalogKind','catalogProvider'].includes(event.target.id))syncFormat()});
 document.addEventListener('contextmenu',event=>{
  const cover=event.target.closest('[data-thumbnail],.media-cover,.detail-cover');
  const id=cover?.closest('[data-open]')?.dataset.open||(cover?.closest('#sheet .detail-cover')?current?.id:null);
  const work=state.library.items.find(i=>i.id===id&&i.type==='record'&&i.manual===true);if(!work)return;
  event.preventDefault();event.stopImmediatePropagation();close();YingjiMenus.close(true);
  menu=document.createElement('section');menu.className='workspace-popover entry-cover-menu';menu.setAttribute('role','menu');menu.setAttribute('aria-label','个人条目封面');
  menu.innerHTML=`<button role="menuitem" data-cover-action="pick">${svg('image')}自定义封面…</button><button role="menuitem" data-cover-action="reset" ${work.coverId?'':'disabled'}>${svg('refresh')}恢复默认封面</button>`;
  document.body.append(menu);menu.style.left=Math.max(12,Math.min(innerWidth-menu.offsetWidth-12,event.clientX))+'px';menu.style.top=Math.max(12,Math.min(innerHeight-menu.offsetHeight-12,event.clientY))+'px';
  menu.onclick=async actionEvent=>{
   const button=actionEvent.target.closest('[data-cover-action]');if(!button)return;actionEvent.preventDefault();actionEvent.stopPropagation();const reset=button.dataset.coverAction==='reset';close();
   try{await flushPersonalDrafts();const library=await invoke('pickEntryCover',{id,reset});if(!library)return;state.library=library;updateNavigation();
    if(state.tab==='library')renderResults();
    if(!$('#overlay').hidden&&catalogDetailState?.id===id){const scroll=$('#detailScroll')?.scrollTop||0;renderCatalogDetail();if($('#detailScroll'))$('#detailScroll').scrollTop=scroll}
    toast(reset?'已恢复默认封面':'封面已保存到此条目');
   }catch(error){toast(error.message)}
  };
 });
 document.addEventListener('pointerdown',event=>{if(menu&&!menu.contains(event.target))close()},true);
 window.addEventListener('keydown',event=>{if(menu&&event.key==='Escape'){event.preventDefault();event.stopImmediatePropagation();close()}},true);
 mainElement.addEventListener('scroll',close,{passive:true});window.addEventListener('resize',close);
 window.YingjiEntryCustomization={version:'0.4.15'};
})();
