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
        // Support both regular and companii/agentii URLs
        return {
            card: 'article[data-sentry-element="Wrapper"][data-sentry-component="AdvertCard"], article[data-cy="listing-item"], article[data-sentry-component="UnitCard"]',
            link: 'a[href^="/ro/oferta/"]',
            price: 'span[data-sentry-component="Price"], span.css-2bt9f1',
            idRegex: /\/ro\/oferta\/([\w-]+)/i,
            title: 'p[data-cy="listing-item-title"], p.css-u3orbr',
            thumbnail: (card, propertyId) => {
                // Try storia.ro classic
                let img = card.querySelector('img[data-cy="listing-item-image-source"]');
                if (img) return img.src;
                // Try companii/agentii or ansamblu/unit
                img = card.querySelector('img');
                return img ? img.src : '';
            },
            listContainerSelectors: [
                'div[data-cy="search.listing.promoted"] ul',
                'div[data-cy="search.listing.organic"] ul',
                'div[data-cy="search.map.listing.organic"] ul',
                'ul.css-yd8sa2' // companii/agentii and ansamblu/unit listing container
            ],
            propertyIdAttribute: null
        };
    } else if (currentHostname.includes('olx.ro')) {
        return {
            card: 'div[data-cy="l-card"]', // Confirmed
            link: 'a[href*="/oferta/"]', // Covers OLX (/d/oferta/) and Storia redirects
            priceExtractor: (card) => {
                let priceText = '';
                // Try Storia-syndicated card structure first
                const storiaPriceElement = card.querySelector('div[type="grid"] p.css-1vhm4ri > span[data-testid="ad-price"]');
                if (storiaPriceElement) {
                    priceText = storiaPriceElement.textContent?.trim();
                }
                // Fallback to standard OLX card structure
                if (!priceText) {
                    const olxPriceElement = card.querySelector('p[data-testid="ad-price"]');
                    if (olxPriceElement) {
                        priceText = olxPriceElement.textContent?.trim();
                    }
                }
                if (!priceText) return 'N/A';

                // Clean the price text
                return priceText.replace(/lei|eur|€|\$|ron/gi, '')
                                .replace(/preț negociabil/gi, '')
                                .replace(/\s+/g, ' ') // Normalize spaces
                                .replace(/[.\s](?=\d{3})/g, '') // Remove thousands separators
                                .replace(/,/g, '.') // Convert comma decimal to dot
                                .replace(/[^\d.]/g, '') // Remove non-digits except dot
                                .trim() || 'N/A';
            },
            // Regex for OLX URLs like /d/oferta/garsoniera-moderna-lux-IDgT6fB.html -> IDgT6fB
            // Or for Storia URLs like /ro/oferta/apartament-2-camere-decomandat-IDXYZ.html -> IDXYZ
            idRegex: /\/(?:d\/oferta\/.*-|oferta\/)(ID\w+)\.html/i,
            title: 'div[type="grid"] p.css-1ttorhk a, a h4.css-1g61gc2, a h6, [data-cy="ad-card-title"] h4',
            thumbnail: (card) => {
                let img = card.querySelector('img.css-8wsg1m');
                if (img) return img.src;
                img = card.querySelector('img.css-gwhqbt');
                if (img) return img.src;
                // Fallback: image inside a link, within a div that might indicate a list layout,
                // avoiding small icon-like images if possible by checking parent 'a' tag.
                const generalImg = card.querySelector('a div[type="list"] img, a figure img');
                if (generalImg) return generalImg.src;
                // Last resort, any image directly within the card's main link, if specific ones fail
                const linkImg = card.querySelector( 'a > img');
                return linkImg ? linkImg.src : '';
            },
            listContainerSelectors: ['div.css-j0t2x2'], // Updated parent selector
            propertyIdAttribute: 'id' // Prioritize card's 'id' attribute for OLX ad ID
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

window.getOlxDetailPageId = function() {
    const idElement = document.querySelector('span.css-w85dhy');
    if (idElement?.textContent?.includes('ID:')) {
        return idElement.textContent.replace('ID:', '').trim();
    }
    // Fallback to URL parsing
    const urlMatch = window.location.pathname.match(/\/d\/oferta\/.*-(ID\w+)(?:\.html|$)/i);
    if (urlMatch && urlMatch[1]) {
        return urlMatch[1];
    }
    // Broader fallback for other URL patterns if needed, though less specific for OLX ID
    const genericUrlMatch = window.location.href.match(/-([a-zA-Z0-9_]+)$/i);
    return genericUrlMatch ? genericUrlMatch[1] : null;
};

window.getOlxDetailPageTitle = function() {
    return (
        document.querySelector('h4.css-1dcem4b')?.textContent.trim() ||
        document.querySelector('div[data-cy="offer_title"] h4')?.textContent?.trim() ||
        document.querySelector('meta[property="og:title"]')?.content ||
        'N/A'
    );
};

window.getOlxDetailPagePrice = function() {
    const priceElement = document.querySelector('h3.css-1m6jpd2, div[data-testid="ad-price-container"] h3');
    if (!priceElement) return 'N/A';
    // Remove currency symbols, non-breaking spaces, "Preț negociabil", etc. and then trim.
    // Adjust regex as needed for specific currency symbols or phrases.
    let rawPrice = priceElement.textContent || '';
    rawPrice = rawPrice.replace(/lei|eur|€|\$|ron/gi, '')
                       .replace(/preț negociabil/gi, '')
                       .replace(/\s+/g, ' ') // Normalize spaces
                       .replace(/[.\s](?=\d{3})/g, '') // Remove thousands separators if they are dots or spaces
                       .replace(/,/g, '.') // Convert comma decimal separator to dot
                       .replace(/[^\d.]/g, ''); // Remove any remaining non-digit characters except dot
    return rawPrice.trim() || 'N/A';
};

window.getOlxDetailPageThumbnail = function() {
    // Attempt to get from meta tag first
    const metaImage = document.querySelector('meta[property="og:image"]')?.content;
    if (metaImage) return metaImage;

    // Fallback to gallery image
    const galleryImage = document.querySelector('div[data-testid="swiper-wrapper-gallery"] img');
    if (galleryImage) return galleryImage.src;

    // Fallback to a prominent image on the page (e.g., the main ad image)
    const mainImage = document.querySelector('img.css-1bmv3i[data-cy="adPhotos-mainPhoto"], div[data-cy="adPhotos-mainPhoto"] img');
    if (mainImage) return mainImage.src;
    
    // Further fallback if the specific selector isn't found
    const genericImage = document.querySelector('div[data-cy="adPhotos"] img, figure[data-cy="adPhotos-figure"] img');
    return genericImage ? genericImage.src : '';
};
