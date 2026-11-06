/* Original completed-event teaching model. NOT ST code, silicon arbitration,
 * sampling-aperture simulation, register configuration, DMA driver or bench test.
 * Events are supplied by an oracle, in an explicit order. Only valid, completed
 * regular conversions enter the model. An interrupted partial attempt is absent.
 * No network, candidate code, hardware, file writes or persistent storage. */
'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),crypto=require('node:crypto');
let checks=0;
const eq=(a,b,m)=>{assert.deepEqual(a,b,m);checks++;};
const ok=(a,m)=>{assert.ok(a,m);checks++;};
const near=(a,b)=>ok(Number.isFinite(a)&&Math.abs(a-b)<1e-10,`${a} != ${b}`);
const rejects=f=>{assert.throws(f,RangeError);checks++;};
const mean=a=>a.reduce((s,v)=>s+v,0)/a.length;
function accumulate(events,n,mode){
 if(!Array.isArray(events)||!Number.isInteger(n)||n<2||n>256||(n&(n-1))||!['continued','resumed'].includes(mode))throw new RangeError('bounded ratio and named mode');
 let pending=[],out=[],last=-Infinity;const seen=new Set();
 for(const e of events){
  if(!e||!['complete','inject'].includes(e.type)||!Number.isFinite(e.time)||e.time<0||e.time<last)throw new RangeError('ordered finite events');
  last=e.time;
  if(e.type==='inject'){if(mode==='resumed')pending=[];continue;}
  if(typeof e.id!=='string'||!e.id||seen.has(e.id)||!Number.isFinite(e.value))throw new RangeError('unique completed contributor');
  seen.add(e.id);pending.push({...e});
  if(pending.length===n){
   const times=pending.map(p=>p.time),centroid=mean(times);
   out.push({time:e.time,contributors:pending,mean:mean(pending.map(p=>p.value)),centroid,span:e.time-times[0],age:e.time-centroid});pending=[];
  }
 }
 return {out,pending};
}
const c=(time,value=100+4*time,id='r'+time)=>({type:'complete',time,value,id});
const injection=time=>({type:'inject',time});
// At t=2, completion is deliberately processed BEFORE injection. This ordering
// is part of the hypothetical fixture, not a claim about coincident hardware edges.
function singleGap(gap){return [c(1),c(2),injection(2),...Array.from({length:4},(_,i)=>c(3+gap+i))];}
const input=singleGap(3),snapshot=JSON.stringify(input);
const continued=accumulate(input,4,'continued'),resumed=accumulate(input,4,'resumed');
eq(JSON.stringify(input),snapshot,'model never mutates input');
eq(continued.out[0].contributors.map(x=>x.time),[1,2,6,7]);
eq(resumed.out[0].contributors.map(x=>x.time),[6,7,8,9]);
for(const [a,t,mu,span,value,age,latest] of [[continued.out[0],7,4,6,116,3,128],[resumed.out[0],9,7.5,3,130,1.5,136]]){
 near(a.time,t);near(a.centroid,mu);near(a.span,span);near(a.mean,value);near(a.age,age);near(a.contributors.at(-1).value,latest);near(latest-a.mean,4*age);
}
eq(continued.pending.map(x=>x.time),[8,9]);eq(resumed.pending,[]);
for(const gap of [0,1,3,8,20,100]){
 const ca=accumulate(singleGap(gap),4,'continued').out[0],ra=accumulate(singleGap(gap),4,'resumed').out[0];
 near(ca.time,4+gap);near(ca.centroid,2.5+gap/2);near(ca.age,1.5+gap/2);
 near(ra.time,6+gap);near(ra.centroid,4.5+gap);near(ra.age,1.5);
 near(ca.mean,100+4*ca.centroid);near(ra.mean,100+4*ra.centroid);
}
const gap8c=accumulate(singleGap(8),4,'continued').out[0],gap8r=accumulate(singleGap(8),4,'resumed').out[0];
eq(gap8c.contributors.map(x=>x.time),[1,2,11,12]);near(gap8c.centroid,6.5);near(gap8c.age,5.5);
eq(gap8r.contributors.map(x=>x.time),[11,12,13,14]);near(gap8r.centroid,12.5);near(gap8r.age,1.5);
for(const mode of ['continued','resumed']){
 const constInput=input.map(e=>e.type==='complete'?{...e,value:1234}:e);
 near(accumulate(constInput,4,mode).out[0].mean,1234);
 eq(accumulate([],4,mode),{out:[],pending:[]});
 eq(accumulate([c(1),c(2),c(3)],4,mode).out,[],'partial group does not publish');
}
// A finite run demonstrates finite absence only. General starvation follows
// from each segment containing <N valid completions, not from waiting longer.
function repeated(repeats){let events=[],t=0;for(let j=0;j<repeats;j++){events.push(c(++t),c(++t),injection(t));t+=3;}return {events,t};}
for(let k=1;k<=40;k++){
 const {events,t}=repeated(k),a=accumulate(events,4,'continued'),b=accumulate(events,4,'resumed');
 eq(a.out.length,Math.floor(k/2));eq(b.out.length,0);eq(b.pending,[]);
 if(k>=2)eq(a.out[0].contributors.map(x=>x.time),[1,2,6,7]);
 const recovery=accumulate([...events,...Array.from({length:4},(_,i)=>c(t+i+1))],4,'resumed');
 eq(recovery.out.length,1);eq(recovery.out[0].contributors.map(x=>x.time),[t+1,t+2,t+3,t+4]);
 near(recovery.out[0].age,1.5);
}
// Exhaustive finite event strings: independent segment-count and ID oracle.
// Does not generate or execute vendor code or make statistical noise claims.
for(let mask=0;mask<256;mask++){
 const events=Array.from({length:8},(_,j)=>(mask>>j)&1?injection(j+1):c(j+1));
 const all=events.filter(e=>e.type==='complete');
 let segments=[[]];for(const e of events){if(e.type==='inject')segments.push([]);else segments.at(-1).push(e);}
 for(const n of [2,4,8])for(const mode of ['continued','resumed']){
  const groups=mode==='continued'?[all]:segments;
  const expected=groups.flatMap(s=>Array.from({length:Math.floor(s.length/n)},(_,j)=>s.slice(j*n,j*n+n).map(e=>e.id)));
  const actual=accumulate(events,n,mode);
  eq(actual.out.map(o=>o.contributors.map(e=>e.id)),expected);
  const used=actual.out.flatMap(o=>o.contributors.map(e=>e.id));eq(new Set(used).size,used.length);
  for(const o of actual.out){eq(o.contributors.length,n);ok(o.age>=0);near(o.mean,100+4*o.centroid);eq(o.time,o.contributors.at(-1).time);}
 }
}
for(const n of [2,4,8,16,32,64,128,256]){
 const e=Array.from({length:n},(_,i)=>c(i+1));for(const mode of ['continued','resumed'])eq(accumulate(e,n,mode).out.length,1);
}
for(const n of [0,1,3,-4,257,512,NaN,Infinity,2.5])rejects(()=>accumulate([],n,'continued'));
rejects(()=>accumulate([],4,'restart'));rejects(()=>accumulate(null,4,'continued'));
for(const events of [[null],[{type:'partial',time:1}],[c(NaN)],[c(Infinity)],[c(-1)],[c(2),c(1)],[c(1,NaN)],[c(1,Infinity)],[c(1,0,'')],[c(1),c(2,0,'r1')]])rejects(()=>accumulate(events,4,'continued'));

// Exact source-prefix preservation includes all seventeen prior case objects
// and their overviews. Keep the hash fixed when a future case is appended.
const read=f=>fs.readFileSync(__dirname+'/'+f,'utf8'),source=read('engineering-cases.js');
const marker='\n// Original oversampling-interruption case; all seventeen prior cases retained unchanged.\n';
ok(source.includes(marker));eq(crypto.createHash('sha256').update(source.slice(0,source.indexOf(marker))).digest('hex'),'d86809793143209c476ab4e2ae84adb6dfd85478d4ae5f62bfdc3c241dadebd0');
const context={window:{}};vm.runInNewContext(source,context);const cases=JSON.parse(JSON.stringify(context.window.SensorCases));
eq(cases.length,22);eq(new Set(cases.map(c=>c.id)).size,22);
const study=cases.find(c=>c.id==='st-l476-oversampling-interrupt');eq(cases[17].id,study.id);eq(study.status,'待学习');eq(study.verified,'2026-11-01');eq(study.published,'2015-06');eq(study.reproduction,'未本站实物复现');eq(study.blocks.length,7);eq(study.sources.length,3);
const prose=JSON.stringify(study);
for(const token of ['STM32L476','TROVS=0','JOVSE=0','ROVSM=0/TROVS=1','不支持','OVSR','OVFS','2026-04-02','2025-05-26','[1,2,6,7]','116','130','128','136','1.5','5.5','0x1003','0x1007','超过 1 ms','弃首留次','不是对芯片同时到达边沿','模型假定所有入账','有限测试只能证明观察区间','尚未执行','未下载、编译、执行或烧录候选代码','没有本站或独立第三方实物复现'])ok(prose.includes(token),token);
eq(study.blocks.find(b=>b.title==='待执行的台架验收清单').bullets.length,4);
for(const b of study.blocks)for(const id of b.sourceIds||[])ok(study.sources.some(s=>s.id===id));
ok(read('index.html').includes('engineering-cases.js?v=20261105.1'));
console.log(`${checks} original completed-event, age, liveness, validation and exact legacy-preservation checks passed. No silicon timing, candidate code or board executed.`);
