const V='gemdig-v1';
const FILES=['./','index.html','game.js','manifest.webmanifest','art/amethyst.png','art/bg.png','art/bone.png','art/emerald.png','art/ice.png','art/icon.png','art/prism.png','art/rose.png','art/ruby.png','art/sapphire.png','art/topaz.png','art/maple/idle_0.png','art/maple/idle_1.png','art/maple/idle_2.png','art/maple/idle_3.png','art/maple/idle_4.png','art/maple/idle_5.png','art/maple/idle_6.png','art/maple/idle_7.png','art/maple/jump_0.png','art/maple/jump_1.png','art/maple/jump_2.png','art/maple/jump_3.png','art/maple/jump_4.png','art/maple/jump_5.png','art/maple/jump_6.png','art/maple/jump_7.png','art/maple/pant_0.png','art/maple/pant_1.png','art/maple/pant_2.png','art/maple/pant_3.png','art/maple/pant_4.png','art/maple/pant_5.png','art/maple/pant_6.png','art/maple/pant_7.png','art/maple/wag_0.png','art/maple/wag_1.png','art/maple/wag_2.png','art/maple/wag_3.png','art/maple/wag_4.png','art/maple/wag_5.png','art/maple/wag_6.png','art/maple/wag_7.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(V).then(c=>c.addAll(FILES)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==V).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{
  if(e.request.method!=='GET')return;
  e.respondWith(caches.match(e.request,{ignoreSearch:true}).then(hit=>{
    const net=fetch(e.request).then(r=>{if(r.ok){const cp=r.clone();caches.open(V).then(c=>c.put(e.request,cp))}return r}).catch(()=>hit);
    return hit||net;
  }));
});
