'use strict';
// Original educational arithmetic tests; no device, vendor code, or firmware is used.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm=require('node:vm'); const context={window:{}};vm.createContext(context);vm.runInContext(fs.readFileSync(path.join(__dirname,'engineering-cases.js'),'utf8'),context);
const c=context.window.SensorCases.find(c=>c.id==='ti-ads131m04-time-identity');
const overview=context.window.SensorCaseOverviews[c.id];
let count=0;
function test(name, f) {f();count++;console.log('PASS',name);}
function near(a,b,e=1e-10){assert.ok(Math.abs(a-b)<e,`${a} != ${b}`);}
function phaseLimits(osr){assert.ok([64,128,256,512,1024,2048,4096,8192,16384].includes(osr));const half=Math.min(osr/2,512);return [-half,half-1];}
function groupDelay(n,fmod){return 3*(n-1)/(2*fmod);}
function conv(a,b){const out=Array(a.length+b.length-1).fill(0);for(let i=0;i<a.length;i++)for(let j=0;j<b.length;j++)out[i+j]+=a[i]*b[j];return out;}
test('seven blocks and four bench items',()=>{assert.equal(c.blocks.length,7);const b=c.blocks.find(x=>x.title==='待执行的台架验收清单');assert.equal(b.bullets.length,4);});
test('schema and evidence boundaries',()=>{assert.equal(c.status,'待学习');assert.match(c.conditions,/版本/);assert.match(c.conditions,/HR/);assert.match(c.conditions,/软件相位补偿/);assert.match(c.reproduction,/未本站实物复现/);assert.match(c.blocks[2].paragraphs.join(''),/不能直接从主机接收时间减去/);for(const x of Object.values(overview))assert.ok(x.length>10);const ids=new Set(c.sources.map(s=>s.id));for(const b of c.blocks)for(const id of b.sourceIds||[])assert.ok(ids.has(id));});
test('HR nominal clock and 8 kSPS arithmetic',()=>{const clkin=8192000,fmod=clkin/2;assert.equal(fmod,4096000);assert.equal(fmod/512,8000);near(512/fmod*1e6,125);near(1/fmod*1e9,244.140625);});
test('power-mode nominal clocks are not interchangeable',()=>{assert.equal((4096000/2)/512,4000);assert.equal((2048000/2)/512,2000);});
test('phase bounds change with OSR and saturate at 10-bit range',()=>{assert.deepEqual(phaseLimits(128),[-64,63]);assert.deepEqual(phaseLimits(512),[-256,255]);assert.deepEqual(phaseLimits(1024),[-512,511]);assert.deepEqual(phaseLimits(4096),[-512,511]);assert.throws(()=>phaseLimits(511));});
test('ideal sinc cubed group delay, not device latency',()=>{near(groupDelay(512,4096000)*1e6,187.1337890625);near(groupDelay(1024,4096000)*1e6,374.6337890625);assert.notEqual(groupDelay(512,4096000),512/4096000);});
test('independent convolution verifies support and centroid',()=>{const n=8,avg=Array(n).fill(1/n),h=conv(conv(avg,avg),avg);assert.equal(h.length,3*(n-1)+1);near(h.reduce((a,v)=>a+v,0),1);near(h.reduce((a,v,i)=>a+i*v,0),3*(n-1)/2);for(let i=0;i<h.length;i++)near(h[i],h[h.length-1-i]);});
test('original 50 Hz phase and power counterexample',()=>{const dt=32/4096000,angle=2*Math.PI*50*dt;near(dt*1e6,7.8125);near(angle*180/Math.PI,.140625);near(100*(Math.cos(Math.PI/3+angle)/Math.cos(Math.PI/3)-1),-.42540999546009095);});
test('common time shift does not change ideal relative phase',()=>{const omega=2*Math.PI*50,t=.004,delay=.000020,phi=Math.PI/3;near((omega*(t-delay)+phi)-(omega*(t-delay)),phi);});
console.log(`${count} checks passed; synthetic arithmetic and content only, no hardware verification.`);
