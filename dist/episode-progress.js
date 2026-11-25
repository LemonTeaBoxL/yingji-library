(function(root){
  'use strict';
  const bounded=(n,total)=>Math.max(0,Math.min(total,Math.trunc(Number(n)||0)));
  function total(work,fallback=0){return bounded(Number(fallback)||Number(work.progressTotal)||Number(work.eps)||0,50000)}
  function state(work,id,ordinal){const override=work.episodeStates?.[id]?.state;if(override)return override;return work.allWatched||Number(ordinal)>0&&Number(ordinal)<=Number(work.progressThrough||0)?'watched':'pending'}
  function count(work,n=total(work)){
    if(Number.isFinite(work.watchedCount))return bounded(work.watchedCount,n);
    let value=work.allWatched?n:bounded(work.progressThrough||0,n);
    for(const[id,entry]of Object.entries(work.episodeStates||{})){const ordinal=work.episodeOrder?.[id],baseline=work.allWatched||ordinal>0&&ordinal<=Number(work.progressThrough||0);value+=(entry.state==='watched'?1:0)-(baseline?1:0)}
    return bounded(value,n);
  }
  function apply(work,args,original={}){
    const patch={...original},n=total(work,args.episode?.total),nowCount=count(work,n);
    if(args.progress){const p=args.progress;if(!Number.isInteger(p.count)||!Number.isInteger(p.total)||p.total<1||p.total>50000||p.count<0||p.count>p.total)throw Error('无效的单集进度');
      if(p.episodes&&!Array.isArray(p.episodes)||p.episodes?.length>50000)throw Error('无效的单集顺序');const order={...work.episodeOrder};for(const ep of p.episodes||[]){if(!/^[\w.-]{1,80}$/.test(String(ep.id))||!Number.isInteger(ep.ordinal)||ep.ordinal<1||ep.ordinal>p.total)throw Error('无效的单集顺序');order[ep.id]=ep.ordinal}
      const states={...work.episodeStates};for(const id of new Set([...Object.keys(states),...Object.keys(order)])){const old=states[id]||{};states[id]={...old,state:order[id]>0&&order[id]<=p.count?'watched':old.state==='important'?'important':'pending'}}
      return{...patch,progressTotal:p.total,progressThrough:p.count,watchedCount:p.count,allWatched:p.count===p.total,explicitMarked:true,status:p.count===p.total?'watched':p.count?'watching':'pending',episodeStates:states,episodeOrder:order};
    }
    if(args.status==='watched'||args.favorite===true&&!work.favorite){if(n){patch.watchedCount=n;patch.progressThrough=n;patch.progressTotal=n}patch.allWatched=true;patch.episodeStates=Object.fromEntries(Object.entries(patch.episodeStates||work.episodeStates||{}).map(([id,v])=>[id,{...v,state:'watched'}]))}
    else if(args.status==='pending'||args.status==='unmarked'){patch.watchedCount=0;patch.progressThrough=0;patch.allWatched=false}
    if(args.episode){const ep=args.episode,ordinal=Number(ep.ordinal)||work.episodeOrder?.[ep.id];if(ordinal){if(!Number.isInteger(ordinal)||ordinal<1||ordinal>50000)throw Error('无效的单集顺序');patch.episodeOrder={...work.episodeOrder,[ep.id]:ordinal}}if(n)patch.progressTotal=n;
      if(ep.state!==undefined){patch.watchedCount=bounded(nowCount+(ep.state==='watched'?1:0)-(state(work,ep.id,ordinal)==='watched'?1:0),n);patch.allWatched=n>0&&patch.watchedCount===n;patch.status=patch.allWatched?'watched':patch.watchedCount||ep.state==='important'?'watching':'pending'}
    }
    return patch;
  }
  const api={total,state,count,apply};if(typeof module==='object'&&module.exports)module.exports=api;else root.YingjiEpisodes=api;
})(typeof window==='undefined'?globalThis:window);
