import { showStatsModal, hideStatsModal, updateClicksGraph } from './stats.js';
import { showOptionsModal, hideOptionsModal, initializeOptions, options, saveOptions } from './options.js';
import { showAchievementsModal, hideAchievementsModal, renderAchievements } from './achievements.js';
import { showTutorialModal, hideTutorialModal } from './tutorial.js';
import { showRulesModal, hideRulesModal } from './rules.js';

const VERSION = "1.00";

// DOM Elements
const loadingScreen = document.getElementById('loading-screen');
const loadingProgressBar = document.getElementById('loading-progress-bar');
const loadingDescription = document.getElementById('loading-description');
const clickerCircle = document.getElementById('clicker-circle');
const clickCountDisplay = document.getElementById('click-count');
const cpsDisplay = document.getElementById('cps-display');
const particleCanvas = document.getElementById('particleCanvas');
const ctx = particleCanvas.getContext('2d');
const customContextMenu = document.getElementById('custom-context-menu');
const saveOption = document.getElementById('save-option');
const resetOption = document.getElementById('reset-option');
const statsOption = document.getElementById('stats-option');
const achievementsOption = document.getElementById('achievements-option');
const settingsOption = document.getElementById('options-option');
const rulesOption = document.getElementById('rules-option');
const aboutOption = document.getElementById('about-option');

// Save Toast
const saveToast = document.getElementById('save-toast');

// Achievement Toast
const achievementToast = document.getElementById('achievement-toast');
const achievementNameDisplay = document.getElementById('achievement-name');
const achievementTrophiesDisplay = document.getElementById('achievement-trophies');
const viewAchievementsBtn = document.getElementById('view-achievements-btn');

// Player Trophies
const playerTrophiesContainer = document.getElementById('player-trophies');
const trophyCountDisplay = document.getElementById('trophy-count');
const trophyAnimation = document.getElementById('trophy-animation');

// Reset Modals
const confirmationModal = document.getElementById('confirmation-modal');
const modalScoreDisplay = document.getElementById('modal-score-display');
const modalContinueBtn = document.getElementById('modal-continue');
const modalCancelBtn = document.getElementById('modal-cancel');
const confirmResetOptionsModal = document.getElementById('confirm-reset-options-modal');

// Status Bubbles
const fpsCounter = document.getElementById('fps-counter');
const performanceModeIndicator = document.getElementById('performance-mode-indicator');
const overloadedIndicator = document.getElementById('overloaded-indicator');
const cheatingIndicator = document.getElementById('cheating-indicator');

// Audio
const audioPlayer = document.getElementById('audio-player');
const achievementSuccessSound = new Audio('galaxy_clicker/assets/sounds/achievement_success.mp3');
const clickSound = new Audio('galaxy_clicker/assets/sounds/click_1-1.mp3');
const soundtracks = [
    'galaxy_clicker/assets/soundtracks/stellardrift_1-1.ogg',
    'galaxy_clicker/assets/soundtracks/stellardrift_1-2.ogg',
    'galaxy_clicker/assets/soundtracks/stellardrift_1-3.ogg',
    'galaxy_clicker/assets/soundtracks/stellardrift_1-4.ogg'
];
let lastPlayedSoundtrack = null;
let isFirstClick = true;

// Main game state
let clicks = parseInt(localStorage.getItem('clicks')) || 0;
let clickHistory = [];
let countdownInterval;
let startTime = parseInt(localStorage.getItem('startTime')) || Date.now();
let hourlyClicks = JSON.parse(localStorage.getItem('hourlyClicks')) || {};
let dailyClicks = JSON.parse(localStorage.getItem('dailyClicks')) || {};
let unlockedAchievements = JSON.parse(localStorage.getItem('unlockedAchievements')) || [];
let playerTrophies = parseInt(localStorage.getItem('playerTrophies')) || 0;
let playerAchievementProgress = JSON.parse(localStorage.getItem('playerAchievementProgress')) || {};
const achievementQueue = [];
let isProcessingQueue = false;
let isClickerDisabled = false;
let isResetModalOpen = false;

// Speedrun state
let speedrunClicks = parseInt(localStorage.getItem('speedrunClicks')) || 0;
let speedrunStartTime = parseInt(localStorage.getItem('speedrunStartTime')) || Date.now();

// Achievements
let allAchievements = [];

// Animation State
let animationFrameId;
let lastFrameTime = 0;
let fpsLimit = 60;
let isAnimatingParticles = false;
let lastFPSUpdateTime = 0;

// Cheating Detection
let lastClickTime = Date.now();

// Loading Screen Descriptions
const loadingDescriptions = [
    "Aligning cosmic click trajectories...",
    "Polishing space dust and stars...",
    "Warping reality for maximum clicks...",
    "Calculating hyper-click equations...",
    "Recharging the clicker core...",
    "Preparing your galaxy for expansion...",
    "Booting up the click-o-meter...",
    "Initiating interstellar click fusion...",
    "Compressing dark matter...",
    "Calibrating the click feedback loop..."
];

// New utility for modal transitions
const modals = {
    'stats-modal': document.getElementById('stats-modal'),
    'achievements-modal': document.getElementById('achievements-modal'),
    'settings-modal': document.getElementById('settings-modal'),
    'confirmation-modal': document.getElementById('confirmation-modal'),
    'tutorial-modal': document.getElementById('tutorial-modal'),
    'rules-modal': document.getElementById('rules-modal'),
    'confirm-reset-options-modal': document.getElementById('confirm-reset-options-modal')
};

const getOpenModal = () => {
    for (const id in modals) {
        if (modals[id] && !modals[id].classList.contains('hidden')) {
            return {
                id: id,
                element: modals[id]
            };
        }
    }
    return null;
};

const transitionModals = (modalId, showFunction, ...args) => {
    const openModal = getOpenModal();
    if (openModal && openModal.id === modalId) {
        return;
    }

    if (openModal) {
        const hideFunctionMap = {
            'stats-modal': hideStatsModal,
            'achievements-modal': hideAchievementsModal,
            'settings-modal': hideOptionsModal,
            'confirmation-modal': hideResetModal,
            'tutorial-modal': hideTutorialModal,
            'rules-modal': hideRulesModal,
            'confirm-reset-options-modal': hideResetOptionsModal
        };
        const hideFunction = hideFunctionMap[openModal.id];

        if (hideFunction) {
            hideFunction();
        }

        setTimeout(() => {
            if (showFunction) {
                showFunction(...args);
            }
        }, 500);
    } else {
        if (showFunction) {
            showFunction(...args);
        }
    }
};

export const getGameData = () => ({
    clicks,
    clickHistory,
    startTime,
    hourlyClicks,
    dailyClicks,
    unlockedAchievements,
    playerAchievementProgress,
    playerTrophies
});

export const updateGameData = (newClicks, newClickHistory, newStartTime, newHourlyClicks, newDailyClicks) => {
    clicks = newClicks;
    clickHistory = newClickHistory;
    startTime = newStartTime;
    hourlyClicks = newHourlyClicks;
    dailyClicks = newDailyClicks;
};

export const getAchievements = () => allAchievements;

// Utility Functions
const formatNumber = (num) => {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};

const particles = [];
const particleCount = 100;

class Particle {
    constructor() {
        this.x = Math.random() * particleCanvas.width;
        this.y = Math.random() * particleCanvas.height;
        this.size = Math.random() * 1.5 + 0.5;
        this.speedX = Math.random() * 0.2 - 0.1;
        this.speedY = Math.random() * 0.2 - 0.1;
    }

    update() {
        this.x += this.speedX;
        this.y += this.speedY;

        if (this.x < 0 || this.x > particleCanvas.width) this.speedX = -this.speedX;
        if (this.y < 0 || this.y > particleCanvas.height) this.speedY = -this.speedY;
    }

    draw() {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
    }
}

const createParticles = () => {
    particles.length = 0;
    for (let i = 0; i < particleCount; i++) {
        particles.push(new Particle());
    }
};

const resizeCanvas = () => {
    particleCanvas.width = window.innerWidth;
    particleCanvas.height = window.innerHeight;
    createParticles();
};

const animateParticles = () => {
    ctx.clearRect(0, 0, particleCanvas.width, particleCanvas.height);
    for (const particle of particles) {
        particle.update();
        particle.draw();
    }
};

const gameLoop = (timestamp) => {
    if (timestamp < lastFrameTime + (1000 / fpsLimit)) {
        animationFrameId = requestAnimationFrame(gameLoop);
        return;
    }

    const elapsed = timestamp - lastFrameTime;
    lastFrameTime = timestamp;

    if (isAnimatingParticles) {
        animateParticles();
    }

    const currentOptions = JSON.parse(localStorage.getItem('options')) || {};
    if (currentOptions.showFPSCounter && timestamp - lastFPSUpdateTime >= 500) {
        const fps = Math.round(1000 / elapsed);
        fpsCounter.textContent = `FPS: ${fps}`;
        lastFPSUpdateTime = timestamp;

        if (fps < 10) {
            overloadedIndicator.classList.remove('hidden');
        } else {
            overloadedIndicator.classList.add('hidden');
        }
    }

    checkForTimeAchievements();
    checkForCPSAchievements();
    checkForClicksAchievements();

    animationFrameId = requestAnimationFrame(gameLoop);
};

export const updateAnimations = (options) => {
    cancelAnimationFrame(animationFrameId);

    if (options.performanceMode) {
        fpsLimit = 30;
        performanceModeIndicator.classList.remove('hidden');
    } else {
        fpsLimit = 60;
        performanceModeIndicator.classList.add('hidden');
    }

    isAnimatingParticles = options.particles;
    if (particleCanvas) {
        particleCanvas.style.display = isAnimatingParticles ? 'block' : 'none';
    }

    document.body.classList.toggle('animated-squares', options.animatedBackground);

    if (fpsCounter) {
        fpsCounter.classList.toggle('hidden', !options.showFPSCounter);
        overloadedIndicator.classList.add('hidden');
    }

    if (clickerCircle) {
        clickerCircle.style.display = options.showClickerCircle ? 'flex' : 'none';
    }
    if (cpsDisplay && cpsDisplay.parentElement) {
        cpsDisplay.parentElement.style.display = options.showStatsText ? 'block' : 'none';
    }
    if (clickCountDisplay) {
        clickCountDisplay.style.display = options.showStatsText ? 'block' : 'none';
    }

    if (audioPlayer) {
        audioPlayer.volume = options.musicVolume / 100;
    }
    gameLoop(0);
};

export const updateSfxVolume = (volume) => {
    const sfxVolume = (typeof volume === 'number' && !isNaN(volume)) ? volume : 50;
    if (achievementSuccessSound) achievementSuccessSound.volume = sfxVolume / 100;
    if (clickSound) clickSound.volume = sfxVolume / 100;
};

export const playClickSfx = () => {
    const options = JSON.parse(localStorage.getItem('options')) || {};
    if (options.soundsVolume > 0 && clickSound) {
        clickSound.currentTime = 0;
        clickSound.play();
    }
};

const hideLoadingScreen = () => {
    if (loadingScreen) {
        loadingScreen.classList.add('hidden');
    }
};

const playRandomSoundtrack = () => {
    let availableSoundtracks = soundtracks.filter(s => s !== lastPlayedSoundtrack);
    if (availableSoundtracks.length === 0) {
        availableSoundtracks = soundtracks;
    }

    const randomIndex = Math.floor(Math.random() * availableSoundtracks.length);
    const selectedSoundtrack = availableSoundtracks[randomIndex];

    if (audioPlayer) {
        audioPlayer.src = selectedSoundtrack;
        audioPlayer.loop = true;
        audioPlayer.play();
        lastPlayedSoundtrack = selectedSoundtrack;
    }
};

const fetchAchievements = async () => {
    try {
        const response = await fetch('galaxy_clicker/assets/web/json/achievements.json');
        allAchievements = await response.json();
    } catch (error) {
        console.error('Failed to load achievements.json:', error);
    }
};

const processAchievementQueue = () => {
    if (achievementQueue.length > 0 && !isProcessingQueue) {
        isProcessingQueue = true;
        const achievement = achievementQueue.shift();

        if (achievementNameDisplay) achievementNameDisplay.textContent = achievement.title;
        if (achievementTrophiesDisplay) achievementTrophiesDisplay.textContent = `+${achievement.trophy_reward} Trophies`;
        if (achievementToast) {
            achievementToast.classList.remove('fade-out');
            achievementToast.classList.remove('hidden');
        }

        if (achievementSuccessSound) achievementSuccessSound.play();

        setTimeout(() => {
            if (achievementToast) achievementToast.classList.add('fade-out');
        }, 4000);

        setTimeout(() => {
            isProcessingQueue = false;
            processAchievementQueue();
        }, 5000);
    }
};

const animateTrophyGain = (amount) => {
    if (trophyAnimation) {
        trophyAnimation.textContent = `+${amount}`;
        trophyAnimation.classList.remove('hidden');

        setTimeout(() => {
            trophyAnimation.classList.add('hidden');
        }, 3000);
    }
};

const unlockAchievement = (achievement) => {
    if (!unlockedAchievements.includes(achievement.tag)) {
        unlockedAchievements.push(achievement.tag);

        playerTrophies += achievement.trophy_reward;
        if (trophyCountDisplay) trophyCountDisplay.textContent = formatNumber(playerTrophies);
        animateTrophyGain(achievement.trophy_reward);

        achievementQueue.push(achievement);
        processAchievementQueue();

        if (playerAchievementProgress[achievement.tag]) {
            delete playerAchievementProgress[achievement.tag];
        }

        saveGame(false);
    }
};

const updateMultiTaskAchievement = (achievementTag, newStep) => {
    const achievement = allAchievements.find(a => a.tag === achievementTag);
    if (!achievement || unlockedAchievements.includes(achievementTag)) {
        return;
    }

    if (!playerAchievementProgress[achievementTag]) {
        playerAchievementProgress[achievementTag] = { currentStep: 0 };
    }

    if (playerAchievementProgress[achievementTag].currentStep === newStep - 1) {
        playerAchievementProgress[achievementTag].currentStep = newStep;

        if (newStep === achievement.steps.length) {
            unlockAchievement(achievement);
        } else {
            saveGame(false);
        }
    }
};

const checkForClicksAchievements = () => {
    const clicksAchievements = allAchievements.filter(a => a.achievement_type === 'clicks');
    for (const achievement of clicksAchievements) {
        if (clicks >= achievement.unlock_threshold) {
            unlockAchievement(achievement);
        }
    }
    const save100 = allAchievements.find(a => a.tag === 'save_100');
    if (save100 && !unlockedAchievements.includes(save100.tag) && clicks === 100) {
        updateMultiTaskAchievement('save_100', 1);
    }
    const load1000 = allAchievements.find(a => a.tag === 'load_1000');
    if (load1000 && !unlockedAchievements.includes(load1000.tag) && clicks === 1000) {
        updateMultiTaskAchievement('load_1000', 1);
    }
    const saveLoad512 = allAchievements.find(a => a.tag === 'save_load_512');
    if (saveLoad512 && !unlockedAchievements.includes(saveLoad512.tag) && clicks === 512) {
        updateMultiTaskAchievement('save_load_512', 1);
    }
};

const checkForTimeAchievements = () => {
    const timePlayed = Date.now() - startTime;
    const timeAchievements = allAchievements.filter(a => a.achievement_type === 'time');
    for (const achievement of timeAchievements) {
        if (timePlayed >= achievement.unlock_threshold) {
            unlockAchievement(achievement);
        }
    }
};

const checkForCPSAchievements = () => {
    const currentCPS = clickHistory.length;
    const cpsAchievements = allAchievements.filter(a => a.achievement_type === 'cps');
    for (const achievement of cpsAchievements) {
        if (currentCPS >= achievement.unlock_threshold) {
            unlockAchievement(achievement);
        }
    }
};

const checkForSpeedrunAchievement = () => {
    const speedrunAchievement = allAchievements.find(a => a.tag === 'speedrun_100');
    if (!speedrunAchievement || unlockedAchievements.includes(speedrunAchievement.tag)) {
        return;
    }
    if (speedrunClicks >= 100) {
        unlockAchievement(speedrunAchievement);
    }
};

const checkSecretAchievement = () => {
    const secretAchievement = allAchievements.find(a => a.tag === 'secret_512_512');
    if (!secretAchievement || unlockedAchievements.includes(secretAchievement.tag)) {
        return;
    }
    if (clicks === 512) {
        const today = new Date();
        if (today.getMonth() === 4 && today.getDate() === 12) {
            unlockAchievement(secretAchievement);
        }
    }
};

const checkForSaveMultiTaskAchievements = () => {
    const save100 = allAchievements.find(a => a.tag === 'save_100');
    if (save100 && !unlockedAchievements.includes(save100.tag) && playerAchievementProgress['save_100'] && playerAchievementProgress['save_100'].currentStep === 1) {
        updateMultiTaskAchievement('save_100', 2);
    }
    const load1000 = allAchievements.find(a => a.tag === 'load_1000');
    if (load1000 && !unlockedAchievements.includes(load1000.tag) && playerAchievementProgress['load_1000'] && playerAchievementProgress['load_1000'].currentStep === 1) {
        updateMultiTaskAchievement('load_1000', 2);
    }
    const saveLoad512 = allAchievements.find(a => a.tag === 'save_load_512');
    if (saveLoad512 && !unlockedAchievements.includes(saveLoad512.tag) && playerAchievementProgress['save_load_512'] && playerAchievementProgress['save_load_512'].currentStep === 1) {
        updateMultiTaskAchievement('save_load_512', 2);
    }
};

const checkForLoadMultiTaskAchievements = () => {
    const load1000 = allAchievements.find(a => a.tag === 'load_1000');
    if (load1000 && !unlockedAchievements.includes(load1000.tag) && playerAchievementProgress['load_1000'] && playerAchievementProgress['load_1000'].currentStep === 2) {
        updateMultiTaskAchievement('load_1000', 3);
    }
    const saveLoad512 = allAchievements.find(a => a.tag === 'save_load_512');
    if (saveLoad512 && !unlockedAchievements.includes(saveLoad512.tag) && playerAchievementProgress['save_load_512'] && playerAchievementProgress['save_load_512'].currentStep === 2) {
        updateMultiTaskAchievement('save_load_512', 3);
    }
};

const synchronizeAchievements = () => {
    const validAchievementTags = allAchievements.map(a => a.tag);
    unlockedAchievements = unlockedAchievements.filter(tag => validAchievementTags.includes(tag));
    playerTrophies = unlockedAchievements.reduce((sum, tag) => {
        const achievement = allAchievements.find(a => a.tag === tag);
        return sum + (achievement ? achievement.trophy_reward : 0);
    }, 0);
    if (trophyCountDisplay) trophyCountDisplay.textContent = formatNumber(playerTrophies);
    localStorage.setItem('unlockedAchievements', JSON.stringify(unlockedAchievements));
    localStorage.setItem('playerTrophies', playerTrophies);
};

const init = async () => {
    await fetchAchievements();
    synchronizeAchievements();

    document.title = 'Galaxy Clicker';
    if (clickCountDisplay) clickCountDisplay.textContent = formatNumber(clicks);
    if (trophyCountDisplay) trophyCountDisplay.textContent = formatNumber(playerTrophies);
    resizeCanvas();
    if (aboutOption) aboutOption.textContent = `About (v${VERSION})`;
    if (!localStorage.getItem('startTime')) {
        localStorage.setItem('startTime', startTime);
    }

    if (!localStorage.getItem('speedrunStartTime')) {
        localStorage.setItem('speedrunStartTime', speedrunStartTime);
        localStorage.setItem('speedrunClicks', speedrunClicks);
    }

    setInterval(() => {
        if (Date.now() - speedrunStartTime >= 60000) {
            speedrunClicks = 0;
            speedrunStartTime = Date.now();
        }
    }, 1000);

    initializeOptions();
    checkForLoadMultiTaskAchievements();
    addSfxToButtons();

    Chart.defaults.font.family = "'Inter', sans-serif";
    Chart.defaults.font.weight = 'bold';
    Chart.defaults.color = '#fff';

    const currentOptions = JSON.parse(localStorage.getItem('options')) || {};
    let progress = 0;
    const loadingInterval = setInterval(() => {
        progress += 5;
        if (loadingProgressBar) loadingProgressBar.style.width = `${progress}%`;

        if (progress >= 100) {
            clearInterval(loadingInterval);
            setTimeout(() => {
                hideLoadingScreen();
                updateAnimations(currentOptions);
                updateSfxVolume(currentOptions.soundsVolume);
                if (!options.tutorialShown) {
                    showTutorialModal();
                } else {
                    if (options.musicVolume > 0) {
                        playRandomSoundtrack();
                    }
                }
            }, 500);
        }
    }, 100);

    let descriptionIndex = 0;
    if (loadingDescription) loadingDescription.textContent = loadingDescriptions[descriptionIndex];
    const descriptionInterval = setInterval(() => {
        descriptionIndex = (descriptionIndex + 1) % loadingDescriptions.length;
        if (loadingDescription) loadingDescription.textContent = loadingDescriptions[descriptionIndex];
        if (progress >= 100) {
            clearInterval(descriptionInterval);
        }
    }, 5000);
};

const animateClick = (event) => {
    if (isClickerDisabled) {
        return;
    }

    const now = Date.now();
    const timeSinceLastClick = now - lastClickTime;
    const currentOptions = JSON.parse(localStorage.getItem('options')) || {};
    if (timeSinceLastClick < 1000 / currentOptions.cpsLimit) {
        if (cheatingIndicator) {
            cheatingIndicator.classList.remove('hidden');
        }
        isClickerDisabled = true;
        setTimeout(() => {
            if (cheatingIndicator) {
                cheatingIndicator.classList.add('hidden');
            }
            isClickerDisabled = false;
        }, 1000);
        return;
    }

    lastClickTime = now;
    clicks++;
    speedrunClicks++;
    if (clickCountDisplay) clickCountDisplay.textContent = formatNumber(clicks);
    clickHistory.push(now);

    const currentHour = new Date(now).getHours();
    const currentDay = Math.floor(now / (1000 * 60 * 60 * 24));

    hourlyClicks[currentHour] = (hourlyClicks[currentHour] || 0) + 1;
    dailyClicks[currentDay] = (dailyClicks[currentDay] || 0) + 1;

    if (currentOptions.clickAnim) {
        const animation = document.createElement('div');
        animation.classList.add('plus-one-animation');
        animation.textContent = '+1';
        animation.style.left = `${event.clientX}px`;
        animation.style.top = `${event.clientY}px`;
        document.body.appendChild(animation);

        animation.addEventListener('animationend', () => {
            animation.remove();
        });
    }

    playClickSfx();
    checkForClicksAchievements();
    checkForSpeedrunAchievement();
    checkSecretAchievement();
    saveGame(false);
};

const updateCPS = () => {
    const now = Date.now();
    clickHistory = clickHistory.filter(timestamp => (now - timestamp) < 1000);
    if (cpsDisplay) cpsDisplay.textContent = clickHistory.length;
    checkForCPSAchievements();
};

const saveGame = (showToast = true) => {
    localStorage.setItem('clicks', clicks);
    localStorage.setItem('startTime', startTime);
    localStorage.setItem('hourlyClicks', JSON.stringify(hourlyClicks));
    localStorage.setItem('dailyClicks', JSON.stringify(dailyClicks));
    localStorage.setItem('playerTrophies', playerTrophies);
    localStorage.setItem('unlockedAchievements', JSON.stringify(unlockedAchievements));
    localStorage.setItem('playerAchievementProgress', JSON.stringify(playerAchievementProgress));
    localStorage.setItem('speedrunClicks', speedrunClicks);
    localStorage.setItem('speedrunStartTime', speedrunStartTime);
    checkForSaveMultiTaskAchievements();
    const currentOptions = JSON.parse(localStorage.getItem('options')) || {};
    if (showToast && currentOptions.saveToast) {
        showSaveToast();
    }
};

const showSaveToast = () => {
    if (!saveToast) return;
    if (!saveToast.classList.contains('hidden')) {
        clearTimeout(saveToast.dataset.timer);
    }
    saveToast.classList.remove('fade-out');
    saveToast.classList.remove('hidden');
    const fadeOutTimer = setTimeout(() => {
        saveToast.classList.add('fade-out');
    }, 3000);
    saveToast.dataset.timer = fadeOutTimer;
};

if (saveToast) {
    saveToast.addEventListener('animationend', (event) => {
        if (event.animationName === 'fade-out-down') {
            saveToast.classList.add('hidden');
            saveToast.classList.remove('fade-out');
        }
    });
}

const performReset = () => {
    localStorage.clear();
    window.location.reload();
};

const showResetModal = () => {
    if (!confirmationModal) return;
    if (modalScoreDisplay) modalScoreDisplay.textContent = formatNumber(clicks);
    confirmationModal.classList.remove('hidden');
    if (modalContinueBtn) modalContinueBtn.disabled = true;
    let countdown = 3;
    if (modalContinueBtn) modalContinueBtn.textContent = `Continue (${countdown})`;
    countdownInterval = setInterval(() => {
        countdown--;
        if (countdown > 0) {
            if (modalContinueBtn) modalContinueBtn.textContent = `Continue (${countdown})`;
        } else {
            clearInterval(countdownInterval);
            if (modalContinueBtn) {
                modalContinueBtn.textContent = 'Continue';
                modalContinueBtn.disabled = false;
            }
        }
    }, 1000);
};

const hideResetModal = () => {
    if (!confirmationModal) return;
    const modalContent = confirmationModal.querySelector('.modal-content');
    if (modalContent) modalContent.classList.add('fade-out');
    if (modalContent) {
        modalContent.addEventListener('animationend', () => {
            confirmationModal.classList.add('hidden');
            if (modalContent) modalContent.classList.remove('fade-out');
            clearInterval(countdownInterval);
        }, { once: true });
    }
};

const hideResetOptionsModal = () => {
    if (!confirmResetOptionsModal) return;
    const modalContent = confirmResetOptionsModal.querySelector('.modal-content');
    if (modalContent) modalContent.classList.add('fade-out');
    if (modalContent) {
        modalContent.addEventListener('animationend', () => {
            confirmResetOptionsModal.classList.add('hidden');
            if (modalContent) modalContent.classList.remove('fade-out');
        }, { once: true });
    }
    isResetModalOpen = false;
};

const closeContextMenu = () => {
    if (customContextMenu) customContextMenu.classList.add('fade-out');
};

const addSfxToButtons = () => {
    const clickableElements = document.querySelectorAll(
        '.modal button, .close-btn, .context-menu-option'
    );
    clickableElements.forEach(element => {
        element.addEventListener('click', () => {
            playClickSfx();
        });
    });
};

if (customContextMenu) {
    customContextMenu.addEventListener('animationend', (event) => {
        if (event.animationName === 'fade-out-down') {
            customContextMenu.classList.add('hidden');
            customContextMenu.classList.remove('fade-out');
        }
    });
}

// Event Listeners
window.addEventListener('resize', resizeCanvas);
if (clickerCircle) clickerCircle.addEventListener('click', animateClick);
if (audioPlayer) audioPlayer.addEventListener('ended', playRandomSoundtrack);

document.addEventListener('click', () => {
    if (isFirstClick) {
        if (options.musicVolume > 0) {
            playRandomSoundtrack();
        }
        isFirstClick = false;
    }
}, { once: true });

document.addEventListener('contextmenu', (event) => {
    event.preventDefault();
    if (customContextMenu) {
        customContextMenu.classList.remove('fade-out');
        customContextMenu.classList.remove('hidden');
        customContextMenu.style.left = `${event.clientX}px`;
        customContextMenu.style.top = `${event.clientY}px`;
    }
});

document.addEventListener('click', (event) => {
    if (customContextMenu && !customContextMenu.contains(event.target) && !customContextMenu.classList.contains('hidden')) {
        closeContextMenu();
    }
});

if (playerTrophiesContainer) {
    playerTrophiesContainer.addEventListener('click', () => {
        if (isResetModalOpen) {
            hideResetOptionsModal();
        }
        transitionModals('achievements-modal', showAchievementsModal);
    });
}

if (viewAchievementsBtn) {
    viewAchievementsBtn.addEventListener('click', () => {
        if (isResetModalOpen) {
            hideResetOptionsModal();
        }
        if (achievementToast) achievementToast.classList.add('fade-out');
        transitionModals('achievements-modal', showAchievementsModal);
    });
}

if (achievementsOption) {
    achievementsOption.addEventListener('click', () => {
        if (isResetModalOpen) {
            hideResetOptionsModal();
        }
        transitionModals('achievements-modal', showAchievementsModal);
    });
}

if (rulesOption) {
    rulesOption.addEventListener('click', () => {
        transitionModals('rules-modal', showRulesModal, true);
        closeContextMenu();
    });
}

const showResetUI = () => {
    transitionModals('confirmation-modal', showResetModal);
};

if (saveOption) {
    saveOption.addEventListener('click', () => {
        saveGame(true);
        closeContextMenu();
    });
}
if (resetOption) {
    resetOption.addEventListener('click', () => {
        showResetUI();
        closeContextMenu();
    });
}

if (statsOption) {
    statsOption.addEventListener('click', () => {
        transitionModals('stats-modal', showStatsModal);
        closeContextMenu();
    });
}

if (settingsOption) {
    settingsOption.addEventListener('click', () => {
        transitionModals('settings-modal', showOptionsModal);
        closeContextMenu();
    });
}

if (modalContinueBtn) modalContinueBtn.addEventListener('click', performReset);
if (modalCancelBtn) modalCancelBtn.addEventListener('click', hideResetModal);

if (achievementToast) {
    achievementToast.addEventListener('animationend', (event) => {
        if (event.animationName === 'achievement-slide-out') {
            achievementToast.classList.add('hidden');
        }
    });
}

const tutorialContinueBtn = document.getElementById('tutorial-continue-btn');
const rulesContinueBtn = document.getElementById('rules-continue-btn');

if (tutorialContinueBtn) {
    tutorialContinueBtn.addEventListener('click', () => {
        hideTutorialModal();
        showRulesModal(false);
    });
}

if (rulesContinueBtn) {
    rulesContinueBtn.addEventListener('click', () => {
        hideRulesModal();
        options.tutorialShown = true;
        saveOptions();
        if (options.musicVolume > 0) {
            playRandomSoundtrack();
        }
    });
}

const resetOptionsBtn = document.getElementById('reset-options-btn');
const cancelResetOptionsBtn = document.getElementById('cancel-reset-options-btn');
const confirmResetOptionsBtn = document.getElementById('reset-options-continue');

if (resetOptionsBtn) {
    resetOptionsBtn.addEventListener('click', () => {
        hideOptionsModal();
        if (confirmResetOptionsModal) {
            confirmResetOptionsModal.classList.remove('hidden');
        }
        isResetModalOpen = true;
    });
}

if (cancelResetOptionsBtn) {
    cancelResetOptionsBtn.addEventListener('click', () => {
        hideResetOptionsModal();
        showOptionsModal();
    });
}

if (confirmResetOptionsBtn) {
    confirmResetOptionsBtn.addEventListener('click', () => {
        localStorage.removeItem('options');
        localStorage.removeItem('tutorialShown');
        window.location.reload();
    });
}

export const setTutorialShown = () => { };

init();
setInterval(updateCPS, 200);