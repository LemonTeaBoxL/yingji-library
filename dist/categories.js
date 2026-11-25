(function(root){
 'use strict';
 const DEFAULTS=['电影','动漫','电视剧','书籍','漫画','游戏','音乐','其它'];
 const name=value=>typeof value==='string'?value.trim().normalize('NFC').replace(/^小说$/,'书籍'):'';
 const list=state=>[...new Set([...DEFAULTS,...state.categories||[],...(state.items||[]).map(i=>i.category),...Object.values(state.overrides||{}).map(i=>i.category)].map(name).filter(Boolean))];
 function migrate(state){return{...state,categories:list(state),items:(state.items||[]).map(i=>i.type==='record'&&i.category==='小说'?{...i,category:'书籍'}:i),overrides:Object.fromEntries(Object.entries(state.overrides||{}).map(([id,p])=>[id,p.category==='小说'?{...p,category:'书籍'}:p]))}}
 const api={DEFAULTS,name,list,migrate};if(typeof module==='object'&&module.exports)module.exports=api;else root.YingjiCategories=api;
})(typeof window==='undefined'?globalThis:window);
