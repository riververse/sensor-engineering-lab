/* Original nominal event/acceptance model. No TI code, silicon timing,
 * register driver, network, hardware, writes or persistent state.
 * One successful instantaneous config submission, strict event order,
 * known initial conversion start, ideal periodic completions; no analog model.
 * completion_id and epoch below are application/oracle fields, not ADC fields. */
'use strict';
const fs=require('node:fs'),vm=require('node:vm'),crypto=require('node:crypto'),assert=require('node:assert/strict');
let checks=0;
const eq=(a,b,m)=>{assert.deepEqual(a,b,m);checks++;};
const ok=(v,m)=>{assert.ok(v,m);checks++;};
const near=(a,b)=>ok(Number.isFinite(a)&&Math.abs(a-b)<1e-9,`${a} versus ${b}`);
const rates=[8,16,32,64,128,250,475,860];
function timeline(oldRate,newRate,writeAt){
 if(!rates.includes(oldRate)||!rates.includes(newRate)||!Number.isFinite(writeAt)||writeAt<=0||writeAt>=1000/oldRate)throw new RangeError('interior phase and documented nominal rates only');
 const oldEnd=1000/oldRate,newEnd=oldEnd+1000/newRate;
 return {oldEnd,newEnd,wait:newEnd-writeAt,events:[
  {time:0,epoch:'A',completion_id:0},
  {time:oldEnd,epoch:'A',completion_id:1},
  {time:newEnd,epoch:'B',completion_id:2}
 ]};
}
function readBefore(m,t){
 if(!Number.isFinite(t)||t<=0)throw new RangeError('finite positive read instant');
 // Exact equality represents an unproven boundary order, not an invented winner.
 if(m.events.some(e=>e.time===t))return null;
 return m.events.filter(e=>e.time<t).at(-1);
}
function accept(record,requested,seen,proof){
 if(!record||proof!==true||record.epoch!==requested||seen.has(record.completion_id))return false;
 seen.add(record.completion_id);return true;
}
const m=timeline(128,860,.5),seen=new Set();
near(m.oldEnd,7.8125);near(m.newEnd,8.975290697674419);near(m.wait,8.475290697674419);
near(.5+1000/860,1.6627906976744187);
eq(readBefore(m,.5+1000/860).completion_id,0,'new-rate-only wait still sees prior old result');
eq(readBefore(m,8).completion_id,1,'later valid result still old generation');
eq(readBefore(m,9).completion_id,2,'new generation after oracle completion');
eq(readBefore(m,1),readBefore(m,2),'two reads are not two conversions');
for(const t of [1,2,8])eq(accept(readBefore(m,t),'B',seen,true),false,'old result cannot enter B');
eq(accept(readBefore(m,9),'B',seen,false),false,'unproven attribution rejected');
eq(accept(readBefore(m,9),'B',seen,true),true,'proven new result accepted once');
eq(accept(readBefore(m,10),'B',seen,true),false,'duplicate completion rejected');
for(const t of [m.oldEnd,m.newEnd])eq(readBefore(m,t),null,'coincident boundary stays unknown');
eq(accept(null,'B',seen,true),false);
near(1000/(128*.9)+1000/(860*.9),9.972545219638244);
// Independent oracle: one old completion followed by the first new completion.
for(const oldRate of rates)for(const newRate of rates){
 let previous=Infinity;
 for(const fraction of [.01,.1,.25,.5,.75,.9,.99]){
  const x=timeline(oldRate,newRate,1000/oldRate*fraction);
  near(x.wait,1000/oldRate*(1-fraction)+1000/newRate);
  ok(x.wait<previous,'later successful submission shortens model wait');previous=x.wait;
  ok(x.wait>1000/newRate,'in-flight remainder is nonzero');
  eq(readBefore(x,(x.oldEnd+x.newEnd)/2).epoch,'A');
  eq(readBefore(x,x.newEnd+1e-6).epoch,'B');
 }
}
near(timeline(8,860,.5).oldEnd,125);
eq(readBefore(timeline(128,128,.5),10).epoch,'A','same rate does not make old channel new');
// Abstract single-shot start acceptance, not a conversion/register implementation.
const startAccepted=busy=>{if(typeof busy!=='boolean')throw new RangeError('explicit busy state');return !busy;};
eq(startAccepted(true),false);eq(startAccepted(false),true);
for(const args of [[0,860,.5],[128,861,.5],[128,860,0],[128,860,7.8125],[128,860,-1],[128,860,NaN],[128,860,Infinity]]){assert.throws(()=>timeline(...args),RangeError);checks++;}
for(const t of [0,-1,NaN,Infinity]){assert.throws(()=>readBefore(m,t),RangeError);checks++;}
assert.throws(()=>startAccepted(0),RangeError);checks++;
const read=f=>fs.readFileSync(__dirname+'/'+f,'utf8'),source=read('engineering-cases.js');
const marker='\n// Original ADS1115 configuration-generation case; all twenty prior cases retained unchanged.\n';
eq(source.split(marker).length,2,'exactly one addition');
eq(crypto.createHash('sha256').update(source.split(marker)[0]).digest('hex'),'c1d9b5557f5552a6389873c2f6d63a480b8b74688a39b7a2b7aa4a751fe347e1','all twenty old cases and overviews byte-identical');
const ctx={window:{}};vm.runInNewContext(source,ctx);const c=ctx.window.SensorCases.find(x=>x.id==='ti-ads1115-config-generation');
eq(ctx.window.SensorCases.length,26);eq(Object.keys(ctx.window.SensorCaseOverviews).length,26);
eq(c.id,'ti-ads1115-config-generation');eq(c.status,'待学习');eq(c.reproduction,'未本站实物复现');eq(c.verified,'2026-11-04');eq(c.blocks.length,7);
const prose=JSON.stringify(c);
for(const term of ['非 ADS1115L','非 ADS1115-Q1','SBAS444E','±10%','约 25 μs','不是最大启动时间','不是完整系统上界','尚未执行','未知','OS=1','completion_id','没有本站或独立第三方实物复现'])ok(prose.includes(term),term);
eq(c.sources[0].url,'https://www.ti.com/lit/ds/symlink/ads1115.pdf');
for(const b of c.blocks)for(const id of b.sourceIds||[])ok(c.sources.some(s=>s.id===id));
ok(read('index.html').includes('engineering-cases.js?v=20261110.1'));
ok(read('index.html').includes('二十六篇来源核验工程案例'));
console.log(`${checks} original ADS1115 configuration-generation, repeat-read, unknown-boundary and preservation checks passed. No hardware or candidate code executed.`);
