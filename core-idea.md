# Core project idea

This document represents the main idea behind this extension.

The website https://www.imobiliare.ro/ shows houses and apartments for sale or for rent.

In my filters often I see ads that I am not interested. I would like to mark these in a list of ignored ones so that they won't appear in the listing. I would still be able to see a list of ignored properties in the window of the extension. I would like to be able to select which ads I want to ignore. I would like that the extension would give me an option to toggle ignored ads in the website, but marked them with a different color or a label.

At the same time I see properties that I am interested, and would like those to be more visible, or be in a separate list in the extension pop up. We can mark them the most desired ones with something extra, and have a list of them in the extention pop up.

The website has two sections. One is a map with pins with a price mark only, and another section that has a vertical list view of the properties in view as cards.

If I click on the pins on the map I see a small card similar to the card on the vertical list.

## Implementation

Every property has a "listing-id" that uniquely represents each property. We could use this id to mark properties as ignored. The ignored list could be kept in local storage so that we keep it for future page loads.

The cards contain a link to the thumbnail of the property, and other metadata such as the title, price point, location and some tags.

Each card has title, thumbnail, title name, price, location, url of the page, and a list of tags that define the property such as number of rooms (camere), area, floor (etaj), etc.

We can use all this metadata to list the ignored properties on the extension popup

We can have a toggle in the pop up window that will show or hide the ignored properties.

We can have a tab selection to view the ignored and prefered properties.

We want to toggle the preferred ones to be the only ones visible in the map and list
