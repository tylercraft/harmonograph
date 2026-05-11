const CALENDAR_ACCOUNTS = ['personal'];

function todayBounds() {
  const now = new Date();
  const start = now.toISOString();
  const end   = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59).toISOString();
  return { start, end };
}

function formatEventTime(dateTimeStr) {
  if (!dateTimeStr) return '';
  return new Date(dateTimeStr)
    .toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
    .toLowerCase()
    .replace(':00', '');
}

function isNow(start, end) {
  const now = Date.now();
  return new Date(start).getTime() <= now && new Date(end).getTime() >= now;
}

async function fetchCalendarList(token) {
  const res = await fetch(
    'https://www.googleapis.com/calendar/v3/users/me/calendarList?minAccessRole=reader',
    { headers: { Authorization: `Bearer ${token}` } }
  );
  if (!res.ok) throw new Error(`CalendarList API ${res.status}`);
  const data = await res.json();
  return (data.items || []).map(c => ({ id: c.id, name: c.summary || c.id }));
}

async function fetchEventsForCalendar(token, calendarId) {
  const { start, end } = todayBounds();
  const url = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`
    + `?timeMin=${encodeURIComponent(start)}`
    + `&timeMax=${encodeURIComponent(end)}`
    + `&singleEvents=true`
    + `&orderBy=startTime`
    + `&showDeleted=false`;

  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) throw new Error(`Calendar API ${res.status}`);

  const data = await res.json();
  return (data.items || []).map(e => {
    const conferenceLink = e.conferenceData?.entryPoints
      ?.find(ep => ep.entryPointType === 'video')?.uri || null;

    return {
      id:             e.id,
      title:          e.summary || '(No title)',
      start:          e.start?.dateTime || e.start?.date,
      end:            e.end?.dateTime   || e.end?.date,
      current:        isNow(e.start?.dateTime || e.start?.date, e.end?.dateTime || e.end?.date),
      conferenceLink,
    };
  });
}

async function fetchEventsForAccount(accountKey, selectedCalendars = null) {
  const token = await getCalendarToken(accountKey, false);
  if (!token) return null;

  let calendars;
  try {
    calendars = await fetchCalendarList(token);
  } catch (e) {
    if (e.message.includes('401') || e.message.includes('403')) {
      await clearCalendarToken(accountKey);
      return null;
    }
    throw e;
  }

  const idsToFetch = selectedCalendars
    ? calendars.filter(c => selectedCalendars.includes(c.id)).map(c => c.id)
    : calendars.map(c => c.id);

  const results = await Promise.allSettled(
    idsToFetch.map(id => fetchEventsForCalendar(token, id))
  );

  const events = [];
  for (const result of results) {
    if (result.status === 'fulfilled') events.push(...result.value);
  }

  const seen = new Set();
  return events.filter(e => {
    if (seen.has(e.id)) return false;
    seen.add(e.id);
    return true;
  });
}

function buildEventEl(event) {
  const tag = event.conferenceLink ? 'a' : 'span';
  const el  = document.createElement(tag);
  el.className = 'item-link';

  if (event.conferenceLink) {
    el.href   = event.conferenceLink;
    el.target = '_blank';
    el.rel    = 'noopener';
  } else {
    el.style.cursor = 'default';
  }

  const title = document.createElement('span');
  title.className = 'item-title';
  title.textContent = event.title;

  const secondary = document.createElement('span');
  secondary.className = 'item-secondary';
  secondary.setAttribute('aria-label', formatEventTime(event.start));
  secondary.textContent = formatEventTime(event.start);

  title.appendChild(secondary);
  el.appendChild(title);
  return el;
}

function renderCalendar(events, unauthAccounts) {
  const container = document.getElementById('meetings-list');
  const section   = container.closest('section');
  container.innerHTML = '';

  if (unauthAccounts.length > 0 && events.length === 0) {
    section.hidden = true;
    return;
  }

  section.hidden = false;

  if (events.length === 0) {
    container.innerHTML = '<p class="empty-state">Nothing else today</p>';
    return;
  }

  const fragment = document.createDocumentFragment();
  for (const event of events) fragment.appendChild(buildEventEl(event));
  container.appendChild(fragment);
}

async function initCalendar(silent = false) {
  const container = document.getElementById('meetings-list');
  if (!silent) container.innerHTML = '<p class="loading" aria-live="polite">Loading…</p>';

  const settings = await loadSettings();

  if (!settings.calendarConnected) {
    renderCalendar([], ['personal']);
    return;
  }

  const unauthAccounts = [];
  const allEvents      = [];

  for (const accountKey of CALENDAR_ACCOUNTS) {
    try {
      const events = await fetchEventsForAccount(accountKey, settings.selectedCalendars);
      if (events === null) {
        if (settings.calendarConnected) {
          await saveSettings({ ...settings, calendarConnected: false });
        }
        unauthAccounts.push(accountKey);
      } else {
        allEvents.push(...events);
      }
    } catch {
      unauthAccounts.push(accountKey);
    }
  }

  allEvents.sort((a, b) => {
    if (a.current && !b.current) return -1;
    if (!a.current && b.current) return  1;
    return new Date(a.start) - new Date(b.start);
  });

  renderCalendar(allEvents, unauthAccounts);
}

window.fetchCalendarList = fetchCalendarList;
