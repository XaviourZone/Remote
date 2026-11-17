/* Better Half – synced two-player games */
const amA=()=>SES.uid<SES.partnerUid;                 // stable "player A" for the couple
const ME_ID=()=>SES.uid, HER_ID=()=>SES.partnerUid;
const GAMES=[['carom','Carom','target','go','Real physics · pull and flick'],['bball','Hoops','ball','gy','Flick to shoot · beat each other\'s best'],['hockey','Air Hockey','puck','gc','Live, real-time · or vs bot'],['ttt','Tic-Tac-Toe','grid','gv','Classic · Infinite · 5×5'],['memory','Memory Match','cards','gg','Take turns finding pairs'],['askme','Ask Me','question','gp','Your own questions for each other']];
const GNAME={carom:'Carom',bball:'Hoops',hockey:'Air Hockey',ttt:'Tic-Tac-Toe',memory:'Memory Match',askme:'Ask Me'};
function hiDPI(cv,W,H){ const c=cv.getContext('2d'); c.setTransform(cv.width/W,0,0,cv.height/H,0,0); return c; }
function rr(c,x,y,w,h,r){ c.beginPath(); c.moveTo(x+r,y); c.arcTo(x+w,y,x+w,y+h,r); c.arcTo(x+w,y+h,x,y+h,r); c.arcTo(x,y+h,x,y,r); c.arcTo(x,y,x+w,y,r); c.closePath(); }
function addWin(uid){ const w={...(BUS.get('wins')||{})}; delete w._by; delete w._at; w[uid]=(w[uid]||0)+1; BUS.setState('wins',w); }
function turnPing(g){ BUS.send('gameTurn',{g},{kind:'game'}); }
function gameInvite(g){ BUS.send('gameInvite',{g},{kind:'game'}); toast('Invite sent to '+HER()+(PRES.online?'':' · '+P3().s+'\'ll see it when '+P3().s+' comes online')); }
let INV=[];
handle('gameInvite',(b,ev,fresh)=>{ INV=INV.filter(x=>x.g!==b.g); INV.push({g:b.g,ts:ev.ts}); S.set('inv',INV); renderInvites(); if(cur===b.g) return toast(HER()+' joined '+GNAME[b.g]);
  notifyUser('play',HER()+' invites you to play '+GNAME[b.g],fresh?'Tap to join':'Sent '+tfmt(ev.ts),b.g,'game',{always:true}); if(fresh&&!document.hidden) banner('play',`<b>${esc(HER())}</b> is calling you for <b>${GNAME[b.g]}</b>`,[{t:'Join',f:()=>go(b.g)},{t:'Later',ghost:true}]); });
handle('gameTurn',(b)=>{ if(cur===b.g) return; notifyUser('play','Your turn in '+GNAME[b.g],HER()+' made a move',b.g,'game'); renderGames(); });
function renderInvites(){ const box=$('invList'); if(!box) return; INV=INV.filter(x=>Date.now()-x.ts<3*3600e3); box.innerHTML=INV.map(x=>`<div class="ginv"><span class="glyph gp" style="width:38px;height:38px;border-radius:12px">${ic('play','s')}</span><div style="flex:1;font-size:13.5px"><b>${esc(HER())}</b> invited you to <b>${GNAME[x.g]}</b><div class="mu">${tfmt(x.ts)}</div></div><button class="btn sm" onclick="INV=INV.filter(i=>i.g!=='${x.g}');S.set('inv',INV);go('${x.g}')">Join</button></div>`).join(''); }
function gStatus(g){ const me=ME_ID();
  if(g==='ttt'){ const s=BUS.get('game/ttt'); if(!s) return ['New','']; if(s.over) return ['Done','v']; return s.turn===me?['Your turn','']:[P3().P+' turn','v']; }
  if(g==='memory'){ const s=BUS.get('game/memory'); if(!s) return ['New','']; if(s.over) return ['Done','v']; return s.turn===me?['Your turn','']:[P3().P+' turn','v']; }
  if(g==='carom'){ const s=BUS.get('game/carom'); if(!s) return ['New','']; if(s.over) return ['Done','v']; return s.turn===me?['Your turn','']:[P3().P+' turn','v']; }
  if(g==='bball'){ const s=BUS.get('game/hoops')||{best:{}}; return ['Best '+((s.best||{})[me]||0),'c']; }
  if(g==='hockey') return PRES.online&&PRES.screen==='hockey'?[P3().S+'\'s here','c']:['Live','c'];
  if(g==='askme'){ const n=BUS.list('askme/').filter(q=>q.by!==me&&!q.ans).length; return n?[n+' new','']:['Ask','v']; } return ['',''];
}
function renderGames(){ if(!$('gameList')) return; $('gameList').innerHTML=GAMES.map(g=>{ const [t,c]=gStatus(g[0]); return `<div class="card gcard" onclick="go('${g[0]}')"><span class="glyph ${g[3]}" style="width:60px;height:60px;border-radius:19px;box-shadow:0 8px 20px rgba(0,0,0,.3)">${ic(g[2],'l')}</span><div style="flex:1"><b class="f" style="font-size:16px">${g[1]}</b><div class="mu">${g[4]}</div></div>${t?`<span class="pill ${c}">${t}</span>`:''}</div>`; }).join('');
  const w=BUS.get('wins')||{}; $('winsMe').textContent=w[ME_ID()]||0; $('winsHer').textContent=w[HER_ID()]||0; renderInvites(); }
onScreen('play',()=>{ INV=S.get('inv',[]); renderGames(); });
watchState('wins',()=>{ if(cur==='play') renderGames(); });

/* ================= TIC-TAC-TOE ================= */
const TMODES={classic:{N:3,K:3,inf:false,rule:'Get 3 in a row.'},infinite:{N:3,K:3,inf:true,rule:'Only 3 marks each. Your 4th removes your oldest (it blinks). No draws!'},big:{N:5,K:4,inf:false,rule:'5×5 board. Get 4 in a row.'}};
let tLastDrawn=-1;
function tLines(N,K){ const L=[]; for(let r=0;r<N;r++)for(let c=0;c<N;c++) for(const [dr,dc] of [[0,1],[1,0],[1,1],[1,-1]]){ const l=[]; for(let k=0;k<K;k++){const r2=r+dr*k,c2=c+dc*k; if(r2<0||r2>=N||c2<0||c2>=N)break; l.push(r2*N+c2);} if(l.length===K)L.push(l);} return L; }
function tWin(b,p,N,K){ return tLines(N,K).find(l=>l.every(i=>b[i]===p)); }
function tttNew(mode){ const old=BUS.get('game/ttt'); mode=mode||(old&&old.mode)||'classic'; const M=TMODES[mode]; const starter=old&&old.starter===ME_ID()?HER_ID():ME_ID();
  BUS.setState('game/ttt',{mode,N:M.N,K:M.K,inf:M.inf,b:Array(M.N*M.N).fill(''),q:{[ME_ID()]:[],[HER_ID()]:[]},turn:starter,starter,over:false,win:null,last:-1,seq:(old&&old.seq||0)+1,tw:old&&old.tw||{}});
  BUS.send('notice',{icon:'grid',title:ME()+' started Tic-Tac-Toe ('+mode+')',text:starter===HER_ID()?'You go first!':'Waiting for '+ME()+'\'s first move',target:'ttt',kind:'game'}); }
function tttMove(i){ const s=BUS.get('game/ttt'); if(!s||s.over) return; if(s.turn!==ME_ID()) return toast('Wait for '+HER()+'\'s move'); if(s.b[i]) return;
  const b=s.b.slice(), q={[ME_ID()]:(s.q[ME_ID()]||[]).slice(),[HER_ID()]:(s.q[HER_ID()]||[]).slice()};
  if(s.inf&&q[ME_ID()].length===3) b[q[ME_ID()].shift()]=''; b[i]=ME_ID(); q[ME_ID()].push(i); buzz(15);
  const w=tWin(b,ME_ID(),s.N,s.K), draw=!w&&b.every(v=>v); const tw={...(s.tw||{})}; if(w){ tw[ME_ID()]=(tw[ME_ID()]||0)+1; addWin(ME_ID()); }
  BUS.setState('game/ttt',{...s,b,q,turn:HER_ID(),last:i,over:!!(w||draw),win:w||null,winner:w?ME_ID():null,tw,_by:undefined,_at:undefined});
  if(w){ rain('confetti',30); BUS.send('notice',{icon:'trophy',title:ME()+' won Tic-Tac-Toe',text:'Tap to play again',target:'ttt',kind:'game'}); } else if(!draw) turnPing('ttt'); }
const XS=(anim)=>`<svg viewBox="0 0 40 40"><g stroke="#22d3ee" stroke-width="5" stroke-linecap="round" style="filter:drop-shadow(0 0 6px #22d3ee)"><path class="${anim?'draw':''}" pathLength="100" d="M8 8 32 32"/><path class="${anim?'draw':''}" pathLength="100" d="M32 8 8 32" style="animation-delay:.12s"/></g></svg>`;
const OS=(anim)=>`<svg viewBox="0 0 40 40"><circle class="${anim?'draw':''}" pathLength="100" cx="20" cy="20" r="13" fill="none" stroke="#ff4d8d" stroke-width="5" stroke-linecap="round" style="filter:drop-shadow(0 0 6px #ff4d8d)" transform="rotate(-90 20 20)"/></svg>`;
function tttRender(){ if(cur!=='ttt') return; let s=BUS.get('game/ttt'); if(!s){ $('board').innerHTML=`<div class="mu" style="padding:30px">No game yet</div>`; $('tttMsg').textContent=''; $('tttRule').innerHTML=`<button class="btn sm" onclick="tttNew('classic')">Start a game</button>`; return; }
  [...$('tttModes').children].forEach((b,i)=>b.classList.toggle('on',['classic','infinite','big'][i]===s.mode));
  const N=s.N, sz=N===3?92:58, me=ME_ID(); $('board').style.gridTemplateColumns=`repeat(${N},${sz}px)`; $('board').style.justifyContent='center';
  const myQ=s.q&&s.q[me]||[]; const old=s.inf&&!s.over&&s.turn===me&&myQ.length===3?myQ[0]:-1; const anim=s.seq*100+s.last!==tLastDrawn; tLastDrawn=s.seq*100+s.last;
  $('board').innerHTML=s.b.map((v,i)=>`<button class="cell ${i===old?'old':''} ${s.win&&s.win.includes(i)?'win':''}" onclick="tttMove(${i})">${v===me?XS(anim&&i===s.last):v?OS(anim&&i===s.last):''}</button>`).join('');
  $('tttMsg').textContent=s.over?(s.winner===me?'You win! 🎉':s.winner?HER()+' wins':'Draw'):s.turn===me?'Your turn':HER()+'\'s turn';
  $('tW1').textContent=(s.tw||{})[me]||0; $('tW2').textContent=(s.tw||{})[HER_ID()]||0; $('tttRule').innerHTML=TMODES[s.mode].rule+(s.over?` <button class="btn sm" style="margin-top:10px" onclick="tttNew()">Play again</button>`:''); }
onScreen('ttt',tttRender); watchState('game/ttt',(p,v)=>{ tttRender(); if(v&&v.over&&v.winner===HER_ID()&&v._by===HER_ID()&&cur==='ttt') toast(HER()+' wins this one!'); });

/* ================= MEMORY ================= */
const MICONS=[['heart','#ff4d8d'],['star','#facc15'],['moon','#a5b4fc'],['sun','#fb923c'],['music','#22d3ee'],['coffee','#d6a77a'],['plane','#34d399'],['ring','#f0abfc']];
let memBusy=false;
function memNew(){ const d=[...Array(8).keys(),...Array(8).keys()]; for(let i=d.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[d[i],d[j]]=[d[j],d[i]];}
  const old=BUS.get('game/memory'); BUS.setState('game/memory',{deck:d,m:{},open:[],turn:ME_ID(),s:{[ME_ID()]:0,[HER_ID()]:0},over:false,seq:(old&&old.seq||0)+1});
  BUS.send('notice',{icon:'cards',title:ME()+' started Memory Match',text:'Join the game',target:'memory',kind:'game'}); }
function memFlip(i){ const s=BUS.get('game/memory'); if(!s||s.over||memBusy) return; if(s.turn!==ME_ID()) return toast('It\'s '+HER()+'\'s turn'); if(s.m[i]!==undefined||s.open.includes(i)||s.open.length>=2) return;
  const open=[...s.open,i]; buzz(8); const ns={...s,open}; delete ns._by; delete ns._at; BUS.setState('game/memory',ns);
  if(open.length===2){ memBusy=true; setTimeout(()=>{ const s2={...BUS.get('game/memory')}; delete s2._by; delete s2._at; const [a,b]=s2.open; const m={...s2.m}, sc={...s2.s};
    if(s2.deck[a]===s2.deck[b]){ m[a]=m[b]=ME_ID(); sc[ME_ID()]=(sc[ME_ID()]||0)+1; buzz(30); } else s2.turn=HER_ID();
    const over=Object.keys(m).length===16; let winner=null; if(over){ winner=sc[ME_ID()]>sc[HER_ID()]?ME_ID():sc[ME_ID()]<sc[HER_ID()]?HER_ID():null; if(winner===ME_ID()) addWin(ME_ID()); if(winner===ME_ID()) rain('confetti',30); }
    BUS.setState('game/memory',{...s2,m,s:sc,open:[],over,winner}); memBusy=false; if(!over&&s2.turn===HER_ID()) turnPing('memory'); },900); } }
function memRender(){ if(cur!=='memory') return; const s=BUS.get('game/memory'); if(!s){ $('mgrid').innerHTML=''; $('mTurn').innerHTML=`<button class="btn sm" onclick="memNew()">Start</button>`; return; } const me=ME_ID();
  $('mgrid').innerHTML=s.deck.map((k,i)=>{ const f=s.open.includes(i)||s.m[i]!==undefined; return `<div class="mc ${f?'f':''} ${s.m[i]===me?'m':s.m[i]?'hm':''}" onclick="memFlip(${i})"><div class="in"><div class="bk"></div><div class="fr" style="color:${MICONS[k][1]}">${ic(MICONS[k][0])}</div></div></div>`; }).join('');
  $('mS1').textContent=s.s[me]||0; $('mS2').textContent=s.s[HER_ID()]||0; $('mTurn').innerHTML=s.over?(s.winner===me?'You win!':s.winner?HER()+' wins':'Draw')+` <button class="btn sm" onclick="memNew()">Again</button>`:s.turn===me?'Your turn':HER()+'\'s turn'; }
onScreen('memory',memRender); watchState('game/memory',memRender);

/* ================= CAROM (shot-by-shot sync) ================= */
const CW=352, BR=22, PK=[[BR+14,BR+14],[CW-BR-14,BR+14],[BR+14,CW-BR-14],[CW-BR-14,CW-BR-14]], PR=14, RC=9.5, RS=13, YA=CW-68, YB=68, XMIN=104, XMAX=CW-104;
let cctx, cb=[], striker, cPhase='idle', aim=null, dragS=false, cRaf, pocketed=[], sinks=[], boardImg=null, cSeq=0, replay=null;
const flipC=()=>!amA();                                    // player B sees the board rotated
const toD=(x,y)=>flipC()?[CW-x,CW-y]:[x,y], toW=toD;
const myBase=()=>amA()?YA:YB, myCol=()=>amA()?'w':'b';
function buildBoard(){
  const o=document.createElement('canvas'); o.width=o.height=704; const c=o.getContext('2d'); c.scale(2,2);
  const g=c.createRadialGradient(CW/2,CW/2,30,CW/2,CW/2,CW*.75); g.addColorStop(0,'#f8e0ad'); g.addColorStop(1,'#d9aa66'); c.fillStyle=g; c.fillRect(0,0,CW,CW);
  for(let i=0;i<170;i++){ const y=Math.random()*CW, ph=Math.random()*6, a=.03+Math.random()*.07; c.strokeStyle=`rgba(120,70,30,${a})`; c.lineWidth=.4+Math.random()*1.1; c.beginPath(); c.moveTo(0,y); for(let x=0;x<=CW;x+=8) c.lineTo(x,y+Math.sin(x*.018+ph)*3+Math.sin(x*.05+ph*2)*.8); c.stroke(); }
  c.strokeStyle='#7a3410';
  for(let k=0;k<4;k++){ c.save(); c.translate(CW/2,CW/2); c.rotate(k*Math.PI/2); c.translate(-CW/2,-CW/2);
    c.lineWidth=1.6; c.beginPath(); c.moveTo(XMIN-14,YA-13); c.lineTo(XMAX+14,YA-13); c.moveTo(XMIN-14,YA+13); c.lineTo(XMAX+14,YA+13); c.stroke();
    c.lineWidth=.8; c.beginPath(); c.moveTo(XMIN-14,YA-9); c.lineTo(XMAX+14,YA-9); c.moveTo(XMIN-14,YA+9); c.lineTo(XMAX+14,YA+9); c.stroke();
    [XMIN-14,XMAX+14].forEach(x=>{ const rg=c.createRadialGradient(x-3,YA-3,1,x,YA,13); rg.addColorStop(0,'#ef4444'); rg.addColorStop(1,'#7f1d1d'); c.fillStyle=rg; c.beginPath(); c.arc(x,YA,12.5,0,7); c.fill(); c.lineWidth=1.4; c.strokeStyle='#7a3410'; c.stroke(); c.beginPath(); c.arc(x,YA,8,0,7); c.strokeStyle='rgba(255,255,255,.35)'; c.lineWidth=1; c.stroke(); c.strokeStyle='#7a3410'; });
    c.lineWidth=1.3; c.beginPath(); c.moveTo(BR+44,CW-BR-44); c.lineTo(BR+118,CW-BR-118); c.stroke(); c.beginPath(); c.moveTo(BR+44,CW-BR-44); c.lineTo(BR+52,CW-BR-44); c.moveTo(BR+44,CW-BR-44); c.lineTo(BR+44,CW-BR-52); c.stroke();
    c.beginPath(); c.arc(BR+126,CW-BR-126,12,Math.PI*.25,Math.PI*1.75); c.stroke(); c.restore(); }
  c.lineWidth=1.6; c.beginPath(); c.arc(CW/2,CW/2,62,0,7); c.stroke(); c.lineWidth=.8; c.beginPath(); c.arc(CW/2,CW/2,57,0,7); c.stroke();
  c.save(); c.translate(CW/2,CW/2); for(let k=0;k<8;k++){ c.rotate(Math.PI/4); c.beginPath(); c.ellipse(0,-32,7,21,0,0,7); c.fillStyle='rgba(185,28,28,.14)'; c.fill(); c.strokeStyle='#9b2c2c'; c.lineWidth=1; c.stroke(); } c.restore();
  c.beginPath(); c.arc(CW/2,CW/2,14,0,7); c.strokeStyle='#b91c1c'; c.lineWidth=1.6; c.stroke();
  PK.forEach(p=>{ const pg=c.createRadialGradient(p[0],p[1],2,p[0],p[1],PR+2); pg.addColorStop(0,'#000'); pg.addColorStop(.7,'#120904'); pg.addColorStop(1,'#3b1f0d'); c.fillStyle=pg; c.beginPath(); c.arc(p[0],p[1],PR+1,0,7); c.fill(); c.strokeStyle='#c9a24a'; c.lineWidth=1.6; c.stroke(); });
  const fg=c.createLinearGradient(0,0,CW,CW); fg.addColorStop(0,'#2a1208'); fg.addColorStop(.5,'#5c2d12'); fg.addColorStop(1,'#2a1208'); c.fillStyle=fg; c.beginPath(); c.rect(0,0,CW,CW); c.rect(BR,BR,CW-2*BR,CW-2*BR); c.fill('evenodd');
  c.strokeStyle='rgba(0,0,0,.45)'; c.lineWidth=4; c.strokeRect(BR+1,BR+1,CW-2*BR-2,CW-2*BR-2); c.strokeStyle='rgba(255,200,140,.18)'; c.lineWidth=1.5; c.strokeRect(1.5,1.5,CW-3,CW-3);
  [[11,11],[CW-11,11],[11,CW-11],[CW-11,CW-11]].forEach(p=>{ const bg=c.createRadialGradient(p[0]-1,p[1]-1,0,p[0],p[1],4); bg.addColorStop(0,'#fde68a'); bg.addColorStop(1,'#a16207'); c.fillStyle=bg; c.beginPath(); c.arc(p[0],p[1],3.5,0,7); c.fill(); });
  boardImg=o; }
function initialBalls(){ const L=[], cx=CW/2, cy=CW/2; L.push([cx,cy,'q',1]); for(let i=0;i<6;i++){const a=i/6*Math.PI*2;L.push([cx+Math.cos(a)*19.5,cy+Math.sin(a)*19.5,i%2?'b':'w',1]);} for(let i=0;i<12;i++){const a=i/12*Math.PI*2+Math.PI/12;L.push([cx+Math.cos(a)*39,cy+Math.sin(a)*39,i%2?'w':'b',1]);} return L.map(b=>[+b[0].toFixed(2),+b[1].toFixed(2),b[2],b[3]]); }
function caromNew(ask){ const go2=()=>{ const old=BUS.get('game/carom'); BUS.setState('game/carom',{balls:initialBalls(),turn:ME_ID(),score:{[ME_ID()]:0,[HER_ID()]:0},seq:(old&&old.seq||0)+1,shot:null,base:null,over:false,msg:''}); BUS.send('notice',{icon:'target',title:ME()+' started a Carom game',text:ME()+' breaks first',target:'carom',kind:'game'}); }; if(ask&&BUS.get('game/carom')&&!BUS.get('game/carom').over) confirmBox('Start a new Carom game? The current one ends.',go2); else go2(); }
function loadBalls(arr){ cb=arr.filter(b=>b[3]).map(b=>({x:b[0],y:b[1],vx:0,vy:0,r:RC,m:1,t:b[2],a:true})); striker={x:CW/2,y:0,vx:0,vy:0,r:RS,m:1.8,t:'s',a:true}; }
function placeStriker(base){ striker.a=true; striker.vx=striker.vy=0; striker.y=base; striker.x=CW/2; let k=0; while(!strikerValid()&&k<40){ striker.x=XMIN+Math.random()*(XMAX-XMIN); k++; } }
function strikerValid(){ return !cb.some(b=>b.a&&Math.hypot(b.x-striker.x,b.y-striker.y)<b.r+striker.r+1); }
function allBalls(){ return striker&&striker.a?[...cb,striker]:cb; }
function cPhysics(){ if(cPhase!=='moving'&&cPhase!=='replay') return; const B=allBalls();
  for(let s=0;s<4;s++){
    for(const b of B){ if(!b.a) continue; b.x+=b.vx/4; b.y+=b.vy/4; b.vx*=.9956; b.vy*=.9956; if(Math.hypot(b.vx,b.vy)<.06){b.vx=0;b.vy=0;}
      if(b.x-b.r<BR){b.x=BR+b.r;b.vx=-b.vx*.75} if(b.x+b.r>CW-BR){b.x=CW-BR-b.r;b.vx=-b.vx*.75} if(b.y-b.r<BR){b.y=BR+b.r;b.vy=-b.vy*.75} if(b.y+b.r>CW-BR){b.y=CW-BR-b.r;b.vy=-b.vy*.75}
      for(const p of PK){ if(Math.hypot(b.x-p[0],b.y-p[1])<PR){ b.a=false; sinks.push({x:b.x,y:b.y,px:p[0],py:p[1],t:0,b:{...b}}); b.vx=b.vy=0; pocketed.push(b.t); if(b.t!=='s'&&cPhase==='moving') buzz(30); } } }
    for(let i=0;i<B.length;i++){ const A=B[i]; if(!A.a) continue; for(let j=i+1;j<B.length;j++){ const C=B[j]; if(!C.a) continue; const dx=C.x-A.x, dy=C.y-A.y, d=Math.hypot(dx,dy), md=A.r+C.r; if(d>0&&d<md){ const nx=dx/d, ny=dy/d, ov=(md-d)/2; A.x-=nx*ov; A.y-=ny*ov; C.x+=nx*ov; C.y+=ny*ov; const rv=(C.vx-A.vx)*nx+(C.vy-A.vy)*ny; if(rv<0){ const j2=-1.92*rv/(1/A.m+1/C.m); A.vx-=j2*nx/A.m; A.vy-=j2*ny/A.m; C.vx+=j2*nx/C.m; C.vy+=j2*ny/C.m; } } } } }
  if(B.every(b=>!b.a||(b.vx===0&&b.vy===0))){ if(cPhase==='moving') endMyShot(); else endReplay(); } }
function endMyShot(){
  const s=BUS.get('game/carom'); const me=ME_ID(), her=HER_ID(); const mine=myCol(), other=mine==='w'?'b':'w'; const score={...s.score}; let keep=false, msg='';
  pocketed.forEach(t=>{ if(t===mine){ score[me]=(score[me]||0)+1; keep=true; } else if(t===other){ score[her]=(score[her]||0)+1; } else if(t==='q'){ score[me]=(score[me]||0)+3; keep=true; msg='Queen! +3. '; } });
  if(pocketed.includes('s')){ keep=false; msg='Foul: striker pocketed. '; }
  pocketed=[]; const balls=cb.filter(b=>b.a).map(b=>[+b.x.toFixed(2),+b.y.toFixed(2),b.t,1]);
  const wL=balls.filter(b=>b[2]==='w').length, bL=balls.filter(b=>b[2]==='b').length; const over=!wL||!bL; let winner=null;
  if(over){ winner=score[me]>=score[her]?me:her; if(winner===me){ addWin(me); rain('confetti',30); } msg='Game over. '; }
  const turn=over?null:(keep?me:her); cPhase='idle';
  BUS.setState('game/carom',{...s,_by:undefined,_at:undefined,balls,score,turn,seq:s.seq+1,base:replay.base,shot:replay.shot,by:me,over,winner,msg:msg+(keep&&!over?ME()+' goes again':'')});
  if(msg) toast(msg+(keep&&!over?'Go again!':'')); if(!over&&turn===her) turnPing('carom'); if(over) BUS.send('notice',{icon:'trophy',title:'Carom: '+(winner===me?ME()+' won':'you won!'),text:score[me]+' – '+score[her],target:'carom',kind:'game'});
}
function endReplay(){ cPhase='idle'; const s=BUS.get('game/carom'); if(liveReplaySeq>=0&&s.seq<=liveReplaySeq){ striker.a=false; updCarom(); return; } loadBalls(s.balls); if(s.turn===ME_ID()) placeStriker(myBase()); else striker.a=false; updCarom(); if(s.msg) toast(s.msg.replace(ME(),HER())); }
let liveReplaySeq=-1;
function startShot(dx,dy,p){ const s=BUS.get('game/carom'); const base=s.balls; const [wx,wy]=[striker.x,striker.y]; replay={base,shot:{x:wx,y:wy,dx,dy,p}}; pocketed=[]; sinks=[]; striker.vx=dx*p*18; striker.vy=dy*p*18; cPhase='moving'; buzz(15); BUS.live('cshot',{seq:s.seq,base,shot:replay.shot}); }
onLiveCh('cshot',d=>{ if(cur!=='carom'||cPhase==='moving') return; liveReplaySeq=d.seq; loadBalls(d.base); striker.x=d.shot.x; striker.y=d.shot.y; striker.a=true; striker.vx=d.shot.dx*d.shot.p*18; striker.vy=d.shot.dy*d.shot.p*18; pocketed=[]; sinks=[]; cPhase='replay'; updCarom(); });
function caromSync(){ const s=BUS.get('game/carom'); if(!s){ cb=[]; striker=null; updCarom(); return; }
  if(s.seq===cSeq) return; const prevSeq=cSeq; cSeq=s.seq;
  if(cPhase==='replay') return;
  if(s.shot&&s.by!==ME_ID()&&s.base&&prevSeq&&cur==='carom'&&liveReplaySeq!==s.seq-1){ loadBalls(s.base); striker.x=s.shot.x; striker.y=s.shot.y; striker.a=true; striker.vx=s.shot.dx*s.shot.p*18; striker.vy=s.shot.dy*s.shot.p*18; pocketed=[]; sinks=[]; cPhase='replay'; updCarom(); return; }
  if(cPhase==='moving') return; loadBalls(s.balls); if(s.turn===ME_ID()&&!s.over) placeStriker(myBase()); else striker.a=false; cPhase='idle'; updCarom(); }
function updCarom(){ const s=BUS.get('game/carom'); if(!s){ $('cMe').textContent='You 0'; $('cHer').textContent=HER()+' 0'; $('cTurn').innerHTML=`<button class="btn sm" onclick="caromNew()">Start game</button>`; return; }
  $('cMe').textContent=(myCol()==='w'?'⚪':'⚫')+' You '+(s.score[ME_ID()]||0); $('cHer').textContent=(myCol()==='w'?'⚫':'⚪')+' '+HER()+' '+(s.score[HER_ID()]||0);
  $('cTurn').innerHTML=s.over?(s.winner===ME_ID()?'You win!':HER()+' wins')+` <button class="btn sm" onclick="caromNew()">Again</button>`:cPhase==='replay'?HER()+' is shooting…':s.turn===ME_ID()?'Your turn':HER()+'\'s turn';
  if(striker&&s.turn===ME_ID()) $('cSlide').value=(((flipC()?CW-striker.x:striker.x)-XMIN)/(XMAX-XMIN))*1000; }
onScreen('carom',()=>{ if(!boardImg) buildBoard(); cctx=hiDPI($('ccv'),CW,CW); cSeq=0; caromSync(); cancelAnimationFrame(cRaf); const loop=()=>{ cPhysics(); drawCarom(); cRaf=requestAnimationFrame(loop); }; loop(); },()=>{ cancelAnimationFrame(cRaf); if(cPhase==='replay') endReplay(); });
watchState('game/carom',()=>{ if(cur==='carom') caromSync(); });
function coin(c,b,x,y,r){ c.fillStyle='rgba(0,0,0,.35)'; c.beginPath(); c.ellipse(x+1.8,y+2.6,r*1.02,r*.98,0,0,7); c.fill();
  const g=c.createRadialGradient(x-r*.35,y-r*.4,r*.1,x,y,r); const Sx={w:['#fffef8','#efe4cc','#bfa47a'],b:['#7a706a','#2a2522','#0a0807'],q:['#ff9fb2','#e11d48','#6b1020'],s:['#e0f2fe','#60a5fa','#1e3a8a']}[b.t];
  g.addColorStop(0,Sx[0]); g.addColorStop(.55,Sx[1]); g.addColorStop(1,Sx[2]); c.fillStyle=g; c.beginPath(); c.arc(x,y,r,0,7); c.fill();
  c.strokeStyle=b.t==='w'?'rgba(120,90,50,.35)':'rgba(255,255,255,.14)'; c.lineWidth=.8; c.beginPath(); c.arc(x,y,r*.66,0,7); c.stroke(); c.beginPath(); c.arc(x,y,r*.36,0,7); c.stroke();
  if(b.t==='s'){ c.strokeStyle='rgba(255,255,255,.75)'; c.lineWidth=1.3; c.beginPath(); c.arc(x,y,r*.74,0,7); c.stroke(); for(let k=0;k<6;k++){ const a=k/6*Math.PI*2; c.fillStyle='rgba(255,255,255,.8)'; c.beginPath(); c.arc(x+Math.cos(a)*r*.45,y+Math.sin(a)*r*.45,1.1,0,7); c.fill(); } }
  c.fillStyle='rgba(255,255,255,.55)'; c.beginPath(); c.ellipse(x-r*.35,y-r*.42,r*.34,r*.2,-.6,0,7); c.fill(); }
function drawCarom(){ const c=cctx; if(!c) return; c.drawImage(boardImg,0,0,CW,CW); const s=BUS.get('game/carom');
  const myTurn=s&&s.turn===ME_ID()&&cPhase==='idle'&&!s.over; if(myTurn){ c.fillStyle='rgba(96,165,250,.13)'; c.fillRect(XMIN-14,YA-13,XMAX-XMIN+28,26); }
  sinks.forEach(k=>{ k.t+=.08; const q=Math.min(1,k.t); const [dx,dy]=toD(k.x+(k.px-k.x)*q,k.y+(k.py-k.y)*q); coin(c,k.b,dx,dy,k.b.r*(1-q*.7)); }); sinks=sinks.filter(k=>k.t<1);
  for(const b of allBalls()){ if(!b.a) continue; const [x,y]=toD(b.x,b.y); coin(c,b,x,y,b.r); }
  if(myTurn&&striker&&striker.a&&!strikerValid()){ const [x,y]=toD(striker.x,striker.y); c.strokeStyle='#ef4444'; c.lineWidth=2; c.beginPath(); c.arc(x,y,RS+3,0,7); c.stroke(); }
  if(aim&&striker){ const [sx,sy]=toD(striker.x,striker.y); const L=60+aim.p*230;
    for(let k=0;k<L;k+=9){ c.fillStyle=`rgba(255,255,255,${(1-k/L)*.85})`; c.beginPath(); c.arc(sx+aim.dx*k,sy+aim.dy*k,1.7,0,7); c.fill(); }
    c.strokeStyle='rgba(255,255,255,.35)'; c.lineWidth=1.2; c.beginPath(); c.arc(sx+aim.dx*L,sy+aim.dy*L,RS,0,7); c.stroke();
    const hue=120-120*aim.p; c.shadowColor=`hsl(${hue},90%,55%)`; c.shadowBlur=10; c.strokeStyle=`hsl(${hue},90%,55%)`; c.lineWidth=4; c.lineCap='round'; c.beginPath(); c.arc(sx,sy,RS+8,-Math.PI/2,-Math.PI/2+aim.p*Math.PI*2); c.stroke(); c.shadowBlur=0;
    c.font='700 11px Outfit,sans-serif'; c.fillStyle='#fff'; c.textAlign='center'; c.fillText(Math.round(aim.p*100)+'%',sx,sy+RS+24); } }
function caromSetup(){ const cv=$('ccv'); const pos=e=>{const r=cv.getBoundingClientRect();return{x:(e.clientX-r.left)*CW/r.width,y:(e.clientY-r.top)*CW/r.height}};
  const canPlay=()=>{ const s=BUS.get('game/carom'); return s&&!s.over&&s.turn===ME_ID()&&cPhase==='idle'&&striker&&striker.a; };
  cv.addEventListener('pointerdown',e=>{ if(!canPlay()){ const s=BUS.get('game/carom'); if(s&&!s.over&&s.turn!==ME_ID()) toast('Wait for '+HER()+'\'s shot'); return; } cv.setPointerCapture(e.pointerId); const p=pos(e); const [sx,sy]=toD(striker.x,striker.y);
    if(Math.hypot(p.x-sx,p.y-sy)<28) aim={dx:0,dy:-1,p:0}; else if(Math.abs(p.y-YA)<28){ dragS=true; const wx=toW(Math.min(XMAX,Math.max(XMIN,p.x)),YA)[0]; striker.x=wx; } });
  cv.addEventListener('pointermove',e=>{ const p=pos(e); if(dragS){ striker.x=toW(Math.min(XMAX,Math.max(XMIN,p.x)),YA)[0]; $('cSlide').value=((Math.min(XMAX,Math.max(XMIN,p.x))-XMIN)/(XMAX-XMIN))*1000; }
    else if(aim){ const [sx,sy]=toD(striker.x,striker.y); let dx=sx-p.x, dy=sy-p.y; const l=Math.hypot(dx,dy); if(l>4){ dx/=l; dy/=l; if(dy>-.08){ dy=-.08; const n=Math.hypot(dx,dy); dx/=n; dy/=n; } aim.dx=dx; aim.dy=dy; aim.p=Math.min(1,l/120); } } });
  const up=()=>{ if(dragS){ dragS=false; return; } if(!aim) return; const a=aim; aim=null; if(a.p<.06) return; if(!strikerValid()){ toast('Striker is touching a coin. Move it'); return; } const wdx=flipC()?-a.dx:a.dx, wdy=flipC()?-a.dy:a.dy; startShot(wdx,wdy,a.p); };
  cv.addEventListener('pointerup',up); cv.addEventListener('pointercancel',up);
  $('cSlide').addEventListener('input',e=>{ if(!canPlay()) return; const dx=XMIN+(XMAX-XMIN)*e.target.value/1000; striker.x=toW(dx,YA)[0]; }); }

/* ================= HOOPS (async challenge) ================= */
const BW=352, BH=450, RIMX=176, RIMY=160, G=1400, FT=.9;
let bctx, bb, bbRaf, bbLast=0, bbScore=0, bbBall=0, bbStreak=0, bbDrag=null, netSway=0, bbFx=[], bbMsg=null;
function bbNew(){ bbScore=0; bbBall=0; bbStreak=0; bbMsg=null; newBall(); bbHud(); }
function newBall(){ bb={x0:rnd([96,176,256]),y0:395,x:0,y:395,vx:0,vy:0,z:0,fly:false,scored:false,rim:0,spin:0,t:0}; bb.x=bb.x0; }
function bbHud(){ const h=BUS.get('game/hoops')||{best:{}}; $('bbS').textContent='Score '+bbScore; $('bbShots').textContent=bbBall>=10?'Round over':'Ball '+(bbBall+1)+' / 10'; $('bbHer').textContent=P3().P+' best '+((h.best||{})[HER_ID()]||0); }
onScreen('bball',()=>{ bctx=hiDPI($('bcv'),BW,BH); if(!bb) bbNew(); bbHud(); cancelAnimationFrame(bbRaf); bbLast=performance.now(); const loop=ts=>{ const dt=Math.min(.033,(ts-bbLast)/1000); bbLast=ts; bbStep(dt); bbDraw(); bbRaf=requestAnimationFrame(loop); }; bbRaf=requestAnimationFrame(loop); },()=>cancelAnimationFrame(bbRaf));
watchState('game/hoops',()=>{ if(cur==='bball') bbHud(); });
function bbStep(dt){ netSway*=.94; bbFx.forEach(p=>{p.x+=p.vx*dt;p.y+=p.vy*dt;p.l-=dt;}); bbFx=bbFx.filter(p=>p.l>0); if(!bb.fly) return; bb.t+=dt; bb.spin+=dt*8;
  const py=bb.y; bb.vy+=G*dt; bb.x+=bb.vx*dt; bb.y+=bb.vy*dt; if(bb.z<1) bb.z=Math.min(1,bb.z+dt/FT);
  if(bbStreak>=2) for(let i=0;i<2;i++) bbFx.push({x:bb.x+(Math.random()-.5)*14,y:bb.y+(Math.random()-.5)*14,vx:(Math.random()-.5)*40,vy:-40-Math.random()*60,l:.5,c:rnd(['#f97316','#facc15','#ef4444'])});
  if(bb.z>=1&&bb.y<RIMY-16&&Math.abs(bb.x-RIMX)<75&&!bb.boardDone){ bb.boardDone=true; bb.vx*=.5; bb.vy=Math.max(bb.vy,0)*.3+40; bb.bank=true; buzz(15); }
  if(bb.z>.7&&!bb.scored&&py<RIMY&&bb.y>=RIMY&&bb.vy>0){ const d=Math.abs(bb.x-RIMX);
    if(d<22){ bb.scored=true; bb.vx*=.25; netSway=1; const sw=d<11&&!bb.rim; bbStreak++; let pts=2+(sw?1:0); if(bbStreak>=3) pts*=2; bbScore+=pts; bbMsg={t:(sw?'SWISH! ':bb.bank?'BANK! ':'')+'+'+pts+(bbStreak>=3?' 🔥':''),l:1.4}; buzz([30,30,60]); for(let i=0;i<24;i++) bbFx.push({x:RIMX,y:RIMY,vx:(Math.random()-.5)*300,vy:-Math.random()*250,l:.8,c:rnd(['#facc15','#ff4d8d','#22d3ee','#fff'])}); bbHud(); }
    else if(d<36&&bb.rim<2){ bb.rim++; bb.vy=-Math.abs(bb.vy)*.42; bb.vx+=Math.sign(bb.x-RIMX||1)*(90+Math.random()*60); buzz(20); } }
  if(bb.y>BH+40||bb.t>3.2){ if(!bb.scored){ bbStreak=0; bbMsg={t:'Miss',l:.8}; } bbBall++; bbHud(); if(bbBall>=10) bbFinish(); else newBall(); } }
function bbFinish(){ bb.fly=false; const h=BUS.get('game/hoops')||{best:{},last:{}}; const best={...(h.best||{})}, last={...(h.last||{})}; const mine=best[ME_ID()]||0, hers=best[HER_ID()]||0; last[ME_ID()]={s:bbScore,at:Date.now()};
  if(bbScore>mine) best[ME_ID()]=bbScore; BUS.setState('game/hoops',{best,last}); const beat=bbScore>hers&&hers>0;
  bbMsg={t:bbScore>mine?'New personal best! '+bbScore:'Round over · '+bbScore,l:3}; if(bbScore>mine) rain('confetti',24); if(beat) addWin(ME_ID());
  BUS.send('notice',{icon:'ball',title:ME()+' scored '+bbScore+' in Hoops',text:beat?'That beats your best ('+hers+'). Your turn!':'Can you beat it?',target:'bball',kind:'game'}); setTimeout(bbNew,3200); }
function bbDraw(){ const c=bctx; const bg=c.createRadialGradient(BW/2,40,10,BW/2,180,420); bg.addColorStop(0,'#2b1857'); bg.addColorStop(1,'#07050e'); c.fillStyle=bg; c.fillRect(0,0,BW,BH);
  [[60,'rgba(168,85,247,.12)'],[292,'rgba(255,77,141,.1)']].forEach(([x,col])=>{ const g=c.createLinearGradient(x,0,x,BH); g.addColorStop(0,col); g.addColorStop(1,'rgba(0,0,0,0)'); c.fillStyle=g; c.beginPath(); c.moveTo(x-10,0); c.lineTo(x+10,0); c.lineTo(x+90,BH); c.lineTo(x-90,BH); c.fill(); });
  for(let i=0;i<26;i++){ c.fillStyle=`rgba(255,255,255,${.03+(i%5)*.012})`; c.beginPath(); c.arc((i*53)%BW,226+(i*29)%60,6+(i%4)*3,0,7); c.fill(); }
  const fl=c.createLinearGradient(0,300,0,BH); fl.addColorStop(0,'#3b2412'); fl.addColorStop(1,'#a8622d'); c.fillStyle=fl; c.beginPath(); c.moveTo(70,300); c.lineTo(BW-70,300); c.lineTo(BW,BH); c.lineTo(0,BH); c.fill();
  c.strokeStyle='rgba(255,255,255,.35)'; c.lineWidth=1.5; c.beginPath(); c.moveTo(130,300); c.lineTo(100,BH); c.moveTo(BW-130,300); c.lineTo(BW-100,BH); c.moveTo(118,372); c.lineTo(BW-118,372); c.stroke(); c.beginPath(); c.ellipse(BW/2,372,58,10,0,0,Math.PI); c.stroke();
  c.fillStyle='#3b3355'; c.fillRect(RIMX-4,0,8,46); c.fillStyle='rgba(255,255,255,.1)'; c.strokeStyle='rgba(255,255,255,.85)'; c.lineWidth=3; rr(c,RIMX-78,46,156,100,8); c.fill(); c.stroke();
  c.shadowColor='#ff4d8d'; c.shadowBlur=12; c.strokeStyle='#ff4d8d'; c.lineWidth=3; c.strokeRect(RIMX-28,100,56,42); c.shadowBlur=0;
  const back=()=>{ c.strokeStyle='#c2410c'; c.lineWidth=4; c.beginPath(); c.ellipse(RIMX,RIMY,32,7,0,Math.PI,Math.PI*2); c.stroke(); };
  const net=()=>{ const sw=Math.sin(performance.now()/60)*netSway*6; c.strokeStyle='rgba(255,255,255,.75)'; c.lineWidth=1.1; const top=[],bot=[]; for(let i=0;i<=10;i++){ const a=Math.PI*(i/10); top.push([RIMX-Math.cos(a)*32,RIMY+Math.sin(a)*7]); bot.push([RIMX-Math.cos(a)*19+sw,RIMY+44+Math.sin(a)*4+netSway*8]); } for(let i=0;i<=10;i++){ c.beginPath(); c.moveTo(top[i][0],top[i][1]); c.lineTo(bot[i][0],bot[i][1]); c.stroke(); } for(let k=1;k<=3;k++){ c.beginPath(); for(let i=0;i<=10;i++){ const x=top[i][0]+(bot[i][0]-top[i][0])*k/4, y=top[i][1]+(bot[i][1]-top[i][1])*k/4; i?c.lineTo(x,y):c.moveTo(x,y);} c.stroke(); } };
  const front=()=>{ c.shadowColor='#f97316'; c.shadowBlur=14; c.strokeStyle='#fb923c'; c.lineWidth=4.5; c.beginPath(); c.ellipse(RIMX,RIMY,32,7,0,0,Math.PI); c.stroke(); c.shadowBlur=0; };
  bbFx.forEach(p=>{ c.globalAlpha=Math.max(0,p.l*1.5); c.fillStyle=p.c; c.beginPath(); c.arc(p.x,p.y,2.4,0,7); c.fill(); }); c.globalAlpha=1;
  if(bb.z<.85){ back(); net(); front(); drawBall(c); } else { back(); drawBall(c); net(); front(); }
  if(!bb.fly&&bbBall<10){ c.strokeStyle='rgba(255,255,255,.4)'; c.setLineDash([4,6]); c.lineWidth=1.5; c.beginPath(); c.moveTo(bb.x,bb.y-34); c.lineTo(bb.x,bb.y-70); c.stroke(); c.setLineDash([]); c.fillStyle='rgba(255,255,255,.7)'; c.font='700 11px Outfit,sans-serif'; c.textAlign='center'; c.fillText('SWIPE UP',bb.x,bb.y-76); }
  if(bbMsg){ bbMsg.l-=.016; c.globalAlpha=Math.max(0,Math.min(1,bbMsg.l*2)); c.font='800 26px Outfit,sans-serif'; c.textAlign='center'; const g=c.createLinearGradient(BW/2-80,0,BW/2+80,0); g.addColorStop(0,'#ff4d8d'); g.addColorStop(1,'#facc15'); c.fillStyle=g; c.shadowColor='#ff4d8d'; c.shadowBlur=14; c.fillText(bbMsg.t,BW/2,250); c.shadowBlur=0; c.globalAlpha=1; if(bbMsg.l<=0) bbMsg=null; }
  if(bbStreak>=2){ c.font='800 13px Outfit,sans-serif'; c.fillStyle='#fb923c'; c.textAlign='left'; c.fillText('🔥 Streak x'+bbStreak,14,26); } }
function drawBall(c){ const s=1-.45*bb.z, r=26*s, x=bb.x, y=bb.y; if(!bb.fly){ c.fillStyle='rgba(0,0,0,.35)'; c.beginPath(); c.ellipse(x,y+r+4,r*.9,r*.25,0,0,7); c.fill(); }
  const g=c.createRadialGradient(x-r*.35,y-r*.4,r*.1,x,y,r); g.addColorStop(0,'#ffc28a'); g.addColorStop(.5,'#f97316'); g.addColorStop(1,'#7c2d12'); c.fillStyle=g; c.beginPath(); c.arc(x,y,r,0,7); c.fill();
  c.save(); c.beginPath(); c.arc(x,y,r,0,7); c.clip(); c.translate(x,y); c.rotate(bb.spin); c.strokeStyle='rgba(40,15,5,.8)'; c.lineWidth=1.6*s+.4; c.beginPath(); c.moveTo(-r,0); c.lineTo(r,0); c.moveTo(0,-r); c.lineTo(0,r); c.stroke(); c.beginPath(); c.ellipse(-r*.95,0,r*.55,r,0,-Math.PI/2,Math.PI/2); c.stroke(); c.beginPath(); c.ellipse(r*.95,0,r*.55,r,0,Math.PI/2,Math.PI*1.5); c.stroke(); c.restore();
  c.fillStyle='rgba(255,255,255,.25)'; c.beginPath(); c.ellipse(x-r*.35,y-r*.45,r*.32,r*.18,-.6,0,7); c.fill(); }
function bbSetup(){ const cv=$('bcv'); const pos=e=>{const r=cv.getBoundingClientRect();return{x:(e.clientX-r.left)*BW/r.width,y:(e.clientY-r.top)*BH/r.height,t:performance.now()}};
  cv.addEventListener('pointerdown',e=>{ if(bb.fly||bbBall>=10) return; const p=pos(e); if(Math.hypot(p.x-bb.x,p.y-bb.y)>60) return; cv.setPointerCapture(e.pointerId); bbDrag=[p]; });
  cv.addEventListener('pointermove',e=>{ if(!bbDrag) return; const p=pos(e); bbDrag.push(p); if(bbDrag.length>12) bbDrag.shift(); bb.x=bb.x0+(p.x-bbDrag[0].x)*.15; bb.y=bb.y0+Math.max(-20,Math.min(10,(p.y-bbDrag[0].y)*.15)); });
  const up=()=>{ if(!bbDrag) return; const pts=bbDrag; bbDrag=null; const a=pts[0], b=pts[pts.length-1]; const dt=Math.max(.016,(b.t-a.t)/1000); const svx=(b.x-a.x)/dt, svy=(b.y-a.y)/dt; bb.x=bb.x0; bb.y=bb.y0;
    if(svy>-250||pts.length<2){ toast('Swipe up toward the hoop'); return; }
    let vy=Math.max(-1700,Math.min(-450,svy*.75)), vx=svx*.55; const vyI=-((bb.y0-RIMY)+.5*G*FT*FT)/FT, vxI=(RIMX-bb.x0)/FT; vy=vy*.5+vyI*.5; vx=vx*.5+vxI*.5; Object.assign(bb,{vx,vy,fly:true,t:0,z:0}); buzz(10); };
  cv.addEventListener('pointerup',up); cv.addEventListener('pointercancel',up); }

/* ================= AIR HOCKEY (live: host simulates, guest streams paddle) ================= */
const HW=352, HH=480, GW=120;
let hctx, hk, hkRaf, hkMode='bot', hkHost=true, hkGuestPad=null, hkLastState=0, hkSendT=0, hkFlash=null, hkTarget=null, hkScore={me:0,opp:0}, hkOver=false;
function hkReset(dir){ hk={p:{x:HW/2,y:HH/2,vx:(Math.random()-.5)*2,vy:dir*1.6,r:14},me:{x:HW/2,y:HH-70,vx:0,vy:0,r:25},op:{x:HW/2,y:70,vx:0,vy:0,r:25},trail:[]}; }
function hkRestart(){ hkScore={me:0,opp:0}; hkOver=false; hkReset(1); hkHud(); if(hkMode==='live'&&hkHost) BUS.live('hk',{t:'reset'}); }
function hkHud(){ $('hkMe').textContent=hkScore.me; $('hkHer').textContent=hkScore.opp; $('hkOpp').textContent=hkMode==='live'?HER():'Bot'; if(!hkOver) $('hkMsg').textContent=hkMode==='live'?'Live · first to 5':'vs Bot · first to 5'; }
function hkDecide(){ const live=PRES.online&&PRES.screen==='hockey'; const mode=live?'live':'bot'; if(mode!==hkMode){ hkMode=mode; hkHost=amA(); hkRestart(); toast(live?HER()+' joined · live match!':HER()+' left · playing the bot'); }
  $('hkWait').style.display='none'; if(!live) $('hkWait').style.display='none'; hkHud(); }
onScreen('hockey',()=>{ hctx=hiDPI($('hcv'),HW,HH); hkMode=PRES.online&&PRES.screen==='hockey'?'live':'bot'; hkHost=hkMode==='bot'||amA(); hkScore={me:0,opp:0}; hkOver=false; hkReset(1); hkHud();
  if(hkMode==='bot'){ BUS.send('gameInvite',{g:'hockey'},{kind:'game'}); toast('Invited '+HER()+' · playing the bot until '+P3().s+' joins'); }
  cancelAnimationFrame(hkRaf); const loop=()=>{ hkStep(); hkDraw(); hkRaf=requestAnimationFrame(loop); }; loop(); },()=>cancelAnimationFrame(hkRaf));
document.addEventListener('presence',()=>{ if(cur==='hockey') hkDecide(); if(cur==='play') renderGames(); });
onLiveCh('hk',d=>{ if(cur!=='hockey') return;
  if(d.t==='pad'&&hkMode==='live'&&hkHost){ const nx=HW-d.x*HW, ny=HH-d.y*HH; hk.op.vx=nx-hk.op.x; hk.op.vy=ny-hk.op.y; hk.op.x=nx; hk.op.y=ny; hkGuestPad=Date.now(); }
  if(d.t==='st'&&!hkHost){ hkLastState=Date.now(); hk.p.x=HW-d.p[0]; hk.p.y=HH-d.p[1]; hk.op.x=HW-d.h[0]; hk.op.y=HH-d.h[1]; if(!hkTarget){ hk.me.x=HW-d.g[0]; hk.me.y=HH-d.g[1]; } if(d.s[1]!==hkScore.me||d.s[0]!==hkScore.opp){ const gm=d.s[1]>hkScore.me; hkScore={me:d.s[1],opp:d.s[0]}; hkFlash={w:gm?'me':'opp',l:1}; buzz([60,40,120]); hkHud(); } hk.trail.push([hk.p.x,hk.p.y]); if(hk.trail.length>12) hk.trail.shift(); }
  if(d.t==='end'&&!hkHost){ hkOver=true; const w=d.w==='host'?'opp':'me'; $('hkMsg').textContent=w==='me'?'You win!':HER()+' wins!'; if(w==='me') rain('confetti',30); setTimeout(()=>{ hkOver=false; hkScore={me:0,opp:0}; hkHud(); },3000); }
  if(d.t==='reset'&&!hkHost){ hkScore={me:0,opp:0}; hkOver=false; hkHud(); } });
function hkStep(){ const {p,me,op}=hk; if(hkOver) return;
  if(hkTarget){ const nx=Math.max(me.r+10,Math.min(HW-me.r-10,hkTarget.x)), ny=Math.max(HH/2+me.r,Math.min(HH-me.r-10,hkTarget.y)); me.vx=nx-me.x; me.vy=ny-me.y; me.x=nx; me.y=ny; } else { me.vx*=.5; me.vy*=.5; }
  if(hkMode==='live'&&!hkHost){ const now=Date.now(); if(now-hkSendT>40){ hkSendT=now; BUS.live('hk',{t:'pad',x:me.x/HW,y:me.y/HH}); } $('hkWait').style.display=now-hkLastState>3000?'flex':'none'; if(now-hkLastState>3000) $('hkWait').innerHTML=`<b>Connecting to ${esc(HER())}…</b><div class="mu">Keep this screen open</div>`; return; }
  if(hkMode==='bot'){ let tx=p.x, ty=p.y<HH/2?p.y-8:70; if(p.vy>0&&p.y>HH/2){ tx=HW/2+(p.x-HW/2)*.4; ty=70; } const dx=tx-op.x, dy=ty-op.y, dl=Math.hypot(dx,dy)||1, m=Math.min(4.6,dl); op.vx=dx/dl*m; op.vy=dy/dl*m; op.x+=op.vx; op.y=Math.max(op.r+10,Math.min(HH/2-op.r,op.y+op.vy)); op.x=Math.max(op.r+10,Math.min(HW-op.r-10,op.x)); }
  for(let s=0;s<2;s++){ p.x+=p.vx/2; p.y+=p.vy/2;
    [me,op].forEach(q=>{ const dx=p.x-q.x, dy=p.y-q.y, d=Math.hypot(dx,dy), md=p.r+q.r; if(d<md&&d>0){ const nx=dx/d, ny=dy/d; p.x=q.x+nx*md; p.y=q.y+ny*md; const rvx=p.vx-q.vx, rvy=p.vy-q.vy, vn=rvx*nx+rvy*ny; if(vn<0){ p.vx-=1.9*vn*nx; p.vy-=1.9*vn*ny; if(q===me) buzz(8); } } });
    const inGoal=Math.abs(p.x-HW/2)<GW/2;
    if(p.x-p.r<10){p.x=10+p.r;p.vx=Math.abs(p.vx)*.9} if(p.x+p.r>HW-10){p.x=HW-10-p.r;p.vx=-Math.abs(p.vx)*.9}
    if(p.y-p.r<10){ if(inGoal&&p.y<0){ hkGoal('me'); return; } else if(!inGoal){p.y=10+p.r;p.vy=Math.abs(p.vy)*.9} }
    if(p.y+p.r>HH-10){ if(inGoal&&p.y>HH){ hkGoal('opp'); return; } else if(!inGoal){p.y=HH-10-p.r;p.vy=-Math.abs(p.vy)*.9} } }
  const v=Math.hypot(p.vx,p.vy); if(v>15){p.vx*=15/v;p.vy*=15/v;} p.vx*=.997; p.vy*=.997; hk.trail.push([p.x,p.y]); if(hk.trail.length>12) hk.trail.shift();
  if(hkMode==='live'){ const now=Date.now(); if(now-hkSendT>40){ hkSendT=now; BUS.live('hk',{t:'st',p:[p.x,p.y],h:[me.x,me.y],g:[op.x,op.y],s:[hkScore.me,hkScore.opp]}); } } }
function hkGoal(w){ hkScore[w]++; hkFlash={w,l:1}; buzz([60,40,120]); hkHud();
  if(hkScore[w]>=5){ hkOver=true; $('hkMsg').textContent=w==='me'?'You win!':(hkMode==='live'?HER():'Bot')+' wins!'; if(w==='me') rain('confetti',30);
    if(hkMode==='live'){ BUS.live('hk',{t:'st',p:[HW/2,HH/2],h:[hk.me.x,hk.me.y],g:[hk.op.x,hk.op.y],s:[hkScore.me,hkScore.opp]}); BUS.live('hk',{t:'end',w:w==='me'?'host':'guest'}); addWin(w==='me'?ME_ID():HER_ID()); }
    setTimeout(()=>{ hkOver=false; hkScore={me:0,opp:0}; hkReset(1); hkHud(); },3000); }
  else { $('hkMsg').textContent=w==='me'?'GOAL!':'Scored on you'; setTimeout(hkHud,1200); hkReset(w==='me'?-1:1); } }
function hkDraw(){ const c=hctx; c.fillStyle='#05040b'; c.fillRect(0,0,HW,HH);
  const g=c.createLinearGradient(0,0,0,HH); g.addColorStop(0,'#160b2a'); g.addColorStop(.5,'#0b1430'); g.addColorStop(1,'#071a2a'); c.fillStyle=g; rr(c,6,6,HW-12,HH-12,26); c.fill();
  c.strokeStyle='rgba(255,255,255,.04)'; c.lineWidth=1; for(let x=20;x<HW;x+=22){c.beginPath();c.moveTo(x,10);c.lineTo(x,HH-10);c.stroke();} for(let y=20;y<HH;y+=22){c.beginPath();c.moveTo(10,y);c.lineTo(HW-10,y);c.stroke();}
  const neon=(col,fn,w=3)=>{ c.shadowColor=col; c.shadowBlur=16; c.strokeStyle=col; c.lineWidth=w; fn(); c.shadowBlur=0; };
  neon('#a855f7',()=>{ rr(c,8,8,HW-16,HH-16,24); c.stroke(); },2.5); neon('#ff4d8d',()=>{ c.beginPath(); c.moveTo(10,HH/2); c.lineTo(HW-10,HH/2); c.stroke(); c.beginPath(); c.arc(HW/2,HH/2,52,0,7); c.stroke(); },2);
  neon('#ff4d8d',()=>{ c.beginPath(); c.arc(HW/2,8,GW/2,0,Math.PI); c.stroke(); },2); neon('#22d3ee',()=>{ c.beginPath(); c.arc(HW/2,HH-8,GW/2,Math.PI,Math.PI*2); c.stroke(); },2);
  neon('#ff4d8d',()=>{ c.beginPath(); c.moveTo(HW/2-GW/2,8); c.lineTo(HW/2+GW/2,8); c.stroke(); },6); neon('#22d3ee',()=>{ c.beginPath(); c.moveTo(HW/2-GW/2,HH-8); c.lineTo(HW/2+GW/2,HH-8); c.stroke(); },6);
  hk.trail.forEach((t,i)=>{ c.fillStyle=`rgba(250,250,255,${i/40})`; c.beginPath(); c.arc(t[0],t[1],hk.p.r*(i/12),0,7); c.fill(); });
  const pad=(q,col)=>{ c.shadowColor=col; c.shadowBlur=24; const pg=c.createRadialGradient(q.x-6,q.y-6,2,q.x,q.y,q.r); pg.addColorStop(0,'#fff'); pg.addColorStop(.3,col); pg.addColorStop(1,shade(col,-80)); c.fillStyle=pg; c.beginPath(); c.arc(q.x,q.y,q.r,0,7); c.fill(); c.shadowBlur=0; c.strokeStyle='rgba(255,255,255,.6)'; c.lineWidth=2; c.beginPath(); c.arc(q.x,q.y,q.r*.55,0,7); c.stroke(); };
  pad(hk.op,'#ff4d8d'); pad(hk.me,'#22d3ee'); const p=hk.p; c.shadowColor='#fff'; c.shadowBlur=18; c.fillStyle='#f5f3ff'; c.beginPath(); c.arc(p.x,p.y,p.r,0,7); c.fill(); c.shadowBlur=0; c.fillStyle='#1e1b4b'; c.beginPath(); c.arc(p.x,p.y,p.r*.6,0,7); c.fill();
  if(hkFlash){ hkFlash.l-=.02; c.fillStyle=`rgba(${hkFlash.w==='me'?'34,211,238':'255,77,141'},${Math.max(0,hkFlash.l)*.25})`; c.fillRect(0,0,HW,HH); c.globalAlpha=Math.max(0,hkFlash.l); c.font='800 40px Outfit,sans-serif'; c.textAlign='center'; c.fillStyle='#fff'; c.fillText('GOAL',HW/2,HH/2+14); c.globalAlpha=1; if(hkFlash.l<=0) hkFlash=null; } }
function hkSetup(){ const cv=$('hcv'); const pos=e=>{const r=cv.getBoundingClientRect();return{x:(e.clientX-r.left)*HW/r.width,y:(e.clientY-r.top)*HH/r.height}};
  cv.addEventListener('pointerdown',e=>{ cv.setPointerCapture(e.pointerId); hkTarget=pos(e); }); cv.addEventListener('pointermove',e=>{ if(hkTarget) hkTarget=pos(e); });
  ['pointerup','pointercancel'].forEach(ev=>cv.addEventListener(ev,()=>hkTarget=null)); }

/* ================= ASK ME ================= */
let amT=0, amDraft={q:'',o:['','',''],c:0};
const AM_IDEAS=['What\'s my comfort food on a bad day?','Which song reminds me of us?','What did I want to be as a kid?','My dream holiday?','What\'s my biggest fear?','What makes me laugh the most?','My favourite way to spend a Sunday?','What do I order at our favourite café?'];
function amTab(n){ amT=n; ['amA','amB','amC'].forEach((id,i)=>$(id).classList.toggle('on',i===n)); amRender(); }
function amStats(){ const all=BUS.list('askme/'); const me=ME_ID();
  const mine=all.filter(q=>q.by!==me&&q.ans), hers=all.filter(q=>q.by===me&&q.ans);
  const a=mine.filter(q=>q.ans.i===q.c).length, b=hers.filter(q=>q.ans.i===q.c).length, tot=mine.length+hers.length; return {a,am:mine.length,b,bm:hers.length,pct:tot?Math.round((a+b)/tot*100):0}; }
function amRender(){ if(cur!=='askme') return; const st=amStats();
  $('amMeter').innerHTML=`<div class="row"><div style="flex:1"><b class="f" style="font-size:16px">How well you know each other</b><div class="mu">You got ${st.a}/${st.am} of ${esc(HER())}'s · ${esc(HER())} got ${st.b}/${st.bm} of yours</div></div><div class="big gt">${st.pct}%</div></div><div class="meter"><i style="width:${st.pct}%"></i></div>`;
  const me=ME_ID(), all=BUS.list('askme/').sort((x,y)=>y.at-x.at);
  if(amT===0){ const list=all.filter(q=>q.by!==me&&!q.ans); $('amPane').innerHTML=list.length?list.map(q=>`<div class="card"><div class="row" style="margin-bottom:6px"><div class="mini" style="width:30px;height:30px">${avatar(herAv(),'smile','idle','head')}</div><span class="mu">${esc(HER())} asks</span></div><b class="f" style="font-size:16px">${esc(q.q)}</b>${q.o.map((o,j)=>`<button class="opt" onclick="amAnswer('${q.id}',${j})">${esc(o)}</button>`).join('')}</div>`).join(''):`<div class="card" style="text-align:center"><div class="mu">No new questions from ${esc(HER())}.</div><button class="btn sm" style="margin-top:10px" onclick="amTab(1)">Ask ${P3().o} one</button></div>`; }
  if(amT===1){ $('amPane').innerHTML=`<div class="card"><label class="l">Your question about yourself</label><input class="field" id="amQ" value="${esc(amDraft.q)}" oninput="amDraft.q=this.value" placeholder="Ask something only you know…"><div class="chips" style="margin:-4px 0 12px">${AM_IDEAS.slice(0,4).map(t=>`<button class="chip" style="font-size:11.5px" onclick="amDraft.q=this.textContent;amRender()">${esc(t)}</button>`).join('')}</div>
    <label class="l">3 options · tap the circle next to the right answer</label>${amDraft.o.map((o,i)=>`<div class="row" style="margin:6px 0"><input type="radio" name="amr" ${amDraft.c===i?'checked':''} onchange="amDraft.c=${i}" style="accent-color:#a855f7;width:22px;height:22px"><input class="field" style="margin:0" placeholder="Option ${i+1}" value="${esc(o)}" oninput="amDraft.o[${i}]=this.value"></div>`).join('')}
    <button class="btn" style="margin-top:10px" onclick="amSend()">${ic('send','s')}Send to ${esc(HER())}</button></div>`+all.filter(q=>q.by===me&&!q.ans).map(q=>`<div class="card"><b>${esc(q.q)}</b><div class="mu">Waiting for ${esc(HER())}'s answer…</div></div>`).join(''); }
  if(amT===2){ const done=all.filter(q=>q.ans); $('amPane').innerHTML=done.length?done.map(q=>{ const ok=q.ans.i===q.c; const asker=q.by===me?'You asked':HER()+' asked'; const ans=q.by===me?HER()+' answered':'You answered'; return `<div class="card"><div class="mu">${asker}</div><b>${esc(q.q)}</b><div style="margin-top:6px;font-size:13.5px">${ans} <b>${esc(q.o[q.ans.i])}</b> · ${ok?'<span style="color:#6ee7b7">correct</span>':`<span style="color:#fda4af">wrong</span> (it was ${esc(q.o[q.c])})`}</div></div>`; }).join(''):'<div class="card mu" style="text-align:center">Nothing answered yet</div>'; } }
async function amSend(){ const q=amDraft.q.trim(), o=amDraft.o.map(s=>s.trim()); if(!q||o.some(x=>!x)) return toast('Fill in the question and all 3 options');
  const id=uidGen(); await BUS.setState('askme/'+id,{by:ME_ID(),q,o,c:amDraft.c,ans:null,at:Date.now()}); BUS.send('notice',{icon:'question',title:ME()+' asked you a question',text:q,target:'askme',kind:'game'}); amDraft={q:'',o:['','',''],c:0}; toast('Sent to '+HER()); amRender(); }
async function amAnswer(id,j){ const q=BUS.get('askme/'+id); if(!q||q.ans) return; const ok=j===q.c; const n={...q,ans:{i:j,at:Date.now()}}; delete n._by; delete n._at; delete n.id; delete n.path; await BUS.setState('askme/'+id,n); buzz(ok?30:[20,40,20]); if(ok) rain('hearts',16); toast(ok?'Correct! 💗':'Not quite. It was "'+q.o[q.c]+'"');
  BUS.send('notice',{icon:'question',title:ME()+' answered your question',text:(ok?'✓ Correct: ':'✗ Wrong: ')+q.o[j],target:'askme',kind:'game'}); amTab(2); }
onScreen('askme',amRender); watchState('askme/',()=>{ amRender(); if(cur==='play') renderGames(); });
