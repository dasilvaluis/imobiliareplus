// detailPage.js
// Handles logic for adding buttons to property detail pages

window.addButtonsToDetailPage = function() {
    const currentHostname = window.location.hostname;
    const browserAPI = typeof browser !== 'undefined' ? browser : chrome;
    if (currentHostname.includes('imobiliare.ro')) {
        const propertyId = window.getImobiliareDetailPageId();
        if (!propertyId) return;
        const propertyInfo = {
            id: propertyId,
            title: window.getImobiliareDetailPageTitle(),
            url: window.location.href,
            thumbnail: window.getImobiliareDetailPageThumbnail(),
            hostname: currentHostname,
            price: window.getImobiliareDetailPagePrice()
        };
        const targetElement = document.querySelector('div.agent-contact-enquiry.mt-0');
        if (!targetElement) return;
        if (targetElement.querySelector('.imobiliare-plus-buttons-detail-page')) return;
        const buttonsContainer = window.createPropertyButtons(propertyInfo, 'imobiliare', null, browserAPI);
        buttonsContainer.classList.add('imobiliare-plus-buttons-detail-page');
        buttonsContainer.style.marginTop = '15px';
        buttonsContainer.style.marginBottom = '15px';
        buttonsContainer.style.padding = '0';
        buttonsContainer.querySelectorAll('button').forEach(button => {
            button.style.padding = '6px 10px';
            button.style.fontSize = '12px';
        });
        targetElement.appendChild(buttonsContainer);
    } else if (currentHostname.includes('storia.ro')) {
        const propertyId = window.getStoriaDetailPageId();
        if (!propertyId) return;
        const propertyInfo = {
            id: propertyId,
            title: window.getStoriaDetailPageTitle(),
            url: window.location.href,
            thumbnail: window.getStoriaDetailPageThumbnail(),
            hostname: currentHostname,
            price: window.getStoriaDetailPagePrice()
        };
        const targetElement = document.querySelector('div[data-sentry-element="ActionButtonsContainer"]');
        if (!targetElement) return;
        const buttonClassName = 'storia-plus-buttons-detail-page';
        if (targetElement.querySelector('.' + buttonClassName)) return;
        const buttonsContainer = window.createPropertyButtons(propertyInfo, 'storia', null, browserAPI);
        buttonsContainer.classList.add(buttonClassName);
        buttonsContainer.style.display = 'inline-flex';
        buttonsContainer.style.marginLeft = '8px';
        buttonsContainer.style.gap = '8px';
        buttonsContainer.style.marginTop = '0';
        buttonsContainer.style.marginBottom = '0';
        buttonsContainer.style.padding = '0';
        buttonsContainer.style.width = 'auto';
        buttonsContainer.querySelectorAll('button').forEach(button => {
            button.style.backgroundColor = 'transparent';
            button.style.border = '1px solid #e0e0e0';
            button.style.boxShadow = 'none';
            button.style.color = '#007882';
            button.style.padding = '8px 12px';
            button.style.flex = '0 1 auto';
            button.style.width = 'auto';
            button.addEventListener('mouseover', () => {
                if (!button.classList.contains('active')) {
                    button.style.backgroundColor = '#f0f7f9';
                    button.style.borderColor = '#007882';
                }
            });
            button.addEventListener('mouseout', () => {
                if (!button.classList.contains('active')) {
                    button.style.backgroundColor = 'transparent';
                    button.style.borderColor = '#e0e0e0';
                }
            });
        });
        // Active state styling
        const favoriteButton = buttonsContainer.querySelector('.imobiliare-plus-favorite');
        const ignoreButton = buttonsContainer.querySelector('.imobiliare-plus-ignore');
        if (favoriteButton?.classList.contains('active')) {
            favoriteButton.style.backgroundColor = '#007882';
            favoriteButton.style.color = '#ffffff';
            favoriteButton.style.borderColor = '#007882';
        }
        if (ignoreButton?.classList.contains('active')) {
            ignoreButton.style.backgroundColor = '#1e2839';
            ignoreButton.style.color = '#ffffff';
            ignoreButton.style.borderColor = '#1e2839';
        }
        targetElement.appendChild(buttonsContainer);
    } else if (currentHostname.includes('olx.ro')) {
        const propertyId = window.getOlxDetailPageId();
        if (!propertyId) {
            console.log("ImobiliarePlus: OLX Property ID not found on detail page.");
            return;
        }
        
        const propertyInfo = {
            id: propertyId,
            title: window.getOlxDetailPageTitle(),
            url: window.location.href,
            thumbnail: window.getOlxDetailPageThumbnail(),
            hostname: currentHostname,
            price: window.getOlxDetailPagePrice()
        };
        
        const targetElement = document.querySelector('nav[role="navigation"]');
        if (!targetElement) {
            console.log("ImobiliarePlus: OLX target element for buttons not found.");
            return;
        }
        if (targetElement.querySelector('.imobiliare-plus-buttons-detail-page')) return;
        const buttonsContainer = window.createPropertyButtons(propertyInfo, 'olx', null, browserAPI);
        buttonsContainer.classList.add('imobiliare-plus-buttons-detail-page');
        
        // Apply styles with !important to prevent overrides
        buttonsContainer.style.cssText = `
            margin-top: 10px !important;
            margin-bottom: 10px !important;
            padding: 10px !important;
            border: 1px solid #ddd !important;
            border-radius: 4px !important;
            display: flex !important;
            gap: 10px !important;
            justify-content: space-around !important;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif !important;
            box-sizing: border-box !important;
        `;
        
        buttonsContainer.querySelectorAll('button').forEach(button => {
            button.style.cssText = `
                padding: 8px 12px !important;
                font-size: 14px !important;
                flex: 1 1 0% !important;
                border-radius: 20px !important;
                cursor: pointer !important;
                font-weight: 500 !important;
                transition: 0.2s !important;
                box-shadow: rgba(0, 0, 0, 0.08) 0px 1px 3px !important;
                display: flex !important;
                align-items: center !important;
                justify-content: center !important;
                gap: 6px !important;
                outline: none !important;
                background-color: white !important;
                border: 1px solid rgb(224, 224, 224) !important;
                color: rgb(30, 40, 57) !important;
            `;
        });
        
            targetElement.appendChild(buttonsContainer);
    }
};
