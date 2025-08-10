// Get the canvas and its 2D drawing context
const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');

// Game state variables
let money = 40000;
let happiness = 0;
let population = 0;
let cityName = "Test_Name";
let selectedObject = null;

// New variables to track change
let moneyChange = 0;
let populationChange = 0;

// Game constants
let TILE_SIZE = 64;
const MAP_SIZE = 64;
const MIN_MONEY_LIMIT = -400;

// Camera offset for dragging and zoom
let cameraX = 0;
let cameraY = 0;
let isDragging = false;
let lastMouseX = 0;
let lastMouseY = 0;
let zoomLevel = 1;
const maxZoom = 4;
const minZoom = 0.25;

// Tile types and their colors
const TILE_TYPES = {
    GRASS: '#6a8c5e',
    RESIDENTIAL_ZONE: '#e57373',
    ZONE_INDICATOR: 'rgba(255, 255, 255, 0.4)',
    ROAD: '#607d8b',
    HIGHWAY_CENTER: '#4b5563',
};

// Map rarity colors to CSS variables
const rarityColorMap = {
    "Common": '#607d8b',
    "Rare": '#81d4fa',
    "Epic": '#9c27b0',
    "Legendary": '#ff9800',
    "Creator Series": '#424242',
    "Other": '#424242'
};

// Game map data (using a Map object for "infinite" storage)
const gameMap = new Map();

// Store objects loaded from JSON
let objects = [];
const textures = new Map();

// Track the flashing state for the blinking zones
let isFlashing = false;
setInterval(() => {
    isFlashing = !isFlashing;
}, 500);

// Rarity order for sorting
const rarityOrder = [
    'Common', 'Rare', 'Epic', 'Legendary', 'Creator Series', 'Other'
];

// --- Functions to handle UI and data loading ---

function updateUI() {
    const moneyDisplay = document.getElementById('money-display').querySelector('.value');
    const moneyChangeDisplay = document.getElementById('money-display').querySelector('.change');
    const populationDisplay = document.getElementById('population-display').querySelector('.value');
    const populationChangeDisplay = document.getElementById('population-display').querySelector('.change');
    const timeDisplay = document.getElementById('current-time');
    const cityDisplay = document.getElementById('city-name-text');

    const currentTime = new Date().toLocaleString('en-US', {
        month: '2-digit',
        day: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
    timeDisplay.textContent = currentTime;

    moneyDisplay.textContent = `$${money.toLocaleString()}`;
    moneyChangeDisplay.textContent = moneyChange > 0 ? `+${moneyChange.toLocaleString()}` : (moneyChange < 0 ? moneyChange.toLocaleString() : '0');
    moneyChangeDisplay.style.color = moneyChange > 0 ? 'green' : (moneyChange < 0 ? 'red' : 'yellow');

    populationDisplay.textContent = `${population.toLocaleString()}`;
    populationChangeDisplay.textContent = populationChange > 0 ? `+${populationChange.toLocaleString()}` : (populationChange < 0 ? populationChange.toLocaleString() : '0');
    populationChangeDisplay.style.color = populationChange > 0 ? 'green' : (populationChange < 0 ? 'red' : 'yellow');

    cityDisplay.textContent = cityName;
}

function updateTaskbarAffordability() {
    objects.forEach(obj => {
        const icon = document.querySelector(`.menu-icon[data-id="${obj.id}"]`);
        if (icon) {
            if (money < obj.cost) {
                icon.classList.add('cannot-afford');
            } else {
                icon.classList.remove('cannot-afford');
            }
        }
    });
}

function selectObject(objectId) {
    const object = objects.find(obj => obj.id === objectId);
    if (object) {
        selectedObject = object;
        document.querySelectorAll('.menu-icon').forEach(icon => {
            icon.classList.remove('selected');
        });
        document.querySelector(`.menu-icon[data-id="${objectId}"]`).classList.add('selected');
    }
}

async function loadObjects() {
    const response = await fetch('object.json');
    const fetchedObjects = await response.json();
    
    objects = fetchedObjects.sort((a, b) => {
        return rarityOrder.indexOf(a.rarity) - rarityOrder.indexOf(b.rarity);
    });

    const topMenu = document.getElementById('top-menu');

    for (const obj of objects) {
        const iconDiv = document.createElement('div');
        iconDiv.classList.add('menu-icon');
        iconDiv.dataset.id = obj.id;
        iconDiv.dataset.rarity = obj.rarity;
        iconDiv.title = `${obj.name} - $${obj.cost}`;
        
        const img = document.createElement('img');
        img.src = `assets/icons/objects/${obj.textureId || `${obj.id}.png`}`; // Use textureId if it exists
        img.alt = obj.name;
        iconDiv.appendChild(img);

        // Preload the texture for drawing on the canvas
        if (obj.textureId) {
            const texture = new Image();
            texture.src = `assets/icons/objects/${obj.textureId}`;
            textures.set(obj.id, texture);
        }

        iconDiv.addEventListener('click', () => selectObject(obj.id));
        topMenu.appendChild(iconDiv);
    }
}

// --- Functions to handle game rendering ---

function drawTile(x, y, type) {
    if (type === TILE_TYPES.GRASS) {
        ctx.fillStyle = TILE_TYPES.GRASS;
        ctx.fillRect(x * TILE_SIZE + cameraX, y * TILE_SIZE + cameraY, TILE_SIZE, TILE_SIZE);
    } else {
        const texture = textures.get(type);
        if (texture) {
            ctx.drawImage(texture, x * TILE_SIZE + cameraX, y * TILE_SIZE + cameraY, TILE_SIZE, TILE_SIZE);
        } else {
            // Fallback to color if texture not found
            ctx.fillStyle = TILE_TYPES[type.toUpperCase()] || 'red';
            ctx.fillRect(x * TILE_SIZE + cameraX, y * TILE_SIZE + cameraY, TILE_SIZE, TILE_SIZE);
        }
    }
}

function drawGrid() {
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;

    const startX = Math.floor(-cameraX / TILE_SIZE);
    const endX = startX + Math.ceil(canvas.width / TILE_SIZE);
    const startY = Math.floor(-cameraY / TILE_SIZE);
    const endY = startY + Math.ceil(canvas.height / TILE_SIZE);

    for (let x = startX; x <= endX; x++) {
        for (let y = startY; y <= endY; y++) {
            if (x >= 0 && x < MAP_SIZE && y >= 0 && y < MAP_SIZE) {
                ctx.beginPath();
                ctx.rect(x * TILE_SIZE + cameraX, y * TILE_SIZE + cameraY, TILE_SIZE, TILE_SIZE);
                ctx.stroke();
            }
        }
    }
}

function drawZones() {
    if (!isFlashing || selectedObject?.id !== 'residential_zone') return;

    ctx.fillStyle = TILE_TYPES.ZONE_INDICATOR;

    gameMap.forEach((tileType, key) => {
        if (tileType.startsWith('road')) { // Check for any road type
            const [x, y] = key.split(',').map(Number);
            const neighbors = [
                [x - 1, y], [x + 1, y],
                [x, y - 1], [x, y + 1]
            ];
            
            neighbors.forEach(([nX, nY]) => {
                if (nX >= 0 && nX < MAP_SIZE && nY >= 0 && nY < MAP_SIZE) {
                    if (!gameMap.has(`${nX},${nY}`)) {
                        ctx.fillRect(nX * TILE_SIZE + cameraX, nY * TILE_SIZE + cameraY, TILE_SIZE, TILE_SIZE);
                    }
                }
            });
        }
    });
}

function drawMap() {
    ctx.fillStyle = TILE_TYPES.GRASS;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const startX = Math.floor(-cameraX / TILE_SIZE);
    const endX = startX + Math.ceil(canvas.width / TILE_SIZE);
    const startY = Math.floor(-cameraY / TILE_SIZE);
    const endY = startY + Math.ceil(canvas.height / TILE_SIZE);

    for (let y = startY; y <= endY; y++) {
        for (let x = startX; x <= endX; x++) {
            if (x >= 0 && x < MAP_SIZE && y >= 0 && y < MAP_SIZE) {
                const tileKey = `${x},${y}`;
                const tileType = gameMap.get(tileKey) || TILE_TYPES.GRASS;
                drawTile(x, y, tileType);
            }
        }
    }

    drawGrid();
    drawZones();
}

// --- Functions to handle user input and game logic ---

function handleCanvasClick(event) {
    if (!selectedObject || isDragging) return;

    const rect = canvas.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;

    const gridX = Math.floor((mouseX - cameraX) / TILE_SIZE);
    const gridY = Math.floor((mouseY - cameraY) / TILE_SIZE);
    const tileKey = `${gridX},${gridY}`;

    if (gridX < 0 || gridX >= MAP_SIZE || gridY < 0 || gridY >= MAP_SIZE) {
        console.log("Cannot place objects outside the map boundary.");
        return;
    }

    if (money >= selectedObject.cost) {
        if (selectedObject.id.startsWith('road')) {
            if (!gameMap.has(tileKey)) {
                gameMap.set(tileKey, selectedObject.id);
                money -= selectedObject.cost;
            }
        } else if (selectedObject.id === 'residential_zone') {
            const neighbors = [
                `${gridX - 1},${gridY}`, `${gridX + 1},${gridY}`,
                `${gridX},${gridY - 1}`, `${gridX},${gridY + 1}`
            ];
            const isNextToRoad = neighbors.some(key => gameMap.get(key) && gameMap.get(key).startsWith('road'));

            if (isNextToRoad && !gameMap.has(tileKey)) {
                gameMap.set(tileKey, selectedObject.id);
                money -= selectedObject.cost;
            }
        }
    } else {
        console.log("Not enough money!");
    }
}

function handleMouseDown(event) {
    isDragging = true;
    lastMouseX = event.clientX;
    lastMouseY = event.clientY;
    canvas.style.cursor = 'grabbing';
}

function handleMouseUp() {
    isDragging = false;
    canvas.style.cursor = 'grab';
}

function handleMouseMove(event) {
    if (!isDragging) return;
    const deltaX = event.clientX - lastMouseX;
    const deltaY = event.clientY - lastMouseY;

    cameraX += deltaX;
    cameraY += deltaY;
    
    // Clamp camera position to prevent moving outside map bounds
    cameraX = Math.min(0, Math.max(cameraX, -MAP_SIZE * TILE_SIZE + canvas.width));
    cameraY = Math.min(0, Math.max(cameraY, -MAP_SIZE * TILE_SIZE + canvas.height));
    
    lastMouseX = event.clientX;
    lastMouseY = event.clientY;
}

function handleMouseWheel(event) {
    event.preventDefault();
    const zoomSpeed = 0.1;
    const oldZoom = zoomLevel;

    if (event.deltaY < 0) {
        zoomLevel += zoomSpeed;
    } else {
        zoomLevel -= zoomSpeed;
    }

    zoomLevel = Math.max(minZoom, Math.min(maxZoom, zoomLevel));

    // Recalculate camera position to zoom to the cursor
    const mouseX = event.clientX - canvas.getBoundingClientRect().left;
    const mouseY = event.clientY - canvas.getBoundingClientRect().top;
    
    const scaleFactor = zoomLevel / oldZoom;
    cameraX = mouseX - (mouseX - cameraX) * scaleFactor;
    cameraY = mouseY - (mouseY - cameraY) * scaleFactor;
    
    TILE_SIZE = 64 * zoomLevel;

    // Re-clamp camera position after zooming
    cameraX = Math.min(0, Math.max(cameraX, -MAP_SIZE * TILE_SIZE + canvas.width));
    cameraY = Math.min(0, Math.max(cameraY, -MAP_SIZE * TILE_SIZE + canvas.height));
}

// --- Initial map generation ---
function createHighway() {
    const yCenter = Math.floor(MAP_SIZE / 2);
    for (let x = 0; x < MAP_SIZE; x++) {
        gameMap.set(`${x},${yCenter - 1}`, 'road_one_lane_basic');
        gameMap.set(`${x},${yCenter}`, 'road_two_lane_basic'); // Using a different tile for the center
        gameMap.set(`${x},${yCenter + 1}`, 'road_one_lane_basic');
    }
}

// The main game loop
function gameLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawMap();
    updateUI();
    updateTaskbarAffordability();
    requestAnimationFrame(gameLoop);
}

// Initial setup
async function init() {
    await loadObjects();
    
    function resizeCanvas() {
        canvas.width = canvas.parentElement.clientWidth;
        canvas.height = canvas.parentElement.clientHeight;
    }
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();
    
    canvas.addEventListener('click', handleCanvasClick);
    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('mouseup', handleMouseUp);
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseleave', handleMouseUp);
    canvas.addEventListener('wheel', handleMouseWheel);
    
    createHighway();

    gameLoop();
}

init();