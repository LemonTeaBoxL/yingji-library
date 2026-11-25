'use strict';
(function(){
 const invokeBase=invoke;invoke=async function(name,args){if(name==='watch'&&args?.status==='unmarked')await flushPersonalDrafts();const result=await invokeBase(name,args);if(name==='watch'&&args?.status==='unmarked'&&result?.removedIds?.includes(args.id)){
   reviewDrafts.delete(args.id);const source=catalogDetailState?.id===args.id?catalogDetailState.sourceWork:null;
   const clean=work=>{if(!work)return work;const out={...work,...source,status:'pending',favorite:false,personalScore:0,review:'',episodeStates:{},allWatched:false,watchedCount:0,progressThrough:0,progressTotal:Number(source?.eps||work.eps)||0,episodeOrder:{},materialIds:[],explicitMarked:false};delete out.coverId;return out};
   catalogClient.details.delete(args.id);if(catalogClient.byId.has(args.id))catalogClient.byId.set(args.id,clean(catalogClient.byId.get(args.id)));catalogClient.items=catalogClient.items.map(i=>i.id===args.id?clean(i):i);
   if(catalogDetailState?.id===args.id){if(!catalogDetailState.work.provider)closeSheet();else{catalogDetailState.work=clean(catalogDetailState.work);current=catalogDetailState.work}}
 }return result};
})();
