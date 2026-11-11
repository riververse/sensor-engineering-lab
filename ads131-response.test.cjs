/* Original offline byte/type teaching model, NOT TI code or an SPI driver.
 * Restricted to 24-bit words, CCITT output CRC, and proven NULL/RREG history.
 * No input-CRC failures, writes, reset, timeout, clock timing or hardware model.
 * previous/epoch/completeness/dataProof are external evidence, not ADC fields.
 * No network, hardware, file writes, persistent state or candidate execution. */
'use strict';
const fs=require('node:fs'),vm=require('node:vm'),crypto=require('node:crypto'),assert=require('node:assert/strict');
let checks=0;
const eq=(a,b,m)=>{assert.deepEqual(a,b,m);checks++;};
const ok=(a,m)=>{assert.ok(a,m);checks++;};
const rejects=f=>{assert.throws(f,RangeError);checks++;};
const bytesOK=a=>Array.isArray(a)&&a.length<=192&&a.every(x=>Number.isInteger(x)&&x>=0&&x<=255);
// Direct MSB-first bit feedback. No reflection and no final XOR.
function crc(bytes){
 if(!bytesOK(bytes))throw new RangeError('bounded complete bytes');
 let r=0xffff;
 for(const b of bytes)for(let bit=7;bit>=0;bit--){
  const feedback=((r>>>15)^((b>>>bit)&1))&1;
  r=(r*2)&0xffff;if(feedback)r^=0x1021;
 }
 return r;
}
// Independently derived polynomial long division over GF(2), not an LFSR loop.
// Remainder of (seed*x^(8N)) XOR (message*x^16), modulo x^16+x^12+x^5+1.
function polynomialOracle(bytes){
 if(!bytesOK(bytes))throw new RangeError('bounded complete bytes');
 const bits=8*bytes.length;let message=0n;
 for(const b of bytes)message=(message<<8n)|BigInt(b);
 let dividend=(0xffffn<<BigInt(bits))^(message<<16n);
 for(let degree=bits+15;degree>=16;degree--){
  if((dividend>>BigInt(degree))&1n)dividend^=0x11021n<<BigInt(degree-16);
 }
 return Number(dividend);
}
function word(v){
 if(!Number.isInteger(v)||v<0||v>0xffffff)throw new RangeError('24-bit unsigned word');
 return [v>>>16,(v>>>8)&255,v&255];
}
function packet(words){
 if(!Array.isArray(words)||words.length!==5)throw new RangeError('five payload words only');
 const data=words.flatMap(word),r=crc(data);return [...data,r>>>8,r&255,0];
}
function validCrc(frame){
 return bytesOK(frame)&&frame.length===18&&crc(frame.slice(0,15))===frame[15]*256+frame[16];
}
function unpack(frame){return Array.from({length:6},(_,i)=>frame[3*i]*65536+frame[3*i+1]*256+frame[3*i+2]);}
const signed24=x=>x>=0x800000?x-0x1000000:x;
const NULL=Object.freeze({kind:'NULL'}),SINGLE=Object.freeze({kind:'RREG',address:9,count:1}),MULTI=Object.freeze({kind:'RREG',address:9,count:4});
const base={complete:true,historyKnown:true,epoch:7,expectedEpoch:7,wordBits:24,crcType:'CCITT',previous:NULL};
// This is a response-type gate only. It cannot establish truth of supplied history
// or interpret every STATUS flag, input command error, freshness or readout FIFO.
function classify(frame,evidence){
 if(!evidence||evidence.complete!==true||evidence.historyKnown!==true||!Number.isSafeInteger(evidence.epoch)||evidence.epoch<0||evidence.epoch!==evidence.expectedEpoch||evidence.wordBits!==24||evidence.crcType!=='CCITT'||!validCrc(frame))return null;
 const w=unpack(frame),p=evidence.previous;
 if(w[0]%256!==0||w[5]%256!==0||!p)return null;
 if(p.kind==='RREG'&&p.address===9&&p.count===4){
  if((w[0]>>>8)!==0xe483||w.slice(1,5).some(v=>v%256!==0))return null;
  return {kind:'registers',address:9,values:w.slice(1,5).map(v=>v>>>8)};
 }
 if(p.kind==='NULL')return {kind:'adc',response:{kind:'status',value:w[0]>>>8},values:w.slice(1,5).map(signed24)};
 if(p.kind==='RREG'&&p.address===9&&p.count===1)return {kind:'adc',response:{kind:'register',address:9,value:w[0]>>>8},values:w.slice(1,5).map(signed24)};
 return null;
}
// Separate application/oracle gate, intentionally not inferred from CRC or type.
function deliver(decoded,dataProof){return decoded?.kind==='adc'&&dataProof===true?decoded.values:null;}
const adcWords=[0x010f00,0xfffff4,0,1234,32768];
const ordinary=packet(adcWords),registers=packet([0xe48300,0,0,0,0x800000]),single=packet([0,...adcWords.slice(1)]);
// Exact fixed vector, checked by independent polynomial division as well.
const vector=Array.from('123456789',c=>c.charCodeAt(0));
eq(crc(vector),0x29b1);eq(polynomialOracle(vector),0x29b1);
eq(crc([]),0xffff);eq(polynomialOracle([]),0xffff);
eq(registers.slice(0,15),[0xe4,0x83,0,0,0,0,0,0,0,0,0,0,0x80,0,0]);
eq(registers.slice(15),[0xd7,0xf9,0]);eq(polynomialOracle(registers.slice(0,15)),0xd7f9);
eq(ordinary.slice(15),[0xbe,0xde,0]);eq(polynomialOracle(ordinary.slice(0,15)),0xbede);
for(let n=0;n<=64;n++){
 const sequence=Array.from({length:n},(_,i)=>(i*37+n*11)&255);
 eq(crc(sequence),polynomialOracle(sequence),'independent deterministic length/byte oracle');
}
for(let b=0;b<256;b++)eq(crc([b]),polynomialOracle([b]),'all one-byte messages');
for(const frame of [ordinary,registers,single]){
 eq(frame.length,18);ok(validCrc(frame));eq(frame.at(-1),0);
 eq(crc(frame.slice(0,15)),polynomialOracle(frame.slice(0,15)));
 for(let bit=0;bit<136;bit++){
  const bad=frame.slice();bad[Math.floor(bit/8)]^=1<<(7-bit%8);
  eq(validCrc(bad),false,'every single-bit flip in this payload or CRC remainder is rejected');
 }
}
eq(ordinary.length,registers.length,'length alone cannot distinguish response types');
eq(ordinary.length*8,144,'wire bits only; no transport or sampling time claim');
const naive=frame=>validCrc(frame)?unpack(frame).slice(1,5).map(signed24):null;
eq(naive(ordinary),[-12,0,1234,32768]);
eq(naive(registers),[0,0,0,-8388608],'valid register bytes are falsely labeled as four ADC codes');
eq(classify(registers,{...base,previous:MULTI}),{kind:'registers',address:9,values:[0,0,0,0x8000]});
eq(deliver(classify(registers,{...base,previous:MULTI}),true),null,'register response never enters ADC dataset');
eq(classify(single,{...base,previous:SINGLE}).response,{kind:'register',address:9,value:0});
eq(deliver(classify(single,{...base,previous:SINGLE}),true),[-12,0,1234,32768]);
eq(classify(ordinary,base).response,{kind:'status',value:0x010f});
eq(deliver(classify(ordinary,base),false),null,'type is not independent sample-validity proof');
eq(deliver(classify(ordinary,base),true),[-12,0,1234,32768]);
ok(validCrc(ordinary),'unchanged old frame retains a valid CRC');
eq(classify(ordinary,{...base,epoch:6}),null,'old proven command generation is not current');
eq(classify(ordinary,{...base,historyKnown:false}),null,'intact response cannot reconstruct missing pending command');
const transactions=[{sent:MULTI,previous:NULL,frame:ordinary},{sent:NULL,previous:MULTI,frame:registers},{sent:NULL,previous:NULL,frame:ordinary}];
eq(transactions.map(t=>classify(t.frame,{...base,previous:t.previous})?.kind),['adc','registers','adc'],'response follows PREVIOUS command');
// Demonstrate why the external history proof is essential: a false descriptor
// may mislabel intact bytes. This is not claimed to be self-correcting firmware.
eq(transactions.map(t=>classify(t.frame,{...base,previous:t.sent})?.kind),[undefined,'adc','adc'],'using CURRENT command fails');
for(const patch of [{complete:false},{complete:1},{historyKnown:false},{historyKnown:1},{epoch:6},{epoch:NaN},{epoch:-1},{expectedEpoch:8},{wordBits:16},{wordBits:32},{crcType:'ANSI'},{previous:null},{previous:{kind:'WREG'}},{previous:{kind:'RREG',address:14,count:4}},{previous:{kind:'RREG',address:9,count:2}}])eq(classify(registers,{...base,previous:MULTI,...patch}),null,'unsupported or unproven history rejected');
eq(classify(registers,null),null);
const wrongAck=packet([0xe70300,0,0,0,0x800000]);ok(validCrc(wrongAck));eq(classify(wrongAck,{...base,previous:MULTI}),null,'correct CRC cannot satisfy another request');
// Padding belongs to the wire representation. CRC-word padding is not part of
// the message CRC comparison, but our narrow canonical-format gate checks it.
for(const index of [2,5,8,11,14]){
 const bad=registers.slice();bad[index]=1;
 const r=crc(bad.slice(0,15));bad[15]=r>>>8;bad[16]=r&255;
 ok(validCrc(bad));eq(classify(bad,{...base,previous:MULTI}),null,'valid CRC does not repair noncanonical register padding');
}
const crcPadding=registers.slice();crcPadding[17]=1;ok(validCrc(crcPadding));eq(classify(crcPadding,{...base,previous:MULTI}),null);
const data=registers.slice(0,15);ok(crc(data)!==crc(data.filter((_,i)=>i%3!==2)),'do not omit wire padding before CRC');
ok(crc(data)!==crc(data.flatMap((_,i)=>i%3===0?[...data.slice(i,i+3),0]:[])),'do not insert host 32-bit padding');
eq(0xa000|(9<<7)|(4-1),0xa483);eq(0xe000|(9<<7)|(4-1),0xe483);eq(0xa000|(9<<7),0xa480);
for(let n=0;n<18;n++)eq(classify(registers.slice(0,n),{...base,previous:MULTI}),null,'every truncated frame rejected');
eq(classify([...registers,0],{...base,previous:MULTI}),null);
for(const bad of [null,{},[NaN],[Infinity],[-1],[256],[1.5],['1']])rejects(()=>crc(bad));
for(const bad of [-1,0x1000000,NaN,Infinity,1.5,'1'])rejects(()=>word(bad));
const read=f=>fs.readFileSync(__dirname+'/'+f,'utf8'),source=read('engineering-cases.js');
const marker='\n// Original ADS131M04 response-type case; all twenty-three prior cases retained unchanged.\n';
eq(source.split(marker).length,2);
const hash=x=>crypto.createHash('sha256').update(x).digest('hex');
eq(hash(source.split(marker)[0]),'c0d6df03af06e856f7d580a7bc47540b577e90813f87fa36193f48724e98a899','all 23 prior cases/overviews preserved byte-for-byte');
const ctx={window:{}};vm.runInNewContext(source,ctx);const all=ctx.window.SensorCases,over=ctx.window.SensorCaseOverviews,id='ti-ads131m04-response-identity',c=all.find(x=>x.id===id);
eq(all.length,27);eq(Object.keys(over).length,27);eq(c.status,'待学习');eq(c.reproduction,'未本站实物复现');eq(c.verified,'2026-11-08');eq(c.blocks.length,7);
eq(hash(JSON.stringify(all.slice(0,23))),'edc60acbfbaf938aa10efc74251368ff9f69830b563068206a5d1d4fe17d111a','all 23 prior case objects unchanged');
const old={};for(const x of all.slice(0,23))old[x.id]=over[x.id];
eq(hash(JSON.stringify(old)),'4fa169d347e979173db3f9e3416cc83476e536f1928868a6b57e0fb18d14da24','all 23 prior overviews unchanged');
const prose=JSON.stringify(c);
for(const term of ['SBAS890D','SBAA106A','非 ADS131M04-Q1','A483h','E483h','CH0_GCAL_MSB','144','1021h','FFFFh','CRC_TYPE=0','RefIn=RefOut=false','XorOut=0000h','D7F9h','来源身份认证','前一帧','不是转换完成序号','前帧未知','不是上电抓包','尚未执行','没有本站或独立第三方实物复现'])ok(prose.includes(term),term);
for(const [f,h] of [['app.js','98cf80f0fd5bb61c578ba516471dda9ecb69c2b8152b9006e7ce57f895b1f1ed'],['style.css','ae22afcc302123fba024b368a60e63ca2eb05b38590056c7a6210692b7b2b25e'],['models.js','61aeeaa1ceface1d6eac26594e34e791503dec2b3d126e7514f98df20c0546e5'],['content.js','b515149000b53e48a593c74df58a7a34d563b48f6c878c99a73ad615e9cdcf40'],['mcu-timing.js','75b49417d443c63eb78804e2689b29c2b3329fed617896bb89f547c91e431416']])eq(hash(f==='app.js'?read(f).replace('Raspberry Pi、Microchip 的','Raspberry Pi 的'):read(f)),h,f+' unchanged');
for(const s of c.sources)eq(new URL(s.url).hostname,'www.ti.com');
for(const b of c.blocks)for(const ref of b.sourceIds||[])ok(c.sources.some(s=>s.id===ref));
ok(read('index.html').includes('engineering-cases.js?v=20261111.1'));ok(read('index.html').includes('二十七篇来源核验工程案例'));
console.log(`${checks} original ADS131M04 CRC-oracle, response-type, history-gate and preservation checks passed. No hardware or candidate code executed.`);
