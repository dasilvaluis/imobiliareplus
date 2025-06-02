// buttonState.js
// Contains logic for button creation, styling, and state management

window.setButtonState = function({button, active, activeStyles, inactiveStyles}) {
    Object.assign(button.style, active ? activeStyles : inactiveStyles);
    if (active) button.classList.add('active');
    else button.classList.remove('active');
};

window.createPropertyButtons = function(propertyInfo, siteType, card, browserAPI) {
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

    // Button style configs
    const favoriteActive = {backgroundColor: '#3e8b9c', color: '#fff', border: '1px solid #3e8b9c'};
    const favoriteInactive = {backgroundColor: 'white', color: '#42758C', border: '1px solid #e0e0e0'};
    const ignoreActive = {backgroundColor: '#1e2839', color: '#fff', border: '1px solid #1e2839'};
    const ignoreInactive = {backgroundColor: 'white', color: '#1e2839', border: '1px solid #e0e0e0'};

    // Favorite button
    const favoriteButton = document.createElement('button');
    favoriteButton.className = 'imobiliare-plus-favorite';
    favoriteButton.innerHTML = '<span class="icon">★</span> <span class="text">Favorite</span>';
    Object.assign(favoriteButton.style, favoriteInactive, {
        flex: 1,
        padding: '8px 12px',
        borderRadius: '20px',
        cursor: 'pointer',
        fontWeight: 500,
        fontSize: '13px',
        transition: 'all 0.2s ease',
        boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '6px',
        outline: 'none'
    });

    // Ignore button
    const ignoreButton = document.createElement('button');
    ignoreButton.className = 'imobiliare-plus-ignore';
    ignoreButton.innerHTML = '<span class="icon">✕</span> <span class="text">Hide</span>';
    Object.assign(ignoreButton.style, ignoreInactive, {
        flex: 1,
        padding: '8px 12px',
        borderRadius: '20px',
        cursor: 'pointer',
        fontWeight: 500,
        fontSize: '13px',
        transition: 'all 0.2s ease',
        boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '6px',
        outline: 'none'
    });

    // Hover handlers
    favoriteButton.addEventListener('mouseover', () => {
        if (!favoriteButton.classList.contains('active')) {
            favoriteButton.style.backgroundColor = '#f0f7f9';
            favoriteButton.style.borderColor = '#3e8b9c';
        }
    });
    favoriteButton.addEventListener('mouseout', () => {
        if (!favoriteButton.classList.contains('active')) {
            Object.assign(favoriteButton.style, favoriteInactive);
        }
    });
    ignoreButton.addEventListener('mouseover', () => {
        if (!ignoreButton.classList.contains('active')) {
            ignoreButton.style.backgroundColor = '#f5f6f8';
            ignoreButton.style.borderColor = '#1e2839';
        }
    });
    ignoreButton.addEventListener('mouseout', () => {
        if (!ignoreButton.classList.contains('active')) {
            Object.assign(ignoreButton.style, ignoreInactive);
        }
    });

    // Add buttons to container
    buttonsContainer.appendChild(favoriteButton);
    buttonsContainer.appendChild(ignoreButton);

    // Set initial state
    browserAPI.runtime.sendMessage({ type: 'GET_FAVORITE_PROPERTIES', hostname: propertyInfo.hostname }, response => {
        const isFav = response.properties.some(p => p.id === propertyInfo.id && p.hostname === propertyInfo.hostname);
        window.setButtonState({button: favoriteButton, active: isFav, activeStyles: favoriteActive, inactiveStyles: favoriteInactive});
        favoriteButton.querySelector('.icon').textContent = '★';
    });
    browserAPI.runtime.sendMessage({ type: 'GET_IGNORED_PROPERTIES', hostname: propertyInfo.hostname }, response => {
        const isIgnored = response.properties.some(p => p.id === propertyInfo.id && p.hostname === propertyInfo.hostname);
        window.setButtonState({button: ignoreButton, active: isIgnored, activeStyles: ignoreActive, inactiveStyles: ignoreInactive});
        if (card) card.style.opacity = isIgnored ? '0.6' : '1';
    });

    // Click handlers
    favoriteButton.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();
        favoriteButton.style.transform = 'scale(0.95)';
        setTimeout(() => { favoriteButton.style.transform = 'scale(1)'; }, 100);
        browserAPI.runtime.sendMessage({
            type: 'TOGGLE_FAVORITE_PROPERTY',
            propertyInfo
        }, response => {
            window.setButtonState({
                button: favoriteButton,
                active: response.isFavorite,
                activeStyles: favoriteActive,
                inactiveStyles: favoriteInactive
            });
            favoriteButton.querySelector('.icon').textContent = '★';
        });
    });

    ignoreButton.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();
        ignoreButton.style.transform = 'scale(0.95)';
        setTimeout(() => { ignoreButton.style.transform = 'scale(1)'; }, 100);
        browserAPI.runtime.sendMessage({
            type: 'TOGGLE_IGNORE_PROPERTY',
            propertyInfo
        }, response => {
            window.setButtonState({
                button: ignoreButton,
                active: response.isIgnored,
                activeStyles: ignoreActive,
                inactiveStyles: ignoreInactive
            });
            if (card) card.style.opacity = response.isIgnored ? '0.6' : '1';
        });
    });

    return buttonsContainer;
};
