// service workers can access those files, which are placed in the same folder as sw.js or it's sub-folders

/**
 * Resources:
 * Different caching strategies: https://developers.google.com/web/fundamentals/instant-and-offline/offline-cookbook/
 */


/**
 * LIFECYCLE
 * 1. register service worker - install event [fired only once] - it happens when sw.js file changes. Then we can listen to it and react on it (i.e. cash assets, like images). If we will change the assets, we can for example start numbering cache name or anything else, to start changes in sw.js what will trigger install event.
 * 2. service worker becomes active - active event [fired only once] - once the sw is active it can access all the different pages and assets inside its scope (folder where it's placed)
 * 3. service worker listens for fetch http events (anything we fetch from server - so basically anything that shows up in Network tab of DevTools) - it serves as a proxy between our app and server, therefore can listen to events
 *
 * After installing new version of sw the first time browser will run the old code to not to break anything in the middle (new version sw is in waiting state). It will be launched with next opening/reload
 */


/**
 * HOW TO CACHE SUBPAGES?
 *
 * Do not add everything to one cache. Instead split it to separate caches which will be filled with assets, when user enters such subpage when being online.
 */


// check caches free space
navigator.storage.estimate().then((info) => console.log({storageSpace: info}))

const version = 1;
const versionSuffix = `_v${version}`;
const staticCacheName = `site-static${versionSuffix}` // This is a cache for shell resources and homepage. Versioning is for retriggering install event, but remember to delete old cache version
const dynamicCacheName = `site-dynamic${versionSuffix}` // This is cache, where we will store resources on the fly - so as user enters some subpage we will store the assets from it right in this cache


// assetss are requests urls
// You have to be careful with font caching. Google give you different font files (ttf, eot, woff, ...) depending on OS you are requesting it from. You have to cache them all.
// below assets will be automatically cached at first service-worker run
const assets = [
  '/',
  '/index.html',
  '/js/app.js',
  '/js/ui.js',
  '/js/materialize.min.js',
  '/css/styles.css',
  '/css/materialize.min.css',
  '/img/dish.png',
  'https://fonts.googleapis.com/icon?family=Material+Icons',
  'https://fonts.gstatic.com/s/materialicons/v47/flUhRq6tzZclQEJ-Vdg-IuiaDsNcIhQ8tQ.woff2',
  '/pages/offline-fallback.html'
]

self.addEventListener('install', (installEvent) => {
  /**
   * cache required assets like images, css, js and so on (they shouldn't change much over time)
   **/

  // wait until promise inside is resolved
  installEvent.waitUntil(
    // create a cache or if it exists - it opens it
    caches.open(staticCacheName)
    .then(cache => {
      // cache.add() // adds single item
      cache.addAll(assets) //add multiple resources
    })
    .catch(error => {
      console.error('Caching error ', {error})
    })
  )
})

self.addEventListener('activate', (activateEvent) => {
  activateEvent.waitUntil(
    caches.keys().then(keys => {
      // keys is array of caches names
      return Promise.all(
        keys
          .filter(key => key !== staticCacheName && key !== dynamicCacheName)
          .map(key => caches.delete(key))
      )
    })
  )
})

self.addEventListener('fetch', (fetchEvent) => {
  //respondWith pauses fetch event and allows to replace it with our sources from cache
  // if it matches something that is stored (here in assets const)
  fetchEvent.respondWith(
    caches.match(fetchEvent.request)
    .then(cacheResponse => {
      // if request route matches cached route (one from assets const) return it instead of reaching to a server. Otherwise continue on fetching request from server (the part after pipe)
      return cacheResponse || fetch(fetchEvent.request).then(fetchResponse => {
        // if don't have the resource cached yet, use fetch event response AND cache it! for future
        return caches.open(dynamicCacheName)
          .then(cache => {
            // we already have data from server so we put the resource
            // we will use response clone, as we can use it only once, so if we will cache it - we won't be able to return it to the user, so he will then miss this resource!
            cache.put(fetchEvent.request.url, fetchResponse.clone())
            return fetchResponse
          })
          .catch(error => console.error('fetch dynamic source error: ', error))
      })
    })
    .catch(() => {
      // the point, where we're offline and we don't have required resources in cache
      if(fetchEvent.request.url.indexOf('.html') > -1) {
        // return html fallback only if request was for .html file (so not for image or api call)
        return caches.match('/pages/offline-fallback.html')
      }

      // we can return some fallback for images and so on...
    })
  )
})