(function () {
  const root       = document.getElementById('root');
  const DARK_POOL  = ['dark', 'dark-warm', 'dark-blue', 'dark-red'];
  const LIGHT_POOL = ['light', 'warm', 'blue', 'red'];
  let currentSetting = 'auto';

  function applySystemTheme(isLight) {
    const pool = isLight ? LIGHT_POOL : DARK_POOL;
    root.dataset.theme = pool[Math.floor(Math.random() * pool.length)];
  }

  function applyTheme(setting) {
    currentSetting = setting;
    if (setting === 'auto') {
      applySystemTheme(window.matchMedia('(prefers-color-scheme: light)').matches);
    } else {
      root.dataset.theme = setting;
    }
  }

  function initTheme(setting = 'auto') {
    currentSetting = setting;
    const mq = window.matchMedia('(prefers-color-scheme: light)');
    mq.addEventListener('change', e => {
      if (currentSetting === 'auto') applySystemTheme(e.matches);
    });
    if (setting === 'auto') {
      applySystemTheme(mq.matches);
    } else {
      root.dataset.theme = setting;
    }
  }

  window.initTheme  = initTheme;
  window.applyTheme = applyTheme;
})();
