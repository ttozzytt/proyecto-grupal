(() => {
  'use strict';
  const status = document.getElementById('entryNetworkStatus');
  if (!status) return;
  const label = status.querySelector('b');
  function updateNetwork() {
    const online = navigator.onLine;
    status.dataset.state = online ? 'online' : 'offline';
    label.textContent = online ? 'Conexión disponible' : 'Sin conexión · modo local';
  }
  window.addEventListener('online', updateNetwork);
  window.addEventListener('offline', updateNetwork);
  updateNetwork();
  if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./sw.js')
        .then(registration => console.info('PWA lista. Alcance:', registration.scope))
        .catch(error => console.warn('No se pudo registrar el Service Worker:', error));
    }, { once: true });
  }
})();
