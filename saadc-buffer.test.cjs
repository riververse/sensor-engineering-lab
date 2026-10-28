/* Independent original frame/ownership model: no vendor firmware or hardware execution. */
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),crypto=require('node:crypto');
let n=0;const eq=(a,b)=>{assert.deepEqual(a,b);n++;},ok=(x,m)=>{assert.ok(x,m);n++;};
function budget(results,channels,periodUs){if(!Number.isInteger(results)||results<1||!Number.isInteger(channels)||channels<1||!Number.isFinite(periodUs)||periodUs<=0)throw new RangeError('positive complete-frame contract');if(results%channels)throw new RangeError('incomplete frame');return {frames:results/channels,blockUs:results/channels*periodUs,bytes:2*results*2,perChannelHz:1e6/periodUs,wordHz:channels*1e6/periodUs};}
eq(budget(96,3,50),{frames:32,blockUs:1600,bytes:384,perChannelHz:20000,wordHz:60000});eq(budget(192,3,50),{frames:64,blockUs:3200,bytes:768,perChannelHz:20000,wordHz:60000});
for(const args of [[95,3,50],[0,3,50],[96,0,50],[96,3,0],[96,3,NaN]]){assert.throws(()=>budget(...args),RangeError);n++;}
const acq=10,conversion=2,channels=[1,2,5],ends=channels.map((_,i)=>i*(acq+conversion)+acq);eq(ends,[10,22,34]);eq(ends[2]-ends[0],24);eq(3*(acq+conversion),36);eq(50-36,14);ok(1800>budget(96,3,50).blockUs);ok(1800<budget(192,3,50).blockUs);
const samples=Array.from({length:96},(_,i)=>({ch:channels[i%3],frame:Math.floor(i/3)}));eq(samples.slice(0,6),[{ch:1,frame:0},{ch:2,frame:0},{ch:5,frame:0},{ch:1,frame:1},{ch:2,frame:1},{ch:5,frame:1}]);eq(samples.at(-1),{ch:5,frame:31});eq(Math.floor(95/3),31);eq(95%3,2);
// This is a teaching ownership contract, not a simulation of a vendor driver.
const allowed={FREE:'DMA_ACTIVE',DMA_ACTIVE:'READY',READY:'PROCESSING',PROCESSING:'FREE'};
function transition(state,next){if(allowed[state]!==next)throw new Error('ownership violation');return next;}
let state='FREE';for(const next of ['DMA_ACTIVE','READY','PROCESSING','FREE'])state=transition(state,next);eq(state,'FREE');for(const state of ['DMA_ACTIVE','READY','PROCESSING']){assert.throws(()=>transition(state,'DMA_ACTIVE'),/ownership/);n++;}
const source=fs.readFileSync(__dirname+'/engineering-cases.js','utf8'),marker='\n// Original SAADC buffer-deadline case; all thirteen prior cases retained unchanged.\n';ok(source.includes(marker));eq(crypto.createHash('sha256').update(source.slice(0,source.indexOf(marker))).digest('hex'),'df813d78a33424f03c47bc68e0568f438a068e6254775dc776355ce43b36947d');
const ctx={window:{}};vm.runInNewContext(source,ctx);const cases=JSON.parse(JSON.stringify(ctx.window.SensorCases)),c=cases.find(c=>c.id==='nordic-saadc-buffer-deadline');eq(cases.length,14);eq(new Set(cases.map(c=>c.id)).size,14);eq(c.status,'待学习');eq(c.reproduction,'未本站实物复现');eq(c.blocks.length,7);eq(c.sources.length,3);eq(c.published,'2026-04-21');eq(c.verified,'2026-10-28');
const text=JSON.stringify(c);for(const term of ['nRF52840','1 MHz','50 μs','CH1[0]','CH5[0]','96','1600 μs','384字节','768字节','LicenseRef-Nordic-5-Clause','7f99e9d','尚未执行','未编译、执行或烧录','不能直接','不是三个同时','典型栏','AMOUNT','STARTED'])ok(text.includes(term),term);
ok(c.sources.find(s=>s.id==='code').url.includes('/7f99e9d5858087e452df443586262727da4c4b04/'));
console.log(`${n} SAADC frame budgets, scan order, ownership and complete legacy-prefix checks passed.`);
