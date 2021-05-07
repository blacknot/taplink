//https://getinstance.info/articles/javascript/introduction-to-service-workers/

var url = new URL(self.location);
var version = url.searchParams.get('v');
var CACHE = 'webapp-' + version;

self.addEventListener('install', function(event) {
    event.waitUntil(preCache());
});

self.addEventListener('activate', function(event) {
    event.waitUntil(clearCache());
});

self.addEventListener('fetch', function(event) {
    if (event.request.method === 'GET') {
        event.respondWith(checkCache(event.request));
    }
});

function preCache() {
    return caches.open(CACHE).then(function(cache) {
        return fetch('/s/webapp.cache')
            .then(function(response) {
                return response.json();
            })
            .then(function(assets) {
                return cache.addAll(assets);
            });
    });
}

function checkCache(request) {
    return caches.open(CACHE).then(function(cache) {
        return cache.match(request).then(function(matching) {
            return matching || fetch(request);
        });
    });
}

function clearCache() {
    return caches.keys().then(function(cacheNames) {
        return Promise.all(
            cacheNames
                .filter(function(cacheName) {
                    return cacheName !== CACHE;
                })
                .map(function(cacheName) {
                    return caches.delete(cacheName);
                })
        );
    });
}