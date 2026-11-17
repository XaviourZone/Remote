/* Better Half – app core: sessions, navigation, notifications, onboarding, home stage */
const $=id=>document.getElementById(id);
const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const rnd=a=>a[Math.floor(Math.random()*a.length)];
const tfmt=ts=>new Date(ts).toLocaleTimeString([], {hour:'numeric',minute:'2-digit'});
function buzz(p){ try{ if(navigator.vibrate) navigator.vibrate(p); }catch(e){} }

/* ---------- mode + storage ---------- */
const QS=new URLSearchParams(location.search);
const ROLE=QS.get('as');                       // 'him' / 'her' in the two-phone demo
const MODE=ROLE?'demo':(window.BH_FIREBASE&&window.BH_FIREBASE.apiKey?'firebase':'demo');
if(ROLE) document.documentElement.style.setProperty('--sat','40px');
const S=makeStore('bh.'+(ROLE||(MODE==='demo'?'solo':'app'))+'.');
let BUS=null, SES=null, PARTNER=null;
const sesSave=()=>S.set('session',SES);
const ME=()=>(SES&&SES.name)||'Me';
const HER=()=>(SES&&SES.partnerName)||(PARTNER&&PARTNER.name)||'Partner';
const PG=()=>(PARTNER&&PARTNER.gender)||'f';
const P3=()=>PG()==='m'?{s:'he',o:'him',p:'his',S:'He',P:'His'}:PG()==='f'?{s:'she',o:'her',p:'her',S:'She',P:'Her'}:{s:'they',o:'them',p:'their',S:'They',P:'Their'};
const myAv=()=>SES&&SES.avatar||defaultAvatar((SES&&SES.gender)||'m');
const herAv=()=>PARTNER&&PARTNER.avatar||defaultAvatar(PG());

/* ---------- navigation ---------- */
const TABS=[['home','home','Home'],['chat','chat','Chat'],['touch','touch','Touch'],['play','play','Play'],['plans','plans','Plans']];
let cur='welcome', hist=[];
const HOOKS={}; // screen enter/leave hooks registered by modules
function onScreen(id,enter,leave){ HOOKS[id]={enter,leave}; }
function go(id,root){
  if(!$(id)) return;
  if(root) hist=[]; else if(cur!==id && !['call','connected'].includes(cur)) hist.push(cur);
  const prev=cur; if(HOOKS[prev]&&HOOKS[prev].leave&&prev!==id) try{HOOKS[prev].leave()}catch(e){console.error(e)}
  document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active'));
  $(id).classList.add('active'); cur=id;
  document.querySelectorAll('.tab').forEach(b=>b.classList.toggle('on',b.dataset.t===id));
  closeSheets(); fillAvatars($(id));
  if(BUS&&BUS.cid) BUS.screen(id);
  if(HOOKS[id]&&HOOKS[id].enter) try{HOOKS[id].enter()}catch(e){console.error(e)}
  if(window.parent!==window) try{ parent.postMessage({bh:'screen',role:ROLE,screen:id},'*'); }catch(e){}
}
function back(){ const t=hist.pop()||'home'; go(t); hist.pop(); }
function setBadge(n){ document.querySelectorAll('.tab[data-t=chat] .badge').forEach(b=>{b.style.display=n?'flex':'none';b.textContent=n;}); }

/* ---------- notifications ---------- */
let nT;
const VIB={nudge:[100,50,100,50,250],kiss:[60,40,60,40,180],hug:[300,80,300],act:[60,60,60],msg:[40],call:[500,250,500,250,500],game:[30,60,30],alarm:[600,300,600,300,600],taps:null,default:[40]};
function inAppBanner(icon,title,text,target){
  $('nIc').innerHTML=ic(icon,'s'); $('nTitle').textContent=title; $('nText').textContent=text||'';
  const n=$('notif'); n.classList.add('show'); n.onclick=()=>{n.classList.remove('show'); if(target) go(target);};
  clearTimeout(nT); nT=setTimeout(()=>n.classList.remove('show'),4200);
}
function notifyUser(icon,title,text,target,kind='default',opts={}){
  if(!opts.silentVib) buzz(VIB[kind]||VIB.default);
  const hidden=document.hidden;
  if(!hidden && !(target && cur===target && !opts.always)) inAppBanner(icon,title,text,target);
  if(hidden && 'Notification' in window && Notification.permission==='granted'){
    const o={body:text||'',icon:'icons/icon-192.png',badge:'icons/icon-96.png',tag:opts.tag||kind,renotify:true,data:{target},vibrate:VIB[kind]||undefined};
    if(navigator.serviceWorker&&navigator.serviceWorker.controller) navigator.serviceWorker.ready.then(r=>r.showNotification(title,o)).catch(()=>{});
    else try{ new Notification(title,o); }catch(e){}
  }
  if(window.parent!==window) try{ parent.postMessage({bh:'notif',role:ROLE,title,text,hidden},'*'); }catch(e){}
}
function toast(t){const el=$('toast');el.textContent=t;el.classList.add('show');clearTimeout(el._t);el._t=setTimeout(()=>el.classList.remove('show'),2300);}
function openSheet(id){ $(id).classList.add('show'); }
function closeSheets(){ document.querySelectorAll('.sheetbg').forEach(s=>s.classList.remove('show')); }
function bgClose(e){ if(e.target.classList.contains('sheetbg')) closeSheets(); }
function confirmBox(txt,fn){ $('cfTxt').textContent=txt; $('cfOk').onclick=()=>{ closeSheets(); fn(); }; openSheet('cfSheet'); }
function banner(icon,html,actions){ const b=document.createElement('div'); b.className='banner'; b.innerHTML=`<span class="glyph gp">${ic(icon,'s')}</span><div style="flex:1;font-size:13.5px">${html}</div>`; (actions||[]).forEach(a=>{ const x=document.createElement('button'); x.className='btn sm'+(a.ghost?' gh':''); x.textContent=a.t; x.onclick=()=>{ b.remove(); a.f&&a.f(); }; b.appendChild(x); }); $('bannerBox').appendChild(b); setTimeout(()=>b.remove(),12000); return b; }
function rain(kind,n=30){ const cols={hearts:['#ff4d8d','#f472b6','#c026d3','#fb7185'],confetti:['#facc15','#22d3ee','#a855f7','#ff4d8d','#34d399'],stars:['#fde68a','#fff','#c4b5fd']}[kind];
  for(let i=0;i<n;i++){ const s=document.createElement('span'); const c=rnd(cols), z=14+Math.random()*20;
    s.innerHTML= kind==='hearts'?heartSVG(c,z): kind==='stars'?`<svg viewBox="0 0 24 24" width="${z}" height="${z}"><path d="M12 2.5l3 6.1 6.7 1-4.9 4.7 1.2 6.7-6-3.2-6 3.2 1.2-6.7-4.9-4.7 6.7-1z" fill="${c}"/></svg>`:`<i style="display:block;width:${z*.45}px;height:${z*.8}px;background:${c};border-radius:2px"></i>`;
    s.style.left=Math.random()*96+'%'; s.style.animationDuration=(2+Math.random()*2.2)+'s'; s.style.animationDelay=Math.random()*1.2+'s'; s.style.filter=`drop-shadow(0 0 6px ${c})`; $('fx').appendChild(s); setTimeout(()=>s.remove(),5200);} }
function burst(host,x,y,col='#ff4d8d',n=12){ for(let i=0;i<n;i++){const b=document.createElement('div');b.className='burst';b.innerHTML=heartSVG(rnd([col,'#f472b6','#c084fc','#fff']),16+Math.random()*14);b.style.left=(x-12)+'px';b.style.top=(y-12)+'px';const a=i/n*Math.PI*2;b.style.setProperty('--dx',Math.cos(a)*(90+Math.random()*50)+'px');b.style.setProperty('--dy',Math.sin(a)*(90+Math.random()*50)+'px');b.style.setProperty('--r',(Math.random()*90-45)+'deg');host.appendChild(b);setTimeout(()=>b.remove(),1300);} }

/* ---------- avatars in the page ---------- */
function fillAvatars(root){ (root||document).querySelectorAll('[data-av]').forEach(el=>{ const o=el.dataset.av==='me'?myAv():herAv(); el.innerHTML=avatar(o,el.dataset.ex||'smile','idle',el.dataset.view||'full'); }); }
function applyNames(){
  document.querySelectorAll('.mn').forEach(e=>e.textContent=ME());
  document.querySelectorAll('.hn').forEach(e=>e.textContent=HER());
  fixPronouns();
}
const PRON=[[/\bfor her jar\b/g,p=>'for '+p.p+' jar'],[/\bSend her\b/g,p=>'Send '+p.o],[/\bsend her\b/g,p=>'send '+p.o],[/\bfor her\b/g,p=>'for '+p.o],[/\bHer\b/g,p=>p.P],[/\bher\b/g,p=>p.p],[/\bShe\b/g,p=>p.S],[/\bshe\b/g,p=>p.s]];
function fixPronouns(){ const p=P3(); const w=document.createTreeWalker($('phone'),NodeFilter.SHOW_TEXT); let n; while(n=w.nextNode()){ const par=n.parentNode; if(!par||/SCRIPT|STYLE|TEXTAREA/.test(par.nodeName)||par.closest('#msgs')) continue; if(n._orig===undefined){ if(!/\b(she|She|her|Her)\b/.test(n.nodeValue)) continue; n._orig=n.nodeValue; } let t=n._orig; PRON.forEach(([re,f])=>{ t=t.replace(re,()=>f(p)); }); n.nodeValue=t; } }

/* ---------- boot ---------- */
async function boot(){
  document.querySelectorAll('.tabs').forEach(n=>n.innerHTML=TABS.map(t=>`<button class="tab" data-t="${t[0]}" onclick="go('${t[0]}',true)">${ic(t[1])}${t[2]}<em class="badge"></em></button>`).join(''));
  hydrate(); $('biglogo').innerHTML=logoSVG();
  if(MODE==='firebase'){ BUS=new FirebaseBus(S,window.BH_FIREBASE); try{ await BUS.boot(); }catch(e){ console.error(e); toast('Could not reach the server. Check your connection.'); } }
  else BUS=new LocalBus(S,ROLE||'him');
  $('modeNote').textContent=MODE==='demo'?(ROLE?'Two-phone test mode · this is '+(ROLE==='her'?'her':'his')+' phone':'Test mode · open demo.html to try two phones'):'';
  BUS.onEvent(routeEvent); BUS.onPresence(onPresence); BUS.onState(onStateChange); BUS.onLive(routeLive);
  SES=S.get('session');
  if(MODE==='firebase'){ const u=await BUS.currentUser(); if(u&&(!SES||SES.uid!==u.uid)) SES={uid:u.uid,email:u.email,name:u.name,step:'profile'}; if(!u) SES=null; sesSave(); }
  if(!SES||!SES.uid){ go('welcome',true); return; }
  await BUS.restore(SES.uid);
  await resume();
}
async function resume(){
  applyNames();
  const st=SES.step;
  if(st==='profile') return showProfile();
  if(st==='avatar') return go('avatar',true);
  if(SES.cid){ await connectCouple(false); if(st==='perms'||st==='connected') return go(st==='connected'?'connected':'perms',true); go('home',true); return; }
  return showInvite();
}

/* ---------- onboarding ---------- */
async function doLogin(){
  if(MODE==='demo'){ const acc=await BUS.login(); $('gEmail').textContent=acc.email; $('gName').textContent=ROLE==='her'?'Her Google account':'His Google account'; $('gAvL').textContent=acc.email[0].toUpperCase(); openSheet('gsheet'); return; }
  try{ const acc=await BUS.login(); if(!acc) return; SES={uid:acc.uid,email:acc.email,name:acc.name,step:'profile'}; sesSave(); showProfile(); }catch(e){ toast('Sign-in failed: '+(e.message||e.code)); }
}
async function pickDemoAccount(){ closeSheets(); const acc=await BUS.login(); SES={uid:acc.uid,email:acc.email,name:'',step:'profile'}; sesSave(); toast('Signed in with Google'); setTimeout(showProfile,300); }
let gSel=null;
function showProfile(){ go('profile',true); $('acctEmail').textContent=SES.email||''; $('myName').value=SES.name||''; $('herName').value=SES.partnerName||''; gSel=SES.gender||null; drawGPick(); }
function drawGPick(){ $('gpick').innerHTML=[['m','Man'],['f','Woman'],['x','Other']].map(([g,l])=>`<button class="${gSel===g?'on':''}" onclick="gSel='${g}';drawGPick()"><div class="pv">${avatar(defaultAvatar(g==='x'?'m':g),'smile','idle','full').replace('class="ava','class="ava" style="width:64px;height:96px')}</div>${l}</button>`).join(''); }
function saveProfile(){
  const n=$('myName').value.trim(); if(!n) return toast('Please enter your name'); if(!gSel) return toast('Please choose who you are');
  const changedG=SES.gender&&SES.gender!==gSel;
  SES.name=n; SES.gender=gSel; SES.partnerName=$('herName').value.trim();
  if(!SES.avatar||changedG) SES.avatar=defaultAvatar(gSel==='x'?'m':gSel);
  SES.step='avatar'; sesSave(); applyNames(); go('avatar',true);
}
/* avatar builder */
let avTab='body', avEx='smile', avPose='idle';
const AVTABS=[['body','Face & body'],['hair','Hair'],['outfit','Outfit'],['shoes','Shoes'],['extras','Accessories']];
onScreen('avatar',()=>{ $('avBack').style.visibility=SES&&SES.step==='done'?'visible':'hidden'; drawAvEditor(); });
function avSet(k,v){ SES.avatar[k]=v; drawAvEditor(); }
function swatches(k,list,isIdx){ return `<div class="swr">${list.map((c,i)=>`<button class="sw8 ${(isIdx?SES.avatar[k]===i:SES.avatar[k]===c)?'on':''}" style="background:${c}" onclick="avSet('${k}',${isIdx?i:`'${c}'`})"></button>`).join('')}</div>`; }
function choices(k,list){ return `<div class="chips">${list.map(v=>`<button class="chip ${SES.avatar[k]===v?'on':''}" onclick="avSet('${k}','${v}')">${NAMES[v]||v}</button>`).join('')}</div>`; }
function tog(k,label){ return `<div class="row" style="margin-bottom:8px"><span style="flex:1;font-weight:700;font-size:14px">${label}</span><input type="checkbox" class="sw" ${SES.avatar[k]?'checked':''} onchange="avSet('${k}',this.checked)"></div>`; }
function drawAvEditor(){
  const a=SES.avatar, g=a.g==='f'?'f':'m', og=g==='f'?'m':'f';
  $('avPrev').innerHTML=avatar(a,avEx,avPose);
  $('avExpr').innerHTML=[['smile','idle'],['love','heart'],['laugh','cheer'],['wink','wave'],['kiss','shy'],['shy','hips']].map(([e,p])=>`<button class="chip ${avEx===e?'on':''}" onclick="avEx='${e}';avPose='${p}';drawAvEditor()">${e[0].toUpperCase()+e.slice(1)}</button>`).join('');
  $('avTabs').innerHTML=AVTABS.map(([k,l])=>`<button class="${avTab===k?'on':''}" onclick="avTab='${k}';drawAvEditor()">${l}</button>`).join('');
  let h='';
  if(avTab==='body') h=`<div class="avsec"><label>Body style</label><div class="chips"><button class="chip ${g==='m'?'on':''}" onclick="avSet('g','m')">Masculine</button><button class="chip ${g==='f'?'on':''}" onclick="avSet('g','f')">Feminine</button></div></div><div class="avsec"><label>Skin tone</label>${swatches('skin',SKINS,true)}</div><div class="avsec"><label>Eyes</label>${choices('eyes',AV_OPTS.eyes)}</div><div class="avsec"><label>Eyebrows</label>${choices('brows',AV_OPTS.brows)}</div><div class="avsec">${tog('blush','Rosy cheeks')}${tog('bindi','Bindi')}${tog('nosepin','Nose pin')}</div>`;
  if(avTab==='hair') h=`<div class="avsec"><label>Hairstyle</label>${choices('hair',[...AV_OPTS.hair[g],...AV_OPTS.hair[og]])}</div><div class="avsec"><label>Hair colour</label>${swatches('hc',HAIRC,true)}</div><div class="avsec"><label>Facial hair</label>${choices('facial',AV_OPTS.facial)}</div>`;
  if(avTab==='outfit') h=`<div class="avsec"><label>Top</label>${choices('top',[...new Set([...AV_OPTS.top[g],...AV_OPTS.top[og]])])}</div><div class="avsec"><label>Top colour</label>${swatches('topC',CLOTH)}</div>${['saree','dress'].includes(a.top)?'':`<div class="avsec"><label>Bottom</label>${choices('bottom',AV_OPTS.bottom)}</div><div class="avsec"><label>Bottom colour</label>${swatches('botC',CLOTH)}</div>`}`;
  if(avTab==='shoes') h=`<div class="avsec"><label>Shoes</label>${choices('shoes',AV_OPTS.shoes)}</div><div class="avsec"><label>Shoe colour</label>${swatches('shoeC',CLOTH)}</div>`;
  if(avTab==='extras') h=`<div class="avsec"><label>Glasses</label>${choices('glasses',AV_OPTS.glasses)}</div><div class="avsec"><label>Headwear</label>${choices('hat',AV_OPTS.hat)}</div><div class="avsec"><label>Headwear / hair-tie colour</label>${swatches('hatC',CLOTH)}</div><div class="avsec"><label>Bag</label>${choices('bag',AV_OPTS.bag)}</div><div class="avsec"><label>Bag colour</label>${swatches('bagC',CLOTH)}</div><div class="avsec"><label>Earrings</label>${choices('ear',AV_OPTS.ear)}</div><div class="avsec"><label>Neck</label>${choices('neck',AV_OPTS.neck)}</div><div class="avsec">${tog('watch','Watch')}</div>`;
  $('avPanel').innerHTML=h;
}
function avRandom(){ const a=SES.avatar, g=a.g==='f'?'f':'m'; Object.assign(a,{skin:Math.floor(Math.random()*SKINS.length),hair:rnd(AV_OPTS.hair[g]),hc:Math.floor(Math.random()*6),top:rnd(AV_OPTS.top[g]),topC:rnd(CLOTH),bottom:rnd(AV_OPTS.bottom.filter(b=>g==='f'||!['skirt','longskirt'].includes(b))),botC:rnd(CLOTH),shoes:rnd(AV_OPTS.shoes.filter(s=>g==='f'||!['heels'].includes(s))),shoeC:rnd(CLOTH),glasses:rnd(['none','none',...AV_OPTS.glasses]),hat:rnd(['none','none','none',...AV_OPTS.hat]),hatC:rnd(CLOTH),bag:rnd(['none','none',...AV_OPTS.bag]),bagC:rnd(CLOTH),facial:g==='m'?rnd(AV_OPTS.facial):'none'}); drawAvEditor(); }
async function saveAvatar(){
  const keys=await Crypt.myKeys(S);
  await BUS.publishProfile({name:SES.name,gender:SES.gender,avatar:SES.avatar,pub:keys.pub||null,ts:Date.now()});
  if(SES.step==='done'){ sesSave(); toast('Avatar saved · '+HER()+' sees it too'); if(BUS.cid) BUS.send('profile',{}); back(); return; }
  SES.step='invite'; sesSave(); showInvite();
}
async function showInvite(){
  go('invite',true); invTab(0);
  let code=S.get('myInvite'); if(!code){ try{ code=await BUS.createInvite(); }catch(e){ toast(e.message); return; } }
  $('myCode').textContent=code; drawQR(code);
  BUS.watchInvite(code,(cid,puid)=>{ if(!SES.cid) onPaired(cid,puid,false); });
  if(MODE==='demo'){ const other=ROLE==='her'?'u-him':'u-her'; let oc=''; for(let i=0;i<localStorage.length;i++){ const k=localStorage.key(i); if(k.startsWith('bhsrv.invite.')){ const v=JSON.parse(localStorage.getItem(k)); if(v.uid===other&&!v.claimed) oc=k.slice(13);} } $('demoCode').innerHTML=oc?`Test mode: the other phone's code is <b style="color:#fff">${oc}</b>`:'Test mode: open the other phone to see its code'; }
}
function drawQR(code){ let s='',seed=+code||7; const r=()=>(seed=(seed*9301+49297)%233280)/233280; const f=(x,y)=>`<rect x="${x}" y="${y}" width="7" height="7" rx="1.5" fill="#1a1230"/><rect x="${x+1}" y="${y+1}" width="5" height="5" rx="1" fill="#fff"/><rect x="${x+2}" y="${y+2}" width="3" height="3" rx=".8" fill="#a855f7"/>`;
  for(let y=0;y<21;y++)for(let x=0;x<21;x++){if((x<8&&y<8)||(x>12&&y<8)||(x<8&&y>12))continue;if(r()>.5)s+=`<rect x="${x+.1}" y="${y+.1}" width=".8" height=".8" rx=".25" fill="#1a1230"/>`;} $('qr').innerHTML=s+f(0,0)+f(14,0)+f(0,14); }
function invTab(n){ $('segA').classList.toggle('on',!n); $('segB').classList.toggle('on',!!n); $('invA').style.display=n?'none':'block'; $('invB').style.display=n?'block':'none'; }
function shareInvite(how){ const code=$('myCode').textContent, url=location.origin+location.pathname.replace(/[^/]*$/,'')+'?join='+code;
  const txt=`Join me on Better Half 💞 our private space. Open ${url} and enter code ${code}`;
  if(how==='copy'){ try{ navigator.clipboard.writeText(txt); toast('Invite copied'); }catch(e){ toast('Code: '+code); } return; }
  if(navigator.share&&how!=='sms'&&how!=='whatsapp'){ navigator.share({text:txt}).catch(()=>{}); return; }
  const href=how==='whatsapp'?'https://wa.me/?text='+encodeURIComponent(txt):'sms:?&body='+encodeURIComponent(txt); const a=document.createElement('a'); a.href=href; a.target='_blank'; a.rel='noopener'; a.click(); }
async function redeem(){ const code=$('codeIn').value.replace(/\D/g,''); if(code.length!==6) return toast('Enter the 6-digit code');
  try{ const r=await BUS.redeemInvite(code); await onPaired(r.cid,r.partnerUid,true); }catch(e){ toast(e.message||'Could not connect'); } }
async function onPaired(cid,puid,iRedeemed){
  SES.cid=cid; SES.partnerUid=puid; SES.step='connected'; sesSave(); S.del('myInvite');
  if(MODE==='firebase') await BUS.publishProfile({coupleId:cid});
  await connectCouple(true);
  BUS.send('hello',{name:ME()});
  notifyUser('heart','Connected with '+HER(),'Say hi 💞','home','act');
  $('conDuo').innerHTML=`<div style="width:110px;height:220px">${avatar(myAv(),'love','heart')}</div><div style="width:40px;height:40px;margin-bottom:90px;animation:hb 1.2s infinite">${heartSVG('#ff4d8d',40)}</div><div style="width:110px;height:220px">${avatar(herAv(),'love','heart')}</div>`;
  go('connected',true);
}
async function connectCouple(fresh){
  PARTNER=await BUS.getUser(SES.partnerUid);
  let tries=0; while((!PARTNER||!PARTNER.pub)&&tries<10&&Crypt.ok){ await new Promise(r=>setTimeout(r,500)); PARTNER=await BUS.getUser(SES.partnerUid); tries++; }
  await BUS.setupKeys(PARTNER&&PARTNER.pub);
  const keys=await Crypt.myKeys(S); const sn=await Crypt.safety(keys.pub,PARTNER&&PARTNER.pub); document.querySelectorAll('.safety').forEach(e=>e.textContent=sn);
  BUS.watchUser(SES.partnerUid,async p=>{ if(!p) return; const keyChanged=PARTNER&&p.pub&&JSON.stringify(p.pub)!==JSON.stringify(PARTNER.pub); PARTNER=p; if(keyChanged){ await BUS.setupKeys(p.pub); toast(HER()+' re-installed the app · keys updated'); } applyNames(); fillAvatars(); if(cur==='home') drawStage(); });
  await BUS.attach(SES.cid,SES.partnerUid);
  applyNames(); fillAvatars(); if(window.afterConnect) afterConnect();
}
function isIOS(){ return /iphone|ipad|ipod/i.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1); }
function standalone(){ return matchMedia('(display-mode: standalone)').matches||navigator.standalone===true; }
onScreen('perms',()=>{ permUI(); if(isIOS()&&!standalone()) $('iosNote').innerHTML=`<div class="ios"><b>On iPhone, add Better Half to your Home Screen first</b><br>Tap <b>Share</b> <span style="display:inline-block;transform:translateY(3px)">${ic('send','s')}</span> in Safari → <b>Add to Home Screen</b> → open it from the new icon. Notifications only work from there.</div>`; else $('iosNote').innerHTML=''; });
function permUI(){ const n=('Notification' in window)?Notification.permission:'unsupported'; const set=(id,state)=>{ const b=$(id); if(!b) return; b.textContent=state==='granted'?'On':state==='denied'?'Blocked':state==='unsupported'?'N/A':'Allow'; b.classList.toggle('gh',state!=='default'&&state!=='prompt'); };
  set('pNotif',n); const m=S.get('media')||{}; set('pMic',m.mic||'default'); set('pCam',m.cam||'default');
  if($('setNotif')) $('setNotif').textContent=n==='granted'?'On':n==='denied'?'Blocked in phone settings':n==='unsupported'?(isIOS()&&!standalone()?'Add to Home Screen first':'Not supported here'):'Off';
  if($('setMedia')) $('setMedia').textContent=(m.mic==='granted'?'Mic on':'Mic off')+' · '+(m.cam==='granted'?'Camera on':'Camera off'); }
async function askNotif(){ if(!('Notification' in window)){ toast(isIOS()?'Add to Home Screen first, then open from the icon':'Notifications are not supported here'); return; }
  const r=await Notification.requestPermission(); permUI();
  if(r==='granted'){ toast('Notifications on'); if(MODE==='firebase'&&window.BH_VAPID&&navigator.serviceWorker){ const reg=await navigator.serviceWorker.ready; const ok=await BUS.savePushToken(window.BH_VAPID,reg); if(!ok) toast('Push setup incomplete, alerts work while the app is open'); } } else toast('You can turn them on later in Settings'); }
async function askMedia(video){ try{ const s=await navigator.mediaDevices.getUserMedia({audio:true,video:!!video}); s.getTracks().forEach(t=>t.stop()); const m=S.get('media')||{}; m.mic='granted'; if(video) m.cam='granted'; S.set('media',m); toast('Allowed'); }catch(e){ const m=S.get('media')||{}; m.mic=m.mic||'denied'; if(video) m.cam='denied'; S.set('media',m); toast('Blocked here. You can allow it later'); } permUI(); }
function finishOnboarding(){ SES.step='done'; sesSave(); go('home',true); }

/* ---------- presence ---------- */
let PRES={online:false,screen:''};
const SCREEN_LABEL={home:'on Home',chat:'in Chat',touch:'in Touch',play:'in Play',plans:'in Plans',carom:'playing Carom',bball:'playing Hoops',hockey:'playing Air Hockey',ttt:'playing Tic-Tac-Toe',memory:'playing Memory',askme:'in Ask Me',kiss:'in Thumb Kiss',hold:'in Hold Together',walkie:'on Walkie',call:'on a call',jar:'in Love Jar'};
function onPresence(p){ const was=PRES.online; PRES=p; const t=p.online?('Online'+(SCREEN_LABEL[p.screen]?' · '+SCREEN_LABEL[p.screen]:'')):'Offline';
  if($('pDot')){ $('pDot').classList.toggle('on',p.online); $('pTxt').textContent=t; }
  if($('chatSub')){ $('chatSub').textContent=p.online?'online':'offline'; $('chatSub').style.color=p.online?'#a7f3d0':''; }
  const sh=$('saHer'); if(sh){ sh.classList.toggle('off',!p.online); if(was!==p.online&&cur==='home') drawStage(); }
  document.dispatchEvent(new CustomEvent('presence',{detail:p}));
  $('setSync')&&($('setSync').textContent=(BUS.kind==='local'?'Test mode (this browser)':'Firebase')+' · partner '+(p.online?'online':'offline'));
}

/* ---------- event router ---------- */
const HANDLERS={};
function handle(type,fn){ HANDLERS[type]=fn; }
function routeEvent(ev){ const fresh=Date.now()-ev.ts<45000; const h=HANDLERS[ev.type]; if(h) h(ev.body,ev,fresh); }
const LIVEH={}; function onLiveCh(ch,fn){ LIVEH[ch]=fn; } function routeLive(ch,d){ const h=LIVEH[ch]; if(h) h(d); }
const STATEH=[]; function watchState(prefix,fn){ STATEH.push([prefix,fn]); } function onStateChange(path,v){ STATEH.forEach(([p,f])=>{ if(path.startsWith(p)) try{f(path,v)}catch(e){console.error(e)} }); }
handle('hello',(b,ev,fresh)=>{ notifyUser('heart',HER()+' is connected','Say hi 💞','chat','act'); });
handle('profile',async()=>{ PARTNER=await BUS.getUser(SES.partnerUid); applyNames(); fillAvatars(); if(cur==='home') drawStage(); });
handle('notice',(b)=>notifyUser(b.icon||'bell',b.title,b.text,b.target,b.kind||'default'));
handle('unpaired',()=>{ notifyUser('users',HER()+' unpaired','You are no longer connected','invite'); SES.cid=null; SES.partnerUid=null; SES.step='invite'; sesSave(); BUS.detach(); showInvite(); });
function notice(icon,title,text,target,kind){ BUS.send('notice',{icon,title,text,target,kind}); }

/* ---------- HOME stage ---------- */
const ACTS=[['hug','users','Hug','gp'],['kiss','kiss','Kiss','gp'],['cuddle','moon','Cuddle','gv'],['heart','heart','Love you','go'],['high5','hands','High five','gy'],['dance','music','Dance','gc'],['poke','zap','Poke','gv'],['wave','smile','Wave','gg'],['gift','gift','Gift','gy']];
const ACT_TXT={hug:'hugged you',kiss:'kissed you',cuddle:'is cuddling you',heart:'says I love you',high5:'high-fived you',dance:'is dancing with you',poke:'poked you',wave:'waved at you',gift:'sent you a gift'};
let stageBusy=false, idleIv, awayQ=[];
function stageBg(){ const h=new Date().getHours(), night=h<6||h>=18; const sky=night?['#0b1033','#2a1a5e']:['#7dd3fc','#c4b5fd'];
  let stars=''; if(night) for(let i=0;i<16;i++) stars+=`<circle cx="${36+Math.random()*84}" cy="${74+Math.random()*64}" r="${Math.random()*1.2+.4}" fill="#fff" opacity="${.5+Math.random()*.5}"/>`;
  let lights=''; for(let i=0;i<14;i++){ const x=10+i*26, y=26+Math.sin(i*.9)*6+8; lights+=`<circle cx="${x}" cy="${y}" r="3.4" fill="${['#fde68a','#f9a8d4','#a5f3fc'][i%3]}" filter="url(#gl)"><animate attributeName="opacity" values="1;.4;1" dur="${2+i%3}s" repeatCount="indefinite"/></circle>`; }
  $('stageBg').innerHTML=`<defs><linearGradient id="rw" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2b1b52"/><stop offset="1" stop-color="#3b2470"/></linearGradient><linearGradient id="rf" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2c1b4f"/><stop offset="1" stop-color="#150d2b"/></linearGradient><linearGradient id="rs" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${sky[0]}"/><stop offset="1" stop-color="${sky[1]}"/></linearGradient><radialGradient id="lampg"><stop offset="0" stop-color="#fde68a" stop-opacity=".5"/><stop offset="1" stop-color="#fde68a" stop-opacity="0"/></radialGradient><filter id="gl"><feGaussianBlur stdDeviation="1.6" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter><linearGradient id="couch" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7c5cf0"/><stop offset="1" stop-color="#4c32b0"/></linearGradient></defs>
  <rect width="360" height="430" fill="url(#rw)"/><path d="M0 26 Q180 50 360 26" stroke="#ffffff30" fill="none"/>${lights}
  <rect x="26" y="70" width="100" height="100" rx="12" fill="url(#rs)" stroke="#ffffff40" stroke-width="5"/>${stars}
  ${night?'<circle cx="100" cy="98" r="13" fill="#fef3c7" filter="url(#gl)"/><circle cx="106" cy="94" r="11" fill="#1d1450"/>':'<circle cx="98" cy="102" r="14" fill="#fde047" filter="url(#gl)"/>'}
  <path d="M76 70v100M26 120h100" stroke="#ffffff40" stroke-width="4"/>
  <rect x="244" y="78" width="72" height="56" rx="8" fill="#ffffff14" stroke="#ffffff30" stroke-width="3"/><path transform="translate(265 90) scale(1.25)" d="${HEART}" fill="#ff4d8d" filter="url(#gl)"/>
  <circle cx="330" cy="200" r="80" fill="url(#lampg)"/><path d="M314 182 h32 l-8 -22 h-16z" fill="#fcd34d"/><rect x="328" y="182" width="4" height="150" fill="#a78bfa"/>
  <rect x="0" y="312" width="360" height="118" fill="url(#rf)"/><ellipse cx="180" cy="392" rx="150" ry="28" fill="#ff4d8d22" stroke="#ff4d8d44"/>
  <rect x="58" y="250" width="244" height="62" rx="22" fill="url(#couch)"/><rect x="46" y="276" width="268" height="50" rx="16" fill="#5b3fd0"/><rect x="38" y="264" width="28" height="68" rx="12" fill="#6d4be0"/><rect x="294" y="264" width="28" height="68" rx="12" fill="#6d4be0"/>
  <rect x="10" y="290" width="28" height="32" rx="6" fill="#c2410c"/><path d="M24 290 C6 262 10 248 20 242 C22 258 26 270 24 290 C32 266 40 258 46 256 C42 270 34 282 24 290" fill="#34d399"/>`; }
function drawStage(){ if(!$('stage')) return; stageBg(); const m=$('saMe'), h=$('saHer'); m.style.transform=h.style.transform=''; m.style.animation=h.style.animation='';
  m.innerHTML=avatar(myAv(),'smile','idle')+`<span class="tag">You</span>`; h.innerHTML=avatar(herAv(),PRES.online?'smile':'sleepy','idle')+`<span class="tag">${esc(HER())}</span>`; h.classList.toggle('off',!PRES.online);
  $('reactBar').innerHTML=ACTS.map(a=>`<button onclick="react('${a[0]}')"><span class="glyph ${a[3]}">${ic(a[1],'s')}</span>${a[2]}</button>`).join(''); }
function setPose(el,who,ex,pose){ const tag=el.querySelector('.tag'), b=el.querySelector('.bubble'); el.innerHTML=avatar(who==='me'?myAv():herAv(),ex,pose); if(tag) el.appendChild(tag); if(b) el.appendChild(b); }
function bubble(el,t){ el.querySelectorAll('.bubble').forEach(b=>b.remove()); const b=document.createElement('div'); b.className='bubble'; b.textContent=t; el.appendChild(b); setTimeout(()=>b.remove(),2800); }
function particles(host,n,col){ for(let i=0;i<n;i++){ const p=document.createElement('div'); p.className='particle'; p.innerHTML=heartSVG(rnd([col,'#f472b6','#c084fc']),12+Math.random()*12); p.style.left=(30+Math.random()*(host.clientWidth-60))+'px'; p.style.top=(120+Math.random()*200)+'px'; p.style.animationDelay=Math.random()*.8+'s'; host.appendChild(p); setTimeout(()=>p.remove(),4000); } }
function react(a){ if(stageBusy) return; playAct('me',a); BUS.send('act',{a},{kind:'touch'}); }
function playAct(actor,a,done){
  if(cur!=='home'||!$('saMe')){ done&&done(); return; }
  stageBusy=true; const A=actor==='me'?$('saMe'):$('saHer'), T=actor==='me'?$('saHer'):$('saMe'), aw=actor==='me'?'me':'her', tw=actor==='me'?'her':'me', dir=actor==='me'?1:-1;
  const box=$('stage'), W=box.clientWidth, cx=W/2, cy=180; const close=Math.max(0,W/2-150-8);
  const fin=(ms)=>setTimeout(()=>{ A.style.transform=T.style.transform=''; A.style.animation=T.style.animation=''; setPose(A,aw,'smile','idle'); setPose(T,tw,PRES.online||tw==='me'?'smile':'sleepy','idle'); box.style.filter=''; stageBusy=false; done&&done(); },ms);
  if(a==='hug'||a==='kiss'||a==='cuddle'){ A.style.transform=`translateX(${dir*(close+34)}px)`+(a==='cuddle'?` rotate(${dir*6}deg)`:''); T.style.transform=`translateX(${-dir*(close+34)}px)`+(a==='cuddle'?` rotate(${-dir*6}deg)`:''); setPose(A,aw,a==='kiss'?'kiss':a==='cuddle'?'sleepy':'love','hug'); setTimeout(()=>{ setPose(T,tw,a==='cuddle'?'sleepy':a==='kiss'?'shy':'love','hug'); burst(box,cx,cy,'#ff4d8d',a==='kiss'?16:12); particles(box,8,'#ff4d8d'); if(a==='cuddle') box.style.filter='brightness(.75) saturate(1.2)'; },700); fin(a==='cuddle'?3600:2800); }
  if(a==='heart'){ setPose(A,aw,'love','heart'); particles(box,14,'#ff4d8d'); setTimeout(()=>{ setPose(T,tw,'shy','shy'); bubble(T,'🥰'); },800); fin(2600); }
  if(a==='high5'){ A.style.transform=`translateX(${dir*close}px)`; T.style.transform=`translateX(${-dir*close}px)`; setTimeout(()=>{ setPose(A,aw,'laugh','cheer'); setPose(T,tw,'laugh','cheer'); A.style.animation=T.style.animation='jump2 .6s'; burst(box,cx,cy-70,'#facc15',10); },650); fin(2100); }
  if(a==='dance'){ let k=0; const iv=setInterval(()=>{ setPose(A,aw,'laugh',k%2?'cheer':'wave'); setPose(T,tw,'laugh',k%2?'wave':'cheer'); if(++k>6){clearInterval(iv);} },420); A.style.animation='dance2 .5s 6'; T.style.animation='dance2 .5s .25s 6'; particles(box,10,'#a855f7'); fin(3200); }
  if(a==='poke'){ A.style.transform=`translateX(${dir*(close-6)}px)`; setPose(A,aw,'wink','point'); setTimeout(()=>{ T.style.animation='jolt2 .5s'; setPose(T,tw,'wow','idle'); setTimeout(()=>{ setPose(T,tw,'laugh','hips'); bubble(T,'Hey! 😝'); },500); },700); fin(2500); }
  if(a==='wave'){ setPose(A,aw,'smile','wave'); setTimeout(()=>{ setPose(T,tw,'smile','wave'); bubble(T,'Hi! 💕'); },800); fin(2600); }
  if(a==='gift'){ const g=document.createElement('div'); g.style.cssText=`position:absolute;left:${actor==='me'?90:W-130}px;top:240px;width:40px;height:40px;color:#facc15;transition:all 1s cubic-bezier(.3,1.2,.5,1);filter:drop-shadow(0 0 10px #facc15);z-index:4`; g.innerHTML=ic('gift','xl'); box.appendChild(g); setPose(A,aw,'smile','point'); setTimeout(()=>{ g.style.left=(actor==='me'?W-130:90)+'px'; g.style.top='200px'; g.style.transform='rotate(20deg) scale(1.3)'; },60); setTimeout(()=>{ g.remove(); setPose(T,tw,'love','cheer'); burst(box,actor==='me'?W-110:110,220,'#facc15',10); bubble(T,'For me?! 😍'); },1150); fin(2900); }
}
handle('act',(b,ev,fresh)=>{
  const t=HER()+' '+ACT_TXT[b.a];
  if(fresh&&cur==='home'&&!document.hidden){ buzz(b.a==='hug'?VIB.hug:VIB.act); queueAct(b.a); return; }
  awayQ.push({a:b.a,ts:ev.ts}); S.set('away',awayQ); renderAway();
  notifyUser(ACTS.find(x=>x[0]===b.a)[1],t,fresh?'Open Home to see it':'While you were away · '+tfmt(ev.ts),'home',b.a==='hug'?'hug':'act',{tag:'act'});
});
let actQ=[], actRun=false; function queueAct(a){ actQ.push(a); if(!actRun) nextAct(); }
function nextAct(){ const a=actQ.shift(); if(!a){ actRun=false; return; } actRun=true; const go2=()=>{ if(stageBusy) return setTimeout(go2,300); playAct('her',a,()=>setTimeout(nextAct,250)); }; go2(); }
function renderAway(){ const box=$('awayBox'); if(!box) return; if(!awayQ.length){ box.innerHTML=''; return; } const c={}; awayQ.forEach(x=>c[x.a]=(c[x.a]||0)+1);
  box.innerHTML=`<div class="away row"><div style="flex:1"><b>While you were away</b><div class="mu">${esc(HER())} ${Object.keys(c).map(k=>ACT_TXT[k].replace(' you','').replace('says I love you','said I love you')+(c[k]>1?' ×'+c[k]:'')).join(' · ')}</div></div><button class="btn sm" onclick="playAway()">Watch</button></div>`; }
function playAway(){ const q=awayQ.map(x=>x.a); awayQ=[]; S.set('away',[]); renderAway(); q.forEach(queueAct); }
onScreen('home',()=>{ drawStage(); renderAway(); const h=new Date().getHours(); $('tod').textContent=h<12?'morning':h<17?'afternoon':'evening'; if(window.jarSummary) jarSummary(); clearInterval(idleIv); idleIv=setInterval(()=>{ if(stageBusy||actRun) return; const r=Math.random(); if(r<.25) bubble($('saMe'),rnd(['💭','✨','🥰'])); else if(r<.5&&PRES.online){ setPose($('saHer'),'her','smile','wave'); setTimeout(()=>{ if(!stageBusy) setPose($('saHer'),'her','smile','idle'); },1600); } particles($('stage'),2,'#c084fc'); },5000); if(awayQ.length&&!document.hidden) setTimeout(playAway,700); },()=>clearInterval(idleIv));

/* ---------- settings ---------- */
onScreen('settings',()=>{ $('setName').value=ME(); $('setHer').value=SES.partnerName||''; $('setPartner').textContent=(PARTNER&&PARTNER.name||'')+' · '+(PRES.online?'online':'offline'); const d=BUS.get('dates/'+SES.uid)||{}; $('since').value=d.since||''; $('anniv').value=d.anniv||''; const hd=BUS.get('dates/'+SES.partnerUid); $('herDates').textContent=hd&&(hd.since||hd.anniv)?`${HER()}'s dates: ${hd.since?'together since '+new Date(hd.since).toLocaleDateString([], {day:'numeric',month:'short',year:'numeric'}):''}${hd.anniv?' · anniversary '+new Date(hd.anniv).toLocaleDateString([], {day:'numeric',month:'short'}):''}`:HER()+' hasn\'t set dates yet'; permUI(); $('setWalkie').checked=S.get('walkieAuto',true)!==false; });
async function saveSettingsNames(){ const n=$('setName').value.trim(); if(!n) return toast('Name can\'t be empty'); SES.name=n; SES.partnerName=$('setHer').value.trim(); sesSave(); await BUS.publishProfile({name:n}); BUS.send('profile',{}); applyNames(); toast('Saved'); }
function saveDates(){ BUS.setState('dates/'+SES.uid,{since:$('since').value,anniv:$('anniv').value}); toast('Saved · synced to '+HER()); }
async function unpair(){ await BUS.send('unpaired',{}); await BUS.unpair(); SES.cid=null; SES.partnerUid=null; PARTNER=null; SES.step='invite'; sesSave(); toast('Unpaired'); showInvite(); }
async function signOut(){ try{ if(BUS.auth) await BUS.auth.signOut(); }catch(e){} S.del('session'); S.del('myInvite'); location.reload(); }
