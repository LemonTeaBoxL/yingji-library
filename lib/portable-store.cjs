'use strict';
const fs=require('node:fs/promises');
const path=require('node:path');
const crypto=require('node:crypto');
const {typeOf}=require('./core.cjs');
const FORMAT='yingji-portable-library';
const inside=(root,file)=>{const r=path.relative(path.resolve(root),path.resolve(file));return !r||!r.startsWith('..'+path.sep)&&r!=='..'&&!path.isAbsolute(r)};
function entryKey(id){if(typeof id!=='string'||!/^[\p{L}\p{N}_.-]{1,100}$/u.test(id)||id==='.'||id==='..')throw Error('无效的条目 ID');return id}
function portable(value,root,decode=false){
 if(Array.isArray(value))return value.map(v=>portable(v,root,decode));if(!value||typeof value!=='object')return value;
 const out={};for(const[k,v]of Object.entries(value)){if(k==='path'&&typeof v==='string'&&v){if(decode){if(path.isAbsolute(v))out[k]=v;else{const p=path.resolve(root,v);if(!inside(root,p))throw Error('资料中的文件路径超出资料库');out[k]=p}}else out[k]=inside(root,v)?path.relative(root,v).split(path.sep).join('/'):v}else out[k]=portable(v,root,decode)}return out;
}
async function atomic(file,value){await fs.mkdir(path.dirname(file),{recursive:true});const temp=file+'.'+crypto.randomUUID()+'.tmp';try{await fs.writeFile(temp,typeof value==='string'?value:JSON.stringify(value,null,2),'utf8');await fs.rename(temp,file)}finally{await fs.unlink(temp).catch(()=>{})}}
class PortableStore{
 constructor(root,emit=()=>{}){this.root=path.resolve(root);this.emit=emit;this.signatures=new Map();this.coverSignatures=new Map();this.sourceSnapshots=new Map();this.pending=new Set()}
 track(fn){const task=Promise.resolve().then(fn);this.pending.add(task);task.finally(()=>this.pending.delete(task)).catch(()=>{});return task}
 async importFiles(paths,scanner,previous=[]){return this.track(()=>require('./managed-imports.cjs').importFiles(this,paths,scanner,previous))}
 async adoptFiles(state){return require('./managed-imports.cjs').adoptFiles(this,state)}
 async read(){const data=JSON.parse(await fs.readFile(path.join(this.root,'library.json'),'utf8'));if(!Array.isArray(data.items))throw Error('资料库缺少 items 列表');const decoded=portable(data,this.root,true);for(const work of decoded.items)if(work.type==='record'&&work.status==='important')work.status='watching';for(const patch of Object.values(decoded.overrides||{}))if(patch.status==='important')patch.status='watching';return require('../dist/categories.js').migrate(decoded)}
 copyLinks(state,id){return this.track(()=>this.copyLinksTask(state,id))}
 async copyLinksTask(state,id){
  const work=state.items.find(i=>i.id===id);if(!work||work.type!=='record')return state;
  const wanted=[...new Set([...(work.materialIds||[]),work.coverId].filter(Boolean))],replacements=new Map(),items=[...state.items];
  for(const mid of wanted){const old=items.find(i=>i.id===mid);if(!old||!['image','video'].includes(old.type)||!old.path)continue;
   const directory=path.join(this.root,'entries',entryKey(id),'materials');if(old.ownerEntryId===id&&inside(directory,old.path))continue;
   let stat;try{stat=await fs.stat(old.path)}catch(error){if(error.code==='ENOENT')continue;throw error}if(!stat.isFile())throw Error('关联素材必须是文件');await fs.mkdir(directory,{recursive:true});
   const hash=crypto.createHash('sha256').update(mid+'|'+stat.size+'|'+stat.mtimeMs).digest('hex').slice(0,12);
   const clean=path.basename(old.path).replace(/[<>:"/\\|?*\x00-\x1f]/g,'_').slice(0,140),target=path.join(directory,hash+'-'+clean);
   if(!inside(directory,target))throw Error('素材路径无效');try{await fs.copyFile(old.path,target,require('node:fs').constants.COPYFILE_EXCL)}catch(e){if(e.code!=='EEXIST')throw e}
   const ownedId='m'+crypto.createHash('sha256').update(id+'|'+hash).digest('hex').slice(0,24);
   const owned={...old,id:ownedId,path:target,ownerEntryId:id,managed:true,source:'条目素材副本',size:stat.size,available:true,originalPath:old.originalPath||old.path};
   if(!items.some(i=>i.id===ownedId))items.push(owned);replacements.set(mid,ownedId);
  }
  const patch={materialIds:(work.materialIds||[]).map(mid=>replacements.get(mid)||mid),...(work.coverId?{coverId:replacements.get(work.coverId)||work.coverId}:{})};
  return {...state,items:items.map(i=>i.id===id?{...i,...patch}:i),overrides:{...state.overrides,[id]:{...state.overrides?.[id],...patch}}};
 }
 async adopt(state){let next=state;const records=state.items.filter(i=>i.type==='record'&&(i.materialIds?.length||i.coverId));for(let n=0;n<records.length;n++){next=await this.copyLinks(next,records[n].id);this.emit({kind:'storage',phase:'整理条目素材副本',count:n+1,total:records.length})}return next}
 async write(state){
  const currentIds=new Set(state.items.filter(i=>i.type==='record').map(i=>i.id));for(const map of [this.signatures,this.coverSignatures,this.sourceSnapshots])for(const id of map.keys())if(!currentIds.has(id))map.delete(id);
  if(!state.items.length){this.signatures.clear();this.coverSignatures.clear();this.sourceSnapshots.clear()}await fs.mkdir(this.root,{recursive:true});const sizes={},index=new Map(state.items.map(i=>[i.id,i]));
  for(const work of state.items.filter(i=>i.type==='record')){
   const folder=path.join(this.root,'entries',entryKey(work.id));const linked=[...new Set([...(work.materialIds||[]),work.coverId].filter(Boolean))].map(id=>index.get(id)).filter(Boolean);
   let sourceData;try{const file=path.join(this.root,'offline-works',entryKey(work.id)+'.json'),stat=await fs.stat(file),key=stat.size+':'+stat.mtimeMs;let saved=this.sourceSnapshots.get(work.id);if(saved?.key!==key){saved={key,data:JSON.parse(await fs.readFile(file,'utf8'))};this.sourceSnapshots.set(work.id,saved)}if(saved.data.work?.id===work.id)sourceData=saved.data}catch{}
   const record=portable({format:FORMAT,schemaVersion:1,work:{...work,storageBytes:undefined},materials:linked,...(sourceData?{sourceData}:{})},folder);
   // Media are owned by this entry; sidecars remain useful without the global index.
   const json=JSON.stringify(record,null,2),signature=crypto.createHash('sha256').update(json).digest('hex');
   if(this.signatures.get(work.id)!==signature){await atomic(path.join(folder,'entry.json'),json);this.signatures.set(work.id,signature)}
   let size=Buffer.byteLength(json);for(const item of linked)if(item.ownerEntryId===work.id)size+=Number(item.size)||0;
   if(work.coverUrl){const cover=path.join(this.root,'covers',require('./core.cjs').idOf(work.coverUrl)+'.jpg');try{const stat=await fs.stat(cover),signature=stat.size+':'+stat.mtimeMs;if(this.coverSignatures.get(work.id)!==signature){await fs.copyFile(cover,path.join(folder,'cover.jpg'));this.coverSignatures.set(work.id,signature)}size+=stat.size}catch{}}
   sizes[work.id]=size;
  }
  const snapshot=portable({...state,format:FORMAT,schemaVersion:1,initialized:true,items:state.items.map(i=>({...i,...(sizes[i.id]!==undefined?{storageBytes:sizes[i.id]}:{})}))},this.root);
  await atomic(path.join(this.root,'library.json'),snapshot);
  await atomic(path.join(this.root,'library-format.json'),{format:FORMAT,schemaVersion:1,encoding:'UTF-8',paths:'Relative to library.json; entry.json paths are relative to its own directory',index:'library.json',entries:'entries/<id>/entry.json',media:'entries/<id>/materials/',personalRatingScale:[0,10],uiRatingScale:[0,5],cacheFolders:['catalog-cache','offline-works','covers','thumbnails'],runtime:'runtime/',serverCredentials:'Encrypted locally, never included in WebDAV snapshots'});
  return sizes;
 }
 async unlink(state,id,ids){
  const work=state.items.find(i=>i.id===id);if(!work||work.type!=='record')throw Error('条目不存在');if(!Array.isArray(ids)||ids.length>10000)throw Error('请选择素材');
  const selected=new Set(ids.filter(mid=>work.materialIds?.includes(mid))),patch={materialIds:(work.materialIds||[]).filter(mid=>!selected.has(mid))};
  const items=state.items.map(i=>i.id===id?{...i,...patch}:i);return {...state,items,overrides:{...state.overrides,[id]:{...state.overrides?.[id],...patch}}};
 }
 async removeUnlinkedCopies(before,after,id,ids){
  // Delete only application-owned copies with no remaining reference. Originals stay untouched.
  const referenced=new Set(after.items.flatMap(i=>[i.coverId,...(i.materialIds||[])].filter(Boolean)));
  const removable=before.items.filter(i=>ids.includes(i.id)&&i.ownerEntryId===id&&!referenced.has(i.id));
  for(const item of removable){const base=path.join(this.root,'entries',entryKey(id),'materials');if(!inside(base,item.path))throw Error('素材副本超出条目目录');await fs.unlink(item.path).catch(e=>{if(e.code!=='ENOENT')throw e})}
  return removable.map(i=>i.id);
 }
 async backup(state,withMedia=false){const directory=path.join(this.root,'backups',new Date().toISOString().replace(/[:.]/g,'-')+'-'+crypto.randomUUID().slice(0,6));await fs.mkdir(directory,{recursive:true});await atomic(path.join(directory,'library.json'),withMedia?portable(state,this.root):state);if(withMedia)await fs.cp(path.join(this.root,'entries'),path.join(directory,'entries'),{recursive:true}).catch(e=>{if(e.code!=='ENOENT')throw e});return directory}
}
module.exports={PortableStore,portable,atomic,inside,entryKey,FORMAT};
