# mechanical-watch-ui

A single-page web app for setting mechanical wristwatches accurately. Pure vanilla HTML/CSS/JS — no build step, no dependencies.

## Features

- **Analog and digital views** with a toggle to switch between them
- **Network time sync** against Cloudflare (with TimeAPI as fallback) so the displayed time is closer to true than the device clock
- **Per-second beep** to help you set the seconds hand precisely (mutable)
- **Night mode** for low-light setting
- **GMT complication** — pick any IANA timezone and a 24-hour ring + GMT hand show that zone's time alongside local
- **Moon phase** complication, computed from a known new moon epoch
- **Leap year indicator** showing the current year's position in the 4-year cycle
- **Centiseconds** readout in the digital view
- UI state (view, night mode, mute, GMT zone) persists across reloads

## Run it

Open [index.html](index.html) directly in a browser. There is no install or build step.

## Files

- [index.html](index.html) — markup
- [styles.css](styles.css) — styling, including night mode
- [script.js](script.js) — clock loop, time sync, complications, GMT

## For LLM agents

See [AGENTS.md](AGENTS.md) for architecture notes and conventions.

## License

See [LICENSE](LICENSE).
