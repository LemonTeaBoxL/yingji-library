const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs/promises'),path=require('node:path');
const {Catalog}=require('../lib/catalog.cjs'),{parseBrowser,browserUrl}=require('../lib/bangumi-browser.cjs'),{allowed}=require('../lib/catalog-login.cjs');
const row=(id,title='作品 &amp; 标题',date='2024年4月3日')=>`<li id="item_${id}" class="item"><a href="/subject/${id}"><img src="//lain.bgm.tv/cover/${id}.jpg"></a><div class="inner"><h3><a href="/subject/${id}">${title}</a><small>Original &#38; title</small></h3><span class="rank"><small>Rank </small>12</span><p class="info tip">12话 / ${date} / 作者甲</p><p class="rateInfo"><small class="fade">8.4</small><span class="tip_j">(1,240人评分)</span></p></div></li>`;
const page=(ids,next=2)=>`<ul id="browserItemList">${ids.map(i=>row(i)).join('')}</ul><div class="page_inner"><strong class="p_cur">1</strong>${next?`<a href="?sort=title&amp;page=${next}">下一页</a>`:''}<span class="p_edge">( 1 / ${next||1} )</span></div>`;
test('Bangumi browser parser keeps upstream order, original metadata and pagination',()=>{
 const p=parseBrowser(page([93,12,5]),{sort:'title'});assert.deepEqual(p.items.map(i=>i.id),['bgm-93','bgm-12','bgm-5']);assert.equal(p.items[0].title,'作品 & 标题');assert.equal(p.items[0].original,'Original & title');assert.equal(p.items[0].date,'2024-04-03');assert.equal(p.items[0].author,'作者甲');assert.equal(p.items[0].sourceVotes,1240);assert.equal(p.items[0].eps,12);assert.equal(p.items[0].sourceScore,8.4);assert.equal(p.items[0].rank,12);assert.equal(p.items[0].coverUrl,'https://lain.bgm.tv/cover/93.jpg');assert.equal(p.hasMore,true);assert.equal(p.total,null);assert.equal(parseBrowser(page([93],0)).hasMore,false);
 const filtered=parseBrowser(`<ul id="browserItemList">${row(1,'旧作品','1970年4月3日')+row(2,'冬季','2024年1月3日')}</ul><div class="page_inner"><a href="?page=2">下一页</a></div>`,{year:'2024',quarter:2});assert.equal(filtered.items.length,0);assert.equal(filtered.hasMore,true);
});
test('nested collection menus do not truncate works or hide unrated personal records',()=>{
 const withMenu=id=>row(id,'非个人库作品 '+id,'2026年10月3日').replace('<div class="inner">','<div class="inner"><ul class="collect-menu"><li>看过<ul><li>操作</li></ul></li><li>待看</li></ul>');
 const html='<ul><li id="item_999"><h3><a>列表外作品</a></h3></li></ul><ul id="browserItemList">'+withMenu(93)+row(12,'已缓存作品','2026年1月3日')+withMenu(5)+'<!-- <li id="item_100">注释</li> --><script>const example="<li id=\"item_101\">"</script></ul>';
 const p=parseBrowser(html,{year:'2026',quarter:'all'});assert.deepEqual(p.items.map(i=>i.id),['bgm-93','bgm-12','bgm-5']);assert.equal(p.sourceItemCount,3);assert.equal(p.items.filter(i=>i.sourceScore>0).length,3);assert.equal(p.browserParser,3);
 assert.deepEqual(parseBrowser(html,{year:'2026',quarter:4}).items.map(i=>i.id),['bgm-93','bgm-5']);
});
test('browser parser cache revision reloads old incomplete page caches',async()=>{
 const crypto=require('node:crypto'),{options}=require('../lib/bangumi-browser.cjs');const dir=path.join(__dirname,'../work/catalog-cache-revision413-'+Date.now());await fs.mkdir(dir,{recursive:true});
 const key=JSON.stringify({browser:2,host:'bangumi.tv',...options({year:'2026'})}),file=path.join(dir,crypto.createHash('sha256').update(key).digest('hex')+'.json');await fs.writeFile(file,JSON.stringify({time:Date.now(),data:{items:[{id:'bgm-12'}],hasMore:true,page:1}}));
 let requests=0;const c=new Catalog({cacheDir:dir,request:async()=>{requests++;return{ok:true,text:async()=>page([93,12,5])}}});
 const r=await c.browse({sourceOrder:true,year:'2026'});assert.equal(requests,1);assert.equal(r.items.length,3);await c.browse({sourceOrder:true,year:'2026'});assert.equal(requests,1);assert.equal(JSON.parse(await fs.readFile(file)).data.items.length,1);
});
test('website URLs encode filters and all five sorts as distinct source requests',async()=>{
 const urls=[],dir=path.join(__dirname,'../work/catalog-browser-'+Date.now()),c=new Catalog({cacheDir:dir,request:async url=>{urls.push(url);const s=new URL(url).searchParams.get('sort');return {ok:true,text:async()=>page(s==='rank'?[7,2]:s==='trends'?[2,7]:s==='collects'?[9,7]:s==='date'?[10,7]:[4,7])}}});
 const expected={rank:7,trends:2,collects:9,date:10,title:4};for(const [sort,id]of Object.entries(expected)){const r=await c.browse({sourceOrder:true,sort,year:'2024'});assert.equal(r.items[0].providerId,id);assert.equal(new URL(urls.at(-1)).searchParams.get('sort'),sort)}
 await c.browse({sourceOrder:true,sort:'rank',year:'2024'});assert.equal(urls.length,5);await c.browse({sourceOrder:true,sort:'rank',year:'2024',page:2});assert.equal(new URL(urls.at(-1)).searchParams.get('page'),'2');assert.equal(urls.length,6);
 const u=new URL(browserUrl({kind:'anime-film',year:'2024',region:'JP',sort:'collects',page:2}));assert.equal(decodeURIComponent(u.pathname),'/anime/browser/日本/movie/airtime/2024');assert.equal(u.searchParams.get('sort'),'collects');assert.equal(new URL(browserUrl({kind:'game',sort:'trends'})).pathname,'/game/browser/');assert.equal(new URL(browserUrl({kind:'movie'})).pathname,'/real/browser/movie');assert.throws(()=>browserUrl({year:'1900'}));
});
test('login and changed-site pages fail visibly rather than caching empty success',async()=>{
 const login='<h2>呜咕，出错了</h2><p>抱歉，当前操作需要您 <a href="/login">登录</a> 后才能继续进行</p>';assert.throws(()=>parseBrowser(login),/需要登录/);assert.throws(()=>parseBrowser('<html>verification required</html>'),/无法读取/);
 const dir=path.join(__dirname,'../work/catalog-login-test-'+Date.now());const c=new Catalog({cacheDir:dir,request:async()=>({ok:true,text:async()=>login})});await assert.rejects(c.browse({sourceOrder:true,sort:'collects'}),/登录/);assert.equal((await fs.readdir(dir).catch(()=>[])).length,0);
 assert(allowed('https://bangumi.tv/login'));assert(allowed('https://bgm.tv/'));for(const url of ['file:///C:/secret','javascript:alert(1)','https://bangumi.tv.evil.test/','https://name:pass@bangumi.tv/'])assert.equal(allowed(url),false);
});
test('keyword search only uses supported source search sorts with the original filters',async()=>{
 let body;const c=new Catalog({cacheDir:path.join(__dirname,'../work/catalog-search049-'+Date.now()),request:async(url,args)=>{assert.match(url,/api\.bgm\.tv\/v0\/search\/subjects/);body=JSON.parse(args.body);return {ok:true,json:async()=>({total:31,data:[{id:1,type:2,name:'搜索作品',date:'2024-04-03'}]})}}});
 const r=await c.browse({sourceOrder:true,sort:'collects',query:'作品',year:'2024',quarter:2,region:'JP'});assert.equal(body.sort,'heat');assert.deepEqual(body.filter.air_date,['>=2024-04-01','<2024-07-01']);assert.deepEqual(body.filter.tag,['日本']);assert.equal(r.hasMore,true);assert.match(r.coverage,/关键词搜索/);
 await c.browse({sourceOrder:true,sort:'title',query:'作品'});assert.equal(body.sort,'rank');
});
test('source login is isolated from app code, reuses one window and rejects outside navigation',async()=>{
 const {EventEmitter}=require('node:events'),{createCatalogLogin}=require('../lib/catalog-login.cjs');let windows=[];
 class FakeWindow extends EventEmitter{constructor(options){super();this.options=options;this.webContents=new EventEmitter();this.webContents.setWindowOpenHandler=handler=>this.openHandler=handler;windows.push(this)}isDestroyed(){return false}focus(){this.focused=true}async loadURL(url){this.url=url}}
 const login=createCatalogLogin({BrowserWindow:FakeWindow,parent:()=>null}),pending=login(),same=login(),w=windows[0];assert.equal(windows.length,1);assert.equal(pending,same);assert(w.focused);assert.equal(w.options.webPreferences.nodeIntegration,false);assert.equal(w.options.webPreferences.contextIsolation,true);assert.equal(w.options.webPreferences.sandbox,true);assert.equal(w.url,'https://bangumi.tv/login');assert.equal(w.openHandler({url:'https://other.test'}).action,'deny');let prevented=false;w.webContents.emit('will-navigate',{preventDefault(){prevented=true}},'file:///C:/private');assert(prevented);w.emit('closed');assert.equal(await pending,true);
 const {statusOf}=require('../lib/core.cjs');assert.equal(statusOf({status:'unmarked'}),'unmarked');assert.equal(statusOf({'观看状态':'未标记'}),'unmarked');
});
