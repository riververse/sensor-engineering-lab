// Original offline teaching model. Not MCU firmware or hardware validation.
'use strict';
const assert = require('node:assert/strict');
function encode(frames) {
  return Array.from({length:frames},(_,k)=>[100+k,1100+k,2100+k]).flat();
}
function decode(samples) {
  if(samples.length%3) throw new Error('incomplete frame');
  return Array.from({length:samples.length/3},(_,k)=>samples.slice(3*k,3*k+3));
}
function validIdentity(frames) {
  return frames.every((f,k)=>f[0]===100+k&&f[1]===1100+k&&f[2]===2100+k);
}
const stream=encode(128);
assert.equal(stream.length,384);
assert.equal(stream.length*2,768);
assert.equal(stream.length/2%3,0);
assert(validIdentity(decode(stream)));
assert.deepEqual(decode(stream)[64],[164,1164,2164]);
assert.throws(()=>decode(stream.slice(1)),/incomplete/);
// Losing one item and padding can preserve length, but not sample identity.
const damaged=stream.slice(); damaged.splice(5,1); damaged.push(0);
assert.equal(damaged.length,384);
assert(!validIdentity(decode(damaged)));
assert(!validIdentity(decode(stream.map((_,i)=>stream[(i+1)%stream.length]))));
const adcClock=21e6, sampleCycles=56, sarCycles=12, frameRate=20e3;
const conversion=(sampleCycles+sarCycles)/adcClock;
assert(Math.abs(conversion*1e6-3.238095238)<1e-8);
assert.equal(frameRate*3*2,120000);
assert.equal(64/frameRate,0.0032);
assert(conversion<1/frameRate);
assert.equal(Math.max(conversion,conversion,conversion),conversion);
assert(Math.abs((144+12)/adcClock*1e6-7.428571429)<1e-8);
assert.equal((3*65)%3,0);
assert.notEqual(Math.floor((3*65)/2)%3,0); // Total whole frames does not guarantee a whole-frame half boundary.
console.log('PASS: mode1 identity, loss detection, half-buffer boundaries and timing arithmetic (offline model only).');

const fs=require('node:fs'),vm=require('node:vm');
const ctx={window:{}};vm.runInNewContext(fs.readFileSync(__dirname+'/engineering-cases.js','utf8'),ctx);
const c=ctx.window.SensorCases.find(c=>c.id==='stm32f407-triple-simultaneous-identity');
assert.equal(c.status,'待学习');assert.equal(c.reproduction,'未本站实物复现');assert.equal(c.verified,'2026-10-25');assert.equal(c.blocks.length,7);
const text=JSON.stringify(c);
for(const phrase of ['RM0090 Rev 22','ES0182 Rev 19','MULTI=10110','EXTSEL=0110','DMA2 Channel 0 Stream 0/4','逐半字','32位','AN3116','不提供直接接线','尚未执行','120,000 B/s'])assert.ok(text.includes(phrase),phrase);
assert.equal(c.blocks.find(b=>b.title==='待执行的台架验收清单').bullets.length,4);
assert.match(ctx.window.SensorCaseOverviews[c.id].boundary,/未本站实物复现/);
console.log('PASS: exact source revision, trigger mapping, uncertainty and unexecuted bench boundaries.');
