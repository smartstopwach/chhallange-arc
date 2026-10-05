(() => {
  'use strict';

  const installButton = document.getElementById('install-app-button');
  let deferredInstallPrompt = null;
  const alreadyInstalled = window.matchMedia('(display-mode: standalone)').matches
    || Boolean(typeof navigator !== 'undefined' && navigator.standalone);

  if (installButton) {
    installButton.hidden = true;
    installButton.addEventListener('click', async () => {
      if (!deferredInstallPrompt) return;
      const promptEvent = deferredInstallPrompt;
      deferredInstallPrompt = null;
      installButton.disabled = true;
      try {
        await promptEvent.prompt();
        await promptEvent.userChoice;
      } catch (error) {
        console.warn('Daymark could not open the install prompt.', error);
      } finally {
        installButton.disabled = false;
        installButton.hidden = true;
      }
    });
  }

  window.addEventListener('beforeinstallprompt', (event) => {
    if (alreadyInstalled) return;
    event.preventDefault();
    deferredInstallPrompt = event;
    if (installButton) installButton.hidden = false;
  });

  window.addEventListener('appinstalled', () => {
    deferredInstallPrompt = null;
    if (installButton) installButton.hidden = true;
  });

  if (window.isSecureContext && typeof navigator !== 'undefined' && navigator.serviceWorker) {
    navigator.serviceWorker.register('./sw.js').catch((error) => {
      console.warn('Daymark offline support could not be enabled.', error);
    });
  }
})();
