(function(root){
 'use strict';const statuses=new Set(['watched','pending','watching']);
 const status=item=>item?.status==='important'?'watching':item?.status;
 const marked=item=>item?.type==='record'&&statuses.has(status(item));
 const matches=(item,view='all')=>marked(item)&&(view==='all'||status(item)===view);
 const count=(items,view='all')=>items.filter(i=>matches(i,view)).length;
 const visibleIds=items=>{const records=items.filter(marked),owners=new Set(records.map(i=>i.id)),refs=new Set(records.flatMap(i=>[i.coverId,...i.materialIds||[]]).filter(Boolean)),materials=new Set(records.flatMap(i=>i.materialIds||[]));return new Set(items.filter(i=>i.type==='record'?marked(i):(!i.coverOnly||materials.has(i.id))&&(!i.ownerEntryId||owners.has(i.ownerEntryId)||refs.has(i.id))).map(i=>i.id))};
 const visible=(item,items)=>visibleIds([...items,...(items.some(i=>i===item||i.id===item.id)?[]:[item])]).has(item.id);
 const api={marked,matches,count,visible,visibleIds,status};if(typeof module==='object'&&module.exports)module.exports=api;else root.YingjiMarks=api;
})(typeof window==='undefined'?globalThis:window);
