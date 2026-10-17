/* Sensor Engineering Lab — pure, deterministic teaching models. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.SensorModels = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  function rng(seed) { let a = seed >>> 0; return () => { a += 0x6D2B79F5; let t = a; t = Math.imul(t ^ t >>> 15, t | 1); t ^= t + Math.imul(t ^ t >>> 7, t | 61); return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  function normal(random) { return Math.sqrt(-2 * Math.log(Math.max(1e-12, random()))) * Math.cos(2 * Math.PI * random()); }
  function stats(values) { const n = values.length; const mean = values.reduce((a,b)=>a+b,0)/n; const sd = n > 1 ? Math.sqrt(values.reduce((a,b)=>a+(b-mean)**2,0)/(n-1)) : 0; return { n, mean, sd, rmse: Math.sqrt(values.reduce((a,b)=>a+b*b,0)/n), maxAbs: Math.max(...values.map(Math.abs)) }; }
  function adc(p) {
    const vin = 2.8, vref = 3.3, switchKOhm = 1, capacitancePF = 10;
    const tauUS = (p.resistance + switchKOhm) * capacitancePF * 0.001;
    const lsb = vref / (2 ** p.bits), tolerance = lsb / 2;
    const initial = vin + (p.previous-vin)*Math.exp(-(p.sample-1)*p.acquisition/tauUS);
    const voltage = vin + (initial-vin)*Math.exp(-p.acquisition/tauUS);
    const residual = Math.abs(voltage-vin);
    const step = Math.abs(p.previous-vin);
    const requiredUS = step > tolerance ? tauUS * Math.log(step/tolerance) : 0;
    return {vin,vref,switchKOhm,capacitancePF,tauUS,lsb,tolerance,initial,voltage,residual,lsbError:residual/lsb,requiredUS,within:residual<=tolerance};
  }
  function rawValue(x,p,random) { const u=x/100; return x+p.offset+p.gain*u+(p.bow||0)*4*u*(1-u)+p.noise*normal(random); }
  function measurement(p) { const random=rng(p.seed); const readings=Array.from({length:32},()=>rawValue(p.reference,p,random)); const errors=readings.map(v=>v-p.reference); return {readings,errors,summary:stats(readings),error:stats(errors),expectedError:p.offset+p.gain*p.reference/100}; }
  function calibration(p) {
    const random=rng(p.seed); const levels=[0,10,25,50,75,90,100];
    const groups=levels.map(x=>({x,kind:x===0||x===100?'training':'validation',raw:Array.from({length:16},()=>rawValue(x,p,random))}));
    const intercept=stats(groups[0].raw).mean;
    const slope=(stats(groups[groups.length-1].raw).mean-intercept)/100;
    groups.forEach(g=>{g.corrected=g.raw.map(y=>(y-intercept)/slope);g.rawMean=stats(g.raw).mean;g.correctedMean=stats(g.corrected).mean;g.before=g.rawMean-g.x;g.after=g.correctedMean-g.x;});
    const validation=groups.filter(g=>g.kind==='validation');
    return {groups,validation,intercept,slope,before:stats(validation.map(g=>g.before)),after:stats(validation.map(g=>g.after)),single:stats(validation.flatMap(g=>g.corrected.map(y=>y-g.x)))};
  }
  function driverModel(p){const loading=p.load/(p.load+p.resistance),fc=100,ratio=p.frequency/fc,atten=1/Math.sqrt(1+ratio*ratio),phase=-Math.atan(ratio),amp=p.amplitude*loading*10*atten,headroom=1.45;return {loading,fc,atten,phase,amp,headroom,slew:2*Math.PI*p.frequency*amp/1000};}
  function referenceModel(p){const dc=3.3*(1+p.offset/100),points=Array.from({length:121},(_,i)=>{const t=i/120,vref=dc+p.ripple/1000*Math.sin(2*Math.PI*t),signal=(p.mode==='ratio'?vref:3.3)*p.reference/100;return{t,vref,signal,read:100*signal/vref,error:100*signal/vref-p.reference};});return{dc,points,summary:stats(points.slice(0,-1).map(q=>q.error)),pp:Math.max(...points.map(q=>q.error))-Math.min(...points.map(q=>q.error))};}
  const defaults={adc:{resistance:47,acquisition:2,previous:0.2,bits:12,sample:1},error:{offset:1.5,gain:0,noise:0.15,reference:50,seed:42},calibration:{offset:2,gain:3,bow:0,noise:0.12,seed:42}};
  const limits={adc:{resistance:[1,100],acquisition:[0.1,10],previous:[0,3.3],bits:[8,16],sample:[1,4]},error:{offset:[-3,3],gain:[-3,3],noise:[0,1],reference:[0,100],seed:[1,1000000]},calibration:{offset:[-3,3],gain:[-5,5],bow:[0,3],noise:[0,0.5],seed:[1,1000000]}};
  function sanitize(key,input) { const out={...defaults[key]}; Object.keys(out).forEach(k=>{const v=Number(input?.[k]);if(Number.isFinite(v)&&input?.[k]!==null&&input?.[k]!==undefined) out[k]=Math.min(limits[key][k][1],Math.max(limits[key][k][0],v));}); if(key==='adc'){out.bits=[8,10,12,16].includes(out.bits)?out.bits:12;out.sample=Math.round(out.sample);}else out.seed=Math.round(out.seed);return out; }
  return Object.freeze({driver:driverModel,reference:referenceModel,rng,normal,stats,adc,measurement,calibration,defaults,limits,sanitize});
});
