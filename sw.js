const CACHE="beparytech-vetri-v16-login-ordini";
const ASSETS=["./","./index.html","./style.css","./app.js","./manifest.json","./beparytech-logo.png","./icon-192.png","./icon-512.png","./apple-touch-icon.png","./favicon-64.png","./iphone-11-pro-max.png","./iphone-11-pro.png","./iphone-11.png","./iphone-12-mini.png","./iphone-12-pro-max.png","./iphone-12-pro.png","./iphone-12.png","./iphone-13-mini.png","./iphone-13-pro-max.png","./iphone-13-pro.png","./iphone-13.png","./iphone-14-plus.png","./iphone-14-pro-max.png","./iphone-14-pro.png","./iphone-14.png","./iphone-15-plus.png","./iphone-15-pro-max.png","./iphone-15-pro.png","./iphone-15.png","./iphone-16-plus.png","./iphone-16-pro-max.png","./iphone-16-pro.png","./iphone-16.png","./iphone-16e.png","./iphone-17-pro-max.png","./iphone-17-pro.png","./iphone-17.png","./iphone-17e.png","./iphone-7-plus.png","./iphone-7.png","./iphone-8-plus.png","./iphone-8.png","./iphone-air.png","./iphone-se-2a-gen.png","./iphone-se-3a-gen.png","./iphone-x.png","./iphone-xr.png","./iphone-xs-max.png","./iphone-xs.png"];
self.addEventListener("install",e=>{self.skipWaiting();e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)))});
self.addEventListener("activate",e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener("fetch", e => {
  if (e.request.method !== "GET") return;
  if (e.request.mode === "navigate") {
    e.respondWith(fetch(e.request).then(r => {
      const copy=r.clone(); caches.open(CACHE).then(c=>c.put("./index.html",copy)); return r;
    }).catch(()=>caches.match("./index.html")));
    return;
  }
  e.respondWith(fetch(e.request).then(r=>{
    const copy=r.clone(); caches.open(CACHE).then(c=>c.put(e.request,copy)); return r;
  }).catch(()=>caches.match(e.request)));
});
