const localTz = Intl.DateTimeFormat().resolvedOptions().timeZone;

let _clocks      = [];
let _tickTimeout = null;
let _tickInterval = null;

function formatTime(tz) {
  return new Intl.DateTimeFormat('en-US', {
    hour: 'numeric', minute: '2-digit', hour12: true, timeZone: tz,
  }).format(new Date()).toLowerCase().replace(':00', '');
}

function renderClocks(clocks) {
  const bar = document.getElementById('clock-bar');
  bar.innerHTML = '';

  for (const { city, tz } of clocks) {
    if (!city || !tz) continue;
    const isLocal = tz === localTz;

    const item = document.createElement('div');
    item.className = 'clock-item' + (isLocal ? ' clock-item--local' : '');
    item.setAttribute('role', 'listitem');

    const cityEl = document.createElement('span');
    cityEl.className   = 'clock-city';
    cityEl.textContent = city;

    const timeEl = document.createElement('time');
    timeEl.className   = 'clock-time';
    timeEl.textContent = formatTime(tz);

    item.appendChild(cityEl);
    item.appendChild(timeEl);
    bar.appendChild(item);
  }
}

function startTicker() {
  if (_tickTimeout)  clearTimeout(_tickTimeout);
  if (_tickInterval) clearInterval(_tickInterval);

  const now = new Date();
  const msUntilNextMinute = (60 - now.getSeconds()) * 1000 - now.getMilliseconds();
  _tickTimeout = setTimeout(() => {
    renderClocks(_clocks);
    _tickInterval = setInterval(() => renderClocks(_clocks), 60_000);
  }, msUntilNextMinute);
}

function initClocks(clocks) {
  _clocks = clocks;
  renderClocks(_clocks);
  startTicker();
}

function reloadClocks(clocks) {
  initClocks(clocks);
}

window.reloadClocks = reloadClocks;
