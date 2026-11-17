/* Better Half – touch features (all synced live or through the inbox) */

/* ---------- nudge ---------- */
function shakePhone(){ const p=$('phone'); p.classList.remove('shake'); void p.offsetWidth; p.classList.add('shake'); }
function nudge(){ shakePhone(); buzz(VIB.nudge); BUS.send('nudge',{},{kind:'nudge'}); sysMsg('You nudged '+HER()); toast('Nudge sent'+(PRES.online?'':' · '+P3().s+' gets it when '+P3().s+' comes online')); }
handle('nudge',(b,ev,fresh)=>{ if(fresh) shakePhone(); sysMsg(HER()+' nudged you'+(fresh?'':' · '+tfmt(ev.ts))); notifyUser('zap',HER()+' nudged you!',fresh?'Tap to nudge back':'While you were away','chat','nudge',{always:true}); });

/* ---------- overlays on the receiver's screen ---------- */
let ovlAnim=null;
function overlay(kind,data){ const o=$('ovl'); cancelAnimationFrame(ovlAnim); o.innerHTML=''; o.className='ovl';
  if(kind==='lips'){ o.className='ovl tap'; o.onclick=()=>{o.innerHTML='';o.className='ovl';}; const W=o.clientWidth,H=o.clientHeight; data.marks.forEach((m,i)=>{ const d=document.createElement('div'); d.className='lip'; d.style.left=(m.x*W)+'px'; d.style.top=(m.y*H)+'px'; d.style.setProperty('--r',m.r+'deg'); d.style.setProperty('--s',m.s); d.style.animationDelay=(i*.18)+'s'; d.innerHTML=lipSVG(m.c); o.appendChild(d); }); setTimeout(()=>{ o.innerHTML=''; o.className='ovl'; },7000); return; }
  if(kind==='fx'){ const cv=document.createElement('canvas'); cv.width=o.clientWidth; cv.height=o.clientHeight; o.appendChild(cv); runFx(cv,data.fx,cv.width,cv.height,6500,()=>{ o.innerHTML=''; }); return; }
  if(kind==='star'){ o.className='ovl tap'; const cv=document.createElement('canvas'); cv.width=o.clientWidth; cv.height=o.clientHeight; o.appendChild(cv); const c=cv.getContext('2d'); let t=0; const W=cv.width,H=cv.height;
    const loop=()=>{ t+=.012; c.clearRect(0,0,W,H); c.fillStyle=`rgba(5,4,20,${Math.min(.55,t)})`; c.fillRect(0,0,W,H); const k=Math.min(1,t*1.2), x=-40+(W*.7)*k, y=40+(H*.35)*k; const g=c.createLinearGradient(x,y,x-120,y-70); g.addColorStop(0,'#fff'); g.addColorStop(.25,'rgba(249,168,212,.8)'); g.addColorStop(1,'rgba(168,85,247,0)'); c.strokeStyle=g; c.lineWidth=4; c.lineCap='round'; c.beginPath(); c.moveTo(x,y); c.lineTo(x-120,y-70); c.stroke(); c.fillStyle='#fff'; c.shadowColor='#fff'; c.shadowBlur=24; c.beginPath(); c.arc(x,y,5,0,7); c.fill(); c.shadowBlur=0;
      if(k>=1){ c.font='700 15px Plus Jakarta Sans,sans-serif'; c.textAlign='center'; c.fillStyle='#fff'; c.fillText('Tap the star to read '+P3().p.replace('their','their')+' wish',W/2,y+50); } ovlAnim=requestAnimationFrame(loop); };
    loop(); o.onclick=()=>{ cancelAnimationFrame(ovlAnim); o.innerHTML=`<div style="position:absolute;inset:0;background:rgba(5,4,20,.7);display:flex;align-items:center;justify-content:center;padding:30px"><div class="note" style="text-align:center">✨ ${esc(data.wish)}<div style="font-size:13px;margin-top:8px;opacity:.7">— a wish from ${esc(HER())}</div></div></div>`; o.onclick=()=>{ o.innerHTML=''; o.className='ovl'; }; }; return; }
  if(kind==='taps'){ const W=o.clientWidth,H=o.clientHeight; let i=0; const ring=()=>{ const r=document.createElement('div'); r.className='rip'; r.style.cssText=`position:absolute;left:${W/2-110}px;top:${H/2-110}px;width:220px;height:220px;border-radius:50%;border:3px solid #f0abfc`; o.appendChild(r); setTimeout(()=>r.remove(),900); }; data.pattern.forEach((d,k)=>{ if(k%2===0) setTimeout(ring,data.pattern.slice(0,k).reduce((a,b)=>a+b,0)); }); const t=document.createElement('div'); t.style.cssText=`position:absolute;left:0;right:0;top:${H/2+130}px;text-align:center;font:800 22px Outfit,sans-serif;text-shadow:0 0 20px #ff4d8d`; t.textContent=data.meaning; o.appendChild(t); setTimeout(()=>{ o.innerHTML=''; },3800); }
}

/* ---------- thumb kiss (live) ---------- */
let kAnim, kStars=[], kMe=null, kHer=null, kHerAt=0, kisses=0, lastK=0, kLastSend=0;
onScreen('kiss',()=>{ kisses=S.get('kissDay',{d:'',n:0}).d===new Date().toDateString()?S.get('kissDay').n:0; $('kissCount').textContent='Kisses today · '+kisses;
  BUS.send('kissInvite',{},{kind:'touch'}); BUS.live('kiss',{in:true,down:false}); kissHint();
  const A=$('kissArea'), cv=$('kcv'); cv.width=A.clientWidth; cv.height=A.clientHeight; const c=cv.getContext('2d');
  kStars=Array.from({length:60},()=>({x:Math.random()*cv.width,y:Math.random()*cv.height,r:Math.random()*1.6+.3,v:Math.random()*.3+.05,a:Math.random()*6}));
  const step=()=>{ const w=A.clientWidth,h=A.clientHeight; c.clearRect(0,0,cv.width,cv.height);
    kStars.forEach(s=>{ s.y-=s.v; if(s.y<0)s.y=h; s.a+=.02; c.globalAlpha=.4+Math.sin(s.a)*.3; c.fillStyle='#fff'; c.beginPath(); c.arc(s.x,s.y,s.r,0,7); c.fill(); }); c.globalAlpha=1;
    const herOn=kHer&&kHer.down&&Date.now()-kHerAt<1500; $('tHer').style.opacity=herOn?1:0;
    if(herOn){ const hx=kHer.x*w, hy=kHer.y*h; $('tHer').style.left=hx+'px'; $('tHer').style.top=hy+'px';
      if(kMe){ const d=Math.hypot(kMe.x-hx,kMe.y-hy); if(d<140){ c.strokeStyle=`rgba(255,120,180,${1-d/140})`; c.lineWidth=2; c.beginPath(); c.moveTo(kMe.x,kMe.y); c.lineTo(hx,hy); c.stroke(); }
        if(d<50&&Date.now()-lastK>1400){ lastK=Date.now(); kisses++; S.set('kissDay',{d:new Date().toDateString(),n:kisses}); $('kissCount').textContent='Kisses today · '+kisses; burst(A,hx,hy,'#ff4d8d',16); buzz(VIB.kiss); $('kissHint').innerHTML='💋 Kiss! You both felt it'; } } }
    kAnim=requestAnimationFrame(step); };
  cancelAnimationFrame(kAnim); step();
},()=>{ cancelAnimationFrame(kAnim); BUS.live('kiss',{in:false,down:false}); });
function kissHint(){ if(cur!=='kiss') return; const here=PRES.online&&PRES.screen==='kiss'; $('kissHint').innerHTML=here?'<b>'+esc(HER())+'</b> is here · press, hold and find each other':PRES.online?'Waiting for <b>'+esc(HER())+'</b> to open Thumb Kiss…':esc(HER())+' is offline · '+P3().s+'\'ll get your invite'; }
document.addEventListener('presence',kissHint);
onLiveCh('kiss',d=>{ kHer=d; kHerAt=Date.now(); });
handle('kissInvite',(b,ev,fresh)=>{ if(!fresh) return; if(cur==='kiss') return; notifyUser('kiss',HER()+' wants a thumb kiss','Tap to join now','kiss','kiss'); });
function kissSetup(){ const A=$('kissArea'); const pos=e=>{const r=A.getBoundingClientRect();return{x:e.clientX-r.left,y:e.clientY-r.top}};
  const send=(down)=>{ const now=Date.now(); if(down&&now-kLastSend<40) return; kLastSend=now; BUS.live('kiss',{in:true,down,x:kMe?kMe.x/A.clientWidth:0,y:kMe?kMe.y/A.clientHeight:0}); };
  A.addEventListener('pointerdown',e=>{A.setPointerCapture(e.pointerId);kMe=pos(e);$('tMe').style.opacity=1;mv();buzz(15);send(true);});
  A.addEventListener('pointermove',e=>{if(!kMe)return;kMe=pos(e);mv();send(true);});
  ['pointerup','pointercancel'].forEach(ev=>A.addEventListener(ev,()=>{kMe=null;$('tMe').style.opacity=0;send(false);}));
  setInterval(()=>{ if(cur==='kiss'&&kMe) send(true); },700);
  function mv(){$('tMe').style.left=kMe.x+'px';$('tMe').style.top=kMe.y+'px';} }

/* ---------- hold together (live) ---------- */
let hMe=false,hHer=false,hHerAt=0,hT0=0,hIv,hBoth=false;
onScreen('hold',()=>{ $('holdHeart').innerHTML=heartSVG('#ff4d8d',70); const b=BUS.get('holdBest'); $('holdBest').textContent='Longest together: '+((b&&b.s)||0)+'s'; holdTxt(); BUS.send('holdInvite',{},{kind:'touch'}); },()=>{ if(hMe) holdUp(); BUS.live('hold',{down:false}); });
function holdTxt(){ if(cur!=='hold'||hBoth) return; $('holdTxt').textContent=hMe?(PRES.online?'Waiting for '+HER()+' to hold too…':HER()+' is offline'):(hHer?HER()+' is holding · hold yours!':'Press and hold your circle'); }
handle('holdInvite',(b,ev,fresh)=>{ if(fresh&&cur!=='hold') notifyUser('hands',HER()+' wants to hold together','Open Hold Together','hold','act'); });
onLiveCh('hold',d=>{ hHer=!!d.down; hHerAt=Date.now(); $('hcHer')&&$('hcHer').classList.toggle('on',hHer); checkBoth(); holdTxt(); });
function holdSetup(){ const el=$('hcMe');
  el.addEventListener('pointerdown',e=>{ el.setPointerCapture(e.pointerId); hMe=true; el.classList.add('on'); buzz(20); BUS.live('hold',{down:true}); checkBoth(); holdTxt(); });
  ['pointerup','pointercancel'].forEach(ev=>el.addEventListener(ev,holdUp));
  setInterval(()=>{ if(cur==='hold'&&hMe) BUS.live('hold',{down:true}); if(hHer&&Date.now()-hHerAt>2600){ hHer=false; $('hcHer').classList.remove('on'); checkBoth(); holdTxt(); } },900); }
function checkBoth(){ const both=hMe&&hHer; if(both&&!hBoth){ hBoth=true; $('beam').classList.add('on'); $('holdHeart').style.transform='translate(-50%,-30%) scale(1)'; $('holdTxt').textContent='Connected · you\'re holding each other'; hT0=Date.now(); clearInterval(hIv); hIv=setInterval(()=>{ const s=Math.floor((Date.now()-hT0)/1000); $('holdT').textContent=s+'s'; buzz(40); $('holdHeart').style.transform=`translate(-50%,-30%) scale(${1+Math.min(s,20)*.04})`; },1000); }
  if(!both&&hBoth){ hBoth=false; clearInterval(hIv); $('beam').classList.remove('on'); $('holdHeart').style.transform='translate(-50%,-30%) scale(0)'; const s=Math.floor((Date.now()-hT0)/1000); $('holdTxt').textContent='You held each other for '+s+'s'; const b=BUS.get('holdBest'); if(!b||s>b.s){ BUS.setState('holdBest',{s}); $('holdBest').textContent='Longest together: '+s+'s 🏆'; } } }
function holdUp(){ if(!hMe) return; hMe=false; $('hcMe').classList.remove('on'); BUS.live('hold',{down:false}); checkBoth(); holdTxt(); }

/* ---------- walkie-talkie ---------- */
let wkIv, wkT0=0, wkOn=false, wkPending=null;
onScreen('walkie',()=>{ wkState(); if(wkPending){ const p=wkPending; wkPending=null; playWalkie(p); } });
function wkState(){ if(cur!=='walkie') return; $('wkState').innerHTML=PRES.online?`<span class="online">${esc(HER())} is online · ${P3().s} hears you instantly</span>`:`${esc(HER())} is offline · ${P3().s}'ll get it as a voice notification`; }
document.addEventListener('presence',wkState);
function walkieSetup(){ const b=$('wtBtn'); $('wbars').innerHTML='<i></i>'.repeat(28);
  b.addEventListener('pointerdown',async e=>{ b.setPointerCapture(e.pointerId); wkOn=true; wkT0=Date.now(); b.classList.add('on'); $('wtLbl').textContent='Live · 0s'; buzz(25); animBars(true,'me'); BUS.live('wk',{on:true}); await recStart(); if(!wkOn) recCancel(); });
  const up=async()=>{ if(!wkOn) return; wkOn=false; b.classList.remove('on'); animBars(false); $('wtLbl').textContent='Hold to talk'; BUS.live('wk',{on:false});
    if(Date.now()-wkT0<500){ recCancel(); toast('Hold to talk'); return; } const r=await recStop(); await BUS.send('walkie',{data:r.data,dur:r.dur},{kind:'walkie'}); $('wkState').innerHTML='Sent'+(PRES.online?' · playing on '+P3().p+' phone':' · delivered when '+P3().s+' comes online')+(r.sim?' (mic not available here)':''); };
  b.addEventListener('pointerup',up); b.addEventListener('pointercancel',up); }
function animBars(on,who){ clearInterval(wkIv); const bars=[...$('wbars').children]; if(!on){ bars.forEach(x=>x.style.height='6px'); return; } bars.forEach(x=>x.style.background=who==='her'?'linear-gradient(#ff4d8d,#f472b6)':''); wkIv=setInterval(()=>{ bars.forEach(x=>x.style.height=(6+Math.random()*34)+'px'); if(wkOn) $('wtLbl').textContent='Live · '+Math.floor((Date.now()-wkT0)/1000)+'s'; },110); }
onLiveCh('wk',d=>{ if(cur!=='walkie') return; if(d.on){ $('wkState').innerHTML='<b style="color:#ff9cc2">'+esc(HER())+' is talking…</b>'; $('wkAv').style.boxShadow='0 0 0 6px rgba(255,77,141,.4),0 0 30px #ff4d8d'; animBars(true,'her'); } else { animBars(false); $('wkAv').style.boxShadow=''; } });
handle('walkie',(b,ev,fresh)=>{ const auto=S.get('walkieAuto',true)!==false;
  if(fresh&&!document.hidden&&auto){ playWalkie(b); notifyUser('radio',HER()+' · walkie-talkie','Playing now ('+b.dur+'s)','walkie','msg'); }
  else { wkPending=b; notifyUser('radio',HER()+' sent a walkie message',(fresh?'':'While you were away · ')+'Tap to listen ('+b.dur+'s)','walkie','msg',{always:true}); }
  CHAT.push({id:uidGen(),from:'her',kind:'voice',data:b.data,dur:b.dur,ts:ev.ts}); chatSave(); });
function playWalkie(b){ if(cur==='walkie'){ $('wkState').innerHTML='<b style="color:#ff9cc2">'+esc(HER())+' is talking…</b>'; animBars(true,'her'); setTimeout(()=>{ animBars(false); wkState(); },(b.dur||2)*1000); }
  if(!b.data) return; const a=new Audio(b.data); a.play().catch(()=>banner('radio',`<b>${esc(HER())}</b> sent a walkie message`,[{t:'Play',f:()=>new Audio(b.data).play()}])); }

/* ---------- kiss print ---------- */
const LIPC=['#e11d48','#ff4d8d','#9d174d','#c2410c','#a855f7']; let lipC=LIPC[0], lipN=0, LIPS=[];
function lipSVG(c){ lipN++; return `<svg viewBox="0 0 60 40" width="100%" height="100%"><defs><linearGradient id="lg${lipN}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${shade(c,30)}"/><stop offset="1" stop-color="${shade(c,-30)}"/></linearGradient></defs><path d="M4 19 C10 9 20 5 30 12 C40 5 50 9 56 19 C46 21 38 23 30 23 C22 23 14 21 4 19Z" fill="url(#lg${lipN})"/><path d="M4 20 C12 35 48 35 56 20 C46 25 38 27 30 27 C22 27 14 25 4 20Z" fill="url(#lg${lipN})"/><path d="M16 14 C20 11 24 11 27 14M33 14 C36 11 40 11 44 14" stroke="#fff" stroke-opacity=".35" stroke-width="1.5" fill="none"/><path d="M14 27 C22 31 38 31 46 27" stroke="#000" stroke-opacity=".15" stroke-width="1.2" fill="none"/></svg>`; }
function kpSetup(){ $('lipCols').innerHTML=LIPC.map((c,i)=>`<button class="${i?'':'on'}" style="background:${c};color:${c}" onclick="lipC='${c}';[...this.parentNode.children].forEach(x=>x.classList.remove('on'));this.classList.add('on')"></button>`).join('');
  const P=$('kissPad'); P.addEventListener('pointerdown',e=>{ const r=P.getBoundingClientRect(); const m={x:(e.clientX-r.left)/r.width,y:(e.clientY-r.top)/r.height,r:Math.round(Math.random()*50-25),s:(.8+Math.random()*.5).toFixed(2),c:lipC}; LIPS.push(m); const d=document.createElement('div'); d.className='lip'; d.style.left=(m.x*r.width)+'px'; d.style.top=(m.y*r.height)+'px'; d.style.setProperty('--r',m.r+'deg'); d.style.setProperty('--s',m.s); d.innerHTML=lipSVG(m.c); P.appendChild(d); $('kpHint').style.opacity=0; buzz(25); }); }
function clearLips(){ LIPS=[]; $('kissPad').querySelectorAll('.lip').forEach(l=>l.remove()); $('kpHint').style.opacity=1; }
function sendLips(){ if(!LIPS.length) return toast('Leave a kiss first'); BUS.send('kisses',{marks:LIPS.slice(0,30)},{kind:'touch'}); toast(LIPS.length+' kiss'+(LIPS.length>1?'es':'')+' sent'); clearLips(); }
handle('kisses',(b,ev,fresh)=>{ const show=()=>overlay('lips',b); if(!document.hidden) show(); else document.addEventListener('visibilitychange',function f(){ if(!document.hidden){ show(); document.removeEventListener('visibilitychange',f);} });
  notifyUser('lips',HER()+' left '+b.marks.length+' kiss'+(b.marks.length>1?'es':'')+' on your screen',fresh?'💋':'While you were away','home','kiss'); });

/* ---------- screen surprise ---------- */
const SFX=[['fireflies','Fireflies'],['petals','Rose petals'],['hearts','Neon hearts'],['bubbles','Love bubbles'],['fireworks','Fireworks'],['snow','Heart snow']];
let sfx='fireflies', sAnim;
function runFx(cv,kind,W,H,ms,done){ const c=cv.getContext('2d'); let P=[], t=0, t0=Date.now(); const sc=W/200;
  const heart=(x,y,s)=>{ c.beginPath(); c.moveTo(x,y+s*.3); c.bezierCurveTo(x,y,x-s*.5,y,x-s*.5,y+s*.3); c.bezierCurveTo(x-s*.5,y+s*.6,x,y+s*.8,x,y+s); c.bezierCurveTo(x,y+s*.8,x+s*.5,y+s*.6,x+s*.5,y+s*.3); c.bezierCurveTo(x+s*.5,y,x,y,x,y+s*.3); c.fill(); };
  const loop=()=>{ t++; c.clearRect(0,0,W,H); const fade=ms?Math.max(0,Math.min(1,(ms-(Date.now()-t0))/800)):1; c.globalAlpha=fade;
    if(kind==='fireflies'){ if(P.length<26*sc) P.push({x:Math.random()*W,y:Math.random()*H,a:Math.random()*6,s:(Math.random()*.6+.2)*sc}); P.forEach(p=>{ p.a+=.04; p.x+=Math.cos(p.a)*p.s; p.y+=Math.sin(p.a*.7)*p.s-.15*sc; const r=9*sc; const g=c.createRadialGradient(p.x,p.y,0,p.x,p.y,r); g.addColorStop(0,'rgba(253,230,138,'+(.6+Math.sin(p.a*2)*.4)+')'); g.addColorStop(1,'rgba(253,230,138,0)'); c.fillStyle=g; c.beginPath(); c.arc(p.x,p.y,r,0,7); c.fill(); if(p.y<-10)p.y=H+10; }); }
    if(kind==='petals'){ if(t%Math.max(1,Math.round(6/sc))===0) P.push({x:Math.random()*W*1.1-10,y:-10,r:Math.random()*6,v:(1+Math.random())*sc,w:Math.random()*6}); P.forEach(p=>{ p.y+=p.v; p.w+=.05; p.x+=Math.sin(p.w)*.8*sc; p.r+=.03; c.save(); c.translate(p.x,p.y); c.rotate(p.r); c.scale(sc,sc); c.fillStyle='rgba(244,63,94,.85)'; c.beginPath(); c.ellipse(0,0,6,3.5,0,0,7); c.fill(); c.fillStyle='rgba(255,255,255,.25)'; c.beginPath(); c.ellipse(-1,-1,3,1.4,0,0,7); c.fill(); c.restore(); }); P=P.filter(p=>p.y<H+20); }
    if(kind==='hearts'){ if(t%10===0) P.push({x:Math.random()*W,y:H+10,s:(10+Math.random()*14)*sc,v:(.8+Math.random())*sc,h:rnd(['#ff4d8d','#c026d3','#22d3ee'])}); P.forEach(p=>{ p.y-=p.v; c.shadowColor=p.h; c.shadowBlur=14; c.fillStyle=p.h; heart(p.x,p.y,p.s); c.shadowBlur=0; }); P=P.filter(p=>p.y>-40); }
    if(kind==='bubbles'){ if(t%9===0) P.push({x:Math.random()*W,y:H+10,r:(5+Math.random()*12)*sc,v:(.6+Math.random()*.8)*sc,w:Math.random()*6}); P.forEach(p=>{ p.y-=p.v; p.w+=.03; p.x+=Math.sin(p.w)*.5*sc; c.strokeStyle='rgba(165,243,252,.8)'; c.lineWidth=1.3; c.beginPath(); c.arc(p.x,p.y,p.r,0,7); c.stroke(); c.fillStyle='rgba(255,255,255,.5)'; c.beginPath(); c.arc(p.x-p.r*.35,p.y-p.r*.35,p.r*.22,0,7); c.fill(); }); P=P.filter(p=>p.y>-30); }
    if(kind==='fireworks'){ if(t%45===1){ const x=W*.15+Math.random()*W*.7,y=H*.15+Math.random()*H*.4,h=rnd(['#ff4d8d','#facc15','#22d3ee','#a855f7']); for(let i=0;i<40;i++){const a=i/40*Math.PI*2,v=(1+Math.random()*1.8)*sc; P.push({x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v,l:60,h});} } P.forEach(p=>{ p.x+=p.vx; p.y+=p.vy; p.vy+=.03*sc; p.l--; c.globalAlpha=Math.max(0,p.l/60)*fade; c.fillStyle=p.h; c.shadowColor=p.h; c.shadowBlur=8; c.beginPath(); c.arc(p.x,p.y,1.8*sc,0,7); c.fill(); }); c.shadowBlur=0; P=P.filter(p=>p.l>0); }
    if(kind==='snow'){ if(t%5===0) P.push({x:Math.random()*W,y:-10,s:(5+Math.random()*7)*sc,v:(.5+Math.random()*.8)*sc,w:Math.random()*6}); P.forEach(p=>{ p.y+=p.v; p.w+=.03; p.x+=Math.sin(p.w)*.4*sc; c.fillStyle='rgba(255,255,255,.85)'; heart(p.x,p.y,p.s); }); P=P.filter(p=>p.y<H+20); }
    c.globalAlpha=1; if(ms&&Date.now()-t0>ms){ done&&done(); return; } const id=requestAnimationFrame(loop); if(!ms) sAnim=id; else ovlAnim=id; };
  loop(); }
onScreen('surprise',()=>{ $('sfx').innerHTML=SFX.map(s=>`<button class="chip ${sfx===s[0]?'on':''}" onclick="sfx='${s[0]}';cancelAnimationFrame(sAnim);HOOKS.surprise.enter()">${s[1]}</button>`).join(''); cancelAnimationFrame(sAnim); runFx($('scv'),sfx,200,360,0); },()=>cancelAnimationFrame(sAnim));
function sendSurprise(){ const n=SFX.find(s=>s[0]===sfx)[1]; BUS.send('surprise',{fx:sfx},{kind:'touch'}); toast(n+(PRES.online?' is playing on '+P3().p+' screen':' · plays when '+P3().s+' opens the app')); }
handle('surprise',(b,ev,fresh)=>{ const n=(SFX.find(s=>s[0]===b.fx)||[0,'A surprise'])[1]; const show=()=>overlay('fx',{fx:b.fx}); if(!document.hidden) show(); else document.addEventListener('visibilitychange',function f(){ if(!document.hidden){ show(); document.removeEventListener('visibilitychange',f);} }); notifyUser('wand','Screen surprise from '+HER(),n,null,'act'); });

/* ---------- love taps ---------- */
const CODES=[[1,'Thinking of you'],[2,'Miss you'],[3,'I love you'],[4,'Call me when free'],['L','Come home soon']];
function tapsSetup(){
  $('tapLegend').innerHTML=CODES.map(c=>`<div><span class="dots">${c[0]==='L'?'<i class="lg"></i>':'<i></i>'.repeat(c[0])}</span><b style="flex:1;text-align:right">${c[1]}</b></div>`).join('')+'<div><span class="mu">Any other rhythm</span><b>Your secret signal</b></div>';
  const p=$('tapPad'); let times=[], to, lp, longDone=false, t0=0;
  p.addEventListener('pointerdown',()=>{ longDone=false; t0=Date.now(); clearTimeout(to); const r=document.createElement('span'); r.className='rip'; p.appendChild(r); setTimeout(()=>r.remove(),800); buzz(35); lp=setTimeout(()=>{ longDone=true; times=[]; drawRh([{t:0,d:600}]); send('Come home soon',[600]); },650); });
  p.addEventListener('pointerup',()=>{ clearTimeout(lp); if(longDone) return; times.push({t:t0,d:Date.now()-t0}); drawRh(times); $('tapLbl').textContent=times.length+' tap'+(times.length>1?'s':'');
    to=setTimeout(()=>{ const n=times.length; const gaps=times.slice(1).map((x,i)=>x.t-times[i].t); const irregular=gaps.length>1&&Math.max(...gaps)-Math.min(...gaps)>260; const code=CODES.find(c=>c[0]===n);
      const pattern=[]; times.forEach((x,i)=>{ pattern.push(Math.min(400,Math.max(60,x.d))); if(i<times.length-1) pattern.push(Math.min(600,times[i+1].t-x.t-x.d)); });
      send(irregular?'A secret signal':(code?code[1]:'Call me when free'),pattern); times=[]; },900); });
  function send(m,pattern){ $('tapLbl').textContent='Tap a rhythm'; $('tapOut').innerHTML='<span class="gt">Sent: '+m+'</span>'; BUS.send('taps',{meaning:m,pattern},{kind:'touch'}); }
}
function drawRh(ts){ const rh=$('rhythm'); if(!ts.length){rh.innerHTML='';return;} rh.innerHTML=ts.map((x,i)=>{ const gap=i?Math.min(40,(x.t-ts[i-1].t)/14):0; return `<span style="width:${gap}px"></span><i style="width:${Math.max(10,Math.min(60,x.d/8))}px"></i>`; }).join(''); }
handle('taps',(b,ev,fresh)=>{ if(fresh){ buzz(b.pattern); if(!document.hidden) overlay('taps',b); } notifyUser('taps',HER()+': '+b.meaning,'Love tap'+(fresh?'':' · while you were away'),null,'taps',{silentVib:true}); });

/* ---------- shooting star ---------- */
let skyAnim, skyStars=[], shooting=null;
onScreen('wish',()=>{ const n=(BUS.get('sky')||{n:0}).n; $('skyN').textContent='Your shared sky · '+n+' star'+(n===1?'':'s'); const cv=$('skyc'), c=cv.getContext('2d'); const W=cv.width,H=cv.height; skyStars=Array.from({length:110},(_, i)=>({x:Math.random()*W,y:Math.random()*H*.85,r:Math.random()*1.4+.3,a:Math.random()*6,our:i<n}));
  const loop=()=>{ const g=c.createLinearGradient(0,0,0,H); g.addColorStop(0,'#050816'); g.addColorStop(.6,'#1a1040'); g.addColorStop(1,'#3b1d5e'); c.fillStyle=g; c.fillRect(0,0,W,H);
    c.fillStyle='rgba(168,85,247,.08)'; c.beginPath(); c.ellipse(W*.6,H*.4,W*.6,40,-.4,0,7); c.fill();
    skyStars.forEach(s=>{ s.a+=.03; c.globalAlpha=.5+Math.sin(s.a)*.4; c.fillStyle=s.our?'#f9a8d4':'#fff'; if(s.our){c.shadowColor='#ff4d8d';c.shadowBlur=8;} c.beginPath(); c.arc(s.x,s.y,s.our?s.r+.8:s.r,0,7); c.fill(); c.shadowBlur=0; }); c.globalAlpha=1;
    c.fillStyle='#0b0716'; c.beginPath(); c.moveTo(0,H); c.lineTo(0,H-30); c.quadraticCurveTo(W*.25,H-60,W*.5,H-34); c.quadraticCurveTo(W*.75,H-10,W,H-44); c.lineTo(W,H); c.fill();
    if(shooting){ const s=shooting; s.t+=.018; const x=s.x0+(s.x1-s.x0)*s.t, y=s.y0+(s.y1-s.y0)*s.t; const tg=c.createLinearGradient(x,y,x-90,y-50); tg.addColorStop(0,'rgba(255,255,255,1)'); tg.addColorStop(.2,'rgba(249,168,212,.7)'); tg.addColorStop(1,'rgba(168,85,247,0)'); c.strokeStyle=tg; c.lineWidth=3; c.lineCap='round'; c.beginPath(); c.moveTo(x,y); c.lineTo(x-90,y-50); c.stroke(); c.fillStyle='#fff'; c.shadowColor='#fff'; c.shadowBlur=20; c.beginPath(); c.arc(x,y,3.2,0,7); c.fill(); c.shadowBlur=0; if(s.t>=1){ skyStars.push({x,y,r:1.4,a:0,our:true}); shooting=null; } }
    skyAnim=requestAnimationFrame(loop); };
  cancelAnimationFrame(skyAnim); loop(); },()=>cancelAnimationFrame(skyAnim));
function shootStar(){ const w=$('wishIn').value.trim(); if(!w) return toast('Write a wish first'); shooting={x0:40,y0:30,x1:250+Math.random()*60,y1:140+Math.random()*60,t:0}; const n=((BUS.get('sky')||{n:0}).n)+1; BUS.setState('sky',{n}); $('skyN').textContent='Your shared sky · '+n+' stars'; buzz(30); BUS.send('star',{wish:w},{kind:'touch'}); $('wishIn').value=''; toast('Your wish is on its way ✨'); }
handle('star',(b,ev,fresh)=>{ const show=()=>overlay('star',b); if(!document.hidden) show(); else document.addEventListener('visibilitychange',function f(){ if(!document.hidden){ show(); document.removeEventListener('visibilitychange',f);} }); notifyUser('shoot','A shooting star from '+HER(),'Tap the star to read the wish',null,'act'); });
