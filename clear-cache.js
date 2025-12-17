// Run this in browser console to clear cache
// Press F12, go to Console tab, paste this and press Enter

// Clear localStorage
localStorage.clear();

// Clear sessionStorage
sessionStorage.clear();

// Unregister service workers
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.getRegistrations().then(function (registrations) {
    for (let registration of registrations) {
      registration.unregister();
    }
  });
}

// Clear cache storage
if ("caches" in window) {
  caches.keys().then(function (cacheNames) {
    cacheNames.forEach(function (cacheName) {
      caches.delete(cacheName);
    });
  });
}

console.log(
  "Cache cleared! Please hard refresh the page (Ctrl+Shift+R or Ctrl+F5)"
);
