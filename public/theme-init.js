/* Runs before styles so the paper shell has the right light on its first paint. */
(() => {
  'use strict';
  const valid = value => value === 'night' || value === 'cream';
  const apply = (value, target = document) => {
    const theme = valid(value) ? value : 'night';
    target.documentElement.dataset.theme = theme;
    target.documentElement.dataset.roomTheme = theme;
    const meta = target.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', theme === 'night' ? '#080d1b' : '#f7efe9');
    return theme;
  };
  let theme;
  try {
    if (window.parent !== window && window.parent.location.origin === location.origin) {
      const inherited = window.parent.document.documentElement.dataset.theme;
      if (valid(inherited)) theme = inherited;
    }
  } catch {}
  if (!theme) {
    try {
      const saved = localStorage.getItem('goodnight-nook:theme');
      if (valid(saved)) theme = saved;
    } catch {}
  }
  window.nookTheme = Object.freeze({ apply });
  apply(theme || 'night');
  // Also covers a reused initializer placed before the theme-color meta tag.
  document.addEventListener('DOMContentLoaded', () => apply(document.documentElement.dataset.theme), { once: true });
})();
