// main.js
// Entry point: initializes the extension and sets up message listeners

(function() {
    const browserAPI = typeof browser !== 'undefined' ? browser : chrome;
    const currentHostname = window.location.hostname;
    let selectors = window.getPropertySelectors();
    let lastUrl = location.href;

    function initialize() {
        selectors = window.getPropertySelectors();
        if (!selectors) {
            console.log(`ImobiliarePlus: Not initializing on unsupported site: ${currentHostname}`);
            return;
        }
        window.loadCaches();
        console.log(`Initializing ImobiliarePlus on ${currentHostname}...`);
        window.setupObservers();
        window.setupScrollAndInterval();
        if (typeof window.addButtonsToDetailPage === 'function') {
            window.addButtonsToDetailPage();
        }
    }

    // Observe URL changes (SPA navigation)
    const urlObserver = new MutationObserver(() => {
        if (location.href !== lastUrl) {
            lastUrl = location.href;
            console.log('URL changed to:', lastUrl);
            window.disconnectObservers();
            setTimeout(() => {
                initialize();
            }, 1000);
        }
    });
    urlObserver.observe(document, { subtree: true, childList: true });

    // Start observing as soon as possible
    initialize();

    // Listen for messages from popup or background
    browserAPI.runtime.onMessage.addListener((message, sender, sendResponse) => {
        if (message.type === 'PROPERTY_STATE_UPDATED') {
            const hostname = message.hostname || currentHostname;
            window.updateCardAppearance(
                message.propertyId,
                message.isFavorite,
                message.isIgnored,
                hostname
            );
            sendResponse({ success: true });
        }
        return true;
    });
})();
