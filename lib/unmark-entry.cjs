'use strict';
const fs=require('node:fs/promises'),path=require('node:path'),crypto=require('node:crypto');
const {inside,entryKey}=require('./portable-store.cjs'),{idOf}=require('./core.cjs'),{preparePurge}=require('./safe-purge.cjs');
async function planUnmark(root,state,id){
 const work=state.items.find(i=>i.id===id&&i.type==='record');if(!work)return null;
 const refs=new Set(state.items.filter(i=>i.id!==id&&i.type==='record').flatMap(i=>[i.coverId,...i.materialIds||[]]).filter(Boolean));
 const removed=new Set([id,...state.items.filter(i=>i.ownerEntryId===id&&!refs.has(i.id)).map(i=>i.id)]);
 const retained=state.items.filter(i=>!removed.has(i.id)),folder=path.join('entries',entryKey(id)),absolute=path.join(root,folder),targets=[];
 const shared=retained.some(i=>i.path&&inside(absolute,i.path));
 if(!shared)targets.push(folder);else{targets.push(path.join(folder,'entry.json'));for(const item of state.items)if(removed.has(item.id)&&item.managed&&item.path&&inside(absolute,item.path))targets.push(path.relative(root,item.path))}
 targets.push(path.join('offline-works',id+'.json'),path.join('catalog-cache',crypto.createHash('sha256').update('detail:'+id).digest('hex')+'.json'));
 if(work.coverUrl&&!retained.some(i=>i.coverUrl===work.coverUrl))targets.push(path.join('covers',idOf(work.coverUrl)+'.jpg'));
 for(const item of state.items)if(removed.has(item.id)&&item.path)targets.push(path.join('thumbnails',idOf(item.path+'#'+item.modified)+'.jpg'));
 const cache=path.join(root,'catalog-cache');try{if((await fs.lstat(cache)).isSymbolicLink())throw Error('缓存路径含目录链接，已停止清理');if(!inside(await fs.realpath(root),await fs.realpath(cache)))throw Error('缓存路径超出资料库');for(const name of await fs.readdir(cache)){if(!/^[a-f0-9]{64}\.json$/.test(name))continue;const file=path.join(cache,name),stat=await fs.lstat(file);if(stat.isSymbolicLink())throw Error('缓存中有文件链接，已停止清理');if(!stat.isFile()||stat.size>8*1024*1024)continue;try{const data=JSON.parse(await fs.readFile(file,'utf8')).data;if(data?.work?.id===id||data?.items?.some(i=>i.id===id))targets.push(path.join('catalog-cache',name))}catch{}}}catch(e){if(e.code!=='ENOENT')throw e}
 const overrides=Object.fromEntries(Object.entries(state.overrides||{}).filter(([key])=>!removed.has(key)));
 const trash=(state.trash||[]).map(batch=>({...batch,items:batch.items.filter(i=>!removed.has(i.id)),overrides:Object.fromEntries(Object.entries(batch.overrides||{}).filter(([key])=>!removed.has(key))),links:(batch.links||[]).filter(i=>!removed.has(i.id))})).filter(batch=>batch.items.length);
 const protectedState={...state,protectedRetained:retained.filter(i=>i.path).map(i=>({path:i.path,managed:false}))};
 const plan=await preparePurge(root,protectedState,targets);
 return {plan,removedIds:[...removed],next:{...state,items:retained,overrides,trash,hiddenIds:[...new Set([...(state.hiddenIds||[]),...removed])],updatedAt:new Date().toISOString()}};
}
module.exports={planUnmark};
