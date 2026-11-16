/* Original interval arithmetic only; no circuit simulation, vendor firmware or hardware. */
'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),crypto=require('node:crypto');
let n=0;const eq=(a,b,m)=>{assert.deepEqual(a,b,m);n++;},ok=(x,m)=>{assert.ok(x,m);n++;};
function budget(t,jitter,settle,next){
 for(const x of [t,jitter,settle,next])if(!Number.isSafeInteger(x)||x<0)throw new RangeError('nonnegative integer ns');
 const lo=t-jitter,hi=t+jitter;if(lo<0||hi>=next)throw new RangeError('switch range outside cycle');
 const quiet=hi<90||lo>110,margin=next-hi-settle;
 return {lo,hi,quiet,margin,pass:quiet&&margin>=0};
}
eq(budget(20,5,70,200),{lo:15,hi:25,quiet:true,margin:105,pass:true});
eq(budget(100,5,70,200),{lo:95,hi:105,quiet:false,margin:25,pass:false});
eq(budget(130,5,70,200),{lo:125,hi:135,quiet:true,margin:-5,pass:false});
eq(budget(120,5,70,200).margin,5);
// Independent enumeration oracle over integer switch intervals, including both forbidden boundaries.
for(let t=5;t<=194;t++)for(const j of [0,1,5]){
 const b=budget(t,j,70,200);let collision=false;for(let u=b.lo;u<=b.hi;u++)if(u>=90&&u<=110)collision=true;
 eq(b.quiet,!collision);eq(b.pass,!collision&&b.hi+70<=200);
}
for(const t of [90,110])eq(budget(t,0,0,200).pass,false);
for(const bad of [NaN,Infinity,-1,1.5]){assert.throws(()=>budget(bad,5,70,200),RangeError);n++;}
assert.throws(()=>budget(2,5,70,200),RangeError);n++;assert.throws(()=>budget(199,5,70,200),RangeError);n++;
const read=f=>fs.readFileSync(__dirname+'/'+f,'utf8'),s=read('engineering-cases.js');
const marker='\n// Original AD7960 quiet-window case; all twenty-eight prior cases retained unchanged.\n';
eq(s.split(marker).length,2);eq(crypto.createHash('sha256').update(s.split(marker)[0]).digest('hex'),'9f08d241205f388146b6e92d0235f862cf0deb40c87597e111846eb08bfaf38d','all previous source bytes exact');
const ctx={window:{}};vm.runInNewContext(s,ctx);const cs=ctx.window.SensorCases,c=cs.find(x=>x.id==='adi-ad7960-mux-quiet-window');eq(cs.length,30);eq(c.id,'adi-ad7960-mux-quiet-window');eq(c.status,'待学习');eq(c.reproduction,'未本站实物复现');eq(c.published,'2014-07');eq(c.verified,'2026-11-15');eq(c.blocks.length,7);eq(c.sources.length,2);
for(const x of ['90～110 ns','每 16 次','70 ns','±5 ns','−5 ns','不是芯片保证值','尚未执行','版权归 ADI'])ok(JSON.stringify(c).includes(x),x);
for(const source of c.sources)eq(new URL(source.url).hostname,'www.analog.com');
ok(read('index.html').includes('engineering-cases.js?v=20261116.1'));ok(read('README.md').includes('#case/'+c.id));
console.log(n+' AD7960 interval, deadline, boundary and exact-preservation checks passed.');
