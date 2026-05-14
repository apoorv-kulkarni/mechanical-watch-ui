# AGENTS.md

Context for LLM coding agents working on this repo.

## What this is

A single-page web app for setting mechanical wristwatches accurately. Pure vanilla HTML/CSS/JS — no build step, no dependencies, no framework. Open `index.html` directly in a browser.

## Files

- [index.html](index.html) — markup for the analog and digital views, controls bar, and complications
- [styles.css](styles.css) — all styling, including night mode and accent-color rules
- [script.js](script.js) — clock loop, analog rendering, time sync, GMT zone, complications

## Architecture notes

- The update loop runs on `requestAnimationFrame` ([script.js:416](script.js#L416)). DOM lookups are cached once into the `els` object ([script.js:265](script.js#L265)) so the per-frame path stays cheap.
- Time can drift from device clock; "Sync Time" hits Cloudflare's `/cdn-cgi/trace` (text format) with TimeAPI as fallback, then stores `timeOffset` ([script.js:187](script.js#L187)).
- Complications (moon phase, leap year cycle) are throttled to once per day via `lastComplicationDay` ([script.js:159](script.js#L159)).
- Analog ring geometry: 60 markers at 6° each, numerals 12/1…11 at radius 33%, GMT 24h ring inside the numerals at radius 19–24%.
- UI state (night mode, mute, view, GMT zone) persists in `localStorage` and is restored by `applyStoredState` before listeners are wired.
- Asset cache busting is done via `?v=N` query strings on `styles.css` and `script.js` in `index.html` — bump on shipping changes that mobile clients need to pick up.

## Layout

- `body` uses `height: 100svh` (small viewport height) so the layout fits within the visible area on mobile Chrome, which excludes the address bar. Do not change this to `100vh`.
- `padding-bottom` on `body` reserves space for both the fixed GMT container and the fixed complications bar stacked above the progress bar. Adjust it if either element's height or `bottom` offset changes.
- The controls bar is `position: fixed; top: 0`. On mobile (`max-width: 560px`) it becomes a 2-row flex strip: row 1 (Analog/Digital + Night Mode) and row 2 (Mute Beep + Sync Time), separated by a zero-height `.flex-break` div. `padding-top` on `body` must match the controls bar height — currently `90px`.
- The GMT Zone selector is a standalone `position: fixed` pill element (`bottom: 100px`) that sits above the complications bar, not inside the controls bar.

## Conventions

- Vanilla JS only. Don't introduce a bundler, framework, or npm dependencies.
- No build step. Anything added must work by opening `index.html` directly.
- Secondary complications use the accent color and are visually subdued by default — only the active/current state pops.
- Keep the per-frame update path allocation-light; expensive work belongs behind a day/second-change guard.

## Testing

No automated tests. Verify changes by opening `index.html` in a browser and exercising the controls. For mobile, use Chrome DevTools device emulation (iPhone SE at 375px is a good baseline) and bump the `?v=N` cache-bust in [index.html](index.html).
