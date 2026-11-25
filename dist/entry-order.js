(function(root){
  'use strict';
  const options=[['recent','最近记录'],['name','名称'],['added','添加时间'],['status','观看状态'],['favorite','收藏状态'],['sourceScore','网页评分'],['personalScore','我的评分'],['date','作品出品时间'],['size','文件大小']];
  function value(item,key){switch(key){case'name':return item.title||item.filename||'';case'added':return item.addedAt||null;case'recent':return item.updatedAt||item.modified||item.addedAt||null;case'date':return item.date||null;case'status':return {unmarked:-1,pending:0,watching:1,important:2,watched:3}[item.status]??0;case'favorite':return item.favorite?1:0;case'sourceScore':case'personalScore':return Number(item[key])>0?Number(item[key]):null;case'size':return Number(item.size)||0;default:return null}}
  function sort(items,key='recent',direction){if(key==='source')return [...items];const sign=(direction||(key==='name'?'asc':'desc'))==='asc'?1:-1;return items.map((item,index)=>({item,index,v:value(item,key)})).sort((a,b)=>{if(a.v==null&&b.v!=null)return 1;if(b.v==null&&a.v!=null)return -1;const diff=typeof a.v==='number'&&typeof b.v==='number'?a.v-b.v:String(a.v??'').localeCompare(String(b.v??''),'zh-CN',{numeric:true});return diff*sign||a.index-b.index}).map(x=>x.item)}
  const api={options,value,sort};if(typeof module==='object'&&module.exports)module.exports=api;else root.YingjiOrder=api;
})(typeof window==='undefined'?globalThis:window);
