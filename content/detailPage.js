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
    }
};
