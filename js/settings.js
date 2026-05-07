const SETTINGS_KEY = 'harmonograph_settings';

const DEFAULT_SETTINGS = {
  linearApiKey:      '',
  theme:             'auto',
  calendarConnected: false,
  selectedCalendars: null, // null = all, array of IDs = specific ones
  clocks: [
    { city: 'Auckland',    tz: 'Pacific/Auckland' },
    { city: 'Los Angeles', tz: 'America/Los_Angeles' },
    { city: 'Santa Fe',    tz: 'America/Denver' },
    { city: 'St. Louis',   tz: 'America/Chicago' },
  ],
};

async function loadSettings() {
  const result = await chrome.storage.local.get(SETTINGS_KEY);
  return { ...DEFAULT_SETTINGS, ...(result[SETTINGS_KEY] || {}) };
}

async function saveSettings(settings) {
  await chrome.storage.local.set({ [SETTINGS_KEY]: settings });
}
