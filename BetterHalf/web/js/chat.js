/* Better Half – chat, voice notes, photos, calls (WebRTC) */
let CHAT=[], unread=0, replyTo=null, secretArmed=false, menuId=null, typingTo=null, lastTypingSent=0;
function chatLoad(){ CHAT=S.get('chat',[]); }
function chatSave(){ if(CHAT.length>800) CHAT=CHAT.slice(-800); S.set('chat',CHAT); }
const mic16=n=>ic(n,'').replace('class="i','style="width:13px;height:13px" class="i');
function msgHTML(m){
  const who=m.from==='me'?'me':'her';
  if(m.kind==='sys') return `<div class="msg sys" data-id="${m.id}">${esc(m.text)}</div>`;
  if(m.deleted) return `<div class="msg sys" data-id="${m.id}">Message deleted</div>`;
  let body='';
  if(m.kind==='text') body=esc(m.text).replace(/(https?:\/\/[^\s]+)/g,'<a href="$1" target="_blank" rel="noopener" style="color:inherit;text-decoration:underline">$1</a>');
  if(m.kind==='photo') body=`<img src="${m.data}" onclick="viewImg(this.src)">`;
  if(m.kind==='voice') body=voiceHTML(m);
  if(m.kind==='sticker') body=avatar(who==='me'?myAv():herAv(),m.text,m.pose||'idle');
  if(m.kind==='location') body=`<a href="https://maps.google.com/?q=${m.data.lat},${m.data.lng}" target="_blank" rel="noopener" style="color:inherit;text-decoration:none"><div style="width:200px;height:104px;border-radius:12px;background:linear-gradient(135deg,#134e4a,#1e3a8a);position:relative;overflow:hidden"><svg viewBox="0 0 200 104" width="200" height="104"><path d="M0 70 Q50 40 100 60 T200 40" stroke="#5eead4" stroke-width="3" fill="none" opacity=".6"/><path d="M30 0 L60 104M140 0 L120 104" stroke="#fff" opacity=".12" stroke-width="6"/></svg><span style="position:absolute;left:86px;top:30px;color:#ff4d8d">${ic('pin','l')}</span></div><b>📍 My location · open map</b></a>`;
  if(m.kind==='secret') body=who==='me'?`<span>${esc(m.text)}</span><div style="font-size:10.5px;opacity:.85">${m.seen?'Seen · vanished from '+esc(HER())+'\'s phone':'secret · vanishes after it\'s read'}</div>`:`<span class="sec" onclick="revealSecret('${m.id}',this)" style="filter:blur(7px);cursor:pointer">${esc(m.text)}</span><div style="font-size:10.5px;opacity:.75">secret · tap to reveal</div>`;
  if(m.kind==='fx') body=`<b>✦ ${esc(m.text)}</b>`;
  const q=m.quote?`<div class="quote">${esc(m.quote)}</div>`:'';
  const r=m.reacts&&Object.values(m.reacts).filter(Boolean).length?`<span class="reacts">${Object.values(m.reacts).filter(Boolean).join('')}</span>`:'';
  const tick=who==='me'?`<span class="tick" style="${m.status==='read'?'color:#a5f3fc;font-weight:800':''}">${m.status==='read'?'✓✓':m.status==='delivered'?'✓✓':'✓'}</span>`:'';
  return `<div class="msg ${who} ${m.kind==='sticker'?'stk':''} ${r?'has-r':''}" data-id="${m.id}">${q}${body}<div class="meta">${m.star?'★ ':''}${tfmt(m.ts)} ${tick}</div>${r}</div>`;
}
function renderChat(){ const box=$('msgs'); const lock=box.firstElementChild.outerHTML; let html=lock, lastDay='';
  CHAT.forEach(m=>{ const d=new Date(m.ts).toDateString(); if(d!==lastDay){ lastDay=d; const t=new Date(); html+=`<div class="day">${d===t.toDateString()?'Today':d===new Date(t-864e5).toDateString()?'Yesterday':new Date(m.ts).toLocaleDateString([], {day:'numeric',month:'short'})}</div>`; } html+=msgHTML(m); });
  box.innerHTML=html; box.querySelectorAll('.msg:not(.sys)').forEach(bindMsg); box.scrollTop=1e6; }
function upsertMsgEl(m){ const old=document.querySelector(`#msgs [data-id="${m.id}"]`); if(old){ const t=document.createElement('div'); t.innerHTML=msgHTML(m); const n=t.firstChild; old.replaceWith(n); if(!n.classList.contains('sys')) bindMsg(n); } else if(cur==='chat'){ const t=document.createElement('div'); t.innerHTML=msgHTML(m); const n=t.firstChild; $('msgs').appendChild(n); if(!n.classList.contains('sys')) bindMsg(n); $('msgs').scrollTop=1e6; } }
function bindMsg(d){ let t, moved=false;
  d.addEventListener('pointerdown',()=>{moved=false;t=setTimeout(()=>{if(!moved)openMenu(d.dataset.id)},450)});
  d.addEventListener('pointermove',()=>moved=true); ['pointerup','pointerleave'].forEach(e=>d.addEventListener(e,()=>clearTimeout(t)));
  d.addEventListener('contextmenu',e=>{e.preventDefault();openMenu(d.dataset.id)}); d.addEventListener('dblclick',()=>reactMsg(d.dataset.id,'❤️')); }
const findMsg=id=>CHAT.find(m=>m.id===id);
function addLocal(m){ CHAT.push(m); chatSave(); upsertMsgEl(m); }
function sysMsg(text){ addLocal({id:uidGen(),from:'sys',kind:'sys',text,ts:Date.now()}); }
async function sendChat(kind,fields={}){
  const m={id:uidGen(),from:'me',kind,ts:Date.now(),status:'sent',quote:replyTo,...fields}; addLocal(m);
  const wire={id:m.id,kind,text:m.text,data:m.data,dur:m.dur,quote:m.quote,fx:m.fx,pose:m.pose,ts:m.ts};
  await BUS.send('msg',wire,{kind:kind==='text'?'msg':kind}); cancelReply(); return m; }
handle('msg',(b,ev)=>{ if(findMsg(b.id)) return; const m={...b,from:'her',ts:b.ts||ev.ts}; CHAT.push(m); chatSave();
  BUS.send('delivered',{ids:[m.id]});
  if(cur==='chat'&&!document.hidden){ upsertMsgEl(m); BUS.send('read',{upto:m.ts}); buzz(20); if(m.fx) rain(m.fx,30); }
  else { unread++; setBadge(unread); const prev={text:m.text,photo:'📷 Photo',voice:'🎤 Voice message',sticker:'Sent a sticker',secret:'🔒 Secret message',location:'📍 Location',fx:'✦ '+m.text}[m.kind]||'New message'; notifyUser('chat',HER(),prev,'chat','msg',{tag:'chat'}); }
  if(/love you|miss you/i.test(m.text||'')&&cur==='chat') rain('hearts',20);
});
handle('delivered',b=>{ b.ids.forEach(id=>{ const m=findMsg(id); if(m&&m.status==='sent'){ m.status='delivered'; upsertMsgEl(m);} }); chatSave(); });
handle('read',b=>{ CHAT.forEach(m=>{ if(m.from==='me'&&m.ts<=b.upto&&m.status!=='read'){ m.status='read'; upsertMsgEl(m);} }); chatSave(); });
handle('msgReact',b=>{ const m=findMsg(b.id); if(!m) return; m.reacts=m.reacts||{}; m.reacts.her=b.e; chatSave(); upsertMsgEl(m); if(cur!=='chat') notifyUser('heart',HER()+' reacted '+b.e,(m.text||'to your message').slice(0,60),'chat','msg'); });
handle('msgDel',b=>{ const m=findMsg(b.id); if(!m) return; m.deleted=true; m.data=null; m.text=''; chatSave(); upsertMsgEl(m); });
handle('secretSeen',b=>{ const m=findMsg(b.id); if(m){ m.seen=true; chatSave(); upsertMsgEl(m); } });
onLiveCh('typing',()=>{ if(cur!=='chat') return; $('chatSub').textContent='typing…'; clearTimeout(typingTo); typingTo=setTimeout(()=>onPresence(PRES),2500); });
function typing(){ if(Date.now()-lastTypingSent>1500){ lastTypingSent=Date.now(); BUS.live('typing',Date.now()); } }
onScreen('chat',()=>{ unread=0; setBadge(0); renderChat(); const last=[...CHAT].reverse().find(m=>m.from==='her'); if(last) BUS.send('read',{upto:last.ts}); });
function openMenu(id){ const m=findMsg(id); if(!m||m.deleted) return; menuId=id; buzz(15); $('reactBarMsg').innerHTML=['❤️','😂','😮','😢','🔥','👍','🥰'].map(e=>`<button onclick="reactMsg('${id}','${e}');closeSheets()">${e}</button>`).join(''); $('miDel').style.display=m.from==='me'?'flex':'none'; openSheet('msgSheet'); }
function reactMsg(id,e){ const m=findMsg(id); if(!m||m.deleted) return; m.reacts=m.reacts||{}; m.reacts.me=m.reacts.me===e?null:e; chatSave(); upsertMsgEl(m); buzz(20); BUS.send('msgReact',{id,e:m.reacts.me||''}); }
function menuAct(a){ const m=findMsg(menuId); closeSheets(); if(!m) return;
  if(a==='reply'){ replyTo=(m.text||{photo:'Photo',voice:'Voice message',sticker:'Sticker'}[m.kind]||'Message').slice(0,80); $('replyTxt').textContent='Replying: '+replyTo; $('replyBar').classList.add('show'); $('txt').focus(); }
  if(a==='star'){ m.star=!m.star; chatSave(); upsertMsgEl(m); toast(m.star?'Saved to favourites':'Removed'); }
  if(a==='copy'){ try{navigator.clipboard.writeText(m.text||'')}catch(e){} toast('Copied'); }
  if(a==='del'){ m.deleted=true; m.text=''; m.data=null; chatSave(); upsertMsgEl(m); BUS.send('msgDel',{id:m.id}); } }
function cancelReply(){ replyTo=null; $('replyBar').classList.remove('show'); }
function syncSend(){ $('sendBtn').innerHTML=ic($('txt').value.trim()?'send':'mic'); }
async function sendMsg(){ const t=$('txt').value.trim(); if(!t) return; $('txt').value=''; syncSend(); closeDrawers();
  if(secretArmed){ secretArmed=false; $('txt').placeholder='Message…'; await sendChat('secret',{text:t}); } else await sendChat('text',{text:t});
  if(/love you|miss you/i.test(t)) rain('hearts',20); }
function revealSecret(id,el){ const m=findMsg(id); if(!m||el._r) return; el._r=1; el.style.filter='none'; let n=10; const lab=el.nextElementSibling; const iv=setInterval(()=>{ lab.textContent='vanishes in '+(--n)+'s'; if(n<=0){ clearInterval(iv); m.kind='sys'; m.text='Secret message vanished'; chatSave(); upsertMsgEl(m); BUS.send('secretSeen',{id}); } },1000); }
function closeDrawers(){ $('stkDrawer').classList.remove('show'); $('attDrawer').classList.remove('show'); }
function toggleDrawer(id){ const on=$(id).classList.contains('show'); closeDrawers(); if(!on){ $(id).classList.add('show'); if(id==='stkDrawer') $('stk').innerHTML=[['love','heart'],['kiss','shy'],['laugh','cheer'],['wink','wave'],['sleepy','idle'],['sad','idle'],['wow','hips'],['shy','shy']].map(([e,p])=>`<button onclick="sendSticker('${e}','${p}')">${avatar(myAv(),e,p)}</button>`).join(''); } $('msgs').scrollTop=1e6; }
function sendSticker(e,p){ closeDrawers(); sendChat('sticker',{text:e,pose:p}); }
function compressImg(file,max=900){ return new Promise((ok,no)=>{ const r=new FileReader(); r.onload=()=>{ const im=new Image(); im.onload=()=>{ const s=Math.min(1,max/Math.max(im.width,im.height)); const c=document.createElement('canvas'); c.width=im.width*s; c.height=im.height*s; c.getContext('2d').drawImage(im,0,0,c.width,c.height); ok(c.toDataURL('image/jpeg',.72)); }; im.onerror=no; im.src=r.result; }; r.onerror=no; r.readAsDataURL(file); }); }
async function sendPhoto(inp){ const f=inp.files[0]; inp.value=''; if(!f) return; closeDrawers(); try{ const d=await compressImg(f); await sendChat('photo',{data:d}); }catch(e){ toast('Could not read that photo'); } }
function viewImg(src){ $('edBody').innerHTML=`<img src="${src}" style="width:100%;border-radius:16px">`; openSheet('edSheet'); }
function armSecret(){ secretArmed=true; closeDrawers(); $('txt').placeholder='Type a secret message…'; $('txt').focus(); toast('Next message is secret'); }
function sendFx(k,name){ closeSheets(); closeDrawers(); const t=$('txt').value.trim(); $('txt').value=''; syncSend(); sendChat(t?'text':'fx',{text:t||name,fx:k}); rain(k,34); }
function sendLocation(){ closeDrawers(); if(!navigator.geolocation) return toast('Location not available'); toast('Getting your location…');
  navigator.geolocation.getCurrentPosition(p=>sendChat('location',{data:{lat:+p.coords.latitude.toFixed(5),lng:+p.coords.longitude.toFixed(5)}}),()=>toast('Location permission was denied'),{timeout:12000}); }
/* wallpapers (local only) */
const WPS=[['Aurora','radial-gradient(circle at 20% 20%,rgba(255,77,141,.35),transparent 40%),radial-gradient(circle at 80% 70%,rgba(99,102,241,.4),transparent 45%),#0a0713'],['Midnight','linear-gradient(180deg,#0b1026,#1b1140)'],['Rose','linear-gradient(160deg,#3b0a24,#7a1d4a 60%,#2a0b2e)'],['Starfield','radial-gradient(1px 1px at 20% 30%,#fff,transparent),radial-gradient(1px 1px at 70% 60%,#fff,transparent),radial-gradient(1.5px 1.5px at 40% 80%,#fff,transparent),radial-gradient(1px 1px at 85% 20%,#fff,transparent),radial-gradient(1px 1px at 10% 70%,#fff,transparent),radial-gradient(1.5px 1.5px at 55% 15%,#fff,transparent),linear-gradient(180deg,#050816,#1a1040)'],['Ocean','linear-gradient(170deg,#042f4b,#0e7490 60%,#083344)'],['Sunset','linear-gradient(170deg,#4c1d95,#be185d 55%,#f97316)']];
function renderWps(){ const on=S.get('wp',0); $('wps').innerHTML=WPS.map((w,i)=>`<button class="${on===i?'on':''}" style="background:${w[1]};background-size:cover" onclick="setWp(${i})">${w[0]}</button>`).join('')+`<label style="background:var(--gl2)">Your photo<input type="file" accept="image/*" hidden onchange="wpPhoto(this)"></label>`; }
function applyWp(){ const on=S.get('wp',0); if(on===-1){ const u=S.get('wpImg'); if(u) $('wall').style.background=`linear-gradient(rgba(10,7,19,.45),rgba(10,7,19,.45)),url(${u}) center/cover`; } else { $('wall').style.background=WPS[on][1]; $('wall').style.backgroundSize='cover'; } renderWps(); }
function setWp(i){ S.set('wp',i); applyWp(); toast('Wallpaper: '+WPS[i][0]); }
async function wpPhoto(inp){ const f=inp.files[0]; inp.value=''; if(!f) return; const d=await compressImg(f,700); S.set('wpImg',d); S.set('wp',-1); applyWp(); closeSheets(); }

/* ---------- voice recording (chat + walkie) ---------- */
const REC={mr:null,chunks:[],t0:0,sim:false,stream:null};
async function recStart(){ REC.chunks=[]; REC.t0=Date.now(); REC.sim=false;
  try{ REC.stream=await navigator.mediaDevices.getUserMedia({audio:true}); const type=['audio/webm;codecs=opus','audio/mp4','audio/webm'].find(t=>window.MediaRecorder&&MediaRecorder.isTypeSupported&&MediaRecorder.isTypeSupported(t))||'';
    REC.mr=new MediaRecorder(REC.stream,type?{mimeType:type,audioBitsPerSecond:24000}:undefined); REC.mr.ondataavailable=e=>e.data.size&&REC.chunks.push(e.data); REC.mr.start(); }
  catch(e){ REC.sim=true; REC.mr=null; } }
function recStop(){ return new Promise(ok=>{ const dur=Math.max(1,Math.round((Date.now()-REC.t0)/1000));
  if(REC.sim||!REC.mr){ ok({data:null,dur,sim:true}); return; }
  REC.mr.onstop=()=>{ REC.stream.getTracks().forEach(t=>t.stop()); const blob=new Blob(REC.chunks,{type:REC.mr.mimeType||'audio/webm'}); const r=new FileReader(); r.onload=()=>ok({data:r.result,dur,sim:false}); r.readAsDataURL(blob); };
  REC.mr.stop(); }); }
function recCancel(){ try{ REC.mr&&REC.mr.state!=='inactive'&&REC.mr.stop(); REC.stream&&REC.stream.getTracks().forEach(t=>t.stop()); }catch(e){} }
function voiceHTML(m){ let bars=''; const seed=(m.id||'x').charCodeAt(3)||7; for(let i=0;i<30;i++) bars+=`<i style="height:${5+Math.abs(Math.sin(i*1.7+seed))*19}px"></i>`; return `<div class="voice"><button class="pb" onclick="playVoice(this,'${m.id}')">${ic('playt','s')}</button><div class="wave">${bars}</div><span style="font-size:11px;font-weight:800">0:${String(Math.min(59,m.dur||1)).padStart(2,'0')}</span></div>`; }
let playing=null;
function playVoice(b,id){ const m=findMsg(id); if(!m) return; const bars=[...b.parentNode.querySelectorAll('.wave i')];
  if(b._iv){ clearInterval(b._iv); b._iv=null; b.innerHTML=ic('playt','s'); bars.forEach(x=>x.classList.remove('p')); if(playing){playing.pause();playing=null;} return; }
  b.innerHTML=ic('pause','s'); const dur=(m.dur||1)*1000; const t0=Date.now();
  if(m.data){ try{ if(playing) playing.pause(); playing=new Audio(m.data); playing.play().catch(()=>{}); }catch(e){} }
  b._iv=setInterval(()=>{ const k=(Date.now()-t0)/dur*bars.length; bars.forEach((x,i)=>x.classList.toggle('p',i<k)); if(k>bars.length){ clearInterval(b._iv); b._iv=null; b.innerHTML=ic('playt','s'); bars.forEach(x=>x.classList.remove('p')); } },80); }
function micSetup(){
  const sb=$('sendBtn'); let rec=false, iv, sx=0, cancel=false, t0=0;
  sb.addEventListener('pointerdown',async e=>{ if($('txt').value.trim()) return; e.preventDefault(); sb.setPointerCapture(e.pointerId); rec=true; cancel=false; sx=e.clientX; t0=Date.now(); sb.classList.add('rec'); $('recBar').classList.add('show'); buzz(20); iv=setInterval(()=>{const s=Math.floor((Date.now()-t0)/1000);$('recT').textContent='0:'+String(s).padStart(2,'0');},200); await recStart(); if(!rec) recCancel(); });
  sb.addEventListener('pointermove',e=>{ if(rec&&sx-e.clientX>80){ cancel=true; $('recT').textContent='Cancel'; } });
  const end=async()=>{ if(!rec) return; rec=false; clearInterval(iv); sb.classList.remove('rec'); $('recBar').classList.remove('show');
    if(cancel||Date.now()-t0<450){ recCancel(); if(!cancel) toast('Hold the mic to record'); return; }
    const r=await recStop(); if(r.sim) toast('Mic not available here · sent a sample voice note'); sendChat('voice',{data:r.data,dur:r.dur}); };
  sb.addEventListener('pointerup',end); sb.addEventListener('pointercancel',end);
  sb.addEventListener('click',()=>{ if($('txt').value.trim()) sendMsg(); }); }

/* ---------- CALLS (WebRTC, signalling through the encrypted inbox) ---------- */
let CALL=null;
const ICE=[{urls:['stun:stun.l.google.com:19302','stun:stun1.l.google.com:19302']}].concat(window.BH_TURN||[]);
async function getMedia(video){ try{ return await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true,noiseSuppression:true},video:video?{facingMode:'user',width:{ideal:720}}:false}); }catch(e){ toast('Camera/mic not available · you can still hear and see '+HER()); return null; } }
function makePC(){ const pc=new RTCPeerConnection({iceServers:ICE}); const remote=new MediaStream();
  pc.ontrack=e=>{ e.streams[0]?e.streams[0].getTracks().forEach(t=>remote.addTrack(t)):remote.addTrack(e.track); $('ra').srcObject=remote; $('ra').play().catch(()=>{}); if(remote.getVideoTracks().length){ $('rv').srcObject=remote; $('rv').muted=true; $('rv').style.display='block'; $('callV').classList.remove('on'); } };
  pc.onicecandidate=e=>{ if(e.candidate&&CALL) BUS.send('rtc',{id:CALL.id,c:e.candidate.toJSON()},{kind:'rtc'}); };
  pc.onconnectionstatechange=()=>{ if(!CALL) return; if(pc.connectionState==='connected') callConnected(); if(['failed','disconnected'].includes(pc.connectionState)) setTimeout(()=>{ if(CALL&&pc.connectionState!=='connected'){ toast('Connection lost'); endCall(true); } },4000); };
  return {pc,remote}; }
function callUI(state){ $('callAv').innerHTML=avatar(herAv(),'smile','idle','head'); $('callState').textContent=state; $('callInfo').style.display='block'; $('rv').style.display='none'; $('callV').classList.remove('on'); $('pip').classList.remove('on'); $('vcTop').style.display='none'; }
async function startCall(video){
  if(CALL) return; if(!BUS.cid) return toast('Connect with your partner first');
  CALL={id:uidGen(),video,role:'caller',cands:[],from:cur}; go('call'); callUI(video?'Video calling…':'Calling…'); $('callAv').classList.add('ripple');
  $('callBtns').innerHTML=`<button class="end" onclick="endCall()">${ic('endcall')}</button>`;
  CALL.local=await getMedia(video); const {pc,remote}=makePC(); CALL.pc=pc; CALL.remote=remote;
  if(CALL.local){ CALL.local.getTracks().forEach(t=>pc.addTrack(t,CALL.local)); if(video) showLocal(); } else { pc.addTransceiver('audio',{direction:'recvonly'}); if(video) pc.addTransceiver('video',{direction:'recvonly'}); }
  pc.createDataChannel('bh');
  const offer=await pc.createOffer(); await pc.setLocalDescription(offer);
  await BUS.send('call',{id:CALL.id,video,sdp:pc.localDescription.toJSON()},{kind:'call'});
  if(!PRES.online) $('callState').textContent=HER()+' is offline · ringing when '+P3().s+' opens the app';
  CALL.timeout=setTimeout(()=>{ if(CALL&&!CALL.connected){ BUS.send('callEnd',{id:CALL.id,reason:'missed'}); sysMsg('No answer · '+(video?'video':'voice')+' call'); cleanupCall(); } },40000);
}
function showLocal(){ if(CALL&&CALL.local&&CALL.local.getVideoTracks().length){ $('lv').srcObject=CALL.local; $('lv').style.display='block'; $('pipAv').style.display='none'; } else { $('lv').style.display='none'; $('pipAv').style.display='block'; $('pipAv').innerHTML=avatar(myAv(),'smile','idle'); } $('pip').classList.add('on'); }
handle('call',async(b,ev)=>{
  if(Date.now()-ev.ts>45000){ sysMsg('Missed '+(b.video?'video':'voice')+' call · '+tfmt(ev.ts)); notifyUser('phone','Missed call from '+HER(),tfmt(ev.ts),'chat','msg'); return; }
  if(CALL){ BUS.send('callEnd',{id:b.id,reason:'busy'}); return; }
  CALL={id:b.id,video:b.video,role:'callee',offer:b.sdp,cands:[],from:cur}; go('call'); callUI((b.video?'Video':'Voice')+' call · incoming'); $('callAv').classList.add('ripple');
  $('callBtns').innerHTML=`<button class="end" onclick="declineCall()">${ic('endcall')}</button><button class="acc" onclick="acceptCall()">${ic(b.video?'video':'phone')}</button>`;
  notifyUser(b.video?'video':'phone','Incoming '+(b.video?'video':'voice')+' call',HER()+' is calling','call','call',{always:true,tag:'call'});
  CALL.ring=setInterval(()=>buzz([400,200,400]),2200);
});
async function acceptCall(){ if(!CALL) return; clearInterval(CALL.ring); $('callState').textContent='Connecting…'; $('callBtns').innerHTML=`<button class="end" onclick="endCall()">${ic('endcall')}</button>`;
  CALL.local=await getMedia(CALL.video); const {pc,remote}=makePC(); CALL.pc=pc; CALL.remote=remote;
  if(CALL.local){ CALL.local.getTracks().forEach(t=>pc.addTrack(t,CALL.local)); if(CALL.video) showLocal(); }
  await pc.setRemoteDescription(CALL.offer); for(const c of CALL.cands) try{ await pc.addIceCandidate(c); }catch(e){} CALL.cands=[];
  const ans=await pc.createAnswer(); await pc.setLocalDescription(ans); await BUS.send('callAnswer',{id:CALL.id,sdp:pc.localDescription.toJSON()},{kind:'rtc'}); }
function declineCall(){ if(!CALL) return; BUS.send('callEnd',{id:CALL.id,reason:'declined'}); sysMsg('Declined call'); cleanupCall(); }
handle('callAnswer',async b=>{ if(!CALL||CALL.id!==b.id) return; await CALL.pc.setRemoteDescription(b.sdp); for(const c of CALL.cands) try{ await CALL.pc.addIceCandidate(c); }catch(e){} CALL.cands=[]; $('callState').textContent='Connecting…'; });
handle('rtc',async b=>{ if(!CALL||CALL.id!==b.id) return; if(CALL.pc&&CALL.pc.remoteDescription) try{ await CALL.pc.addIceCandidate(b.c); }catch(e){} else CALL.cands.push(b.c); });
handle('callEnd',b=>{ if(!CALL||CALL.id!==b.id) return; const r={declined:HER()+' declined',busy:HER()+' is on another call',missed:'Missed call',ended:'Call ended'}[b.reason]||'Call ended'; if(b.reason==='missed') sysMsg('Missed '+(CALL.video?'video':'voice')+' call'); else if(CALL.connected) sysMsg(`${CALL.video?'Video':'Voice'} call · ${fmtDur(CALL.sec||0)}`); toast(r); cleanupCall(); });
function fmtDur(s){ return Math.floor(s/60)+':'+String(s%60).padStart(2,'0'); }
function callConnected(){ if(!CALL||CALL.connected) return; CALL.connected=true; clearTimeout(CALL.timeout); $('callAv').classList.remove('ripple'); buzz(40); CALL.sec=0;
  if(CALL.video){ $('callInfo').style.display='none'; $('vcTop').style.display='block'; if(!CALL.remote.getVideoTracks().length){ $('callV').classList.add('on'); $('callVA').innerHTML=avatar(herAv(),'smile','wave'); } showLocal(); }
  $('callBtns').innerHTML=`<button onclick="toggleMute(this)">${ic('mic')}</button><button onclick="toggleSpk(this)">${ic('speaker')}</button>${CALL.video?`<button class="on" onclick="toggleCamTrack(this)">${ic('video')}</button><button onclick="flipCam()">${ic('flip')}</button>`:''}<button class="end" onclick="endCall()">${ic('endcall')}</button>`;
  CALL.iv=setInterval(()=>{ CALL.sec++; $('callState').textContent=fmtDur(CALL.sec); $('vcT').textContent='🔒 '+fmtDur(CALL.sec); },1000); $('callState').textContent='0:00'; }
function toggleMute(b){ if(!CALL||!CALL.local) return toast('No microphone'); const t=CALL.local.getAudioTracks()[0]; if(!t) return; t.enabled=!t.enabled; b.classList.toggle('on',!t.enabled); b.innerHTML=ic(t.enabled?'mic':'mute'); }
function toggleSpk(b){ b.classList.toggle('on'); toast('Speaker '+(b.classList.contains('on')?'on':'off')); }
function toggleCamTrack(b){ if(!CALL||!CALL.local) return toast('No camera'); const t=CALL.local.getVideoTracks()[0]; if(!t) return; t.enabled=!t.enabled; b.classList.toggle('on',t.enabled); }
async function flipCam(){ if(!CALL||!CALL.local) return; const t=CALL.local.getVideoTracks()[0]; if(!t) return; const fm=(t.getSettings().facingMode==='user')?'environment':'user'; try{ const s=await navigator.mediaDevices.getUserMedia({video:{facingMode:fm}}); const nt=s.getVideoTracks()[0]; const snd=CALL.pc.getSenders().find(x=>x.track&&x.track.kind==='video'); await snd.replaceTrack(nt); t.stop(); CALL.local.removeTrack(t); CALL.local.addTrack(nt); showLocal(); }catch(e){ toast('Could not switch camera'); } }
function endCall(silent){ if(!CALL) return; BUS.send('callEnd',{id:CALL.id,reason:CALL.connected?'ended':(CALL.role==='caller'?'missed':'declined')}); if(CALL.connected) sysMsg(`${CALL.video?'Video':'Voice'} call · ${fmtDur(CALL.sec||0)}`); else if(CALL.role==='caller'&&!silent) sysMsg('Call cancelled'); cleanupCall(); }
function cleanupCall(){ if(!CALL) return; clearInterval(CALL.iv); clearInterval(CALL.ring); clearTimeout(CALL.timeout); try{ CALL.pc&&CALL.pc.close(); }catch(e){} if(CALL.local) CALL.local.getTracks().forEach(t=>t.stop()); $('rv').srcObject=null; $('lv').srcObject=null; $('ra').srcObject=null; const back2=CALL.from&&CALL.from!=='call'?CALL.from:'chat'; CALL=null; if(cur==='call') go(back2==='call'?'chat':back2,true); }
function pipDrag(){ const p=$('pip'); let d=null; p.addEventListener('pointerdown',e=>{p.setPointerCapture(e.pointerId);d={x:e.clientX-p.offsetLeft,y:e.clientY-p.offsetTop};}); p.addEventListener('pointermove',e=>{if(!d)return;p.style.left=(e.clientX-d.x)+'px';p.style.top=(e.clientY-d.y)+'px';p.style.right='auto';}); p.addEventListener('pointerup',()=>d=null); }
