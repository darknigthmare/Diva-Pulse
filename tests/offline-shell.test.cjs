/* Contract tests in a VM, not service worker browser installation tests. */
'use strict';const test=require('node:test'),A=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs'),path=require('node:path');
const script=fs.readFileSync(path.resolve(__dirname,'../sw.js'),'utf8');
function env(){const handlers={},rows=new Map(),deletions=[],cachedLists=[];let offline=false,quota=false;
 const cache={addAll:async x=>{cachedLists.push([...x]);},put:async(k,v)=>{if(quota)throw Error('quota');rows.set(k,await v.text());},match:async k=>rows.has(k)?new Response(rows.get(k)):null};
 const context={URL,Response,Request,Promise,Set,console,self:{registration:{scope:'https://example.test/app/'},location:{origin:'https://example.test'},clients:{claim:async()=>{}},addEventListener:(k,fn)=>handlers[k]=fn},caches:{open:async()=>cache,keys:async()=>['DIVA-PULSE-ENCORE-3.0.0','DIVA-PULSE-ENCORE-4.0.0','OTHER-APP'],delete:async k=>deletions.push(k)},fetch:async()=>{if(offline)throw Error('offline');return new Response('online content');}};
 vm.runInNewContext(script,context);
 const get=async(url,method='GET')=>{let result;handlers.fetch({request:new Request(url,{method}),respondWith:p=>result=p});return result?await result:undefined;};
 return {handlers,rows,deletions,cachedLists,get,offline:()=>offline=true,quota:()=>quota=true};}
test('Offline shell install requests only static application shell files',async()=>{const e=env();let p;e.handlers.install({waitUntil:x=>p=x});await p;A.deepEqual(e.cachedLists[0],['./','./index.html','./manifest.webmanifest','./icons/icon-192.png','./icons/icon-512.png']);});
test('Offline shell activate deletes only old DIVA caches',async()=>{const e=env();let p;e.handlers.activate({waitUntil:x=>p=x});await p;A.deepEqual(e.deletions,['DIVA-PULSE-ENCORE-3.0.0','DIVA-PULSE-ENCORE-4.0.0']);});
test('Offline shell ignores user audio, foreign origins and non-GET requests',async()=>{const e=env();for(const [u,m] of [['https://elsewhere.test/app/index.html','GET'],['https://example.test/app/song.wav','GET'],['https://example.test/app/index.html','POST']])A.equal(await e.get(u,m),undefined);});
test('Offline shell caches HTML and returns cached content on failed network',async()=>{const e=env();A.equal(await(await e.get('https://example.test/app/index.html?x=1')).text(),'online content');e.offline();A.equal(await(await e.get('https://example.test/app/index.html')).text(),'online content');});
test('A failed cache write does not break valid online content',async()=>{const e=env();e.quota();A.equal(await(await e.get('https://example.test/app/index.html')).text(),'online content');});
test('Offline without cached shell rejects rather than fabricating content',async()=>{const e=env();e.offline();await A.rejects(e.get('https://example.test/app/index.html'));});
