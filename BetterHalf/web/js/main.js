/* Better Half – start-up */
(function(){
  chatLoad(); awayQ=S.get('away',[]); INV=S.get('inv',[]);
  micSetup(); pipDrag(); kissSetup(); holdSetup(); walkieSetup(); kpSetup(); tapsSetup(); caromSetup(); bbSetup(); hkSetup(); syncSend(); applyWp();
  const j=QS.get('join'); if(j) setTimeout(()=>{ if($('codeIn')) $('codeIn').value=j; },500);
  window.afterConnect=()=>{ renderGames(); jarSummary(); };
  setInterval(alarmTick,15000);
  // keep the session fresh when the app comes back to the front
  document.addEventListener('visibilitychange',()=>{ if(!document.hidden&&BUS&&BUS.cid){ if(BUS.drain) BUS.drain(); BUS.screen(cur); alarmTick(); if(cur==='home') drawStage(); } });
  window.addEventListener('pageshow',()=>{ if(BUS&&BUS.cid&&BUS.drain) BUS.drain(); });
  // service worker: offline shell + notifications (needs https; skipped in the two-phone test page)
  if('serviceWorker' in navigator && location.protocol==='https:' && !ROLE) navigator.serviceWorker.register('sw.js').catch(e=>console.warn('sw',e));
  if(navigator.serviceWorker) navigator.serviceWorker.addEventListener('message',e=>{ if(e.data&&e.data.target) go(e.data.target); });
  // test page controls (demo.html can switch a phone "off" to test offline delivery)
  window.addEventListener('message',e=>{ const d=e.data||{}; if(d.bhCmd==='offline'&&BUS.setOffline){ BUS.setOffline(d.v); if(!d.v){ BUS.drain(); BUS.screen(cur); } } });
  boot().catch(e=>{ console.error(e); toast('Something went wrong starting the app'); });
})();
