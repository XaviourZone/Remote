/* Better Half – full-body cartoon avatars (pure SVG, animated with CSS) */
const SKINS=['#fde0c8','#f6cfae','#eab08a','#d89a6e','#c48459','#a86b43','#8a5432','#6b3f24'];
const HAIRC=['#151018','#3a2216','#5c3a21','#8b5a2b','#c68642','#e6be8a','#9e9e9e','#b4234d','#6d4bd8','#1d6fa3'];
const CLOTH=['#ffffff','#111827','#374151','#ef4444','#f97316','#facc15','#22c55e','#14b8a6','#0ea5e9','#3b82f6','#6366f1','#a855f7','#ec4899','#f9a8d4','#fde68a','#7c2d12','#1e3a8a','#065f46'];
const AV_OPTS={
  hair:{m:['short','quiff','buzz','sidepart','curly','spiky','manbun','longm'],f:['long','wavy','bob','bun','ponytail','braid','pixie','curlylong']},
  facial:['none','stubble','beard','mustache','goatee'],
  eyes:['round','lash','sparkle'],
  brows:['thin','thick'],
  top:{m:['tshirt','shirt','hoodie','kurta','jacket','sweater'],f:['tshirt','kurta','dress','saree','hoodie','jacket','sweater','shirt']},
  bottom:['jeans','trousers','shorts','joggers','skirt','longskirt'],
  shoes:['sneakers','boots','loafers','sandals','heels','flats'],
  glasses:['none','round','square','sunnies'],
  hat:['none','cap','beanie','sunhat','headband','flower'],
  bag:['none','backpack','sling','handbag'],
  ear:['none','studs','hoops','jhumka'],
  neck:['none','chain','pendant','tie'],
};
const NAMES={short:'Short',quiff:'Quiff',buzz:'Buzz',sidepart:'Side part',curly:'Curly',spiky:'Spiky',manbun:'Man bun',longm:'Long',long:'Long',wavy:'Wavy',bob:'Bob',bun:'Bun',ponytail:'Ponytail',braid:'Braid',pixie:'Pixie',curlylong:'Curls',
  none:'None',stubble:'Stubble',beard:'Beard',mustache:'Mustache',goatee:'Goatee',round:'Round',lash:'Lashes',sparkle:'Sparkle',thin:'Thin',thick:'Thick',
  tshirt:'T-shirt',shirt:'Shirt',hoodie:'Hoodie',kurta:'Kurta',jacket:'Jacket',sweater:'Sweater',dress:'Dress',saree:'Saree',jeans:'Jeans',trousers:'Trousers',shorts:'Shorts',joggers:'Joggers',skirt:'Skirt',longskirt:'Long skirt',
  sneakers:'Sneakers',boots:'Boots',loafers:'Loafers',sandals:'Sandals',heels:'Heels',flats:'Flats',square:'Square',sunnies:'Sunglasses',cap:'Cap',beanie:'Beanie',sunhat:'Sun hat',headband:'Headband',flower:'Flower',
  backpack:'Backpack',sling:'Sling bag',handbag:'Handbag',studs:'Studs',hoops:'Hoops',jhumka:'Jhumka',chain:'Chain',pendant:'Pendant',tie:'Tie'};
function defaultAvatar(g){
  return g==='f'?{g:'f',skin:2,hair:'long',hc:0,eyes:'lash',brows:'thin',facial:'none',blush:true,top:'kurta',topC:'#ec4899',bottom:'trousers',botC:'#fbcfe8',shoes:'flats',shoeC:'#facc15',glasses:'none',hat:'none',hatC:'#a855f7',bag:'handbag',bagC:'#7c2d12',ear:'jhumka',neck:'pendant',bindi:true,nosepin:false,watch:false}
  :{g:'m',skin:3,hair:'quiff',hc:0,eyes:'round',brows:'thick',facial:'stubble',blush:false,top:'shirt',topC:'#3b82f6',bottom:'jeans',botC:'#1e3a8a',shoes:'sneakers',shoeC:'#ffffff',glasses:'none',hat:'none',hatC:'#111827',bag:'none',bagC:'#374151',ear:'none',neck:'none',bindi:false,nosepin:false,watch:true};
}
function shade(h,a){ const n=parseInt(h.slice(1),16); let r=(n>>16)+a,g=(n>>8&255)+a,b=(n&255)+a; r=Math.max(0,Math.min(255,r));g=Math.max(0,Math.min(255,g));b=Math.max(0,Math.min(255,b)); return '#'+((1<<24)+(r<<16)+(g<<8)+b).toString(16).slice(1); }
const HEARTP='M12 20.5s-7.6-4.6-9.5-9.3C1.1 7.8 3.3 4.5 6.7 4.5c2 0 3.4 1.1 4.3 2.5.9-1.4 2.3-2.5 4.3-2.5 3.4 0 5.6 3.3 4.2 6.7-1.9 4.7-9.5 9.3-9.5 9.3z';
const POSES={idle:[10,-10],wave:[10,-150],cheer:[155,-155],hug:[-55,55],heart:[150,-150],point:[10,-85],hips:[30,-30],shy:[-25,25]};
let _avn=0;
function avatar(o,ex='smile',pose='idle',view='full'){
  o=o||defaultAvatar('m'); const id='av'+(++_avn);
  const sk=SKINS[o.skin]||SKINS[2], skd=shade(sk,-26), hc=HAIRC[o.hc]||HAIRC[0], hcl=shade(hc,45);
  const tc=o.topC, tcd=shade(tc,-30), bc=o.botC, bcd=shade(bc,-28), shc=o.shoeC, f=o.g==='f';
  const longSleeve=['shirt','hoodie','jacket','sweater','kurta'].includes(o.top);
  const saree=o.top==='saree', dress=o.top==='dress';
  /* ---- hair back (old head coords) ---- */
  let hb='';
  if(['long','wavy','longm'].includes(o.hair)) hb=`<path d="M22 62 Q18 16 60 15 Q102 16 98 62 L${o.hair==='longm'?98:102} ${o.hair==='longm'?100:128} Q82 ${o.hair==='wavy'?140:134} 60 128 Q38 ${o.hair==='wavy'?140:134} ${o.hair==='longm'?22:18} ${o.hair==='longm'?100:128}Z" fill="${hc}"/>`+(o.hair==='wavy'?`<path d="M20 90 q6 8 0 16 q-6 8 0 16M100 90 q-6 8 0 16 q6 8 0 16" stroke="${hcl}" stroke-width="2" fill="none" opacity=".4"/>`:'');
  if(o.hair==='bob') hb=`<path d="M22 62 Q18 16 60 15 Q102 16 98 62 L100 98 Q84 104 76 96 L44 96 Q36 104 20 98Z" fill="${hc}"/>`;
  if(o.hair==='bun') hb=`<circle cx="60" cy="12" r="15" fill="${hc}"/><path d="M50 8 Q60 2 70 8" stroke="${hcl}" stroke-width="2" fill="none" opacity=".5"/>`;
  if(o.hair==='manbun') hb=`<circle cx="60" cy="16" r="11" fill="${hc}"/>`;
  if(o.hair==='ponytail') hb=`<path d="M86 30 Q118 40 108 90 Q104 112 96 122 Q100 96 92 70Z" fill="${hc}"/>`;
  if(o.hair==='curlylong'){ for(let i=0;i<13;i++){const a=Math.PI*(1.0+i*0.08); hb+=`<circle cx="${60+Math.cos(a)*38}" cy="${60+Math.sin(a)*38}" r="12" fill="${hc}"/>`;} hb+=`<circle cx="22" cy="80" r="12" fill="${hc}"/><circle cx="98" cy="80" r="12" fill="${hc}"/><circle cx="20" cy="104" r="11" fill="${hc}"/><circle cx="100" cy="104" r="11" fill="${hc}"/><circle cx="24" cy="124" r="9" fill="${hc}"/><circle cx="96" cy="124" r="9" fill="${hc}"/>`; }
  if(o.hair==='curly'){ for(let i=0;i<11;i++){const a=Math.PI*(1.02+i*0.096); hb+=`<circle cx="${60+Math.cos(a)*36}" cy="${58+Math.sin(a)*37}" r="12" fill="${hc}"/>`;} }
  if(o.hat==='sunhat') hb+=`<ellipse cx="60" cy="36" rx="58" ry="13" fill="${shade(o.hatC,-20)}"/>`;
  /* ---- hair front ---- */
  const HF={short:`<path d="M24 60 Q21 20 60 18 Q99 20 96 60 Q93 45 81 39 Q70 47 52 43 Q38 41 30 51 Q26 55 24 60Z" fill="${hc}"/>`,
    quiff:`<path d="M24 60 Q20 24 48 18 Q52 6 66 8 Q78 10 74 19 Q99 25 96 60 Q92 44 78 38 Q64 45 46 40 Q32 44 24 60Z" fill="${hc}"/><path d="M52 14 Q60 9 68 12" stroke="${hcl}" stroke-width="2.5" fill="none" stroke-linecap="round" opacity=".6"/>`,
    buzz:`<path d="M26 56 Q26 24 60 23 Q94 24 94 56 Q88 40 60 38 Q32 40 26 56Z" fill="${hc}" opacity=".85"/>`,
    sidepart:`<path d="M24 62 Q20 22 58 18 Q98 18 96 60 Q94 42 84 36 Q60 32 44 42 Q36 30 30 44 Q26 52 24 62Z" fill="${hc}"/><path d="M44 42 Q48 26 70 22" stroke="${hcl}" stroke-width="2" fill="none" opacity=".5"/>`,
    spiky:`<path d="M24 60 L22 34 L34 38 L36 18 L48 30 L56 10 L64 28 L76 12 L80 30 L94 22 L92 40 L98 46 Q96 52 96 60 Q90 44 76 40 Q60 46 44 40 Q32 44 24 60Z" fill="${hc}"/>`,
    curly:`<path d="M27 58 Q30 30 60 28 Q90 30 93 58 Q84 44 60 44 Q36 44 27 58Z" fill="${hc}"/>`,
    manbun:`<path d="M25 60 Q23 22 60 21 Q97 22 95 60 Q88 40 60 37 Q32 40 25 60Z" fill="${hc}"/><path d="M40 30 Q60 22 80 30" stroke="${hcl}" stroke-width="2" fill="none" opacity=".45"/>`,
    longm:`<path d="M25 62 Q22 20 60 19 Q98 20 95 62 Q92 42 70 36 Q58 46 40 44 Q30 48 25 62Z" fill="${hc}"/>`,
    long:`<path d="M25 62 Q23 20 60 19 Q97 20 95 62 Q90 40 72 33 Q63 46 40 45 Q30 50 25 62Z" fill="${hc}"/><path d="M44 26 Q54 21 66 23" stroke="${hcl}" stroke-width="2.5" fill="none" stroke-linecap="round" opacity=".55"/>`,
    wavy:`<path d="M25 62 Q23 20 60 19 Q97 20 95 62 Q92 46 82 40 Q76 34 64 40 Q52 46 40 40 Q30 48 25 62Z" fill="${hc}"/>`,
    bob:`<path d="M25 62 Q23 20 60 19 Q97 20 95 62 Q92 44 60 40 Q28 44 25 62Z" fill="${hc}"/><path d="M42 26 Q54 21 66 23" stroke="${hcl}" stroke-width="2.5" fill="none" stroke-linecap="round" opacity=".55"/>`,
    bun:`<path d="M25 62 Q23 22 60 21 Q97 22 95 62 Q88 40 60 37 Q32 40 25 62Z" fill="${hc}"/>`,
    ponytail:`<path d="M25 62 Q23 22 60 21 Q97 22 95 62 Q88 40 62 36 Q34 42 25 62Z" fill="${hc}"/><circle cx="90" cy="34" r="5" fill="${o.hatC}"/>`,
    braid:`<path d="M25 62 Q23 22 60 21 Q97 22 95 62 Q86 40 56 37 Q34 42 25 62Z" fill="${hc}"/>`,
    pixie:`<path d="M24 62 Q20 20 60 18 Q100 20 96 56 Q86 44 74 40 Q62 50 40 44 Q30 52 24 62Z" fill="${hc}"/>`,
    curlylong:`<path d="M27 58 Q30 30 60 28 Q90 30 93 58 Q84 44 60 44 Q36 44 27 58Z" fill="${hc}"/>`};
  let braid=''; if(o.hair==='braid'){ for(let i=0;i<7;i++) braid+=`<ellipse cx="${30+i*.8}" cy="${74+i*10}" rx="8" ry="6.5" fill="${i%2?hc:shade(hc,15)}"/>`; braid+=`<circle cx="36" cy="146" r="3.5" fill="${o.hatC}"/>`; }
  /* ---- face ---- */
  const eyeN=o.eyes==='lash'?`<g class="eyes"><ellipse cx="46" cy="66" rx="4.6" ry="5.6" fill="#1b1230"/><ellipse cx="74" cy="66" rx="4.6" ry="5.6" fill="#1b1230"/><circle cx="47.8" cy="63.8" r="1.7" fill="#fff"/><circle cx="75.8" cy="63.8" r="1.7" fill="#fff"/><path d="M41 62 l-3 -3M42.5 60.5 l-2 -3.5M79 62 l3 -3M77.5 60.5 l2 -3.5" stroke="#1b1230" stroke-width="1.4" stroke-linecap="round"/></g>`
    :o.eyes==='sparkle'?`<g class="eyes"><ellipse cx="46" cy="66" rx="5" ry="6" fill="#1b1230"/><ellipse cx="74" cy="66" rx="5" ry="6" fill="#1b1230"/><circle cx="48" cy="63.4" r="2.1" fill="#fff"/><circle cx="76" cy="63.4" r="2.1" fill="#fff"/><circle cx="44.5" cy="68.5" r="1" fill="#fff"/><circle cx="72.5" cy="68.5" r="1" fill="#fff"/></g>`
    :`<g class="eyes"><ellipse cx="46" cy="66" rx="4.6" ry="5.6" fill="#1b1230"/><ellipse cx="74" cy="66" rx="4.6" ry="5.6" fill="#1b1230"/><circle cx="47.8" cy="63.8" r="1.7" fill="#fff"/><circle cx="75.8" cy="63.8" r="1.7" fill="#fff"/></g>`;
  const hrt=(x,y)=>`<path transform="translate(${x-6} ${y-6}) scale(.5)" d="${HEARTP}" fill="#ff3d7f"/>`;
  const EY={smile:eyeN,kiss:`<path d="M41 66 Q46 70 51 66M69 66 Q74 70 79 66" stroke="#1b1230" stroke-width="2.6" fill="none" stroke-linecap="round"/>`,love:hrt(46,66)+hrt(74,66),laugh:`<path d="M41 68 Q46 61 51 68M69 68 Q74 61 79 68" stroke="#1b1230" stroke-width="2.8" fill="none" stroke-linecap="round"/>`,sleepy:`<path d="M41 67 Q46 70 51 67M69 67 Q74 70 79 67" stroke="#1b1230" stroke-width="2.4" fill="none" stroke-linecap="round"/>`,wink:`<g class="eyes"><ellipse cx="46" cy="66" rx="4.6" ry="5.6" fill="#1b1230"/><circle cx="47.8" cy="63.8" r="1.7" fill="#fff"/></g><path d="M69 67 Q74 63 79 67" stroke="#1b1230" stroke-width="2.6" fill="none" stroke-linecap="round"/>`,sad:eyeN,wow:eyeN,shy:`<path d="M41 67 Q46 70 51 67M69 67 Q74 70 79 67" stroke="#1b1230" stroke-width="2.4" fill="none" stroke-linecap="round"/>`};
  const MO={smile:'<path d="M52 80 Q60 87 68 80" stroke="#7a2140" stroke-width="2.8" fill="none" stroke-linecap="round"/>',kiss:'<ellipse cx="62" cy="81" rx="4" ry="4.6" fill="#e0336f"/><ellipse cx="61" cy="79.6" rx="1.5" ry="1" fill="#fff" opacity=".5"/>',love:'<path d="M51 79 Q60 89 69 79Z" fill="#7a2140"/><path d="M55 83 Q60 87 65 83" fill="#ff7aa8"/>',laugh:'<path d="M49 78 Q60 93 71 78Z" fill="#7a2140"/><path d="M54 84 Q60 89 66 84" fill="#ff7aa8"/>',sleepy:'<ellipse cx="60" cy="82" rx="3.5" ry="2.6" fill="#7a2140"/>',wink:'<path d="M52 80 Q60 87 68 80" stroke="#7a2140" stroke-width="2.8" fill="none" stroke-linecap="round"/>',sad:'<path d="M53 85 Q60 79 67 85" stroke="#7a2140" stroke-width="2.8" fill="none" stroke-linecap="round"/>',wow:'<ellipse cx="60" cy="83" rx="4.5" ry="5.5" fill="#7a2140"/>',shy:'<path d="M55 81 Q60 84 65 81" stroke="#7a2140" stroke-width="2.4" fill="none" stroke-linecap="round"/>'};
  const bw=o.brows==='thick'?3.4:2.2, bcol=shade(hc,10);
  const brow=ex==='sad'?`<path d="M40 56 Q46 54 51 58M69 58 Q74 54 80 56" stroke="${bcol}" stroke-width="${bw}" fill="none" stroke-linecap="round"/>`:`<path d="M40 56 Q46 52 51 55M69 55 Q74 52 80 56" stroke="${bcol}" stroke-width="${bw}" fill="none" stroke-linecap="round"/>`;
  const FH={none:'',stubble:`<path d="M27 70 Q30 98 60 101 Q90 98 93 70 Q88 92 60 94 Q32 92 27 70Z" fill="${hc}" opacity=".22"/>`,beard:`<path d="M26 66 Q28 104 60 108 Q92 104 94 66 Q90 84 80 88 Q70 84 60 86 Q50 84 40 88 Q30 84 26 66Z" fill="${hc}"/><path d="M52 77 Q60 73 68 77 Q64 80 60 78 Q56 80 52 77Z" fill="${hc}"/>`,mustache:`<path d="M50 77 Q55 72 60 75 Q65 72 70 77 Q66 80 60 78 Q54 80 50 77Z" fill="${hc}"/>`,goatee:`<path d="M51 77 Q60 72 69 77 Q64 80 60 78 Q56 80 51 77Z" fill="${hc}"/><path d="M54 90 Q60 100 66 90 Q60 94 54 90Z" fill="${hc}"/>`};
  const GL={none:'',round:`<g fill="rgba(255,255,255,.14)" stroke="#1f1a2e" stroke-width="2.2"><circle cx="46" cy="66" r="10"/><circle cx="74" cy="66" r="10"/><path d="M56 65 Q60 62 64 65" fill="none"/></g>`,square:`<g fill="rgba(255,255,255,.14)" stroke="#1f1a2e" stroke-width="2.2"><rect x="35" y="58" width="21" height="16" rx="4"/><rect x="64" y="58" width="21" height="16" rx="4"/><path d="M56 65 Q60 62 64 65" fill="none"/></g>`,sunnies:`<g stroke="#111" stroke-width="2"><path d="M34 60 h22 v6 a9 9 0 0 1 -22 0z" fill="#111827"/><path d="M64 60 h22 v6 a9 9 0 0 1 -22 0z" fill="#111827"/><path d="M56 62 h8" fill="none"/></g><path d="M38 63 l6 0M68 63 l6 0" stroke="#fff" stroke-width="1.6" opacity=".5"/>`};
  const hcC=o.hatC, hcD=shade(hcC,-30);
  const HAT={none:'',cap:`<path d="M24 52 Q24 12 60 11 Q96 12 96 52 Q60 40 24 52Z" fill="${hcC}"/><path d="M22 52 Q60 40 98 52 Q118 56 112 62 Q80 52 22 58Z" fill="${hcD}"/><circle cx="60" cy="12" r="3" fill="${hcD}"/>`,beanie:`<path d="M24 50 Q24 10 60 9 Q96 10 96 50Z" fill="${hcC}"/><rect x="22" y="42" width="76" height="12" rx="6" fill="${hcD}"/><circle cx="60" cy="8" r="7" fill="${shade(hcC,30)}"/>`,sunhat:`<path d="M34 36 Q34 6 60 6 Q86 6 86 36Z" fill="${hcC}"/><rect x="34" y="28" width="52" height="7" fill="${hcD}"/>`,headband:`<path d="M24 46 Q60 14 96 46" stroke="${hcC}" stroke-width="6" fill="none" stroke-linecap="round"/>`,flower:`<g transform="translate(88 32)">${[0,72,144,216,288].map(a=>`<ellipse cx="0" cy="-6" rx="4.5" ry="6.5" fill="${hcC}" transform="rotate(${a})"/>`).join('')}<circle r="3.5" fill="#facc15"/></g>`};
  const EAR={none:'',studs:`<circle cx="25.5" cy="76" r="2.4" fill="#fde68a"/><circle cx="94.5" cy="76" r="2.4" fill="#fde68a"/>`,hoops:`<circle cx="25.5" cy="80" r="5" fill="none" stroke="#f5c542" stroke-width="2"/><circle cx="94.5" cy="80" r="5" fill="none" stroke="#f5c542" stroke-width="2"/>`,jhumka:`<g fill="#f5c542"><circle cx="25.5" cy="76" r="2"/><path d="M20.5 80 a5 5 0 0 1 10 0 v2 h-10z"/><circle cx="25.5" cy="84" r="1.4"/><circle cx="94.5" cy="76" r="2"/><path d="M89.5 80 a5 5 0 0 1 10 0 v2 h-10z"/><circle cx="94.5" cy="84" r="1.4"/></g>`};
  const head=`<g transform="translate(14.8 2) scale(.92)">
    <circle cx="25.5" cy="68" r="7.5" fill="${skd}"/><circle cx="94.5" cy="68" r="7.5" fill="${skd}"/>
    <ellipse cx="60" cy="63" rx="35" ry="38" fill="url(#${id}f)"/>
    ${FH[o.facial]||''}${HF[o.hair]||HF.short}${brow}${EY[ex]||eyeN}
    ${o.blush||['love','shy','kiss'].includes(ex)?`<ellipse cx="38" cy="78" rx="6.5" ry="3.8" fill="#ff6b9a" opacity="${['love','shy'].includes(ex)?.6:.4}"/><ellipse cx="82" cy="78" rx="6.5" ry="3.8" fill="#ff6b9a" opacity="${['love','shy'].includes(ex)?.6:.4}"/>`:''}
    <path d="M60 70 Q58 74 61 75.5" stroke="${skd}" stroke-width="2" fill="none" stroke-linecap="round"/>
    ${MO[ex]||MO.smile}${o.bindi?'<circle cx="60" cy="50" r="2.4" fill="#dc2626"/>':''}${o.nosepin?'<circle cx="64.5" cy="73.5" r="1.3" fill="#fde68a"/>':''}
    ${GL[o.glasses]||''}${EAR[o.ear]||''}${HAT[o.hat]||''}
    ${ex==='sleepy'?'<text x="92" y="30" font-size="15" font-weight="800" fill="#c4b5fd" font-family="Outfit,sans-serif">z</text><text x="103" y="18" font-size="11" font-weight="800" fill="#c4b5fd" font-family="Outfit,sans-serif">z</text>':''}
    ${ex==='sad'?'<path d="M80 72 q2 5 0 7 q-2-2 0-7z" fill="#7dd3fc"/>':''}</g>`;
  if(view==='head') return `<svg class="ava" viewBox="22 14 96 96"><defs><radialGradient id="${id}f" cx=".4" cy=".35" r=".8"><stop offset="0" stop-color="${shade(sk,14)}"/><stop offset="1" stop-color="${sk}"/></radialGradient></defs><g transform="translate(14.8 2) scale(.92)">${hb}</g><rect x="63" y="88" width="14" height="22" rx="6" fill="${skd}"/><path d="M40 112 Q42 100 60 99 L80 99 Q98 100 100 112Z" fill="${tc}"/>${head}${braid?`<g transform="translate(14.8 2) scale(.92)">${braid}</g>`:''}</svg>`;
  /* ---- body (new coords: 140 x 300) ---- */
  const torsoM='M44 112 Q44 102 58 101 L82 101 Q96 102 96 112 L94 176 Q70 182 46 176 Z';
  const torsoF='M47 112 Q47 102 59 101 L81 101 Q93 102 93 112 Q90 138 88 148 Q92 164 92 176 Q70 182 48 176 Q48 164 52 148 Q50 138 47 112 Z';
  const torso=f?torsoF:torsoM;
  const legC=(['jeans','trousers','joggers'].includes(o.bottom)&&!saree)?bc:sk;
  let legs=`<path d="M59 186 L57 272M81 186 L83 272" stroke="${legC===sk?skd:legC}" stroke-width="16.5" stroke-linecap="round"/>`;
  if(o.bottom==='jeans') legs+=`<path d="M59 192 L57.5 268M81 192 L82.5 268" stroke="${shade(bc,22)}" stroke-width="1" opacity=".6" stroke-dasharray="3 3"/>`;
  if(o.bottom==='trousers') legs+=`<path d="M59 190 L57.5 270M81 190 L82.5 270" stroke="${bcd}" stroke-width="1.2" opacity=".7"/>`;
  if(o.bottom==='joggers') legs+=`<path d="M50 262 h15M75 262 h15" stroke="${bcd}" stroke-width="5" stroke-linecap="round"/>`;
  if(o.bottom==='shorts'&&!saree) legs+=`<path d="M59 186 L58.4 214M81 186 L81.6 214" stroke="${bc}" stroke-width="18" stroke-linecap="butt"/>`;
  const SH={sneakers:`<path d="M46 270 h20 a6 6 0 0 1 6 6 v4 h-30 v-4 a6 6 0 0 1 4 -6z" fill="${shc}"/><rect x="42" y="279" width="30" height="5" rx="2.5" fill="#e5e7eb"/><path d="M50 274 l8 0" stroke="${shade(shc,-60)}" stroke-width="1.4"/>`,
    boots:`<path d="M49 254 h16 v18 a8 8 0 0 1 6 8 v4 h-28 v-4 a6 6 0 0 1 6 -6z" fill="${shc}"/><rect x="43" y="281" width="28" height="4" rx="2" fill="${shade(shc,-50)}"/>`,
    loafers:`<path d="M45 273 h20 a7 7 0 0 1 7 7 v3 h-31 v-3 a7 7 0 0 1 4 -7z" fill="${shc}"/><path d="M52 276 h10" stroke="${shade(shc,40)}" stroke-width="1.6"/>`,
    sandals:`<ellipse cx="57" cy="279" rx="12" ry="5" fill="${sk}"/><path d="M47 277 q10 -5 20 0M50 281 h16" stroke="${shc}" stroke-width="2.6" fill="none"/><rect x="44" y="282" width="26" height="3" rx="1.5" fill="${shade(shc,-40)}"/>`,
    heels:`<path d="M47 272 q10 -2 18 4 l6 4 h-26z" fill="${shc}"/><path d="M47 276 l-1 9" stroke="${shade(shc,-50)}" stroke-width="2.4"/>`,
    flats:`<ellipse cx="57" cy="279" rx="13" ry="5.5" fill="${shc}"/><circle cx="64" cy="277" r="2" fill="${shade(shc,40)}"/>`};
  const shoe=SH[o.shoes]||SH.sneakers;
  const shoes=`${shoe}<g transform="translate(140 0) scale(-1 1)">${shoe}</g>`;
  let hip=`<path d="M47 168 L93 168 L94 196 L46 196 Z" fill="${bc}"/>`;
  if(o.bottom==='jeans') hip+=`<path d="M52 176 q6 6 12 2M88 176 q-6 6 -12 2" stroke="${shade(bc,22)}" stroke-width="1" fill="none" opacity=".7"/><rect x="66" y="170" width="8" height="5" rx="1" fill="#facc15" opacity=".8"/>`;
  let skirt='';
  if(o.bottom==='skirt'&&!saree&&!dress){ hip=''; skirt=`<path d="M47 168 L93 168 L104 222 L36 222 Z" fill="${bc}"/><path d="M38 216 L102 216" stroke="${bcd}" stroke-width="3"/>`; }
  if(o.bottom==='longskirt'&&!saree&&!dress){ hip=''; legs=''; skirt=`<path d="M47 168 L93 168 L110 278 L30 278 Z" fill="${bc}"/><path d="M32 270 L108 270" stroke="#f5c542" stroke-width="3"/>`; }
  let top='';
  const neckline=`<path d="M61 101 Q70 112 79 101" fill="${skd}"/>`;
  if(o.top==='tshirt') top=`<path d="${torso}" fill="url(#${id}t)"/>${neckline}<path d="M61 101 Q70 112 79 101" stroke="${tcd}" stroke-width="2.2" fill="none"/>`;
  if(o.top==='shirt') top=`<path d="${torso}" fill="url(#${id}t)"/><path d="M62 101 L70 116 L78 101Z" fill="${skd}"/><path d="M60 100 L68 113 L58 116Z M80 100 L72 113 L82 116Z" fill="${shade(tc,45)}"/><g fill="${tcd}">${[124,138,152,166].map(y=>`<circle cx="70" cy="${y}" r="1.6"/>`).join('')}</g><path d="M70 116 V176" stroke="${tcd}" stroke-width="1"/><rect x="52" y="124" width="10" height="8" rx="1.5" fill="none" stroke="${tcd}" stroke-width="1"/>`;
  if(o.top==='hoodie') top=`<path d="${torso}" fill="url(#${id}t)"/><path d="M52 106 Q70 92 88 106 Q84 112 70 113 Q56 112 52 106Z" fill="${tcd}"/><path d="M64 112 v18M76 112 v18" stroke="#fff" stroke-width="1.6" stroke-linecap="round"/><rect x="54" y="146" width="32" height="18" rx="6" fill="${tcd}" opacity=".55"/><path d="M46 172 Q70 178 94 172" stroke="${tcd}" stroke-width="4"/>`;
  if(o.top==='sweater') top=`<path d="${torso}" fill="url(#${id}t)"/>${neckline}<path d="M60 101 Q70 114 80 101" stroke="${tcd}" stroke-width="4" fill="none"/><path d="M48 170 Q70 176 92 170" stroke="${tcd}" stroke-width="5"/><path d="M58 128 l6 6 l6 -6 l6 6 l6 -6" stroke="${shade(tc,40)}" stroke-width="1.6" fill="none"/>`;
  if(o.top==='jacket') top=`<path d="${torso}" fill="url(#${id}t)"/><path d="M62 101 L78 101 L76 178 L64 178Z" fill="${shade(tc,-60)}"/><path d="M62 101 L70 128 L78 101" fill="#f8fafc"/><path d="M60 100 L66 134 L56 120Z M80 100 L74 134 L84 120Z" fill="${tcd}"/><circle cx="66" cy="150" r="1.6" fill="${tcd}"/><circle cx="66" cy="164" r="1.6" fill="${tcd}"/>`;
  if(o.top==='kurta') top=`<path d="${f?'M47 112 Q47 102 59 101 L81 101 Q93 102 93 112 Q90 140 88 150 Q96 186 98 214 Q70 220 42 214 Q44 186 52 150 Q50 140 47 112 Z':'M44 112 Q44 102 58 101 L82 101 Q96 102 96 112 L97 214 Q70 220 43 214 Z'}" fill="url(#${id}t)"/><path d="M62 101 Q70 110 78 101" fill="${skd}"/><path d="M70 106 V132" stroke="#f5c542" stroke-width="1.6"/><path d="${f?'M43 208 Q70 214 97 208':'M44 208 Q70 214 96 208'}" stroke="#f5c542" stroke-width="3" fill="none"/><g fill="#f5c542">${[118,126].map(y=>`<circle cx="70" cy="${y}" r="1.2"/>`).join('')}</g>`;
  if(dress) top=`<path d="${torsoF}" fill="url(#${id}t)"/><path d="M48 168 L92 168 L106 226 L34 226 Z" fill="url(#${id}t)"/><path d="M60 101 Q70 114 80 101" fill="${skd}"/><path d="M50 160 Q70 166 90 160" stroke="${tcd}" stroke-width="5"/><path d="M36 220 L104 220" stroke="${shade(tc,40)}" stroke-width="2" stroke-dasharray="2 4"/>`;
  if(saree){ legs=''; hip=''; top=`<path d="M47 112 Q47 102 59 101 L81 101 Q93 102 93 112 L91 140 Q70 146 49 140 Z" fill="${shade(tc,-45)}"/><path d="M49 140 Q70 146 91 140 Q90 156 92 170 Q70 176 48 170 Q50 156 49 140Z" fill="${skd}"/><path d="M46 166 L94 166 L110 280 L30 280 Z" fill="url(#${id}t)"/><path d="M60 170 L56 278M70 170 L70 278M80 170 L84 278" stroke="${tcd}" stroke-width="1.2" opacity=".6"/><path d="M32 272 L108 272" stroke="#f5c542" stroke-width="3.5"/><path d="M78 100 L96 108 L58 186 L42 176 Z" fill="${tc}"/><path d="M96 108 L58 186" stroke="#f5c542" stroke-width="3"/><path d="M62 101 Q70 110 78 101" fill="${skd}"/>`; }
  /* arms */
  const [aL,aR]=POSES[pose]||POSES.idle;
  const sleeveC=saree?shade(tc,-45):tc;
  const arm=(side)=>{ const sl=longSleeve?`<path d="M0 0 L${side*-2} 56" stroke="${sleeveC}" stroke-width="13.5" stroke-linecap="round"/><path d="M${side*-1.6} 50 L${side*-2} 56" stroke="${shade(sleeveC,-25)}" stroke-width="13.5" stroke-linecap="round"/>`:`<path d="M0 0 L${side*-2} 58" stroke="${sk}" stroke-width="11.5" stroke-linecap="round"/><path d="M0 0 L${side*-.8} 20" stroke="${sleeveC}" stroke-width="14.5" stroke-linecap="round"/>`;
    const hand=`<circle cx="${side*-2}" cy="62" r="6.6" fill="${sk}"/>`;
    const watch=(o.watch&&side===1)?`<rect x="-8.5" y="47" width="13" height="5" rx="2" fill="#111827"/><rect x="-5" y="46" width="6" height="7" rx="1.5" fill="#94a3b8"/>`:'';
    const bangle=(f&&side===-1&&!longSleeve)?`<ellipse cx="2" cy="52" rx="7" ry="2.2" fill="none" stroke="#f5c542" stroke-width="1.8"/>`:'';
    const hb2=(o.bag==='handbag'&&side===-1)?`<path d="M-6 64 Q2 54 10 64" stroke="${shade(o.bagC,-30)}" stroke-width="2.2" fill="none"/><rect x="-9" y="63" width="22" height="18" rx="4" fill="${o.bagC}"/><rect x="-9" y="68" width="22" height="3" fill="${shade(o.bagC,-30)}"/>`:'';
    return sl+hand+watch+bangle+hb2; };
  const armL=`<g transform="translate(47 110)"><g class="armL" style="transform:rotate(${aL}deg)">${arm(1)}</g></g>`;
  const armR=`<g transform="translate(93 110)"><g class="armR" style="transform:rotate(${aR}deg)">${arm(-1)}</g></g>`;
  /* bags + jewellery front */
  let bagBack='', bagFront='';
  if(o.bag==='backpack'){ bagBack=`<rect x="40" y="106" width="60" height="70" rx="14" fill="${shade(o.bagC,-20)}"/>`; bagFront=`<path d="M54 102 Q50 130 52 160M86 102 Q90 130 88 160" stroke="${o.bagC}" stroke-width="5" fill="none" stroke-linecap="round"/>`; }
  if(o.bag==='sling') bagFront=`<path d="M56 102 L94 178" stroke="${shade(o.bagC,-20)}" stroke-width="4" stroke-linecap="round"/><rect x="84" y="170" width="24" height="18" rx="5" fill="${o.bagC}"/><path d="M84 176 h24" stroke="${shade(o.bagC,-30)}" stroke-width="2"/>`;
  const NK={none:'',chain:`<path d="M60 102 Q70 116 80 102" stroke="#f5c542" stroke-width="1.8" fill="none"/>`,pendant:`<path d="M60 102 Q70 116 80 102" stroke="#f5c542" stroke-width="1.6" fill="none"/><path transform="translate(66 112) scale(.33)" d="${HEARTP}" fill="#ef4444"/>`,tie:`<path d="M67 104 L73 104 L71 110 L75 150 L70 156 L65 150 L69 110Z" fill="${shade(tc,-70)}"/>`};
  const necklace=(o.neck==='tie'&&!['shirt','jacket'].includes(o.top))?'':NK[o.neck]||'';
  return `<svg class="ava pose-${pose}" viewBox="0 0 140 300"><defs><radialGradient id="${id}f" cx=".4" cy=".35" r=".8"><stop offset="0" stop-color="${shade(sk,14)}"/><stop offset="1" stop-color="${sk}"/></radialGradient><linearGradient id="${id}t" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${shade(tc,22)}"/><stop offset="1" stop-color="${shade(tc,-12)}"/></linearGradient></defs>
  <ellipse cx="70" cy="290" rx="40" ry="6" fill="rgba(0,0,0,.32)"/>
  <g class="bob"><g transform="translate(14.8 2) scale(.92)">${hb}</g>${bagBack}
  ${legs}${shoes}${hip}${skirt}
  <rect x="63" y="86" width="14" height="22" rx="6" fill="${skd}"/>
  ${top}${bagFront}${necklace}${armL}${armR}
  <g class="head">${head}${braid?`<g transform="translate(14.8 2) scale(.92)">${braid}</g>`:''}</g></g></svg>`;
}
