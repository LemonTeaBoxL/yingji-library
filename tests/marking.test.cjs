const test=require('node:test'),assert=require('node:assert/strict'),M=require('../dist/marking.js');
test('marked all includes watching and important, while default marks and their media stay outside personal pages',()=>{
 const items=['watched','pending','watching','important','unmarked'].map((status,i)=>({id:String(i),type:'record',status}));assert.equal(M.count(items),4);assert.equal(M.count(items,'watched'),1);assert.equal(M.count(items,'pending'),1);assert(M.matches(items[2],'all'));assert(!M.matches(items[4],'all'));assert(!M.visible(items[4],items));assert(!M.visible({type:'image',ownerEntryId:'4'},items));assert(M.visible({type:'image',ownerEntryId:'0'},items));assert(M.visible({type:'image'},items));
});
