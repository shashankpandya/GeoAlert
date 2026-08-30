if ('serviceWorker' in navigator) {
  window.addEventListener('load', function() {
    navigator.serviceWorker.register('/sw.js').then(
      function(reg) { console.log('[GeoAlert SW] registered:', reg.scope); },
      function(err) { console.warn('[GeoAlert SW] registration failed:', err); }
    );
  });
}
