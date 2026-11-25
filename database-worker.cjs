const{parentPort}=require('node:worker_threads');
const{queryDatabase}=require('./lib/database-query.cjs');
// Serialize requests on this dedicated worker; the UI never waits for a whole-file copy.
let queue=Promise.resolve();
parentPort.on('message',message=>{queue=queue.catch(()=>{}).then(async()=>{try{const result=await queryDatabase(message,(percent,phase)=>parentPort.postMessage({id:message.id,progress:{kind:'database',itemId:message.itemId,percent,phase}}));parentPort.postMessage({id:message.id,result})}catch(error){parentPort.postMessage({id:message.id,error:error.message})}})});
