# ImobiliarePlus Browser Extension

A cross-browser extension that works on both Chrome and Firefox.

## Development Setup

1. Clone this repository
2. Install dependencies (if any)
3. Make your changes to the code

## Building the Extension

Before loading the extension, you need to build it for your target browser:

```bash
# For Chrome
./build.sh chrome

# For Firefox
./build.sh firefox
```

This will create the appropriate `manifest.json` file for your browser.

## Loading the Extension

### Chrome
1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" in the top right
3. Click "Load unpacked" and select the extension directory

### Firefox
1. Open Firefox and navigate to `about:debugging`
2. Click "This Firefox"
3. Click "Load Temporary Add-on"
4. Select the extension directory

## Project Structure

```
.
├── build.sh                 # Build script for different browsers
├── manifest-chrome.json     # Chrome manifest (V3)
├── manifest-firefox.json    # Firefox manifest (V2)
├── manifest.json            # Generated manifest (do not edit directly)
├── popup/                   # Popup interface
│   ├── popup.html
│   ├── popup.css
│   └── popup.js
├── background/              # Background scripts
│   ├── background.js        # Chrome background script
│   └── background-firefox.js # Firefox background script
├── content/                 # Content scripts
│   └── content.js
└── icons/                   # Extension icons
    ├── icon-48.png
    └── icon-96.png
```

## Features

- Cross-browser compatibility (Chrome and Firefox)
- Basic popup interface
- Background script for extension management
- Content script for webpage interaction
- Storage capabilities for settings

## Notes

- Chrome uses Manifest V3 with service workers
- Firefox uses Manifest V2 with background scripts
- Use the build script to generate the correct manifest.json
- Icons are required in 48x48 and 96x96 sizes 