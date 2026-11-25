const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs/promises'),path=require('node:path');
const Categories=require('../dist/categories.js'),{PortableStore,inside}=require('../lib/portable-store.cjs'),{setEntryCover}=require('../lib/entry-cover.cjs'),{Catalog,normalizeBgm}=require('../lib/catalog.cjs'),{browserUrl}=require('../lib/bangumi-browser.cjs');
test('cover-only copies do not inflate local-media counts unless explicitly associated',()=>{
 const marks=require('../dist/marking.js'),record={id:'r',type:'record',status:'pending',coverId:'c',materialIds:[]},cover={id:'c',type:'image',coverOnly:true,ownerEntryId:'r'};
 assert(!marks.visibleIds([record,cover]).has('c'));assert(marks.visibleIds([{...record,materialIds:['c']},cover]).has('c'));
});
test('categories migrate novels to books and retain custom categories and annotations',()=>{
 const state={categories:['小说','自建科幻'],items:[{id:'a',type:'record',category:'小说',review:'保留',materialIds:['m'],episodeStates:{one:{score:9}}}],overrides:{a:{category:'小说',personalScore:8}}};
 const next=Categories.migrate(state);assert.equal(next.items[0].category,'书籍');assert.equal(next.overrides.a.category,'书籍');assert.equal(next.items[0].review,'保留');assert.deepEqual(next.items[0].episodeStates,state.items[0].episodeStates);assert(next.categories.includes('音乐')&&next.categories.includes('其它')&&next.categories.includes('自建科幻'));assert(!next.categories.includes('小说'));assert.equal(state.items[0].category,'小说');
});
test('custom cover is an independent Chinese-path copy and merges concurrent notes',async()=>{
 const root=path.join(__dirname,'../work/封面测试-'+Date.now()),source=path.join(root,'源文件/封面.png');await fs.mkdir(path.dirname(source),{recursive:true});await fs.copyFile(path.join(__dirname,'../dist/demo/山海之间_封面.jpg'),source);
 const store=new PortableStore(path.join(root,'资料库'));let state={items:[{id:'manual',type:'record',manual:true,title:'自建书籍',category:'书籍',status:'watching',materialIds:[],review:'旧感受'}],overrides:{},categories:[]};
 const copyLinks=store.copyLinks.bind(store);store.copyLinks=async(...args)=>{const result=await copyLinks(...args);state={...state,items:state.items.map(i=>({...i,review:'刚更新的感受'}))};return result};
 const commit=async next=>{state=next;await store.write(state);return state};
 await setEntryCover({id:'manual',file:source,getState:()=>state,store,commit});const work=state.items.find(i=>i.id==='manual'),cover=state.items.find(i=>i.id===work.coverId);assert.equal(work.review,'刚更新的感受');assert.equal(work.status,'watching');assert.deepEqual(work.materialIds,[]);assert.equal(cover.ownerEntryId,'manual');assert(cover.coverOnly&&inside(store.root,cover.path));assert.notEqual(cover.path,source);assert.deepEqual(await fs.readFile(source),await fs.readFile(cover.path));
 await setEntryCover({id:'manual',file:null,getState:()=>state,store,commit});assert.equal(state.items.find(i=>i.id==='manual').coverId,null);assert(await fs.stat(source));
 await assert.rejects(setEntryCover({id:'not-manual',file:source,getState:()=>state,store,commit}),/自己创建/);await assert.rejects(setEntryCover({id:'manual',file:path.join(root,'text.pdf'),getState:()=>state,store,commit}),/图片/);
});
test('books and music use their own website, API types and normalized metadata',async()=>{
 for(const[kind,type,category]of [['book',1,'书籍'],['music',3,'音乐']]){
  assert.equal(new URL(browserUrl({kind,format:'TV'})).pathname,'/'+kind+'/browser/');let requested;
  const c=new Catalog({cacheDir:path.join(__dirname,'../work/catalog-medium-'+kind+'-'+Date.now()),request:async(url,args)=>{requested={url,body:args.body&&JSON.parse(args.body)};return{ok:true,json:async()=>({total:1,data:[{id:51,type,name:'新作品',date:'2026-01-01',infobox:[{key:type===3?'艺术家':'作者',value:'主创甲'}]}]})}}});
  const result=await c.browse({kind});assert.equal(new URL(requested.url).searchParams.get('type'),String(type));assert.equal(result.items[0].category,category);assert.equal(result.items[0].author,'主创甲');
  await c.browse({sourceOrder:true,kind,query:'作品',year:'2026',quarter:1});assert.deepEqual(requested.body.filter.type,[type]);
  await c.browse({kind,query:'作品',year:'2026',quarter:2});assert.deepEqual(requested.body.filter.type,[type]);
  await assert.rejects(c.browse({kind,provider:'tmdb'}),/Bangumi/);
 }
 assert.equal(normalizeBgm({id:1,type:1,name:'书'}).category,'书籍');assert.equal(normalizeBgm({id:2,type:3,name:'专辑'}).category,'音乐');
});
