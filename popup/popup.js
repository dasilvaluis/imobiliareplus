// Use browser polyfill for cross-browser compatibility
const browserAPI = typeof browser !== 'undefined' ? browser : chrome;

console.log('ImobiliarePlus extension popup script loaded');

// Track property data globally to enable search and sorting
let favoriteProperties = [];
let ignoredProperties = [];
let currentSearchTerm = '';
let favoriteSortOption = 'default';
let ignoredSortOption = 'default';

document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM Content Loaded in popup');
    
    // Set up tab switching
    setupTabs();
    
    // Set up search functionality
    setupSearch();
    
    // Set up sorting
    setupSorting();
    
    // Load both property types immediately to update badge counts
    Promise.all([
        new Promise(resolve => loadFavoriteProperties(resolve)),
        new Promise(resolve => loadIgnoredProperties(resolve))
    ]).then(() => {
        // Update all badge counts after both data sets are loaded
        updateAllBadgeCounts();
    });
});

function setupTabs() {
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
}

function setupSearch() {
    const searchInput = document.getElementById('searchInput');
    
    searchInput.addEventListener('input', () => {
        currentSearchTerm = searchInput.value.toLowerCase().trim();
        applyCurrentFilters();
    });
}

function setupSorting() {
    const sortFavorites = document.getElementById('sortFavorites');
    const sortIgnored = document.getElementById('sortIgnored');
    
    sortFavorites.addEventListener('change', () => {
        favoriteSortOption = sortFavorites.value;
        if (document.querySelector('.tab-pane.active').id === 'favorites') {
            applyCurrentFilters();
        }
    });
    
    sortIgnored.addEventListener('change', () => {
        ignoredSortOption = sortIgnored.value;
        if (document.querySelector('.tab-pane.active').id === 'ignored') {
            applyCurrentFilters();
        }
    });
}

// Function to apply current filters to active tab
function applyCurrentFilters() {
    const activeTabId = document.querySelector('.tab-pane.active').id;
    
    if (activeTabId === 'favorites') {
        // First apply sorting
        let filteredProperties = [...favoriteProperties];
        if (favoriteSortOption !== 'default') {
            filteredProperties = sortPropertiesArray(filteredProperties, favoriteSortOption);
        }
        
        // Then apply search filter
        if (currentSearchTerm) {
            filteredProperties = filterPropertiesArray(filteredProperties, currentSearchTerm);
        }
        
        // Display the filtered properties
        displayProperties(filteredProperties, 'favorite-properties', true);
    } else {
        // First apply sorting
        let filteredProperties = [...ignoredProperties];
        if (ignoredSortOption !== 'default') {
            filteredProperties = sortPropertiesArray(filteredProperties, ignoredSortOption);
        }
        
        // Then apply search filter
        if (currentSearchTerm) {
            filteredProperties = filterPropertiesArray(filteredProperties, currentSearchTerm);
        }
        
        // Display the filtered properties
        displayProperties(filteredProperties, 'ignored-properties', false, true);
    }
}

// Helper function to filter properties by search term
function filterPropertiesArray(properties, searchTerm) {
    if (!searchTerm) return properties;
    
    return properties.filter(property => {
        return (
            (property.title && property.title.toLowerCase().includes(searchTerm)) ||
            (property.price && property.price.toLowerCase().includes(searchTerm)) ||
            (property.hostname && property.hostname.toLowerCase().includes(searchTerm))
        );
    });
}

// Helper function to sort properties
function sortPropertiesArray(properties, sortOption) {
    if (sortOption === 'default') return properties;
    
    return [...properties].sort((a, b) => {
        switch(sortOption) {
            case 'price-asc':
                const priceA = extractNumericPrice(a.price);
                const priceB = extractNumericPrice(b.price);
                return priceA - priceB;
            case 'price-desc':
                const priceADesc = extractNumericPrice(a.price);
                const priceBDesc = extractNumericPrice(b.price);
                return priceBDesc - priceADesc;
            default:
                return 0;
        }
    });
}

function extractNumericPrice(priceStr) {
    if (!priceStr) return Infinity; // Properties with no price go to the end
    const matches = priceStr.match(/[\d,.]+/g);
    if (matches && matches.length > 0) {
        return parseFloat(matches[0].replace(/[,.]/g, ''));
    }
    return Infinity;
}

// Function to create a property item element
function createPropertyItem(property, isFavorite = false, isIgnored = false) {
    const item = document.createElement('div');
    item.className = 'property-item';
    
    // Create content container
    const content = document.createElement('div');
    content.className = 'property-content';
    
    // Create thumbnail
    const thumbnail = document.createElement('img');
    thumbnail.className = 'property-thumbnail';
    thumbnail.src = property.thumbnail || 'default-property.jpg';
    thumbnail.alt = property.title || 'Property';
    thumbnail.onerror = () => {
        thumbnail.src = 'https://via.placeholder.com/100x75?text=No+Image';
    };
    
    // Create info section
    const info = document.createElement('div');
    info.className = 'property-info';
    
    // Create title link
    const titleLink = document.createElement('a');
    titleLink.className = 'property-title';
    titleLink.href = property.url;
    titleLink.textContent = property.title || 'Unnamed Property';
    titleLink.target = '_blank';
    
    // Create details section
    const details = document.createElement('div');
    details.className = 'property-details';
    
    // Add source
    const source = document.createElement('div');
    source.className = 'property-source';
    source.innerHTML = `<i class="fas fa-globe"></i> ${property.hostname?.replace(/^www\./, '').replace(/\.ro$/, '.ro') || 'Unknown source'}`;
    
    // Add price
    const price = document.createElement('div');
    price.className = 'property-price';
    price.textContent = property.price || 'Price not available';
    
    details.appendChild(source);
    details.appendChild(price);
    
    // Add property stats if available
    let stats = null;
    if (property.rooms || property.area) {
        stats = document.createElement('div');
        stats.className = 'property-stats';
        
        if (property.rooms) {
            const rooms = document.createElement('div');
            rooms.className = 'stat-item';
            rooms.innerHTML = `<i class="fas fa-door-open"></i> ${property.rooms}`;
            stats.appendChild(rooms);
        }
        
        if (property.area) {
            const area = document.createElement('div');
            area.className = 'stat-item';
            area.innerHTML = `<i class="fas fa-vector-square"></i> ${property.area}`;
            stats.appendChild(area);
        }
    }
    
    // Create actions
    const actions = document.createElement('div');
    actions.className = 'property-actions';
    
    // Create main action button
    const mainAction = document.createElement('button');
    mainAction.className = 'action-button main-action';
    
    if (isFavorite) {
        mainAction.innerHTML = '<i class="fas fa-star action-icon"></i> Unfavorite';
        mainAction.addEventListener('click', () => toggleFavorite(property.id, item));
    } else if (isIgnored) {
        mainAction.innerHTML = '<i class="fas fa-undo action-icon"></i> Unignore';
        mainAction.addEventListener('click', () => toggleIgnore(property.id, item));
    }
    
    // Create secondary action button (copy link)
    const copyAction = document.createElement('button');
    copyAction.className = 'action-button secondary-action tooltip';
    copyAction.innerHTML = '<i class="fas fa-copy action-icon"></i>';
    
    const tooltip = document.createElement('span');
    tooltip.className = 'tooltip-text';
    tooltip.textContent = 'Copy link';
    copyAction.appendChild(tooltip);
    
    copyAction.addEventListener('click', () => {
        navigator.clipboard.writeText(property.url).then(() => {
            tooltip.textContent = 'Copied!';
            setTimeout(() => {
                tooltip.textContent = 'Copy link';
            }, 2000);
        });
    });
    
    actions.appendChild(mainAction);
    actions.appendChild(copyAction);
    
    // Assemble all elements
    info.appendChild(titleLink);
    info.appendChild(details);
    if (stats) info.appendChild(stats);
    info.appendChild(actions);
    
    content.appendChild(thumbnail);
    content.appendChild(info);
    item.appendChild(content);
    
    return item;
}

function displayProperties(properties, containerId, isFavorite = false, isIgnored = false) {
    const container = document.getElementById(containerId);
    const emptyStateId = isFavorite ? 'favorites-empty' : 'ignored-empty';
    const emptyState = document.getElementById(emptyStateId);
    
    // Clear the container
    container.innerHTML = '';
    
    if (properties.length > 0) {
        emptyState.style.display = 'none';
        container.style.display = 'flex';
        
        properties.forEach(property => {
            const item = createPropertyItem(property, isFavorite, isIgnored);
            container.appendChild(item);
        });
        
        // Badge counts are now updated separately in updateAllBadgeCounts
    } else {
        container.style.display = 'none';
        emptyState.style.display = 'flex';
        
        // If it's an empty result from filtering, show appropriate message
        if (currentSearchTerm) {
            emptyState.innerHTML = `
                <i class="fas fa-search empty-icon"></i>
                <p>No results found</p>
                <p class="empty-hint">Try different search terms</p>
            `;
        } else {
            // Default empty state
            if (isFavorite) {
                emptyState.innerHTML = `
                    <i class="fas fa-star empty-icon"></i>
                    <p>No favorite properties yet</p>
                    <p class="empty-hint">Browse property websites and click the star icon to add favorites</p>
                `;
            } else {
                emptyState.innerHTML = `
                    <i class="fas fa-ban empty-icon"></i>
                    <p>No ignored properties</p>
                    <p class="empty-hint">Browse property websites and click the ignore icon to hide properties</p>
                `;
            }
        }
    }
}

function updateAllBadgeCounts() {
    updateBadgeCount('favorites-count', favoriteProperties.length);
    updateBadgeCount('ignored-count', ignoredProperties.length);
}

// Function to load favorite properties
function loadFavoriteProperties(callback = null) {
    // Show loading state
    const container = document.getElementById('favorite-properties');
    const emptyState = document.getElementById('favorites-empty');
    
    container.innerHTML = '<div class="spinner"></div>';
    emptyState.style.display = 'none';
    container.style.display = 'flex';
    
    // Set the select to match current sort option
    document.getElementById('sortFavorites').value = favoriteSortOption;
    
    // Set search input to current search term
    document.getElementById('searchInput').value = currentSearchTerm;
    
    browserAPI.runtime.sendMessage({ type: 'GET_FAVORITE_PROPERTIES' }, response => {
        if (response && response.properties) {
            favoriteProperties = response.properties;
            applyCurrentFilters(); // Apply filters after loading
        } else {
            // Handle error or empty state
            favoriteProperties = [];
            displayProperties([], 'favorite-properties', true);
        }
        
        // Update badge counts regardless of active tab
        updateAllBadgeCounts();
        
        // Call the callback if provided
        if (callback) callback();
    });
}

// Function to load ignored properties
function loadIgnoredProperties(callback = null) {
    // Show loading state
    const container = document.getElementById('ignored-properties');
    const emptyState = document.getElementById('ignored-empty');
    
    container.innerHTML = '<div class="spinner"></div>';
    emptyState.style.display = 'none';
    container.style.display = 'flex';
    
    // Set the select to match current sort option
    document.getElementById('sortIgnored').value = ignoredSortOption;
    
    // Set search input to current search term
    document.getElementById('searchInput').value = currentSearchTerm;
    
    browserAPI.runtime.sendMessage({ type: 'GET_IGNORED_PROPERTIES' }, response => {
        if (response && response.properties) {
            ignoredProperties = response.properties;
            
            // Only apply filters to active tab
            if (document.querySelector('.tab-pane.active').id === 'ignored') {
                applyCurrentFilters();
            }
        } else {
            // Handle error or empty state
            ignoredProperties = [];
            if (document.querySelector('.tab-pane.active').id === 'ignored') {
                displayProperties([], 'ignored-properties', false, true);
            }
        }
        
        // Update badge counts regardless of active tab
        updateAllBadgeCounts();
        
        // Call the callback if provided
        if (callback) callback();
    });
}

// Function to update badge count
function updateBadgeCount(badgeId, count) {
    const badge = document.getElementById(badgeId);
    if (badge) {
        badge.textContent = count;
    }
}

// Function to toggle favorite status
function toggleFavorite(propertyId, item) {
    browserAPI.runtime.sendMessage({
        type: 'TOGGLE_FAVORITE_PROPERTY',
        propertyId: propertyId
    }, response => {
        if (response && response.success) {
            // Remove the property from our local array
            favoriteProperties = favoriteProperties.filter(p => p.id !== propertyId);
            
            // Remove the item from the DOM
            item.remove();
            
            // Update the empty state if needed
            if (favoriteProperties.length === 0) {
                document.getElementById('favorite-properties').style.display = 'none';
                document.getElementById('favorites-empty').style.display = 'flex';
            }
            
            // Update all badge counts
            updateAllBadgeCounts();
            
            // Send update to content script
            notifyContentScriptOfUpdate(propertyId, false, response.isIgnored || false);
        }
    });
}

// Function to toggle ignore status
function toggleIgnore(propertyId, item) {
    browserAPI.runtime.sendMessage({
        type: 'TOGGLE_IGNORE_PROPERTY',
        propertyId: propertyId
    }, response => {
        if (response && response.success) {
            // Remove the property from our local array
            ignoredProperties = ignoredProperties.filter(p => p.id !== propertyId);
            
            // Remove the item from the DOM
            item.remove();
            
            // Update the empty state if needed
            if (ignoredProperties.length === 0) {
                document.getElementById('ignored-properties').style.display = 'none';
                document.getElementById('ignored-empty').style.display = 'flex';
            }
            
            // Update all badge counts
            updateAllBadgeCounts();
            
            // Send update to content script
            notifyContentScriptOfUpdate(propertyId, response.isFavorite || false, false);
        }
    });
}

// Function to notify content script about property state updates
function notifyContentScriptOfUpdate(propertyId, isFavorite, isIgnored) {
    browserAPI.tabs.query({ active: true, currentWindow: true }, tabs => {
        if (tabs[0]) {
            browserAPI.tabs.sendMessage(tabs[0].id, {
                type: 'PROPERTY_STATE_UPDATED',
                propertyId: propertyId,
                isFavorite: isFavorite,
                isIgnored: isIgnored
            });
        }
    });
}
