/* ================= ICONS ================= */
const HEART='M12 20.5s-7.6-4.6-9.5-9.3C1.1 7.8 3.3 4.5 6.7 4.5c2 0 3.4 1.1 4.3 2.5.9-1.4 2.3-2.5 4.3-2.5 3.4 0 5.6 3.3 4.2 6.7-1.9 4.7-9.5 9.3-9.5 9.3z';
const ICONS={
home:'<path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
chat:'<path d="M21 11.5a8.5 8.5 0 0 1-12.3 7.6L3 21l1.9-5.4A8.5 8.5 0 1 1 21 11.5z"/>',
touch:`<path d="${HEART}"/><path d="M12 9.5v4M10 11.5h4"/>`,
play:'<path d="M6 11h4M8 9v4M15 12h.01M18 10h.01"/><path d="M17.3 5H6.7a4 4 0 0 0-3.9 3.2l-1 5.6A3 3 0 0 0 4.8 17.5c1 0 1.9-.5 2.4-1.3L8.5 14h7l1.3 2.2c.5.8 1.4 1.3 2.4 1.3a3 3 0 0 0 3-3.7l-1-5.6A4 4 0 0 0 17.3 5z"/>',
plans:'<path d="M10 6h10M10 12h10M10 18h10M3.5 6l1.2 1.2L7 5M3.5 12l1.2 1.2L7 11M3.5 18l1.2 1.2L7 17"/>',
gear:'<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
phone:'<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z"/>',
endcall:'<g transform="rotate(135 12 12)"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z"/></g>',
video:'<rect x="2" y="6" width="14" height="12" rx="3"/><path d="M16 10.5l6-3.5v10l-6-3.5"/>',
videooff:'<path d="M2 2l20 20M16 16v1a1 1 0 0 1-1 1H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h2M10 6h5a1 1 0 0 1 1 1v4l6-4v10"/>',
mic:'<rect x="9" y="2" width="6" height="12" rx="3"/><path d="M5 10v1a7 7 0 0 0 14 0v-1M12 18v4"/>',
mute:'<path d="M2 2l20 20M9 9v2a3 3 0 0 0 5.1 2.1M15 9.3V5a3 3 0 0 0-5.9-.6M17 16.9A7 7 0 0 1 5 11v-1M19 10v1a7 7 0 0 1-.1 1.2M12 18v4"/>',
send:'<path d="M22 2 11 13M22 2l-7 20-4-9-9-4z"/>',
plus:'<path d="M12 5v14M5 12h14"/>',
smile:'<circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2M9 9h.01M15 9h.01"/>',
image:'<rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="9" cy="9" r="2"/><path d="M21 15l-5-5L5 21"/>',
lock:'<rect x="4" y="11" width="16" height="10" rx="2.5"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
back:'<path d="M15 18l-6-6 6-6"/>',chev:'<path d="M9 18l6-6-6-6"/>',
close:'<path d="M18 6 6 18M6 6l12 12"/>',
bell:'<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9M10.3 21a1.9 1.9 0 0 0 3.4 0"/>',
heart:`<path d="${HEART}"/>`,
kiss:`<path d="${HEART}"/><path d="M8.5 11.2c1.2-.9 2.4-.9 3.5 0 1.1-.9 2.3-.9 3.5 0-1 1.5-2.2 2.1-3.5 2.1s-2.5-.6-3.5-2.1z"/>`,
star:'<path d="M12 2.5l3 6.1 6.7 1-4.9 4.7 1.2 6.7-6-3.2-6 3.2 1.2-6.7-4.9-4.7 6.7-1z"/>',
sparkle:'<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8zM19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8z"/>',
alarm:'<circle cx="12" cy="13" r="8"/><path d="M12 9v4l2.5 2M5 3 2 6M22 6l-3-3"/>',
repeat:'<path d="M17 1l4 4-4 4M3 11V9a4 4 0 0 1 4-4h14M7 23l-4-4 4-4M21 13v2a4 4 0 0 1-4 4H3"/>',
check:'<path d="M20 6 9 17l-5-5"/>',
trash:'<path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/>',
camera:'<path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/>',
flip:'<path d="M3 12a9 9 0 0 1 15-6.7L21 8M21 3v5h-5M21 12a9 9 0 0 1-15 6.7L3 16M3 21v-5h5"/>',
speaker:'<path d="M11 5 6 9H2v6h4l5 4zM15.5 8.5a5 5 0 0 1 0 7M19 5a10 10 0 0 1 0 14"/>',
palette:'<path d="M12 22a10 10 0 1 1 10-10c0 2.8-2.2 4-4 4h-2a2 2 0 0 0-1.4 3.4A1.8 1.8 0 0 1 12 22z"/><circle cx="7.5" cy="11" r="1"/><circle cx="10.5" cy="7" r="1"/><circle cx="15.5" cy="7.5" r="1"/>',
key:'<circle cx="7.5" cy="15.5" r="4.5"/><path d="M10.7 12.3 21 2M16 7l3 3M18.5 4.5l2 2"/>',
eye:'<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z"/><circle cx="12" cy="12" r="3"/>',
jar:'<path d="M8 2h8M7 5h10"/><path d="M7 5c-1.5 1-3 2.2-3 4.5V19a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3V9.5C20 7.2 18.5 6 17 5"/><path d="M12 17.5s-3.2-1.9-3.2-3.9c0-1.4 1.6-2.1 3.2-.8 1.6-1.3 3.2-.6 3.2.8 0 2-3.2 3.9-3.2 3.9z"/>',
question:'<circle cx="12" cy="12" r="10"/><path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3M12 17h.01"/>',
radio:'<rect x="6" y="7" width="12" height="15" rx="3"/><path d="M15 7V2M9.5 12h5M9.5 15.5h5M9.5 19h5"/>',
lips:'<path d="M2 12c3.2-4.2 6.2-5.3 8.3-4.2.8.4 1.3.4 1.7 0 2.1-1.1 5.1 0 8.3 4.2-3.2 4.3-6.2 6.3-10 6.3S5.2 16.3 2 12z"/><path d="M2 12c4 1.3 7 1.6 10 1.6s6-.3 10-1.6"/>',
wand:'<path d="M15 4V2M15 16v-2M8 9h2M20 9h2M17.8 11.8 19 13M17.8 6.2 19 5M3 21l9-9M12.2 6.2 11 5"/>',
hands:'<path d="M8 13V5a2 2 0 0 1 4 0v6M12 11V4a2 2 0 0 1 4 0v8M16 12V7a2 2 0 0 1 4 0v8a7 7 0 0 1-7 7h-1a7 7 0 0 1-6-3.5L3.3 14a2 2 0 0 1 3.4-2L8 14"/>',
shoot:'<path d="M2 22l7-7M5 14l-2 2M10 19l-2 2"/><path d="M14 3l1.6 3.4 3.7.5-2.7 2.6.7 3.7-3.3-1.8-3.3 1.8.7-3.7-2.7-2.6 3.7-.5z"/>',
room:'<path d="M3 21h18M5 21V9l7-5.5L19 9v12"/><path d="M12 17.5s-3-1.8-3-3.6c0-1.3 1.5-2 3-.8 1.5-1.2 3-.5 3 .8 0 1.8-3 3.6-3 3.6z"/>',
zap:'<path d="M13 2 3 14h9l-1 8 10-12h-9z"/>',
taps:'<path d="M12 11v4M8 12a4 4 0 0 1 8 0v4M5 12a7 7 0 0 1 14 0v3M2.5 12a9.5 9.5 0 0 1 19 0"/>',
info:'<circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>',
mail:'<rect x="2" y="4" width="20" height="16" rx="3"/><path d="m22 7-10 6L2 7"/>',
link:'<path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7"/>',
shield:'<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M9 12l2 2 4-4"/>',
pin:'<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z"/><circle cx="12" cy="10" r="3"/>',
refresh:'<path d="M3 12a9 9 0 0 1 15-6.7L21 8M21 3v5h-5M21 12a9 9 0 0 1-15 6.7L3 16M3 21v-5h5"/>',
trophy:'<path d="M6 9H4a2 2 0 0 1 0-4h2M18 9h2a2 2 0 0 0 0-4h-2M6 3h12v7a6 6 0 0 1-12 0zM12 16v3M8 22h8M9 19h6"/>',
reply:'<path d="M9 17l-5-5 5-5M20 18v-2a4 4 0 0 0-4-4H4"/>',
copy:'<rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>',
save:'<path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><path d="M17 21v-8H7v8M7 3v5h8"/>',
playt:'<path d="M7 4v16l13-8z" fill="currentColor"/>',pause:'<path d="M7 4h3v16H7zM14 4h3v16h-3z" fill="currentColor"/>',
moon:'<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/>',
sun:'<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
music:'<path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>',
coffee:'<path d="M17 8h1a4 4 0 0 1 0 8h-1M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4zM6 2v3M10 2v3M14 2v3"/>',
plane:'<path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z"/>',
ring:'<circle cx="12" cy="15" r="6.5"/><path d="M9 3.5h6L12 8z"/>',
gift:'<rect x="3" y="8" width="18" height="4" rx="1"/><path d="M12 8v13M19 12v9H5v-9M7.5 8a2.5 2.5 0 0 1 0-5C11 3 12 8 12 8s1-5 4.5-5a2.5 2.5 0 0 1 0 5"/>',
flame:'<path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.4-.5-2-1-3-1.1-2.1-.2-4 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.2.4-2.3 1-3.2.3 1.6 1.2 2.7 2.5 2.7z"/>',
users:'<circle cx="9" cy="7" r="4"/><path d="M3 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2M16 3.1a4 4 0 0 1 0 7.8M21 21v-2a4 4 0 0 0-3-3.9"/>',
user:'<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
};
function ic(n,c=''){ return `<svg class="i ${c}" viewBox="0 0 24 24">${ICONS[n]||''}</svg>`; }
function hydrate(root=document){ root.querySelectorAll('i[data-i]').forEach(el=>{ const t=document.createElement('span'); t.innerHTML=ic(el.dataset.i,el.dataset.c||''); const s=t.firstChild; if(el.getAttribute('style')) s.setAttribute('style',el.getAttribute('style')); el.replaceWith(s); }); }

/* ================= LOGO ================= */
function logoSVG(){ return `<svg viewBox="0 0 120 120" width="100%" height="100%"><defs><linearGradient id="lgl" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ff4d8d"/><stop offset="1" stop-color="#c026d3"/></linearGradient><linearGradient id="lgr" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#a855f7"/><stop offset="1" stop-color="#6366f1"/></linearGradient></defs>
<g class="hl"><path d="M58 104 C40 92 14 74 14 46 C14 30 26 20 38 20 C48 20 55 26 58 32 Z" fill="url(#lgl)"/></g>
<g class="hr"><path d="M62 104 C80 92 106 74 106 46 C106 30 94 20 82 20 C72 20 65 26 62 32 Z" fill="url(#lgr)"/></g>
<path d="M30 40 Q34 32 42 31" stroke="rgba(255,255,255,.6)" stroke-width="4" fill="none" stroke-linecap="round"/></svg>`; }

Object.assign(ICONS,{
target:'<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>',
ball:'<circle cx="12" cy="12" r="10"/><path d="M12 2v20M2 12h20M4.9 4.9c3.1 3.1 3.1 11.1 0 14.2M19.1 4.9c-3.1 3.1-3.1 11.1 0 14.2"/>',
puck:'<ellipse cx="12" cy="9" rx="9" ry="4"/><path d="M3 9v5c0 2.2 4 4 9 4s9-1.8 9-4V9"/>',
grid:'<path d="M9 3v18M15 3v18M3 9h18M3 15h18"/>',
cards:'<rect x="2" y="5" width="13" height="17" rx="2"/><path d="M8 2h11a2 2 0 0 1 2 2v14"/>'
});
ICONS.shuffle='<path d="M16 3h5v5M4 20 21 3M21 16v5h-5M15 15l6 6M4 4l5 5"/>';
function heartSVG(col,sz){ return `<svg viewBox="0 0 24 24" width="${sz}" height="${sz}"><path d="${HEART}" fill="${col}"/></svg>`; }
ICONS.edit='<path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>';
ICONS.calendar='<rect x="3" y="4" width="18" height="18" rx="3"/><path d="M16 2v4M8 2v4M3 10h18"/>';
