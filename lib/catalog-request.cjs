'use strict';

// Bound both the connection and body read, even if a transport ignores abort.
async function readResponse(request,url,init,read,timeoutMs=20000){
  const controller=new AbortController(),limit=Math.max(1,Number(timeoutMs)||20000);
  let timer;
  const deadline=new Promise((_,reject)=>{
    timer=setTimeout(()=>{
      const error=new Error('读取数据源超时，已停止等待，请稍后重试');
      error.code='CATALOG_TIMEOUT';reject(error);controller.abort();
    },limit);
  });
  try{return await Promise.race([
    Promise.resolve().then(()=>request(url,{...init,signal:controller.signal})).then(read),
    deadline
  ])}finally{clearTimeout(timer)}
}

module.exports={readResponse};
