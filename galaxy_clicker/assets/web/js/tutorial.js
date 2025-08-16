import { showRulesModal, hideRulesModal } from "./rules.js";

const tutorialModal = document.getElementById('tutorial-modal');
const tutorialCloseBtn = document.getElementById('tutorial-close-btn');
const tutorialContinueBtn = document.getElementById('tutorial-continue-btn');

export const showTutorialModal = () => {
    if (tutorialModal) {
        tutorialModal.classList.remove('hidden');
        if (tutorialCloseBtn) {
            tutorialCloseBtn.classList.add('hidden');
        }
    }
};

export const hideTutorialModal = () => {
    if (tutorialModal) {
        const modalContent = tutorialModal.querySelector('.modal-content');
        modalContent.classList.add('fade-out');
        modalContent.addEventListener('animationend', () => {
            tutorialModal.classList.add('hidden');
            modalContent.classList.remove('fade-out');
        }, { once: true });
    }
};

if (tutorialCloseBtn) {
    tutorialCloseBtn.addEventListener('click', hideTutorialModal);
}

if (tutorialContinueBtn) {
    tutorialContinueBtn.addEventListener('click', () => {
        hideTutorialModal();
        showRulesModal(true); // Pass true to indicate it's from the tutorial
    });
}