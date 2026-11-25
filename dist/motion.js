'use strict';
// Occasional surfaces fade; repeated navigation and keyboard actions stay immediate.
(function(){
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');let input='keyboard',clearTimer=0,epoch=0;
  const overlay=$('#overlay'),sheet=$('#sheet');
  function mode(){return preferences.glassMotion===false?'off':reduced.matches?'quiet':'full'}
  function update(){document.body.dataset.appMotion=mode();document.body.dataset.inputMode=input}
  function isAnimated(){return mode()!=='off'&&input!=='keyboard'}
  function beginOpen(){epoch++;clearTimeout(clearTimer);overlay.inert=false;overlay.removeAttribute('aria-hidden')}
  function deferClear(){if(!isAnimated())return false;const token=++epoch;overlay.inert=true;overlay.setAttribute('aria-hidden','true');clearTimeout(clearTimer);clearTimer=setTimeout(()=>{if(epoch===token&&overlay.hidden)sheet.innerHTML=''},mode()==='quiet'?100:170);return true}
  const oldApply=applyPreferences;applyPreferences=function(){oldApply();update()};
  const oldShow=showSheet;showSheet=function(...args){beginOpen();return oldShow(...args)};
  const oldDetail=renderCatalogDetail;renderCatalogDetail=function(...args){if(!overlay.hidden)beginOpen();return oldDetail(...args)};
  new MutationObserver(()=>{if(!overlay.hidden)beginOpen()}).observe(overlay,{attributes:true,attributeFilter:['hidden']});
  window.addEventListener('pointerdown',()=>{input='pointer';update()},{capture:true,passive:true});
  window.addEventListener('pointermove',e=>{if(e.pointerType==='mouse'&&input!=='pointer'){input='pointer';update()}},{capture:true,passive:true});
  window.addEventListener('keydown',()=>{input='keyboard';update()},true);
  reduced.addEventListener('change',update);
  const oldWatch=performWatch;performWatch=async function(id,action){const before=JSON.stringify(state.library.items.find(i=>i.id===id)||{});const result=await oldWatch(id,action);if(isAnimated()&&before!==JSON.stringify(state.library.items.find(i=>i.id===id)||{})){const buttons=document.querySelectorAll('[data-entry-action],[data-catalog-action],[data-detail-action]');for(const button of buttons)if(button.dataset.id===id&&(button.dataset.entryAction||button.dataset.catalogAction||button.dataset.detailAction)===action){const icon=button.querySelector('svg');if(icon)icon.animate([{opacity:.6,transform:'scale(.88)'},{opacity:1,transform:'scale(1)'}],{duration:160,easing:'cubic-bezier(.23,1,.32,1)'})}}return result};
  const oldThumbnail=setThumbnail;setThumbnail=function(node,url){oldThumbnail(node,url);const img=node.querySelector('img');if(!img)return;const reveal=()=>{if(!isAnimated()||!img.isConnected)return;const r=img.getBoundingClientRect();if(r.bottom>0&&r.top<innerHeight)img.animate([{opacity:0},{opacity:1}],{duration:140,easing:'ease-out'})};if(img.complete&&img.naturalWidth)reveal();else img.addEventListener('load',reveal,{once:true})};
  window.YingjiMotion={mode,deferClear,beginOpen,input:()=>input};update();
})();
