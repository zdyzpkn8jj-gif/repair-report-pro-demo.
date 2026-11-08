/* Repair Report Pro photo module: offline device-local IndexedDB image blobs.
   Photo metadata belongs to each work order; no cloud uploads are configured. */
const PHOTO_CATEGORIES=[
 ['assembly','As-found assembly'],
 ['damage','As-found damage'],
 ['body','Valve body / pressure boundary'],
 ['seat','Seat / landing surfaces'],
 ['gasket','Gasket / bonnet sealing surfaces'],
 ['packing','Packing bore / packing box'],
 ['hardware','Studs / nuts / bolting'],
 ['trim','Trim / plug / disc'],
 ['actuator','Actuator / positioner'],
 ['after','As-left / completed assembly'],
 ['other','Other inspection photograph']
];
let photoDbPromise=null,photoUrls=[];
function photoDb(){
 if(!('indexedDB' in window))return Promise.reject(new Error('Photo storage is not supported on this browser'));
 if(!photoDbPromise)photoDbPromise=new Promise((resolve,reject)=>{
  const req=indexedDB.open('rrp-device-photos-v1',1);
  req.onupgradeneeded=()=>{if(!req.result.objectStoreNames.contains('images'))req.result.createObjectStore('images')};
  req.onsuccess=()=>resolve(req.result);
  req.onerror=()=>reject(req.error||new Error('Local photo database unavailable'));
 }).catch(err=>{photoDbPromise=null;throw err});
 return photoDbPromise;
}
async function storePhotoBlob(id,blob){
 const db=await photoDb();
 return new Promise((resolve,reject)=>{
  const t=db.transaction('images','readwrite'),request=t.objectStore('images').put(blob,id);
  t.oncomplete=()=>resolve();
  t.onerror=()=>reject(t.error||request.error||new Error('Photo storage failed'));
  t.onabort=()=>reject(t.error||new Error('Photo storage aborted'));
 });
}
async function readPhotoBlob(id){
 const db=await photoDb();
 return new Promise((resolve,reject)=>{
  const t=db.transaction('images','readonly'),r=t.objectStore('images').get(id);
  r.onsuccess=()=>resolve(r.result||null);
  r.onerror=()=>reject(r.error||new Error('Cannot read photo'));
 });
}
async function deletePhotoBlob(id){
 const db=await photoDb();
 return new Promise((resolve,reject)=>{
  const t=db.transaction('images','readwrite');t.objectStore('images').delete(id);
  t.oncomplete=resolve;t.onerror=()=>reject(t.error||new Error('Could not delete photo'));
 });
}
function categoryName(id){return PHOTO_CATEGORIES.find(c=>c[0]===id)?.[1]||'Other'}
function photosFor(j){return Array.isArray(j.photos)?j.photos:[]}
function photoSection(j){
 const photos=photosFor(j);
 return '<section class="panel photo-panel" style="margin-top:16px"><h3>Inspection photographs <span class="badge">'+photos.length+' saved</span></h3>'+
 '<p class="sub">Capture as-found assembly, visible damage, seats, gasket surfaces, packing bore, studs and nuts. Each photo belongs to this work order. Photos stay on this device for this demo; no cloud sync or image backup is configured.</p>'+
 '<div class="grid photo-controls"><label class="field">Photo category<select id="photoCategory">'+PHOTO_CATEGORIES.map(c=>'<option value="'+c[0]+'">'+c[1]+'</option>').join('')+'</select></label>'+
 '<label class="field">Inspection stage<select id="photoStage"><option value="As found">As found</option><option value="Disassembly / inspection">Disassembly / inspection</option><option value="During repair">During repair</option><option value="As left">As left</option></select></label></div>'+
 '<label class="field">Photo description (optional)<input id="photoCaption" placeholder="E.g., corrosion on outlet-side body wall"></label>'+
 '<label class="field photo-upload">Take or select photos<input type="file" id="photoInput" accept="image/*" multiple onchange="addJobPhotos(this)" aria-label="Take or select inspection photographs"></label>'+
 '<p class="sub" id="photoFeedback" role="status">Select multiple photos or take a picture using your phone camera. Photos will be reduced in size for local storage.</p>'+
 '<div class="photo-grid">'+photos.map(p=>'<div class="photo-card"><div class="photo-image"><img data-photo-id="'+esc(p.id)+'" alt="'+esc(categoryName(p.category))+'" loading="lazy"><span class="photo-fallback">Loading photo…</span></div>'+
 '<strong>'+esc(categoryName(p.category))+'</strong><small>'+esc(p.stage||'As found')+' · '+esc(p.taken||'')+'</small>'+
 '<label class="field">Description<textarea rows="2" oninput="updatePhotoCaption(\''+esc(p.id)+'\',this.value)">'+esc(p.caption||'')+'</textarea></label>'+
 '<div class="photo-actions"><button type="button" class="btn secondary" onclick="downloadJobPhoto(\''+esc(p.id)+'\')">Save image</button><button type="button" class="btn ghost" onclick="removeJobPhoto(\''+esc(p.id)+'\')">Remove</button></div></div>').join('')+'</div>'+
 '</section>';
}
function photoReport(j){
 const photos=photosFor(j);
 return '<section class="section"><h3>Inspection photographs ('+photos.length+')</h3>'+
 (!photos.length?'<p>No inspection photographs attached to this work order.</p>':
 '<div class="photo-grid photo-report-grid">'+photos.map(p=>'<figure class="photo-card"><div class="photo-image"><img data-photo-id="'+esc(p.id)+'" alt="'+esc(categoryName(p.category))+'"><span class="photo-fallback">Photo unavailable on this device — confirm before sharing</span></div><figcaption><b>'+esc(categoryName(p.category))+'</b> — '+esc(p.stage||'')+(p.caption?'<p>'+esc(p.caption)+'</p>':'')+'</figcaption></figure>').join('')+'</div>')+
 '</section>';
}
async function normalizePhoto(file){
 if(!file.type.startsWith('image/'))throw Error('Unsupported photo type');
 if(file.size>25*1024*1024)throw Error('Photo exceeds 25 MB');
 // Browser image decoding applies camera orientation where supported.
 const bitmap=await createImageBitmap(file);
 try{
  const scale=Math.min(1,1600/Math.max(bitmap.width,bitmap.height));
  const canvas=document.createElement('canvas');
  canvas.width=Math.max(1,Math.round(bitmap.width*scale));
  canvas.height=Math.max(1,Math.round(bitmap.height*scale));
  canvas.getContext('2d').drawImage(bitmap,0,0,canvas.width,canvas.height);
  return await new Promise((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(Error('Could not prepare photo')),'image/jpeg',0.8));
 }finally{bitmap.close()}
}
async function addJobPhotos(input){
 const files=Array.from(input.files||[]);if(!files.length)return;
 const j=job(),workId=j.id,category=document.getElementById('photoCategory')?.value||'other',stage=document.getElementById('photoStage')?.value||'As found',caption=document.getElementById('photoCaption')?.value.trim()||'';
 const status=document.getElementById('photoFeedback');if(status)status.textContent='Saving '+files.length+' photo(s) on this device…';
 let count=0,errors=[];
 for(const file of files){
  const id='P'+Date.now().toString(36)+Math.random().toString(36).slice(2,10);
  try{
   const blob=await normalizePhoto(file);
   await storePhotoBlob(id,blob);
   j.photos=j.photos||[];
   j.photos.push({id,category,stage,caption,taken:new Date().toLocaleString(),filename:file.name,bytes:blob.size});
   count++;
  }catch(err){errors.push(file.name+': '+err.message)}
 }
 if(count){j.review='Pending';save();render();notify(count+' inspection photo(s) saved locally');}
 if(errors.length)alert('Some images could not be stored:\n'+errors.join('\n')+'\nPhotos already saved were kept.');
 else if(!count&&status)status.textContent='No photos were saved.';
}
function updatePhotoCaption(id,value){
 const p=photosFor(job()).find(x=>x.id===id);if(!p)return;
 p.caption=value;job().review='Pending';save();
}
async function removeJobPhoto(id){
 if(!confirm('Remove this photo from the current work order and this device?'))return;
 const j=job(),p=photosFor(j).find(x=>x.id===id);if(!p)return;
 try{await deletePhotoBlob(id);j.photos=j.photos.filter(x=>x.id!==id);j.review='Pending';save();render();notify('Photo removed')}
 catch(e){alert('Could not remove photo: '+e.message)}
}
async function downloadJobPhoto(id){
 try{
  const blob=await readPhotoBlob(id);if(!blob)throw Error('Original photo is not stored on this device');
  const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=id+'.jpg';a.click();setTimeout(()=>URL.revokeObjectURL(url),5000);
 }catch(e){alert(e.message)}
}
async function hydratePhotoImages(){
 photoUrls.forEach(u=>URL.revokeObjectURL(u));photoUrls=[];
 const els=[...document.querySelectorAll('img[data-photo-id]')];
 for(const el of els){
  if(!el.isConnected)continue;
  try{
   const blob=await readPhotoBlob(el.dataset.photoId);
   if(!blob){el.closest('.photo-image')?.classList.add('photo-missing');continue}
   const url=URL.createObjectURL(blob);photoUrls.push(url);
   if(el.isConnected){el.src=url;el.closest('.photo-image')?.classList.add('photo-loaded')}
   else URL.revokeObjectURL(url);
  }catch(e){el.closest('.photo-image')?.classList.add('photo-missing')}
 }
}
