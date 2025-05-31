// observers.js
// Contains logic for setting up and managing MutationObservers and scroll/interval handlers

window.setupObservers = function() {
    const selectors = window.getPropertySelectors();
    let activeObservers = window.activeObservers || [];
    function setupObserverForContainer(containerSelector) {
        const container = document.querySelector(containerSelector);
        if (container) {
            const existingCards = container.querySelectorAll(selectors.card);
            existingCards.forEach(card => window.addButtonsToCard(card));
            const observer = new MutationObserver((mutations) => {
                mutations.forEach((mutation) => {
                    if (mutation.addedNodes.length) {
                        mutation.addedNodes.forEach(node => {
                            if (node.nodeType === Node.ELEMENT_NODE) {
                                if (node.matches && node.matches(selectors.card)) {
                                    window.addButtonsToCard(node);
                                } else if (node.querySelectorAll) {
                                    const newCardsInNode = node.querySelectorAll(selectors.card);
                                    newCardsInNode.forEach(childCard => window.addButtonsToCard(childCard));
                                }
                            }
                        });
                    }
                });
            });
            observer.observe(container, { childList: true, subtree: true });
            activeObservers.push(observer);
            window.activeObservers = activeObservers;
            return true;
        }
        return false;
    }
    let observersConfigured = false;
    if (selectors.listContainerSelectors && Array.isArray(selectors.listContainerSelectors)) {
        selectors.listContainerSelectors.forEach(selector => {
            if (setupObserverForContainer(selector)) observersConfigured = true;
        });
        if (!observersConfigured) setTimeout(window.setupObservers, 3000);
    } else if (selectors.listContainer) {
        if (!setupObserverForContainer(selectors.listContainer)) setTimeout(window.setupObservers, 3000);
    }
    // Imobiliare.ro specific map observer
    const currentHostname = window.location.hostname;
    if (currentHostname.includes('imobiliare.ro')) {
        const mapContainer = document.getElementById('map');
        if (mapContainer) {
            const mapObserver = new MutationObserver(() => {
                if (selectors.listContainer) {
                    const imobiliareListContainer = document.querySelector(selectors.listContainer);
                    if (imobiliareListContainer) {
                        const cardsInImobiliareContainer = imobiliareListContainer.querySelectorAll(selectors.card);
                        cardsInImobiliareContainer.forEach(card => window.addButtonsToCard(card));
                    }
                }
            });
            mapObserver.observe(mapContainer, { childList: true, subtree: true });
            activeObservers.push(mapObserver);
            window.activeObservers = activeObservers;
        }
    }
};

window.setupScrollAndInterval = function() {
    const selectors = window.getPropertySelectors();
    let scrollTimeout;
    window.addEventListener('scroll', () => {
        if (!selectors) return;
        clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(() => {
            window.processPropertyCards();
        }, 300);
    });
    setInterval(() => {
        if (document.visibilityState === 'visible' && selectors) {
            window.processPropertyCards();
        }
    }, 10000);
};

window.disconnectObservers = function() {
    let activeObservers = window.activeObservers || [];
    activeObservers.forEach(observer => observer.disconnect());
    window.activeObservers = [];
};
