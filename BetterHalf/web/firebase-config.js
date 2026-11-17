/* Paste your Firebase web config here to switch Better Half from test mode to real phones.
   Firebase console → Project settings → Your apps → Web app → "SDK setup and configuration" → Config.
   Leave it as null to run in test mode. See BetterHalf/README.md for the full setup. */
window.BH_FIREBASE = null;
/* e.g.
window.BH_FIREBASE = {
  apiKey: "…",
  authDomain: "your-project.firebaseapp.com",
  databaseURL: "https://your-project-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "your-project",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "…",
  appId: "…"
};
*/
/* Web push key: Firebase console → Project settings → Cloud Messaging → Web Push certificates → Key pair */
window.BH_VAPID = null;
/* Optional TURN server for calls on strict mobile networks, e.g. [{urls:'turn:your.turn:3478',username:'u',credential:'p'}] */
window.BH_TURN = [];
