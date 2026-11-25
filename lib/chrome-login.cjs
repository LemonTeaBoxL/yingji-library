'use strict';
const http=require('node:http'),crypto=require('node:crypto'),fs=require('node:fs/promises'),path=require('node:path');
const HOSTS=['bangumi.tv','bgm.tv','chii.in'];
const extensionOrigin=value=>/^chrome-extension:\/\/[a-p]{32}$/.test(value||'');
function validate(payload){
 if(!payload||!HOSTS.includes(payload.host)||!Array.isArray(payload.cookies)||!payload.cookies.length||payload.cookies.length>120)throw Error('请选择已登录的 Bangumi 网站');
 const userAgent=String(payload.userAgent||'');if(userAgent.length>512||/[\r\n]/.test(userAgent))throw Error('浏览器信息无效');
 const cookies=new Map();for(const c of payload.cookies){
  if(!c||String(c.domain||'').replace(/^\./,'')!==payload.host||c.partitionKey)throw Error('仅接收所选 Bangumi 网站的登录信息');
  if(typeof c.name!=='string'||!c.name||c.name.length>256||/[\s;=\r\n]/.test(c.name)||typeof c.value!=='string'||c.value.length>8192||/[\r\n]/.test(c.value))throw Error('Cookie 格式无效');
  const p=String(c.path||'/');if(!p.startsWith('/')||p.length>2048||/[\r\n]/.test(p))throw Error('Cookie 路径无效');
  if(c.expirationDate!==undefined&&(!Number.isFinite(c.expirationDate)||c.expirationDate<Date.now()/1000))continue;
  const item={url:'https://'+payload.host+p,name:c.name,value:c.value,path:p,secure:!!c.secure,httpOnly:!!c.httpOnly};
  if(!c.hostOnly)item.domain=c.domain;if(c.expirationDate!==undefined)item.expirationDate=c.expirationDate;
  if(['unspecified','no_restriction','lax','strict'].includes(c.sameSite))item.sameSite=c.sameSite;
  cookies.set(c.name+'\n'+c.domain+'\n'+p,item);
 }
 if(!cookies.size)throw Error('登录信息已过期，请先在 Chrome 中重新登录');return {host:payload.host,userAgent,cookies:[...cookies.values()]};
}
function createChromeLogin({root,getSession,verify=async()=>false,canImport=()=>true,track=async p=>p}){
 let profile={host:'bangumi.tv',userAgent:''},server,token='',expires=0,stage='idle',message='',imported=0,used=false,timer;
 const file=path.join(root,'bangumi-browser.json');
 const ready=fs.readFile(file,'utf8').then(s=>{const p=JSON.parse(s);if(HOSTS.includes(p.host)&&typeof p.userAgent==='string'&&p.userAgent.length<=512&&!/[\r\n]/.test(p.userAgent))profile={host:p.host,userAgent:p.userAgent}}).catch(()=>{});
 const status=()=>({stage,message,host:profile.host,cookieCount:imported,expires});
 async function stop(){if(stage==='importing')return status();clearTimeout(timer);token='';used=true;if(server){const old=server;server=null;old.close();old.closeIdleConnections?.()}if(stage==='waiting')stage='idle';return status()}
 async function start(){await ready;if(stage==='importing')throw Error('正在同步，请稍候');if(stage==='waiting'&&server&&Date.now()<expires)return {...status(),code:'YJ1-'+server.address().port+'-'+token};await stop();token=crypto.randomBytes(32).toString('base64url');expires=Date.now()+10*60000;stage='waiting';message='等待 Chrome 扩展同步';used=false;imported=0;
  server=http.createServer(async(req,res)=>{
   const origin=req.headers.origin;if(!extensionOrigin(origin)){res.writeHead(403).end();return}
   res.setHeader('Access-Control-Allow-Origin',origin);res.setHeader('Vary','Origin');res.setHeader('Cache-Control','no-store');
   if(req.method==='OPTIONS'){res.setHeader('Access-Control-Allow-Methods','POST');res.setHeader('Access-Control-Allow-Headers','Authorization, Content-Type');res.setHeader('Access-Control-Allow-Private-Network','true');res.writeHead(204).end();return}
   const provided=String(req.headers.authorization||'').replace(/^Bearer /,'');const expected=Buffer.from(token),given=Buffer.from(provided);
   if(req.method!=='POST'||req.url!=='/v1/bangumi-session'||Date.now()>expires||used||!expected.length||given.length!==expected.length||!crypto.timingSafeEqual(given,expected)){res.writeHead(403).end();return}
   if(!String(req.headers['content-type']||'').startsWith('application/json')){res.writeHead(415).end();return}
   let body='';try{for await(const chunk of req){body+=chunk;if(Buffer.byteLength(body)>128*1024)throw Error('登录信息过大')}const candidate=validate(JSON.parse(body));if(used||Date.now()>expires||!canImport())throw Error('连接码已失效或资料库正忙');used=true;stage='importing';message='正在同步并检查源站登录…';await track((async()=>{const session=getSession();
    const previous=await session.cookies.get({domain:candidate.host});const applied=[];
    try{for(const cookie of candidate.cookies){await session.cookies.set(cookie);applied.push(cookie)}await session.cookies.flushStore()}catch{for(const c of applied){const old=previous.find(p=>p.name===c.name&&p.path===c.path&&String(p.domain).replace(/^\./,'')===candidate.host);try{if(old)await session.cookies.set(validate({host:candidate.host,cookies:[old]}).cookies[0]);else await session.cookies.remove(c.url,c.name)}catch{}}throw Error('无法保存登录信息，请重试')}
    profile={host:candidate.host,userAgent:candidate.userAgent};await fs.mkdir(root,{recursive:true});await require('./portable-store.cjs').atomic(file,profile);imported=candidate.cookies.length;
    let verified=false;try{verified=await verify(profile)}catch{}stage=verified?'connected':'unverified';message=verified?'已复用 Chrome 登录状态':'已同步，但源站仍未确认登录；请检查所选网站是否已在 Chrome 登录。';
    })());res.writeHead(200,{'Content-Type':'application/json'}).end(JSON.stringify({verified:stage==='connected',message,host:profile.host}));
   }catch{if(stage==='importing'){stage='error';message='同步未完成，请生成新连接码后重试'}res.writeHead(400,{'Content-Type':'application/json'}).end(JSON.stringify({message:'无法接收登录信息；请确认网站与连接码，然后重试。'}))}
  });server.headersTimeout=10000;server.requestTimeout=15000;await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',resolve)});timer=setTimeout(()=>{if(stage==='waiting'){stage='expired';message='连接码已过期'}stop()},10*60000);timer.unref();return {...status(),code:'YJ1-'+server.address().port+'-'+token};
 }
 return {ready,start,status,stop,get profile(){return profile}};
}
module.exports={createChromeLogin,validate,HOSTS,extensionOrigin};
