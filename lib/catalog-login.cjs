'use strict';
const allowed=url=>{try{const u=new URL(url);return u.protocol==='https:'&&['bangumi.tv','bgm.tv','chii.in'].includes(u.hostname)&&!u.username&&!u.password}catch{return false}};
const imageAddress=url=>{try{const u=new URL(url);return u.protocol==='https:'&&!u.username&&!u.password?u.href:null}catch{return null}};
const escape=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function imageDocument(data){return `<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src data:; style-src 'unsafe-inline'"><title>图片原图 · 映迹</title><style>:root{color-scheme:light dark}*{box-sizing:border-box}body{margin:0;padding:22px;font:14px/1.6 -apple-system,BlinkMacSystemFont,"Segoe UI","Microsoft YaHei",sans-serif;background:light-dark(#f1f4fa,#1c2230);color:light-dark(#34415b,#e0e6f1)}h1{margin:0 0 6px;font-size:18px;font-weight:550}p{margin:0 0 18px;opacity:.7;font-size:12px}.image{display:grid;place-items:center;min-height:170px;overflow:auto;padding:22px;border-radius:18px;background:light-dark(#ffffff,#111827);border:1px solid #8898b533}img{display:block;max-width:100%;height:auto;image-rendering:auto}footer{margin-top:14px;font-size:12px;opacity:.7}</style><h1>当前图片</h1><p>从当前页面已加载的图像生成，不重新请求验证码。</p><div class="image"><img src="${escape(data)}" alt="当前页面图片"></div><footer>右键可复制图片或原始图片地址；关闭此窗口后继续填写。</footer></html>`}
// Read decoded pixels already in the page, without fetching a new CAPTCHA image.
async function currentImage(contents,params){
  const frame=params.frame||contents;
  const code=`(()=>{const url=${JSON.stringify(String(params.srcURL||''))};const at=document.elementFromPoint(${Math.trunc(params.x)||0},${Math.trunc(params.y)||0});const image=at?.closest?.('img')||[...document.images].find(i=>i.currentSrc===url||i.src===url);if(!image?.complete||!image.naturalWidth||!image.naturalHeight||image.naturalWidth*image.naturalHeight>16000000)return null;const canvas=document.createElement('canvas');canvas.width=image.naturalWidth;canvas.height=image.naturalHeight;canvas.getContext('2d').drawImage(image,0,0);return canvas.toDataURL('image/png')})()`;
  let timer;try{const result=await Promise.race([frame.executeJavaScript(code),new Promise(resolve=>{timer=setTimeout(()=>resolve(null),2500)})]);return typeof result==='string'&&result.length<=24*1024*1024&&/^data:image\/png;base64,[A-Za-z0-9+/=]+$/.test(result)?result:null}catch{return null}finally{clearTimeout(timer)}
}
function attachImageMenu(owner,{BrowserWindow,Menu,clipboard,dialog,originalUrl,preview=true}){
  if(!Menu||!clipboard)return;
  owner.webContents.on('context-menu',(_event,params)=>{
    const items=[],url=imageAddress(originalUrl||params.srcURL),contents=owner.webContents;
    if(params.mediaType==='image'){
      items.push({label:'复制图片地址',enabled:!!url,click:()=>{if(url)clipboard.writeText(url)}});
      items.push({label:'复制图片',enabled:!!params.hasImageContents,click:()=>{if(!owner.isDestroyed())contents.copyImageAt(params.x,params.y)}});
      if(preview)items.push({label:'在小窗口查看原图',enabled:!!params.hasImageContents,click:async()=>{
        const data=await currentImage(contents,params);if(owner.isDestroyed())return;
        if(!data){if(dialog)await dialog.showMessageBox(owner,{type:'info',title:'图片预览',message:'这张图片无法直接生成预览。',detail:'可以使用右键菜单的“复制图片”或“复制图片地址”。',buttons:['知道了']});return}
        const viewer=new BrowserWindow({title:'图片原图 · 映迹',width:600,height:400,minWidth:360,minHeight:280,parent:owner,autoHideMenuBar:true,webPreferences:{session:contents.session,nodeIntegration:false,contextIsolation:true,sandbox:true}});
        viewer.webContents.setWindowOpenHandler(()=>({action:'deny'}));viewer.webContents.on('will-navigate',e=>e.preventDefault());
        attachImageMenu(viewer,{BrowserWindow,Menu,clipboard,dialog,originalUrl:url,preview:false});
        owner.once('closed',()=>{if(!viewer.isDestroyed())viewer.close()});
        await viewer.loadURL('data:text/html;charset=utf-8,'+encodeURIComponent(imageDocument(data))).catch(()=>{});
      }});
      items.push({type:'separator'});
    }
    if(params.isEditable){items.push({role:'undo',label:'撤销'},{role:'redo',label:'重做'},{type:'separator'},{role:'cut',label:'剪切',enabled:!!params.editFlags?.canCut},{role:'copy',label:'复制',enabled:!!params.editFlags?.canCopy},{role:'paste',label:'粘贴',enabled:!!params.editFlags?.canPaste},{role:'selectAll',label:'全选'})}
    else if(params.selectionText)items.push({role:'copy',label:'复制'});
    if(items.at(-1)?.type==='separator')items.pop();if(items.length)Menu.buildFromTemplate(items).popup({window:owner});
  });
}
function createCatalogLogin({BrowserWindow,parent,Menu,clipboard,dialog,getProfile=()=>({host:'bangumi.tv'})}){
  let window=null,completion=null;
  return function(){
    if(window&&!window.isDestroyed()){window.focus();return completion}
    const host=parent();window=new BrowserWindow({title:'登录 Bangumi · 图片可右键查看／复制',width:960,height:760,minWidth:620,minHeight:500,parent:host,autoHideMenuBar:true,webPreferences:{...(host?.webContents?.session?{session:host.webContents.session}:{}),nodeIntegration:false,contextIsolation:true,sandbox:true}});
    const current=window,session=current.webContents.session;
    completion=new Promise(resolve=>current.once('closed',async()=>{window=null;completion=null;try{await session?.cookies?.flushStore()}catch{}resolve(true)}));
    // The website handles credentials directly in the same persistent session as net.fetch.
    window.webContents.setWindowOpenHandler(()=>({action:'deny'}));
    for(const name of ['will-navigate','will-redirect'])window.webContents.on(name,(event,url)=>{if(!allowed(url))event.preventDefault()});
    attachImageMenu(window,{BrowserWindow,Menu,clipboard,dialog});
    const profile=getProfile();if(profile.userAgent)window.webContents.setUserAgent(profile.userAgent);window.loadURL('https://'+(['bangumi.tv','bgm.tv','chii.in'].includes(profile.host)?profile.host:'bangumi.tv')+'/login').catch(()=>{});return completion;
  };
}
module.exports={createCatalogLogin,allowed,attachImageMenu,currentImage,imageAddress,imageDocument};
