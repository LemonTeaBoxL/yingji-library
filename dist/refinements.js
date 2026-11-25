'use strict';
// Personal materials use a bounded thumbnail wall; hover previews never intercept a drag.
Object.assign(icons,{magnify:'<circle cx="10.5" cy="10.5" r="6.5"/><path d="m15.5 15.5 5 5M10.5 7.5v6m-3-3h6"/>'});
let materialSize=Math.max(100,Math.min(260,Number(localStorage.getItem('yingji-material-size'))||156));
const refineDetail=renderCatalogDetail;
renderCatalogDetail=function(){hideMaterialPreview();refineDetail();const space=$('#sheet .personal-space');if(!space)return;
  const heading=space.querySelector('.materials-heading');heading.insertAdjacentHTML('beforeend',`<label class="material-size-control">缩略图 <input type="range" min="100" max="260" step="4" value="${materialSize}" aria-label="素材缩略图大小"><output>${materialSize}</output></label>`);
  const zone=document.createElement('section');zone.id='personalMaterialDrop';zone.className='personal-material-drop';zone.setAttribute('aria-label','拖入图片或视频到当前条目');
  const hint=space.querySelector('.material-drop-hint'),grid=space.querySelector('.materials-masonry');hint.before(zone);zone.append(hint,grid);grid.setAttribute('aria-label','素材缩略图墙');
  grid.querySelectorAll('.material-tile').forEach(figure=>{const media=figure.querySelector('button[data-personal-image],video'),visual=document.createElement('div');visual.className='material-visual';media.before(visual);visual.append(media);visual.insertAdjacentHTML('beforeend',`<button class="material-magnify" aria-label="预览 ${esc(figure.querySelector('figcaption span').textContent)}">${svg('magnify')}</button>`);
    if(media.tagName==='VIDEO'){media.controls=false;const start=document.createElement('button');start.className='material-video-start';start.setAttribute('aria-label','播放 '+figure.querySelector('figcaption span').textContent);start.innerHTML='<span>'+svg('play')+'</span>';visual.append(start);start.addEventListener('click',async()=>{media.controls=true;start.hidden=true;try{await media.play()}catch(error){media.controls=false;start.hidden=false;toast('视频暂时无法播放，可以用放大预览重新打开。')}});media.addEventListener('play',()=>{start.hidden=true;media.controls=true})}
    const button=visual.querySelector('.material-magnify');button.addEventListener('pointerenter',()=>showMaterialPreview(figure,button));button.addEventListener('pointerleave',hideMaterialPreview);button.addEventListener('focus',()=>showMaterialPreview(figure,button));button.addEventListener('blur',hideMaterialPreview);button.addEventListener('click',()=>{hideMaterialPreview();if(figure.querySelector('[data-personal-image]'))figure.querySelector('[data-personal-image]').click();else openMaterialVideo(figure)});
  });
  heading.querySelector('input').addEventListener('input',e=>{materialSize=Number(e.target.value);e.target.nextElementSibling.textContent=materialSize;localStorage.setItem('yingji-material-size',materialSize);scheduleMaterialLayout()});scheduleMaterialLayout();
};
function layoutMaterialWall(){const grid=$('.materials-masonry');if(!grid)return;const figures=[...grid.querySelectorAll('.material-tile')],sizes=YingjiGallery.layout(figures.map(f=>{const media=f.querySelector('img,video');return parseFloat(media?.style.aspectRatio)||1.5}),grid.clientWidth,materialSize,12);
  figures.forEach((figure,i)=>{const size=sizes[i];figure.style.width=size.width+'px';figure.querySelector('.material-visual')?.style.setProperty('height',size.height+'px');figure.dataset.row=String(size.row)});
}
let previewToken=0,previewClear=0;
const materialPreview=document.createElement('div');materialPreview.className='material-hover-preview';materialPreview.setAttribute('aria-hidden','true');materialPreview.innerHTML='<div class="material-preview-frame"><img alt=""><span></span></div>';document.body.append(materialPreview);
async function showMaterialPreview(figure,button){const token=++previewToken;clearTimeout(previewClear);const media=figure.querySelector('img,video'),name=figure.querySelector('figcaption span').textContent;let src=media.tagName==='VIDEO'?media.poster:media.currentSrc||media.src;
  if(!src)try{src=await invoke('thumbnail',figure.dataset.materialId)}catch{}if(token!==previewToken||!src||!button.isConnected)return;
  const img=materialPreview.querySelector('img');img.alt=name;materialPreview.querySelector('span').textContent=name;img.onload=()=>{if(token===previewToken){materialPreview.classList.add('visible');materialPreview.setAttribute('aria-hidden','false')}};img.onerror=hideMaterialPreview;img.src=src;if(img.complete&&img.naturalWidth)img.onload();
}
function hideMaterialPreview(){previewToken++;materialPreview?.classList.remove('visible');materialPreview?.setAttribute('aria-hidden','true');clearTimeout(previewClear);previewClear=setTimeout(()=>{materialPreview.querySelector('img').removeAttribute('src')},200)}
function openMaterialVideo(figure){const box=document.createElement('div');box.className='image-lightbox material-video-lightbox';box.innerHTML=`<video src="yingji-media://item/${esc(figure.dataset.materialId)}" controls autoplay playsinline></video><button aria-label="关闭视频">${svg('close')}</button>`;box.addEventListener('click',e=>{if(e.target===box||e.target.closest('button')){box.querySelector('video').pause();box.remove()}});document.body.append(box)}
function clearPersonalDrag(){document.querySelector('#personalMaterialDrop')?.classList.remove('drag-active');dragDepth=0;$('#dropZone').hidden=true}
for(const type of ['dragenter','dragover','dragleave','drop'])window.addEventListener(type,e=>{if($('#overlay').hidden||!$('#sheet .personal-space')||!e.dataTransfer?.types?.includes('Files'))return;e.preventDefault();e.stopImmediatePropagation();$('#dropZone').hidden=true;dragDepth=0;hideMaterialPreview();const zone=$('#personalMaterialDrop'),inside=!!zone?.contains(e.target);
  if(type==='drop'){clearPersonalDrag();if(inside&&current)attachPersonal(e.dataTransfer.files).catch(error=>toast(error.message));return}
  if(type==='dragleave'){if(!zone?.contains(e.relatedTarget))zone?.classList.remove('drag-active');return}
  zone?.classList.toggle('drag-active',inside);if(type==='dragover')e.dataTransfer.dropEffect=inside?'copy':'none';
},true);
window.addEventListener('dragend',clearPersonalDrag);window.addEventListener('blur',()=>{clearPersonalDrag();hideMaterialPreview()});document.addEventListener('keydown',e=>{if(e.key==='Escape'){hideMaterialPreview();clearPersonalDrag()}});
document.addEventListener('scroll',()=>{if(!document.activeElement?.matches('.material-magnify'))hideMaterialPreview()},true);
const refineClose=closeSheet;closeSheet=function(){hideMaterialPreview();clearPersonalDrag();refineClose()};
window.YingjiRefinements={layoutMaterialWall,hideMaterialPreview};
if($('#sheet .personal-space'))renderCatalogDetail();

// Keep document order and existing nodes as discovery pages are appended.
let catalogWallFrame=0;
function scheduleCatalogWalls(){if(catalogWallFrame)return;catalogWallFrame=requestAnimationFrame(()=>{catalogWallFrame=0;for(const grid of document.querySelectorAll('.masonry-grid')){const width=grid.clientWidth;if(!width)continue;const target={compact:128,comfortable:172,poster:232}[preferences.density]||172,gap=14,count=Math.max(1,Math.floor((width+gap)/(target+gap))),tileWidth=(width-gap*(count-1))/count,heights=Array(count).fill(0);
    let index=0;for(const card of grid.children){card.style.width=tileWidth+'px';const column=index++%count;card.style.left=(column*(tileWidth+gap))+'px';card.style.top=heights[column]+'px';heights[column]+=card.getBoundingClientRect().height+gap}grid.style.height=Math.max(0,...heights)-gap+'px';grid.dataset.columns=String(count)}
  })}
new MutationObserver(scheduleCatalogWalls).observe(mainElement,{childList:true,subtree:true});
new MutationObserver(scheduleCatalogWalls).observe(document.body,{attributes:true,attributeFilter:['data-density']});
let catalogWallWidth=0;new ResizeObserver(()=>{if(mainElement.clientWidth!==catalogWallWidth){catalogWallWidth=mainElement.clientWidth;scheduleCatalogWalls()}}).observe(mainElement);
document.addEventListener('load',e=>{if(e.target.tagName==='IMG'&&e.target.closest('.masonry-grid'))scheduleCatalogWalls()},true);
scheduleCatalogWalls();
