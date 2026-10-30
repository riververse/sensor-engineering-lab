/* Original acceptance-contract model, not a vendor driver or silicon simulation.
 * No network, candidate code, hardware, persistent storage or firmware is used. */
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),crypto=require('node:crypto');
let n=0;const eq=(a,b)=>{assert.deepEqual(a,b);n++;},ok=(v,m)=>{assert.ok(v,m);n++;},near=(a,b,e=1e-8)=>ok(Math.abs(a-b)<e,`${a} != ${b}`);
const maRates=[64000,32000,16000,8000,4000,2000,1000,500,250],ade91Rates=[32000,8000,4000,2000,1000];
function budget(ma,ade91,extraUs=0){
 if(!Number.isInteger(ma)||!Number.isInteger(ade91)||ma<0||ade91<0||ma+ade91<1||!Number.isFinite(extraUs)||extraUs<0)throw new RangeError('finite positive chain');
 const bits=ma*256+ade91*128,timeUs=bits/20+5+.01+.01+extraUs;
 const rates=(ma?maRates:ade91Rates).filter(r=>!ade91||ade91Rates.includes(r));
 return {bits,timeUs,max:1e6/timeUs,rate:rates.find(r=>1e6/r>timeUs)||null};
}
const a=budget(3,1);eq(a.bits,896);near(a.timeUs,49.82);near(a.max,20072.260136491368);eq(a.rate,8000);
ok(1e6/16000>a.timeUs,'positive bus margin cannot create a supported 16 kSPS mode');ok(!ade91Rates.includes(16000));
near(125-a.timeUs,75.18);near(a.timeUs/125*100,39.856);eq(budget(3,1,80).rate,4000);near(budget(3,1,80).timeUs,129.82);
eq(budget(3,1,75.18).rate,4000); // Deliberate strict safety margin: equality is not acceptable.
const b=budget(1,1);eq(b.bits,384);near(b.timeUs,24.22);eq(b.rate,32000);near(31.25-b.timeUs,7.03);
near(3/8000*1e6,375);near(1/16.384e6*1e9,61.03515625);
for(const args of [[0,0],[-1,1],[1.5,1],[1,1,NaN],[1,1,Infinity],[1,1,-1]]){assert.throws(()=>budget(...args),RangeError);n++;}
// Application-specific synthetic gate model: not an implementation of SPI writes.
const configuredDevices=['A','B','C']; // Synthetic ADEMA identities; D is the mixed-chain ADE9113.
function initial(){return {readyDevices:[...configuredDevices],config:7,sync:3,ready:true,coeff:true,aligned:true,cycles:3,snapshot:true,settled:true,fault:false};}
function reconfigure(s){return {...s,config:s.config+1,readyDevices:[],ready:false,coeff:false,aligned:false,cycles:0,snapshot:false,settled:false,fault:false};}
function apply(s,event){
 const next={...s};
 if(event.startsWith('ready-')) {
  const id=event.slice(6);next.readyDevices=[...new Set([...s.readyDevices,...(configuredDevices.includes(id)?[id]:[])])];
  next.ready=configuredDevices.every(id=>next.readyDevices.includes(id));
 }
 else if(event==='coeff') {if(!s.ready)throw new Error('missing completion');next.coeff=true;}
 else if(event==='align'){if(!s.ready||!s.coeff)throw new Error('configuration incomplete');next.sync++;next.aligned=true;next.cycles=0;next.snapshot=false;}
 else if(event==='cycle'){if(!s.aligned)throw new Error('not aligned');next.cycles++;}
 else if(event==='snapshot-pass'){if(!s.aligned||s.cycles<3)throw new Error('wait DREADY cycles');next.snapshot=true;}
 else if(event==='snapshot-fail'){next.snapshot=false;next.fault=true;}
 else if(event==='settled')next.settled=true;
 else if(event==='timeout')next.fault=true;
 else throw new Error('unknown event');
 return next;
}
const deviceIds=['A','B','C','D'];
function frame(s){return deviceIds.map(id=>({id,config:s.config,sync:s.sync,seq:100,valid:true}));}
function publish(s,rows){return s.ready&&s.coeff&&s.aligned&&s.cycles>=3&&s.snapshot&&s.settled&&!s.fault&&rows.length===4&&new Set(rows.map(r=>r.id)).size===4&&rows.every(r=>deviceIds.includes(r.id)&&r.valid&&r.config===s.config&&r.sync===s.sync&&r.seq===rows[0].seq);}
const old=initial(),oldRows=frame(old);ok(publish(old,oldRows));let s=reconfigure(old);
eq([s.config,s.sync],[8,3]);ok(!publish(s,oldRows));
for(const event of ['coeff','align','cycle','snapshot-pass']){assert.throws(()=>apply(s,event));n++;}
// A fixed elapsed delay is intentionally absent: only the completion event advances readiness.
const unrelated=apply(s,'ready-D');eq(unrelated.ready,false);eq(unrelated.readyDevices,[]);
const one=apply(s,'ready-A');eq(one.ready,false);eq(apply(one,'ready-A').ready,false);assert.throws(()=>apply(one,'coeff'),/completion/);n++;
for(const event of ['ready-A','ready-B','ready-C','coeff','align','cycle','cycle']){s=apply(s,event);ok(!publish(s,frame(s)));}
assert.throws(()=>apply(s,'snapshot-pass'),/DREADY/);n++;
s=apply(s,'cycle');ok(!publish(s,frame(s)));s=apply(s,'snapshot-pass');ok(!publish(s,frame(s)));s=apply(s,'settled');ok(publish(s,frame(s)));eq([s.config,s.sync],[8,4]);ok(!publish(s,oldRows));
for(const mutate of [r=>r.slice(1),r=>{r[1].id='A';return r;},r=>{r[0].config=7;return r;},r=>{r[0].sync=3;return r;},r=>{r[0].seq=99;return r;},r=>{r[0].valid=false;return r;}])ok(!publish(s,mutate(frame(s))),'incomplete, duplicate or stale frame remains invalid');
for(const event of ['timeout','snapshot-fail'])ok(!publish(apply(s,event),frame(s)));
const relock=reconfigure(s);eq(relock.coeff,false);eq(relock.snapshot,false);ok(!publish(relock,frame(relock)),'new configuration invalidates previous proof');
const afterAlign=apply(s,'align');ok(!publish(afterAlign,frame(afterAlign)),'repeated ALIGN is not a harmless measurement');
// The test uses plain nearby counts only; no unverified rollover interpretation is hidden here.
function snapshotPass(counts){return counts.length===4&&counts.every(Number.isInteger)&&Math.max(...counts)-Math.min(...counts)<=1;}
ok(snapshotPass([1000,1001,1000,1001]));ok(!snapshotPass([999,1001,1000,1000]));ok(!snapshotPass([1000,1000,1000]));
const source=fs.readFileSync(__dirname+'/engineering-cases.js','utf8'),marker='\n// Original reconfiguration/synchronization case; all fourteen prior cases retained unchanged.\n';
ok(source.includes(marker));eq(crypto.createHash('sha256').update(source.slice(0,source.indexOf(marker))).digest('hex'),'9abef26361f0b149b95543c617baea007ed6084256a855e9f8fa33ae53299844');
const ctx={window:{}};vm.runInNewContext(source,ctx);const cases=JSON.parse(JSON.stringify(ctx.window.SensorCases)),c=cases.find(c=>c.id==='adi-ade-reconfiguration-sync');
eq(c.id,'adi-ade-reconfiguration-sync');ok(cases.length>=15,'all previously published cases retained');eq(new Set(cases.map(c=>c.id)).size,cases.length);eq(c.status,'待学习');eq(c.reproduction,'未本站实物复现');eq(c.verified,'2026-10-29');eq(c.sources.length,3);eq(c.blocks.length,7);eq(c.blocks.find(b=>b.title==='待执行的台架验收清单').bullets.length,4);
const text=JSON.stringify(c);for(const token of ['DATAPATH_CONFIG_LOCK','DREADY','SNAPSHOT','config_epoch','sync_epoch','49.82','75.18','129.82','24.22','7.03','375 μs','约 40 μs','3 个 DREADY','尚未执行','未编译、执行或烧录','不是总恢复延迟','不等于滤波器已经建立','没有本站或独立第三方实物复现','必须能归属到正在配置的 ADEMA','不能拿链末端另一颗 ADE9113'])ok(text.includes(token),token);
for(const source of c.sources){const u=new URL(source.url);eq(u.hostname,'www.analog.com');eq(u.protocol,'https:');}
for(const b of c.blocks)for(const id of b.sourceIds||[])ok(c.sources.some(s=>s.id===id));
console.log(`${n} ADE synchronization, configuration gates, rate intersection and legacy-prefix checks passed. Synthetic model only.`);
