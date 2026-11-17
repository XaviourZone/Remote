/* Optional: wakes your partner's phone when the app is closed.
   Needs the Firebase Blaze plan (it stays inside the free allowance for two people).
   Message contents stay end-to-end encrypted; only a short label like "New message" is pushed. */
const { onValueCreated } = require('firebase-functions/v2/database');
const admin = require('firebase-admin');
admin.initializeApp();

const LABELS = {
  msg: ['💬 New message', 'Open Better Half to read it', 'chat'],
  photo: ['📷 New photo', 'Open to see it', 'chat'],
  voice: ['🎤 Voice message', 'Open to listen', 'chat'],
  secret: ['🔒 Secret message', 'Open to reveal it', 'chat'],
  nudge: ['👉 You got nudged!', 'Tap to nudge back', 'chat'],
  touch: ['💗 Your partner reached out', 'Open Better Half', 'home'],
  walkie: ['📻 Walkie-talkie message', 'Tap to listen', 'walkie'],
  call: ['📞 Incoming call', 'Tap to answer', 'home'],
  game: ['🎮 Your turn', 'Your partner is waiting for you', 'play'],
  notice: ['💞 Something new', 'Open Better Half', 'home'],
};
exports.pushToPartner = onValueCreated('/couples/{cid}/inbox/{uid}/{id}', async (event) => {
  const ev = event.data.val() || {};
  if (['rtc', 'delivered', 'read', 'typing', 'msgReact'].includes(ev.kind || ev.type)) return;
  const [title, body, target] = LABELS[ev.kind] || LABELS[ev.type] || LABELS.notice;
  const toks = (await admin.database().ref('tokens/' + event.params.uid).get()).val() || {};
  const tokens = Object.keys(toks);
  if (!tokens.length) return;
  const res = await admin.messaging().sendEachForMulticast({
    tokens,
    notification: { title, body },
    data: { kind: String(ev.kind || ev.type || ''), target },
    webpush: { headers: { Urgency: ev.kind === 'call' ? 'high' : 'normal' }, notification: { icon: 'icons/icon-192.png', badge: 'icons/icon-96.png', tag: String(ev.kind || 'bh') } },
  });
  res.responses.forEach((r, i) => { if (!r.success && /registration-token-not-registered|invalid-argument/.test(r.error && r.error.code)) admin.database().ref('tokens/' + event.params.uid + '/' + Object.keys(toks)[i]).remove(); });
});
