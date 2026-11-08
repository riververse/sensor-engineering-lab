/* Original restricted edge/lock teaching model, not NXP code or hardware QA.
 * Single PDB channel and result slot; comparison, averaging, continuous mode,
 * calibration and configuration writes are excluded. Event order is an oracle,
 * not silicon arbitration. No recovery sequence, register or DMA mapping.
 * Reads, completed values and frame IDs are synthetic. No candidate execution. */
'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict'),crypto=require('node:crypto');
let checks=0;
const eq=(a,b,m)=>{assert.deepEqual(a,b,m);checks++;};
const ok=(a,m)=>{assert.ok(a,m);checks++;};
const rejects=f=>{assert.throws(f,RangeError);checks++;};
function simulate(events){
 if(!Array.isArray(events))throw new RangeError('event array');
 let lock=false,coco=false,busy=false,error=false,result=null,requestId=null,last=-Infinity;
 const trace=[],seen=new Set();
 for(const e of events){
  if(!e||!['request','complete','read','clearError'].includes(e.type)||!Number.isFinite(e.time)||e.time<0||e.time<last)throw new RangeError('finite ordered events');
  last=e.time;let accepted=null,edge=false,readId=null;
  if(e.type==='request'){
   if(typeof e.id!=='string'||!e.id||seen.has(e.id))throw new RangeError('unique request identity');
   seen.add(e.id);
   if(lock){error=true;accepted=false;}else{lock=true;busy=true;requestId=e.id;accepted=true;}
  }else if(e.type==='complete'){
   if(!busy)throw new RangeError('completion requires accepted request');
   busy=false;result=requestId;edge=!coco;coco=true;if(edge)lock=false;
  }else if(e.type==='read'){
   if(result===null)throw new RangeError('fixture reads an existing result');
   coco=false;readId=result;
  }else{error=false;}
  trace.push({time:e.time,type:e.type,lock,coco,busy,error,accepted,edge,readId,result});
 }
 return trace;
}
const r=(time,id)=>({type:'request',time,id}),c=time=>({type:'complete',time}),rd=time=>({type:'read',time}),ce=time=>({type:'clearError',time});
const timely=[r(1,'a'),c(4),rd(5),r(11,'b'),c(14),rd(15),r(21,'c'),c(24),rd(25)];
const snapshot=JSON.stringify(timely),normal=simulate(timely);
eq(JSON.stringify(timely),snapshot,'input never mutated');
eq(normal.filter(x=>x.type==='request').map(x=>x.accepted),[true,true,true]);
eq(normal.filter(x=>x.type==='complete').map(x=>x.edge),[true,true,true]);
eq(normal.filter(x=>x.type==='read').map(x=>x.readId),['a','b','c']);
eq(normal.at(-1).lock,false);eq(normal.at(-1).coco,false);eq(normal.at(-1).error,false);
const late=simulate([r(1,'a'),c(4),r(11,'b'),c(14),rd(15),r(21,'c'),ce(22)]);
eq(late[1].lock,false);eq(late[2].accepted,true,'old high does not stop the already-unlocked next request');
eq(late[3].edge,false);eq(late[3].busy,false);eq(late[3].lock,true);
eq(late[4].coco,false);eq(late[4].lock,true,'read is not a rising edge');
eq(late[5].accepted,false);eq(late[5].error,true);eq(late[6].error,false);eq(late[6].lock,true,'error and lock are separate');
// Reading after request but before the next completion can still prepare an edge.
const between=simulate([r(1,'a'),c(4),r(11,'b'),rd(12),c(14),rd(15),r(21,'c'),c(24)]);
eq(between[3].readId,'a');eq(between[4].edge,true);eq(between[4].lock,false);eq(between.at(-1).edge,true);
// Tied events use fixture order only; neither result is a hardware promise.
for(const before of [true,false]){
 const pair=before?[rd(14),c(14)]:[c(14),rd(14)];
 const a=simulate([r(1,'a'),c(4),r(11,'b'),...pair]);
 eq(a.at(-1).lock,!before);eq(a.findLast(x=>x.type==='complete').edge,before);
}
// Exact sweep of strictly earlier/later read events, with an independent edge oracle.
for(let t=5;t<=20;t++){
 if(t===11||t===14)continue;
 const events=[r(1,'a'),c(4),r(11,'b'),c(14),rd(t),r(21,'c')].sort((a,b)=>a.time-b.time);
 const a=simulate(events),done=a.find(x=>x.type==='complete'&&x.time===14);
 eq(done.edge,t<14);eq(a.at(-1).accepted,t<14);eq(a.at(-1).error,t>14);
}
const busy=simulate([r(1,'a'),r(2,'b'),c(4)]);
eq(busy[1].accepted,false);eq(busy[1].error,true);eq(busy[2].lock,false);eq(busy[2].error,true,'later edge does not clear error flag in model');
// Synthetic metadata belongs to the application, not ADC result registers.
function completeFrame(records,epoch,frame){
 if(!Array.isArray(records)||!Number.isSafeInteger(epoch)||epoch<0||!Number.isSafeInteger(frame)||frame<0)throw new RangeError('frame inputs');
 return records.length===4&&new Set(records.map(x=>x?.slot)).size===4&&records.every(x=>x&&[4,5,6,7].includes(x.slot)&&x.epoch===epoch&&x.frame===frame&&Number.isFinite(x.value));
}
const frame=[4,5,6,7].map(slot=>({slot,epoch:3,frame:42,value:1234}));
eq(completeFrame(frame,3,42),true);eq(completeFrame(frame.slice(0,3),3,42),false);
eq(completeFrame([...frame.slice(0,3),{...frame[3],frame:41}],3,42),false);
eq(completeFrame([...frame.slice(0,3),{...frame[3],epoch:2}],3,42),false);
eq(completeFrame([...frame.slice(0,3),frame[2]],3,42),false);
eq(completeFrame([...frame.slice(0,3),{...frame[3],slot:8}],3,42),false);
eq(completeFrame([...frame.slice(0,3),{...frame[3],value:NaN}],3,42),false);
function budget(period,conversion,readDelay,guard){
 if(![period,conversion,readDelay,guard].every(Number.isFinite)||period<=0||conversion<=0||readDelay<0||guard<0)throw new RangeError('finite time budget');
 const slack=period-conversion-readDelay-guard;return {slack,conservativePass:slack>0};
}
eq(budget(10,3,5,1),{slack:1,conservativePass:true});
eq(budget(10,3,8,1),{slack:-2,conservativePass:false});
eq(budget(10,3,6,1),{slack:0,conservativePass:false});
eq(budget(10,3,8,0).conservativePass,false,'not a necessary hardware deadline: the t=12 trace still releases lock');
for(const bad of [null,{},[null],[{type:'wrong',time:1}],[c(NaN)],[c(Infinity)],[c(-1)],[r(2,'a'),c(1)],[c(1)],[rd(1)],[r(1,'')],[r(1,'a'),c(4),r(5,'a')]])rejects(()=>simulate(bad));
for(const args of [[0,3,1,1],[10,0,1,1],[10,3,-1,1],[10,3,1,-1],[Infinity,3,1,1],[10,NaN,1,1]])rejects(()=>budget(...args));
rejects(()=>completeFrame(null,1,1));rejects(()=>completeFrame([],NaN,1));rejects(()=>completeFrame([],1,-1));
eq(simulate([]),[]);
// Content contract plus preservation of ALL prior source text and overviews.
const read=n=>fs.readFileSync(path.join(__dirname,n),'utf8');
const source=read('engineering-cases.js'),marker='\n// Original PDB COCO handshake case; all eighteen prior cases retained unchanged.\n';
eq(source.split(marker).length,2,'exactly one append');
eq(crypto.createHash('sha256').update(source.split(marker)[0]).digest('hex'),'2a1cac66cd16b1b0447a2beaa7b6bcc8ab49fcb7886dc9acd16a3e3ff8b5f2e1','entire eighteen-case source prefix retained');
const ctx={window:{}};vm.createContext(ctx);vm.runInContext(source,ctx);
const cases=JSON.parse(JSON.stringify(ctx.window.SensorCases)),a=cases.find(c=>c.id==='nxp-s32k144-coco-handshake'),text=JSON.stringify(a);
eq(cases.length,24);eq(a.id,'nxp-s32k144-coco-handshake');eq(a.maker,'NXP');eq(a.blocks.length,7);eq(a.verified,'2026-11-02');eq(a.status,'待学习');eq(a.reproduction,'未本站实物复现');
for(const token of ['ACFE=0','AVGE=0','ADCO=0','pretrigger 4','SC1E / R[4]','Rev. 13','Rev. 2.0','Account Required','S32K146','t=12','t=15','PDB_SC[DMAEN]','ADC_SC2[DMAEN]','2 个外围时钟','不是 PDB 的 DLY','不是已修好的驱动','尚未执行','不因此断言硬件必然失效'])ok(text.includes(token),token);
eq(a.blocks.find(x=>x.title==='待执行的台架验收清单').bullets.length,4);
for(const b of a.blocks)for(const id of b.sourceIds||[])ok(a.sources.some(x=>x.id===id),'resolved source');
for(const s of a.sources)ok(s.url.startsWith('https://'),'HTTPS source');
ok(read('README.md').includes('s32k-coco.test.cjs'));
eq(crypto.createHash('sha256').update(read('app.js').replace('TI、ADI、ST、Nordic、Bosch Sensortec、NXP、Raspberry Pi 的','TI、ADI、ST、Nordic、Bosch Sensortec 的')).digest('hex'),'f029cbc09f206e3f6b5cf5707ffded5d3c6d0a9eeb1d5b4dac0278d324598790','renderer unchanged except manufacturer list');
console.log(`S32K COCO restricted original model/content: ${checks} assertions passed; no hardware/candidate code executed.`);
