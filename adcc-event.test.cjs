/* Original bounded event-admission/clock arithmetic, not ADI firmware or silicon. */
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),crypto=require('node:crypto');
let count=0;const eq=(a,b,m)=>{assert.deepEqual(a,b,m);count++;},ok=(a,m)=>{assert.ok(a,m);count++;};
// One snapshot only: no service progression, sample aperture, ADC pipeline or DMA model.
function admit(events,{busy=[false,false],occupied=[0,0]}={}){
 if(!Array.isArray(events)||events.length>24||!Array.isArray(busy)||busy.length!==2||busy.some(x=>typeof x!=='boolean')||!Array.isArray(occupied)||occupied.length!==2||occupied.some(x=>!Number.isInteger(x)||x<0||x>8))throw Error('invalid input');
 const ids=new Set();for(const e of events){if(!e||!Number.isInteger(e.id)||e.id<0||e.id>23||ids.has(e.id)||![0,1].includes(e.timer)||![0,1].includes(e.adc)||!Number.isSafeInteger(e.tick)||e.tick<0)throw Error('invalid event');ids.add(e.id);}
 if(events.some(e=>e.tick!==events[0].tick))throw Error('one matching tick only');
 const out={started:[],queued:[],missed:[]};
 for(let adc=0;adc<2;adc++){
  let active=busy[adc],used=occupied[adc];
  for(let timer=0;timer<2;timer++){
   const group=events.filter(e=>e.adc===adc&&e.timer===timer).sort((a,b)=>a.id-b.id);
   if(!group.length)continue;
   const [winner,...losers]=group;out.missed.push(...losers.map(x=>x.id));
   if(!active){out.started.push(winner.id);active=true;}
   else if(used<8){out.queued.push(winner.id);used++;}else out.missed.push(winner.id);
  }
 }
 for(const k of Object.keys(out))out[k].sort((a,b)=>a-b);
 return out;
}
const ev=(id,timer=0,adc=0,tick=1600)=>({id,timer,adc,tick});
eq(admit([ev(0),ev(1),ev(2)]),{started:[0],queued:[],missed:[1,2]},'empty FIFO does not save same-tick losers');
for(let slots=0;slots<=8;slots++){
 const r=admit([ev(0),ev(1),ev(2)],{busy:[true,false],occupied:[slots,0]});
 eq(r,slots===8?{started:[],queued:[],missed:[0,1,2]}:{started:[],queued:[0],missed:[1,2]},'admission and capacity separate');
}
eq(admit([ev(0,1),ev(23,0)]),{started:[23],queued:[0],missed:[]},'different timer forwards both; TMR0 first');
for(let occupied=0;occupied<=8;occupied++){
 eq(admit([ev(0,1),ev(23,0)],{busy:[true,false],occupied:[occupied,0]}),
 occupied<=6?{started:[],queued:[0,23],missed:[]}:occupied===7?{started:[],queued:[23],missed:[0]}:{started:[],queued:[],missed:[0,23]},'different timer winners consume remaining slots in timer order');
}
eq(admit([ev(0,0,0),ev(1,0,1)]).started,[0,1],'independent admissions do not prove sampling simultaneity');
// Distinct-match snapshots intentionally do not predict hardware service or throughput.
for(let id=0;id<3;id++)eq(admit([ev(id,0,0,1600+id)]).missed,[],'no same-tick competitor');
for(let a=0;a<24;a++)for(let b=0;b<24;b++)if(a!==b){
 eq(admit([ev(a),ev(b)]).started,[Math.min(a,b)],'event priority');
 eq(admit([ev(a),ev(b)]),admit([ev(b),ev(a)]),'input order irrelevant');
}
const bad=[null,{},Array(25).fill(ev(0)),[ev(0),ev(0)],[ev(-1)],[ev(24)],[ev(0,2)],[ev(0,0,2)],[ev(0,0,0,-1)],[ev(0,0,0,.5)],[ev(0),ev(1,0,0,1601)]];
for(const input of bad){assert.throws(()=>admit(input));count++;}
for(const opts of [{busy:[1,false]},{occupied:[-1,0]},{occupied:[9,0]},{occupied:[.5,0]}]){assert.throws(()=>admit([ev(0)],opts));count++;}
const original=[ev(0),ev(1)];const snapshot=JSON.stringify(original);admit(original);eq(JSON.stringify(original),snapshot,'nonmutating');
const ns=(ticks,hz)=>ticks/hz*1e9;
eq([1600,4000,6400].map(x=>ns(x,80e6)),[20000,50000,80000]);
eq(ns(1600,40e6),40000);eq([4,5].map(x=>ns(x,80e6)),[50,62.5]);
eq(ns(1+8+0+9,40e6),450);eq(ns(3*(1+8+0+9),40e6),1350);eq(1350+50+200,1600);
const read=f=>fs.readFileSync(__dirname+'/'+f,'utf8'),hash=x=>crypto.createHash('sha256').update(x).digest('hex');
const src=read('engineering-cases.js'),marker='\n// Original ADCC event-admission case; prior twenty-four cases retained unchanged.\n';
eq(src.split(marker).length,2);eq(hash(src.split(marker)[0]),'0a91f1f88e6ec301851763b6006f3d000b8fbc9d73942a202da8fc907b502e68','all prior source bytes preserved');
const ctx={window:{}};vm.runInNewContext(src,ctx);eq(ctx.window.SensorCases.length,28);eq(Object.keys(ctx.window.SensorCaseOverviews).length,28);
const c=ctx.window.SensorCases.find(x=>x.id==='adi-adcc-event-collision');eq(c.status,'待学习');eq(c.reproduction,'未本站实物复现');eq(c.verified,'2026-11-09');eq(c.published,'2013-09');eq(c.blocks.length,7);
for(const token of ['SYSCLK','ACLK','EMISS','ECOL','DLYCNT','450 ns','1350 ns','1600 ns','4–5','TMR0','8 深','文字差异','未运行','尚未执行'])ok(JSON.stringify(c).includes(token),token);
for(const s of c.sources){eq(new URL(s.url).hostname,'www.analog.com');eq(new URL(s.url).protocol,'https:');}
const preserved={"app.js": "98cf80f0fd5bb61c578ba516471dda9ecb69c2b8152b9006e7ce57f895b1f1ed", "style.css": "ae22afcc302123fba024b368a60e63ca2eb05b38590056c7a6210692b7b2b25e", "models.js": "61aeeaa1ceface1d6eac26594e34e791503dec2b3d126e7514f98df20c0546e5", "content.js": "b515149000b53e48a593c74df58a7a34d563b48f6c878c99a73ad615e9cdcf40", "mcu-timing.js": "75b49417d443c63eb78804e2689b29c2b3329fed617896bb89f547c91e431416"};
for(const [f,h]of Object.entries(preserved))eq(hash(f==='app.js'?read(f).replace('Raspberry Pi、Microchip 的','Raspberry Pi 的'):read(f)),h,f+' unchanged');
ok(read('index.html').includes('engineering-cases.js?v=20261114.1'));ok(read('index.html').includes('二十八篇'));
console.log(count+' ADCC admission, clock, validation and exact legacy-preservation checks passed. No silicon, firmware or hardware executed.');
