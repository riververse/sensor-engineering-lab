/* Original, bounded algebra for overlapping global-chop contributors.
 * NOT TI code, an ADC filter model, a timestamp implementation or a driver.
 * C values are explanatory internal quantities, not claimed SPI outputs.
 * No network, hardware, random trials, file writes or persistent storage. */
'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),crypto=require('node:crypto');
let count=0;
const eq=(a,b,m)=>{assert.deepEqual(a,b,m);count++;};
const ok=(a,m)=>{assert.ok(a,m);count++;};
const near=(a,b,m)=>ok(Number.isFinite(a)&&Math.abs(a-b)<1e-10,m||`${a} != ${b}`);
const rejects=(fn)=>{assert.throws(fn,RangeError);count++;};
const sign=k=>k%2===0?1:-1;
function internal(x,offset,noise){
 if(!Array.isArray(x)||!Array.isArray(offset)||!Array.isArray(noise)||x.length!==offset.length||x.length!==noise.length||![...x,...offset,...noise].every(Number.isFinite))throw new RangeError('finite equal-length contributors');
 return x.map((v,k)=>sign(k)*v-offset[k]+noise[k]);
}
function corrected(c){
 if(!Array.isArray(c)||!c.every(Number.isFinite))throw new RangeError('finite contributors');
 return c.slice(1).map((v,k)=>(sign(k)*c[k]+sign(k+1)*v)/2);
}
const constant=(n,v)=>Array(n).fill(v);
// First internal conversion alone yields no corrected output. Adjacent pairs reuse.
eq(corrected([]),[]);eq(corrected([10]),[]);
const c=internal([10,12,14,16],constant(4,.1),constant(4,0));
eq(c,[9.9,-12.1,13.9,-16.1]);eq(corrected(c),[11,13,15]);
eq(corrected(internal(constant(5,10),constant(5,.14),constant(5,0))),[10,10,10,10]);
eq(corrected(internal([10,10,14,14],constant(4,.1),constant(4,0))),[10,12,14]);
near(corrected(internal([10,10],[.10,.14],[0,0]))[0],10.02);
near(corrected(internal([10,10,10],[.10,.14,.18],[0,0,0]))[1],9.98);
for(let n=2;n<=30;n++){
 const values=Array.from({length:n},(_,k)=>3*k-20),o=constant(n,17.5),noise=constant(n,0),out=corrected(internal(values,o,noise));
 eq(out.length,n-1);out.forEach((y,k)=>near(y,(values[k]+values[k+1])/2));
}
// A polarity bug (always previous minus current) changes the second result's sign.
near((c[1]-c[2])/2,-13);ok((c[1]-c[2])/2!==corrected(c)[1]);
for(const bad of [[1,NaN],[1,Infinity],['1',2]])rejects(()=>corrected(bad));
rejects(()=>corrected(null));rejects(()=>internal([1,2],[0],[0,0]));rejects(()=>internal([1],[0],[NaN]));

// Independent Rademacher e_k (+/-1) is an exact finite ensemble, not chip noise.
// n_k=s_k*e_k: e is the polarity-restored internal noise with variance 1.
function ensemble(n){return Array.from({length:2**n},(_,mask)=>Array.from({length:n},(_,k)=>(mask>>k)&1?1:-1));}
const mean=a=>a.reduce((s,v)=>s+v,0)/a.length;
const covariance=(a,b)=>{const am=mean(a),bm=mean(b);return mean(a.map((v,i)=>(v-am)*(b[i]-bm)));};
const outputs=ensemble(5).map(e=>corrected(internal(constant(5,0),constant(5,0),e.map((v,k)=>sign(k)*v))));
const cols=Array.from({length:4},(_,k)=>outputs.map(y=>y[k]));
for(let j=0;j<4;j++){
 near(mean(cols[j]),0);near(covariance(cols[j],cols[j]),.5);
 for(let k=0;k<4;k++)near(covariance(cols[j],cols[k]),j===k?.5:Math.abs(j-k)===1?.25:0);
}
near(covariance(cols[0],cols[1])/.5,.5);
const means=outputs.map(mean);near(mean(means),0);near(covariance(means,means),7/32);
near((7/32)/(1/8),1.75);near(Math.sqrt(1.75),1.3228756555322954);
// Derive averaging weights independently by unit basis vectors for K outputs.
for(let k=1;k<=8;k++){
 const weights=Array.from({length:k+1},(_,j)=>{
  const e=Array.from({length:k+1},(_,i)=>i===j?1:0);
  return mean(corrected(internal(constant(k+1,0),constant(k+1,0),e.map((v,i)=>sign(i)*v))));
 });
 near(weights.reduce((s,v)=>s+v,0),1);
 weights.forEach((w,j)=>near(w,(j===0||j===k?1:2)/(2*k)));
 near(weights.reduce((s,v)=>s+v*v,0),(2*k-1)/(2*k*k));
 const eMeans=ensemble(k+1).map(e=>mean(corrected(internal(constant(k+1,0),constant(k+1,0),e.map((v,i)=>sign(i)*v)))));
 near(covariance(eMeans,eMeans),(2*k-1)/(2*k*k));
}
// Nonoverlapping pairs have no common contribution ONLY in this iid ensemble.
const nonoverlap=ensemble(4).map(e=>[(e[0]+e[1])/2,(e[2]+e[3])/2]);
near(covariance(nonoverlap.map(y=>y[0]),nonoverlap.map(y=>y[1])),0);
// Deliberately correlated noise invalidates the independence-based 1/2 result.
const common=[-1,1].map(v=>corrected(internal(constant(5,0),constant(5,0),Array.from({length:5},(_,k)=>sign(k)*v))));
near(covariance(common.map(y=>y[0]),common.map(y=>y[0])),1);
near(covariance(common.map(y=>y[0]),common.map(y=>y[1])),1);

// Arithmetic from rounded nominal-clock datasheet timing; not worst-case hardware.
function budget(t0,extra){
 if(!Number.isFinite(t0)||!Number.isFinite(extra)||t0<=0||extra<0)throw new RangeError('positive time and nonnegative extra delay');
 const period=t0+extra;return {first:2*period,period,rate:1000/period};
}
const a=budget(7.924,0),b=budget(7.924,1.1);
near(a.first,15.848);near(a.period,7.924);near(a.rate,126.19888944977285);eq(a.rate.toFixed(3),'126.199');
near(b.first,18.048);near(b.period,9.024);eq(b.rate.toFixed(3),'110.816');
ok(a.rate!==400/2);near(1000/400,2.5);ok(a.first>2.5);ok(b.rate<a.rate);
for(const pair of [[0,0],[-1,0],[7.924,-1],[NaN,0],[7.924,Infinity]])rejects(()=>budget(...pair));

// Preserve exactly all sixteen original case objects AND overview source text.
const read=f=>fs.readFileSync(__dirname+'/'+f,'utf8'),source=read('engineering-cases.js');
const marker='\n// Original chop-overlap case; all sixteen prior cases retained unchanged.\n';
ok(source.includes(marker));eq(crypto.createHash('sha256').update(source.slice(0,source.indexOf(marker))).digest('hex'),'5a2f42e4397ddcb9f1b97fccf0cc84b85d2c5a8b4c5cdff895a8b463f0d2d62c');
const ctx={window:{}};vm.runInNewContext(source,ctx);const cases=JSON.parse(JSON.stringify(ctx.window.SensorCases));
eq(cases.length,17);eq(new Set(cases.map(c=>c.id)).size,17);
const study=cases.find(c=>c.id==='ti-ads1262-chop-overlap');
eq(cases.at(-1).id,study.id);eq(study.status,'待学习');eq(study.reproduction,'未本站实物复现');eq(study.verified,'2026-10-31');eq(study.published,'2015-02');eq(study.blocks.length,7);eq(study.sources.length,1);
eq(study.sources[0].url,'https://www.ti.com/lit/ds/symlink/ads1262.pdf');
eq(study.blocks.find(b=>b.title==='待执行的台架验收清单').bullets.length,4);
const text=JSON.stringify(study);
for(const token of ['SBAS661C','2021-05','7.3728','IDAC rotation 关闭','不是 ADS1263 的 ADC2','连续转换','7.924','15.848','126.199','18.048','110.816','52 µs','1.75','7σ²/32','σ²/8','极性还原','不是器件漂移规格','不是 TI 报告的器件相关系数','不能由这两个点的中点推算','不能把它们当作 SPI','只运行原创离线模型','未下载、编译、执行或烧录','没有本站或独立第三方实物复现'])ok(text.includes(token),token);
for(const block of study.blocks)for(const id of block.sourceIds||[])ok(study.sources.some(s=>s.id===id));
for(const field of ['problem','method','boundary','takeaway'])ok(ctx.window.SensorCaseOverviews[study.id][field].length>=20);
ok(read('index.html').includes('engineering-cases.js?v=20261031.1'));
console.log(`${count} ADS1262 overlap, covariance, nominal timing and exact legacy-preservation checks passed. Restricted original model only; no vendor code or hardware executed.`);
