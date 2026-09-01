const CACHE="beparytech-v49";
const RUNTIME="beparytech-v49-security-runtime";
const SHELL=["./","./index.html","./style.css?v=39","./app.js?v=39","./manifest.json?v=39","./beparytech-logo.png","./icon-192.png","./icon-512.png","./apple-touch-icon.png","./favicon-64.png"];
self.addEventListener("install",event=>{
  self.skipWaiting();
  event.waitUntil(caches.open(CACHE).then(cache=>Promise.allSettled(SHELL.map(url=>cache.add(url)))));
});
self.addEventListener("activate",event=>{
  event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>![CACHE,RUNTIME].includes(k)).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});
self.addEventListener("fetch",event=>{
  const req=event.request;
  if(req.method!=="GET") return;
  const url=new URL(req.url);
  if(url.origin!==self.location.origin) return;
  if(req.mode==="navigate"){
    event.respondWith(fetch(req,{cache:"no-store"}).then(res=>{const copy=res.clone();caches.open(CACHE).then(c=>c.put("./index.html",copy));return res;}).catch(()=>caches.match("./index.html")));
    return;
  }
  const isImage=req.destination==="image";
  if(isImage){
    event.respondWith(caches.open(RUNTIME).then(async cache=>{const hit=await cache.match(req);const network=fetch(req).then(res=>{if(res.ok)cache.put(req,res.clone());return res;}).catch(()=>hit);return hit||network;}));
    return;
  }
  event.respondWith(fetch(req,{cache:"no-store"}).then(res=>{if(res.ok)caches.open(CACHE).then(c=>c.put(req,res.clone()));return res;}).catch(()=>caches.match(req)));
});
