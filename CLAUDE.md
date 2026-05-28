# Harmonograph

A Chrome new tab extension for developers. Linear tasks, Google Calendar events, and world clocks — with an animated harmonograph background.

**Status:** Live on the Chrome Web Store. OAuth verified.

- Extension ID: `jjhoebkocjaeilafnbkafdekbpjgiaoc`
- Marketing site: harmonograph.app (repo: harmonograph-site/)

---

## Architecture

Plain HTML/CSS/JS — no build step, no bundler.

| File | Purpose |
|------|---------|
| `manifest.json` | MV3 manifest. `oauth2.client_id` is the production Google OAuth client. |
| `config.js` | Single flag: `stub: true/false`. Set to `true` for UI work without API keys. |
| `js/app.js` | Entry point. Initialises all modules. |
| `js/settings.js` | Load/save settings via `chrome.storage.local`. Key: `harmonograph_settings`. |
| `js/auth.js` | Google OAuth via `chrome.identity.getAuthToken`. See gotcha below. |
| `js/calendar.js` | Fetches today's Google Calendar events, renders meetings section. |
| `js/linear.js` | Fetches assigned Linear issues, renders tasks section. |
| `js/panel.js` | Settings panel UI — themes, clocks, calendar connect/disconnect, Linear key. |
| `js/theme.js` | Applies theme to `data-theme` on `#root`. Supports auto (system) mode. |
| `js/background.js` | Animated canvas background — 3 blur layers + fog overlay, randomised path per load. |
| `js/clocks.js` | World clock bar at the bottom. |
| `js/stub.js` | Stub data for UI development. Only active when `CONFIG.stub === true`. |

---

## Themes

8 themes total — 4 dark, 4 light. Stored as `data-theme` on `#root`.

| Theme | Background | Tube color |
|-------|-----------|------------|
| `dark` | `#0E0C0A` | Amber |
| `dark-warm` | `#0E0C0A` | Brown |
| `dark-blue` | `#090C14` | Blue |
| `dark-red` | `#120909` | Red |
| `light` | `#FFFCF5` | Amber |
| `warm` | `#FDFAF5` | Brown |
| `blue` | `#F6F8FF` | Blue |
| `red` | `#FFF7F7` | Red |

Auto mode picks randomly from the dark or light pool based on system preference.

---

## Google OAuth

Uses `chrome.identity.getAuthToken` (not `launchWebAuthFlow`). Token caching and refresh are handled by Chrome automatically.

**MV3 gotcha:** `getAuthToken` returns `{ token, grantedScopes }` — not a plain string. Always extract via:
```js
const token = typeof result === 'string' ? result : result?.token;
```
This is already handled in `js/auth.js` via `extractToken()`.

**Local dev:** The production OAuth client is registered to the store extension ID. For local unpacked testing, create a separate OAuth client in Google Cloud Console (Chrome Extension type) with the local extension ID, then swap `oauth2.client_id` in `manifest.json`. Swap back before zipping for the store.

**Scopes:** `https://www.googleapis.com/auth/calendar.readonly`

---

## Settings

Stored in `chrome.storage.local` under `harmonograph_settings`:

```js
{
  linearApiKey:      string,
  theme:             string,   // theme name or 'auto'
  calendarConnected: boolean,  // explicit flag — do not derive from token existence
  selectedCalendars: null | string[], // null = all calendars
  clocks:            { city: string, tz: string }[]
}
```

`calendarConnected` must be saved explicitly. `chrome.identity.getAuthToken` auto-issues tokens for signed-in Chrome users, so token existence cannot be used as a proxy for whether the user has intentionally connected.

---

## Zip for the store

```bash
zip -r harmonograph.zip . \
  --exclude "*.git*" \
  --exclude "scratch/*" \
  --exclude "docs/*" \
  --exclude "*.DS_Store" \
  --exclude "design-state.md" \
  --exclude "README.md" \
  --exclude "config.example.js" \
  --exclude "harmonograph.zip"
```
