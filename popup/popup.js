// Use browser polyfill for cross-browser compatibility
const browserAPI = typeof browser !== 'undefined' ? browser : chrome;

console.log('ImobiliarePlus extension popup script loaded');

document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM Content Loaded in popup');
    
    // Set up tab switching
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabPanes = document.querySelectorAll('.tab-pane');
    
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Remove active class from all buttons and panes
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabPanes.forEach(pane => pane.classList.remove('active'));
            
            // Add active class to clicked button and corresponding pane
            button.classList.add('active');
            const tabId = button.getAttribute('data-tab');
            document.getElementById(tabId).classList.add('active');
            
            // Load properties for the active tab
            if (tabId === 'favorites') {
                loadFavoriteProperties();
            } else {
                loadIgnoredProperties();
            }
        });
    });
    
    // Load initial tab content
    loadFavoriteProperties();
});

// Function to create a property item element
function createPropertyItem(property, isFavorite = false, isIgnored = false) {
    const item = document.createElement('div');
    item.className = 'property-item';
    
    const info = document.createElement('div');
    info.className = 'property-info';
    
    // Create thumbnail
    const thumbnail = document.createElement('img');
    thumbnail.className = 'property-thumbnail';
    thumbnail.src = property.thumbnail;
    thumbnail.alt = property.title;
    thumbnail.style.width = '80px';
    thumbnail.style.height = '60px';
    thumbnail.style.objectFit = 'cover';
    thumbnail.style.borderRadius = '4px';
    
    // Create title link
    const titleLink = document.createElement('a');
    titleLink.className = 'property-title';
    titleLink.href = property.url;
    titleLink.textContent = property.title;
    titleLink.target = '_blank';
    titleLink.style.textDecoration = 'none';
    titleLink.style.color = '#333';
    titleLink.style.fontWeight = 'bold';
    titleLink.style.marginBottom = '4px';
    titleLink.style.display = 'block';

    const sourceSite = document.createElement('div');
    sourceSite.className = 'property-source';

    const sourceText = property.hostname ? 
    `Source: ${property.hostname.replace(/^www\./, '').replace(/\.ro$/, '.ro')}` : 
    '';

    sourceSite.textContent = sourceText;
    sourceSite.style.fontSize = '12px';
    sourceSite.style.color = '#666';
    sourceSite.style.marginBottom = '4px';

    // Add price display if available
    const priceElement = document.createElement('div');
    priceElement.className = 'property-price';
    priceElement.textContent = property.price || 'Price not available';
    priceElement.style.fontWeight = 'bold';
    priceElement.style.color = property.price ? '#4CAF50' : '#999';
    priceElement.style.marginBottom = '8px';
    
    const actions = document.createElement('div');
    actions.className = 'property-actions';
    
    // Add appropriate action button based on tab
    if (isFavorite) {
        const unfavoriteButton = document.createElement('button');
        unfavoriteButton.className = 'action-button favorite-button';
        unfavoriteButton.textContent = '⭐ Unfavorite';
        unfavoriteButton.addEventListener('click', () => {
            toggleFavorite(property.id, item);
        });
        actions.appendChild(unfavoriteButton);
    }
    
    if (isIgnored) {
        const unignoreButton = document.createElement('button');
        unignoreButton.className = 'action-button ignore-button';
        unignoreButton.textContent = '🚫 Unignore';
        unignoreButton.addEventListener('click', () => {
            toggleIgnore(property.id, item);
        });
        actions.appendChild(unignoreButton);
    }
    
    // Create content container
    const content = document.createElement('div');
    content.style.display = 'flex';
    content.style.gap = '12px';
    content.style.alignItems = 'flex-start';
    
    // Add thumbnail and info to content
    content.appendChild(thumbnail);
    
    const textContent = document.createElement('div');
    textContent.style.flex = '1';
    textContent.appendChild(titleLink);
    textContent.appendChild(sourceSite);
    textContent.appendChild(priceElement);
    textContent.appendChild(actions);
    
    content.appendChild(textContent);
    item.appendChild(content);
    
    return item;
}

// Function to load favorite properties
function loadFavoriteProperties() {
    const container = document.getElementById('favorite-properties');
    container.innerHTML = ''; // Clear existing content
    
    browserAPI.runtime.sendMessage({ type: 'GET_FAVORITE_PROPERTIES' }, response => {
        if (response.properties && response.properties.length > 0) {
            response.properties.forEach(property => {
                const item = createPropertyItem(property, true);
                container.appendChild(item);
            });
        } else {
            container.innerHTML = '<p>No favorite properties yet.</p>';
        }
    });
}

// Function to load ignored properties
function loadIgnoredProperties() {
    const container = document.getElementById('ignored-properties');
    container.innerHTML = ''; // Clear existing content
    
    browserAPI.runtime.sendMessage({ type: 'GET_IGNORED_PROPERTIES' }, response => {
        if (response.properties && response.properties.length > 0) {
            response.properties.forEach(property => {
                const item = createPropertyItem(property, false, true);
                container.appendChild(item);
            });
        } else {
            container.innerHTML = '<p>No ignored properties yet.</p>';
        }
    });
}

// Function to toggle favorite status
function toggleFavorite(propertyId, item) {
    browserAPI.runtime.sendMessage({
        type: 'TOGGLE_FAVORITE_PROPERTY',
        propertyId: propertyId
    }, response => {
        if (response.success) {
            item.remove(); // Remove the item from the list
            // If the list is now empty, show a message
            const container = document.getElementById('favorite-properties');
            if (container.children.length === 0) {
                container.innerHTML = '<p>No favorite properties yet.</p>';
            }
            
            // Send update to content script
            browserAPI.tabs.query({ active: true, currentWindow: true }, tabs => {
                if (tabs[0]) {
                    browserAPI.tabs.sendMessage(tabs[0].id, {
                        type: 'PROPERTY_STATE_UPDATED',
                        propertyId: propertyId,
                        isFavorite: false,
                        isIgnored: response.isIgnored // Keep the current ignore state
                    });
                }
            });
        }
    });
}

// Function to toggle ignore status
function toggleIgnore(propertyId, item) {
    browserAPI.runtime.sendMessage({
        type: 'TOGGLE_IGNORE_PROPERTY',
        propertyId: propertyId
    }, response => {
        if (response.success) {
            item.remove(); // Remove the item from the list
            // If the list is now empty, show a message
            const container = document.getElementById('ignored-properties');
            if (container.children.length === 0) {
                container.innerHTML = '<p>No ignored properties yet.</p>';
            }
            
            // Send update to content script
            browserAPI.tabs.query({ active: true, currentWindow: true }, tabs => {
                if (tabs[0]) {
                    browserAPI.tabs.sendMessage(tabs[0].id, {
                        type: 'PROPERTY_STATE_UPDATED',
                        propertyId: propertyId,
                        isFavorite: response.isFavorite, // Keep the current favorite state
                        isIgnored: false
                    });
                }
            });
        }
    });
}
