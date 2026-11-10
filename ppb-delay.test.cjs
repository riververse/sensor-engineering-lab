/* Original bounded evidence model. No TI code, hardware, network or storage writes.
 * Counter arithmetic only; not arbitration, aperture, repeated-trigger or read-race emulation. */
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),crypto=require('node:crypto');
let checks=0;const eq=(a,b,m)=>{assert.deepEqual(a,b,m);checks++;},ok=(a,m)=>{assert.ok(a,m);checks++;};
function stamp(trigger,delay){
 if(![trigger,delay].every(Number.isSafeInteger)||trigger<0||delay<0||trigger>1e6||delay>1e6)throw new RangeError('bounded nonnegative integer cycles');
 const req=trigger%4096,start=(trigger+delay)%4096;
 return (start-req+4096)%4096;
}
// Inputs marked proven/complete are external evidence, never inferred from a small stamp.
function assess({d,bound,hardware,complete,soc,expectedSoc,epoch,expectedEpoch,trigger,width,lo,hi}){
 if(!hardware||!complete||soc!==expectedSoc||epoch!==expectedEpoch)return null;
 if(![d,bound,trigger,width,lo,hi].every(Number.isSafeInteger)||d<0||d>4095||bound<0||bound>=4096||d>bound||trigger<0||width<=0||lo<0||hi<lo||Math.max(trigger,width,lo,hi)>1e6)return null;
 const start=trigger+d,end=start+width;
 return {start,end,fits:start>=lo&&end<=hi};
}
const base={d:8,bound:100,hardware:true,complete:true,soc:1,expectedSoc:1,epoch:7,expectedEpoch:7,trigger:100,width:20,lo:108,hi:140};
eq(assess(base),{start:108,end:128,fits:true});
eq(assess({...base,d:28}),{start:128,end:148,fits:false});
eq(assess({...base,width:40}),{start:108,end:148,fits:false});
eq(assess({...base,d:20}),{start:120,end:140,fits:true});
eq(assess({...base,d:7}).fits,false);
eq(stamp(4090,28),28);eq(stamp(4090,4124),28);eq(stamp(4090,4096),0);
eq(4096/100e6*1e6,40.96);eq(28/100e6*1e9,280);eq(8/100e6*1e9,80);
for(let delay=0;delay<4096;delay++)for(const trigger of [0,1,2047,4090,4095,4096,8191]){
 eq(stamp(trigger,delay),delay,'all sub-period delays recover, including across zero');
 eq(stamp(trigger,delay+4096),delay,'one extra period aliases');
 eq(stamp(trigger,delay+8192),delay,'two extra periods alias');
}
for(const patch of [{hardware:false},{complete:false},{soc:2},{epoch:8},{bound:4096},{bound:5000},{bound:null},{bound:NaN},{bound:7},{d:-1},{d:4096},{width:0},{width:-1},{width:NaN},{hi:100},{trigger:-1},{lo:-1},{d:1.2}])eq(assess({...base,...patch}),null,'invalid or unsupported evidence rejected');
// Software competition on a different SOC does not change the associated trigger's qualification.
eq(assess({...base,otherSocSoftware:true}),assess(base));
eq(assess({...base,otherSocSoftware:true,hardware:false}),null);
eq(assess({...base,d:4095,bound:4095,hi:5000}).start,4195);
eq(assess({...base,d:0,bound:0,lo:100}).fits,true);
for(let d=0;d<=100;d++)for(let width=1;width<=50;width++){
 const a=assess({...base,d,width});
 eq(a.fits,d>=8&&d+width<=40,'independent relative quiet-window oracle');
 eq(a.end-a.start,width);
}
for(const args of [[-1,0],[0,-1],[NaN,0],[0,Infinity],[1.5,0],[0,1e6+1]]){assert.throws(()=>stamp(...args),RangeError);checks++;}
const ctx={window:{}};vm.runInNewContext(fs.readFileSync(__dirname+'/engineering-cases.js','utf8'),ctx);
const all=ctx.window.SensorCases,over=ctx.window.SensorCaseOverviews,id='ti-f28004x-ppb-delay',c=all.find(x=>x.id===id),text=JSON.stringify(c);
eq(all.length,26);eq(c.status,'待学习');eq(c.verified,'2026-11-07');eq(c.blocks.length,7);
for(const term of ['12 位','DLYSTAMP','REQSTAMP','FREECOUNT','采样窗开始','不是饱和','0≤d<4096','4096 得到 D=0','软件触发','另一个 SOC','完整性','同一次采样','尚未执行','未下载运行候选项目代码'])ok(text.includes(term),term);
const hash=x=>crypto.createHash('sha256').update(JSON.stringify(x)).digest('hex');
eq(hash(all.slice(0,22)),'7fc7a72917f8fa58a59e62df9ad2b4674436213dcac11eb9a79733242ee585cf','22 old case objects unchanged');
const old={};for(const k of all.slice(0,22).map(x=>x.id))old[k]=over[k];
eq(hash(old),'36e70f6454dc518bfadf89e55054c564ad9d60c6093e51f0a936b6a2981ddbc5','22 old overviews unchanged');
console.log(`${checks} original PPB modular-evidence, quiet-window and preservation checks passed. No hardware or vendor code executed.`);
