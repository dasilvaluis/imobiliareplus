// background.js
const browserAPI = typeof browser !== 'undefined' ? browser : chrome;

// Now use browserAPI instead of chrome or browser
browserAPI.runtime.onInstalled.addListener((details) => {
  if (details.reason === "install") {
    console.log("ImobiliarePlus extension installed");
    // Initialize storage with empty lists
    browserAPI.storage.local.set({
      ignoredProperties: [],
      favoriteProperties: []
    });
  }
});

// Example of handling a message
browserAPI.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Message received in background:', message);
  
  switch (message.type) {
    case "TEST_MESSAGE":
      console.log('Test message received');
      sendResponse({ status: 'success' });
      break;
    case "TOGGLE_IGNORE_PROPERTY":
      toggleIgnoreProperty(message.propertyInfo || message.propertyId, sendResponse);
      return true;
    case "TOGGLE_FAVORITE_PROPERTY":
      console.log('Toggling favorite property:', message.propertyInfo || message.propertyId);
      toggleFavoriteProperty(message.propertyInfo || message.propertyId, sendResponse);
      return true;
    case "GET_IGNORED_PROPERTIES":
      getIgnoredProperties(sendResponse);
      return true;
    case "GET_FAVORITE_PROPERTIES":
      getFavoriteProperties(sendResponse);
      return true;
  }
});

// Toggle ignore status of a property
function toggleIgnoreProperty(propertyInfo, sendResponse) {
  // If we received just an ID, get the property info from storage
  if (typeof propertyInfo === 'string') {
    browserAPI.storage.local.get(['ignoredProperties'], (result) => {
      const ignoredProperties = result.ignoredProperties || [];
      const property = ignoredProperties.find(p => p.id === propertyInfo);
      if (property) {
        toggleIgnoreProperty(property, sendResponse);
      } else {
        sendResponse({ success: false, error: 'Property not found' });
      }
    });
    return;
  }

  browserAPI.storage.local.get(['ignoredProperties'], (result) => {
    const ignoredProperties = result.ignoredProperties || [];
    const existingIndex = ignoredProperties.findIndex(p => p.id === propertyInfo.id);
    
    if (existingIndex !== -1) {
      // Remove from ignored list
      ignoredProperties.splice(existingIndex, 1);
      browserAPI.storage.local.set({ ignoredProperties }, () => {
        sendResponse({ success: true, isIgnored: false });
      });
    } else {
      // Add to ignored list
      ignoredProperties.push(propertyInfo);
      browserAPI.storage.local.set({ ignoredProperties }, () => {
        sendResponse({ success: true, isIgnored: true });
      });
    }
  });
}

// Toggle favorite status of a property
function toggleFavoriteProperty(propertyInfo, sendResponse) {
  // If we received just an ID, get the property info from storage
  if (typeof propertyInfo === 'string') {
    browserAPI.storage.local.get(['favoriteProperties'], (result) => {
      const favoriteProperties = result.favoriteProperties || [];
      const property = favoriteProperties.find(p => p.id === propertyInfo);
      if (property) {
        toggleFavoriteProperty(property, sendResponse);
      } else {
        sendResponse({ success: false, error: 'Property not found' });
      }
    });
    return;
  }

  browserAPI.storage.local.get(['favoriteProperties'], (result) => {
    const favoriteProperties = result.favoriteProperties || [];
    const existingIndex = favoriteProperties.findIndex(p => p.id === propertyInfo.id);
    
    if (existingIndex !== -1) {
      // Remove from favorites
      favoriteProperties.splice(existingIndex, 1);
      browserAPI.storage.local.set({ favoriteProperties }, () => {
        sendResponse({ success: true, isFavorite: false });
      });
    } else {
      // Add to favorites
      favoriteProperties.push(propertyInfo);
      browserAPI.storage.local.set({ favoriteProperties }, () => {
        sendResponse({ success: true, isFavorite: true });
      });
    }
  });
}

// Get list of ignored properties
function getIgnoredProperties(sendResponse) {
  browserAPI.storage.local.get(['ignoredProperties'], (result) => {
    sendResponse({ properties: result.ignoredProperties || [] });
  });
}

// Get list of favorite properties
function getFavoriteProperties(sendResponse) {
  browserAPI.storage.local.get(['favoriteProperties'], (result) => {
    sendResponse({ properties: result.favoriteProperties || [] });
  });
}