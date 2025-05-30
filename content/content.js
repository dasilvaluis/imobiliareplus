// Content script for ImobiliarePlus extension
// Use browser polyfill for cross-browser compatibility

console.log('ImobiliarePlus content script loaded');

const browserAPI = typeof browser !== 'undefined' ? browser : chrome;
const currentHostname = window.location.hostname;

// Function to get selectors based on hostname
function getPropertySelectors() {
    if (currentHostname.includes('imobiliare.ro')) {
        return {
            card: '[id^="listing-"], .listing-card',
            link: 'a[href*="/oferta/"]',
            price: '[data-cy="card-price"]',
            idRegex: /-(\d+)$/,
            title: 'h3 span', // Specific to imobiliare.ro structure
            thumbnail: (card, propertyId) => card.querySelector(`#gallery_slider_${propertyId} .swiper-slide img`)?.src,
            listContainer: '#scrollableList',
            propertyIdAttribute: null
        };
    } else if (currentHostname.includes('storia.ro')) {
        return {
            card: 'article[data-cy="listing-item"]',
            link: 'a[data-cy="listing-item-link"]',
            price: 'span[data-sentry-component="Price"]',
            idRegex: /([A-Z0-9]+)$/i, // Capture ID like 'IDCAjn' from href
            title: 'p[data-cy="listing-item-title"]',
            thumbnail: (card, propertyId) => card.querySelector('img[data-cy="listing-item-image-source"]')?.src,
            // Updated array of selectors for Storia.ro including the map view
            listContainerSelectors: [ 
                'div[data-cy="search.listing.promoted"] ul',
                'div[data-cy="search.listing.organic"] ul',
                'div[data-cy="search.map.listing.organic"] ul' // Added map view container selector
            ],
            propertyIdAttribute: null // ID is from URL for storia.ro
        };
    }
    console.warn('ImobiliarePlus: Unsupported site:', currentHostname);
    return null;
}

const selectors = getPropertySelectors();

// Function to add favorite and ignore buttons to a property card
function addButtonsToCard(card) {
    if (!selectors) return; // Unsupported site or selectors not found

    // Skip if buttons already added
    if (card.querySelector('.imobiliare-plus-buttons')) return;

    const propertyLinkElement = card.querySelector(selectors.link);
    if (!propertyLinkElement) {
        console.warn('Property link element not found for card:', card);
        return;
    }
    const propertyUrl = propertyLinkElement.href;
    
    let propertyId;
    if (selectors.idRegex) {
        const match = propertyUrl.match(selectors.idRegex);
        if (match && match[1]) {
            propertyId = match[1];
        }
    }
    
    // Removed fallback for propertyIdAttribute for storia.ro as ID is from URL
    
    if (!propertyId) {
        console.warn('Property ID not found for card:', card, 'URL:', propertyUrl, 'using regex:', selectors.idRegex);
        return;
    }

    // Get property details
    const propertyTitle = card.querySelector(selectors.title)?.textContent.trim() || '';
    
    let thumbnailUrl = '';
    if (typeof selectors.thumbnail === 'function') {
        thumbnailUrl = selectors.thumbnail(card, propertyId) || '';
    } else { 
        // Fallback for simple string selector (though function is preferred)
        const thumbnailImgElement = card.querySelector(selectors.thumbnail);
        thumbnailUrl = thumbnailImgElement?.src || '';
    }

    let propertyPrice = '';
    if (selectors.price) {
        const priceElement = card.querySelector(selectors.price);
        if (priceElement) {
            propertyPrice = priceElement.textContent.trim();
            console.log('Found property price:', propertyPrice);
        }
    }

    const propertyInfo = {
        id: propertyId,
        title: propertyTitle,
        url: propertyUrl,
        thumbnail: thumbnailUrl,
        hostname: currentHostname,
        price: propertyPrice
    };

    console.log('Found property:', propertyInfo);

    // Create buttons container
    const buttonsContainer = document.createElement('div');
    buttonsContainer.className = 'imobiliare-plus-buttons';
    buttonsContainer.style.display = 'flex';
    buttonsContainer.style.gap = '8px';
    buttonsContainer.style.marginTop = '8px';
    buttonsContainer.style.padding = '0 16px 16px';

    // Create favorite button
    const favoriteButton = document.createElement('button');
    favoriteButton.className = 'imobiliare-plus-favorite';
    favoriteButton.innerHTML = '⭐ Favorite';
    favoriteButton.style.padding = '4px 8px';
    favoriteButton.style.border = 'none';
    favoriteButton.style.borderRadius = '4px';
    favoriteButton.style.cursor = 'pointer';
    favoriteButton.style.backgroundColor = '#f0f0f0';

    // Create ignore button
    const ignoreButton = document.createElement('button');
    ignoreButton.className = 'imobiliare-plus-ignore';
    ignoreButton.innerHTML = '🚫 Ignore';
    ignoreButton.style.padding = '4px 8px';
    ignoreButton.style.border = 'none';
    ignoreButton.style.borderRadius = '4px';
    ignoreButton.style.cursor = 'pointer';
    ignoreButton.style.backgroundColor = '#f0f0f0';
    ignoreButton.style.color = '#666';

    // Add buttons to container
    buttonsContainer.appendChild(favoriteButton);
    buttonsContainer.appendChild(ignoreButton);

    // Add container to card
    card.appendChild(buttonsContainer);

    
    // Check if property is already favorite/ignored
    // Pass hostname to distinguish between properties from different sites if IDs are not unique across sites
    browserAPI.runtime.sendMessage({ type: 'GET_FAVORITE_PROPERTIES', hostname: currentHostname }, response => {
        if (response.properties.some(p => p.id === propertyId && p.hostname === currentHostname)) {
            favoriteButton.style.backgroundColor = '#ffd700';
        }
    });

    browserAPI.runtime.sendMessage({ type: 'GET_IGNORED_PROPERTIES', hostname: currentHostname }, response => {
        if (response.properties.some(p => p.id === propertyId && p.hostname === currentHostname)) {
            ignoreButton.style.backgroundColor = '#ff6b6b';
            ignoreButton.style.color = '#fff';
            card.style.opacity = '0.5';
        }
    });

    // Add click handlers
    favoriteButton.addEventListener('click', () => {
        browserAPI.runtime.sendMessage({
            type: 'TOGGLE_FAVORITE_PROPERTY',
            propertyInfo: propertyInfo // propertyInfo now includes hostname
        }, response => {
            if (response.success) {
                favoriteButton.style.backgroundColor = response.isFavorite ? '#ffd700' : '#f0f0f0';
            }
        });
    });

    ignoreButton.addEventListener('click', () => {
        browserAPI.runtime.sendMessage({
            type: 'TOGGLE_IGNORE_PROPERTY',
            propertyInfo: propertyInfo // propertyInfo now includes hostname
        }, response => {
            if (response.success) {
                ignoreButton.style.backgroundColor = response.isIgnored ? '#ff6b6b' : '#f0f0f0';
                ignoreButton.style.color = response.isIgnored ? '#fff' : '#666';
                card.style.opacity = response.isIgnored ? '0.5' : '1';
            }
        });
    });
}

// Function to process all property cards
function processPropertyCards() {
    if (!selectors) return; // Unsupported site

    const cards = document.querySelectorAll(selectors.card);
    console.log(`Found ${cards.length} property cards on ${currentHostname} using selector: ${selectors.card}`);
    
    cards.forEach(card => {
        // console.log('Processing card:', card); // Can be too verbose
        addButtonsToCard(card);
    });
}

// Set up observers for dynamic content
function setupObservers() {
    if (!selectors) {
        console.warn('ImobiliarePlus: Selectors not defined for this site. Observer not started.');
        return;
    }

    const setupObserverForContainer = (containerSelector) => {
        const container = document.querySelector(containerSelector);
        if (container) {
            console.log('Found list container:', container, 'with selector:', containerSelector);

            // Process existing cards within this specific container
            const existingCards = container.querySelectorAll(selectors.card);
            console.log(`Found ${existingCards.length} existing cards in container ${containerSelector}`);
            existingCards.forEach(card => addButtonsToCard(card));

            const observer = new MutationObserver((mutations) => {
                mutations.forEach((mutation) => {
                    if (mutation.addedNodes.length) {
                        mutation.addedNodes.forEach(node => {
                            if (node.nodeType === Node.ELEMENT_NODE) {
                                if (node.matches && node.matches(selectors.card)) {
                                    console.log('Found new property card (direct match):', node, 'in', containerSelector);
                                    addButtonsToCard(node);
                                } else if (node.querySelectorAll) {
                                    const newCardsInNode = node.querySelectorAll(selectors.card);
                                    if (newCardsInNode.length > 0) {
                                        console.log('Found new property cards (child match):', newCardsInNode, 'in', containerSelector);
                                        newCardsInNode.forEach(childCard => addButtonsToCard(childCard));
                                    }
                                }
                            }
                        });
                    }
                });
            });
            observer.observe(container, { childList: true, subtree: true });
            console.log('Observer set up for:', containerSelector);
            return true; // Observer setup was successful
        } else {
            console.log('List container not found with selector:', containerSelector);
            return false; // Observer setup failed
        }
    };

    let observersConfigured = false;
    if (selectors.listContainerSelectors && Array.isArray(selectors.listContainerSelectors)) {
        // Handle array of selectors (for Storia.ro)
        selectors.listContainerSelectors.forEach(selector => {
            if (setupObserverForContainer(selector)) {
                observersConfigured = true;
            }
        });
        if (!observersConfigured) {
            console.log('No list containers found for Storia.ro from provided selectors. Retrying...');
            setTimeout(setupObservers, 3000); // Retry for all selectors if none were found initially
        }
    } else if (selectors.listContainer) {
        // Fallback for single string selector (for Imobiliare.ro)
        if (setupObserverForContainer(selectors.listContainer)) {
            observersConfigured = true;
        } else {
            console.log(`List container not found with selector "${selectors.listContainer}", will retry...`);
            setTimeout(setupObservers, 3000); // Retry for the single selector
        }
    } else {
        console.warn('ImobiliarePlus: No list container selector(s) defined for this site. Observer not started.');
        return;
    }
    
    // Process all cards on the page initially, in case some are outside observed containers or missed.
    // This is a fallback and might be redundant if observers cover everything.
    // Consider if this is needed or if initial processing should be per-container.
    // For now, let's rely on per-container initial processing.
    // processPropertyCards(); // This might be too broad now.

    // Imobiliare.ro specific map observer
    if (currentHostname.includes('imobiliare.ro')) {
        const mapContainer = document.getElementById('map');
        if (mapContainer) {
            console.log('Found map container for Imobiliare.ro:', mapContainer);
            const mapObserver = new MutationObserver(() => {
                console.log('Map changed on Imobiliare.ro, re-processing cards in observed containers...');
                // Re-process cards within the already found and observed list container for imobiliare.ro
                if (selectors.listContainer) {
                    const imobiliareListContainer = document.querySelector(selectors.listContainer);
                    if (imobiliareListContainer) {
                        const cardsInImobiliareContainer = imobiliareListContainer.querySelectorAll(selectors.card);
                        cardsInImobiliareContainer.forEach(card => addButtonsToCard(card));
                    }
                }
            });
            mapObserver.observe(mapContainer, { attributes: true, attributeFilter: ['class', 'style'] });
        }
    }
}

// Initialize when the page is ready
function initialize() {
    if (!selectors) {
        console.log(`ImobiliarePlus: Not initializing on unsupported site: ${currentHostname}`);
        return;
    }
    console.log(`Initializing ImobiliarePlus on ${currentHostname}...`);
    setupObservers();
}

// Start observing as soon as possible
initialize();

// Function to update a property card's appearance
function updateCardAppearance(propertyId, isFavorite, isIgnored, hostname) {
    if (!selectors) return;

    // Try to find the card. This needs to be robust.
    // Imobiliare.ro uses `id="listing-12345"`
    // Storia.ro: iterate through cards and match ID from link's href
    let cardToUpdate = null;
    if (hostname.includes('imobiliare.ro')) {
        cardToUpdate = document.querySelector(`#listing-${propertyId}`);
    } else if (hostname.includes('storia.ro')) {
        const allCards = document.querySelectorAll(selectors.card);
        for (const c of allCards) {
            const linkEl = c.querySelector(selectors.link);
            if (linkEl && linkEl.href) {
                const idMatch = linkEl.href.match(selectors.idRegex);
                if (idMatch && idMatch[1] && idMatch[1].toLowerCase() === propertyId.toLowerCase()) {
                    cardToUpdate = c;
                    break;
                }
            }
        }
    }

    if (!cardToUpdate) {
        console.log(`Card not found for ID: ${propertyId} on hostname: ${hostname}. Card appearance not updated.`);
        return;
    }

    const favoriteButton = cardToUpdate.querySelector('.imobiliare-plus-favorite');
    const ignoreButton = cardToUpdate.querySelector('.imobiliare-plus-ignore');

    if (favoriteButton) {
        favoriteButton.style.backgroundColor = isFavorite ? '#ffd700' : '#f0f0f0';
    }

    if (ignoreButton) {
        ignoreButton.style.backgroundColor = isIgnored ? '#ff6b6b' : '#f0f0f0';
        ignoreButton.style.color = isIgnored ? '#fff' : '#666';
        cardToUpdate.style.opacity = isIgnored ? '0.5' : '1';
    }
}

// Listen for messages from popup
browserAPI.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log('Message received in content script:', message);
    
    if (message.type === 'PROPERTY_STATE_UPDATED') {
        // Ensure hostname is passed from where the message originates, or assume current hostname
        const hostname = message.hostname || currentHostname;
        updateCardAppearance(
            message.propertyId,
            message.isFavorite,
            message.isIgnored,
            hostname 
        );
        sendResponse({ success: true });
    }
    // Ensure other message types are handled or acknowledged if necessary
    return true; // Indicates that sendResponse will be called asynchronously
});
