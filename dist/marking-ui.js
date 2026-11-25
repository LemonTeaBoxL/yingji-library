'use strict';
(function(){
 const views=['all','watched','pending','watching'];
 const base=renderLibrary;renderLibrary=function(){base();if(!views.includes(state.status)){state.status='all';if($('#filterStatus'))$('#filterStatus').value='all';renderResults();YingjiMenus.hydrate()}if(state.collectionMode!=='watched')return;
   if(!views.includes(state.markedView))state.markedView='all';state.status=state.markedView;
   const select=$('#filterStatus');if(select){select.value=state.status;select.onchange=e=>{state.status=e.target.value;state.markedView=views.includes(state.status)?state.status:'all';renderLibrary();$('#filterStatus')?.closest('.select-wrap').querySelector('.select-trigger')?.focus({preventScroll:true})}}
   document.querySelectorAll('[data-marked-view]').forEach(button=>button.setAttribute('aria-selected',String(button.dataset.markedView===state.markedView)));
   renderResults();YingjiMenus.hydrate();
 };
 if(state.tab==='library')renderLibrary();window.YingjiMarkingUI={version:'0.4.14'};
})();
