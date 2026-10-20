/* Editorial overview regressions. No board or hardware test is performed. */
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const read=n=>fs.readFileSync(__dirname+'/'+n,'utf8'),c={window:{}};vm.runInNewContext(read('engineering-cases.js'),c);
const cases=c.window.SensorCases,overviews=c.window.SensorCaseOverviews;let n=0;
const ok=(v,m)=>{assert.ok(v,m);n++;};
assert.deepEqual(Object.keys(overviews),Array.from(cases,x=>x.id));n++;
for(const item of cases){const o=overviews[item.id];for(const field of ['problem','method','boundary','takeaway']){ok(typeof o[field]==='string'&&o[field].length>=20,item.id+' useful '+field);ok(o[field].length<150,item.id+' concise '+field);ok(!/[<>]|https?:|chatgpt|riververse|[\w.+-]+@[\w.-]+\.[a-z]/i.test(o[field]),item.id+' clean public prose');}ok(/未|没有|还需|不是板测/.test(o.boundary),item.id+' explicit verification limit');}
ok(overviews['st-adc-overrun'].boundary.includes('没有板卡实测'),'recovery is not falsely solved');
ok(overviews['ti-ads1256-mux'].boundary.includes('目标不满足'),'failed timing target preserved');
ok(overviews['st-dma2-gpio-contention'].boundary.includes('尚未板测'),'candidate remains unverified');
ok(overviews['st-an4073'].boundary.includes('不等于绝对电压误差变小'),'dispersion not accuracy');
ok(read('style.css').includes('@media(max-width:600px){.case-overview'),'stack overview on narrow screens');
ok(!read('style.css').includes('var(--text)'),'only established palette tokens');
console.log(`${n} plain-language overview and evidence-boundary checks passed.`);
