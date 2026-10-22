'use strict';
// Independent teaching model only: not peripheral emulation or firmware.
const assert = require('node:assert/strict');
const fs=require('node:fs'), vm=require('node:vm'), ctx={window:{}};
vm.runInNewContext(fs.readFileSync(__dirname+'/engineering-cases.js','utf8'),ctx);
const addition={case:ctx.window.SensorCases.find(c=>c.id==='st-center-aligned-trigger'),overview:ctx.window.SensorCaseOverviews['st-center-aligned-trigger']};
function cycle(arr,cc,cms){
  if(!Number.isInteger(arr)||!Number.isInteger(cc)||arr<2||cc<=0||cc>=arr||![1,2,3].includes(cms))throw new RangeError('Interior CCR and CMS 1/2/3 only');
  const samples=[];
  for(let t=0;t<2*arr;t++){
    const up=t<arr, cnt=up?t:2*arr-t;
    samples.push({t,cnt,up,oc:up?cnt<cc:cnt<=cc,compare:cnt===cc&&(cms===3||(cms===2&&up)||(cms===1&&!up))});
  }
  const rising=[],falling=[];
  samples.forEach((s,i)=>{const prev=samples[(i+samples.length-1)%samples.length];if(!prev.oc&&s.oc)rising.push(i);if(prev.oc&&!s.oc)falling.push(i);});
  return {rising,falling,pulses:samples.filter(s=>s.compare).map(s=>s.t),updates:[arr,2*arr],period:samples.length};
}
for(const cms of [1,2,3]){
 const x=cycle(50,20,cms);
 assert.deepEqual(x.rising,[80]);assert.deepEqual(x.falling,[20]);assert.equal(x.period,100);
 assert.deepEqual(x.pulses,cms===1?[80]:cms===2?[20]:[20,80]);
 assert.deepEqual(x.updates,[50,100]);
}
assert.equal(cycle(50,20,3).pulses.length/100e-6,20000);
assert.equal(cycle(50,20,3).rising.length/100e-6,10000);
assert.deepEqual(cycle(100,30,3).pulses,[30,170]);
assert.equal(cycle(100,30,3).rising.length/200e-6,5000);
for(const bad of [0,50,51,-1])assert.throws(()=>cycle(50,bad,3),RangeError);
// A preload register is not an atomic pair transaction. Commit simulated at real two boundaries.
function commits(writes){const pre=[20,20],out=[];for(let t=0;t<=100;t++){
 for(const w of writes.filter(w=>w.t===t))pre[w.channel]=w.value;
 if(t===50||t===100)out.push({t,active:[...pre]});
 }return out;}
assert.deepEqual(commits([{t:49,channel:0,value:30},{t:51,channel:1,value:15}]),[{t:50,active:[30,20]},{t:100,active:[30,15]}]);
assert.deepEqual(commits([{t:48,channel:0,value:30},{t:49,channel:1,value:15}]),[{t:50,active:[30,15]},{t:100,active:[30,15]}]);
assert.deepEqual(commits([{t:51,channel:0,value:30},{t:52,channel:1,value:15}]),[{t:50,active:[20,20]},{t:100,active:[30,15]}]);
assert.equal(addition.case.blocks.length,7);assert.equal(addition.case.status,'待学习');
assert.equal(addition.case.verified,'2026-10-22');
assert.deepEqual(Object.keys(addition.overview).sort(),['boundary','method','problem','takeaway']);
assert.equal(new Set(addition.case.sources.map(s=>s.id)).size,addition.case.sources.length);
for(const b of addition.case.blocks)for(const id of b.sourceIds||[])assert.ok(addition.case.sources.some(s=>s.id===id));
console.log('PASS: original center-aligned event, preload-epoch, boundary and case-schema checks. No hardware claim.');
// Independently calculated ADC budget: document conditions, not measured timing.
const adcMHz=84/4, acquisitionUs=28/adcMHz, conversionUs=(28+12)/adcMHz;
const externalLatencyUs=2/adcMHz+1/84;
assert.equal(adcMHz,21);assert.ok(adcMHz<36);
assert.equal(acquisitionUs.toFixed(3),'1.333');assert.equal(conversionUs.toFixed(3),'1.905');
assert.equal(externalLatencyUs.toFixed(3),'0.107');
assert.equal((80+externalLatencyUs+acquisitionUs).toFixed(3),'81.440');
assert.equal((80+externalLatencyUs+conversionUs).toFixed(3),'82.012');
assert.ok(80>=79.5&&80+externalLatencyUs+acquisitionUs<=82.5);
assert.ok(80+externalLatencyUs+conversionUs<83);
assert.ok(80+externalLatencyUs+acquisitionUs>81); // A tighter window must fail.
assert.ok(addition.case.sources.some(s=>s.id==='ds'));
console.log('PASS: independent ADC acquisition / conversion / trigger-latency teaching budget.');
