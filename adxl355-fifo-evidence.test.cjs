/* Original discrete evidence model; not vendor code, hardware timing or silicon simulation. */
'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),crypto=require('node:crypto');let n=0;
const eq=(a,b)=>{assert.deepEqual(a,b);n++},ok=a=>{assert.ok(a);n++};
function model(){let q=[],lost=[],ovr=false;return {push(id){if(!Number.isSafeInteger(id)||id<0)throw new RangeError('group');if(q.length===32){lost.push(q.shift());ovr=true;}q.push(id)},status(){const v=ovr;ovr=false;return v},snapshot(){return {q:[...q],lost:[...lost]}}}}
function sameGroup(axes){return axes.length===3&&axes.every((a,i)=>a.axis===['X','Y','Z'][i]&&a.group===axes[0].group)}
for(let count=0;count<=100;count++){const m=model();for(let i=0;i<count;i++)m.push(i);eq(m.snapshot().q,Array.from({length:Math.min(count,32)},(_,i)=>Math.max(0,count-32)+i));eq(m.snapshot().lost,Array.from({length:Math.max(0,count-32)},(_,i)=>i));eq(m.status(),count>32);eq(m.status(),false);}
const m=model();for(let i=0;i<33;i++)m.push(i);eq([m.status(),m.status()],[true,false]);eq(m.snapshot().lost,[0]);m.push(33);eq(m.status(),true);eq(m.snapshot().lost,[0,1]);
for(const bad of [-1,NaN,Infinity,1.5]){assert.throws(()=>m.push(bad),RangeError);n++;}
const rows=['X','Y','Z'].map(axis=>({axis,group:8}));eq(sameGroup(rows),true);eq(sameGroup([rows[0],{axis:'Y',group:9},{axis:'Z',group:9}]),false);eq(sameGroup(rows.slice(0,2)),false);eq(sameGroup([rows[1],rows[0],rows[2]]),false);
eq(96/3,32);eq(32/1000*1000,32);
const read=f=>fs.readFileSync(__dirname+'/'+f,'utf8'),s=read('engineering-cases.js'),marker='\n// Original ADXL355 read-to-clear case; all thirty prior cases retained unchanged.\n';eq(s.split(marker).length,2);
eq(crypto.createHash('sha256').update(s.split(marker)[0]).digest('hex'),'0dbfa7d3777e275b560155a5ed63988f71a0bc51f09b0318503f7207a222e2e4');
const ctx={window:{}};vm.runInNewContext(s,ctx);eq(ctx.window.SensorCases.length,31);eq(Object.keys(ctx.window.SensorCaseOverviews).length,31);const c=ctx.window.SensorCases.at(-1);eq(c.id,'adi-adxl355-fifo-read-clear-evidence');eq(c.published,'2025-06');eq(c.verified,'2026-11-17');eq(c.blocks.length,7);for(const t of ['read-to-clear','不是允许主机晚来 32 ms','组 0 完整丢失','真实器件未提供','尚未执行']){ok(JSON.stringify(c).includes(t));}ok(read('index.html').includes('20261117.1'));ok(read('README.md').includes('#case/'+c.id));
console.log(n+' original FIFO count, overwrite, read-to-clear, identity and preservation assertions passed.');
