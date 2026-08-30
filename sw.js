const CACHE="beparytech-vetri-v8-responsive-universal";
const ASSETS=["./","./index.html","./style.css","./app.js","./manifest.json","./beparytech-logo.png","./icon-192.png","./icon-512.png","./apple-touch-icon.png","./favicon-64.png"];
self.addEventListener("install",e=>{self.skipWaiting();e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)))});
self.addEventListener("activate",e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener("fetch",e=>e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request))));
