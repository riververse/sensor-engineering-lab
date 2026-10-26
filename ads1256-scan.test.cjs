/* Original paper-budget and publication-content regressions only.
 * These tests do not emulate ADS1256 silicon, execute vendor code, or test a hardware driver. */
'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const read=n=>fs.readFileSync(__dirname+'/'+n,'utf8');
const ctx={window:{}};vm.createContext(ctx);vm.runInContext(read('engineering-cases.js'),ctx);
const cases=JSON.parse(JSON.stringify(ctx.window.SensorCases));
const c=cases.find(c=>c.id==='ti-ads1256-mux'),text=JSON.stringify(c);let checks=0;
const ok=(value,label)=>{assert.ok(value,label);checks++;};
const equal=(a,b,label)=>{assert.deepEqual(a,b,label);checks++;};
const hash=s=>crypto.createHash('sha256').update(s).digest('hex');
const originalCases={
 'ti-tipd120':'cd4a403cb3a9ed24ba84887f4bc891c837b6f223cfbf9a1f2b247664984372b5',
 'adi-cn0359':'105be051b1931975268eaf524750e383c0a9d4f3f05db34ad5b5f0e8048e2ee0',
 'st-an4073':'9fb929fa6e7e6e96896a4cc2edc2cf19572ed8de8fe31c8e78b0feaaeda1c33d',
 'st-adc-overrun':'699864f322149665139437946f08a1143bd5e44f3184f02f9d9afaef36878b8c'
};
for(const [id,digest] of Object.entries(originalCases))equal(hash(JSON.stringify(cases.find(v=>v.id===id))),digest,'preserve entire old case '+id);
equal(cases.slice(0,4).map(v=>v.id),Object.keys(originalCases),'old case order unchanged');
for(const [name,digest] of Object.entries({
 'content.js':'b515149000b53e48a593c74df58a7a34d563b48f6c878c99a73ad615e9cdcf40',
 'models.js':'61aeeaa1ceface1d6eac26594e34e791503dec2b3d126e7514f98df20c0546e5',
 'mcu-timing.js':'75b49417d443c63eb78804e2689b29c2b3329fed617896bb89f547c91e431416',
 'style.css':'f1564c78b9adffac3c782a2efcb422ea64ab06d1886b90b66b028a1b75cbfb4d'
}))equal(hash(name==='style.css'?read(name).split('\n/* Reading introductions:')[0]:read(name)),digest,'original lessons/models/timing/styles frozen: '+name);
equal(c.verified,'2026-10-19','new verification date only');equal(c.status,'待学习','new case pending');equal(c.reproduction,'未本站实物复现','no bench claim');
equal(c.blocks.length,7,'problem, choice, budgets, identity, tests and migration');
for(const phrase of ['SBAS288K','2013-09','2025-11-11','SBAA535A','2024-03','CLKIN = 7.68 MHz','SCLK = CLKIN / 4','3 字节 MUX WREG','单 ADC','不是多 ADC 同时采样或交错模式','completed_channel','converting_channel','RDATA(old)','SYNC 后、WAKEUP 前','尚未执行','不纳入这个固定配置稳态例子','不是精确采样孔径','零错标签','缺测可见','不是 ADS1256 内部 MUX / 采样电容的物理仿真','未复制或执行厂商固件','开源代码许可证'])ok(text.includes(phrase),'explicit scope/evidence: '+phrase);
for(const s of c.sources){const u=new URL(s.url);equal(u.hostname,'www.ti.com','primary source only');equal(u.protocol,'https:','HTTPS');}
// Independent re-derivation of every displayed headline calculation.
// Table 14 values are nominal source evidence; all extra guards/latencies are authored assumptions.
const clockMHz=7.68,spiMHz=clockMHz/4,odr=30000,totalRate=4374;
const steady=1e6/odr,slot=1e6/totalRate,channels=4;
const tau=2,step=2,tolerance=2e-6,guard=tau*Math.log(step/tolerance),extra=5;
const frame=channels*slot,guardedFrame=channels*(slot+guard+extra);
const shown=(value,decimals,label)=>ok(text.includes(value.toFixed(decimals)),label+' appears with correctly rounded independent arithmetic');
shown(steady,3,'steady output interval');shown(slot,3,'settled cycling slot');shown(frame,3,'four-channel frame');shown(totalRate/channels,1,'per-channel nominal update rate');shown(3*slot,3,'ready-time span, not simultaneous sampling');shown(guard,3,'absolute settling-error allocation');shown(guardedFrame,3,'guarded frame');shown(1e6/guardedFrame,3,'guarded frame rate');
// Typography uses a mathematical minus sign in the case.
ok(text.includes('−'+Math.abs(1000-guardedFrame).toFixed(3)),'negative deadline margin visible');
shown(32/spiMHz+50/clockMHz,3,'RDATA command, delay and read time');
const stopTime=extra+24/spiMHz+4/clockMHz+8/spiMHz;
shown(stopTime,3,'finish SYNC before nominal next result');ok(stopTime<steady,'assumed short-service deadline fits');
// Shows why moving the extra guard before SYNC is not an equivalent schedule.
ok(stopTime+guard>steady,'waiting before SYNC can cross nominal update deadline');
ok(frame<1000&&guardedFrame>1000,'analog/host allowances reverse nominal 1 ms feasibility');
ok(Math.abs(step*Math.exp(-guard/tau)-tolerance)<1e-18,'RC residual reaches assigned 2 microvolts');
ok(Math.abs(2*1000*1e-9*1e6-tau)<1e-12,'two-leg differential RC time constant');
shown(2*(slot+guard+extra),3,'two-channel migration frame');shown(1e6/(2*(slot+guard+extra)),3,'two-channel migration rate');shown(4*(1e6/1438+guard+extra),3,'2000 SPS ODR uses 1438 cycling result rate');
ok(4*(1e6/1438+guard+extra)>guardedFrame,'slower ODR does not improve frame deadline');
for(const channels of [1,2,4,8])for(const addedGuard of [0,guard,100])for(const softwareDelay of [0,5,20]){
 const t=channels*(slot+addedGuard+softwareDelay);
 ok(Number.isFinite(t)&&t>0,'finite independent slot sum');
 ok(1e6/t<=totalRate/channels+1e-10,'guards cannot improve nominal per-channel rate');
}
ok(read('app.js').includes('${engineeringCases.length} 个问题'),'case count does not remain hard-coded to four');
ok(read('index.html').includes('十二篇来源核验工程案例'),'metadata describes twelve cases');
ok(read('README.md').includes('#case/ti-ads1256-mux'),'new route documented');
console.log(`${checks} ADS1256 publication-content and independently recomputed budget checks passed. No hardware or driver reproduction.`);
