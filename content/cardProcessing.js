// cardProcessing.js
// Handles adding buttons to cards, processing cards, and updating card appearance

window.addButtonsToCard = function(card) {
    const selectors = window.getPropertySelectors();
    const currentHostname = window.location.hostname;
    const browserAPI = typeof browser !== 'undefined' ? browser : chrome;
    if (!selectors) return;
    if (card.querySelector('.imobiliare-plus-buttons')) return;
    const propertyLinkElement = card.querySelector(selectors.link);
    if (!propertyLinkElement) return;
    const propertyUrl = propertyLinkElement.href;
    let propertyId;
    if (selectors.idRegex) {
        const match = propertyUrl.match(selectors.idRegex);
        if (match && match[1]) propertyId = match[1];
    }
    if (!propertyId) propertyId = btoa(propertyUrl).slice(0, 12);
    const propertyTitle = card.querySelector(selectors.title)?.textContent.trim() || '';
    let thumbnailUrl = '';
    if (typeof selectors.thumbnail === 'function') {
        thumbnailUrl = selectors.thumbnail(card, propertyId) || '';
    } else {
        const thumbnailImgElement = card.querySelector(selectors.thumbnail);
        thumbnailUrl = thumbnailImgElement?.src || '';
    }
    let propertyPrice = '';
    if (selectors.priceExtractor) {
        propertyPrice = selectors.priceExtractor(card) || '';
    } else if (selectors.price) {
        const priceElement = card.querySelector(selectors.price);
        if (priceElement) propertyPrice = priceElement.textContent.trim();
    }
    const propertyInfo = {
        id: propertyId,
        title: propertyTitle,
        url: propertyUrl,
        thumbnail: thumbnailUrl,
        hostname: currentHostname,
        price: propertyPrice
    };
    const buttonsContainer = window.createPropertyButtons(propertyInfo, currentHostname, card, browserAPI);
    card.appendChild(buttonsContainer);
};

window.processPropertyCards = function() {
    const selectors = window.getPropertySelectors();
    if (!selectors) return;
    const cards = document.querySelectorAll(selectors.card);
    cards.forEach(card => window.addButtonsToCard(card));
};

window.updateCardAppearance = function(propertyId, isFavorite, isIgnored, hostname) {
    const selectors = window.getPropertySelectors();
    if (!selectors) return;
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
    if (!cardToUpdate) return;
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
};
