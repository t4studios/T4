// options.js

import { updateAnimations, updateSfxVolume } from './game.js';

const optionsModal = document.getElementById('settings-modal');
const optionsContainer = document.getElementById('settings-options-container');
const settingsCloseBtn = document.getElementById('settings-close');
const confirmResetOptionsModal = document.getElementById('confirm-reset-options-modal');
const resetOptionsContinueBtn = document.getElementById('reset-options-continue');
const resetOptionsCancelBtn = document.getElementById('reset-options-cancel');

// Retrieve options from localStorage or use defaults
let options = JSON.parse(localStorage.getItem('options'));

if (!options) {
    options = {
        performanceMode: false,
        particles: true,
        animatedBackground: true,
        clickAnim: true,
        saveToast: true,
        showFPSCounter: false,
        showClicksCounter: true,
        showClicksPerSecond: true,
        musicVolume: 100,
        soundsVolume: 100,
        cpsLimit: 16,
        showClickerCircle: true,
        showStatsText: true,
        tutorialShown: false, // New: tutorial shown flag
    };
} else {
    // Ensure volume values are valid numbers
    if (isNaN(parseFloat(options.musicVolume))) {
        options.musicVolume = 100;
    }
    if (isNaN(parseFloat(options.soundsVolume))) {
        options.soundsVolume = 100;
    }
    // Set new options to default if they don't exist
    if (options.showClickerCircle === undefined) {
        options.showClickerCircle = true;
    }
    if (options.showStatsText === undefined) {
        options.showStatsText = true;
    }
    if (options.cpsLimit === undefined) {
        options.cpsLimit = 16;
    }
    if (options.tutorialShown === undefined) {
        options.tutorialShown = false; // New: tutorial shown flag
    }
}

const optionsConfig = [
    { key: 'musicVolume', label: 'Music Volume', description: 'Adjust the volume of the in-game music.', type: 'slider', min: 0, max: 100, step: 1, class: 'volume-slider' },
    { key: 'soundsVolume', label: 'Sound Effects Volume', description: 'Adjust the volume of sound effects, like clicks.', type: 'slider', min: 0, max: 100, step: 1, class: 'volume-slider' },
    { key: 'cpsLimit', label: 'CPS Limit', description: 'Set the maximum allowed clicks per second.', type: 'slider', min: 8, max: 18, step: 1, class: 'cps-limit-slider' },
    { key: 'animatedBackground', label: 'Animated Background', description: 'Enable the animated background for the entire game window.' },
    { key: 'particles', label: 'Background Particles', description: 'Toggle the animated background star particles.' },
    { key: 'performanceMode', label: 'Performance Mode', description: 'Limits FPS to 30 for better performance on slower devices.' },
    { key: 'clickAnim', label: 'Click Animations', description: 'Show the "+1" animation on click.' },
    { key: 'saveToast', label: 'Save Toast Notification', description: 'Show a notification when your progress is saved.' },
    { key: 'showFPSCounter', label: 'Show FPS Counter', description: 'Displays the frames per second and an overload indicator.' },
    { key: 'showClicksCounter', label: 'Show Click Counter', description: 'Displays the total click count.' },
    { key: 'showClicksPerSecond', label: 'Show Clicks Per Second', description: 'Displays the current clicks per second.' },
    { key: 'showClickerCircle', label: 'Show Clicker Circle', description: 'Toggles the visibility of the large clicker circle.' },
    { key: 'showStatsText', label: 'Show Stats Text', description: 'Toggles the visibility of the clicks per second text at the bottom.' },
];

const saveOptions = () => {
    localStorage.setItem('options', JSON.stringify(options));
    updateAnimations(options);
};

const createOptionElement = (config) => {
    const optionDiv = document.createElement('div');
    optionDiv.classList.add('setting-item');

    const labelContainer = document.createElement('div');
    const label = document.createElement('p');
    label.classList.add('setting-label');
    label.textContent = config.label;
    labelContainer.appendChild(label);
    if (config.description) {
        const description = document.createElement('p');
        description.classList.add('setting-description');
        description.textContent = config.description;
        labelContainer.appendChild(description);
    }

    const switchLabel = document.createElement('label');
    switchLabel.classList.add('switch');

    const switchInput = document.createElement('input');
    switchInput.type = 'checkbox';
    switchInput.checked = options[config.key];
    switchInput.addEventListener('change', () => {
        options[config.key] = switchInput.checked;
        saveOptions();
    });

    const slider = document.createElement('span');
    slider.classList.add('slider', 'round');

    switchLabel.appendChild(switchInput);
    switchLabel.appendChild(slider);

    optionDiv.appendChild(labelContainer);
    optionDiv.appendChild(switchLabel);
    
    return optionDiv;
};

const createSliderElement = (config) => {
    const optionDiv = document.createElement('div');
    optionDiv.classList.add('setting-item');
    optionDiv.style.flexDirection = 'column';
    optionDiv.style.alignItems = 'flex-start';

    const label = document.createElement('p');
    label.classList.add('setting-label');
    label.textContent = config.label;
    optionDiv.appendChild(label);
    
    if (config.description) {
        const description = document.createElement('p');
        description.classList.add('setting-description');
        description.textContent = config.description;
        optionDiv.appendChild(description);
    }
    
    const sliderContainer = document.createElement('div');
    sliderContainer.classList.add('slider-container');
    sliderContainer.style.marginTop = '10px';
    sliderContainer.style.width = '100%';
    
    const sliderInput = document.createElement('input');
    sliderInput.type = 'range';
    sliderInput.min = config.min;
    sliderInput.max = config.max;
    sliderInput.step = config.step;
    sliderInput.value = options[config.key];
    sliderInput.id = `${config.key}-slider`;
    sliderInput.classList.add(config.class);
    sliderInput.style.width = 'calc(100% - 40px)';
    
    const valueDisplay = document.createElement('span');
    valueDisplay.classList.add('slider-value');
    valueDisplay.id = `${config.key}-value`;
    valueDisplay.textContent = options[config.key];

    sliderInput.addEventListener('input', (event) => {
        options[config.key] = parseInt(event.target.value);
        valueDisplay.textContent = options[config.key];
        
        // Check if the slider is for sound effects volume and update it
        if (config.key === 'soundsVolume') {
            updateSfxVolume(options.soundsVolume);
        }
        
        saveOptions();
    });

    sliderContainer.appendChild(sliderInput);
    sliderContainer.appendChild(valueDisplay);

    optionDiv.appendChild(sliderContainer);
    
    return optionDiv;
};

const renderOptions = () => {
    optionsContainer.innerHTML = '';
    optionsConfig.forEach(config => {
        if (config.type === 'slider') {
            optionsContainer.appendChild(createSliderElement(config));
        } else {
            optionsContainer.appendChild(createOptionElement(config));
        }
    });

    // Add Reset All Options button
    const resetBtn = document.createElement('button');
    resetBtn.id = 'reset-options-btn';
    resetBtn.classList.add('modal-button', 'secondary');
    resetBtn.textContent = 'Reset All Options';
    resetBtn.style.marginTop = '20px';
    resetBtn.addEventListener('click', showResetOptionsModal);
    optionsContainer.appendChild(resetBtn);
};

const showResetOptionsModal = () => {
    confirmResetOptionsModal.classList.remove('hidden');
};

const hideResetOptionsModal = () => {
    confirmResetOptionsModal.classList.add('hidden');
};

const resetAllOptions = () => {
    localStorage.removeItem('options');
    location.reload(); // Reload the page to apply default options
};

const initializeEventListeners = () => {
    settingsCloseBtn.addEventListener('click', hideOptionsModal);
    resetOptionsContinueBtn.addEventListener('click', resetAllOptions);
    resetOptionsCancelBtn.addEventListener('click', hideResetOptionsModal);
};

export const hideOptionsModal = () => {
    const modalContent = optionsModal.querySelector('.modal-content');
    modalContent.classList.add('fade-out-left');

    modalContent.addEventListener('animationend', () => {
        optionsModal.classList.add('hidden');
        modalContent.classList.remove('fade-out-left');
    }, { once: true });
};

export const showOptionsModal = () => {
    renderOptions();
    if (optionsModal.classList.contains('hidden')) {
        optionsModal.classList.remove('hidden');
    }
};

export const initializeOptions = () => {
    if (!localStorage.getItem('options')) {
        saveOptions();
    }
    updateAnimations(options);
    updateSfxVolume(options.soundsVolume); // Initial volume set-up
    initializeEventListeners();
};

export { options, saveOptions };