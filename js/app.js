if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js')
  .then((registration) => console.log('Service worker registered. ', { registration }))
  .catch((error) => console.error('Service worker not registered. ', { error }));
}