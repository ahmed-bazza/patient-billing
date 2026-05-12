'use client';

import { useMemo, useState } from 'react';

type ServiceId = '0303A'|'0303CV'|'0304A'|'0819G'|'0305O'|'0305I'|'0304K'|'0304M'|'0304B'|'0304I'|'0301NM'|'0301NG'|'0301LJ'|'0301O'|'0308CV'|'1399BA'|'1399BE'|'9812L'|'9812A'|'0338C';
type Criteria = {cmgp:boolean;completeHistory:boolean;completePhysical:boolean};
type Entry = {
  id:number; time:string; chart:string; age:number; age75:boolean; dx:string; icd:string;
  serviceId:ServiceId; service:string; codes:string; modifiers:string; mins:number; fee:number; note:string; status:string;
  direct:number; charting:number; review:number; coord:number; excluded:number; criteria:Criteria;
};

const money = (n:number)=>'$'+n.toFixed(2);
const hm = (m:number)=>`${Math.floor(m/60)}h ${m%60}m`;
const times = [10,15,20,25,30,35,40,45];

const services: Record<ServiceId,{code:string; label:string; short:string; group:'common'|'more'}> = {
  '0303A': {code:'03.03A',label:'Office visit',short:'Limited assessment',group:'common'},
  '0303CV': {code:'03.03CV',label:'Virtual visit',short:'Phone/video 10+ min',group:'common'},
  '0304A': {code:'03.04A',label:'Comprehensive',short:'Complete Hx + PE',group:'common'},
  '0819G': {code:'08.19G',label:'Psychotherapy',short:'Psychiatric treatment',group:'common'},
  '0305O': {code:'03.05O',label:'Chronic pain',short:'Direct pain service',group:'common'},
  '0305I': {code:'03.05I',label:'Palliative care',short:'Direct palliation',group:'common'},
  '0304K': {code:'03.04K',label:'Geriatric assessment',short:'90+ min CGA',group:'common'},
  '0304M': {code:'03.04M',label:'Pre-op H&P',short:'Preoperative assessment',group:'common'},
  '1399BA': {code:'13.99BA',label:'Pap smear',short:'Speculum Pap',group:'common'},
  '9812L': {code:'98.12L',label:'Wart cryotherapy',short:'LN2, once/encounter',group:'common'},
  '0304B': {code:'03.04B',label:'Initial prenatal',short:'First prenatal exam',group:'more'},
  '0304I': {code:'03.04I',label:'Addiction admission',short:'Residential form visit',group:'more'},
  '0301NM': {code:'03.01NM',label:'Pharmacist contact',short:'Pharmacist-initiated',group:'more'},
  '0301NG': {code:'03.01NG/NH/NI',label:'Facility/NP contact',short:'Eligible advice',group:'more'},
  '0301LJ': {code:'03.01LJ/LK/LL',label:'Physician consult call',short:'Consultant advice',group:'more'},
  '0301O': {code:'03.01O',label:'Secure e-consult',short:'Consultant e-consult',group:'more'},
  '0308CV': {code:'03.08CV',label:'Virtual consult',short:'Comprehensive consult',group:'more'},
  '1399BE': {code:'13.99BE',label:'Speculum swab',short:'Speculum sample/swab',group:'more'},
  '9812A': {code:'98.12A',label:'Skin biopsy',short:'Non-face biopsy',group:'more'},
  '0338C': {code:'03.38C',label:'Spirometry',short:'Office spirometry',group:'more'}
};

const diagnoses: [string,string][] = [
 ['Hypertension','401'],['Diabetes mellitus','250'],['Depression','311'],['Anxiety disorder','300'],['ADHD','314'],['Insomnia','780'],['Chronic pain','338'],['Low back pain','724'],['Neck pain','723'],['Osteoarthritis','715'],
 ['Osteoporosis','733'],['COPD','496'],['Asthma','493'],['Acute bronchitis','466'],['Pneumonia','486'],['COVID/viral respiratory illness','079'],['Influenza-like illness','487'],['Sinusitis','461'],['Pharyngitis','462'],['Otitis media','382'],
 ['Otitis externa','380'],['Allergic rhinitis','477'],['UTI','599'],['Pyelonephritis','590'],['STI screening','V74'],['Vaginitis','616'],['Pelvic pain','625'],['Dysmenorrhea','625'],['Menorrhagia','626'],['Contraception','V25'],
 ['Pap/cervical screening','V76'],['Pregnancy','V22'],['Initial prenatal care','V22'],['Postpartum care','V24'],['Menopause','627'],['Erectile dysfunction','607'],['BPH/LUTS','600'],['GERD','530'],['Abdominal pain','789'],['Constipation','564'],
 ['Diarrhea/gastroenteritis','558'],['Nausea/vomiting','787'],['Hemorrhoids','455'],['Migraine','346'],['Headache','784'],['Dizziness/vertigo','780'],['Syncope','780'],['Fatigue','780'],['Sleep apnea','780'],['Dermatitis/eczema','692'],
 ['Urticaria','708'],['Acne','706'],['Wart','078'],['Skin lesion','709'],['Cellulitis','682'],['Abscess','682'],['Laceration/wound','879'],['Burn','949'],['Back strain','847'],['Shoulder pain','719'],
 ['Knee pain','719'],['Hip pain','719'],['Tendonitis/bursitis','726'],['Carpal tunnel','354'],['Gout','274'],['Rheumatoid arthritis','714'],['Fibromyalgia','729'],['Hypothyroidism','244'],['Hyperthyroidism','242'],['Hyperlipidemia','272'],
 ['Obesity','278'],['Smoking/tobacco use','305'],['Alcohol dependence','303'],['Opioid dependence','304'],['Substance use disorder','305'],['Medication review','V58'],['Anemia','285'],['Iron deficiency','280'],['B12 deficiency','281'],['Vitamin D deficiency','268'],
 ['CKD','585'],['CHF','428'],['Coronary artery disease','414'],['Atrial fibrillation','427'],['Chest pain','786'],['Palpitations','785'],['Edema','782'],['Dementia','294'],['Cognitive impairment','294'],['Frailty','797'],
 ['Falls risk','V15'],['Palliative care','V66'],['Cancer history/follow-up','V10'],['Breast lump','611'],['Diabetic foot/neuropathy','357'],['Peripheral neuropathy','356'],['Eye complaint','379'],['Conjunctivitis','372'],['Pre-op exam','V72'],['Work/disability form visit','V68']
];

function psychUnits(min:number){ if(min<8) return 0; return Math.floor((min+7)/15); }
function m15Portion(min:number){ return min>0 ? Math.ceil(min/15) : 0; }
function cmgpUnits(min:number){ if(min<15) return 0; return Math.min(10,1+Math.floor((min-15)/10)); }

function calculate(input:{service:ServiceId;age75:boolean;direct:number;charting:number;review:number;coord:number;excluded:number;criteria:Criteria}){
 const eligible = Math.max(0,input.direct+input.charting+input.review+input.coord-input.excluded);
 const s = services[input.service];
 let fee=0; let codes:string[]=[]; let mods:string[]=[]; let status='Eligible if criteria documented'; let warnings:string[]=[]; let suggestions:string[]=[]; let template='';
 const ageFactor = input.age75 ? 1.2 : 1;
 const add = (code:string, amount:number)=>{ codes.push(code); fee+=amount; };
 switch(input.service){
  case '0303A': {
    const base = +(40.23*ageFactor).toFixed(2); add('03.03A',base); if(input.age75) mods.push('G75GP');
    if(input.criteria.cmgp){ const u=cmgpUnits(eligible); if(u>0){ const cm=`CMGP${String(u).padStart(2,'0')}`; add(cm,19.54*u); mods.push(cm);} else suggestions.push(`${Math.max(0,15-eligible)} more eligible documented minute(s) may support CMGP01 if clinically necessary and CMGP criteria are truly met.`); }
    if(!input.criteria.cmgp && eligible>=15) suggestions.push('If this was a complex GP visit meeting CMGP criteria, select CMGP to capture eligible complexity time.');
    if(input.age75) suggestions.push('Age 75+ applied: 03.03A base increased to 120%.');
    template = `Limited assessment. Eligible physician patient-care time ${eligible} min (${input.direct} direct, ${input.charting} charting, ${input.review} review, ${input.coord} coordination; excluded ${input.excluded}). History/exam/advice provided as clinically indicated. Diagnosis/issue addressed and plan reviewed. ${input.age75?'Patient age 75+; G75GP applied where eligible. ':''}${input.criteria.cmgp?'Complex GP criteria met and documented; time excludes procedure/staff/uninsured time.':''}`;
    break; }
  case '0303CV': add('03.03CV',40.23); if(input.direct<10){ status='Not eligible'; warnings.push('03.03CV requires at least 10 minutes direct virtual communication; consider 03.01AD if criteria met.'); } template=`Virtual care assessment. Direct physician-patient communication ${input.direct} min with start/stop time documented. Patient location/insured context confirmed where applicable. Assessment, advice, and management plan provided.`; break;
  case '0304A': add('03.04A',110.64); if(input.direct+input.charting>=30){ add('CMXC30',31.59); mods.push('CMXC30'); } else suggestions.push(`${Math.max(0,30-(input.direct+input.charting))} more eligible minute(s) may support CMXC30 only if a true 30-minute comprehensive service is clinically required.`); if(!input.criteria.completeHistory||!input.criteria.completePhysical) warnings.push('Requires complete history and complete physical; not a routine uninsured physical.'); template=`Comprehensive assessment. Complete history and complete physical performed and documented. Total eligible time ${eligible} min. Problems assessed, relevant positives/negatives documented, and management plan reviewed. ${input.direct+input.charting>=30?'30-minute modifier criteria met where applicable.':''}`; break;
  case '0819G': { const u=psychUnits(input.direct); if(u===0){status='Not eligible';warnings.push('08.19G requires at least 8 minutes direct psychiatric treatment/psychotherapy.');} if(u>0){ add('08.19G',50.28*u); codes.push(`${u} unit(s)`); } const next = 8+15*u; if(input.direct<next) suggestions.push(`${next-input.direct} more direct psychotherapy minute(s) may reach next 08.19G unit if clinically necessary.`); template=`Psychiatric treatment/psychotherapy provided for established/suspected psychiatric disorder. Direct treatment time ${input.direct} min; charting/admin time excluded from billed psychotherapy units. Therapeutic focus, response, risk/safety considerations, and follow-up plan documented.`; break; }
  case '0305O': { const u=m15Portion(input.direct); add('03.05O',50.28*u); codes.push(`${u} unit(s)`); template=`Chronic pain direct management/reassessment/education/counselling. Direct eligible time ${input.direct} min. Chronic pain diagnosis/context documented, functional goals reviewed, treatment/safety plan discussed. Interdisciplinary program criteria/program name documented where required.`; break; }
  case '0305I': { const u=m15Portion(input.direct); add('03.05I',54.97*u); codes.push(`${u} unit(s)`); template=`Palliative care direct management/counselling. Direct eligible time ${input.direct} min. Goals of care, symptom burden, medication/safety plan, supports, and follow-up documented.`; break; }
  case '0304K': if(input.direct<90){status='Not eligible'; warnings.push('03.04K requires first full 90 minutes.');} add('03.04K',331.86); if(input.direct>90){ const extra=Math.min(7,psychUnits(input.direct-90)); if(extra>0) add(`03.04K extra x${extra}`,54.29*extra);} template='Comprehensive geriatric assessment with required team/program context, age criteria, full assessment domains, risks, function, medications, cognition/mood, supports, and care plan documented.'; break;
  case '0304M': add('03.04M',110.62); if(input.direct+input.charting>=30){add('CMXC30',31.59);mods.push('CMXC30');} template='Pre-operative history and physical completed for requested surgery/procedure. Relevant systems, medications, allergies, risks, exam findings, investigations, and recommendations documented.'; break;
  case '0304B': add('03.04B',110.62); if(input.direct+input.charting>=30){add('CMXC30',31.59);mods.push('CMXC30');} template='Initial prenatal assessment with obstetric history, risk review, exam as appropriate, counselling, investigations, and follow-up plan documented. Once-per-pregnancy/interval rules considered.'; break;
  case '0304I': add('03.04I',130.73); template='Addiction residential treatment admission form visit. Required admission assessment/form completed with substance history, comorbidity, medications, safety/risk, and plan documented.'; break;
  case '0301NM': add('03.01NM',18.44); template='Pharmacist-initiated physician advice/communication. Pharmacist request, medication issue, advice provided, and documentation completed. Not simple prescription clarification/repeat authorization.'; break;
  case '0301NG': add('03.01NG/NH/NI',18.44); template='Eligible facility/home-care/LTC/NP/midwife/public-health/paramedic initiated communication. Caller, reason, advice/decision, and follow-up documented.'; break;
  case '0301LJ': add('03.01LJ/LK/LL',78.12); template='Physician-to-physician phone/video consultation as consultant. Requesting provider, clinical question, advice/recommendations, and documentation of communication recorded.'; break;
  case '0301O': add('03.01O',68.99); template='Secure e-consultation as consultant. Referral question reviewed, written opinion/recommendations provided, and documentation retained.'; break;
  case '0308CV': add('03.08CV',131.40); template='Virtual comprehensive consultation. Referral/request documented, start-stop/direct communication time recorded, assessment completed, written opinion/recommendations returned to referrer.'; break;
  case '1399BA': add('13.99BA',30.17); template='Pap smear performed with speculum exam. Indication/screening context, consent, sample obtained, patient advised regarding results/follow-up.'; break;
  case '1399BE': add('13.99BE',30.17); template='Speculum-assisted swab/sample obtained. Indication, consent, specimen type/site, and follow-up/results plan documented.'; break;
  case '9812L': add('98.12L',13.84); template='Wart/keratosis cryotherapy performed. Site(s), indication, consent, treatment with liquid nitrogen, tolerance, aftercare and follow-up advice documented.'; break;
  case '9812A': add('98.12A',38.00); template='Skin biopsy performed. Lesion/site, indication, consent, technique, specimen/labelling, hemostasis, aftercare, and follow-up plan documented. Verify current rate before submission.'; break;
  case '0338C': add('03.38C',33.30); template='Office spirometry performed/interpreted. Indication, patient effort/quality, key values where available, interpretation, and management plan documented. Verify current rate before submission.'; break;
 }
 return {eligible,fee:+fee.toFixed(2),codes,mods,status,warnings,suggestions,template,service:s};
}

const initialCriteria:Criteria = {cmgp:true,completeHistory:true,completePhysical:true};

export default function Page(){
 const [service,setService]=useState<ServiceId>('0303A');
 const [age75,setAge75]=useState(false);
 const [age,setAge]=useState(45);
 const [direct,setDirect]=useState(10);
 const [charting,setCharting]=useState(0);
 const [review,setReview]=useState(0);
 const [coord,setCoord]=useState(0);
 const [excluded,setExcluded]=useState(0);
 const [chart,setChart]=useState('');
 const [dx,setDx]=useState('Hypertension');
 const [icd,setIcd]=useState('401');
 const [dxSearch,setDxSearch]=useState('');
 const [criteria,setCriteria]=useState<Criteria>(initialCriteria);
 const [entries,setEntries]=useState<Entry[]>([]);
 const [editingId,setEditingId]=useState<number|null>(null);
 const r = useMemo(()=>calculate({service,age75,direct,charting,review,coord,excluded,criteria}),[service,age75,direct,charting,review,coord,excluded,criteria]);
 const totalPatients=entries.length,totalTime=entries.reduce((a,e)=>a+e.mins,0),totalFee=entries.reduce((a,e)=>a+e.fee,0);
 const common=(Object.keys(services) as ServiceId[]).filter(k=>services[k].group==='common');
 const more=(Object.keys(services) as ServiceId[]).filter(k=>services[k].group==='more');
 const normalizedSearch=dxSearch.trim().toLowerCase();
 const filteredDiagnoses = normalizedSearch.length>=2 ? diagnoses.filter(([d,i])=>d.toLowerCase().startsWith(normalizedSearch)||d.toLowerCase().includes(normalizedSearch)||i.startsWith(normalizedSearch)) : diagnoses;
 function chooseDx(d:string,i:string){setDx(d);setIcd(i);}
 function resetInputs(){ setService('0303A'); setAge75(false); setAge(45); setDirect(10); setCharting(0); setReview(0); setCoord(0); setExcluded(0); setChart(''); setDx('Hypertension'); setIcd('401'); setDxSearch(''); setCriteria(initialCriteria); setEditingId(null); }
 function currentEntry(id:number):Entry{ return {id,time:new Date().toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'}),chart,age:age75?80:age,age75,dx,icd,serviceId:service,service:r.service.code,codes:r.codes.join(' + '),modifiers:r.mods.join(', '),mins:r.eligible,fee:r.fee,note:r.template,status:r.status,direct,charting,review,coord,excluded,criteria:{...criteria}}; }
 function addOrUpdateEntry(){
  if(editingId){ setEntries(entries.map(e=>e.id===editingId?currentEntry(editingId):e)); setEditingId(null); }
  else { setEntries([currentEntry(Date.now()),...entries]); }
  setChart('');
 }
 function editEntry(e:Entry){ setEditingId(e.id); setService(e.serviceId); setAge75(e.age75); setAge(e.age); setDx(e.dx); setIcd(e.icd); setChart(e.chart); setDirect(e.direct); setCharting(e.charting); setReview(e.review); setCoord(e.coord); setExcluded(e.excluded); setCriteria(e.criteria); window.scrollTo({top:0,behavior:'smooth'}); }
 function deleteEntry(id:number){ setEntries(entries.filter(e=>e.id!==id)); if(editingId===id) setEditingId(null); }
 function csv(){ const rows=[['Date/Time','EMR Chart #','Age','Diagnosis','ICD-9','Service','Billing code(s)','Modifiers','Eligible minutes','Fee','Status','Charting template'],...entries.map(e=>[e.time,e.chart,e.age,e.dx,e.icd,e.service,e.codes,e.modifiers,e.mins,money(e.fee),e.status,e.note])]; const text=rows.map(r=>r.map(v=>`"${String(v).replaceAll('"','""')}"`).join(',')).join('\n'); const blob=new Blob([text],{type:'text/csv'}); const url=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download='moa-billing-sheet.csv'; a.click(); URL.revokeObjectURL(url); }
 return <main className="wrap">
  <section className="topDashboard">
    <div className="dashHeader"><div><div className="eyebrow">MOA day sheet live</div><h2>What has been added today</h2></div><button className="primary" onClick={addOrUpdateEntry}>{editingId?'Update patient':' + Add current patient'}</button></div>
    <div className="megaStats">
      <div className="megaStat"><span>Patients</span><b>{totalPatients}</b></div>
      <div className="megaStat"><span>Total time</span><b>{hm(totalTime)}</b></div>
      <div className="megaStat moneyStat"><span>Estimated payment</span><b>{money(totalFee)}</b></div>
      <div className="megaStat"><span>Average / patient</span><b>{totalPatients?money(totalFee/totalPatients):'$0.00'}</b></div>
    </div>
    <div className="recentStrip"><div className="recentTitle">Latest added</div>{entries.length===0?<div className="emptyRecent">No patients added yet. Add current patient and totals update immediately.</div>:entries.slice(0,4).map(e=><div className="recentItem" key={e.id}><b>{e.chart||'No chart #'} · {e.dx}</b><span>{e.codes}{e.modifiers?` · ${e.modifiers}`:''}</span><strong>{money(e.fee)}</strong></div>)}</div>
  </section>
  <div className="hero"><div><div className="eyebrow">Alberta Family Medicine</div><h1>Click-first billing assistant</h1><div className="sub">Ten common billing services, one-click time, one-click age, diagnosis search/ICD-9, defensible charting prompts, edit/delete day-sheet entries, and MOA totals at the top with full output table at the bottom.</div></div><div className="pill">v11 edit/delete + diagnosis search</div></div>
  <div className="grid">
   <section className="card">
    <div className="sectionTitle"><h2>1. Pick one of the 10 common billing services</h2><span className="pill">two rows / one click</span></div>
    <div className="btnGrid">{common.map(k=><button key={k} className={'btn '+(service===k?'active':'')} onClick={()=>setService(k)}><div className="code">{services[k].code}</div><div className="label">{services[k].label}</div><div className="label">{services[k].short}</div></button>)}</div>
    <div className="sectionTitle" style={{marginTop:18}}><h2>2. One-click age</h2><span className="pill">G75GP logic</span></div>
    <div className="ageGrid"><button className={'ageBtn '+(!age75?'active':'')} onClick={()=>{setAge75(false);setAge(45)}}>&lt; 75 years</button><button className={'ageBtn '+(age75?'active':'')} onClick={()=>{setAge75(true);setAge(80)}}>75+ years</button></div>
    <div className="sectionTitle" style={{marginTop:18}}><h2>3. One-click time</h2><span className="pill">10 to 45 min</span></div>
    <div className="timeGrid">{times.map(t=><button key={t} className={'timeBtn '+(direct===t?'active':'')} onClick={()=>setDirect(t)}>{t} min</button>)}</div>
    <div className="formRows">
      <div className="field"><label>Direct patient time</label><input type="number" value={direct} onChange={e=>setDirect(+e.target.value||0)}/></div>
      <div className="field"><label>EMR chart #</label><input value={chart} onChange={e=>setChart(e.target.value)} placeholder="optional"/></div>
      <div className="field"><label>Same-day charting min</label><input type="number" value={charting} onChange={e=>setCharting(+e.target.value||0)}/></div>
      <div className="field"><label>Review/results min</label><input type="number" value={review} onChange={e=>setReview(+e.target.value||0)}/></div>
      <div className="field"><label>Coordination/referral min</label><input type="number" value={coord} onChange={e=>setCoord(+e.target.value||0)}/></div>
      <div className="field"><label>Excluded/procedure min</label><input type="number" value={excluded} onChange={e=>setExcluded(+e.target.value||0)}/></div>
    </div>
    <div className="switches"><button className={'switch '+(criteria.cmgp?'on':'')} onClick={()=>setCriteria({...criteria,cmgp:!criteria.cmgp})}>CMGP criteria</button><button className={'switch '+(criteria.completeHistory?'on':'')} onClick={()=>setCriteria({...criteria,completeHistory:!criteria.completeHistory})}>Complete history</button><button className={'switch '+(criteria.completePhysical?'on':'')} onClick={()=>setCriteria({...criteria,completePhysical:!criteria.completePhysical})}>Complete physical</button></div>
    <div className="sectionTitle" style={{marginTop:18}}><h2>4. Diagnosis / ICD-9</h2><span className="pill">type 2 letters or click</span></div>
    <div className="formRows"><div className="field"><label>Search diagnosis</label><input value={dxSearch} onChange={e=>setDxSearch(e.target.value)} placeholder="e.g., os = osteoporosis"/></div><div className="field"><label>Diagnosis</label><input value={dx} onChange={e=>setDx(e.target.value)}/></div><div className="field"><label>ICD-9</label><input value={icd} onChange={e=>setIcd(e.target.value)}/></div></div>
    <div className="dxGrid" style={{marginTop:10}}>{filteredDiagnoses.map(([d,i])=><button key={d} className="dxBtn" onClick={()=>chooseDx(d,i)}><strong>{d}</strong><span>{i}</span></button>)}</div>
    <details style={{marginTop:14}}><summary className="secondary" style={{display:'inline-block'}}>Other billing codes if not in top 10</summary><div className="btnGrid" style={{marginTop:12}}>{more.map(k=><button key={k} className={'btn '+(service===k?'active':'')} onClick={()=>setService(k)}><div className="code">{services[k].code}</div><div className="label">{services[k].label}</div><div className="label">{services[k].short}</div></button>)}</div></details>
   </section>
   <section>
    <div className="summaryCard"><div className="small" style={{color:'rgba(255,255,255,.78)',fontWeight:800}}>CURRENT CLAIM ESTIMATE</div><div className="fee">{money(r.fee)}</div><div>{r.service.code} - {r.service.label}</div><div className="codes">{r.codes.map(c=><span className="codeChip" key={c}>{c}</span>)}{r.mods.map(m=><span className="codeChip" key={m}>{m}</span>)}</div><div className="summaryMeta" style={{marginTop:14}}><div><b>{hm(r.eligible)}</b><span>eligible time</span></div><div><b>{age75?'75+':'<75'}</b><span>age group</span></div><div><b>{icd}</b><span>ICD-9</span></div></div></div>
    {r.warnings.map(w=><div className="notice warn" key={w}>{w}</div>)}{r.suggestions.map(s=><div className="notice ok" key={s}>{s}</div>)}
    <div className="card" style={{marginTop:14}}><div className="sectionTitle"><h2>Defensible charting prompt</h2><button className="secondary" onClick={()=>navigator.clipboard?.writeText(`Dx: ${dx} (ICD-9 ${icd})\n${r.template}`)}>Copy</button></div><div className="mutedBox template">Dx: {dx} (ICD-9 {icd}){`\n`}{r.template}</div><div className="actions"><button className="primary" onClick={addOrUpdateEntry}>{editingId?'Update MOA row':'Add to MOA sheet'}</button>{editingId&&<button className="secondary" onClick={()=>setEditingId(null)}>Cancel edit</button>}<button className="secondary" onClick={resetInputs}>Clear input</button><button className="secondary" onClick={csv}>Export CSV</button><button className="secondary" onClick={()=>setEntries([])}>Clear day</button></div></div>
   </section>
  </div>
  <section className="card full" style={{marginTop:16}}>
    <div className="sectionTitle"><div><h2>MOA output table</h2><div className="small">Full billing output for submission/review. Use Edit to reload a row into the input panel, or Delete to remove it from totals.</div></div><div className="actions" style={{marginTop:0}}><button className="secondary" onClick={csv}>Export MOA CSV</button><button className="secondary" onClick={()=>setEntries([])}>Clear day</button></div></div>
    <div className="tableWrap"><table className="table"><thead><tr><th>Actions</th><th>Time</th><th>EMR chart #</th><th>Age</th><th>Diagnosis</th><th>ICD-9</th><th>Service</th><th>Billing code(s)</th><th>Modifiers</th><th>Minutes</th><th>Fee</th><th>Status</th></tr></thead><tbody>{entries.length===0?<tr><td colSpan={12} className="small">No entries yet. Use “Add current patient”; this table will fill with chart number, diagnosis, ICD-9, billing codes, modifiers, time, and fee.</td></tr>:entries.map(e=><tr key={e.id}><td><div className="rowActions"><button className="miniBtn" onClick={()=>editEntry(e)}>Edit</button><button className="miniBtn danger" onClick={()=>deleteEntry(e.id)}>Delete</button></div></td><td>{e.time}</td><td>{e.chart||'—'}</td><td>{e.age}</td><td><b>{e.dx}</b></td><td>{e.icd}</td><td>{e.service}</td><td><b>{e.codes||'—'}</b></td><td>{e.modifiers||'—'}</td><td>{e.mins}</td><td><b>{money(e.fee)}</b></td><td>{e.status}</td></tr>)}</tbody></table></div>
  </section>
 </main>
}
