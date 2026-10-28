/* Source/content/render regressions only. These tests do not run vendor software or hardware procedures. */
'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=__dirname;
let checks=0;
function ok(condition,label){assert.ok(condition,label);checks++;}
function equal(actual,expected,label){assert.deepEqual(actual,expected,label);checks++;}
const read=name=>fs.readFileSync(path.join(root,name),'utf8');
const index=read('index.html'),app=read('app.js'),css=read('style.css');
const dataCtx={window:{}};vm.createContext(dataCtx);vm.runInContext(read('engineering-cases.js'),dataCtx);
const cases=JSON.parse(JSON.stringify(dataCtx.window.SensorCases));
const lessons=['driver','adc','reference','error','calibration','debug'];
const routes=['home','path','sources','cases','timing',...lessons.map(id=>'lesson/'+id),...cases.map(c=>'case/'+c.id),'case/missing','unrecognized'];
equal(cases.map(c=>c.id),['ti-tipd120','adi-cn0359','st-an4073','st-adc-overrun','ti-ads1256-mux','st-dma2-gpio-contention','st-m7-adc-cache','st-center-aligned-trigger','adi-mux-order-memory','ti-ads131m04-time-identity','stm32f407-triple-simultaneous-identity','adi-sar-reference-burst','ti-f280015x-burst-sample-age','nordic-saadc-buffer-deadline'],'stable case deep links');
for(const c of cases){
 equal(c.status,'待学习',c.id+' pending');equal(c.reproduction,'未本站实物复现',c.id+' reproduction boundary');equal(c.verified,c.id==='nordic-saadc-buffer-deadline'?'2026-10-28':c.id==='ti-f280015x-burst-sample-age'?'2026-10-27':c.id==='adi-sar-reference-burst'?'2026-10-26':c.id==='stm32f407-triple-simultaneous-identity'?'2026-10-25':c.id==='ti-ads131m04-time-identity'?'2026-10-24':c.id==='adi-mux-order-memory'?'2026-10-23':c.id==='st-center-aligned-trigger'?'2026-10-22':c.id==='st-m7-adc-cache'?'2026-10-21':c.id==='st-dma2-gpio-contention'?'2026-10-20':c.id==='ti-ads1256-mux'?'2026-10-19':c.id==='st-adc-overrun'?'2026-10-18':'2026-10-17',c.id+' verification date');
 ok(/^\d{4}-\d{2}(-\d{2})?$/.test(c.published),c.id+' original publication date');
 ok(c.revision.length>15&&c.conditions.includes('版本'),c.id+' version/conditions');
 ok(c.evidence.includes('厂商')&&c.sources.length>0,c.id+' evidence category');
 ok(c.blocks.length===(['ti-ads1256-mux','st-dma2-gpio-contention','st-m7-adc-cache','st-center-aligned-trigger','adi-mux-order-memory','ti-ads131m04-time-identity','stm32f407-triple-simultaneous-identity','adi-sar-reference-burst','ti-f280015x-burst-sample-age','nordic-saadc-buffer-deadline'].includes(c.id)?7:c.id==='st-adc-overrun'?6:5),c.id+' full case structure');
 ok(c.blocks.some(b=>b.bullets?.length===4),c.id+' actionable unexecuted checklist');
 ok(c.blocks.some(b=>b.formula),c.id+' explicit calculation');
 ok(c.lessons.every(id=>lessons.includes(id)),c.id+' valid lesson references');
 equal(new Set(c.sources.map(s=>s.id)).size,c.sources.length,c.id+' unique source IDs');
 for(const source of c.sources){const url=new URL(source.url);ok(url.protocol==='https:'&&((url.hostname==='academy.nordicsemi.com'&&url.searchParams.get('nds_version_content')==='nrf-connect-sdk-intermediate-lesson-6-exercise-3-interfacing-with-adc-using-nrfx-drivers-and-timer-ppi-v3-2-0')||(url.hostname==='devzone.nordicsemi.com'&&url.pathname==='/cfs-file/__key/communityserver-discussions-components-files/4/nRF52840_5F00_PS_5F00_v1.8.pdf')||['www.ti.com','www.st.com','www.analog.com','community.st.com','community.arm.com','arm-software.github.io'].includes(url.hostname)||(url.hostname==='github.com'&&(url.pathname.startsWith('/STMicroelectronics/stm32f4xx-hal-driver/blob/1f6451c3e07728b4c830744de380e56bf5bc0026/')||url.pathname.startsWith('/NordicDeveloperAcademy/ncs-inter/blob/7f99e9d5858087e452df443586262727da4c4b04/')||url.pathname.startsWith('/TexasInstruments/c2000ware-core-sdk/blob/699b8c6aa190cf7430a36bdcf7f5b1ea2e928063/')))),c.id+' official HTTPS source');ok(source.date.length>10,c.id+' source date available or explicitly unavailable');}
 for(const b of c.blocks)for(const id of b.sourceIds||[])ok(c.sources.some(s=>s.id===id),c.id+' resolved claim citation');
 ok(c.blocks.find(b=>b.title==='待执行的台架验收清单').paragraphs.join('').includes('尚未执行'),c.id+' bench plan is unexecuted');
}
ok(index.indexOf('engineering-cases.js')>index.indexOf('content.js')&&index.indexOf('engineering-cases.js')<index.indexOf('app.js'),'data loads before renderer');
ok(index.includes('data-nav="cases"'),'top navigation includes cases');
ok(index.includes('20261028.2'),'cache bust');
ok(css.includes('.paused .hero-sweep,.paused .hero-sample{animation-play-state:paused}'),'animation pause rule preserved');
ok(app.includes("const KEY='sensor-engineering-lab:v1'"),'local progress storage namespace preserved');
ok(app.includes("Math.abs(n)<0.5*10**(-d)?0:Number(n)"),'zero display normalization preserved');
const saved={params:{adc:{resistance:47,acquisition:2,bits:12,previous:.2,sample:1}},done:{driver:true,adc:false,reference:true,error:false,calibration:false,debug:false},motion:false};
function render(route,publicationLabel){
 const elements=new Map(),events={},winEvents={},writes=[];
 function element(key){if(!elements.has(key))elements.set(key,{innerHTML:'',textContent:'',value:'',dataset:{},attrs:{},classList:{add(){},remove(){},toggle(){}},addEventListener(n,fn){events[key+':'+n]=fn;},setAttribute(k,v){this.attrs[k]=v;},removeAttribute(k){delete this.attrs[k];},focus(){},click(){}});return elements.get(key);}
 const nav=['home','path','cases','timing','sources'].map(id=>{const el=element('nav-'+id);el.dataset.nav=id;return el;});
 const query=key=>{
   if(['#motion-toggle','#hero-instrument','#complete'].includes(key)&&!element('#main').innerHTML.includes('id="'+key.slice(1)+'"'))return null;
   return element(key);
 };
 const ctx={console,Math,Number,JSON,Object,Array,String,Infinity,Blob,URL,setTimeout(){},clearTimeout(){},history:{scrollRestoration:'auto'},localStorage:{getItem(){return JSON.stringify(saved);},setItem(k,v){writes.push([k,JSON.parse(v)]);}},location:{hash:'#'+route},document:{querySelector:query,querySelectorAll(k){return k==='[data-nav]'?nav:[];},createElement:element,addEventListener(n,fn){events[n]=fn;}},window:{scrollY:0,addEventListener(n,fn){winEvents[n]=fn;},scrollTo(){}}};
 ctx.globalThis=ctx;vm.createContext(ctx);
 vm.runInContext(read('models.js'),ctx);ctx.window.SensorModels=ctx.SensorModels;
 for(const filename of ['content.js','engineering-cases.js','mcu-timing.js','app.js']){
   if(filename==='app.js'&&publicationLabel!==undefined)ctx.window.SensorCases.find(c=>c.id==='ti-f280015x-burst-sample-age').publicationLabel=publicationLabel;
   vm.runInContext(read(filename),ctx);
 }
 return {ctx,elements,events,winEvents,writes,nav,html:element('#main').innerHTML};
}
for(const route of routes){
 const r=render(route),html=r.html;
 ok(html.length>1000,route+' substantial rendering');
 ok(!/undefined|NaN/.test(html),route+' finite rendering');
 equal((html.match(/<h1\b/g)||[]).length,1,route+' single page heading');
 equal(r.writes.length,0,route+' reading does not write progress');
 const expectedNav=route==='timing'?'timing':route==='cases'||route.startsWith('case/')?'cases':route==='path'?'path':route==='sources'?'sources':'home';
 equal(r.nav.filter(n=>n.attrs['aria-current']==='page').map(n=>n.dataset.nav),[expectedNav],route+' accessible nav state');
 for(const href of Array.from(html.matchAll(/href="(#[^"]+)"/g),m=>m[1].slice(1)))ok(routes.includes(href),route+' resolves '+href);
 r.winEvents.pagehide();
 equal(r.writes[0][1].done,saved.done,route+' persisted lesson states unchanged');
 equal(r.writes[0][1].params.adc,saved.params.adc,route+' saved ADC parameters unchanged');
 equal(r.writes[0][1].motion,false,route+' paused preference unchanged');
 equal(Object.keys(r.writes[0][1].done).sort(),lessons.slice().sort(),route+' no implicit new case completion');
 if(route==='cases')equal((html.match(/aria-label="问题与方法速览"/g)||[]).length,14,'all fourteen cards explain problem and method');
 if(route.startsWith('case/')&&route!=='case/missing'){
   ok(html.includes(route==='case/nordic-saadc-buffer-deadline'?'所读教程发布':route==='case/ti-f280015x-burst-sample-age'?'所读版本发布':'原始发布'),route+' honest publication metadata');
   const intro=dataCtx.window.SensorCaseOverviews[route.slice(5)];
   for(const field of ['problem','method','boundary','takeaway'])ok(html.includes(intro[field]),route+' overview '+field);
   ok(html.indexOf('先看懂大意')<html.indexOf('硬件与软件条件'),route+' introduction comes before technical setup');
   ok(html.includes('待学习')&&html.includes('未本站实物复现'),route+' explicit pending status');
   ok(!r.events['#motion-toggle:click'],route+' no home binding');
   ok(html.includes('待执行的台架验收清单'),route+' verification plan');
   for(const source of cases.find(c=>'case/'+c.id===route).sources)ok(html.includes(source.url),route+' source is rendered');
 }
 if(route.startsWith('lesson/'))ok(r.elements.get('#plot').innerHTML.includes('<svg'),route+' original interactive model');
}
ok(render('case/adi-cn0359').html.includes('&lt;0.1%'),'measurement inequality escaped safely');
ok(render('case/st-an4073').html.includes('众数'),'dispersion does not become accuracy');
ok(render('case/ti-tipd120').html.includes('精密电阻'),'resistor test not presented as temperature chamber');
// Verify the displayed theoretical conversions independently, not as reproduced measurements.
ok(Math.abs(.00415/.39083-.0106)<.00003,'RTD local-sensitivity conversion');
ok(Math.abs(.001**2*100*1000-.1)<1e-12,'RTD electrical power in mW');
equal(2*.2,.4,'illustrative temperature error in percent');
ok(Math.abs(4/2.4-1.667)<.001,'4-acquisition lower bound in microseconds');
const recovery=cases.find(c=>c.id==='st-adc-overrun'),text=JSON.stringify(recovery);
for(const phrase of ['RM0090 Rev 22','EXTSEL = 0011','EOCS = 0','DMA2 Stream0 / Channel0','TE / DME / FE','generation','EN = 0','3 μs','rc_w0','SMP[2:0] = 010','SWSTART','旧消费者退出','BSD-3-Clause','第三方实测','未编译、运行或烧录'])ok(text.includes(phrase),'recovery boundary '+phrase);
for(const source of recovery.sources)if(source.url.includes('github.com'))ok(!source.url.includes('/master/')&&!source.url.includes('/main/'),'HAL links immutable');
ok(Math.abs(28/21-1.333)<.001,'scan acquisition budget');
ok(Math.abs(40/21-1.905)<.001,'per-result DMA service budget');
ok(Math.abs(3*40/21-5.714)<.001,'three-rank conversion budget');
equal(3*2*10000,60000,'60 kB/s is average data rate');
equal(384/2/3,64,'half buffer holds whole frames');
equal(64*100/1000,6.4,'half-buffer completion interval in milliseconds');
equal([Math.floor((384-185)/3),(384-185)%3],[66,1],'199 moved words are 66 complete frames plus a residual');
ok(render('sources').html.includes('链接核验 2026-10-18'),'new case source date rendered without retagging old sources');
const escapedLabel=render('case/ti-f280015x-burst-sample-age','<label>&').html;
ok(escapedLabel.includes('&lt;label&gt;&amp;'),'optional publication label escaped');
ok(!escapedLabel.includes('<label>'),'optional label cannot inject markup');
console.log(`${checks} engineering-case content, deep-link, rendering and progress checks passed.`);

