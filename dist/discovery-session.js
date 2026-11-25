'use strict';
(function(){
  let scene=null,epoch=0;
  const signature=()=>JSON.stringify(['provider','kind','year','quarter','region','sort','query','format','ratedOnly','view','page'].map(key=>catalogClient[key]));
  function capture(){
    if(!$('#catalogResults'))return;const rect=mainElement.getBoundingClientRect();
    const card=[...mainElement.querySelectorAll('[data-catalog-open]')].find(node=>{const r=node.getBoundingClientRect();return r.bottom>rect.top+1&&r.top<rect.bottom});
    scene={signature:signature(),top:mainElement.scrollTop,anchor:card?{id:card.dataset.catalogOpen,offset:card.getBoundingClientRect().top-rect.top}:null,dom:document.createDocumentFragment()};
    masonryObserver?.disconnect();while(mainElement.firstChild)scene.dom.append(mainElement.firstChild);
  }
  function position(saved,token){
    if(token!==epoch||state.tab!=='catalog')return;const card=saved.anchor&&[...mainElement.querySelectorAll('[data-catalog-open]')].find(n=>n.dataset.catalogOpen===saved.anchor.id);
    const top=card?mainElement.scrollTop+card.getBoundingClientRect().top-mainElement.getBoundingClientRect().top-saved.anchor.offset:saved.top;
    mainElement.scrollTop=Math.max(0,top);
  }
  let restoring=null;
  const renderBase=renderCatalog;renderCatalog=function(){
    if(scene&&scene.signature===signature()&&!catalogClient.forceRefresh&&(catalogClient.result||catalogClient.loading||catalogClient.error)){
      restoring=scene;scene=null;mainElement.replaceChildren(restoring.dom);renderCatalogResults();YingjiMenus.hydrate();window.YingjiLiquidGlass?.sync();return;
    }
    scene=null;return renderBase();
  };
  const navigateBase=navigate;navigate=function(route){
    if(route==='catalog'&&state.tab==='catalog')return;
    if(state.tab==='catalog')capture();const token=++epoch;restoring=null;const result=navigateBase(route);
    if(route==='catalog'&&restoring){const saved=restoring;restoring=null;position(saved,token);requestAnimationFrame(()=>{scheduleCatalogWalls();requestAnimationFrame(()=>position(saved,token))})}
    return result;
  };
  // User movement wins over the two-frame layout restoration.
  for(const name of ['wheel','pointerdown','keydown'])mainElement.addEventListener(name,()=>{epoch++},{passive:true});
  window.YingjiDiscoverySession={version:'0.4.15'};
})();
