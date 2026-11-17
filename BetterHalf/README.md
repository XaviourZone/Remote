# Better Half 💞

A private app for two people. It has chat, voice and video calls, live touches, synced games and shared calendars. Everything you send is **end-to-end encrypted**, and your chat history lives **only on your two phones**.

One web app runs everywhere:

| | How you get it |
|---|---|
| **Android** | Download `BetterHalf.apk` from the [betterhalf-latest release](https://github.com/XaviourZone/Remote/releases/tag/betterhalf-latest) and install it |
| **iPhone** | Open the app link in **Safari** → Share → **Add to Home Screen** → open it from the new icon |
| **Try both phones on a computer** | Open [`web/demo.html`](web/demo.html): two phones side by side that really sync with each other |

## What's inside

- **Sign-in and pairing:** Google sign-in → name and gender → full-body avatar → invite code or QR → safety number check → permissions. If the app is closed, it reopens where you left off.
- **Home, "Our Room":** both avatars in an animated room. React with hug, kiss, cuddle, "love you", high five, dance, poke, wave or gift, and your partner's avatar does it on their phone. If they're offline, it's queued and replayed when they come back ("While you were away"). Quick access to Thumb Kiss, Nudge, Walkie-Talkie and Love Jar.
- **Chat:** text, voice notes, photos, avatar stickers, reactions, reply, delete for both, secret messages (they vanish after being read), effects, location, wallpapers, delivered and read ticks, a typing indicator.
- **Calls:** voice and video, phone to phone (WebRTC), with mute, speaker, camera on/off and flip.
- **Touch:** Hold Together (live), Kiss Print, Screen Surprise, Shooting Star and Love Taps. Each one shows up on your partner's screen.
- **Play:** Carom (each shot plays out on both phones), Hoops (beat each other's best score), Air Hockey (live, or against a bot if your partner isn't on that screen), Tic-Tac-Toe (Classic, Infinite or 5×5), Memory Match, and **Ask Me** (you write 3-option questions for each other, with a "how well you know each other" score). Game invites and "your turn" notifications included.
- **Plans:** **his and her calendars** with sticky notes for each day (you can only edit your own), **Love Goals**, and **Routines** that repeat on chosen days, ring as alarms, save drafts automatically, and notify your partner when one of you marks them done.
- **Love Jar:** notes that are open, unlock at a date and time, or need a password (the note is encrypted with that password).

## Test mode vs real phones

Out of the box, the app runs in **test mode**: the two phones in `demo.html` sync through your browser. To use it on two real phones, connect it to a free Firebase project.

### Connect Firebase (about 15 minutes, free)

1. Go to **console.firebase.google.com** → **Add project** (Google Analytics not needed).
2. **Build → Authentication → Get started → Sign-in method → Google → Enable.**
   Under **Settings → Authorized domains**, add `xaviourzone.github.io`.
3. **Build → Realtime Database → Create database** (pick the closest region) → start in **locked mode**.
   Open the **Rules** tab and paste the contents of [`firebase/database.rules.json`](firebase/database.rules.json) → **Publish**.
4. **Project settings → General → Your apps → Web (</>)** → register the app → copy the `firebaseConfig` object.
5. Paste it into [`web/firebase-config.js`](web/firebase-config.js) as `window.BH_FIREBASE = {…}`.
6. *(Notifications while the app is closed)* **Project settings → Cloud Messaging → Web Push certificates → Generate key pair**, then paste the key as `window.BH_VAPID = "…"`.
   Deploy the small function in [`firebase/functions`](firebase/functions) with `firebase deploy --only functions`. This needs the Blaze plan, but stays inside the free allowance for two people.

The web config is not a secret. The database rules make sure only the two of you can read your couple's data, and the contents are end-to-end encrypted anyway.

## Publishing (one-time)

1. Merge the `better-half` branch into `main`.
2. Repo **Settings → Pages → Source: GitHub Actions**. The **Better Half – publish web app** workflow then publishes `web/` to `https://xaviourzone.github.io/Remote/`.
3. The **Better Half – build Android APK** workflow builds the APK and attaches it to the `betterhalf-latest` release.
   - Optional: to keep the same signature between updates, add the secrets `SIGNING_KEYSTORE_BASE64`, `SIGNING_STORE_PASSWORD`, `SIGNING_KEY_ALIAS` and `SIGNING_KEY_PASSWORD`. These are the same secret names as universal-remote, so the same key works.
   - Optional: to hide the small address bar at the top of the Android app, create a repo named **XaviourZone.github.io** containing `.well-known/assetlinks.json`, using the SHA-256 fingerprint printed by the build.

## iPhone notes

- Web notifications on iPhone need iOS 16.4 or newer, and only work after **Add to Home Screen**. The app shows these steps during setup.
- iPhones don't allow web apps to vibrate, so touches show on screen and play a sound but don't buzz.
- When the app is closed, a call arrives as a notification rather than a full-screen ringing screen.
- A native iPhone app would need the Apple Developer Program (US$99/year) and a Mac. The web app avoids both.

## How the data is kept

- **On each phone (local storage):** chat history, photos, voice notes, wallpaper, drafts.
- **In Firebase, encrypted:** a short-lived inbox (each item is deleted as soon as the partner's phone receives it), shared state (calendars, goals, routines, jar notes, game boards), presence and live game positions.
- **Keys:** each phone creates its own key pair. The two phones agree on a shared key (ECDH P-256 → AES-GCM). The safety number lets you confirm both phones have the same key.

## Files

```
web/            the app (PWA): index.html, css/, js/, sw.js, manifest, icons/
web/demo.html   two-phone test page
firebase/       database rules + optional push-notification function
android/        Android wrapper (Trusted Web Activity) built by GitHub Actions
```
