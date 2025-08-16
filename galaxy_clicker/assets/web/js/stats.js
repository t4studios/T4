// stats.js
import { getGameData } from './game.js';
import { hideAchievementsModal } from './achievements.js';
import { hideOptionsModal } from './options.js';

// Stats Modal
const statsModal = document.getElementById('stats-modal');
const statsCloseBtn = document.getElementById('stats-close');
const timePlayedDisplay = document.getElementById('time-played');
const totalClicksDisplay = document.getElementById('total-clicks');
const statsCpsDisplay = document.getElementById('stats-cps');
const clicksGraphCanvas = document.getElementById('clicks-graph');
const typeDropdownButton = document.querySelector('.type-dropdown');
const typeDropdownMenu = document.querySelector('.type-menu');
const typeText = document.getElementById('type-text');
const sortDropdownButton = document.querySelector('.sort-dropdown');
const sortDropdownMenu = document.querySelector('.sort-menu');
const sortByText = document.getElementById('sort-by-text');

let currentGraphType = 'clicks';
let currentGraphTimeframe = '24h';
let clicksGraph;

const formatNumber = (num) => {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};

export const showStatsModal = () => {
    const modalContent = statsModal.querySelector('.modal-content');
    modalContent.classList.remove('fade-out-left');
    
    updateStats();
    statsModal.classList.remove('hidden');
    updateClicksGraph(currentGraphType, currentGraphTimeframe);
};

export const hideStatsModal = () => {
    const modalContent = statsModal.querySelector('.modal-content');
    modalContent.classList.add('fade-out-left');

    modalContent.addEventListener('animationend', () => {
        statsModal.classList.add('hidden');
        modalContent.classList.remove('fade-out-left');
    }, { once: true });
};

const updateStats = () => {
    const { clicks, startTime, clickHistory } = getGameData();
    const timePlayed = Date.now() - startTime;
    const totalSeconds = Math.floor(timePlayed / 1000);
    const days = Math.floor(totalSeconds / (60 * 60 * 24));
    const hours = Math.floor((totalSeconds % (60 * 60 * 24)) / (60 * 60));
    const minutes = Math.floor((totalSeconds % (60 * 60)) / 60);
    const seconds = totalSeconds % 60;
    
    const pad = (num) => String(num).padStart(2, '0');
    timePlayedDisplay.textContent = `${pad(days)} : ${pad(hours)} : ${pad(minutes)} : ${pad(seconds)}`;

    totalClicksDisplay.textContent = formatNumber(clicks);
    statsCpsDisplay.textContent = clickHistory.length;
};

const getDailyClicks = (days) => {
    const { dailyClicks } = getGameData();
    const data = {};
    const now = Date.now();
    for (let i = days - 1; i >= 0; i--) {
        const date = new Date(now - (i * 24 * 60 * 60 * 1000));
        const dayKey = Math.floor(date.getTime() / (1000 * 60 * 60 * 24));
        data[dayKey] = dailyClicks[dayKey] || 0;
    }
    return data;
};

const getLifetimeClicks = () => {
    const { dailyClicks, startTime } = getGameData();
    const yearlyData = {};
    const startDate = new Date(startTime);
    const currentYear = new Date().getFullYear();
    const startYear = startDate.getFullYear();

    for (let year = startYear; year <= currentYear; year++) {
        yearlyData[year] = 0;
    }

    for (const dayKey in dailyClicks) {
        const dayDate = new Date(parseInt(dayKey) * (1000 * 60 * 60 * 24));
        const year = dayDate.getFullYear();
        if (yearlyData[year] !== undefined) {
            yearlyData[year] += dailyClicks[dayKey];
        }
    }
    
    // Fill in years from the last 10 years if they are more recent than the game start
    const tenYearsAgo = currentYear - 9;
    const finalData = {};
    for (let year = Math.max(tenYearsAgo, startYear); year <= currentYear; year++) {
        finalData[year] = yearlyData[year] || 0;
    }

    return finalData;
};


export const updateClicksGraph = (type, timeframe) => {
    const { hourlyClicks } = getGameData();
    const now = Date.now();
    let labels = [];
    let data = [];
    let labelText = '';
    
    if (timeframe === '24h') {
        labels = Array.from({length: 24}, (_, i) => {
            const date = new Date(now - (23 - i) * 60 * 60 * 1000);
            return `${date.getHours()}:00`;
        });
        if (type === 'clicks') {
            data = labels.map((_, i) => {
                const hour = (new Date(now - (23 - i) * 60 * 60 * 1000)).getHours();
                return hourlyClicks[hour] || 0;
            });
            labelText = 'Last 24 Hours (Clicks)';
        } else if (type === 'cps') {
            data = labels.map((_, i) => {
                const hour = (new Date(now - (23 - i) * 60 * 60 * 1000)).getHours();
                const clicksInHour = hourlyClicks[hour] || 0;
                return (clicksInHour / 3600).toFixed(2);
            });
            labelText = 'Last 24 Hours (CPS)';
        }
    } else if (timeframe === '7d') {
        const recentDailyClicks = getDailyClicks(7);
        const sortedKeys = Object.keys(recentDailyClicks).sort((a, b) => a - b);
        labels = sortedKeys.map(key => {
            const d = new Date(parseInt(key) * (1000 * 60 * 60 * 24));
            return d.toLocaleDateString('en-US', { weekday: 'short' });
        });
        if (type === 'clicks') {
            data = sortedKeys.map(key => recentDailyClicks[key]);
            labelText = 'Last 7 Days (Clicks)';
        } else if (type === 'cps') {
            data = sortedKeys.map(key => (recentDailyClicks[key] / (24 * 60 * 60)).toFixed(2));
            labelText = 'Last 7 Days (CPS)';
        }
    } else if (timeframe === '30d') {
        const recentDailyClicks = getDailyClicks(30);
        const sortedKeys = Object.keys(recentDailyClicks).sort((a, b) => a - b);
        labels = sortedKeys.map(key => {
            const d = new Date(parseInt(key) * (1000 * 60 * 60 * 24));
            return `${d.getMonth() + 1}/${d.getDate()}`;
        });
        if (type === 'clicks') {
            data = sortedKeys.map(key => recentDailyClicks[key]);
            labelText = 'Last 30 Days (Clicks)';
        } else if (type === 'cps') {
            data = sortedKeys.map(key => (recentDailyClicks[key] / (24 * 60 * 60)).toFixed(2));
            labelText = 'Last 30 Days (CPS)';
        }
    } else if (timeframe === 'lifetime') {
        const yearlyClicks = getLifetimeClicks();
        labels = Object.keys(yearlyClicks);
        if (type === 'clicks') {
            data = Object.values(yearlyClicks);
            labelText = 'Lifetime (Clicks)';
        } else if (type === 'cps') {
            // CPS over a year is total clicks / seconds in a year
            const secondsInYear = 365 * 24 * 60 * 60;
            data = Object.values(yearlyClicks).map(clicks => (clicks / secondsInYear).toFixed(2));
            labelText = 'Lifetime (CPS)';
        }
    }

    if (clicksGraph) {
        clicksGraph.data.labels = labels;
        clicksGraph.data.datasets[0].data = data;
        clicksGraph.data.datasets[0].label = labelText;
        clicksGraph.update();
    } else {
        const ctx = clicksGraphCanvas.getContext('2d');
        clicksGraph = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: labelText,
                    data: data,
                    backgroundColor: 'rgba(0, 170, 255, 0.5)',
                    borderColor: 'rgba(0, 170, 255, 1)',
                    borderWidth: 1,
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: {
                        ticks: { color: '#fff' },
                        grid: { color: 'rgba(255,255,255,0.1)' }
                    },
                    y: {
                        ticks: { color: '#fff' },
                        grid: { color: 'rgba(255,255,255,0.1)' }
                    }
                },
                plugins: {
                    legend: {
                        labels: { color: '#fff' }
                    }
                }
            }
        });
    }
};

// Event Listeners for stats modal
statsCloseBtn.addEventListener('click', hideStatsModal);

typeDropdownButton.addEventListener('click', (event) => {
    event.stopPropagation();
    typeDropdownMenu.classList.toggle('hidden');
    sortDropdownMenu.classList.add('hidden');
});

sortDropdownButton.addEventListener('click', (event) => {
    event.stopPropagation();
    sortDropdownMenu.classList.toggle('hidden');
    typeDropdownMenu.classList.add('hidden');
});

document.querySelectorAll('.type-menu .dropdown-item').forEach(item => {
    item.addEventListener('click', (event) => {
        currentGraphType = event.target.dataset.type;
        updateClicksGraph(currentGraphType, currentGraphTimeframe);
        typeDropdownMenu.classList.add('hidden');
        typeText.textContent = event.target.textContent;
    });
});

document.querySelectorAll('.sort-menu .dropdown-item').forEach(item => {
    item.addEventListener('click', (event) => {
        currentGraphTimeframe = event.target.dataset.sort;
        updateClicksGraph(currentGraphType, currentGraphTimeframe);
        sortDropdownMenu.classList.add('hidden');
        sortByText.textContent = event.target.textContent;
    });
});

setInterval(updateStats, 1000);