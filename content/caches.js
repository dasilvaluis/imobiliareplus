// caches.js
// Handles loading and updating favorite/ignored caches

window.favoriteCache = null;
window.ignoredCache = null;
window.loadCaches = function() {
    const browserAPI = typeof browser !== 'undefined' ? browser : chrome;
    const currentHostname = window.location.hostname;
    browserAPI.runtime.sendMessage({ type: 'GET_FAVORITE_PROPERTIES', hostname: currentHostname }, res => {
        window.favoriteCache = res.properties;
    });
    browserAPI.runtime.sendMessage({ type: 'GET_IGNORED_PROPERTIES', hostname: currentHostname }, res => {
        window.ignoredCache = res.properties;
    });
};
