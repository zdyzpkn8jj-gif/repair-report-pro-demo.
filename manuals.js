/* Technician manual finder: curated Emerson links; suggestions are not model/revision verification. */
const EMERSON_MANUALS=[
 {id:'et',label:'Fisher easy-e ET control valve',type:'Valve',terms:['et','easy-e et'],url:'https://www.emerson.com/en/final-control/products/fisher-et',kind:'Emerson product documentation'},
 {id:'657667',label:'Fisher 657 / 667 diaphragm actuator',type:'Actuator',terms:['657','667'],url:'https://www.emerson.com/en/final-control/products/fisher-657-and-667',kind:'Emerson manuals and guides'},
 {id:'667size',label:'Fisher 667 actuator — sizes 80 and 100',type:'Actuator',terms:['667'],extraSize:true,url:'https://www.emerson.com/is/content/emerson/en/final-control/flow-controls/documents/d100311x012-instruction-manual-667-diaphragm-actuators-size-80-and-100-fisher.pdf',kind:'Instruction manual D100311X012'},
 {id:'dvc6200',label:'FIELDVUE DVC6200 digital valve controller',type:'Positioner',terms:['dvc6200'],url:'https://www.emerson.com/en/final-control/products/fisher-dvc6200',kind:'Emerson manuals and guides'},
 {id:'dvcsis',label:'FIELDVUE DVC6200 SIS',type:'Positioner',terms:['dvc6200 sis'],url:'https://www.emerson.com/is/content/emerson/en/final-control/flow-controls/documents/instruction-manual-fisher-fieldvue-dvc6200-sis-digital-valve-controller-en.pdf',kind:'Instruction manual D103557X012'}
];
function manualWords(v){return String(v||'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim()}
function manualMatches(j){
 const valve=manualWords(j.model),act=manualWords(j.actuatorModel),positioner=manualWords(j.positionerModel);
 return EMERSON_MANUALS.filter(m=>{
  let value=m.type==='Valve'?valve:m.type==='Actuator'?act:positioner;
  const terms=m.terms.map(manualWords);
  const match=terms.some(t=>value.split(' ').includes(t)||value.includes(t));
  if(!match)return false;
  if(m.id==='dvcsis')return positioner.includes('sis');
  if(m.extraSize)return /\b(80|100)\b/.test(act);
  return true;
 });
}
function manualQuickCard(m){
 return '<div class="manual-card"><strong>'+esc(m.label)+'</strong><small>'+esc(m.type)+' · '+esc(m.kind)+'</small><a href="'+esc(m.url)+'" target="_blank" rel="noopener noreferrer">Open Emerson reference ↗</a></div>';
}
function technicianManuals(){
 const j=job(),matches=manualMatches(j);
 const key=['model','actuatorModel','positionerModel','serial','actuatorSerial','positionerSerial','sizeRating'].map(k=>String(j[k]||'')).join('|');
 const record=j.manualVerification||{};
 const verified=record.key===key&&record.confirmed===true;
 return panel('<div class="manual-workspace"><h2>Emerson Manual Finder</h2>'+
 '<p class="sub">Quick access to manufacturer documentation using equipment information from advisor intake and reviewed serial-card fields. Matching is provisional: verify data tags, model, size, construction and manual revision before performing any work.</p>'+
 '<div class="grid manual-identification">'+
 [['Valve model',j.model],['Valve serial',j.serial],['Size / class',j.sizeRating],['Actuator model',j.actuatorModel],['Actuator serial',j.actuatorSerial],['Positioner model',j.positionerModel],['Positioner serial',j.positionerSerial]].map(([k,v])=>'<div class="resource-fact"><b>'+esc(k)+'</b><span>'+esc(v||'Not recorded')+'</span></div>').join('')+
 '</div><div class="toolbar"><button type="button" class="btn secondary" onclick="change(\'intake\')">Update equipment identification</button><button type="button" class="btn secondary" onclick="change(\'technician\')">Back to inspection</button></div>'+
 '<label class="manual-verify"><input type="checkbox" '+(verified?'checked':'')+' onchange="setManualVerified(this.checked)"><span>I have checked equipment identification against its physical data tags or approved records. This does not verify the manual itself.</span></label>'+
 '<h3>Suggested Emerson references</h3>'+
 (matches.length?'<p class="sub">'+matches.length+' reference(s) matched recorded model information. These are suggestions, not approved procedures.</p><div class="manual-grid">'+matches.map(manualQuickCard).join('')+'</div>':
 '<p class="note">No curated reference matched the recorded model information. Confirm identification or use the Emerson product documentation links below.</p>')+
 '<h3>Browse Emerson documentation</h3><p class="sub">These resources are always available, even without a recognized model. External pages and PDFs require internet unless separately downloaded.</p>'+
 '<div class="manual-grid">'+EMERSON_MANUALS.filter(m=>['et','657667','dvc6200'].includes(m.id)).map(manualQuickCard).join('')+'</div>'+
 '<div class="alert" style="margin-top:16px"><b>Technician safety check:</b> Do not assume manuals are interchangeable across sizes, revisions, trim, mounting arrangements or control configurations. Obtain the exact applicable instruction manual and controlled shop procedures before maintenance, calibration, lifting, pressure testing or tightening.</div></div>');
}
function setManualVerified(v){
 if(!persistVisibleFields())return;
 const j=job(),key=['model','actuatorModel','positionerModel','serial','actuatorSerial','positionerSerial','sizeRating'].map(k=>String(j[k]||'')).join('|');
 j.manualVerification={confirmed:!!v,key,at:new Date().toISOString()};save();render();
}
