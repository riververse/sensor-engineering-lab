/* Original deadline/serialization arithmetic only. Not Microchip firmware,
 * ADC/DMA/NVM emulation, real-time scheduling proof or a hardware test.
 * A/H/G, available slots and completion proofs are explicit external assumptions.
 * No network, hardware, persistent storage or candidate-code execution. */
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),crypto=require('node:crypto');
let checks=0;const eq=(a,b,m)=>{assert.deepEqual(a,b,m);checks++;},ok=(a,m)=>{assert.ok(a,m);checks++;};
const rejects=f=>{assert.throws(f,RangeError);checks++;};
const bounded=v=>Number.isSafeInteger(v)&&v>=0&&v<=1e6;
function slot({period,acquired,overhead,write,guard,erased,saved}){
 if(![period,acquired,overhead,write,guard].every(bounded)||period===0||write===0||typeof erased!=='boolean'||typeof saved!=='boolean')throw new RangeError('explicit bounded whole-microsecond contract');
 const slack=period-acquired-overhead-write-guard;
 return {slack,eligible:erased&&saved&&slack>0};
}
const base={period:100,acquired:12,overhead:8,write:75,guard:5,erased:true,saved:true};
eq(slot({...base,write:50}),{slack:25,eligible:true},'typical-time shortcut would admit');
eq(slot(base),{slack:0,eligible:false},'maximum-time equality fails strict budget');
eq(slot({...base,acquired:8,overhead:6}),{slack:6,eligible:true});
eq(slot({...base,period:125}),{slack:25,eligible:true});
eq(slot({...base,period:125,overhead:30}),{slack:3,eligible:true});
for(const patch of [{erased:false},{saved:false},{erased:false,saved:false}])eq(slot({...base,write:50,...patch}).eligible,false,'timing alone cannot prove preconditions');
// Independent oracle in absolute end-time form, including equality and overruns.
for(let period=75;period<=150;period++)for(let acquired=0;acquired<=25;acquired++)for(const overhead of [0,8,30])for(const guard of [0,5]){
 const a=slot({...base,period,acquired,overhead,guard});
 eq(a.eligible,acquired+overhead+75<period-guard);
 eq(a.slack,period-(acquired+overhead+75+guard));
 eq(slot({...base,period,acquired,overhead:overhead+1,guard}).slack,a.slack-1,'extra work never increases margin');
}
for(const key of ['period','acquired','overhead','write','guard'])for(const value of [-1,NaN,Infinity,1.5,'100',1000001])rejects(()=>slot({...base,[key]:value}));
for(const patch of [{period:0},{write:0},{erased:1},{saved:null}])rejects(()=>slot({...base,...patch}));
// Original low-byte-first convention; not a statement about the demo firmware.
function pack(bytes){
 if(!Array.isArray(bytes)||bytes.length>256||bytes.length%2||!bytes.every(v=>Number.isInteger(v)&&v>=0&&v<=255))throw new RangeError('bounded even complete bytes');
 return Array.from({length:bytes.length/2},(_,i)=>bytes[2*i]+256*bytes[2*i+1]);
}
function unpack(words){
 if(!Array.isArray(words)||words.length>128||!words.every(v=>Number.isInteger(v)&&v>=0&&v<=65535))throw new RangeError('bounded 16-bit words');
 return words.flatMap(w=>[w%256,Math.floor(w/256)]);
}
eq(pack([0x12,0xa5]),[0xa512]);eq(unpack([0xa512]),[0x12,0xa5]);
for(let lo=0;lo<256;lo++)for(let hi=0;hi<256;hi++)eq(unpack(pack([lo,hi])),[lo,hi],'all byte pairs roundtrip');
const bytes=Array.from({length:256},(_,i)=>i),before=JSON.stringify(bytes),words=pack(bytes);
eq(words.length,128);eq(unpack(words),bytes);eq(JSON.stringify(bytes),before,'input not mutated');eq(pack([]),[]);
for(const bad of [null,{},[1],[1,2,3],Array(258).fill(0),[NaN,0],[Infinity,0],[-1,0],[256,0],[1.5,0],['1',0]])rejects(()=>pack(bad));
for(const bad of [null,{},[65536],[-1],[1.5],[NaN],Array(129).fill(0)])rejects(()=>unpack(bad));
function block({bytes,period,slots,available,extra,slotEligible}){
 if(![bytes,period,slots,available,extra].every(bounded)||bytes===0||bytes>256||bytes%2||period===0||available>slots||typeof slotEligible!=='boolean')throw new RangeError('bounded block contract');
 const words=bytes/2,window=slots*period,deadline=bytes*period,slack=deadline-window-extra;
 return {words,window,deadline,slack,eligible:slotEligible&&available>=words&&slack>0};
}
const b={bytes:256,period:100,slots:128,available:128,extra:0,slotEligible:true};
eq(block(b),{words:128,window:12800,deadline:25600,slack:12800,eligible:true});
eq(128*75,9600,'pure write duration sum is not elapsed block latency');
eq(block({...b,slotEligible:slot(base).eligible}).eligible,false,'whole-block throughput cannot rescue failed slot');
eq(block({...b,available:127}).eligible,false,'skipped slot prevents complete block in fixed window');
eq(block({...b,slots:129}).eligible,true,'one later slot costs time only if all preconditions supplied');
eq(block({...b,extra:12800}).eligible,false,'equality at block deadline rejected');
eq(block({...b,extra:12801}).slack,-1);
eq(block({...b,period:125}).deadline,32000);
eq([10000/100,11000/100],[100,110],'duration ratios only; no lost-sample model');
for(const patch of [{bytes:255},{bytes:0},{available:129},{period:0},{slots:NaN},{extra:-1},{slotEligible:1}])rejects(()=>block({...b,...patch}));
const read=f=>fs.readFileSync(__dirname+'/'+f,'utf8'),hash=s=>crypto.createHash('sha256').update(s).digest('hex');
const source=read('engineering-cases.js'),marker='\n// Original Q43 flash-write budget case; all twenty-five prior cases retained unchanged.\n';
eq(source.split(marker).length,2);eq(hash(source.split(marker)[0]),'4639417b6ba09b58e655e0c685c3e657df891489bc0d473634d446ec5b6d3028','all 25 cases and overviews byte-for-byte');
const ctx={window:{}};vm.runInNewContext(source,ctx);const all=ctx.window.SensorCases,c=all.at(-1);
eq(all.length,26);eq(Object.keys(ctx.window.SensorCaseOverviews).length,26);eq(c.id,'microchip-q43-flash-sampling-budget');eq(c.maker,'Microchip');eq(c.verified,'2026-11-10');eq(c.published,'2020-07');eq(c.blocks.length,7);eq(c.status,'待学习');eq(c.reproduction,'未本站实物复现');
const prose=JSON.stringify(c);for(const term of ['75 μs','50 μs','10 ms','11 ms','25.6 ms','12.8 ms','9.6 ms','0xA512','M=0 μs','M=6 μs','1k','尚未执行','不是实测丢样数量','不以“ADC 全冻结”','不是已核验的厂商源码字节序','预擦除','许可证均未核验','未下载、编译、执行或烧录候选代码'])ok(prose.includes(term),term);
for(const s of c.sources)ok(['onlinedocs.microchip.com','ww1.microchip.com','github.com'].includes(new URL(s.url).hostname));
const normalized=read('app.js').replace('Raspberry Pi、Microchip 的','Raspberry Pi 的');eq(hash(normalized),'98cf80f0fd5bb61c578ba516471dda9ecb69c2b8152b9006e7ce57f895b1f1ed','renderer only adds manufacturer text');
for(const [f,h] of [['style.css','ae22afcc302123fba024b368a60e63ca2eb05b38590056c7a6210692b7b2b25e'],['models.js','61aeeaa1ceface1d6eac26594e34e791503dec2b3d126e7514f98df20c0546e5'],['content.js','b515149000b53e48a593c74df58a7a34d563b48f6c878c99a73ad615e9cdcf40'],['mcu-timing.js','75b49417d443c63eb78804e2689b29c2b3329fed617896bb89f547c91e431416']])eq(hash(read(f)),h,f+' unchanged');
ok(read('index.html').includes('二十六篇'));ok(read('index.html').includes('engineering-cases.js?v=20261110.1'));ok(read('README.md').includes('#case/'+c.id));
console.log(checks+' original flash-slot, block, packing, rejection and legacy-preservation checks passed; no firmware or hardware executed.');
