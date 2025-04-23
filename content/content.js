// Content script for ImobiliarePlus extension
// Use browser polyfill for cross-browser compatibility

console.log('ImobiliarePlus content script loaded');

// Function to add favorite and ignore buttons to property listings
const browserAPI = typeof browser !== 'undefined' ? browser : chrome;

// Function to add favorite and ignore buttons to a property card
function addButtonsToCard(card) {
    // Skip if buttons already added
    if (card.querySelector('.imobiliare-plus-buttons')) return;

    // Get property ID from the card
    const propertyLink = card.querySelector('a[href*="/oferta/"]');
    if (!propertyLink) return;
    
    // Extract the numerical ID from the URL
    const propertyId = propertyLink.href.match(/-(\d+)$/)?.[1];
    if (!propertyId) return;

    // Get property details
    const propertyTitle = card.querySelector('h3 span')?.textContent.trim() || '';
    const propertyUrl = propertyLink.href;
    
    // Get thumbnail image
    const gallerySlider = card.querySelector(`#gallery_slider_${propertyId}`);
    const thumbnailImg = gallerySlider?.querySelector('.swiper-slide img');
    const thumbnailUrl = thumbnailImg?.src || '';

    const propertyInfo = {
        id: propertyId,
        title: propertyTitle,
        url: propertyUrl,
        thumbnail: thumbnailUrl
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
    browserAPI.runtime.sendMessage({ type: 'GET_FAVORITE_PROPERTIES' }, response => {
        if (response.properties.some(p => p.id === propertyId)) {
            favoriteButton.style.backgroundColor = '#ffd700';
        }
    });

    browserAPI.runtime.sendMessage({ type: 'GET_IGNORED_PROPERTIES' }, response => {
        if (response.properties.some(p => p.id === propertyId)) {
            ignoreButton.style.backgroundColor = '#ff6b6b';
            ignoreButton.style.color = '#fff';
            card.style.opacity = '0.5';
        }
    });

    // Add click handlers
    favoriteButton.addEventListener('click', () => {
        browserAPI.runtime.sendMessage({
            type: 'TOGGLE_FAVORITE_PROPERTY',
            propertyInfo: propertyInfo
        }, response => {
            if (response.success) {
                favoriteButton.style.backgroundColor = response.isFavorite ? '#ffd700' : '#f0f0f0';
            }
        });
    });

    ignoreButton.addEventListener('click', () => {
        browserAPI.runtime.sendMessage({
            type: 'TOGGLE_IGNORE_PROPERTY',
            propertyInfo: propertyInfo
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
    // Find all property cards in the scrollable list
    const cards = document.querySelectorAll('[id^="listing-"], .listing-card');
    console.log('Found property cards:', cards.length);
    
    cards.forEach(card => {
        console.log('Processing card:', card);
        addButtonsToCard(card);
    });
}

// Set up observers for dynamic content
function setupObservers() {
    // Observe the scrollable list container
    const listContainer = document.getElementById('scrollableList');
    if (!listContainer) {
        console.log('Scrollable list container not found, will retry...');
        setTimeout(setupObservers, 1000);
        return;
    }

    console.log('Found scrollable list container:', listContainer);
    console.log('Setting up observer for list container');
    
    // Process existing cards
    processPropertyCards();

    // Set up observer for new cards
    const observer = new MutationObserver((mutations) => {
        console.log('Mutation observed:', mutations);
        mutations.forEach((mutation) => {
            if (mutation.addedNodes.length) {
                console.log('New nodes added:', mutation.addedNodes);
                // Check if any of the added nodes are property cards
                mutation.addedNodes.forEach(node => {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        if (node.id?.startsWith('listing-') || node.classList?.contains('listing-card')) {
                            console.log('Found new property card:', node);
                            addButtonsToCard(node);
                        }
                    }
                });
                processPropertyCards();
            }
        });
    });

    observer.observe(listContainer, {
        childList: true,
        subtree: true
    });

    // Also observe the map for changes that might affect the list
    const mapContainer = document.getElementById('map');
    if (mapContainer) {
        console.log('Found map container:', mapContainer);
        const mapObserver = new MutationObserver(() => {
            console.log('Map changed, updating cards...');
            // When map changes, wait a bit for listings to update
            setTimeout(processPropertyCards, 500);
        });

        mapObserver.observe(mapContainer, {
            attributes: true,
            attributeFilter: ['class', 'style']
        });
    }
}

// Initialize when the page is ready
function initialize() {
    console.log('Initializing ImobiliarePlus...');
    setupObservers();
}

// Start observing as soon as possible
initialize();

// Function to update a property card's appearance
function updateCardAppearance(propertyId, isFavorite, isIgnored) {
    // Find the card using the numerical ID
    const card = document.querySelector(`#listing-${propertyId}`);
    if (!card) {
        console.log('Card not found for ID:', propertyId);
        return;
    }

    const favoriteButton = card.querySelector('.imobiliare-plus-favorite');
    const ignoreButton = card.querySelector('.imobiliare-plus-ignore');

    if (favoriteButton) {
        favoriteButton.style.backgroundColor = isFavorite ? '#ffd700' : '#f0f0f0';
    }

    if (ignoreButton) {
        ignoreButton.style.backgroundColor = isIgnored ? '#ff6b6b' : '#f0f0f0';
        ignoreButton.style.color = isIgnored ? '#fff' : '#666';
        card.style.opacity = isIgnored ? '0.5' : '1';
    }
}

// Listen for messages from popup
browserAPI.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log('Message received in content script:', message);
    
    if (message.type === 'PROPERTY_STATE_UPDATED') {
        updateCardAppearance(
            message.propertyId,
            message.isFavorite,
            message.isIgnored
        );
        sendResponse({ success: true });
    }
});