/* Technician OEM manual finder: curated official manufacturer links. Suggestions do not verify model, configuration or revision. */
const EMERSON_MANUALS=[
 {id:'et',label:'Fisher easy-e ET control valve',type:'Valve',terms:['et','easy-e et'],url:'https://www.emerson.com/en/final-control/products/fisher-et',kind:'Emerson product documentation'},
 {id:'657667',label:'Fisher 657 / 667 diaphragm actuator',type:'Actuator',terms:['657','667'],url:'https://www.emerson.com/en/final-control/products/fisher-657-and-667',kind:'Emerson manuals and guides'},
 {id:'667size',label:'Fisher 667 actuator — sizes 80 and 100',type:'Actuator',terms:['667'],extraSize:true,url:'https://www.emerson.com/is/content/emerson/en/final-control/flow-controls/documents/d100311x012-instruction-manual-667-diaphragm-actuators-size-80-and-100-fisher.pdf',kind:'Instruction manual D100311X012'},
 {id:'dvc6200',label:'FIELDVUE DVC6200 digital valve controller',type:'Positioner',terms:['dvc6200'],url:'https://www.emerson.com/en/final-control/products/fisher-dvc6200',kind:'Emerson manuals and guides'},
 {id:'dvcsis',label:'FIELDVUE DVC6200 SIS',type:'Positioner',terms:['dvc6200 sis'],url:'https://www.emerson.com/is/content/emerson/en/final-control/flow-controls/documents/instruction-manual-fisher-fieldvue-dvc6200-sis-digital-valve-controller-en.pdf',kind:'Instruction manual D103557X012'}
];
const OTHER_OEM_MANUALS=[
 {id:'mas21000',manufacturer:'Masoneilan',label:'Masoneilan 21000 Series globe valve',type:'Valve',terms:['21000','21009'],url:'https://valves.bakerhughes.com/masoneilanglobe-control-valvesmasoneilan-21000-series-single-port-valve',kind:'Baker Hughes product page with official manuals'},
 {id:'mas10000',manufacturer:'Masoneilan',label:'Masoneilan 10000 Series double-ported globe valve',type:'Valve',terms:['10000'],url:'https://valves.bakerhughes.com/masoneilanglobe-control-valvesmasoneilan-10000-series-double-port-valve',kind:'Baker Hughes product page with official manual'},
 {id:'mas8788',manufacturer:'Masoneilan',label:'Masoneilan 87 / 88 pneumatic actuators',type:'Actuator',terms:['87','88'],url:'https://valves.bakerhughes.com/masoneilanactuatorsmasoneilan-8788-pneumatic-spring-diaphragm',kind:'Baker Hughes actuator manuals'},
 {id:'mas28000',manufacturer:'Masoneilan',label:'Masoneilan 28000 Varipak valve',type:'Valve',terms:['28000','varipak'],url:'https://valves.bakerhughes.com/masoneilanglobe-control-valvesmasoneilan-28000-series-varipaktm-valve',kind:'Baker Hughes product manuals'},
 {id:'nelesL',manufacturer:'Neles',label:'Neles L6 / LW / LG butterfly valves',type:'Valve',terms:['l6','lw','lg','neldisc'],url:'https://www.valmet.com/flowcontrol/valves/butterfly-valves/neles-butterfly-valves/neles-butterfly-valve-series-l6-lw-and-lg/',kind:'Valmet installation and maintenance instructions'},
 {id:'nelesR',manufacturer:'Neles',label:'Neles R-series V-port segment valves',type:'Valve',terms:['ra','re','re1','re13'],url:'https://www.valmet.com/flowcontrol/valves/segment-valves/neles-v-port-segment-valve-for-control-applications-r-series/',kind:'Valmet installation and maintenance instructions'},
 {id:'neles700',manufacturer:'Neles',label:'Neles NE700 / NP700 positioners',type:'Positioner',terms:['ne700','np700'],url:'https://www.valmet.com/flowcontrol/valve-automation/valve-controllers/neles-ne700np700-positioner/',kind:'Valmet installation and maintenance instructions'},
 {id:'cciVLB',manufacturer:'CCI',label:'IMI CCI VLB steam conditioning valve',type:'Valve',terms:['vlb'],url:'https://www.imi-critical.com/product/vlb-steam-conditioning-valve/',kind:'IMI CCI product documents (manual availability unconfirmed)'},
 {id:'cci100dmt',manufacturer:'CCI',label:'IMI CCI 100DMT multi-stage control valve',type:'Valve',terms:['100dmt'],url:'https://processautomation.imiplc.com/products/control-valves/general-control-valves/100dmt-multi-stage-general-control-valve',kind:'IMI CCI product documentation (manual availability unconfirmed)'},
 {id:'cci840',manufacturer:'CCI',label:'IMI CCI 840 Series control valve',type:'Valve',terms:['840'],url:'https://processautomation.imiplc.com/products/control-valves/general-control-valves/840-series-single-stage-cage-guided-general-service-control-valve',kind:'IMI CCI product documentation (manual availability unconfirmed)'}
];
const OEM_PORTALS=[
 {manufacturer:'Emerson / Fisher',label:'Emerson official valve manuals and product documentation',url:'https://www.emerson.com/en/final-control'},
 {manufacturer:'Masoneilan',label:'Baker Hughes official valve and actuator manual library',url:'https://valves.bakerhughes.com/resource-center'},
 {manufacturer:'Neles',label:'Valmet Neles official valve and controller documents',url:'https://www.valmet.com/flowcontrol/brands/neles/'},
 {manufacturer:'CCI',label:'IMI CCI official product documentation and support',url:'https://www.imi-critical.com/brands/imi-cci/'}
];
function manualWords(v){return String(v||'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim()}
function makerFrom(textValue){
 const t=manualWords(textValue);
 if(/\b(masoneilan|baker hughes)\b/.test(t))return 'Masoneilan';
 if(/\b(neles|valmet|neldisc|jamesbury)\b/.test(t))return 'Neles';
 if(/\b(cci|imi|drag)\b/.test(t))return 'CCI';
 if(/\b(fisher|emerson|fieldvue)\b/.test(t))return 'Emerson / Fisher';
 return '';
}
function knownMaker(j,type){
 const values=type==='Valve'?[j.model,j.device]:type==='Actuator'?[j.actuatorModel,j.actuator]:[j.positionerModel,j.originalPositioner];
 for(const v of values){const maker=makerFrom(v);if(maker)return maker}
 return '';
}
function matchesTerm(haystack,term){
 const h=manualWords(haystack),t=manualWords(term);
 return !!t&&(' '+h+' ').includes(' '+t+' ');
}
function manualMatches(j){
 const inputs={Valve:String(j.model||''),Actuator:String(j.actuatorModel||''),Positioner:String(j.positionerModel||'')};
 const all=EMERSON_MANUALS.map(m=>({...m,manufacturer:'Emerson / Fisher'})).concat(OTHER_OEM_MANUALS);
 return all.filter(m=>{
  const input=inputs[m.type],maker=knownMaker(j,m.type);
  if(!input||!maker||maker!==m.manufacturer)return false;
  if(!m.terms.some(term=>matchesTerm(input,term)))return false;
  if(m.id==='dvcsis'&&!matchesTerm(input,'sis'))return false;
  if(m.id==='667size'&&!/\b(80|100)\b/.test(input))return false;
  return true;
 });
}
function manualQuickCard(m){
 const manufacturer=m.manufacturer||'Emerson / Fisher';
 return '<div class="manual-card"><strong>'+esc(m.label)+'</strong><small>'+esc(manufacturer)+' · '+esc(m.type)+' · '+esc(m.kind)+'</small><a href="'+esc(m.url)+'" target="_blank" rel="noopener noreferrer">Open official source ↗</a></div>';
}
function technicianManuals(){
 const j=job(),matches=manualMatches(j);
 const key=['model','actuatorModel','positionerModel','serial','actuatorSerial','positionerSerial','sizeRating'].map(k=>String(j[k]||'')).join('|');
 const verified=j.manualVerification?.key===key&&j.manualVerification?.confirmed===true;
 return panel('<div class="manual-workspace"><h2>OEM Valve Manual Finder</h2>'+
 '<p class="sub">Find official documentation for Emerson/Fisher, Masoneilan, Neles and IMI CCI equipment. Uses recorded model information from intake; model matches are provisional until the technician verifies data tags, manufacturer, size, trim, configuration and manual revision.</p>'+
 '<div class="grid manual-identification">'+
 [['Valve model',j.model],['Valve serial',j.serial],['Size / class',j.sizeRating],['Actuator model',j.actuatorModel],['Actuator serial',j.actuatorSerial],['Positioner model',j.positionerModel],['Positioner serial',j.positionerSerial]].map(([k,v])=>'<div class="resource-fact"><b>'+esc(k)+'</b><span>'+esc(v||'Not recorded')+'</span></div>').join('')+
 '</div><div class="toolbar"><button type="button" class="btn secondary" onclick="change(\'intake\')">Update equipment identification</button><button type="button" class="btn secondary" onclick="change(\'technician\')">Back to inspection</button></div>'+
 '<label class="manual-verify"><input type="checkbox" '+(verified?'checked':'')+' onchange="setManualVerified(this.checked)"><span>I checked equipment identification against the physical data tags or approved records. This does not confirm the manual revision or its suitability.</span></label>'+
 '<h3>Suggested official manufacturer references</h3>'+
 (matches.length?'<p class="sub">'+matches.length+' reference(s) matched the recorded manufacturer and model. Verify the exact manual before following any procedure.</p><div class="manual-grid">'+matches.map(manualQuickCard).join('')+'</div>':
 '<p class="note">No verified-manufacturer model match from the curated reference list. Enter the manufacturer with the model in Advisor intake (for example “Masoneilan 21000”, “Neles L6”, or “CCI VLB”), then return here; or browse the official manufacturer sites below.</p>')+
 '<h3>Official manufacturer document libraries</h3>'+
 '<p class="sub">Browse each manufacturer’s manuals and technical documents. CCI public pages may provide brochures rather than the specific service manual; request the correct IOM and revision from IMI CCI when required.</p>'+
 '<div class="manual-grid">'+OEM_PORTALS.map(p=>'<div class="manual-card"><strong>'+esc(p.manufacturer)+'</strong><small>'+esc(p.label)+'</small><a href="'+esc(p.url)+'" target="_blank" rel="noopener noreferrer">Browse official documents ↗</a></div>').join('')+'</div>'+
 '<div class="alert" style="margin-top:16px"><b>Technical safety:</b> A product page is not automatically an instruction manual. Confirm the exact OEM document, revision, equipment model, size, pressure rating, construction and applicable site procedures before disassembly, calibration, pressure testing or fastener tightening. External links need internet unless the documents have been downloaded separately.</div></div>');
}
function setManualVerified(v){
 if(!persistVisibleFields())return;
 const j=job(),key=['model','actuatorModel','positionerModel','serial','actuatorSerial','positionerSerial','sizeRating'].map(k=>String(j[k]||'')).join('|');
 j.manualVerification={confirmed:!!v,key,at:new Date().toISOString()};save();render();
}
