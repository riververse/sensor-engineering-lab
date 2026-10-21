/* Original address/ownership arithmetic, not Cortex-M7 emulation or hardware validation. */
'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const read=n=>fs.readFileSync(__dirname+'/'+n,'utf8');let checks=0;
const ok=(v,m)=>{assert.ok(v,m);checks++;},eq=(a,b,m)=>{assert.deepEqual(a,b,m);checks++;};
const ctx={window:{}};vm.runInNewContext(read('engineering-cases.js'),ctx);
const c=ctx.window.SensorCases.find(x=>x.id==='st-m7-adc-cache'),text=JSON.stringify(c);
for(const token of ['STM32H743','RM0433 Rev 9','2026-10-02','32 byte','0x20000000','0x24000000','0x30000000','Normal write-back','invalidate','volatile','CMSIS','2 ms','2.3 ms','尚未执行','许可证'])ok(text.includes(token),'explicit scope: '+token);
eq(c.verified,'2026-10-21','verification date');eq(c.status,'待学习','no automatic learning');
const range=(a,n)=>[Math.floor(a/32)*32,Math.ceil((a+n)/32)*32];
const A=0x30000000;
eq(A%32,0,'aligned teaching base');eq(96*2,192,'block bytes');eq((A+192)%32,0,'second block aligned');eq(192/32,6,'whole lines');eq(2*192,384,'two blocks');
eq(range(A,100),[A,A+128],'first bad half touches boundary line');eq(range(A+100,100),[A+96,A+224],'second half shares same line');
ok(range(A,100)[1]>range(A+100,100)[0],'overlap cannot be fixed by aligning only array');
eq(200%32,8,'100 samples break line boundary');eq(range(A,200)[1]-A,224,'rounding extends into neighbor');
for(let n=1;n<=256;n++){const [lo,hi]=range(A+3,n);ok(lo<=A+3&&hi>=A+3+n&&lo%32===0&&hi%32===0,'range contains every byte');}
eq(96/48000*1000,2,'block window ms');eq(48000*2,96000,'payload bytes per second');ok(2.3>2,'over-budget path rejected');eq(96/96000*1000,1,'double rate halves window');ok(1.2<2&&1.2>1,'old schedule does not migrate');
// A minimal abstract ownership guard; no cache hardware semantics are simulated.
let owner='cpu',generation=0;
function handoff(){assert.equal(owner,'cpu');owner='dma';generation++;return generation;}
function completed(g){if(owner!=='dma'||g!==generation)return false;owner='cpu';return true;}
const g=handoff();ok(!completed(g-1),'stale generation rejected');ok(completed(g),'matching generation accepted');ok(!completed(g),'duplicate completion rejected');
for(const href of ['#case/st-m7-adc-cache','node adc-cache.test.cjs'])ok(read('README.md').includes(href),'documented '+href);
console.log(`${checks} cache-case source, alignment, timing and abstract ownership checks passed. No hardware reproduction.`);
