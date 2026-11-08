/* Documentation progress is distinct from physical valve repair progress.
   A report can be approved when an authorized inspection is completed without claiming the equipment is repaired. */
function hasDoc(v){return Array.isArray(v)?v.length>0:typeof v==='string'?v.trim().length>0:!!v}
function docHasComponent(j,key){
 return Object.values(j.componentSections||{}).some(x=>x&&!x.na&&!x.fieldNA?.[key]&&hasDoc(x[key]));
}
function docHasNA(j,key){return !!j.overallNA?.[key]}
function docProgress(j){
 const intake=hasDoc(j.customer)&&hasDoc(j.tag)&&hasDoc(j.scope);
 const inspection=docHasNA(j,'findings')||hasDoc(j.findings)||docHasComponent(j,'findings');
 const repair=docHasNA(j,'action')||hasDoc(j.action)||docHasComponent(j,'actions');
 const testing=docHasNA(j,'testing')||hasDoc(j.testing)||j.verification&&j.verification!=='Not performed'&&j.verification!=='Pass';
 const steps=[
  {label:'Advisor intake',done:!!intake,weight:20},
  {label:'Inspection documentation',done:!!inspection,weight:25},
  {label:'Repair / action documentation',done:!!repair,weight:25},
  {label:'Testing / verification documentation',done:!!testing,weight:20},
  {label:'Advisor approval',done:j.review==='Approved',weight:10}
 ];
 let percent=steps.reduce((sum,x)=>sum+(x.done?x.weight:0),0);
 if(j.review==='Approved')percent=100;
 return {percent,steps,approved:j.review==='Approved'};
}
function docProgressBadge(j){
 const p=docProgress(j);
 return '<div class="doc-progress"><div class="doc-progress-heading"><b>Report documentation</b><b>'+p.percent+'%</b></div><div class="progress" role="progressbar" aria-label="Report documentation completion" aria-valuemin="0" aria-valuemax="100" aria-valuenow="'+p.percent+'"><div style="width:'+p.percent+'%"></div></div><div class="sub">'+(p.approved?'Advisor approved — documentation workflow complete.':'Progress updates as documentation is saved and reviewed.')+' Physical repair completion is tracked separately.</div></div>';
}
