(function () {
  const panel   = document.getElementById('sp-panel');
  const overlay = document.getElementById('sp-overlay');

  let themeOnOpen  = 'auto';
  let _calendarList = []; // { id, name }[] — populated when panel opens

  function open(settings) {
    themeOnOpen = settings.theme || 'auto';
    document.getElementById('sp-linear-key').value = settings.linearApiKey || '';
    document.querySelectorAll('.sp-swatch').forEach(s => s.classList.remove('is-active'));
    const autoChk = document.getElementById('sp-theme-auto');
    if (themeOnOpen === 'auto') {
      autoChk.checked = true;
    } else {
      autoChk.checked = false;
      const swatch = document.querySelector(`.sp-swatch[data-theme="${themeOnOpen}"]`);
      if (swatch) swatch.classList.add('is-active');
    }
    renderClockRows(settings.clocks || []);
    panel.classList.add('is-open');
    overlay.classList.add('is-open');
    panel.removeAttribute('aria-hidden');
  }

  function close() {
    applyTheme(themeOnOpen);
    panel.classList.remove('is-open');
    overlay.classList.remove('is-open');
    panel.setAttribute('aria-hidden', 'true');
  }

  function renderClockRows(clocks) {
    const container = document.getElementById('sp-clocks');
    container.innerHTML = '';
    clocks.forEach((clock, i) => {
      const row = document.createElement('div');
      row.className = 'sp-clock-row';

      const cityInput = document.createElement('input');
      cityInput.className     = 'sp-input';
      cityInput.value         = clock.city;
      cityInput.placeholder   = 'City';
      cityInput.dataset.field = 'city';

      const tzInput = document.createElement('input');
      tzInput.className     = 'sp-input';
      tzInput.value         = clock.tz;
      tzInput.placeholder   = 'America/New_York';
      tzInput.dataset.field = 'tz';

      const removeBtn = document.createElement('button');
      removeBtn.className   = 'sp-remove';
      removeBtn.type        = 'button';
      removeBtn.textContent = '×';
      removeBtn.addEventListener('click', () => {
        const rows = readClockRows();
        rows.splice(i, 1);
        renderClockRows(rows);
      });

      row.append(cityInput, tzInput, removeBtn);
      container.appendChild(row);
    });
  }

  function readClockRows() {
    return Array.from(document.querySelectorAll('.sp-clock-row')).map(row => ({
      city: row.querySelector('[data-field="city"]').value.trim(),
      tz:   row.querySelector('[data-field="tz"]').value.trim(),
    }));
  }

  function readSelectedCalendars() {
    const checkboxes = document.querySelectorAll('.sp-cal-checkbox');
    if (checkboxes.length === 0) return null;
    const checked = Array.from(checkboxes).filter(cb => cb.checked).map(cb => cb.dataset.id);
    return checked.length === _calendarList.length ? null : checked;
  }

  async function renderCalendarSection(selectedCalendars, connected = false) {
    const container = document.getElementById('sp-calendars');
    container.innerHTML = '';
    _calendarList = [];

    const btn = document.createElement('button');
    btn.className   = 'sp-cal-action';
    btn.textContent = connected ? 'Disconnect' : 'Connect Google Calendar →';

    btn.addEventListener('click', async () => {
      btn.disabled = true;
      if (connected) {
        btn.textContent = 'Disconnecting…';
        await clearCalendarToken('personal');
        const s = await loadSettings();
        await saveSettings({ ...s, calendarConnected: false, selectedCalendars: null });
        renderCalendarSection(null, false);
        initCalendar();
      } else {
        btn.textContent = 'Connecting…';
        await clearCalendarToken('personal'); // clear stale cache so Chrome shows the consent screen
        const tok = await getCalendarToken('personal', true);
        if (!tok) {
          btn.disabled = false;
          btn.textContent = 'Connect Google Calendar →';
          return;
        }
        const s = await loadSettings();
        await saveSettings({ ...s, calendarConnected: true });
        renderCalendarSection(s.selectedCalendars, true);
        initCalendar();
      }
    });

    container.appendChild(btn);

    if (!connected) return;

    const token = await getCalendarToken('personal', false);
    if (!token) return;

    // Calendar checkboxes
    const loading = document.createElement('p');
    loading.className   = 'sp-loading';
    loading.textContent = 'Loading calendars…';
    container.appendChild(loading);

    try {
      _calendarList = await fetchCalendarList(token);
    } catch (e) {
      loading.remove();
      return;
    }
    loading.remove();

    const checks = document.createElement('div');
    checks.className = 'sp-cal-checks';

    for (const cal of _calendarList) {
      const isChecked = selectedCalendars === null || selectedCalendars.includes(cal.id);

      const label = document.createElement('label');
      label.className = 'sp-cal-check-row';

      const checkbox = document.createElement('input');
      checkbox.type      = 'checkbox';
      checkbox.className = 'sp-cal-checkbox';
      checkbox.checked   = isChecked;
      checkbox.dataset.id = cal.id;

      const calName = document.createElement('span');
      calName.className   = 'sp-cal-check-name';
      calName.textContent = cal.name;

      label.append(checkbox, calName);
      checks.appendChild(label);
    }

    container.appendChild(checks);
  }

  document.querySelectorAll('.sp-swatch').forEach(s => {
    s.addEventListener('click', () => {
      document.querySelectorAll('.sp-swatch').forEach(x => x.classList.remove('is-active'));
      s.classList.add('is-active');
      document.getElementById('sp-theme-auto').checked = false;
      applyTheme(s.dataset.theme);
    });
  });

  document.getElementById('sp-theme-auto').addEventListener('change', e => {
    if (e.target.checked) {
      document.querySelectorAll('.sp-swatch').forEach(s => s.classList.remove('is-active'));
      applyTheme('auto');
    }
  });

  document.getElementById('sp-add-clock').addEventListener('click', () => {
    const rows = readClockRows();
    rows.push({ city: '', tz: '' });
    renderClockRows(rows);
  });

  document.getElementById('sp-close').addEventListener('click', close);
  overlay.addEventListener('click', close);

  document.getElementById('sp-save').addEventListener('click', async () => {
    const btn = document.getElementById('sp-save');
    btn.textContent = 'Saving…';
    btn.disabled = true;

    const s = {
      linearApiKey:      document.getElementById('sp-linear-key').value.trim(),
      theme:             document.getElementById('sp-theme-auto').checked
                           ? 'auto'
                           : document.querySelector('.sp-swatch.is-active')?.dataset.theme || 'auto',
      clocks:            readClockRows().filter(c => c.tz),
      selectedCalendars: readSelectedCalendars(),
    };

    await saveSettings(s);
    themeOnOpen = s.theme;
    reloadClocks(s.clocks);
    reloadLinear(s.linearApiKey);
    initCalendar();

    btn.textContent = 'Save';
    btn.disabled = false;
    close();
  });

  document.getElementById('settings-btn').addEventListener('click', async () => {
    const settings = await loadSettings();
    open(settings);
    renderCalendarSection(settings.selectedCalendars, settings.calendarConnected || false);
  });
})();
