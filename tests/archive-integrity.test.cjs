/* Archive contracts use the production review function with a small DOM adapter.
 * Store.atomic is the real temporary store; native IndexedDB is checked separately. */
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const C=require('../src/core.js');require('../src/creator.js');require('../src/live-core.js');require('../src/precision-core.js');require('../src/hash-core.js');require('../src/services.js');require('../src/director-core.js');require('../src/face-core.js');require('../src/face-drafts.js');require('../src/physics-drafts.js');require('../src/autoshow-core.js');
const B=require('../src/bundle-core.js'),S=globalThis.PulseServices;
require('../src/director-edit.js');
const source=fs.readFileSync(require.resolve('../src/enhancements.js'),'utf8');
const review=source.slice(source.indexOf('  app.reviewBackup='),source.indexOf('  app.songManager='));
const chart=(id='chart',lane=0)=>C.validateChart({id,title:id,notes:[{time:1,lane}],source:'manual'});
const library=()=>({format:'DIVA-PULSE-LIBRARY',version:5,songs:[{id:'song',title:'Saved song',duration:3,charts:[chart()],scene:{},audioAsset:'audio'}],assets:[{id:'audio',name:'audio.bin',kind:'audio',type:'application/octet-stream',data:btoa('exact bytes')}]});
const draft=(owner='song',original='chart',title='draft')=>({id:'untrusted-id',songId:owner,originalId:original,chart:{...chart(),title},cursor:1,updated:'2026-10-29T00:00:00.000Z'});
function harness(){
 const els={confirmRestore:{},restoreScores:{checked:true},restorePreferences:{checked:false}},state={opened:0,commits:0,success:0};
 const app={songs:[],scores:[],v3State:{id:'v3-state',setlists:[],sessions:[]},v5State:{id:'v5-state',academy:{}},settings:{id:'preferences'},store:new S.Store,cleanSceneV3:x=>x,
  openModal(){state.opened++;},run:fn=>fn(),closeModal(){},renderLibrary(){},toast(){state.success++;}};
 app.store.watch(e=>{if(e.type==='commit')state.commits++;});
 new Function('app','root','C','S','$',review)(app,globalThis,C,S,id=>els[id]);
 return {app,els,state};
}
async function malformedBundle(raw){
 // Write the documented format independently so pack() cannot hide bad input.
 const assets=raw.assets.map(a=>({...a,name:a.name||'',kind:a.kind||'',type:a.type||'',size:1,hashes:[]}));
 for(const a of assets)a.hashes=[await B.digest(new Uint8Array([7]))];
 const meta=new TextEncoder().encode(JSON.stringify({format:'DIVA-PULSE-BUNDLE',version:1,chunkSize:B.CHUNK,library:{...raw,assets}}));
 const head=new Uint8Array(B.HEADER);head.set(new TextEncoder().encode(B.MAGIC));new DataView(head.buffer).setUint32(8,meta.length,true);
 head.set(Uint8Array.from((await B.digest(meta)).match(/../g),s=>parseInt(s,16)),12);
 return new Blob([head,meta,...assets.map(()=>new Uint8Array([7]))]);
}
const cases=[
 ['duplicate song IDs',r=>r.songs.push(structuredClone(r.songs[0])),/songs\[1\]\.id.*dupliqu/i],
 ['duplicate media IDs',r=>r.assets.push(structuredClone(r.assets[0])),/assets\[1\]\.id.*dupliqu/i],
 ['duplicate chart IDs',r=>r.songs[0].charts.push(chart()),/songs\[0\]\.charts\[1\]\.id.*dupliqu/i],
 ['numeric chart ID',r=>r.songs[0].charts[0].id=17,/charts\[0\]\.id.*identifiant/i],
 ['duplicate chart draft destinations',r=>r.drafts=[draft(),draft('song','chart','other work')],/drafts\[1\].*dupliqu/i],
 ['missing chart draft owner',r=>r.drafts=[draft('absent')],/drafts\[0\]\.songId.*absent/i],
 ['missing audio',r=>r.songs[0].audioAsset='absent',/songs\[0\]\.audioAsset.*absent/i],
 ['missing video',r=>r.songs[0].videoAsset='absent',/songs\[0\]\.videoAsset.*absent/i],
 ['missing GLB',r=>r.songs[0].scene.modelAsset='absent',/scene\.modelAsset.*absent/i],
 ['missing face guide',r=>r.songs[0].scene.faceTrack={mode:'off',duration:3,sourceAsset:'absent'},/faceTrack\.sourceAsset.*absent/i],
 ['missing MMD file',r=>r.songs[0].scene.mmd={assetIds:['audio'],files:[{id:'absent'}]},/mmd\.files\[0\]\.id.*absent/i],
 ['duplicate MMD file IDs',r=>r.songs[0].scene.mmd={assetIds:['audio'],files:[{id:'audio'},{id:'audio'}]},/mmd\.files\[1\]\.id.*dupliqu/i],
 ['missing Director clip',r=>r.songs[0].scene.mmdDirector={duration:3,count:1,slots:[{clips:[{start:0,end:2,motionAssetId:'absent'}]}]},/slots\[0\]\.clips\[0\]\.motionAssetId.*absent/i],
 ['missing Auto Show motion',r=>r.songs[0].scene.autoShow={director:{slots:[{motionAssetId:'absent'}]}},/autoShow\.director\.slots\[0\]\.motionAssetId.*absent/i],
 ['duplicate Director draft owners',r=>{r.songs[0].scene.mmd={id:'pack',assetIds:[],files:[]};r.directorDrafts=[0,1].map(()=>({songId:'song',director:{duration:3,count:1}}));},/directorDrafts\[1\]\.songId.*dupliqu/i],
 ['missing Director draft owner',r=>r.directorDrafts=[{songId:'absent',director:{duration:3}}],/directorDrafts\[0\]\.songId.*absent/i],
 ['duplicate face draft owners',r=>r.faceDrafts=[0,1].map(()=>({songId:'song',track:{mode:'off',duration:3},updated:1,cursor:1})),/faceDrafts\[1\]\.songId.*dupliqu/i],
 ['missing face draft guide',r=>r.faceDrafts=[{songId:'song',track:{mode:'off',duration:3,sourceAsset:'absent'},updated:1,cursor:1}],/faceDrafts\[0\]\.track\.sourceAsset.*absent/i],
 ['duplicate physics draft owners',r=>r.physicsDrafts=[0,1].map(()=>({songId:'song',settings:{},baseSignature:'',updated:1,cursor:1})),/physicsDrafts\[1\]\.songId.*dupliqu/i],
];
for(const [name,change,error] of cases)test('Archive refuses '+name+' before confirmation or decode',async()=>{
 const raw=library();change(raw);const h=harness(),before=JSON.stringify(raw);let decoded=0;const old=S.base64ToBlob;S.base64ToBlob=(...args)=>{decoded++;return old(...args);};
 try{await assert.rejects(h.app.reviewBackup(raw),error);}finally{S.base64ToBlob=old;}
 assert.equal(JSON.stringify(raw),before);assert.deepEqual(h.state,{opened:0,commits:0,success:0});assert.equal(decoded,0);assert.deepEqual(await h.app.store.all('songs'),[]);
});
for(const version of [1,6,999,null,undefined,'5',2.5])test('Archive refuses unknown library version '+String(version),async()=>{
 const raw=library();raw.version=version;const h=harness();await assert.rejects(h.app.reviewBackup(raw),/version.*2, 3, 4, 5/i);assert.equal(h.state.commits,0);
});
for(const version of [2,3,4,5])test('Archive version '+version+' restores copies with exact media bytes',async()=>{
 const raw=library();raw.version=version;raw.drafts=[draft('song','deleted-parent')];const before=JSON.stringify(raw),h=harness();await h.app.reviewBackup(raw);assert.equal(h.state.commits,0);await h.els.confirmRestore.onclick();
 const songs=await h.app.store.all('songs'),assets=await h.app.store.all('assets'),drafts=(await h.app.store.all('settings')).filter(r=>r.id.startsWith('draft:'));
 assert.equal(songs.length,1);assert.notEqual(songs[0].id,'song');assert.notEqual(assets[0].id,'audio');assert.equal(songs[0].audioAsset,assets[0].id);assert.equal(await assets[0].blob.text(),'exact bytes');assert.equal(drafts[0].songId,songs[0].id);assert.equal(drafts[0].originalId,'deleted-parent');assert.equal(JSON.stringify(raw),before);assert.equal(h.state.commits,1);
});
test('Archive checks edited review data again at confirmation before decode',async()=>{
 const raw=library(),h=harness();await h.app.reviewBackup(raw);raw.songs[0].charts.push(chart());let decoded=0;const old=S.base64ToBlob;S.base64ToBlob=(...args)=>{decoded++;return old(...args);};
 try{await assert.rejects(h.els.confirmRestore.onclick(),/dupliqu/i);}finally{S.base64ToBlob=old;}assert.equal(decoded,0);assert.equal(h.state.commits,0);assert.equal(h.state.success,0);
});
test('Archive preserves chart IDs shared by distinct owners and orphan chart drafts',async()=>{
 const raw=library();raw.songs.push({...structuredClone(raw.songs[0]),id:'song:two'});raw.drafts=[draft('song','deleted:parent'),draft('song:two','deleted:parent')];raw.songs[0].charts[0].parent='not-in-this-backup';const h=harness();await h.app.reviewBackup(raw);await h.els.confirmRestore.onclick();assert.equal((await h.app.store.all('songs')).length,2);assert.equal((await h.app.store.all('settings')).filter(d=>d.id.startsWith('draft:')).length,2);
});
for(const [name,change,error] of cases.filter(([name])=>name!=='duplicate media IDs'))test('Binary archive preflights '+name+' before reading media bodies',async()=>{
 const raw=library();change(raw);const blob=await malformedBundle(raw);let mediaProgress=0;await assert.rejects(B.unpack(blob,{onProgress:()=>mediaProgress++}),error);assert.equal(mediaProgress,0);
});
for(const version of [2,3,4,5])test('Binary archive accepts legacy library '+version+' and remaps only copies',async()=>{
 const raw=library();raw.version=version;const parsed=await B.unpack(await B.pack(raw,[{...raw.assets[0],blob:new Blob(['exact bytes'])}]));const h=harness();await h.app.reviewBackup(parsed.raw,parsed.blobs);await h.els.confirmRestore.onclick();const [s]=await h.app.store.all('songs');assert.notEqual(s.id,'song');assert.equal(await (await h.app.store.get('assets',s.audioAsset)).blob.text(),'exact bytes');
});
function score(raw,signature=C.chartSignature(raw.songs[0].charts[0]),extra={}){return {id:'song/chart/'+signature+'/rules4',songId:'song',chartId:'chart',rulesVersion:4,judgmentProfile:'standard',score:1000,accuracy:100,...extra};}
test('Restoration preserves scores for historical signatures without rebasing to the current chart',async()=>{
 const raw=library();raw.scores=[score(raw,'abcdef01'),score(raw)];const h=harness();await h.app.reviewBackup(raw);await h.els.confirmRestore.onclick();const out=await h.app.store.all('scores');assert.equal(out.length,2);assert.ok(out.some(s=>s.id.endsWith('/abcdef01/rules4')));assert.equal(h.app.scores.length,2);
});
test('Archive refuses colliding canonical scores even if supplied IDs differ',async()=>{
 const raw=library();raw.scores=[score(raw,undefined,{id:'legacy-a'}),score(raw,undefined,{id:'legacy-b'})];const h=harness();await assert.rejects(h.app.reviewBackup(raw),/scores\[1\].*dupliqu/i);assert.equal(h.state.commits,0);
});
for(const [name,extra] of [['rules',{rulesVersion:3}],['profile',{judgmentProfile:'accessible'}]])test('Archive refuses recognized score key with conflicting '+name,async()=>{
 const raw=library();raw.scores=[score(raw,undefined,extra)];const h=harness();await assert.rejects(h.app.reviewBackup(raw),/scores\[0\].*(règle|profil)/i);assert.equal(h.state.commits,0);
});
test('Legacy score fallback and optional orphan scores/setlists keep compatibility',async()=>{
 const raw=library();raw.scores=[score(raw,undefined,{id:'legacy',rulesVersion:undefined,judgmentProfile:undefined}),score(raw,undefined,{id:'missing/chart/1',songId:'missing'})];raw.v3State={setlists:[{entries:[{songId:'missing',chartId:'chart'},{songId:'song',chartId:'chart'}]}]};const h=harness();await h.app.reviewBackup(raw);await h.els.confirmRestore.onclick();const scores=await h.app.store.all('scores');assert.equal(scores.length,1);assert.equal(scores[0].id,h.app.songs[0].id+'/chart/'+C.chartSignature(raw.songs[0].charts[0]));assert.equal(h.app.v3State.setlists[0].entries.length,1);
});
test('Recognized historical score key remains usable when old metadata fields are absent',async()=>{
 const raw=library();raw.scores=[score(raw,'abcdef01',{id:'song/chart/abcdef01/rules4/profile-accessible',rulesVersion:undefined,judgmentProfile:undefined})];const h=harness();await h.app.reviewBackup(raw);await h.els.confirmRestore.onclick();assert.ok((await h.app.store.all('scores'))[0].id.endsWith('/abcdef01/rules4/profile-accessible'));
});
test('Chart draft owner/original pairs do not collide through colon concatenation',async()=>{
 const raw=library();raw.songs[0].id='owner:part';raw.songs.push({...structuredClone(raw.songs[0]),id:'owner'});raw.drafts=[draft('owner:part','chart'),draft('owner','part:chart')];const h=harness();await h.app.reviewBackup(raw);await h.els.confirmRestore.onclick();assert.equal((await h.app.store.all('settings')).filter(d=>d.id.startsWith('draft:')).length,2);
});
test('A removed verified binary Blob never falls back to base64 at confirmation',async()=>{
 const raw=library(),parsed=await B.unpack(await B.pack(raw,[{...raw.assets[0],blob:new Blob(['exact bytes'])}])),h=harness();await h.app.reviewBackup(parsed.raw,parsed.blobs);parsed.blobs.clear();let decoded=0;const old=S.base64ToBlob;S.base64ToBlob=(...args)=>{decoded++;return old(...args);};
 try{await assert.rejects(h.els.confirmRestore.onclick(),/binaire.*absent/i);}finally{S.base64ToBlob=old;}assert.equal(decoded,0);assert.equal(h.state.commits,0);
});
for(const version of [1,999,'5'])test('Binary container refuses unknown nested library version '+String(version)+' before body slicing',async()=>{
 const raw=library();raw.version=version;const blob=await malformedBundle(raw),body=B.HEADER+new DataView(await blob.slice(0,B.HEADER).arrayBuffer()).getUint32(8,true);let slices=0;
 const file={size:blob.size,slice(start,...args){if(start>=body)slices++;return blob.slice(start,...args);}};await assert.rejects(B.unpack(file),/version.*2, 3, 4, 5/i);assert.equal(slices,0);
});
function mmdLibrary(){
 const raw=library();for(const id of ['model','motion','external'])raw.assets.push({id,name:id+'.bin',kind:'mmd',type:'application/octet-stream',data:btoa(id)});
 const s=raw.songs[0];s.scene.mmd={id:'pack',assetIds:['model','motion'],files:[{id:'model',role:'model',name:'m.pmx'},{id:'motion',role:'motion',name:'m.vmd'}]};
 s.scene.mmdDirector=PulseDirector.normalizeDirector({duration:3,count:1,slots:[{modelAssetId:'model',motionAssetId:'motion',clips:[{start:0,end:3,motionAssetId:'motion'}]}]});
 s.scene.autoShow=PulseAutoShow.generate(s);return raw;
}
const publishedLinks=[['model slot',d=>d.slots[0].modelAssetId='external'],['motion slot',d=>d.slots[0].motionAssetId='external'],['motion clip',d=>d.slots[0].clips[0].motionAssetId='external']];
for(const automatic of [false,true])for(const [name,change]of publishedLinks)test('Published '+(automatic?'Auto Show ':'Director ')+name+' must belong to its pack in both formats',async()=>{
 const raw=mmdLibrary();change(automatic?raw.songs[0].scene.autoShow.director:raw.songs[0].scene.mmdDirector);const h=harness();await assert.rejects(h.app.reviewBackup(raw),/absent.*pack MMD/i);assert.equal(h.state.commits,0);
 let reads=0;await assert.rejects(B.unpack(await malformedBundle(raw),{onProgress:()=>reads++}),/absent.*pack MMD/i);assert.equal(reads,0);
});
test('Published motion reference cannot use an in-pack texture metadata role',async()=>{
 const raw=mmdLibrary(),s=raw.songs[0].scene;s.mmd.assetIds.push('external');s.mmd.files.push({id:'external',role:'texture'});s.mmdDirector.slots[0].clips[0].motionAssetId='external';const h=harness();await assert.rejects(h.app.reviewBackup(raw),/motion.*absente.*pack MMD/i);assert.equal(h.state.commits,0);
});
test('Published model reference cannot use an in-pack motion metadata role',async()=>{
 const raw=mmdLibrary();raw.songs[0].scene.mmdDirector.slots[0].modelAssetId='motion';const h=harness();await assert.rejects(h.app.reviewBackup(raw),/modèle.*absent.*pack MMD/i);assert.equal(h.state.commits,0);
});
test('Published motion uses only the first camera actually loaded by the renderer',async()=>{
 const raw=mmdLibrary(),s=raw.songs[0].scene;s.mmd.files.find(f=>f.id==='motion').role='camera';s.mmd.assetIds.push('external');s.mmd.files.push({id:'external',role:'camera'});assert.doesNotThrow(()=>B.validateLibrary(raw));s.mmdDirector.slots[0].clips[0].motionAssetId='external';assert.throws(()=>B.validateLibrary(raw),/motion.*absente.*pack MMD/i);
});
test('Recovery from a previous pack keeps its referenced media without publishing that draft',async()=>{
 const raw=mmdLibrary(),saved=structuredClone(raw.songs[0].scene.mmdDirector);raw.directorDrafts=[{songId:'song',packId:'previous-pack',director:PulseDirector.normalizeDirector({duration:3,count:1,slots:[{modelAssetId:'model',clips:[{start:0,end:3,motionAssetId:'external'}]}]})}];
 const h=harness();await h.app.reviewBackup(raw);await h.els.confirmRestore.onclick();const [song]=await h.app.store.all('songs'),recovery=(await h.app.store.all('settings')).find(d=>d.id.startsWith('director-draft:')),id=recovery.director.slots[0].clips[0].motionAssetId;
 assert.ok((await h.app.store.get('assets',id))?.blob);assert.ok(!song.scene.mmd.assetIds.includes(id));assert.notEqual(song.scene.mmdDirector.slots[0].clips[0].motionAssetId,id);assert.equal(saved.slots[0].clips[0].motionAssetId,'motion');
});
