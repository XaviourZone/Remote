# Universal Remote (Android)

Use your phone's IR blaster (e.g. Vivo X200 Pro, Xiaomi, Redmi, POCO, Honor, Huawei) as a remote for almost any IR device.

**Download:** [UniversalRemote.apk](https://github.com/XaviourZone/Remote/releases/latest/download/UniversalRemote.apk) (always the newest build)

## What it does

- **Online code library** – about 8,900 remotes from 1,600+ brands (the community [Flipper-IRDB](https://github.com/Lucaslhm/Flipper-IRDB)). TVs, ACs, set-top boxes, fans, projectors, soundbars, AV receivers, LED lights, heaters, purifiers, cameras and more. The index is refreshed weekly by a GitHub Action, and each remote is downloaded only when you open it.
- **Auto-detect** – don't know the model? The app sends POWER (or Vol+, Mute, Ch+) from each candidate remote and you tap *Yes* when the device reacts. Includes hands-free auto-scan and *Scan all brands*.
- **Smart AC remote** – full temperature, mode, fan, swing and turbo control generated from the AC protocol itself (Kelvinator, Gree, Coolix/Midea family, Midea, Voltas), so it also works for ACs that aren't in the library.
- **Smart layout** – power, input, D-pad, volume and channel rockers, and a number pad are arranged automatically for any remote. Volume, channel and arrow keys repeat while you hold them.
- **Fix a single button** – if one key doesn't work, the app tries the same key from other remotes of the brand.
- **Bring your own codes** – import `.ir` files from the phone or any web link (GitHub links work), or type a Pronto hex, raw timings or a protocol + address + command.
- **Offline mode** – download the whole library once (about 30 MB) and auto-detect works without internet.
- Share and export remotes as Flipper `.ir` files.

## Install

1. Open the download link above on your phone.
2. Allow *Install unknown apps* for your browser when Android asks.
3. Open **Universal Remote** → **Add remote**.

Builds are signed with a fixed sideload key, so each new APK installs over the previous one and keeps your saved remotes.

## How it works

| Part | File |
|---|---|
| IR protocols (NEC, NECext, NEC42, Samsung32, RC5/RC5X, RC6, Sony SIRC 12/15/20, Kaseikyo/Panasonic, RCA, Pioneer, raw, Pronto) | `app/src/main/java/.../ir/IrEncoders.kt`, `IrSignal.kt` |
| AC protocols | `ir/AcProtocols.kt` (ported from IRremoteESP8266, verified against its test vectors) |
| Online library, cache, offline download | `data/IrRepository.kt`, `data/RemoteIndex.kt` |
| Library index builder | `tools/build_index.py` → `database/index.json` |
| Build and release | `.github/workflows/universal-remote-build.yml` |

Build locally with `./gradlew assembleRelease` (Android SDK required).

## Credits

- Remote codes: [Flipper-IRDB](https://github.com/Lucaslhm/Flipper-IRDB) contributors.
- AC protocol details: [IRremoteESP8266](https://github.com/crankyoldgit/IRremoteESP8266) (LGPL-2.1).
