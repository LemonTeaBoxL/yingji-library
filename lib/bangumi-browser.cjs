'use strict';
const {readResponse}=require('./catalog-request.cjs');
// Public browser order is different from the API's two browse orders.
const SORTS=['rank','trends','collects','date','title'];
const REGIONS={JP:'日本',CN:'中国',US:'美国',KR:'韩国',GB:'英国',FR:'法国',DE:'德国',CA:'加拿大'};
const FORMATS={TV:'tv',WEB:'web',OVA:'ova',OAD:'ova','剧场版':'movie','电影':'movie','电视剧':'tv','其他':'misc'};
function text(html=''){
  const entities={amp:'&',lt:'<',gt:'>',quot:'"',apos:"'",nbsp:' ',middot:'·',hellip:'…',mdash:'—',ndash:'–',rsquo:'’',lsquo:'‘',ldquo:'“',rdquo:'”'};
  return html.replace(/<[^>]*>/g,'').replace(/&(#x[\da-f]+|#\d+|\w+);/gi,(all,key)=>{if(key[0]!=='#')return entities[key]??all;const n=key[1].toLowerCase()==='x'?parseInt(key.slice(2),16):Number(key.slice(1));return n>0&&n<=0x10ffff?String.fromCodePoint(n):''}).replace(/\s+/g,' ').trim();
}
function options(args={}){
  const kind=['anime','anime-film','movie','tv','game','book','music'].includes(args.kind)?args.kind:'anime';
  const quarter=['1','2','3','4'].includes(String(args.quarter))?Number(args.quarter):0;
  const year=quarter&&(!args.year||args.year==='all')?String(new Date().getFullYear()):String(args.year||'all');
  if(year!=='all'&&(!/^\d{4}$/.test(year)||+year<1977||+year>new Date().getFullYear()+1))throw Error('请选择有效年份');
  return {kind,year,quarter,region:REGIONS[args.region]?args.region:'all',sort:SORTS.includes(args.sort)?args.sort:'rank',page:Math.max(1,Math.min(1000,Math.trunc(Number(args.page)||1))),format:String(args.format||'all'),query:String(args.query||'').trim().slice(0,120)};
}
function browserUrl(args={}){
  const o=options(args),medium=['book','music','game'].includes(o.kind)?o.kind:['movie','tv'].includes(o.kind)?'real':'anime';
  const parts=[medium,'browser'];if(o.region!=='all')parts.push(REGIONS[o.region]);
  const format=['book','music'].includes(o.kind)?undefined:o.kind==='anime-film'||o.kind==='movie'?'movie':o.kind==='tv'?'tv':FORMATS[o.format];
  if(format)parts.push(format);if(o.year!=='all')parts.push('airtime',o.year);
  const url=new URL('https://bangumi.tv/'+parts.map(encodeURIComponent).join('/')+(parts.length===2?'/':''));url.searchParams.set('sort',o.sort);if(o.page>1)url.searchParams.set('page',o.page);return url.href;
}
function browserRows(html){
  const rows=[];
  // Logged-in collection menus can contain their own li elements. Match the
  // complete outer work row instead of stopping at the first nested </li>.
  const tokens=/<!--[\s\S]*?-->|<(script|style|textarea|template)\b[^>]*>[\s\S]*?<\/\1\s*>|<\/?(?:ul|ol|li)\b(?:"[^"]*"|'[^']*'|[^'">])*>/gi;
  let listDepth=0,row=null,depth=0;
  for(const token of html.matchAll(tokens)){
    const tag=token[0],name=tag.match(/^<\/?(ul|ol|li)\b/i)?.[1]?.toLowerCase();if(!name)continue;
    const closing=tag.startsWith('</');
    if(!listDepth){if(!closing&&name!=='li'&&/\bid\s*=\s*["']browserItemList["']/i.test(tag))listDepth=1;continue}
    if(name!=='li'){listDepth+=closing?-1:1;if(!listDepth)break;continue}
    if(!closing){
      if(row)depth++;
      else{const id=tag.match(/\bid\s*=\s*["']item_(\d+)["']/i)?.[1];if(id){row={id,start:token.index+tag.length};depth=1}}
    }else if(row&&!--depth){rows.push([row.id,html.slice(row.start,token.index)]);row=null}
  }
  return rows;
}
function parseBrowser(html,args={}){
  const o=options(args);
  if(/(?:当前操作需要您|需要.{0,10}登录).{0,160}(?:login|登录)/s.test(html)||/\b(?:href|action)=["'][^"']*\/login[^"']*["'][^>]*>登录<\/a>\s*后才能/.test(html))throw Error('Bangumi 的这个浏览方式需要登录。请点击“登录 Bangumi”，完成后关闭登录窗口并重试。');
  if(!/id=["']browserItemList["']/.test(html))throw Error('Bangumi 网页暂时无法读取，可能正在验证访问或已调整页面；请打开源站网页确认后重试。');
  const items=[],rows=browserRows(html);
  for(const [id,body] of rows){
    const h3=body.match(/<h3\b[^>]*>([\s\S]*?)<\/h3>/)?.[1]||'';
    const title=text(h3.match(/<a\b[^>]*>([\s\S]*?)<\/a>/)?.[1]);if(!title)continue;
    const original=text(h3.match(/<small\b[^>]*>([\s\S]*?)<\/small>/)?.[1])||title;
    const info=text(body.match(/<p\b[^>]*class=["']info\s+tip["'][^>]*>([\s\S]*?)<\/p>/)?.[1]);
    const dateMatch=info.match(/\b((?:19|20)\d{2})(?:[年/-](\d{1,2})(?:[月/-](\d{1,2})日?)?)?/),date=dateMatch?dateMatch[1]+(dateMatch[2]?'-'+dateMatch[2].padStart(2,'0'):'')+(dateMatch[3]?'-'+dateMatch[3].padStart(2,'0'):''):'';
    // Keep upstream pagination even when a source page contains older/out-of-quarter items.
    if(date&&date<'1977')continue;if(o.quarter&&(!dateMatch?.[2]||Math.ceil(+dateMatch[2]/3)!==o.quarter))continue;
    const parts=info.split(/\s*\/\s*/),dateIndex=parts.findIndex(p=>/(?:19|20)\d{2}/.test(p));
    const image=body.match(/<img\b[^>]*\bsrc=["']([^"']+)["']/)?.[1];let coverUrl='';
    try{const url=new URL(text(image),'https://bangumi.tv');if(url.protocol==='https:'&&url.hostname==='lain.bgm.tv')coverUrl=url.href}catch{}
    items.push({id:'bgm-'+id,provider:'bangumi',providerId:Number(id),type:'record',title,original,date,
      category:o.kind==='book'?'书籍':o.kind==='music'?'音乐':o.kind==='game'?'游戏':['movie','tv'].includes(o.kind)?o.kind==='tv'?'电视剧':'电影':'动漫',
      format:o.kind==='book'?'书籍':o.kind==='music'?'音乐':o.kind==='anime-film'?'剧场版':o.kind==='movie'?'电影':o.kind==='tv'?'电视剧':o.format==='all'?'':o.format,
      author:dateIndex>=0?parts[dateIndex+1]||'':'',eps:Number(info.match(/(\d+)\s*[话話集]/)?.[1])||0,
      sourceScore:Number(body.match(/<small\b[^>]*class=["']fade["'][^>]*>\s*([\d.]+)/)?.[1])||0,
      rank:Number(text(body.match(/<span\b[^>]*class=["']rank["'][^>]*>([\s\S]*?)<\/span>/)?.[1]).match(/\d+/)?.[0])||0,
      sourceVotes:Number(text(body).match(/([\d,]+)人评分/)?.[1]?.replaceAll(',',''))||0,
      coverUrl,source:'Bangumi',sourceUrl:'https://bangumi.tv/subject/'+id,status:'pending',favorite:false});
  }
  const pagination=html.match(/<div\b[^>]*class=["']page_inner["'][^>]*>([\s\S]*?)<\/div>/)?.[1]||'';
  const pages=Number(text(pagination).match(/\/\s*(\d+)\s*\)/)?.[1])||0;
  const hasMore=[...pagination.matchAll(/[?&](?:amp;)?page=(\d+)/g)].some(m=>+m[1]>o.page)||pages>o.page;
  return {items,total:null,page:o.page,hasMore:hasMore&&o.page<1000,sourcePageCount:pages,sourceItemCount:rows.length,browserParser:3,provider:'bangumi',sourceUrl:browserUrl(o),sourceOrder:o.sort,coverage:'按 Bangumi 源网页顺序连续载入；季度与有评分筛选作用于已载入作品。'};
}
function install(Catalog,normalizeBgm){
  Catalog.prototype.browserBrowse=async function(args={}){
    await this.browserReady;const profile=this.browserProfile?.()||{host:'bangumi.tv',userAgent:''};const o=options(args),result=await this.cached(JSON.stringify({browser:3,host:profile.host,...o}),async()=>{
      if(o.query){
        const filter={type:[o.kind==='book'?1:o.kind==='music'?3:o.kind==='game'?4:['movie','tv'].includes(o.kind)?6:2],air_date:['>=1977-01-01'],nsfw:false};
        if(o.year!=='all'){const month=o.quarter?(o.quarter-1)*3+1:1,start=o.year+'-'+String(month).padStart(2,'0')+'-01',end=o.quarter&&o.quarter<4?o.year+'-'+String(month+3).padStart(2,'0')+'-01':String(+o.year+1)+'-01-01';filter.air_date=['>='+start,'<'+end]}
        if(o.region!=='all')filter.tag=[REGIONS[o.region]];
        const sort=o.sort==='collects'?'heat':'rank',data=await this.json('https://api.bgm.tv/v0/search/subjects?limit=30&offset='+((o.page-1)*30),{keyword:o.query,sort,filter});
        let items=(data.data||[]).filter(s=>!s.nsfw).map(normalizeBgm);
        if(['anime-film','movie'].includes(o.kind))items=items.filter(w=>['剧场版','电影','Movie'].includes(w.format));
        if(o.kind==='tv')items=items.filter(w=>!['电影','Movie','演出','综艺'].includes(w.format));
        return {items,total:data.total||0,page:o.page,hasMore:o.page*30<(data.total||0),provider:'bangumi',sourceOrder:o.sort==='collects'?'collects':'rank',coverage:'关键词搜索使用 Bangumi 搜索接口，支持排名、收藏人数排序；清空关键词可使用五种网页浏览方式。'};
      }
      const url=new URL(browserUrl(o));if(['bangumi.tv','bgm.tv','chii.in'].includes(profile.host))url.hostname=profile.host;return readResponse(this.request,url.href,{headers:{Accept:'text/html',...(profile.userAgent?{'User-Agent':profile.userAgent}:{})},credentials:'include'},async response=>{if(!response.ok)throw Error('Bangumi 网页暂时不可用（'+response.status+'），请稍后重试');const html=await response.text();if(html.length>4*1024*1024)throw Error('源网页内容异常，请重试');return parseBrowser(html,o)},this.requestTimeoutMs);
    },!!args.refresh);
    for(const item of result.items){const known=this.works.get(item.id);this.works.set(item.id,{...known,...item,format:item.format||known?.format||'',description:known?.description||''})}
    return {...result,items:result.items.map(item=>this.works.get(item.id))};
  };
}
module.exports={SORTS,options,browserUrl,parseBrowser,install};
