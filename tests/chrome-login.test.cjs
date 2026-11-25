const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs/promises'),path=require('node:path'),http=require('node:http');
const {createChromeLogin,validate}=require('../lib/chrome-login.cjs'),{syncLogin}=require('../browser-extension/popup.js');
const cookie={domain:'.bangumi.tv',path:'/',hostOnly:false,name:'fixture_auth',value:'fake-local-value',secure:true,httpOnly:true,sameSite:'lax',expirationDate:Date.now()/1000+3600};
test('Chrome extension reads one chosen site only, posts to loopback and uses a single-use pairing code',async()=>{
 const root=path.join(__dirname,'../work/chrome-bridge-'+Date.now()),stored=[],bridge=createChromeLogin({root,getSession:()=>({cookies:{get:async()=>[],set:async c=>stored.push(c),flushStore:async()=>{}}}),verify:async p=>p.host==='bangumi.tv'});try{const pair=await bridge.start();assert.match(pair.code,/^YJ1-\d+-[\w-]{43}$/);let readDomain,requestUrl;
 const result=await syncLogin({code:pair.code,host:'bangumi.tv',userAgent:'Chrome test',cookiesApi:{getAll:async({domain})=>(readDomain=domain,[cookie,{...cookie,domain:'.other.test'}])},request:async(url,args)=>{requestUrl=url;return fetch(url,{...args,headers:{...args.headers,Origin:'chrome-extension://'+'a'.repeat(32)}})}});
 assert.equal(readDomain,'bangumi.tv');assert.match(requestUrl,/^http:\/\/127\.0\.0\.1:\d+\/v1\/bangumi-session$/);assert(result.verified);assert.equal(stored.length,1);assert.equal(stored[0].value,cookie.value);assert.equal(bridge.status().stage,'connected');assert(!JSON.stringify(bridge.status()).includes(cookie.value));const metadata=await fs.readFile(path.join(root,'bangumi-browser.json'),'utf8');assert(!metadata.includes(cookie.value));assert(metadata.includes('Chrome test'));
 await assert.rejects(syncLogin({code:pair.code,host:'bangumi.tv',userAgent:'Chrome test',cookiesApi:{getAll:async()=>[cookie]},request:(url,args)=>fetch(url,{...args,headers:{...args.headers,Origin:'chrome-extension://'+'a'.repeat(32)}})}),/失效|失败/);
 }finally{await bridge.stop()}
});
test('invalid origins, pairing codes and non-Bangumi cookies never mutate a session',async()=>{
 const root=path.join(__dirname,'../work/chrome-reject-'+Date.now()),stored=[],bridge=createChromeLogin({root,getSession:()=>({cookies:{get:async()=>[],set:async c=>stored.push(c),flushStore:async()=>{}}})});try{const pair=await bridge.start(),[,port,token]=pair.code.match(/^YJ1-(\d+)-([\w-]+)$/),url='http://127.0.0.1:'+port+'/v1/bangumi-session';
 for(const origin of ['https://other.test','null',''])assert.equal((await fetch(url,{method:'POST',headers:{Origin:origin,Authorization:'Bearer '+token,'Content-Type':'application/json'},body:JSON.stringify({host:'bangumi.tv',cookies:[cookie]})})).status,403);
 assert.throws(()=>validate({host:'bangumi.tv',cookies:[{...cookie,domain:'.google.com'}]}),/Bangumi/);assert.throws(()=>validate({host:'google.com',cookies:[cookie]}),/Bangumi/);assert.throws(()=>validate({host:'bangumi.tv',cookies:[cookie],userAgent:'bad\r\nheader'}));assert.deepEqual(stored,[]);
 }finally{await bridge.stop()}
});
