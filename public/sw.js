self.addEventListener('install', () => {
  console.log('Service Worker installed');
});

self.addEventListener('fetch', () => {
  // Pass through everything, no offline cache for now
});
