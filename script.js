// --- ОБЩАЯ ЛОГИКА ---
function showMenu() {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById('menu-screen').classList.add('active');
    stopSnake(); // Остановить змейку при выходе
}

function startGame(game) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    
    if (game === 'snake') {
        document.getElementById('snake-screen').classList.add('active');
        initSnake();
    } else if (game === 'ttt') {
        document.getElementById('ttt-screen').classList.add('active');
        initTTT();
    } else if (game === 'match3') {
        document.getElementById('match3-screen').classList.add('active');
        initMatch3();
    } else {
        alert('Игра в разработке!');
        showMenu();
    }
}

// --- ЗМЕЙКА (SNAKE) ---
let snakeLoop;
let snake = [];
let food = {};
let direction = {x: 0, y: 0};
let score = 0;
const canvas = document.getElementById('snake-canvas');
const ctx = canvas.getContext('2d');
const gridSize = 20;
const tileCount = canvas.width / gridSize;

function initSnake() {
    snake = [{x: 10, y: 10}, {x: 10, y: 11}, {x: 10, y: 12}];
    direction = {x: 0, y: -1};
    score = 0;
    document.getElementById('snake-score').innerText = 'Счет: 0';
    placeFood();
    if (snakeLoop) clearInterval(snakeLoop);
    snakeLoop = setInterval(updateSnake, 100); // Скорость
}

function stopSnake() {
    if (snakeLoop) clearInterval(snakeLoop);
}

function updateSnake() {
    const head = {x: snake[0].x + direction.x, y: snake[0].y + direction.y};

    // Стены (проход сквозь)
    if (head.x < 0) head.x = tileCount - 1;
    if (head.x >= tileCount) head.x = 0;
    if (head.y < 0) head.y = tileCount - 1;
    if (head.y >= tileCount) head.y = 0;

    // Самоедство
    for (let part of snake) {
        if (head.x === part.x && head.y === part.y) {
            alert('Game Over! Счет: ' + score);
            initSnake();
            return;
        }
    }

    snake.unshift(head);

    // Еда
    if (head.x === food.x && head.y === food.y) {
        score++;
        document.getElementById('snake-score').innerText = 'Счет: ' + score;
        placeFood();
    } else {
        snake.pop();
    }

    drawSnake();
}

function drawSnake() {
    ctx.fillStyle = '#111827';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Еда
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(food.x * gridSize, food.y * gridSize, gridSize - 2, gridSize - 2);

    // Змея
    ctx.fillStyle = '#38bdf8';
    for (let part of snake) {
        ctx.fillRect(part.x * gridSize, part.y * gridSize, gridSize - 2, gridSize - 2);
    }
}

function placeFood() {
    food = {
        x: Math.floor(Math.random() * tileCount),
        y: Math.floor(Math.random() * tileCount)
    };
}

function snakeDir(x, y) {
    if (direction.x === -x || direction.y === -y) return; // Нельзя развернуться
    direction = {x, y};
}

// Управление клавиатурой (WASD + Стрелки)
document.addEventListener('keydown', (e) => {
    if (document.getElementById('snake-screen').classList.contains('active')) {
        if ((e.key === 'ArrowUp' || e.key === 'w') && direction.y !== 1) direction = {x: 0, y: -1};
        if ((e.key === 'ArrowDown' || e.key === 's') && direction.y !== -1) direction = {x: 0, y: 1};
        if ((e.key === 'ArrowLeft' || e.key === 'a') && direction.x !== 1) direction = {x: -1, y: 0};
        if ((e.key === 'ArrowRight' || e.key === 'd') && direction.x !== -1) direction = {x: 1, y: 0};
    }
});


// --- КРЕСТИКИ-НОЛИКИ (TTT) ---
let tttBoard = ['', '', '', '', '', '', '', '', ''];
let currentPlayer = 'X';
let gameActive = true;

function initTTT() {
    tttBoard = ['', '', '', '', '', '', '', '', ''];
    currentPlayer = 'X';
    gameActive = true;
    document.getElementById('ttt-status').innerText = 'Ход: X';
    renderTTT();
}

function renderTTT() {
    const boardDiv = document.getElementById('ttt-board');
    boardDiv.innerHTML = '';
    tttBoard.forEach((cell, index) => {
        const div = document.createElement('div');
        div.classList.add('ttt-cell');
        if (cell === 'X') div.classList.add('cell-x');
        if (cell === 'O') div.classList.add('cell-o');
        div.innerText = cell;
        div.onclick = () => tttMove(index);
        boardDiv.appendChild(div);
    });
}

function tttMove(index) {
    if (tttBoard[index] !== '' || !gameActive) return;

    tttBoard[index] = currentPlayer;
    renderTTT();
    checkWinner();

    if (gameActive) {
        currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
        document.getElementById('ttt-status').innerText = 'Ход: ' + currentPlayer;
        // Простой ИИ для одиночной игры
        if (currentPlayer === 'O') {
            setTimeout(botMove, 300);
        }
    }
}

function botMove() {
    if (!gameActive) return;
    let empty = tttBoard.map((val, idx) => val === '' ? idx : null).filter(val => val !== null);
    if (empty.length > 0) {
        let move = empty[Math.floor(Math.random() * empty.length)];
        tttMove(move);
    }
}

function checkWinner() {
    const wins = [
        [0, 1, 2], [3, 4, 5], [6, 7, 8],
        [0, 3, 6], [1, 4, 7], [2, 5, 8],
        [0, 4, 8], [2, 4, 6]
    ];

    for (let combo of wins) {
        let [a, b, c] = combo;
        if (tttBoard[a] && tttBoard[a] === tttBoard[b] && tttBoard[a] === tttBoard[c]) {
            document.getElementById('ttt-status').innerText = 'ПОБЕДА: ' + tttBoard[a];
            gameActive = false;
            return;
        }
    }
    if (!tttBoard.includes('')) {
        document.getElementById('ttt-status').innerText = 'НИЧЬЯ!';
        gameActive = false;
    }
}

// --- 3 В РЯД (Basic Logic) ---
const colors = ['#ef4444', '#22c55e', '#3b82f6', '#eab308', '#a855f7']; // Colors
let m3grid = [];
let selectedGem = null;

function initMatch3() {
    const gridDiv = document.getElementById('m3-grid');
    gridDiv.innerHTML = '';
    m3grid = [];
    for(let r=0; r<8; r++) {
        let row = [];
        for(let c=0; c<8; c++) {
            let color = colors[Math.floor(Math.random() * colors.length)];
            let div = document.createElement('div');
            div.classList.add('gem');
            div.style.backgroundColor = color;
            div.onclick = () => selectGem(div, r, c);
            gridDiv.appendChild(div);
            row.push({div, color, r, c});
        }
        m3grid.push(row);
    }
}

function selectGem(div, r, c) {
    if (!selectedGem) {
        selectedGem = {div, r, c};
        div.classList.add('selected');
    } else {
        selectedGem.div.classList.remove('selected');
        // Простая смена цвета (для примера, полная логика 3-в-ряд сложнее)
        let tempColor = div.style.backgroundColor;
        div.style.backgroundColor = selectedGem.div.style.backgroundColor;
        selectedGem.div.style.backgroundColor = tempColor;
        selectedGem = null;
    }
}
