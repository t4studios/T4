// achievements.js
import { getGameData, getAchievements } from './game.js';
import { hideStatsModal } from './stats.js'; 
import { hideOptionsModal } from './options.js'; 

const achievementsModal = document.getElementById('achievements-modal');
const achievementsList = document.getElementById('achievement-list');
const achievementsCloseBtn = document.getElementById('achievements-close');
const sortAchievementsDropdownBtn = document.querySelector('.sort-achievements-dropdown');
const sortAchievementsText = document.getElementById('sort-achievements-text');
const sortAchievementsMenu = document.getElementById('sort-achievements-menu');
const unlockedAchievementsCount = document.getElementById('unlocked-achievements-count');
const maxAchievementsCount = document.getElementById('max-achievements-count');
const unlockedTrophiesCount = document.getElementById('unlocked-trophies-count');
const maxTrophiesCount = document.getElementById('max-trophies-count');


let achievementsData = [];
let gameData;
let currentSort = 'default';

// Function to calculate and render the "Collected of Max" text
const renderCollectedInfo = () => {
    // Filter the unlocked achievements to ensure they exist in the main data
    const validUnlockedAchievements = achievementsData.filter(achievement =>
        gameData.unlockedAchievements.includes(achievement.tag)
    );
    
    // Calculate stats from the valid unlocked achievements
    const unlockedCount = validUnlockedAchievements.length;
    const totalAchievements = achievementsData.length;
    const collectedTrophies = validUnlockedAchievements.reduce((sum, achievement) => sum + achievement.trophy_reward, 0);
    const maxTrophies = achievementsData.reduce((sum, achievement) => sum + achievement.trophy_reward, 0);

    if (unlockedAchievementsCount) unlockedAchievementsCount.textContent = unlockedCount;
    if (maxAchievementsCount) maxAchievementsCount.textContent = totalAchievements;
    if (unlockedTrophiesCount) unlockedTrophiesCount.textContent = collectedTrophies;
    if (maxTrophiesCount) maxTrophiesCount.textContent = maxTrophies;
};

// Function to sort achievements based on the selected criteria
const sortAchievements = (sortType) => {
    const unlockedAchievements = gameData.unlockedAchievements;
    const sortedAchievements = [...achievementsData];

    sortedAchievements.sort((a, b) => {
        const aUnlocked = unlockedAchievements.includes(a.tag);
        const bUnlocked = unlockedAchievements.includes(b.tag);

        // Always prioritize sorting by unlocked status first
        if (aUnlocked && !bUnlocked) return -1;
        if (!aUnlocked && bUnlocked) return 1;

        switch (sortType) {
            case 'title-asc':
                return a.title.localeCompare(b.title);
            case 'title-desc':
                return b.title.localeCompare(a.title);
            case 'progress':
                // For progress, we need to calculate a percentage
                const getProgress = (achievement) => {
                    if (unlockedAchievements.includes(achievement.tag)) return 100;
                    if (achievement.achievement_type === 'clicks') {
                        return (gameData.clicks / achievement.unlock_threshold) * 100;
                    } else if (achievement.achievement_type === 'time') {
                        const timePlayed = Date.now() - gameData.startTime;
                        return (timePlayed / achievement.unlock_threshold) * 100;
                    } else if (achievement.achievement_type === 'cps') {
                        return (gameData.clickHistory.length / achievement.unlock_threshold) * 100;
                    }
                    return 0;
                };

                const aProgress = getProgress(a);
                const bProgress = getProgress(b);

                return bProgress - aProgress; // Descending order
            case 'trophies-desc':
                return b.trophy_reward - a.trophy_reward; // Descending order
            case 'default':
            default:
                // Default sort is based on the original JSON order
                return 0;
        }
    });

    return sortedAchievements;
};

// Function to render the list of achievements
// Renamed this function to 'renderAchievements' to match the export
const renderAchievements = () => {
    achievementsList.innerHTML = '';
    const sortedAchievements = sortAchievements(currentSort);

    sortedAchievements.forEach(achievement => {
        const card = document.createElement('div');
        card.classList.add('achievement-card');

        let isUnlocked = gameData.unlockedAchievements.includes(achievement.tag);
        if (isUnlocked) {
            card.classList.add('unlocked');
        } else {
            card.classList.add('locked');
        }

        // Trophy count on the left side
        const trophyCount = document.createElement('div');
        trophyCount.classList.add('achievement-trophy-count');
        trophyCount.innerHTML = `
            <span class="trophy-value">${achievement.trophy_reward}</span>
            <span class="material-icons_round trophy-icon">emoji_events</span>
        `;

        // Achievement icon and details
        const detailsContainer = document.createElement('div');
        detailsContainer.classList.add('achievement-details');

        const title = document.createElement('p');
        title.classList.add('achievement-title-card');
        title.textContent = achievement.title;

        const description = document.createElement('p');
        description.classList.add('achievement-description');
        description.textContent = achievement.description;

        detailsContainer.appendChild(title);
        detailsContainer.appendChild(description);

        // Progress bar or steps
        const progressContainer = document.createElement('div');
        progressContainer.classList.add('achievement-progress');
        
        if (isUnlocked) {
            const unlockedText = document.createElement('p');
            unlockedText.classList.add('unlocked-text');
            unlockedText.textContent = 'Unlocked!';
            progressContainer.appendChild(unlockedText);
        } else if (achievement.achievement_type === 'multi_task') {
            const stepsContainer = document.createElement('div');
            stepsContainer.classList.add('achievement-steps-container');
            const currentStepIndex = (gameData.playerAchievementProgress[achievement.tag] || { currentStep: 0 }).currentStep;
            
            achievement.steps.forEach((step, index) => {
                const stepElement = document.createElement('p');
                stepElement.classList.add('achievement-step');
                
                if (index < currentStepIndex) {
                    stepElement.classList.add('completed');
                    stepElement.innerHTML = `<span class="material-icons_round">done</span> ${step.description}`;
                } else if (index === currentStepIndex) {
                    stepElement.classList.add('current');
                    stepElement.innerHTML = `<span class="material-icons_round">radio_button_checked</span> ${step.description}`;
                } else {
                    stepElement.classList.add('locked');
                    stepElement.innerHTML = `<span class="material-icons_round">lock</span> ${step.description}`;
                }
                stepsContainer.appendChild(stepElement);
            });
            progressContainer.appendChild(stepsContainer);

        } else if (achievement.achievement_type === 'secret') {
            const secretText = document.createElement('p');
            secretText.classList.add('progress-text');
            secretText.textContent = '???';
            progressContainer.appendChild(secretText);
        } else {
            let currentValue = 0;
            let progress = 0;

            if (achievement.achievement_type === 'clicks') {
                currentValue = gameData.clicks;
            } else if (achievement.achievement_type === 'time') {
                currentValue = Date.now() - gameData.startTime;
            } else if (achievement.achievement_type === 'cps') {
                currentValue = gameData.clickHistory.length;
            }

            progress = Math.min(100, (currentValue / achievement.unlock_threshold) * 100);

            const progressText = document.createElement('p');
            progressText.classList.add('progress-text');
            progressText.textContent = `${Math.min(currentValue, achievement.unlock_threshold)} / ${achievement.unlock_threshold}`;

            const progressBarContainer = document.createElement('div');
            progressBarContainer.classList.add('progress-bar-container');

            const progressBar = document.createElement('div');
            progressBar.classList.add('progress-bar');
            progressBar.style.width = `${progress}%`;

            progressBarContainer.appendChild(progressBar);
            progressContainer.appendChild(progressText);
            progressContainer.appendChild(progressBarContainer);
        }
        
        card.appendChild(trophyCount);
        card.appendChild(detailsContainer);
        card.appendChild(progressContainer);

        achievementsList.appendChild(card);
    });
};

const handleSortChange = (event) => {
    const newSort = event.target.dataset.sort;
    if (newSort) {
        currentSort = newSort;
        sortAchievementsText.textContent = event.target.textContent;
        sortAchievementsMenu.classList.add('hidden');
        renderAchievements(); // Now calls the correctly named function
    }
};

const initializeEventListeners = () => {
    achievementsCloseBtn.addEventListener('click', hideAchievementsModal);
    sortAchievementsDropdownBtn.addEventListener('click', () => {
        // Toggle the achievements menu
        sortAchievementsMenu.classList.toggle('hidden');
    });
    sortAchievementsMenu.addEventListener('click', handleSortChange);
    window.addEventListener('click', (event) => {
        if (!sortAchievementsDropdownBtn.contains(event.target) && !sortAchievementsMenu.classList.contains('hidden')) {
            sortAchievementsMenu.classList.add('hidden');
        }
    });

    // Add this new event listener to the button that opens the achievements modal
    const achievementsOpenBtn = document.getElementById('achievements-open-btn'); // Assuming you have a button with this ID
    if (achievementsOpenBtn) {
        achievementsOpenBtn.addEventListener('click', () => {
            if (achievementsModal.classList.contains('hidden')) {
                showAchievementsModal();
            } else {
                hideAchievementsModal();
            }
        });
    }
};

const hideAchievementsModal = () => {
    const modalContent = achievementsModal.querySelector('.modal-content');
    modalContent.classList.add('fade-out-left');

    modalContent.addEventListener('animationend', () => {
        achievementsModal.classList.add('hidden');
        modalContent.classList.remove('fade-out-left');
    }, { once: true });
};

export const showAchievementsModal = () => {
    gameData = getGameData();
    achievementsData = getAchievements();
    const modalContent = achievementsModal.querySelector('.modal-content');
    modalContent.classList.remove('fade-out-left');

    renderCollectedInfo();
    renderAchievements(); // Now calls the correctly named function
    
    if (achievementsModal.classList.contains('hidden')) {
        achievementsModal.classList.remove('hidden');
    }
};

initializeEventListeners();

export { hideAchievementsModal };
export { renderAchievements }; // Now correctly exports the function