/* Original acceptance contracts, not STM32 silicon/register emulation or firmware. */
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),crypto=require('node:crypto');let n=0;
const eq=(a,b,m)=>{assert.deepEqual(a,b,m);n++;},ok=(a,m)=>{assert.ok(a,m);n++;};
function clockCondition(ahb,adc){if(![ahb,adc].every(x=>Number.isFinite(x)&&x>0&&x<=1000))throw new RangeError('positive bounded MHz');return ahb>10*adc;}
eq(clockCondition(120,12),false);eq(clockCondition(120,10),true);
for(let adc=1;adc<=50;adc++){eq(clockCondition(adc*10,adc),false);eq(clockCondition(adc*10+.001,adc),true);eq(clockCondition(adc*10-.001,adc),false);}
for(const bad of [0,-1,NaN,Infinity,'12',null,1001]){assert.throws(()=>clockCondition(120,bad),RangeError);n++;}
// Supplied group evidence, not a claim that one register read establishes it.
function decide({groupComplete,stopConfirmed,timedOut,records}){
 if(![groupComplete,stopConfirmed,timedOut].every(x=>typeof x==='boolean')||!Array.isArray(records))throw new RangeError('explicit evidence');
 if(timedOut)return 'timeout';
 if(!groupComplete)return 'wait-group';
 if(!stopConfirmed)return 'wait-stop';
 const expect=[['A',100],['B',200],['C',300]];
 if(records.length!==3||!records.every((r,i)=>Array.isArray(r)&&r.length===2&&r[0]===expect[i][0]&&r[1]===expect[i][1]))return 'reject-identity';
 return 'accept-synthetic';
}
const records=[['A',100],['B',200],['C',300]],base={groupComplete:true,stopConfirmed:true,timedOut:false,records};
eq(decide(base),'accept-synthetic');eq(decide({...base,groupComplete:false}),'wait-group');eq(decide({...base,stopConfirmed:false}),'wait-stop');
for(const groupComplete of [false,true])for(const stopConfirmed of [false,true])eq(decide({...base,groupComplete,stopConfirmed,timedOut:true}),'timeout');
for(const wrong of [[['A',200],['B',200],['C',300]],[['A',100],['C',300],['B',200]],records.slice(0,2),[...records,['D',400]],[],[['A',100],['B',NaN],['C',300]]])eq(decide({...base,records:wrong}),'reject-identity');
const before=JSON.stringify(records);decide(base);eq(JSON.stringify(records),before,'no silent repair');
for(const key of ['groupComplete','stopConfirmed','timedOut']){assert.throws(()=>decide({...base,[key]:1}),RangeError);n++;}
const read=f=>fs.readFileSync(__dirname+'/'+f,'utf8'),hash=s=>crypto.createHash('sha256').update(s).digest('hex');const source=read('engineering-cases.js'),marker='\n// Original H503 injected-stop identity case; all twenty-six prior cases retained unchanged.\n';
eq(source.split(marker).length,2);eq(hash(source.split(marker)[0]),'3fa6046b7b3a1bb1a953bfe54ba93924f707f39a8b0f049a255becacf11017c1','all 26 prior cases byte-for-byte');
const c={window:{}};vm.runInNewContext(source,c);eq(c.window.SensorCases.length,28);eq(Object.keys(c.window.SensorCaseOverviews).length,28);const last=c.window.SensorCases.find(x=>x.id==='st-h503-injected-stop-identity');eq(last.id,'st-h503-injected-stop-identity');eq(last.verified,'2026-11-11');eq(last.publicationLabel,'所读版本发布');eq(last.blocks.length,7);
for(const term of ['> 10','JEOS','JADSTP','JDR1','0x1000','0x1001','0x1002','未做硬件复现','尚未执行','不模拟硅内部','不是完整初始化配置'])ok(JSON.stringify(last).includes(term),term);
for(const [f,h] of [['app.js', '25ca7128627c64c9cc6bb7f71c7de2a2ba91a02f3f51ce2d82470378c9c1be69'], ['style.css', 'ae22afcc302123fba024b368a60e63ca2eb05b38590056c7a6210692b7b2b25e'], ['models.js', '61aeeaa1ceface1d6eac26594e34e791503dec2b3d126e7514f98df20c0546e5'], ['content.js', 'b515149000b53e48a593c74df58a7a34d563b48f6c878c99a73ad615e9cdcf40'], ['mcu-timing.js', '75b49417d443c63eb78804e2689b29c2b3329fed617896bb89f547c91e431416']])eq(hash(read(f)),h,f+' untouched');
ok(read('index.html').includes('engineering-cases.js?v=20261114.1'));ok(read('README.md').includes('#case/'+last.id));
console.log(n+' H503 boundary, identity, timeout and preservation assertions passed; no hardware emulation.');
