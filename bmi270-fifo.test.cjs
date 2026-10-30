/* Original restricted FIFO thought experiment, NOT vendor code or a device driver.
 * Fixed 13-byte regular frames; no arrivals, overflow, AUX, dummy bytes or controls
 * in the replay model. No network, hardware, writes or persistent state. */
'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),crypto=require('node:crypto');
let count=0;const eq=(a,b,m)=>{assert.deepEqual(a,b,m);count++;},ok=(a,m)=>{assert.ok(a,m);count++;},near=(a,b)=>ok(Math.abs(a-b)<1e-9,`${a} != ${b}`);
const FRAME=13,frame=id=>[0x8c,...Array(12).fill(id)];
const originals=[frame(1),frame(2),frame(3)];
// Each invocation represents a NEW, successfully completed bus transaction.
function makeDevice(frames){
 let queued=frames.map(f=>f.slice());
 return {
  read(length){
   if(!Number.isInteger(length)||length<0||length>queued.length*FRAME)throw new RangeError('bounded byte count');
   const bytes=queued.flat().slice(0,length);queued=queued.slice(Math.floor(length/FRAME));return bytes;
  },
  remaining(){return queued.map(f=>f.slice());}
 };
}
function completeOnly(bytes){
 const complete=[];for(let i=0;i+FRAME<=bytes.length;i+=FRAME){
  const f=bytes.slice(i,i+FRAME);if(f[0]!==0x8c||!f.slice(1).every(x=>x===f[1]))throw new Error('corrupt synthetic frame');complete.push(f);
 }return {complete,tail:bytes.slice(complete.length*FRAME)};
}
const d=makeDevice(originals),first=d.read(20);eq(first.length,20);eq(d.remaining(),originals.slice(1));const second=d.read(26);eq(second,originals.slice(1).flat());eq(d.remaining(),[]);
eq(completeOnly(first).tail.length,7);eq([...completeOnly(first).complete,...completeOnly(second).complete],originals);eq(first.length+second.length,46);eq(originals.flat().length,39);
assert.throws(()=>completeOnly([...first,...second]),/corrupt/);count++;
// Test every possible cut through three frames; replayed prefixes never become samples.
for(let cut=1;cut<=39;cut++){
 const dev=makeDevice(originals),a=dev.read(cut),b=dev.read(dev.remaining().length*FRAME),result=[...completeOnly(a).complete,...completeOnly(b).complete];
 eq(result,originals,`independent transactions cut=${cut}`);eq(a.length+b.length,39+cut%FRAME);eq(completeOnly(a).tail.length,cut%FRAME);eq(dev.remaining(),[]);
}
// Memory chunking INSIDE one bus transaction has no replay: keep the tail.
const stream=originals.flat();
for(let cut=1;cut<39;cut++){
 const partA=completeOnly(stream.slice(0,cut)),partB=completeOnly([...partA.tail,...stream.slice(cut)]);
 eq([...partA.complete,...partB.complete],originals,`one transaction chunks cut=${cut}`);eq(partB.tail.length,0);
}
const aligned=makeDevice(originals);eq(completeOnly(aligned.read(26)).complete,originals.slice(0,2));eq(completeOnly(aligned.read(13)).complete,originals.slice(2));
for(const bad of [-1,1.5,NaN,Infinity,40]){assert.throws(()=>makeDevice(originals).read(bad),RangeError);count++;}
// Fixed periodic arrivals only, excluding controls and maximum-frame reserve.
eq(200*13,2600);eq(80*13,1040);eq((80+60)*13,1820);eq((80+80)*13,2080);ok(1820<2048);ok(2080>2048);eq(Math.floor(2048/13),157);ok(158*13>2048);
near(5e3/39.0625,128);near(2**24*39.0625/1e6,655.36);
function elapsedTicks(old,newer,{sameSession,boundBelowWrap}){
 if(!sameSession||!boundBelowWrap)return null;
 if(![old,newer].every(v=>Number.isInteger(v)&&v>=0&&v<2**24))throw new RangeError('24-bit counter');
 return (newer-old+2**24)%(2**24);
}
const validClock={sameSession:true,boundBelowWrap:true};eq(elapsedTicks(0xfffff0,0x30,validClock),64);near(64*39.0625/1000,2.5);eq(elapsedTicks(100,100,validClock),0);
eq(elapsedTicks(0xfffff0,0x30,{sameSession:false,boundBelowWrap:true}),null);eq(elapsedTicks(0xfffff0,0x30,{sameSession:true,boundBelowWrap:false}),null);
for(const v of [-1,2**24,1.5,NaN]){assert.throws(()=>elapsedTicks(v,0,validClock),RangeError);count++;}
// Host-defined sequence IDs are teaching bookkeeping, NOT BMI270 FIFO fields.
function eligible(rows,quality){
 return rows.length>0&&!quality.skip&&!quality.fifoErr&&!quality.unknownEnd&&!quality.modeChange&&rows.every((r,i)=>r.complete&&r.config===rows[0].config&&r.session===rows[0].session&&(i===0||r.seq===rows[i-1].seq+1));
}
const rows=[0,1,2].map(seq=>({seq,config:4,session:1,complete:true})),quality={skip:false,fifoErr:false,unknownEnd:false,modeChange:false};
ok(eligible(rows,quality));ok(!eligible([],quality));
for(const key of Object.keys(quality))ok(!eligible(rows,{...quality,[key]:true}),key);
for(const mutate of [r=>{r[1].complete=false;},r=>{r[1].seq=0;},r=>{r[1].seq=9;},r=>{r[1].config=5;},r=>{r[1].session=2;}]){const copy=structuredClone(rows);mutate(copy);ok(!eligible(copy,quality));}
const source=fs.readFileSync(__dirname+'/engineering-cases.js','utf8'),marker='\n// Original FIFO transaction case; all fifteen prior cases retained unchanged.\n';
ok(source.includes(marker));eq(crypto.createHash('sha256').update(source.slice(0,source.indexOf(marker))).digest('hex'),'94ed485e725e4b94ced350151f92a69cfcd04d37e8cc33ba35d1f88a5954b8cf');
const context={window:{}};vm.runInNewContext(source,context);const cases=JSON.parse(JSON.stringify(context.window.SensorCases)),c=cases.find(x=>x.id==='bosch-bmi270-fifo-transaction');
eq(cases.length,16);eq(new Set(cases.map(c=>c.id)).size,16);eq(c.status,'待学习');eq(c.reproduction,'未本站实物复现');eq(c.verified,'2026-10-30');eq(c.blocks.length,7);eq(c.sources.length,2);eq(c.blocks.find(b=>b.title==='待执行的台架验收清单').bullets.length,4);
const text=JSON.stringify(c);for(const token of ['2048','6 KB','13 字节','20 字节','26 字节','46 字节','同一次连续 burst','DMA 内存分段','39.0625','655.36','0xFFFFF0','0x000030','fifo_stop_on_full','fifo_err','0xFF','不是该样本的采样时刻','没有复位','不宣称工业级资格','无 AUX','尚未执行','未编译、执行或烧录','没有本站或独立第三方实物复现'])ok(text.includes(token),token);
for(const s of c.sources){eq(new URL(s.url).hostname,'www.bosch-sensortec.com');eq(new URL(s.url).protocol,'https:');}
for(const block of c.blocks)for(const id of block.sourceIds||[])ok(c.sources.some(s=>s.id===id));
for(const field of ['problem','method','boundary','takeaway'])ok(context.window.SensorCaseOverviews[c.id][field].length>=20);
console.log(`${count} BMI270 transaction replay, continuous-chunk, clock-boundary and preservation checks passed. Synthetic restricted model only.`);
