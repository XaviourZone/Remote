# Better Half 💞

A private app for two people: you and your partner. Chat, calls, touch features, games and shared plans. Everything is end-to-end encrypted and stored **only on your two phones**.

> **Status:** design prototype (v3). Open [`prototype/index.html`](prototype/index.html) in any browser to try every screen. The Android app (Flutter) is built after the design is finalised.

## Features in the prototype

| Area | What's in it |
|---|---|
| **Onboarding** | Google sign-in → name and pet name → avatar builder → invite by WhatsApp, SMS or link, or connect with a QR / 6-digit code. You both get a notification at each step. |
| **Home** | Both avatars, online status, one-tap chat / voice call / video call, quick touches, together-since and anniversary counters, next routine, Ask Me, Love Jar |
| **Chat** | Text, voice notes (hold the mic), photos, avatar stickers, reactions, reply, delete for both, secret messages, send effects, kiss prints, location, chat wallpapers |
| **Calls** | Voice and video calls, phone to phone (WebRTC), with full-screen ringing |
| **Touch** | Our Room (shared avatar room: hug, kiss, high five, dance, cuddle, poke, wave, gift), Thumb Kiss, Nudge, Hold Together, Walkie-Talkie, Kiss Print, Screen Surprise, Love Taps, Shooting Star |
| **Play** | Carom (real physics), Hoops (basketball), Air Hockey, Tic-Tac-Toe (Classic / Infinite / 5×5), Memory Match, Ask Me (you write questions for each other) |
| **Plans** | Love Goals (shared to-dos, no deadline) and Routines (repeat on chosen days, with alarms on both phones and a "done" notification) |
| **Love Jar** | Notes that are open, unlock at a date and time, or need a password |
| **Settings** | Each partner's own dates, notification channels, app lock, encrypted backup to your own Google Drive, safety number |

## How it works (no server keeps your data)

- **Google sign-in** (Firebase Auth) only proves who you are.
- Messages are **encrypted on the phone** (X25519 + XChaCha20-Poly1305). Firebase passes on the sealed envelope and **deletes it once it's delivered**.
- **Calls and the walkie-talkie** go directly phone to phone (WebRTC). A small TURN relay is used only when a mobile network blocks a direct connection.
- **Notifications:** Firebase Cloud Messaging wakes the other phone for messages, touches, game turns, alarms and calls.
- History, photos, goals and routines live in an encrypted database **on each phone**.

## Planned tech stack

Flutter 3 · Riverpod · drift + SQLCipher · cryptography · firebase_auth + google_sign_in · cloud_firestore / firebase_database / firebase_messaging · flutter_webrtc · flutter_local_notifications + android_alarm_manager_plus · vibration

## Installing on Android

When the app is built, the APK goes on this repo's **Releases** page. On the phone: download the APK → open it → allow "Install unknown apps" for your browser → Install. Do this on both phones.

## What about iPhone?

The same Flutter code also builds for iPhone, but Apple makes installing outside the App Store harder:

| Option | Cost | What you get |
|---|---|---|
| **Free Apple ID + a Mac with Xcode** | Free | Installs on your own iPhone, but the app **stops opening after 7 days** until you reinstall it from the Mac. **Push notifications don't work** on a free account, so nudges and calls only arrive while the app is open. |
| **Apple Developer Program** | US$99 / year | Installs last 1 year, push notifications work, and you can use **TestFlight** to send the app to her iPhone with a link. This is the recommended choice if either of you uses an iPhone. |
| **No Mac?** | — | A cloud build service (e.g. Codemagic) can build the iPhone version, but you still need the Apple Developer Program to install it. |

**Recommendation:** if you both use Android, no Apple account is needed. If one of you uses an iPhone, join the Apple Developer Program and install through TestFlight.

## Roadmap

1. **Foundation:** Google login, invite + pairing, encryption, chat, notifications
2. **Feel close:** Touch tab, avatars, Our Room, voice and video calls, walkie-talkie
3. **Play:** Carom, Hoops, Air Hockey, Tic-Tac-Toe, Memory Match, Ask Me
4. **Plans and polish:** goals, routines and alarms, Love Jar, backup, app lock, home-screen widget, release APK
