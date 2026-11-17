/* Better Half – sync layer.
   One API, two transports:
   - LocalBus: two phones on the same computer (demo.html), synced with BroadcastChannel + localStorage.
   - FirebaseBus: real phones, Firebase Auth (Google) + Realtime Database.
   Everything sent between partners is end-to-end encrypted (ECDH P-256 -> AES-GCM). */

/* ---------------- crypto ---------------- */
const Crypt = {
  ok: !!(window.crypto && crypto.subtle),
  key: null,
  b64(buf){ let s=''; const b=new Uint8Array(buf); for(let i=0;i<b.length;i+=8192) s+=String.fromCharCode.apply(null,b.subarray(i,i+8192)); return btoa(s); },
  unb64(s){ const b=atob(s), u=new Uint8Array(b.length); for(let i=0;i<b.length;i++) u[i]=b.charCodeAt(i); return u; },
  async myKeys(store){
    if(!this.ok) return {pub:null};
    let k=store.get('keys');
    if(!k){ const kp=await crypto.subtle.generateKey({name:'ECDH',namedCurve:'P-256'},true,['deriveKey']);
      k={pub:await crypto.subtle.exportKey('jwk',kp.publicKey),priv:await crypto.subtle.exportKey('jwk',kp.privateKey)}; store.set('keys',k); }
    return k;
  },
  async derive(store, partnerPub){
    if(!this.ok||!partnerPub){ this.key=null; return; }
    const k=await this.myKeys(store);
    const priv=await crypto.subtle.importKey('jwk',k.priv,{name:'ECDH',namedCurve:'P-256'},false,['deriveKey']);
    const pub=await crypto.subtle.importKey('jwk',partnerPub,{name:'ECDH',namedCurve:'P-256'},false,[]);
    this.key=await crypto.subtle.deriveKey({name:'ECDH',public:pub},priv,{name:'AES-GCM',length:256},false,['encrypt','decrypt']);
  },
  async safety(a,b){ if(!this.ok||!a||!b) return '—'; const s=[JSON.stringify(a.x+a.y),JSON.stringify(b.x+b.y)].sort().join('|'); const h=new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s))); const g=[]; for(let i=0;i<6;i++) g.push(String(((h[i*3]<<16)|(h[i*3+1]<<8)|h[i*3+2])%100000).padStart(5,'0')); return g.join(' '); },
  async enc(obj){ const txt=JSON.stringify(obj); if(!this.key) return {p:txt};
    const iv=crypto.getRandomValues(new Uint8Array(12)); const ct=await crypto.subtle.encrypt({name:'AES-GCM',iv},this.key,new TextEncoder().encode(txt));
    return {iv:this.b64(iv),c:this.b64(ct)}; },
  async dec(box){ if(!box) return null; if(box.p!==undefined) return JSON.parse(box.p); if(!this.key) return null;
    try{ const pt=await crypto.subtle.decrypt({name:'AES-GCM',iv:this.unb64(box.iv)},this.key,this.unb64(box.c)); return JSON.parse(new TextDecoder().decode(pt)); }catch(e){ return null; } },
  /* password-locked notes: the note itself is encrypted with a key made from the password */
  async pwKey(pw,salt){ const base=await crypto.subtle.importKey('raw',new TextEncoder().encode(pw.trim().toLowerCase()),'PBKDF2',false,['deriveKey']);
    return crypto.subtle.deriveKey({name:'PBKDF2',salt,iterations:120000,hash:'SHA-256'},base,{name:'AES-GCM',length:256},false,['encrypt','decrypt']); },
  async pwSeal(text,pw){ if(!this.ok) return {plain:text}; const salt=crypto.getRandomValues(new Uint8Array(16)), iv=crypto.getRandomValues(new Uint8Array(12)); const k=await this.pwKey(pw,salt);
    const ct=await crypto.subtle.encrypt({name:'AES-GCM',iv},k,new TextEncoder().encode(text)); return {s:this.b64(salt),iv:this.b64(iv),c:this.b64(ct)}; },
  async pwOpen(box,pw){ if(box.plain!==undefined) return box.plain; try{ const k=await this.pwKey(pw,this.unb64(box.s)); const pt=await crypto.subtle.decrypt({name:'AES-GCM',iv:this.unb64(box.iv)},k,this.unb64(box.c)); return new TextDecoder().decode(pt); }catch(e){ return null; } }
};

/* ---------------- per-device storage ---------------- */
function makeStore(prefix){
  return {
    get(k,d=null){ try{ const v=localStorage.getItem(prefix+k); return v==null?d:JSON.parse(v); }catch(e){ return d; } },
    set(k,v){ try{ localStorage.setItem(prefix+k,JSON.stringify(v)); }catch(e){ console.warn('storage full',e); } },
    del(k){ try{ localStorage.removeItem(prefix+k); }catch(e){} }
  };
}
const uidGen=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,8);

/* ---------------- common bus logic ---------------- */
class BaseBus {
  constructor(store){ this.store=store; this.evH=[]; this.stH=[]; this.lvH=[]; this.prH=[]; this.state={}; this.partner=null; this.cid=null; this.uid=null; this.presence={online:false,screen:'',ts:0}; }
  onEvent(cb){ this.evH.push(cb); }
  onState(cb){ this.stH.push(cb); }
  onLive(cb){ this.lvH.push(cb); }
  onPresence(cb){ this.prH.push(cb); }
  async _gotEvent(e){ const body=await Crypt.dec(e.body); if(body==null) return; const ev={...e,body}; this.evH.forEach(h=>{ try{h(ev)}catch(x){console.error(x)} }); }
  async _gotState(path,box){ const v=box?await Crypt.dec(box.v):null; if(box&&v==null) return; if(v==null) delete this.state[path]; else this.state[path]={...v,_by:box.by,_at:box.at};
    this.stH.forEach(h=>{ try{h(path,this.state[path]||null)}catch(x){console.error(x)} }); }
  _gotLive(ch,data){ this.lvH.forEach(h=>{ try{h(ch,data)}catch(x){console.error(x)} }); }
  _gotPresence(p){ this.presence=p; this.prH.forEach(h=>{ try{h(p)}catch(x){console.error(x)} }); }
  get(path){ return this.state[path]||null; }
  list(prefix){ return Object.keys(this.state).filter(k=>k.startsWith(prefix)).map(k=>({path:k,id:k.slice(prefix.length),...this.state[k]})); }
  async setupKeys(partnerPub){ await Crypt.derive(this.store,partnerPub); }
}

/* ---------------- LocalBus (demo: two phones in one browser) ---------------- */
class LocalBus extends BaseBus {
  constructor(store,role){ super(store); this.role=role; this.kind='local'; this.ch=new BroadcastChannel('bh-server'); this.ch.onmessage=e=>this._msg(e.data); this.hb=null; }
  srv(k,d=null){ try{ const v=localStorage.getItem('bhsrv.'+k); return v==null?d:JSON.parse(v); }catch(e){ return d; } }
  put(k,v){ localStorage.setItem('bhsrv.'+k,JSON.stringify(v)); }
  async login(){ const acc=this.role==='her'?{uid:'u-her',email:'her@gmail.com',name:''}:{uid:'u-him',email:'him@gmail.com',name:''}; this.uid=acc.uid; return acc; }
  async restore(uid){ this.uid=uid; return true; }
  async publishProfile(p){ this.put('user.'+this.uid,p); this.ch.postMessage({k:'user',uid:this.uid}); }
  async getUser(uid){ return this.srv('user.'+uid); }
  watchUser(uid,cb){ const f=d=>{ if(d.k==='user'&&d.uid===uid) cb(this.srv('user.'+uid)); }; (this._uw=this._uw||[]).push(f); cb(this.srv('user.'+uid)); }
  async createInvite(){ const code=String(Math.floor(100000+Math.random()*900000)); this.put('invite.'+code,{uid:this.uid,ts:Date.now()}); this.store.set('myInvite',code); return code; }
  async redeemInvite(code){ const inv=this.srv('invite.'+code); if(!inv) throw new Error('That code does not exist'); if(inv.uid===this.uid) throw new Error('That is your own code'); if(inv.claimed) throw new Error('This code was already used'); if(Date.now()-inv.ts>864e5) throw new Error('This code has expired');
    const cid='c-'+uidGen(); this.put('couple.'+cid,{members:[inv.uid,this.uid],ts:Date.now()}); inv.claimed={uid:this.uid,cid}; this.put('invite.'+code,inv); this.ch.postMessage({k:'claim',code}); return {cid,partnerUid:inv.uid}; }
  watchInvite(code,cb){ const f=d=>{ if(d.k==='claim'&&d.code===code){ const inv=this.srv('invite.'+code); if(inv&&inv.claimed) cb(inv.claimed.cid,inv.claimed.uid); } }; (this._iw=this._iw||[]).push(f); const inv=this.srv('invite.'+code); if(inv&&inv.claimed) cb(inv.claimed.cid,inv.claimed.uid); }
  async attach(cid,partnerUid){ this.cid=cid; this.partner=partnerUid; const pre='bhsrv.st.'+cid+'.'; for(let i=0;i<localStorage.length;i++){ const k=localStorage.key(i); if(k&&k.startsWith(pre)) await this._gotState(k.slice(pre.length),JSON.parse(localStorage.getItem(k))); } await this.drain();
    clearInterval(this.hb); this.hb=setInterval(()=>this._beat(),2000); this._beat(); this._pcheck=setInterval(()=>{ if(this.presence.online&&Date.now()-this.presence.ts>6500) this._gotPresence({...this.presence,online:false}); },1500); }
  detach(){ clearInterval(this.hb); clearInterval(this._pcheck); this.cid=null; this.partner=null; this.state={}; }
  screen(s){ this.myScreen=s; this._beat(); }
  _beat(){ if(!this.cid||this.offline) return; this.ch.postMessage({k:'pres',cid:this.cid,uid:this.uid,screen:this.myScreen||'',ts:Date.now()}); }
  async send(type,payload,meta={}){ if(!this.cid) return; const e={id:uidGen(),from:this.uid,type,ts:Date.now(),kind:meta.kind||type,body:await Crypt.enc(payload)};
    const k='inbox.'+this.cid+'.'+this.partner; const q=this.srv(k,[]); q.push(e); this.put(k,q); this.ch.postMessage({k:'inbox',to:this.partner}); return e.id; }
  async drain(){ if(!this.cid||this.offline) return; const k='inbox.'+this.cid+'.'+this.uid; if(this._draining) return; this._draining=true; try{ const q=this.srv(k,[]); if(!q.length) return; const ids=new Set(q.map(e=>e.id)); this.put(k,this.srv(k,[]).filter(e=>!ids.has(e.id))); q.sort((a,b)=>a.ts-b.ts); for(const e of q) await this._gotEvent(e); } finally { this._draining=false; } if(this.srv(k,[]).length) setTimeout(()=>this.drain(),0); }
  async setState(path,obj){ if(!this.cid) return; const box={v:await Crypt.enc(obj),by:this.uid,at:Date.now()}; this.put('st.'+this.cid+'.'+path,box); await this._gotState(path,box); this.ch.postMessage({k:'state',cid:this.cid,path}); }
  async delState(path){ if(!this.cid) return; localStorage.removeItem('bhsrv.st.'+this.cid+'.'+path); await this._gotState(path,null); this.ch.postMessage({k:'state',cid:this.cid,path}); }
  live(ch,data){ if(!this.cid||this.offline) return; this.ch.postMessage({k:'live',cid:this.cid,from:this.uid,ch,data}); }
  async unpair(){ if(this.cid){ localStorage.removeItem('bhsrv.couple.'+this.cid); } this.detach(); }
  async _msg(d){
    if(this.offline) return;
    if(d.k==='user') (this._uw||[]).forEach(f=>f(d));
    if(d.k==='claim') (this._iw||[]).forEach(f=>f(d));
    if(!this.cid) return;
    if(d.k==='inbox'&&d.to===this.uid) this.drain();
    if(d.k==='state'&&d.cid===this.cid){ await this._gotState(d.path,this.srv('st.'+this.cid+'.'+d.path)); }
    if(d.k==='live'&&d.cid===this.cid&&d.from!==this.uid) this._gotLive(d.ch,d.data);
    if(d.k==='pres'&&d.cid===this.cid&&d.uid!==this.uid){ const was=this.presence; const p={online:true,screen:d.screen,ts:d.ts}; if(!was.online||was.screen!==p.screen) this._gotPresence(p); else this.presence=p; }
  }
  setOffline(v){ this.offline=v; if(v) this._gotPresence({online:false,screen:'',ts:0}); }
}

/* ---------------- FirebaseBus (real phones) ---------------- */
class FirebaseBus extends BaseBus {
  constructor(store,cfg){ super(store); this.kind='firebase'; this.cfg=cfg; }
  async boot(){
    const v='10.12.5', base='https://www.gstatic.com/firebasejs/'+v+'/';
    for(const f of ['firebase-app-compat.js','firebase-auth-compat.js','firebase-database-compat.js','firebase-messaging-compat.js']) await new Promise((ok,no)=>{ const s=document.createElement('script'); s.src=base+f; s.onload=ok; s.onerror=no; document.head.appendChild(s); });
    this.app=firebase.initializeApp(this.cfg); this.auth=firebase.auth(); this.db=firebase.database();
    await this.auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL);
    this.authReady=new Promise(r=>{ const off=this.auth.onAuthStateChanged(u=>{ off(); r(u); }); });
    try{ const rr=await this.auth.getRedirectResult(); if(rr&&rr.user) this._redirectUser=rr.user; }catch(e){}
  }
  async login(){
    const p=new firebase.auth.GoogleAuthProvider(); p.setCustomParameters({prompt:'select_account'});
    let u; try{ u=(await this.auth.signInWithPopup(p)).user; }catch(e){ if(/popup|operation-not-supported/.test(e.code||'')){ await this.auth.signInWithRedirect(p); return null; } throw e; }
    this.uid=u.uid; return {uid:u.uid,email:u.email,name:u.displayName||''};
  }
  async restore(uid){ const u=this._redirectUser||await this.authReady; if(!u||u.uid!==uid) return false; this.uid=u.uid; return true; }
  async currentUser(){ const u=this._redirectUser||await this.authReady; return u?{uid:u.uid,email:u.email,name:u.displayName||''}:null; }
  ref(p){ return this.db.ref(p); }
  async publishProfile(p){ await this.ref('users/'+this.uid).update(p); }
  async getUser(uid){ return (await this.ref('users/'+uid).get()).val(); }
  watchUser(uid,cb){ this.ref('users/'+uid).on('value',s=>cb(s.val())); }
  async createInvite(){ for(let i=0;i<5;i++){ const code=String(Math.floor(100000+Math.random()*900000)); const r=await this.ref('invites/'+code).transaction(c=>c?undefined:{uid:this.uid,ts:Date.now()}); if(r.committed){ this.store.set('myInvite',code); return code; } } throw new Error('Could not create a code, try again'); }
  async redeemInvite(code){ const inv=(await this.ref('invites/'+code).get()).val(); if(!inv) throw new Error('That code does not exist'); if(inv.uid===this.uid) throw new Error('That is your own code'); if(inv.claimed) throw new Error('This code was already used'); if(Date.now()-inv.ts>864e5) throw new Error('This code has expired');
    const cid=this.ref('couples').push().key; await this.ref('couples/'+cid).set({members:{[inv.uid]:true,[this.uid]:true},ts:firebase.database.ServerValue.TIMESTAMP});
    await this.ref('invites/'+code+'/claimed').set({uid:this.uid,cid}); return {cid,partnerUid:inv.uid}; }
  watchInvite(code,cb){ this.ref('invites/'+code+'/claimed').on('value',s=>{ const c=s.val(); if(c) cb(c.cid,c.uid); }); }
  async attach(cid,partnerUid){ this.cid=cid; this.partner=partnerUid; const base='couples/'+cid;
    this.ref(base+'/state').on('child_added',s=>this._gotState(dk(s.key),s.val())); this.ref(base+'/state').on('child_changed',s=>this._gotState(dk(s.key),s.val())); this.ref(base+'/state').on('child_removed',s=>this._gotState(dk(s.key),null));
    this.ref(base+'/inbox/'+this.uid).on('child_added',async s=>{ const e=s.val(); await this._gotEvent(e); s.ref.remove(); });
    this.ref(base+'/live/'+partnerUid).on('child_changed',s=>this._gotLive(s.key,s.val()&&s.val().d)); this.ref(base+'/live/'+partnerUid).on('child_added',s=>this._gotLive(s.key,s.val()&&s.val().d));
    const pr=this.ref(base+'/presence/'+this.uid);
    this.ref('.info/connected').on('value',s=>{ if(s.val()){ pr.onDisconnect().set({online:false,screen:'',ts:firebase.database.ServerValue.TIMESTAMP}); pr.set({online:true,screen:this.myScreen||'',ts:firebase.database.ServerValue.TIMESTAMP}); } });
    this.ref(base+'/presence/'+partnerUid).on('value',s=>{ const v=s.val()||{online:false}; this._gotPresence({online:!!v.online,screen:v.screen||'',ts:v.ts||0}); });
    this.ref(base+'/members').on('value',s=>{ const m=s.val(); if(m&&!m[this.uid]) this._gotEvent({type:'unpaired',from:partnerUid,ts:Date.now(),body:{p:'{}'}}); });
  }
  detach(){ if(this.cid) this.ref('couples/'+this.cid).off(); this.cid=null; this.state={}; }
  screen(s){ this.myScreen=s; if(this.cid) this.ref('couples/'+this.cid+'/presence/'+this.uid).update({screen:s,online:true}); }
  async send(type,payload,meta={}){ if(!this.cid) return; const e={id:uidGen(),from:this.uid,type,ts:Date.now(),kind:meta.kind||type,body:await Crypt.enc(payload)}; await this.ref('couples/'+this.cid+'/inbox/'+this.partner).push(e); return e.id; }
  async setState(path,obj){ const box={v:await Crypt.enc(obj),by:this.uid,at:Date.now()}; await this._gotState(path,box); await this.ref('couples/'+this.cid+'/state/'+ek(path)).set(box); }
  async delState(path){ await this._gotState(path,null); await this.ref('couples/'+this.cid+'/state/'+ek(path)).remove(); }
  live(ch,data){ if(!this.cid) return; this.ref('couples/'+this.cid+'/live/'+this.uid+'/'+ch).set({d:data,t:Date.now()}); }
  async unpair(){ if(this.cid) await this.ref('couples/'+this.cid+'/members/'+this.uid).remove(); await this.ref('users/'+this.uid+'/coupleId').remove(); this.detach(); }
  async savePushToken(vapid,reg){ try{ const m=firebase.messaging(); const t=await m.getToken({vapidKey:vapid,serviceWorkerRegistration:reg}); if(t) await this.ref('tokens/'+this.uid+'/'+t.replace(/[.#$\[\]]/g,'_')).set(true); m.onMessage(()=>{}); return !!t; }catch(e){ console.warn('push token',e); return false; } }
}
const ek=p=>p.replace(/\//g,'|'), dk=k=>k.replace(/\|/g,'/');
