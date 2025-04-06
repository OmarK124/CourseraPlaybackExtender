// Default settings that can be overridden by popup settings
let settings = {
    modifierKey: 'ctrl',
    speedUpKey: '.',
    speedDownKey: ',',
    minSpeed: 0.75,
    maxSpeed: 10,
    speedIncrement: 0.25
};

// Generate speed options based on settings
let speedOptions = [];
function generateSpeedOptions() {
    speedOptions = [];
    for (let speed = settings.minSpeed; speed <= settings.maxSpeed; speed += settings.speedIncrement) {
        // Round to 2 decimal places to avoid floating point errors
        speedOptions.push(Math.round(speed * 100) / 100);
    }
}

// Track the current speed index - will be set when video is found
let currentSpeedIndex = 1; // Default fallback value

// Function to set playback speed
function setPlaybackSpeed(speed) {
    const videoElement = document.querySelector('video');
    if (videoElement) {
        videoElement.playbackRate = speed;

        // Update the button text
        const speedButton = document.querySelector('button[aria-label="Video playback rate switcher"] .css-mo5xzj');
        if (speedButton) {
            speedButton.textContent = speed + 'x';
        }
    }
}


// Function to cycle through speeds
function cycleSpeedUp() {
    currentSpeedIndex = Math.min(currentSpeedIndex + 1, speedOptions.length - 1);
    setPlaybackSpeed(speedOptions[currentSpeedIndex]);
}

function cycleSpeedDown() {
    currentSpeedIndex = Math.max(currentSpeedIndex - 1, 0);
    setPlaybackSpeed(speedOptions[currentSpeedIndex]);
}


// Setup keyboard shortcuts
function setupKeyboardShortcuts() {
    window.addEventListener('keydown', function (event) {
        // Use the modifier key from settings, or consider it active if set to 'none'
        const modifierActive = settings.modifierKey === 'none' ? true :
            (settings.modifierKey === 'ctrl' ? event.ctrlKey : event.shiftKey);

        // Speed up shortcut
        if (modifierActive && event.key === settings.speedUpKey) {
            event.preventDefault();
            cycleSpeedUp();
        }
        // Speed down shortcut
        else if (modifierActive && event.key === settings.speedDownKey) {
            event.preventDefault();
            cycleSpeedDown();
        }
    }, true);
}

// Intercept button clicks
function interceptSpeedButton() {
    // Prevent context menu on speed button
    document.addEventListener('contextmenu', function (event) {
        const button = event.target.closest('button[aria-label="Video playback rate switcher"]');
        if (button) {
            event.preventDefault();
            cycleSpeedDown();
            return false;
        }
    }, true);

    document.addEventListener('click', function (event) {
        const button = event.target.closest('button[aria-label="Video playback rate switcher"]');
        if (button) {
            event.preventDefault();
            event.stopPropagation();
            // Use our custom cycling instead
            if (event.button === 0) {
                cycleSpeedUp();
            }
            return false;
        }
    }, true);
}

// Function to get playback rate from localStorage
function getPlaybackRateFromStorage() {
    // Default fallback rate
    let currentRate = 1;

    // Find the key in localStorage that matches the pattern
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.endsWith('.userPreferences')) {
            try {
                const preferences = JSON.parse(localStorage.getItem(key));
                if (preferences && preferences.playbackRate) {
                    currentRate = preferences.playbackRate;
                    break;
                }
            } catch (e) {
            }
        }
    }

    return currentRate;
}

// Load settings from chrome.storage
function loadSettings() {
    chrome.storage.sync.get(settings, function (savedSettings) {
        settings = savedSettings;
        generateSpeedOptions();

        // Re-initialize if already started
        if (initialized) {
            // Get current playback rate from localStorage
            const currentRate = getPlaybackRateFromStorage();

            // Find closest speed in our options
            currentSpeedIndex = 0;
            let closestDiff = Math.abs(speedOptions[0] - currentRate);

            for (let i = 1; i < speedOptions.length; i++) {
                const diff = Math.abs(speedOptions[i] - currentRate);
                if (diff < closestDiff) {
                    closestDiff = diff;
                    currentSpeedIndex = i;
                }
            }

            // Apply current speed
            setPlaybackSpeed(speedOptions[currentSpeedIndex]);
        }
    });
}

// Initialize extension when the speed button is available
function initialize() {
    // Generate speed options
    generateSpeedOptions();

    // Get current playback rate from localStorage
    const currentRate = getPlaybackRateFromStorage();

    // Set the current speed index based on the found rate
    currentSpeedIndex = speedOptions.findIndex(speed => speed >= currentRate);
    if (currentSpeedIndex === -1) currentSpeedIndex = 1; // Default to 1x if not found

}

// Setup everything when DOM is ready
function setup() {
    initialize();
    interceptSpeedButton();
}

// Variables to track initialization status
let initialized = false;
let keyboardShortcutsInitialized = false;

// Main initialization function
function initExtension() {
    // Only set up keyboard shortcuts once
    if (!keyboardShortcutsInitialized) {
        setupKeyboardShortcuts();
        keyboardShortcutsInitialized = true;
    }

    if (initialized) return; // Prevent multiple initializations of other components

    const videoElement = document.querySelector('video');
    const speedButton = document.querySelector('button[aria-label="Video playback rate switcher"]');

    if (videoElement && speedButton) {
        setup();
        initialized = true;
    }
}

// Run when DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
        loadSettings();
        initExtension();
        setupObserver();
    });
} else {
    loadSettings();
    initExtension();
    setupObserver();
}

// Set up MutationObserver to handle dynamic content loading
function setupObserver() {
    // Only create one observer
    const observer = new MutationObserver(function (mutations) {
        if (!initialized) {
            initExtension();
        }
    });

    observer.observe(document.body, { childList: true, subtree: true });
}

// Listen for messages from popup.js
chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
    if (message.action === 'updateSettings') {
        settings = message.settings;
        generateSpeedOptions();

        // Update current index based on current speed if video is playing
        const videoElement = document.querySelector('video');
        if (videoElement && initialized) {
            const currentSpeed = videoElement.playbackRate;

            // Find closest speed in our options
            currentSpeedIndex = 0;
            let closestDiff = Math.abs(speedOptions[0] - currentSpeed);

            for (let i = 1; i < speedOptions.length; i++) {
                const diff = Math.abs(speedOptions[i] - currentSpeed);
                if (diff < closestDiff) {
                    closestDiff = diff;
                    currentSpeedIndex = i;
                }
            }
        }
    }
}); 