'use strict';
async function syncLogin({code,host,cookiesApi,request,userAgent}){
 const match=String(code).trim().match(/^YJ1-(\d{2,5})-([A-Za-z0-9_-]{43})$/);if(!match||+match[1]<1024||+match[1]>65535)throw Error('请粘贴映迹生成的完整连接码');
 if(!['bangumi.tv','bgm.tv','chii.in'].includes(host))throw Error('请选择 Bangumi 网站');
 const cookies=(await cookiesApi.getAll({domain:host})).filter(c=>c.domain.replace(/^\./,'')===host&&!c.partitionKey);if(!cookies.length)throw Error('这个网站没有可用登录状态，请先在 Chrome 中登录');
 const response=await request('http://127.0.0.1:'+match[1]+'/v1/bangumi-session',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+match[2]},body:JSON.stringify({host,cookies,userAgent}),signal:AbortSignal.timeout(30000)});
 if(!response.ok)throw Error('连接码失效或同步失败，请在映迹重新生成连接码');return response.json();
}
if(typeof module==='object'&&module.exports)module.exports={syncLogin};
else document.querySelector('#sync').onclick=async()=>{const button=document.querySelector('#sync'),status=document.querySelector('#status');button.disabled=true;status.textContent='正在同步到本机映迹…';try{const result=await syncLogin({code:document.querySelector('#code').value,host:document.querySelector('#site').value,cookiesApi:chrome.cookies,request:fetch,userAgent:navigator.userAgent});status.textContent=result.message;document.querySelector('#code').value=''}catch(e){status.textContent=e.message==='Failed to fetch'?'无法连接映迹，请保持程序打开并重新生成连接码。':e.message}finally{button.disabled=false}};
