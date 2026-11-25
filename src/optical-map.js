// Rounded-rectangle normal and magnification maps for the Electron backdrop pass.
// Geometry is cached; pointer and slider changes only update filter uniforms.
const cache=new Map();
export function opticalMaps(width,height,radius){
  const key=[Math.round(width),Math.round(height),Math.round(radius)].join(':');
  if(cache.has(key)){const value=cache.get(key);cache.delete(key);cache.set(key,value);return value}
  const ratio=Math.min(1,768/Math.max(width,height)),w=Math.max(2,Math.round(width*ratio)),h=Math.max(2,Math.round(height*ratio));
  const canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;const ctx=canvas.getContext('2d'),rim=ctx.createImageData(w,h),zoom=ctx.createImageData(w,h),mask=ctx.createImageData(w,h);
  const r=Math.min(radius,width/2,height/2),bevel=Math.min(8,Math.max(5,Math.min(width,height)*.018)),max=Math.max(width,height);
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){
    const px=(x+.5)/ratio-width/2,py=(y+.5)/ratio-height/2,qx=Math.abs(px)-width/2+r,qy=Math.abs(py)-height/2+r;
    const ox=Math.max(qx,0),oy=Math.max(qy,0),length=Math.hypot(ox,oy),distance=-(Math.min(Math.max(qx,qy),0)+length-r);
    let nx=0,ny=0;if(length>0){nx=ox/length*Math.sign(px);ny=oy/length*Math.sign(py)}else if(qx>qy)nx=Math.sign(px);else ny=Math.sign(py);
    const edge=Math.max(0,Math.min(1,1-distance/bevel)),bend=Math.sin(edge*Math.PI*.82)*.46;
    const i=(y*w+x)*4;rim.data[i]=Math.round(127.5+nx*bend*255);rim.data[i+1]=128;rim.data[i+2]=Math.round(127.5+ny*bend*255);rim.data[i+3]=255;
    mask.data[i]=255;mask.data[i+1]=255;mask.data[i+2]=255;mask.data[i+3]=Math.round(Math.max(0,Math.min(1,(bevel-distance)/2))*255);
    zoom.data[i]=Math.round(127.5+px/max*255);zoom.data[i+1]=128;zoom.data[i+2]=Math.round(127.5+py/max*255);zoom.data[i+3]=255;
  }
  ctx.putImageData(rim,0,0);const rimUrl=canvas.toDataURL();ctx.putImageData(zoom,0,0);const zoomUrl=canvas.toDataURL();ctx.putImageData(mask,0,0);const value={rim:rimUrl,zoom:zoomUrl,mask:canvas.toDataURL(),max,bevel};cache.set(key,value);if(cache.size>12)cache.delete(cache.keys().next().value);return value;
}
