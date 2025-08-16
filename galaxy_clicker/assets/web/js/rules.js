// rules.js
let rulesModal, rulesCloseBtn, rulesList, rulesContinueBtn;
let countdownInterval;

const rulesData = [
    { title: "No Auto-Clickers 🚫", description: "Using third-party software to automate clicks is strictly forbidden. The game has built-in detection to prevent cheating." },
    { title: "Respect the Community 🤗", description: "Be kind and respectful to other players if any multiplayer features are ever implemented. This is a game for fun, not for hate." },
    { title: "Report Bugs 🐛", description: "If you find any glitches, bugs, or exploits, please report them to the developer instead of using them for personal gain." },
    { title: "Fair Play ⚖️", description: "The goal is to play fair. Do not manipulate the game's code or files to give yourself an unfair advantage." },
    { title: "Enjoy the Game 🎉", description: "This is a passion project. The most important rule is to have fun and enjoy the clicking experience!" },
    { title: "Saving Progress 💾", description: "Your progress is saved automatically and can be manually saved by right-clicking. Make sure your browser settings allow local storage." },
    { title: "Resetting Progress 🔄", description: "You can reset your progress at any time, but be aware that this action is permanent and cannot be undone." },
    { title: "Feedback is Welcome 🗣️", description: "Your suggestions and ideas are valuable! Feel free to provide feedback to help improve the game." },
    { title: "Mind Your CPS ⚡", description: "The game has a Clicks Per Second (CPS) limit. Exceeding this limit might result in a warning or a temporary ban on clicking." },
    { title: "No Data Collection 🔒", description: "Your game data is stored locally in your browser. No personal information is collected or sent to any server." },
];

const renderRules = () => {
    rulesList.innerHTML = '';
    rulesData.forEach((rule, index) => {
        const ruleItem = document.createElement('li');
        ruleItem.classList.add('rule-item');
        ruleItem.innerHTML = `
            <h3 class="rule-title">${index + 1}. ${rule.title}</h3>
            <p class="rule-description">${rule.description}</p>
        `;
        rulesList.appendChild(ruleItem);
    });
};

const startInstantCountdown = () => {
    let countdown = 3;
    rulesContinueBtn.textContent = `Continue (${countdown})`;
    rulesContinueBtn.disabled = true;
    rulesContinueBtn.classList.add('disabled');

    setTimeout(() => {
        countdown = 2;
        rulesContinueBtn.textContent = `Continue (${countdown})`;
        setTimeout(() => {
            countdown = 1;
            rulesContinueBtn.textContent = `Continue (${countdown})`;
            setTimeout(() => {
                rulesContinueBtn.textContent = 'Continue';
                rulesContinueBtn.disabled = false;
                rulesContinueBtn.classList.remove('disabled');
            }, 0);
        }, 0);
    }, 0);
};

export const showRulesModal = (resetMode = false) => {
    renderRules();
    rulesModal.classList.remove('hidden');
    rulesList.scrollTop = 0; // Reset scroll to the top

    // Toggle the hidden class for the 'X' button based on resetMode
    if (rulesCloseBtn) {
        rulesCloseBtn.classList.toggle('hidden', !resetMode);
    }

    if (resetMode) {
        // If it's a reset, show the instant "Continue" button
        rulesContinueBtn.textContent = 'Continue';
        rulesContinueBtn.disabled = false;
        rulesContinueBtn.classList.remove('disabled');
        // Ensure any existing countdown is cleared
        clearInterval(countdownInterval); 
    } else {
        // If it's the first time, start the instant countdown
        startInstantCountdown();
    }
};

export const hideRulesModal = () => {
    if (rulesModal) {
        const modalContent = rulesModal.querySelector('.modal-content');
        modalContent.classList.add('fade-out');
        modalContent.addEventListener('animationend', () => {
            rulesModal.classList.add('hidden');
            modalContent.classList.remove('fade-out');
            clearInterval(countdownInterval); // Clear the countdown interval when hidden
        }, { once: true });
    }
};

const initializeElements = () => {
    rulesModal = document.getElementById('rules-modal');
    rulesCloseBtn = document.getElementById('rules-close-btn');
    rulesList = document.getElementById('rules-list');
    rulesContinueBtn = document.getElementById('rules-continue-btn');

    if (rulesCloseBtn) {
        rulesCloseBtn.addEventListener('click', () => {
            hideRulesModal();
        });
    }
};

document.addEventListener('DOMContentLoaded', initializeElements);