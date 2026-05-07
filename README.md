# Harmonograph

A Chrome new tab for developers. Linear tasks, Google Calendar events, and world clocks — nothing else.

**[harmonograph.app](https://harmonograph.app)** — live demo and install link.

---

## Features

- **Meetings** — today's Google Calendar events, with one-click join links
- **Tasks** — Linear issues assigned to you, sorted by state and priority
- **World clocks** — configurable clock bar at the bottom
- **8 themes** — four dark variants (amber, warm, blue, red) and four light variants, plus auto mode that follows your system preference and picks randomly within the matching pool
- **Animated background** — three-layer blurred canvas; path and phase randomised every new tab

---

## Local setup

### 1. Load the extension

1. Open `chrome://extensions`
2. Enable **Developer mode**
3. **Load unpacked** → select this folder
4. Note the extension ID Chrome assigns — you'll need it for Google OAuth

### 2. Set up Google OAuth

The production build uses a registered OAuth client tied to the published extension ID. For local development you'll need your own:

1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Create a project → enable the **Google Calendar API**
3. Credentials → **+ Create Credentials** → **OAuth client ID**
   - If prompted, configure the consent screen first: External, fill in app name and email
   - Application type: **Chrome Extension**
   - Enter the extension ID from `chrome://extensions`
4. Copy the client ID into `manifest.json` under `oauth2.client_id`

### 3. Open a new tab and configure

Click the gear icon (bottom right) to open Settings:

- **Linear** — paste a personal API key (read-only is enough)
- **Calendars** — connect your Google account
- **Clocks** — add cities and IANA timezone strings (e.g. `America/New_York`)
- **Theme** — pick one of the eight swatches or enable Follow system

---

## Stub mode

Set `stub: true` in `config.js` to run with fake data — no API keys required. Useful for UI work.

---

## Zip for the Chrome Web Store

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
