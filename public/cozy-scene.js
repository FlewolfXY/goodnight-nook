/* Observe the original scene's own sleep control without changing its behavior. */
(() => {
  'use strict';

  const sleepButton = document.querySelector('button[data-action="sleep"]');
  const siteOrigin = location.origin;
  let lastSleeping;

  function readSleeping() {
    if (!sleepButton) return false;
    const pressed = sleepButton.getAttribute('aria-pressed');
    if (pressed !== null) return pressed === 'true';
    return sleepButton.textContent.includes('再掖一下被角');
  }

  function reportSleeping(force = false) {
    const sleeping = readSleeping();
    document.documentElement.dataset.sleeping = String(sleeping);
    if (!force && sleeping === lastSleeping) return;
    if (window.parent === window && sleeping && sleeping !== lastSleeping) {
      window.nookTheme?.apply('night');
    }
    lastSleeping = sleeping;
    if (window.parent !== window) {
      window.parent.postMessage({ type: 'nook-sleep', sleeping }, siteOrigin);
    }
  }

  if (sleepButton) {
    new MutationObserver(() => reportSleeping()).observe(sleepButton, {
      attributes: true,
      attributeFilter: ['aria-pressed'],
      childList: true,
      subtree: true,
      characterData: true,
    });
  }

  window.addEventListener('message', (event) => {
    if (event.origin !== siteOrigin || event.source !== window.parent) return;
    if (event.data && event.data.type === 'nook-state-request') {
      reportSleeping(true);
    }
  });

  reportSleeping();
})();
