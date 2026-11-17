/* Better Half service worker: offline app shell + push notifications */
const CACHE='bh-v4';
const SHELL=['./','index.html','css/app.css','firebase-config.js','js/icons.js','js/avatar.js','js/bus.js','js/app.js','js/chat.js','js/touch.js','js/games.js','js/plans.js','js/main.js','manifest.webmanifest','icons/icon-192.png','icons/icon-96.png'];
self.addEventListener('install',e=>{ e.waitUntil(caches.open(CACHE).then(c=>c.addAll(SHELL)).then(()=>self.skipWaiting())); });
self.addEventListener('activate',e=>{ e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())); });
self.addEventListener('fetch',e=>{ const u=new URL(e.request.url); if(e.request.method!=='GET'||u.origin!==location.origin) return;
  e.respondWith(fetch(e.request).then(r=>{ const cp=r.clone(); caches.open(CACHE).then(c=>c.put(e.request,cp)); return r; }).catch(()=>caches.match(e.request).then(r=>r||caches.match('index.html')))); });
/* Push from the optional Cloud Function (messages stay encrypted; only a short label is sent) */
self.addEventListener('push',e=>{ let d={}; try{ d=e.data.json(); }catch(x){ d={notification:{title:'Better Half',body:e.data&&e.data.text()}}; }
  const n=d.notification||d.data||{}; const title=n.title||'Better Half', body=n.body||'You have something new 💞';
  e.waitUntil(self.registration.showNotification(title,{body,icon:'icons/icon-192.png',badge:'icons/icon-96.png',tag:(d.data&&d.data.kind)||'bh',renotify:true,vibrate:[60,40,60],data:{target:(d.data&&d.data.target)||'home'}})); });
self.addEventListener('notificationclick',e=>{ e.notification.close(); const target=(e.notification.data||{}).target;
  e.waitUntil(self.clients.matchAll({type:'window',includeUncontrolled:true}).then(cs=>{ for(const c of cs){ c.postMessage({target}); return c.focus(); } return self.clients.openWindow('./index.html'); })); });
