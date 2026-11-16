/* Original discrete scheduling arithmetic only; no ADC simulation, vendor code or hardware. */
'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),crypto=require('node:crypto');let n=0;
const eq=(a,b,m)=>{assert.deepEqual(a,b,m);n++;},ok=(x,m)=>{assert.ok(x,m);n++;};
function schedule(slots,osr,period){
 if(!Array.isArray(slots)||!slots.length||!Number.isFinite(period)||period<=0)throw new RangeError('schedule');
 let cursor=0;const events=[];
 for(const ch of slots){const count=osr[ch];if(!Number.isSafeInteger(count)||count<1||count>64)throw new RangeError('OSR');
  const times=Array.from({length:count},(_,i)=>(cursor+i)*period);
  events.push({ch,start:times[0],last:times.at(-1),center:times.reduce((a,b)=>a+b)/count,count});cursor+=count;
 }
 const cycle=cursor*period,out={};
 for(const ch of new Set(slots)){const e=events.filter(x=>x.ch===ch);const gaps=e.map((v,i)=>i+1<e.length?e[i+1].last-v.last:e[0].last+cycle-v.last);out[ch]={gaps,max:Math.max(...gaps),rate:e.length/cycle};}
 return {cycle,events,out};
}
const a=schedule(['A','B','C'],{A:1,B:4,C:16},2);eq(a.cycle,42);eq(a.events.map(x=>x.start),[0,2,10]);eq(a.events.map(x=>x.last),[0,8,40]);eq(a.events.map(x=>x.center),[0,5,25]);for(const ch of ['A','B','C']){eq(a.out[ch].gaps,[42]);eq(a.out[ch].rate,1/42);}
const b=schedule(['A','B','A','C'],{A:1,B:4,C:16},2);eq(b.cycle,44);eq(b.out.A.gaps,[10,34]);eq(b.out.A.rate,2/44);ok(b.out.A.max>20);eq(schedule(['A','B','C'],{A:1,B:4,C:4},2).cycle,18);
// Independent clock-by-clock oracle, including the wraparound gap over two rounds.
for(const B of [1,4,16,64])for(const C of [1,4,16,64])for(const slots of [['A','B','C'],['A','B','A','C']]){
 const osr={A:1,B,C},s=schedule(slots,osr,2),expanded=[];
 for(let round=0;round<2;round++)for(const ch of slots)for(let i=0;i<osr[ch];i++)expanded.push({ch,done:i===osr[ch]-1});
 for(const ch of ['A','B','C']){const times=expanded.flatMap((x,i)=>x.ch===ch&&x.done?[i*2]:[]);const gaps=times.slice(1).map((t,i)=>t-times[i]);eq(Math.max(...gaps),s.out[ch].max);eq(s.out[ch].gaps.reduce((a,b)=>a+b),s.cycle);}
}
for(const fn of [()=>schedule([],{},2),()=>schedule(['A'],{A:0},2),()=>schedule(['A'],{A:1.5},2),()=>schedule(['A'],{A:1},0),()=>schedule(['A'],{A:1},NaN)]){assert.throws(fn,RangeError);n++;}
const read=f=>fs.readFileSync(__dirname+'/'+f,'utf8'),source=read('engineering-cases.js'),marker='\n// Original AD4696 OSR schedule case; all twenty-nine prior cases retained unchanged.\n';eq(source.split(marker).length,2);
eq(crypto.createHash('sha256').update(source.split(marker)[0]).digest('hex'),'1212e98aa15ddaf6f26391badf82e468021649932cb5781c5b09e0c6f2d86ebc');
const ctx={window:{}};vm.runInNewContext(source,ctx);const all=ctx.window.SensorCases,c=all.at(-1);eq(all.length,30);eq(new Set(all.map(x=>x.id)).size,30);eq(Object.keys(ctx.window.SensorCaseOverviews).length,30);eq(c.id,'adi-ad4696-osr-sequence-budget');eq(c.verified,'2026-11-16');eq(c.published,'2023-04');eq(c.status,'待学习');eq(c.reproduction,'未本站实物复现');eq(c.blocks.length,7);
for(const term of ['42 μs','23.81','10、34','45.45','55.56','5，C = 25','尚未执行','非 autocycle','等权时间中心','未下载运行候选工程','不是 SDO','高阻和外部上拉'])ok(JSON.stringify(c).includes(term),term);
for(const s of c.sources)eq(new URL(s.url).hostname,'www.analog.com');ok(read('index.html').includes('engineering-cases.js?v=20261116.1'));ok(read('README.md').includes('#case/'+c.id));
console.log(n+' AD4696 schedule, independent oracle, wraparound, invalid-input and exact-preservation assertions passed.');
