const REGIONS={JP:'日本',CN:'中国',US:'美国',KR:'韩国',GB:'英国',FR:'法国',DE:'德国',CA:'加拿大'};
module.exports=function install(Catalog,normalizeBgm){
  Catalog.prototype.filteredBrowse=async function(args={}){
    const provider=args.provider==='tmdb'?'tmdb':'bangumi',kind=['anime','anime-film','movie','tv','game'].includes(args.kind)?args.kind:'anime';
    const quarter=['1','2','3','4'].includes(String(args.quarter))?Number(args.quarter):0,region=REGIONS[args.region]?args.region:'all';
    const year=quarter&&(!args.year||args.year==='all')?String(new Date().getFullYear()):String(args.year||'all');if(year!=='all'&&(!/^\d{4}$/.test(year)||+year<1977||+year>new Date().getFullYear()+1))throw Error('请选择有效年份');
    const query=String(args.query||'').trim().slice(0,120),page=Math.max(1,Math.min(500,Number(args.page)||1)),sort=args.sort==='date'?'date':'rank';
    const start=quarter?year+'-'+String((quarter-1)*3+1).padStart(2,'0')+'-01':year==='all'?'1977-01-01':year+'-01-01';
    const end=quarter?(quarter===4?String(+year+1)+'-01-01':year+'-'+String(quarter*3+1).padStart(2,'0')+'-01'):year==='all'?null:String(+year+1)+'-01-01';
    const result=await this.cached(JSON.stringify({v:4,provider,kind,quarter,region,year,query,page,sort}),async()=>{
      if(provider==='bangumi'){
        const filter={type:[kind==='game'?4:['movie','tv'].includes(kind)?6:2],air_date:['>='+start,...(end?['<'+end]:[])]};if(region!=='all')filter.tag=[REGIONS[region]];
        const data=await this.json('https://api.bgm.tv/v0/search/subjects?limit=30&offset='+((page-1)*30),{keyword:query,sort:sort==='date'?'rank':sort,filter});
        let items=(data.data||[]).filter(s=>!s.nsfw).map(normalizeBgm);if(['anime-film','movie'].includes(kind))items=items.filter(w=>['剧场版','电影','Movie'].includes(w.format));if(kind==='tv')items=items.filter(w=>!['电影','Movie','综艺','演出'].includes(w.format));if(sort==='date')items.sort((a,b)=>b.date.localeCompare(a.date));
        return{items,total:data.total||0,page,hasMore:page*30<(data.total||0),provider,coverage:region==='all'?'按源站出品日期筛选':'地区按 Bangumi 社区标签筛选，缺失标签的条目可能不显示。'};
      }
      if(kind==='game')throw Error('游戏栏目使用 Bangumi 数据源');const token=this.token();if(!token)throw Error('请先在设置中填写 TMDB 密钥');
      const medium=kind==='tv'?'tv':'movie',params=new URLSearchParams({language:'zh-CN',page:String(page),include_adult:'false'}),headers={};if(token.length===32)params.set('api_key',token);else headers.Authorization='Bearer '+token;
      if(query){params.set('query',query);if(region!=='all')params.set('region',region);if(year!=='all')params.set(medium==='tv'?'first_air_date_year':'year',year)}else{params.set('sort_by',sort==='date'?(medium==='tv'?'first_air_date.desc':'primary_release_date.desc'):'popularity.desc');params.set(medium==='tv'?'first_air_date.gte':'primary_release_date.gte',start);if(end){const last=new Date(new Date(end+'T00:00:00Z')-86400000).toISOString().slice(0,10);params.set(medium==='tv'?'first_air_date.lte':'primary_release_date.lte',last)}if(region!=='all')params.set('with_origin_country',region);if(kind.startsWith('anime'))params.set('with_genres','16')}
      const data=await this.json('https://api.themoviedb.org/3/'+(query?'search/':'discover/')+medium+'?'+params,null,headers);
      const items=(data.results||[]).filter(s=>{const date=s.release_date||s.first_air_date||'';return !quarter||(date>=start&&date<end)}).map(s=>({id:'tmdb-'+medium+'-'+s.id,provider:'tmdb',providerId:s.id,medium,type:'record',title:s.title||s.name,original:s.original_title||s.original_name,date:s.release_date||s.first_air_date||'',category:kind.startsWith('anime')?'动漫':medium==='tv'?'电视剧':'电影',format:medium==='tv'?'电视剧':'电影',description:s.overview||'',eps:medium==='movie'?1:0,sourceScore:s.vote_average||0,sourceVotes:s.vote_count||0,coverUrl:s.poster_path?'https://image.tmdb.org/t/p/w500'+s.poster_path:'',source:'TMDB',sourceUrl:'https://www.themoviedb.org/'+medium+'/'+s.id,status:'pending',favorite:false}));
      return{items,total:data.total_results||0,page,hasMore:page<Math.min(500,data.total_pages||0),provider,coverage:'TMDB 地区浏览按原产国；关键词搜索按发行地区。'};
    },!!args.refresh);for(const item of result.items)this.works.set(item.id,item);return result;
  };
};
