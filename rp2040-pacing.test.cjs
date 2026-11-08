/* Original bounded integer scheduling model, not Raspberry Pi code.
 * Fixed ideal clock, n >= 96, uninterrupted single-channel stream, no loss.
 * Accumulator phase is synthetic, not a silicon reset-state assertion.
 * No firmware, network, hardware, file writes or persistent-state changes. */
'use strict';
const fs=require('node:fs'),vm=require('node:vm'),crypto=require('node:crypto'),assert=require('node:assert/strict');
let checks=0;
const eq=(a,b,m)=>{assert.deepEqual(a,b,m);checks++;};
const ok=(v,m)=>{assert.ok(v,m);checks++;};
const near=(a,b,tol=1e-8)=>ok(Number.isFinite(a)&&Math.abs(a-b)<tol,`${a} versus ${b}`);
const rejects=f=>{assert.throws(f,RangeError);checks++;};
function schedule(n,f,count,phase=0){
 if(![n,f,count,phase].every(Number.isSafeInteger)||n<96||n>65535||f<0||f>255||count<0||count>4096||phase<0||phase>255)throw new RangeError('bounded integer fields');
 let accumulator=phase,cycles=0;const intervals=[],starts=[0];
 for(let i=0;i<count;i++){
  accumulator+=f;let interval=n+1;
  if(accumulator>=256){accumulator-=256;interval++;}
  intervals.push(interval);cycles+=interval;starts.push(cycles);
 }
 return {intervals,starts,phase:accumulator,cycles};
}
function clocked(n,f,hz){
 if(!Number.isFinite(hz)||hz<=0)throw new RangeError('positive finite clock');
 schedule(n,f,0);
 const meanCycles=n+1+f/256;
 return {meanCycles,rate:hz/meanCycles,short:(n+1)/hz,long:(n+2)/hz};
}
const a=clocked(1087,111,48e6),s=schedule(1087,111,256);
eq(a.meanCycles,1088.43359375);near(a.rate,44100.07213634846);
near((a.rate/44100-1)*1e6,1.6357448631154625);
near(a.short*1e6,22.666666666666668);near(a.long*1e6,22.6875);
near((a.long-a.short)*1e9,20.833333333333);eq(s.cycles,278639);
eq(s.intervals.filter(x=>x===1088).length,145);eq(s.intervals.filter(x=>x===1089).length,111);
eq(s.starts.length,257,'256 intervals connect 257 start points');eq(s.phase,0);
near(s.cycles/48e6*1e6,5804.979166666667);
eq(s.intervals.slice(0,12),[1088,1088,1089,1088,1089,1088,1089,1088,1088,1089,1088,1089]);
const errors=s.starts.map((t,k)=>t-k*a.meanCycles);
eq(Math.min(...errors),-255/256);eq(Math.max(...errors),0);eq(errors.at(-1),0);
// Closed-form oracle uses total fractional carry, independent of loop state.
for(const n of [96,999,1087,65535])for(let f=0;f<=255;f++)for(const phase of [0,1,127,255]){
 const r=schedule(n,f,256,phase);
 eq(r.cycles,256*(n+1)+f,'whole-block cycles independent of initial phase');
 eq(r.phase,phase,'fractional state recurs after 256 intervals');
 eq(r.intervals.filter(x=>x===n+2).length,f);
 ok(r.intervals.every(x=>x===n+1||x===n+2));
 for(const k of [0,1,2,7,128,255,256]){
  eq(r.starts[k],k*(n+1)+Math.floor((phase+k*f)/256),'closed-form accumulated time');
  const err=r.starts[k]-k*(n+1+f/256);
  ok(err>-1&&err<1,'phase error bounded by one ideal clock in this model');
 }
}
// Explicit quantizer for ideal real arithmetic only, NOT an execution of SDK float code.
const encodeIdeal=(hz,rate)=>Math.round((hz/rate-1)*256);
eq(encodeIdeal(48e6,44100),278383);eq(278383>>8,1087);eq(278383&255,111);
const missedOne=Math.round(48e6/44100*256);
eq(missedOne,278639);near(48e6/(1+missedOne/256),44059.59231969021);
near((48e6/(1+missedOne/256)/44100-1)*1e6,-916.2739299272138);
near(48e6/1088,44117.64705882353);near((48e6/1088/44100-1)*1e6,400.16006402576744);
eq(encodeIdeal(48e6,48000),999*256);eq(clocked(999,0,48e6).rate,48000);
eq(new Set(schedule(999,0,100).intervals).size,1);
near(clocked(999,0,48e6*1.0001).rate,48004.8);
eq(schedule(1087,128,4,0).intervals,[1088,1089,1088,1089]);
eq(schedule(1087,128,4,128).intervals,[1089,1088,1089,1088]);
eq(schedule(1087,128,4,0).cycles,schedule(1087,128,4,128).cycles);
// A 1000-point span has 999 intervals, regardless of transport completion time.
const thousand=schedule(1087,111,999);eq(thousand.starts.length,1000);
ok(thousand.cycles!==schedule(1087,111,1000).cycles);
const doubled=clocked(1087,111,96e6);near(doubled.rate,2*a.rate);near(doubled.short,a.short/2);
eq(schedule(1087,111,0),{intervals:[],starts:[0],phase:0,cycles:0});
for(const args of [[95,0,1],[65536,0,1],[96,-1,1],[96,256,1],[96,0,-1],[96,0,4097],[96,0,1,-1],[96,0,1,256],[96.5,0,1],[96,NaN,1],[96,0,Infinity]])rejects(()=>schedule(...args));
for(const hz of [0,-1,NaN,Infinity])rejects(()=>clocked(1087,111,hz));
const read=f=>fs.readFileSync(__dirname+'/'+f,'utf8'),source=read('engineering-cases.js');
const marker='\n// Original RP2040 fractional-pacing case; all twenty-one prior cases retained unchanged.\n';
eq(source.split(marker).length,2);
eq(crypto.createHash('sha256').update(source.split(marker)[0]).digest('hex'),'01c83a855044082c49b1f1628d585da43b6a39f44b7b9449be0449057af21727','all 21 old cases and overviews retained byte-for-byte');
const ctx={window:{}};vm.runInNewContext(source,ctx);const c=ctx.window.SensorCases.find(x=>x.id==='rpi-rp2040-fractional-pacing');
eq(ctx.window.SensorCases.length,24);eq(Object.keys(ctx.window.SensorCaseOverviews).length,24);
eq(c.status,'待学习');eq(c.reproduction,'未本站实物复现');eq(c.verified,'2026-11-05');eq(c.blocks.length,7);eq(c.sources.length,7);
const prose=JSON.stringify(c);
for(const term of ['非 RP2350','3184e62-clean','2.3.1','DREQ_ADC=36','INT=1087','FRAC=111','44100.072136','1088.43359375','44059.592320','257 个启动点','a₀=0','不是官方示例原参数','尚未执行','不是把 SAR ADC 变成了','未编译、执行或烧录','CC BY-ND 4.0','BSD-3-Clause'])ok(prose.includes(term),term);
for(const b of c.blocks)for(const id of b.sourceIds||[])ok(c.sources.some(s=>s.id===id));
for(const s of c.sources){const u=new URL(s.url);eq(u.protocol,'https:');if(u.hostname==='github.com')ok(/\/blob\/[0-9a-f]{40}\//.test(u.pathname),'immutable source');}
eq(crypto.createHash('sha256').update(read('app.js').replace('TI、ADI、ST、Nordic、Bosch Sensortec、NXP、Raspberry Pi 的','TI、ADI、ST、Nordic、Bosch Sensortec、NXP 的')).digest('hex'),'475123490227bd353c3000e1dc3289110a4258426f21add3a0557eaf1146bef3','renderer only adds manufacturer name');
for(const [f,h] of [['style.css','ae22afcc302123fba024b368a60e63ca2eb05b38590056c7a6210692b7b2b25e'],['models.js','61aeeaa1ceface1d6eac26594e34e791503dec2b3d126e7514f98df20c0546e5'],['content.js','b515149000b53e48a593c74df58a7a34d563b48f6c878c99a73ad615e9cdcf40'],['mcu-timing.js','75b49417d443c63eb78804e2689b29c2b3329fed617896bb89f547c91e431416']])eq(crypto.createHash('sha256').update(read(f)).digest('hex'),h,f+' unchanged');
ok(read('index.html').includes('engineering-cases.js?v=20261108.1'));ok(read('index.html').includes('app.js?v=20261105.1'));ok(read('index.html').includes('二十四篇来源核验工程案例'));
console.log(`${checks} original RP2040 fractional-pacing, timing-oracle and preservation assertions passed. No hardware or vendor code executed.`);
