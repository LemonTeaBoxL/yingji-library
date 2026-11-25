const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs/promises'),path=require('node:path');
const {Catalog}=require('../lib/catalog.cjs'),{readResponse}=require('../lib/catalog-request.cjs'),{parseBrowser}=require('../lib/bangumi-browser.cjs');
const delay=ms=>new Promise(resolve=>setTimeout(resolve,ms));

test('catalog deadline bounds an ignored abort during connection and body read',async()=>{
  let signal;
  await assert.rejects(readResponse(async(_url,args)=>{signal=args.signal;return new Promise(()=>{})},'https://bangumi.tv',{},r=>r.text(),25),{code:'CATALOG_TIMEOUT'});
  assert(signal.aborted);
  await assert.rejects(readResponse(async()=>({text:()=>new Promise(()=>{})}),'https://bangumi.tv',{},r=>r.text(),25),/超时/);
});

test('timed-out browser pages release pending and do not cache late body data',async()=>{
  const dir=path.join(__dirname,'../work/catalog-timeout412-'+Date.now());let finish,called=0;
  const html='<ul id="browserItemList"><li id="item_1"><h3><a>可重试作品</a></h3><p class="info tip">2026年10月3日</p></li></ul>';
  const c=new Catalog({cacheDir:dir,requestTimeoutMs:25,request:async()=>{called++;return{ok:true,text:()=>called===1?new Promise(resolve=>{finish=resolve}):Promise.resolve(html)}}});
  await assert.rejects(c.browse({sourceOrder:true,year:'2026'}),/超时/);assert.equal(c.pending.size,0);
  finish(html);await delay(30);assert.deepEqual(await fs.readdir(dir).catch(()=>[]),[]);
  const next=await c.browse({sourceOrder:true,year:'2026'});assert.equal(next.items[0].id,'bgm-1');assert.equal(called,2);assert.equal(c.pending.size,0);
});

test('official API JSON body has the same bounded timeout and cache fallback',async()=>{
  const dir=path.join(__dirname,'../work/catalog-json412-'+Date.now());let stuck=false;
  const c=new Catalog({cacheDir:dir,requestTimeoutMs:25,request:async()=>({ok:true,json:()=>stuck?new Promise(()=>{}):Promise.resolve({total:1,data:[{id:1,type:2,name:'已缓存作品'}]})})});
  await c.browse({year:'2026'});stuck=true;
  const cached=await c.browse({year:'2026',refresh:true});assert.equal(cached.offline,true);assert.equal(cached.items.length,1);assert.equal(c.pending.size,0);
  await assert.rejects(c.browse({year:'2025'}),/超时/);assert.equal(c.pending.size,0);
});

test('browser pagination terminates at the supported page ceiling',()=>{
  const html='<ul id="browserItemList"></ul><div class="page_inner"><a href="?page=1001">下一页</a><span>( 1000 / 1310 )</span></div>';
  assert.equal(parseBrowser(html,{page:1000}).hasMore,false);
  assert.equal(parseBrowser(html,{page:999}).hasMore,true);
});
