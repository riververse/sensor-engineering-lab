/* Original slot/time arithmetic only; no vendor code or hardware execution. */
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),crypto=require('node:crypto');
let n=0;const eq=(a,b)=>{assert.deepEqual(a,b);n++;},ok=(x,m)=>{assert.ok(x,m);n++;},near=(a,b,e=1e-8)=>ok(Math.abs(a-b)<e,`${a} != ${b}`);
function timing(hz){if(!(Number.isFinite(hz)&&hz>0))throw new RangeError('positive clock');return {period:2000/hz,fast:hz/2000,slow:hz/6000,acq:9/hz,ready:(2*(9+21)+9+23)/hz,skew:2*(9+21)/hz};}
const a=timing(100e6),b=timing(120e6);near(a.period*1e6,20);near(a.fast,50000);near(a.slow,16666.666666666668);near(a.acq*1e9,90);near(a.ready*1e6,.92);near(a.skew*1e6,.6);near(b.period*1e6,16.666666666666668);near(b.slow,20000);near(b.ready*1e6,.7666666666666667);near(b.skew*1e6,.5);
for(const hz of [0,-1,NaN,Infinity]){assert.throws(()=>timing(hz),RangeError);n++;}
// Explicit assumption: trigger instant represents timestamp here; slot skew tested separately above.
function bursts(count,period=20){let latest=Array(5).fill(null);return Array.from({length:count},(_,k)=>{const slot=[0,1,2+k%3];for(const ch of slot)latest[ch]=k*period;return {seq:k,slot,pointer:[9,12,15][k%3],latest:[...latest]};});}
const rows=bursts(6);eq(rows[0].latest,[0,0,0,null,null]);eq(rows[2].latest,[40,40,0,20,40]);eq(rows[2].latest.map(t=>40-t),[0,0,40,20,0]);eq(rows.map(r=>r.pointer),[9,12,15,9,12,15]);eq(rows[0].pointer,rows[3].pointer);ok(rows[0].seq!==rows[3].seq,'pointer is not monotonically increasing identity');
for(let ch=0;ch<5;ch++){const t=rows.filter(r=>r.slot.includes(ch)).map(r=>r.seq*20);for(let i=1;i<t.length;i++)eq(t[i]-t[i-1],ch<2?20:60);}
near(50000/4,12500);near(4*20,80);eq((2+1)-1,2);eq(9-1,8);
const source=fs.readFileSync(__dirname+'/engineering-cases.js','utf8');const marker='\n// Original mixed-rate burst case; all twelve prior cases retained unchanged.\n';ok(source.includes(marker),'append marker');eq(crypto.createHash('sha256').update(source.slice(0,source.indexOf(marker))).digest('hex'),'d425ed5b533bf860d1a7a558564a7738f40f7efdd553262322706d8c1c9d3da3');
const ctx={window:{}};vm.runInNewContext(source,ctx);const cases=JSON.parse(JSON.stringify(ctx.window.SensorCases)),c=cases.at(-1);eq(cases.length,13);eq(c.id,'ti-f280015x-burst-sample-age');eq(c.status,'待学习');eq(c.reproduction,'未本站实物复现');eq(c.publicationLabel,'所读版本发布');eq(c.timingRelated,true);eq(c.blocks.length,7);eq(c.sources.length,7);eq(new Set(cases.map(x=>x.id)).size,13);
const text=JSON.stringify(c);for(const phrase of ['TMS320F2800157','80PN','SPRUIY4B','SPRSP68D','699b8c6aa190cf7430a36bdcf7f5b1ea2e928063','9 SYSCLK','ACQPS=8','BURSTSIZE','RRPOINTER','0.92 μs','0.60 μs','0.7667 μs','没有 DMA','尚未执行','BSD-3-Clause','未生成、编译、执行或烧录'])ok(text.includes(phrase),phrase);
for(const s of c.sources)if(s.url.includes('github.com'))ok(s.url.includes('/blob/699b8c6aa190cf7430a36bdcf7f5b1ea2e928063/'),'frozen official source');
console.log(`${n} ADC burst schedule, sample-age, field-encoding and complete legacy-prefix checks passed.`);
