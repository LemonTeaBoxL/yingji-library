const test=require('node:test');
const assert=require('node:assert/strict');
const appearance=require('../dist/appearance.js');

test('older preference files gain glass defaults while retaining theme and scale',()=>{
  const p=appearance.normalize({theme:'ocean',density:'compact',zoom:1.5});
  assert.equal(p.theme,'ocean');assert.equal(p.zoom,1.5);assert.equal(p.density,'compact');
  assert.equal(p.interfaceStyle,'liquid');assert.equal(p.glassFrost,18);assert.equal(p.glassWhiteness,38);
  assert.equal(appearance.normalize({interfaceStyle:'classic'}).interfaceStyle,'classic');
});

test('damaged material settings cannot produce invalid CSS or unbounded filters',()=>{
  const p=appearance.normalize({glassFrost:999,glassWhiteness:-20,glassRefraction:Infinity,glassMotion:'yes',interfaceStyle:'bad',theme:'bad'});
  assert.equal(p.glassFrost,40);assert.equal(p.glassWhiteness,0);assert.equal(p.glassRefraction,58);
  assert.equal(p.glassMotion,true);assert.equal(p.theme,'system');assert.equal(p.interfaceStyle,'liquid');
  for(const input of [null,undefined,'broken',[],{glassFrost:null},{glassFrost:''},{glassFrost:false}]){
    assert.equal(appearance.normalize(input).glassFrost,18);
  }
});

test('white concentration stays monotonic and dark themes keep their dark base',()=>{
  for(const dark of [false,true]){
    const clear=appearance.material({glassWhiteness:0,glassFrost:0},dark);
    const milk=appearance.material({glassWhiteness:100,glassFrost:40},dark);
    assert.ok(clear.fill<milk.fill&&clear.veil<milk.veil);
    assert.equal(clear.frost,0);assert.equal(milk.frost,40);
    assert.ok(milk.fill<=1&&milk.veil<=1);
    if(dark){assert.ok(milk.fill<.2);assert.ok(milk.veil<.1)}
    assert.equal(appearance.material({glassMotion:false},dark).lens.materialize,0);
  }
});
