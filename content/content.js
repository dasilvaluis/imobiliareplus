// Content script for ImobiliarePlus extension
// Use browser polyfill for cross-browser compatibility

console.log('ImobiliarePlus content script loaded');

const browserAPI = typeof browser !== 'undefined' ? browser : chrome;
const currentHostname = window.location.hostname;
let favoriteCache = null;
let ignoredCache = null;
let activeObservers = [];

// Load initial caches for favorites and ignored properties
function loadCaches() {
    browserAPI.runtime.sendMessage({ type: 'GET_FAVORITE_PROPERTIES', hostname: currentHostname }, res => {
        favoriteCache = res.properties;
    });
    browserAPI.runtime.sendMessage({ type: 'GET_IGNORED_PROPERTIES', hostname: currentHostname }, res => {
        ignoredCache = res.properties;
    });
}

// Function to get selectors based on hostname
function getPropertySelectors() {
    if (currentHostname.includes('imobiliare.ro')) {
        return {
            card: '[id^="listing-"], .listing-card',
            link: 'a[href*="/oferta/"]',
            price: null,
            priceExtractor: (card) => {
                const priceContainer = card.querySelector('[data-cy="card-price"]');
                if (!priceContainer) return null;
                
                // Try to get just the current price (first direct text node or first strong element)
                const strongPrice = priceContainer.querySelector('strong');
                if (strongPrice) return strongPrice.textContent.trim();
                
                // Alternative approach: get first text content before any child elements
                let priceText = '';
                for (let node of priceContainer.childNodes) {
                    if (node.nodeType === Node.TEXT_NODE) {
                        priceText = node.textContent.trim();
                        if (priceText) break;
                    }
                }
                
                // If we found text with the € symbol, that's probably the price
                if (priceText.includes('€')) return priceText;
                
                // Fallback: just get the first part before any special characters
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
    
    if (!propertyId) {
        console.warn('Property ID not found, falling back to URL hash.');
        propertyId = btoa(propertyUrl).slice(0, 12);
    }

    if (favoriteCache?.some(p => p.id === propertyId)) {
        console.log('Property already favorited:', propertyId);
        return; // Skip if already favorited
    }
    if (ignoredCache?.some(p => p.id === propertyId)) {
        console.log('Property already ignored:', propertyId);
        return; // Skip if already ignored
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
    if (selectors.priceExtractor) {
        // Use the custom price extraction function
        propertyPrice = selectors.priceExtractor(card) || '';
    } else if (selectors.price) {
        // Use the simple selector as fallback
        const priceElement = card.querySelector(selectors.price);
        if (priceElement) {
            propertyPrice = priceElement.textContent.trim();
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

    const buttonsContainer = document.createElement('div');
    buttonsContainer.className = 'imobiliare-plus-buttons';
    buttonsContainer.style.cssText = `
        display: flex;
        justify-content: space-between;
        gap: 10px;
        margin-top: 10px;
        padding: 0 16px 16px;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    `;

    // Favorite button
    const favoriteButton = document.createElement('button');
    favoriteButton.className = 'imobiliare-plus-favorite';
    favoriteButton.innerHTML = '<span class="icon">★</span> <span class="text">Favorite</span>';
    favoriteButton.style.cssText = `
        flex: 1;
        padding: 8px 12px;
        border: 1px solid #e0e0e0;
        border-radius: 20px;
        cursor: pointer;
        background-color: white;
        color: #42758C;
        font-weight: 500;
        font-size: 13px;
        transition: all 0.2s ease;
        box-shadow: 0 1px 3px rgba(0,0,0,0.08);
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 6px;
        outline: none;
    `;
    // Ignore button
    const ignoreButton = document.createElement('button');
    ignoreButton.className = 'imobiliare-plus-ignore';
    ignoreButton.innerHTML = '<span class="icon">✕</span> <span class="text">Hide</span>';
    ignoreButton.style.cssText = `
        flex: 1;
        padding: 8px 12px;
        border: 1px solid #e0e0e0;
        border-radius: 20px;
        cursor: pointer;
        background-color: white;
        color: #1e2839;
        font-weight: 500;
        font-size: 13px;
        transition: all 0.2s ease;
        box-shadow: 0 1px 3px rgba(0,0,0,0.08);
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 6px;
        outline: none;
    `;
    
    // Favorite button hover
    favoriteButton.addEventListener('mouseover', () => {
        if (!favoriteButton.classList.contains('active')) {
            favoriteButton.style.backgroundColor = '#f0f7f9';
            favoriteButton.style.borderColor = '#3e8b9c';
        }
    });
    favoriteButton.addEventListener('mouseout', () => {
        if (!favoriteButton.classList.contains('active')) {
            favoriteButton.style.backgroundColor = 'white';
            favoriteButton.style.borderColor = '#e0e0e0';
        }
    });

    // Hide button hover
    ignoreButton.addEventListener('mouseover', () => {
        if (!ignoreButton.classList.contains('active')) {
            ignoreButton.style.backgroundColor = '#f5f6f8';
            ignoreButton.style.borderColor = '#1e2839';
        }
    });
    ignoreButton.addEventListener('mouseout', () => {
        if (!ignoreButton.classList.contains('active')) {
            ignoreButton.style.backgroundColor = 'white';
            ignoreButton.style.borderColor = '#e0e0e0';
        }
    });
    // Add buttons to container
    buttonsContainer.appendChild(favoriteButton);
    buttonsContainer.appendChild(ignoreButton);

    // Add container to card
    card.appendChild(buttonsContainer);

    
    // Check if property is already favorite/ignored
    browserAPI.runtime.sendMessage({ type: 'GET_FAVORITE_PROPERTIES', hostname: currentHostname }, response => {
        if (response.properties.some(p => p.id === propertyId && p.hostname === currentHostname)) {
            favoriteButton.style.backgroundColor = '#ffebb3';
            favoriteButton.style.color = '#b18000';
            favoriteButton.style.boxShadow = 'inset 0 1px 3px rgba(0,0,0,0.1)';
            favoriteButton.classList.add('active');
            favoriteButton.querySelector('.icon').textContent = '★';  // Filled star
        }
    });

    browserAPI.runtime.sendMessage({ type: 'GET_IGNORED_PROPERTIES', hostname: currentHostname }, response => {
        if (response.properties.some(p => p.id === propertyId && p.hostname === currentHostname)) {
            ignoreButton.style.backgroundColor = '#ffdbdb';
            ignoreButton.style.color = '#d32f2f';
            ignoreButton.style.boxShadow = 'inset 0 1px 3px rgba(0,0,0,0.1)';
            ignoreButton.classList.add('active');
            card.style.opacity = '0.6';
        }
    });

    // Update the click handlers to include smooth transitions:
    favoriteButton.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();
        
        // Add a visual feedback effect
        favoriteButton.style.transform = 'scale(0.95)';
        setTimeout(() => { favoriteButton.style.transform = 'scale(1)'; }, 100);
        
        browserAPI.runtime.sendMessage({
            type: 'TOGGLE_FAVORITE_PROPERTY',
            propertyInfo: propertyInfo
        }, response => {
            if (response.success) {
                if (response.isFavorite) {
                    favoriteButton.style.backgroundColor = '#3e8b9c';
                    favoriteButton.style.color = '#ffffff';
                    favoriteButton.style.border = '1px solidrgb(35, 255, 35)';
                    favoriteButton.style.boxShadow = '0 1px 3px rgba(0,0,0,0.12)';
                    favoriteButton.classList.add('active');
                    favoriteButton.querySelector('.icon').textContent = '★';  // Filled star
                } else {
                    favoriteButton.style.backgroundColor = '#f8f8f8';
                    favoriteButton.style.color = '#333';
                    favoriteButton.style.boxShadow = '0 1px 3px rgba(0,0,0,0.08)';
                    favoriteButton.classList.remove('active');
                    favoriteButton.querySelector('.icon').textContent = '★';  // Empty star
                }
            }
        });
    });

    ignoreButton.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();
        
        // Add a visual feedback effect
        ignoreButton.style.transform = 'scale(0.95)';
        setTimeout(() => { ignoreButton.style.transform = 'scale(1)'; }, 100);
        
        browserAPI.runtime.sendMessage({
            type: 'TOGGLE_IGNORE_PROPERTY',
            propertyInfo: propertyInfo
        }, response => {
            if (response.success) {
                if (response.isIgnored) {
                    ignoreButton.style.backgroundColor = '#1e2839';
                    ignoreButton.style.color = '#ffffff';
                    ignoreButton.style.border = '1px solid #1e2839';
                    ignoreButton.style.boxShadow = '0 1px 3px rgba(0,0,0,0.12)';
                    ignoreButton.classList.add('active');
                    card.style.opacity = '0.6';
                    card.style.transition = 'opacity 0.3s ease';
                } else {
                    ignoreButton.style.backgroundColor = '#f8f8f8';
                    ignoreButton.style.color = '#555';
                    ignoreButton.style.boxShadow = '0 1px 3px rgba(0,0,0,0.08)';
                    ignoreButton.classList.remove('active');
                    card.style.opacity = '1';
                }
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
            activeObservers.push(observer); // Track this observer
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
            mapObserver.observe(mapContainer, { childList: true, subtree: true });
            activeObservers.push(mapObserver);
        }
    }
}

// Initialize when the page is ready
function initialize() {
    if (!selectors) {
        console.log(`ImobiliarePlus: Not initializing on unsupported site: ${currentHostname}`);
        return;
    }
    loadCaches();
    console.log(`Initializing ImobiliarePlus on ${currentHostname}...`);
    setupObservers();
}

let lastUrl = location.href;
const urlObserver = new MutationObserver(() => {
    if (location.href !== lastUrl) {
        lastUrl = location.href;
        console.log('URL changed to:', lastUrl);
        
        // Clean up old observers
        activeObservers.forEach(observer => observer.disconnect());
        activeObservers = [];
        
        // Reinitialize the extension for the new URL
        setTimeout(() => {
            initialize();
        }, 1000); // Small delay to allow the page to render
    }
});

// Start observing for URL changes
urlObserver.observe(document, { subtree: true, childList: true });

let scrollTimeout;
window.addEventListener('scroll', () => {
    if (!selectors) return;
    
    clearTimeout(scrollTimeout);
    scrollTimeout = setTimeout(() => {
        console.log('Processing cards after scroll');
        processPropertyCards(); // Process any new cards that appeared during scrolling
    }, 300); // Debounce to avoid excessive processing
});

// Add this at the end of the file for periodic checking
// This ensures functionality even if observers miss something
setInterval(() => {
    if (document.visibilityState === 'visible' && selectors) {
        console.log('Periodic check: processing cards');
        processPropertyCards();
    }
}, 10000); // Every 10 seconds

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
