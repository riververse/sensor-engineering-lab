/* Original charge-reservoir arithmetic. No vendor code, hardware, network or storage writes. */
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),crypto=require('node:crypto');
let checks=0;const ok=(v,m)=>{assert.ok(v,m);checks++;},near=(a,b,e=1e-9)=>ok(Math.abs(a-b)<e,`${a} ≈ ${b}`);
function reservoir({r,c,t,q,n}){
 if(![r,c,t,q].every(v=>Number.isFinite(v)&&v>0)||!Number.isInteger(n)||n<1)throw new RangeError('positive physical values and integer count');
 const a=Math.exp(-t/(r*c)),d=q/c;let x=0;const samples=[];
 for(let i=0;i<n;i++){x=a*x+d;samples.push(x);}
 return {a,samples,peak:d/(1-a),average:r*q/t};
}
const p={r:1,c:10e-6,t:1e-6,q:330e-12,n:16},m=reservoir(p),budget=5/2**17;
near(budget*1e6,38.14697265625);near(budget/330e-6,.11559688683712122);
near(m.samples[0]*1e6,33);near(m.samples[15]*1e6,276.7622984013678);
near(m.peak*1e6,346.7749541775768);near(m.average*1e6,330);
ok(m.samples[0]<budget&&m.samples[15]>budget,'first sample passes while later burst fails');
for(let i=1;i<m.samples.length;i++)ok(m.samples[i]>m.samples[i-1],'monotonic burst is not random noise');
const big=reservoir({...p,c:22e-6}),low=reservoir({...p,r:.02});
near(big.samples[0]*1e6,15);near(big.peak*1e6,337.5568162253659);near(big.average,m.average);
near(low.peak*1e6,33.22386061190804);ok(low.peak<budget,'hypothetical low resistance only');
const slow=reservoir({...p,t:10e-6});ok(slow.peak<m.samples[15],'same long-term throughput can hide burst peak');
// Long idle interval restores initial state in this single-pole model, not necessarily real hardware.
ok(m.samples[15]*Math.exp(-1e-3/(p.r*p.c))<1e-40,'idle recovery');
// Shared reservoir: simultaneous pulses triple charge; staggered pulses triple frequency.
const simultaneous=reservoir({...p,q:3*p.q}),staggered=reservoir({...p,t:p.t/3});
near(simultaneous.average,staggered.average);ok(simultaneous.peak>staggered.peak,'phase changes peak not average charge');
for(const invalid of [{r:0},{c:-1},{t:NaN},{q:Infinity},{n:1.5}]){assert.throws(()=>reservoir({...p,...invalid}),RangeError);checks++;}
const source=fs.readFileSync(__dirname+'/engineering-cases.js','utf8'),marker='\n// Original reference-drive case; prior case bytes retained unchanged.';
assert.equal(crypto.createHash('sha256').update(source.slice(0,source.indexOf(marker))).digest('hex'),'64e21f9d3a28fe50c4059053b95b89308236a41a343bce3d547a34046ee63256');checks++;
const ctx={window:{}};vm.runInNewContext(source,ctx);const c=ctx.window.SensorCases.find(c=>c.id==='adi-sar-reference-burst');
assert.ok(ctx.window.SensorCases.length>=15,'all previously published cases retained');checks++;assert.equal(c.verified,'2026-10-26');checks++;
const text=JSON.stringify(c);for(const s of ['AD7686','AD7980','Rev. G','8192','500 Ω','不是AD7980内部模型','330 μA','2.5 mA','0.1156 Ω','276.762','337.557','尚未执行','未本站实物复现','软件开源授权'])ok(text.includes(s),s);
ok(c.blocks.length===7&&c.sources.length===3,'complete evidence structure');
console.log(`${checks} reference-burst arithmetic, boundary and byte-for-byte legacy checks passed. Offline model only.`);
