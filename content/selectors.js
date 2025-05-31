// selectors.js
// Handles all logic for site-specific selectors and property extraction

window.getPropertySelectors = function() {
    const currentHostname = window.location.hostname;
    if (currentHostname.includes('imobiliare.ro')) {
        return {
            card: '[id^="listing-"], .listing-card',
            link: 'a[href*="/oferta/"]',
            price: null,
            priceExtractor: (card) => {
                const priceContainer = card.querySelector('[data-cy="card-price"]');
                if (!priceContainer) return null;
                const strongPrice = priceContainer.querySelector('strong');
                if (strongPrice) return strongPrice.textContent.trim();
                let priceText = '';
                for (let node of priceContainer.childNodes) {
                    if (node.nodeType === Node.TEXT_NODE) {
                        priceText = node.textContent.trim();
                        if (priceText) break;
                    }
                }
                if (priceText.includes('€')) return priceText;
                const fullText = priceContainer.textContent.trim();
                const match = fullText.match(/^([\d.,]+\s*€)/);
                return match ? match[1] : fullText;
            },
            idRegex: /-(\d+)$/,
            title: 'h3 span',
            thumbnail: (card, propertyId) => card.querySelector(`#gallery_slider_${propertyId} .swiper-slide img`)?.src,
            listContainer: '#scrollableList',
            propertyIdAttribute: null
        };
    } else if (currentHostname.includes('storia.ro')) {
        return {
            card: 'article[data-cy="listing-item"]',
            link: 'a[data-cy="listing-item-link"]',
            price: 'span[data-sentry-component="Price"]',
            idRegex: /([A-Z0-9]+)$/i,
            title: 'p[data-cy="listing-item-title"]',
            thumbnail: (card, propertyId) => card.querySelector('img[data-cy="listing-item-image-source"]')?.src,
            listContainerSelectors: [
                'div[data-cy="search.listing.promoted"] ul',
                'div[data-cy="search.listing.organic"] ul',
                'div[data-cy="search.map.listing.organic"] ul'
            ],
            propertyIdAttribute: null
        };
    }
    console.warn('ImobiliarePlus: Unsupported site:', currentHostname);
    return null;
};

window.getImobiliareDetailPageId = function() {
    const urlMatch = window.location.href.match(/([A-Z0-9]+)$/i);
    return urlMatch ? urlMatch[1] : null;
};
window.getImobiliareDetailPageTitle = function() {
    return (
        document.querySelector('h1.titlu-anunt')?.textContent.trim() ||
        document.querySelector('meta[property="og:title"]')?.content ||
        'N/A'
    );
};
window.getImobiliareDetailPagePrice = function() {
    const priceElement = document.querySelector('span[aria-label="price"]');
    if (!priceElement) return 'N/A';
    let rawPrice = priceElement.textContent.trim();
    return rawPrice.replace(/[€RON\s]/g, '').replace(/\.(?=\d{3})/g, '');
};
window.getImobiliareDetailPageThumbnail = function() {
    return document.querySelector('meta[property="og:image"]')?.content || '';
};
window.getStoriaDetailPageId = function() {
    const match = window.location.pathname.match(/\/ro\/oferta\/([\w-]+)/);
    return match ? match[1] : null;
};
window.getStoriaDetailPageTitle = function() {
    return (
        document.querySelector('h1[data-cy="adPage__title"]')?.textContent.trim() ||
        document.querySelector('meta[property="og:title"]')?.content ||
        'N/A'
    );
};
window.getStoriaDetailPagePrice = function() {
    const priceElement = document.querySelector('strong[data-cy="adPageHeaderPrice"]');
    if (!priceElement) return 'N/A';
    let rawPrice = priceElement.textContent.trim();
    return rawPrice;
};
window.getStoriaDetailPageThumbnail = function() {
    return document.querySelector('meta[property="og:image"]')?.content || '';
};
