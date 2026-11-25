'use strict';
(function(){
 state.materialFilter='all';
 const filterBase=filtered;filtered=function(){const rows=filterBase();return state.materialFilter==='with'&&!(YingjiWorkspace.bypass()&&state.query.trim())?YingjiMaterialFilter.filter(rows,state.library.items,state.collectionMode):rows};
 const libraryBase=renderLibrary;renderLibrary=function(){libraryBase();const filters=$('.library-filters');if(filters){filters.insertAdjacentHTML('beforeend',select('filterMaterials',[['all','全部素材状态'],['with','带有素材的条目']],state.materialFilter||'all'));$('#filterMaterials').setAttribute('aria-label','关联素材筛选');$('#filterMaterials').onchange=e=>{state.materialFilter=e.target.value;state.limit=40;renderResults()};YingjiMenus.hydrate()}};
 const navBase=navigate;navigate=function(route){return navBase(route==='sources'?'all':route)};
 renderSources=function(){navigate('all')};
 $('#refreshTop').setAttribute('aria-label','刷新当前页面');$('#refreshTop').title='刷新当前页面';$('#refreshTop').onclick=()=>document.querySelector('.page-rail [data-page-refresh]')?.click();
 const originalAccept=acceptLibrary;acceptLibrary=function(library){if(!library)return;originalAccept(library);if(!Array.isArray(library.importedIds))return;const added=new Set(library.importedIds),items=library.items.filter(i=>added.has(i.id));navigate(items.some(i=>i.type==='record')?'all':items.some(i=>['image','video'].includes(i.type))?'media':'database');toast('已复制 '+items.filter(i=>i.path).length+' 个文件到资料库，源文件保留')};
 importFolder=async function(){toast('文件夹连接功能已取消，请使用导入文件')};rescan=async function(){document.querySelector('.page-rail [data-page-refresh]')?.click()};
 window.addEventListener('drop',async event=>{if(!event.dataTransfer?.types?.includes('Files'))return;if(!$('#overlay').hidden&&$('#sheet .personal-space'))return;event.preventDefault();event.stopImmediatePropagation();dragDepth=0;$('#dropZone').hidden=true;const files=Array.from(event.dataTransfer.files);if(!files.length)return;try{if(!$('#overlay').hidden&&current?.type==='record'){await attachPersonal(files)}else acceptLibrary(await invoke('importDropped',files))}catch(error){toast(error.message)}},true);
 window.YingjiOwnedLibrary={version:'0.4.15'};if(state.tab==='sources')navigate('all');else if(state.tab==='library')renderLibrary();
})();
