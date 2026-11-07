/* Original discrete-byte / ACK observation model, not firmware or electrical simulation. */
'use strict';
const fs=require('node:fs'),vm=require('node:vm'),crypto=require('node:crypto'),assert=require('node:assert/strict');
let checks=0;const ok=(v,m)=>{assert.ok(v,m);checks++;};
const eq=(a,b,m)=>{assert.deepEqual(a,b,m);checks++;};
const read=p=>fs.readFileSync(__dirname+'/'+p,'utf8');
function hazardByte(address,byte,shared){
 if(![0x1d,0x53].includes(address))throw new RangeError('Only the two documented ADXL355 addresses');
 if(!Number.isInteger(byte)||byte<0||byte>255)throw new RangeError('Complete byte required');
 if(typeof shared!=='boolean')throw new TypeError('Explicit topology required');
 return shared&&(byte===address*2||byte===address*2+1);
}
function ackSlot(address,byte,shared,intendedAck){
 if(typeof intendedAck!=='boolean')throw new TypeError('Explicit intended receiver response required');
 const bystanderLow=hazardByte(address,byte,shared);
 return {bystanderLow,observedAck:intendedAck||bystanderLow};
}
const payload=[0x11,0x3a,0x3b,0xa6,0xa7,0x55];
eq(payload.flatMap((b,i)=>hazardByte(0x1d,b,true)?[i+1]:[]),[2,3],'0x1d byte risks');
eq(payload.flatMap((b,i)=>hazardByte(0x53,b,true)?[i+1]:[]),[4,5],'new address moves risk');
for(const address of [0x1d,0x53]){
 const risks=[];
 for(let byte=0;byte<256;byte++){
  const expected=byte===address*2||byte===address*2+1;
  eq(hazardByte(address,byte,true),expected,'exhaustive shared predicate');
  eq(hazardByte(address,byte,false),false,'independent SDA removes model coupling only');
  if(expected)risks.push(byte);
  for(const intendedAck of [false,true]){
   const result=ackSlot(address,byte,true,intendedAck);
   eq(result.observedAck,intendedAck||expected,'wired-AND abstract observation');
   eq(ackSlot(address,byte,false,intendedAck).observedAck,intendedAck,'isolated response intent');
  }
 }
 eq(risks,[address*2,address*2+1],'exact risk-byte set, not a probability');
}
// Another device, hypothetically at 0x50, sends a final 0xa6 byte.
// Controller-receiver intends NACK. Only this ninth-bit slot is modeled.
eq(ackSlot(0x53,0xa6,true,false),{bystanderLow:true,observedAck:true},'final NACK may be hidden');
eq(ackSlot(0x53,0xa5,true,false),{bystanderLow:false,observedAck:false},'negative byte control');
eq(ackSlot(0x1d,0xa6,true,false).observedAck,false,'address change removes this one trigger');
eq(ackSlot(0x1d,0x3a,true,false).observedAck,true,'but a different trigger remains');
eq(ackSlot(0x53,0xa6,true,true).observedAck,ackSlot(0x53,0xa5,true,true).observedAck,'equal line states cannot identify all drivers');
const before=payload.slice();for(let i=0;i<3;i++)payload.forEach(b=>hazardByte(0x53,b,true));eq(payload,before,'payload not mutated or silently escaped');
let rejected=0;
for(const fn of [()=>hazardByte(0,0,true),()=>hazardByte('0x53',0,true),()=>hazardByte(0x53,-1,true),()=>hazardByte(0x53,256,true),()=>hazardByte(0x53,1.2,true),()=>hazardByte(0x53,NaN,true),()=>hazardByte(0x53,Infinity,true),()=>hazardByte(0x53,'166',true),()=>hazardByte(0x53,166,1),()=>hazardByte(0x53,166,null),()=>ackSlot(0x53,166,true,0)]){assert.throws(fn);rejected++;checks++;}
const source=read('engineering-cases.js'),ctx={window:{}};vm.runInNewContext(source,ctx);
const c=ctx.window.SensorCases.find(x=>x.id==='adi-adxl355-shared-sda-ack');
ok(c,'new stable ID exists');eq(c.status,'待学习','new content unlearned');eq(c.reproduction,'未本站实物复现','no board reproduction');eq(c.verified,'2026-11-03','verification date');eq(c.published,'2025-06','version date separate');
eq(ctx.window.SensorCases.length,23,'twenty-three cases');eq(Object.keys(ctx.window.SensorCaseOverviews).length,23,'twenty-three overviews');
const content=JSON.stringify(c);
for(const t of ['Rev. D','UM10204','0x1D','0x53','0x3A/0x3B','0xA6/0xA7','独立 SDA','第九个时钟','NACK','未被寻址','未下载'])ok(content.includes(t),'explicit contract '+t);
ok(content.includes('未测量 ACK 宽度'),'no waveform measurement');ok(content.includes('不是模拟 ADXL355 内部状态机'),'restricted model');ok(content.includes('CS/SCL')&&content.includes('SCLK/VSSIO'),'pin discrepancy disclosed');
eq(Array.from(c.sources,s=>new URL(s.url).hostname),['www.analog.com','www.nxp.com'],'primary sources only');
const prefix=Buffer.from(source).subarray(0,205605);
eq(crypto.createHash('sha256').update(prefix).digest('hex'),'3f8994507cedbd1a843221f9ca829d379c3e2258c59625802c5de12c82cc576b','nineteen old cases/overviews byte-identical');
ok(read('index.html').includes('engineering-cases.js?v=20261107.1'),'new content cache version');
ok(read('index.html').includes('二十三篇来源核验工程案例'),'metadata count');
console.log(JSON.stringify({kind:'original_byte_and_ACK_slot_logic_not_ADXL355_or_MCU_simulation',checks,byteConfigurations:512,invalidInputs:rejected,oldSourcePrefixPreserved:true}));
