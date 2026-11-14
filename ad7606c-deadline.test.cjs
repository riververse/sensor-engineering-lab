/* Original integer-nanosecond deadline model, not a device emulator. No hardware or vendor code. */
'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),crypto=require('node:crypto');
let checks=0;const eq=(a,b,m)=>{assert.deepEqual(a,b,m);checks++;},ok=(a,m)=>{assert.ok(a,m);checks++;};
function accept({availableNs,nextUpdateNs,startNs,lastBitNs,frameId,expectedId}){
 for(const t of [availableNs,nextUpdateNs,startNs,lastBitNs])if(!Number.isSafeInteger(t)||t<0)throw new RangeError('integer ns required');
 if(nextUpdateNs<=availableNs||lastBitNs<startNs)throw new RangeError('event order');
 return startNs>=availableNs&&lastBitNs<=nextUpdateNs-25&&frameId===expectedId;
}
const base={availableNs:10000,nextUpdateNs:20000,startNs:12000,lastBitNs:19200,frameId:10,expectedId:10};
eq(accept(base),true);eq(20000-19200-25,775);eq(8*18*50,7200);eq(2*18*50,1800);
for(let delta=-100;delta<=100;delta++){eq(accept({...base,lastBitNs:19975+delta}),delta<=0);}
eq(accept({...base,startNs:12800,lastBitNs:20000}),false);eq(accept({...base,lastBitNs:19990}),false);
eq(accept({...base,frameId:11}),false);eq(accept({...base,startNs:9999}),false);
// A read can overlap next conversion start (synthetic 19.5us), but not its update (20us).
eq(accept({...base,lastBitNs:19700}),true);
for(const value of [NaN,Infinity,-1,1.5]){assert.throws(()=>accept({...base,startNs:value}),RangeError);checks++;}
assert.throws(()=>accept({...base,nextUpdateNs:9999}),RangeError);checks++;
const read=f=>fs.readFileSync(__dirname+'/'+f,'utf8');const src=read('engineering-cases.js');
const marker='\n// Original AD7606C readout-deadline case; all twenty-seven prior cases retained unchanged.\n';
eq(src.split(marker).length,2);eq(crypto.createHash('sha256').update(src.split(marker)[0]).digest('hex'),'1e81a7858dd6db146ee59869b59f35f82387c2073076bf559a554a21dfb17588','27 original cases byte-exact');
const ctx={window:{}};vm.runInNewContext(src,ctx);const all=ctx.window.SensorCases,c=all.at(-1);
eq(all.length,28);eq(new Set(all.map(x=>x.id)).size,28);eq(Object.keys(ctx.window.SensorCaseOverviews).length,28);
eq(c.id,'adi-ad7606c-readout-deadline');eq(c.verified,'2026-11-14');eq(c.status,'待学习');eq(c.reproduction,'未本站实物复现');eq(c.blocks.length,7);
for(const term of ['25 ns','0.5～0.65','144','36','7.2','19.975','0.775','第 n−1','部分读取','未运行候选工程'])ok(JSON.stringify(c).includes(term),term);
eq(c.sources.length,2);ok(c.sources.every(x=>new URL(x.url).hostname==='www.analog.com'));
ok(read('index.html').includes('engineering-cases.js?v=20261114.1'));ok(read('README.md').includes('#case/'+c.id));
console.log(checks+' AD7606C deadline, identity, boundary and preservation assertions passed; no hardware emulation.');
