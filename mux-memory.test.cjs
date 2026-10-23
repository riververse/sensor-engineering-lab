'use strict';
// Original first-order recurrence and schedule arithmetic, not a device simulation.
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),crypto=require('node:crypto');
const ctx={window:{}};vm.runInNewContext(fs.readFileSync(__dirname+'/engineering-cases.js','utf8'),ctx);
const cases=JSON.parse(JSON.stringify(ctx.window.SensorCases)),overviews=JSON.parse(JSON.stringify(ctx.window.SensorCaseOverviews));
let checks=0;const ok=(v,m)=>{assert.ok(v,m);checks++;};const near=(v,e,t=1e-12)=>ok(Math.abs(v-e)<=t,`${v} ~ ${e}`);
const c=cases.find(c=>c.id==='adi-mux-order-memory');
assert.equal(c.status,'待学习');assert.equal(c.reproduction,'未本站实物复现');assert.equal(c.verified,'2026-10-23');
assert.equal(c.blocks.length,7);assert.deepEqual(Object.keys(overviews[c.id]).sort(),['boundary','method','problem','takeaway']);
for(const b of c.blocks)for(const id of b.sourceIds||[])ok(c.sources.some(s=>s.id===id),'claim source exists');
for(const s of c.sources)assert.equal(new URL(s.url).hostname,'www.analog.com');
for(const phrase of ['2014-11','2024-04','2018-04','2009-07','Σ-Δ','不是 SAR','1,000','300 μV','原始逐点数据','尚未执行','不是 AD7176-2 的内部模型','没有可直接烧录'])ok(JSON.stringify([c,overviews[c.id]]).includes(phrase),'evidence scope '+phrase);
// Numeric model guards make assumptions explicit.
function step(previous,input,t,tau){if(![previous,input,t,tau].every(Number.isFinite)||t<0||tau<=0)throw new RangeError('finite inputs and t>=0,tau>0');return input+(previous-input)*Math.exp(-t/tau);}
function required(delta,epsilon,tau){if(![delta,epsilon,tau].every(Number.isFinite)||delta<0||epsilon<=0||tau<=0)throw new RangeError('invalid budget');return delta<=epsilon?0:tau*Math.log(delta/epsilon);}
const lsb=3.3/65536,epsilon=lsb/2,a=Math.exp(-2/.4),bias=2*a/(1+a);
near(epsilon*1e6,25.177001953125);near(bias,.013385701848569713);near(bias/lsb,265.8319261660196);
let y=1,high,low;for(let i=0;i<1000;i++){y=step(y,3,2,.4);high=y;y=step(y,1,2,.4);low=y;}
near(low,1+bias);near(high,3-bias);ok(high<3&&low>1,'opposite systematic signs');
const observations=[];for(let i=0;i<100;i++){y=step(y,3,2,.4);y=step(y,1,2,.4);observations.push(y);}
near(Math.max(...observations)-Math.min(...observations),0);ok(Math.abs(observations[0]-1)>epsilon,'stable histogram can still be biased');
const t=required(2,epsilon,.4);near(t,4.513090712642632);near(Math.abs(step(1,3,t,.4)-3),epsilon,1e-15);
ok(Math.abs(step(1,3,t-.01,.4)-3)>epsilon,'shortened window fails');
near(required(0,epsilon,.4),0);near(required(epsilon/2,epsilon,.4),0);
near(step(3,3,2,.4),3);near(step(1,3,0,.4),1);
const fiveBias=2*Math.exp(-5/.4)/(1+Math.exp(-5/.4));near(fiveBias*1e6,7.453278568373123);ok(fiveBias<epsilon);
const slowBias=2*Math.exp(-5/.8)/(1+Math.exp(-5/.8));near(slowBias*1e3,3.853469326654951);ok(slowBias>epsilon);near(slowBias/lsb,76.52756539141177,1e-8);
const slot=.2+t+1,frame=3*slot,skew=2*slot;
near(frame,17.139272137927897);near(skew,11.426181425285265);ok(frame>15,'hypothetical frame target fails');near(1e6/frame/1000,58.34553486008759,1e-8);
// The first and last channels are not simultaneous; aggregate output rate differs by 3x.
near(3e6/frame/(1e6/frame),3);
for(const bad of [[1,3,-1,.4],[1,3,2,0],[NaN,3,2,.4]])assert.throws(()=>step(...bad),RangeError);
// Original eight case/overview objects frozen by reviewed baseline hashes.
const hash=x=>crypto.createHash('sha256').update(JSON.stringify(x)).digest('hex');
const expected={
  "ti-tipd120": {
    "case": "cd4a403cb3a9ed24ba84887f4bc891c837b6f223cfbf9a1f2b247664984372b5",
    "overview": "284da7fe6bc4119d623539f2a4c8dac78975bee9c8c1a6c96869e48fbb010f4d"
  },
  "adi-cn0359": {
    "case": "105be051b1931975268eaf524750e383c0a9d4f3f05db34ad5b5f0e8048e2ee0",
    "overview": "605aa54e9bc4d9660a8b4efdf74a55b39fd721bf4925b94e3e9fb0a7e1de6b40"
  },
  "st-an4073": {
    "case": "9fb929fa6e7e6e96896a4cc2edc2cf19572ed8de8fe31c8e78b0feaaeda1c33d",
    "overview": "5aeb747db132837824f3e6b175b6a2dfdd1c3b1c1f05aec4c9a17af16345d0df"
  },
  "st-adc-overrun": {
    "case": "699864f322149665139437946f08a1143bd5e44f3184f02f9d9afaef36878b8c",
    "overview": "6208e5e1e32d440fa666c0000621dac0ff36ead9c5e374c8f4d42ae4df22f029"
  },
  "ti-ads1256-mux": {
    "case": "9b987bc0d6a35aac0aa85e64e6ac05c94fe1133a0814ccfeb362e8b996a8bbee",
    "overview": "b8caca20977c4396e84d380b5259876445ee8e926fb15f356d274b262e5bd61a"
  },
  "st-dma2-gpio-contention": {
    "case": "813d8db6bf1f1943d9f91da44214850b11dd22b9874b651577c428bd63f69313",
    "overview": "bbc10a9fb82539773c167271e3855396ddca598d09a741e44049890575cb1ce5"
  },
  "st-m7-adc-cache": {
    "case": "b984f6eb02bc6e5d47b797ad02a4d2996354b1288f955fa9452cbf303f90d884",
    "overview": "8e6d6c9cecbe7af564cd65255d913193f10891af935dce4b1b05ed5bd154743a"
  },
  "st-center-aligned-trigger": {
    "case": "c8adfcdc8a86aefc417a605bcd865cead159b8ff0d1b986ea4a09d1a8b4ad724",
    "overview": "1213bd29d599da286adabbbf42ae7f8e56c4e12b9d746665590143fda27e86a5"
  }
};
for(const [id,digests] of Object.entries(expected)){assert.equal(hash(cases.find(c=>c.id===id)),digests.case,id+' legacy case unchanged');assert.equal(hash(overviews[id]),digests.overview,id+' legacy intro unchanged');checks+=2;}
console.log(`${checks} independent mux-memory, schedule, evidence and legacy-preservation checks passed. No hardware or vendor code executed.`);
