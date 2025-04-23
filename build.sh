#!/bin/bash

# Check if browser argument is provided
if [ -z "$1" ]; then
    echo "Usage: ./build.sh [chrome|firefox]"
    exit 1
fi

# Remove existing manifest.json if it exists
if [ -f "manifest.json" ]; then
    rm manifest.json
fi

# Copy the appropriate manifest based on the browser
case "$1" in
    chrome)
        echo "Building for Chrome..."
        cp manifest-chrome.json manifest.json
        ;;
    firefox)
        echo "Building for Firefox..."
        cp manifest-firefox.json manifest.json
        ;;
    *)
        echo "Invalid browser. Use 'chrome' or 'firefox'"
        exit 1
        ;;
esac

echo "Build complete! manifest.json has been created for $1" 