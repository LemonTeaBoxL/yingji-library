const os=require('node:os');
const applied=new WeakMap();
function supported(platform=process.platform,release=os.release()){return platform==='win32'&&Number(release.split('.')[2])>=22621}
function pure(){return false}
function backdrop(p){return supported()&&p.interfaceStyle==='liquid'&&['desktop','transparent'].includes(p.backgroundMode)}
function options(p){return{transparent:false,resizable:true,maximizable:true,thickFrame:true,backgroundMaterial:backdrop(p)?'acrylic':'none'}}
function apply(win,p,opaque){if(!win||win.isDestroyed())return false;const desktop=backdrop(p),color=desktop?'#00000000':opaque,material=desktop?'acrylic':'none',last=applied.get(win);if(last?.color===color&&last?.material===material)return false;if(last?.color!==color)win.setBackgroundColor(color);try{if(last?.material!==material)win.setBackgroundMaterial(material);applied.set(win,{color,material})}catch{win.setBackgroundColor(opaque);applied.delete(win)}return false}
module.exports={pure,backdrop,options,apply,supported};
