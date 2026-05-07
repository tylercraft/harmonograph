async function init() {
  const settings = await loadSettings();

  initTheme(settings.theme);
  initClocks(settings.clocks);

  if (CONFIG.stub) {
    renderCalendar(STUB_CALENDAR, []);
    renderTasks(STUB_TASKS);
    return;
  }

  await Promise.allSettled([
    initCalendar(),
    initLinear(settings.linearApiKey),
  ]);

  setInterval(() => initCalendar(true), 15 * 60 * 1000);
  setInterval(async () => {
    const s = await loadSettings();
    initLinear(s.linearApiKey, true);
  }, 15 * 60 * 1000);
}

document.addEventListener('DOMContentLoaded', init);
