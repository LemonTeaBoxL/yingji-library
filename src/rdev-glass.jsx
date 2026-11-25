import React from 'react';
import {createRoot} from 'react-dom/client';
import LiquidGlass from 'liquid-glass-react';
import {opticalMaps} from './optical-map.js';

// The upstream component owns only a background surface. Application controls stay in their original DOM.
const surfaces=new Map();
let config={enabled:true,frost:18,white:38,refraction:58,magnification:104,motion:true,dark:false},frame=0,sequence=0;
const neutralPointer={x:0,y:0};
const selector='.sidebar,.catalog-toolbar,.glass-preview-tile,.feature-detail';
function MaterialReady({entry}){React.useLayoutEffect(()=>{if(!entry.node.hidden&&entry.host.isConnected)entry.host.dataset.materialReady='true'});return null}
function renderSurface(entry){
  const {host,root}=entry,width=host.clientWidth,height=host.clientHeight;
  entry.width=width;entry.height=height;
  entry.node.hidden=width<2||height<2;
  if(entry.diffusion)entry.diffusion.hidden=entry.node.hidden;
  if(entry.node.hidden){delete host.dataset.materialReady;return;}
  const radius=parseFloat(getComputedStyle(host).borderTopLeftRadius)||0;
  const sizeKey=`${Math.round(width)}:${Math.round(height)}:${radius}`;
  entry.width=width;entry.height=height;
  entry.node.style.width=width+'px';entry.node.style.height=height+'px';entry.node.style.borderRadius=radius+'px';position(entry);
  const maps=opticalMaps(width,height,radius);
  if(entry.diffusion){const plate=entry.diffusion,inset=maps.bevel;plate.style.width=Math.max(0,width-inset*2)+'px';plate.style.height=Math.max(0,height-inset*2)+'px';plate.style.borderRadius=Math.max(0,radius-inset)+'px';plate.style.setProperty('--reading-frost',config.frost+'px');plate.style.setProperty('--reading-fill',config.dark?'18 25 44':'247 250 255');plate.style.setProperty('--reading-opacity',String(config.dark ? .64+config.white*.0024 : .44+config.white*.0048));entry.inset=inset;position(entry)}
  entry.node.style.setProperty('--rdev-optics',`url("#${entry.id}")`);
  entry.node.style.setProperty('--glass-caustic',String(.18+config.refraction*.004));
  root.render(<><svg className="rdev-optical-defs" aria-hidden="true" width="0" height="0"><defs>
    <filter id={entry.id} x="0" y="0" width="100%" height="100%" colorInterpolationFilters="sRGB">
      <feGaussianBlur in="SourceGraphic" stdDeviation={config.frost} edgeMode="duplicate" result="FROST" />
      <feImage href={maps.zoom} x="0" y="0" width={width} height={height} preserveAspectRatio="none" result="ZOOM_MAP" />
      <feDisplacementMap data-optic-zoom="true" in="FROST" in2="ZOOM_MAP" scale={-maps.max*(1-100/config.magnification)} xChannelSelector="R" yChannelSelector="B" result="LENS" />
      <feImage href={maps.rim} x="0" y="0" width={width} height={height} preserveAspectRatio="none" result="RIM_MAP" />
      <feDisplacementMap data-optic-refraction="true" in="SourceGraphic" in2="RIM_MAP" scale={-config.refraction*.5} xChannelSelector="R" yChannelSelector="B" result="EDGE" />
      <feImage href={maps.mask} x="0" y="0" width={width} height={height} preserveAspectRatio="none" result="EDGE_MASK" />
      <feComposite in="EDGE" in2="EDGE_MASK" operator="in" result="EDGE_ONLY" />
      <feComposite in="LENS" in2="EDGE_MASK" operator="out" result="CENTER_ONLY" />
      <feMerge><feMergeNode in="CENTER_ONLY"/><feMergeNode in="EDGE_ONLY"/></feMerge>
    </filter>
  </defs></svg><LiquidGlass key={sizeKey} className="rdev-shell" mode="standard"
    displacementScale={config.refraction*2} blurAmount={(config.frost-4)/32}
    saturation={140} aberrationIntensity={2}
    elasticity={0} overLight={false} cornerRadius={radius} padding="0px"
    {...(config.motion?{mouseContainer:entry.mouseContainer}:{globalMousePos:neutralPointer,mouseOffset:neutralPointer})} style={{position:'absolute',top:'50%',left:'50%',width,height}}>
    <span className="rdev-size" style={{display:'block',width,height}} />
  </LiquidGlass><MaterialReady entry={entry}/></>);
}
function position(entry){const rect=entry.host.getBoundingClientRect(),ownerRect=entry.owner.getBoundingClientRect(),offset=entry.owner===document.body?{left:0,top:0}:{left:ownerRect.left+entry.owner.clientLeft,top:ownerRect.top+entry.owner.clientTop},left=rect.left+entry.host.clientLeft-offset.left,top=rect.top+entry.host.clientTop-offset.top;entry.node.style.left=left+'px';entry.node.style.top=top+'px';if(entry.diffusion){entry.diffusion.style.left=(left+(entry.inset||0))+'px';entry.diffusion.style.top=(top+(entry.inset||0))+'px'}}
function add(host){
  if(surfaces.has(host))return;
  const modal=host.matches('.feature-detail'),owner=host.closest('.glass-material-preview')||document.body;
  const diffusion=modal?document.createElement('div'):null;if(diffusion){diffusion.className='rdev-reading-diffusion';diffusion.inert=true;diffusion.setAttribute('aria-hidden','true');owner.append(diffusion)}
  const node=document.createElement('div');node.className='rdev-react-root '+(owner===document.body?'rdev-body-surface':'rdev-local-surface')+(modal?' rdev-modal-surface':'');node.setAttribute('aria-hidden','true');node.inert=true;owner.append(node);host.classList.add('rdev-glass-host');host.dataset.glassEngine='liquid-glass-react';
  const entry={host,node,diffusion,owner,id:'yingji-optic-'+(++sequence),root:createRoot(node),mouseContainer:{current:host},width:0,height:0};
  entry.observer=new ResizeObserver(()=>{if(entry.node.hidden!==(host.clientWidth<2||host.clientHeight<2)||Math.abs(host.clientWidth-entry.width)>.5||Math.abs(host.clientHeight-entry.height)>.5)renderSurface(entry)});
  surfaces.set(host,entry);entry.observer.observe(host);renderSurface(entry);
}
function remove(host,entry){entry.observer.disconnect();entry.root.unmount();entry.node.remove();entry.diffusion?.remove();host.classList.remove('rdev-glass-host');delete host.dataset.glassEngine;delete host.dataset.materialReady;surfaces.delete(host)}
function sync(){frame=0;for(const[host,entry]of surfaces)if(!host.isConnected||!host.matches(selector)||!config.enabled)remove(host,entry);else{host.classList.add('rdev-glass-host');if(entry.node.hidden!==(host.clientWidth<2||host.clientHeight<2)||entry.width!==host.clientWidth||entry.height!==host.clientHeight)renderSurface(entry);else position(entry)}if(!config.enabled)return;
  for(const host of document.querySelectorAll(selector))if(!host.closest('.rdev-react-root'))add(host);
}
function schedule(){if(!frame)frame=requestAnimationFrame(sync)}
function configure(options){config={...config,...options};document.body.dataset.glassEngine=config.enabled?'rdev':'classic';for(const entry of surfaces.values())renderSurface(entry);schedule()}
new MutationObserver(records=>{if(records.some(r=>!r.target.closest?.('.rdev-react-root')))schedule()}).observe(document.body,{childList:true,subtree:true});
document.addEventListener('scroll',schedule,true);window.addEventListener('resize',schedule);
window.YingjiLiquidGlass={configure,sync:schedule,version:'1.1.1',reactVersion:React.version,surfaceCount:()=>surfaces.size,surfaceFor:host=>surfaces.get(host)?.node};
let lightFrame=0,lightEvent;
document.addEventListener('pointermove',event=>{if(!config.motion)return;lightEvent=event;if(lightFrame)return;lightFrame=requestAnimationFrame(()=>{lightFrame=0;const host=lightEvent.target.closest?.(selector),entry=surfaces.get(host);if(!entry)return;const r=host.getBoundingClientRect(),x=lightEvent.clientX-r.left,y=lightEvent.clientY-r.top;entry.node.style.setProperty('--glass-light-angle',(Math.atan2(y-r.height/2,x-r.width/2)*180/Math.PI+90)+'deg');entry.node.style.setProperty('--glass-light-x',x/r.width*100+'%')})},{passive:true});
