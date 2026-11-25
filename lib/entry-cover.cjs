'use strict';
const fs=require('node:fs/promises'),path=require('node:path'),crypto=require('node:crypto'),core=require('./core.cjs');
async function setEntryCover({id,file,getState,commit,store}){
 const find=state=>state.items.find(i=>i.id===id&&i.type==='record'&&i.manual===true);
 if(!find(getState()))throw Error('请选择自己创建的个人条目');
 let owned;
 if(file!==null){
  if(typeof file!=='string'||!path.isAbsolute(file)||core.typeOf(file)!=='image')throw Error('请选择图片文件');
  const stat=await fs.lstat(file);if(!stat.isFile()||stat.isSymbolicLink()||stat.size>50*1024*1024)throw Error('请选择不超过 50 MB 的普通图片文件');
  const state=getState(),work=find(state);if(!work)throw Error('条目已不存在');
  const tempId='cover-input-'+crypto.randomUUID(),image={id:tempId,type:'image',title:path.basename(file),filename:path.basename(file),path:file,size:stat.size,modified:stat.mtime.toISOString(),coverOnly:true};
  const draft={...state,items:[...state.items.map(i=>i.id===id?{...i,coverId:tempId}:i),image]};
  const copied=await store.copyLinks(draft,id),coverId=copied.items.find(i=>i.id===id)?.coverId;
  owned=copied.items.find(i=>i.id===coverId);if(!owned?.managed||owned.ownerEntryId!==id)throw Error('封面复制失败，请重试');
 }
 // Merge only the cover into the latest state; background metadata saves remain intact.
 const latest=getState();if(!find(latest))throw Error('条目已不存在');
 const patch={coverId:owned?.id||null},items=latest.items.map(i=>i.id===id?{...i,...patch}:i);
 if(owned&&!items.some(i=>i.id===owned.id))items.push(owned);
 return commit({...latest,items,overrides:{...latest.overrides,[id]:{...latest.overrides?.[id],...patch}},updatedAt:new Date().toISOString()});
}
module.exports={setEntryCover};
