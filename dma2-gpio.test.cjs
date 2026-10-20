/* Original arithmetic, address and publication checks only.
 * No STM32 silicon emulation, hardware access or vendor firmware execution. */
'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const read=n=>fs.readFileSync(__dirname+'/'+n,'utf8');
const context={window:{}};vm.createContext(context);vm.runInContext(read('engineering-cases.js'),context);
const cases=JSON.parse(JSON.stringify(context.window.SensorCases));
const c=cases.find(v=>v.id==='st-dma2-gpio-contention'),text=JSON.stringify(c);let checks=0;
const ok=(v,label)=>{assert.ok(v,label);checks++;};
const equal=(a,b,label)=>{assert.deepEqual(a,b,label);checks++;};
const hash=x=>crypto.createHash('sha256').update(x).digest('hex');
const previous={
 'ti-tipd120':'cd4a403cb3a9ed24ba84887f4bc891c837b6f223cfbf9a1f2b247664984372b5',
 'adi-cn0359':'105be051b1931975268eaf524750e383c0a9d4f3f05db34ad5b5f0e8048e2ee0',
 'st-an4073':'9fb929fa6e7e6e96896a4cc2edc2cf19572ed8de8fe31c8e78b0feaaeda1c33d',
 'st-adc-overrun':'699864f322149665139437946f08a1143bd5e44f3184f02f9d9afaef36878b8c',
 'ti-ads1256-mux':'9b987bc0d6a35aac0aa85e64e6ac05c94fe1133a0814ccfeb362e8b996a8bbee'
};
for(const [id,digest] of Object.entries(previous))equal(hash(JSON.stringify(cases.find(x=>x.id===id))),digest,'preserve prior case '+id);
equal(cases.slice(0,5).map(x=>x.id),Object.keys(previous),'prior case order');
equal(c.status,'待学习','pending status');equal(c.reproduction,'未本站实物复现','no hardware claim');equal(c.verified,'2026-10-20','new verification date');
equal(c.blocks.length,7,'complete case structure');equal(c.timingRelated,true,'route back to timing workbench');
for(const phrase of ['ES0182 Rev 19','AN4031 Rev 3','RM0090 Rev 22','远程 PDF 本次读取失败','GPIO 读取','不是该勘误列出的规避措施','独立第三方','Stream6 / Channel0','CCDS = 0','CC2DE / CC3DE','DIR = 00','PINC = 1、MINC = 0','PINCOS = 0','CIRC = 0','DMDIS = 0','不能放 CCM','不自动停 stream','DMEIF','两个数据项连续写到同址','DIR = 10','Quad-SPI 示例不属于 F407','DBM 交替的是 M0AR/M1AR','未计每次传输的读写总线交易','不是采样孔径','尚未执行','连线与负载延迟待验证','开源代码许可证'])ok(text.includes(phrase),'explicit engineering boundary: '+phrase);
for(const s of c.sources){const u=new URL(s.url);equal(u.protocol,'https:','source uses HTTPS');equal(u.hostname,'www.st.com','primary ST source');}
for(const b of c.blocks)for(const id of b.sourceIds||[])ok(c.sources.some(s=>s.id===id),'claim source '+id);
// Original timing assumptions, not measured bus response or transistor/capacitor simulation.
const budget=(phase,gpio=2,settling=10,margin=2,request=5)=>phase-request-gpio-settling-margin;
equal([budget(20),budget(20,4),budget(10),budget(30)],[1,-1,-9,11],'independent timing margins');
const phases=[20,50,80],period=100,acquisition=28/21,conversion=40/21;
ok(text.includes(acquisition.toFixed(3)),'rounded acquisition');ok(text.includes(conversion.toFixed(3)),'rounded conversion');
ok(phases.every(p=>p+conversion<period),'ideal EOC schedule fits a frame');
ok(conversion<period&&budget(10)<0,'ADC throughput does not prove external settling');
equal(3*2*1e6/period,60000,'raw ADC payload bytes/s');equal(4*1e6/period,40000,'GPIO source payload bytes/s');equal((3*2+4)*1e6/period,100000,'logical payload excludes bus transactions');
for(const gpio of [0,1,2,4,8])for(const settling of [0,10,20])for(const phase of [10,20,30,50,80]){
 const headroom=budget(phase,gpio,settling);
 equal(headroom,phase-5-(gpio+settling+2),'budget sum');
 ok(budget(phase,gpio+1,settling)<headroom,'more path delay cannot improve margin');
}
// Request assignment is per stream: equal CHSEL does not equal the same resource.
const routes=[['ADC1',0,0],['ADC2',2,1],['ADC3',1,2],['TIM1_CH1',6,0]];
equal(new Set(routes.map(r=>r[1])).size,4,'four distinct DMA2 streams');equal(routes.filter(r=>r[2]===0).length,2,'channel selection can be equal in different streams');
const base=0x20001000,gpioAddress=0x40020018; // Hypothetical address exercise, not board wiring.
const accesses=(pinc,minc,count=3)=>Array.from({length:count},(_,i)=>({read:base+(pinc?4*i:0),write:gpioAddress+(minc?4*i:0)}));
equal(accesses(true,false).map(a=>a.read),[0x20001000,0x20001004,0x20001008],'source increments per 32-bit command');
equal(new Set(accesses(true,false).map(a=>a.write)).size,1,'destination remains one BSRR register');
equal(new Set(accesses(false,true).map(a=>a.read)).size,1,'negative case rereads first source');
ok(accesses(false,true).slice(1).every(a=>a.write!==gpioAddress),'negative case walks beyond destination');
equal(base%4,0,'source aligned');equal(16*4,64,'16 NDTR items are 64 source bytes');
// An authored acceptance rule, not emulation of DMA error flags or hardware timestamp capture.
function acceptFrame(records,config){
 return records.length===3&&new Set(records.map(r=>r.adc)).size===3&&
 records.every(r=>[1,2,3].includes(r.adc)&&r.valid&&r.config===config&&r.frame===records[0].frame&&r.excitation===records[0].excitation);
}
const good=[1,2,3].map(adc=>({adc,frame:12,config:7,excitation:3,valid:true}));
ok(acceptFrame(good,7),'complete aligned frame accepted');
for(const modify of [r=>r.slice(1),r=>{r[1].adc=1;return r;},r=>{r[2].frame=13;return r;},r=>{r[0].config=6;return r;},r=>{r[1].excitation=2;return r;},r=>{r[2].valid=false;return r;}])ok(!acceptFrame(modify(structuredClone(good)),7),'invalid frame rejected');
ok(read('app.js').includes('c.timingRelated?'), 'conditional timing navigation');
ok(read('index.html').includes('六篇来源核验工程案例'),'metadata case count');
ok(read('index.html').includes('engineering-cases.js?v=20261020.2'),'data cache version');
ok(read('README.md').includes('#case/st-dma2-gpio-contention'),'new deep link documented');
console.log(`${checks} DMA2 GPIO source, address, timing and frame-identity checks passed. No firmware or hardware reproduction.`);
