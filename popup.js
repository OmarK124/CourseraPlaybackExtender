document.addEventListener('DOMContentLoaded', function () {
    // DOM elements
    const modifierKeySelect = document.getElementById('modifier-key');
    const speedUpKeyInput = document.getElementById('speed-up-key');
    const speedDownKeyInput = document.getElementById('speed-down-key');
    const minSpeedInput = document.getElementById('min-speed');
    const maxSpeedInput = document.getElementById('max-speed');
    const speedIncrementInput = document.getElementById('speed-increment');
    const saveButton = document.getElementById('save-btn');
    const resetButton = document.getElementById('reset-btn');
    const statusMessage = document.getElementById('status');

    // Default settings
    const defaultSettings = {
        modifierKey: 'ctrl',
        speedUpKey: '.',
        speedDownKey: ',',
        minSpeed: 0.75,
        maxSpeed: 10,
        speedIncrement: 0.25
    };

    // Load saved settings
    function loadSettings() {
        chrome.storage.sync.get(defaultSettings, function (settings) {
            modifierKeySelect.value = settings.modifierKey;
            speedUpKeyInput.value = settings.speedUpKey;
            speedDownKeyInput.value = settings.speedDownKey;
            minSpeedInput.value = settings.minSpeed;
            maxSpeedInput.value = settings.maxSpeed;
            speedIncrementInput.value = settings.speedIncrement;
        });
    }

    // Save settings
    function saveSettings() {
        // Validate inputs
        if (!validateInputs()) {
            return;
        }

        const settings = {
            modifierKey: modifierKeySelect.value,
            speedUpKey: speedUpKeyInput.value,
            speedDownKey: speedDownKeyInput.value,
            minSpeed: parseFloat(minSpeedInput.value),
            maxSpeed: parseFloat(maxSpeedInput.value),
            speedIncrement: parseFloat(speedIncrementInput.value)
        };

        chrome.storage.sync.set(settings, function () {
            showStatus('Settings saved successfully!', 'success');

            // Send message to content script to update settings
            chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
                if (tabs[0]) {
                    chrome.tabs.sendMessage(tabs[0].id, {
                        action: 'updateSettings',
                        settings: settings
                    });
                }
            });
        });
    }

    // Reset settings to default
    function resetSettings() {
        modifierKeySelect.value = defaultSettings.modifierKey;
        speedUpKeyInput.value = defaultSettings.speedUpKey;
        speedDownKeyInput.value = defaultSettings.speedDownKey;
        minSpeedInput.value = defaultSettings.minSpeed;
        maxSpeedInput.value = defaultSettings.maxSpeed;
        speedIncrementInput.value = defaultSettings.speedIncrement;

        saveSettings();
    }

    // Validate inputs
    function validateInputs() {
        // Check if speed keys are single characters
        if (speedUpKeyInput.value.length !== 1 || speedDownKeyInput.value.length !== 1) {
            showStatus('Speed keys must be a single character', 'error');
            return false;
        }

        // Check if min/max speeds are valid
        const minSpeed = parseFloat(minSpeedInput.value);
        const maxSpeed = parseFloat(maxSpeedInput.value);

        if (minSpeed >= maxSpeed) {
            showStatus('Min speed must be less than max speed', 'error');
            return false;
        }

        return true;
    }

    // Show status message
    function showStatus(message, type) {
        statusMessage.textContent = message;
        statusMessage.className = 'status-message show ' + type;

        setTimeout(() => {
            statusMessage.className = 'status-message';
        }, 3000);
    }

    // Add event listeners
    saveButton.addEventListener('click', saveSettings);
    resetButton.addEventListener('click', resetSettings);

    // Initialize
    loadSettings();
}); 