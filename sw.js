/* Optional app-shell cache; personal music is never sent here or to a server. */
'use strict';
const CACHE='DIVA-PULSE-MMD-DIRECTOR-34.0.0';
const SHELL=['./','./index.html','./manifest.webmanifest','./icons/icon-192.png','./icons/icon-512.png'];
const allowed=new Set(SHELL.map(path=>new URL(path,self.registration.scope).href));
self.addEventListener('install',event=>{
 event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(SHELL)));
 // No skipWaiting: never replace the runtime underneath a playing session.
});
self.addEventListener('activate',event=>{
 event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>(k.startsWith('DIVA-PULSE-ENCORE-')||k.startsWith('DIVA-PULSE-MMD-DIRECTOR-'))&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch',event=>{
 const request=event.request,url=new URL(request.url);
 if(request.method!=='GET'||url.origin!==self.location.origin)return;
 url.search='';url.hash='';if(!allowed.has(url.href))return;
 event.respondWith((async()=>{
  const cache=await caches.open(CACHE);
  try{const response=await fetch(request);if(response.ok){try{await cache.put(url.href,response.clone());}catch{/* A full cache must not break an otherwise valid network response. */}}return response;}
  catch(error){const cached=await cache.match(url.href);if(cached)return cached;throw error;}
 })());
});
