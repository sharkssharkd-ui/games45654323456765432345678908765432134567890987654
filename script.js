// --- НАВИГАЦИЯ ---
const nav = {
    to: (screenId) => {
        document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
        document.getElementById(`screen-${screenId}`).classList.add('active');
    }
};

// --- ТЕМЫ ---
const themes = {
    set: (name) => {
        document.body.className = `theme-${name}`;
    }
};

// --- ЗМЕЙКА (SNAKE) ---
const snakeGame = {
    canvas: document.getElementById('snake-canvas'),
    ctx: document.getElementById('snake-canvas').getContext('2d'),
    interval: null,
    snake: [],
    food: {},
    dir: {x:0, y:-1},
    cellSize: 20,
    
    start: () => {
        nav.to('snake-game');
        snakeGame.snake = [{x:10, y:10}, {x:10, y:11}, {x:10, y:12}];
        snakeGame.placeFood();
        snakeGame.dir = {x:0, y:-1};
        let speed = 11 - document.getElementById('snake-speed').value;
        if(snakeGame.interval) clearInterval(snakeGame.interval);
        snakeGame.interval = setInterval(snakeGame.update, speed * 20);
        document.addEventListener('keydown', snakeGame.keyHandler);
    },

    stop: () => {
        clearInterval(snakeGame.interval);
        document.removeEventListener('keydown', snakeGame.keyHandler);
    },

    placeFood: () => {
        snakeGame.food = {
            x: Math.floor(Math.random() * 20),
            y: Math.floor(Math.random() * 20)
        };
    },

    keyHandler: (e) => {
        const k = e.key;
        if(k==='w' && snakeGame.dir.y===0) snakeGame.dir = {x:0, y:-1};
        if(k==='s' && snakeGame.dir.y===0) snakeGame.dir = {x:0, y:1};
        if(k==='a' && snakeGame.dir.x===0) snakeGame.dir = {x:-1, y:0};
        if(k==='d' && snakeGame.dir.x===0) snakeGame.dir = {x:1, y:0};
    },

    update: () => {
        const head = {x: snakeGame.snake[0].x + snakeGame.dir.x, y: snakeGame.snake[0].y + snakeGame.dir.y};
        
        // Стенки
        if(head.x < 0 || head.x >= 20 || head.y < 0 || head.y >= 20) return snakeGame.stop();
        // Хвост
        if(snakeGame.snake.some(s => s.x === head.x && s.y === head.y)) return snakeGame.stop();

        snakeGame.snake.unshift(head);

        if(head.x === snakeGame.food.x && head.y === snakeGame.food.y) {
            document.getElementById('snake-score').innerText = `Счет: ${snakeGame.snake.length - 3}`;
            snakeGame.placeFood();
        } else {
            snakeGame.snake.pop();
        }
        snakeGame.draw();
    },

    draw: () => {
        const ctx = snakeGame.ctx;
        const cs = snakeGame.cellSize;
        // Очистка
        ctx.fillStyle = getComputedStyle(document.body).getPropertyValue('--bg-color');
        ctx.fillRect(0,0,400,400);

        // Еда
        ctx.fillStyle = getComputedStyle(document.body).getPropertyValue('--apple');
        ctx.fillRect(snakeGame.food.x*cs, snakeGame.food.y*cs, cs-2, cs-2);

        // Змея
        ctx.fillStyle = getComputedStyle(document.body).getPropertyValue('--snake-body');
        snakeGame.snake.forEach(s => {
            ctx.fillRect(s.x*cs, s.y*cs, cs-2, cs-2);
        });
    }
};

// --- КРЕСТИКИ-НОЛИКИ (TTT) ---
const tttGame = {
    board: [],
    turn: 'X',
    mode: 'pvp',
    active: false,

    start: (mode) => {
        nav.to('ttt-game');
        tttGame.mode = mode;
        tttGame.board = Array(9).fill('');
        tttGame.turn = 'X';
        tttGame.active = true;
        tttGame.render();
        document.getElementById('ttt-status').innerText = "Ход: X";
    },

    render: () => {
        const div = document.getElementById('ttt-board');
        div.innerHTML = '';
        tttGame.board.forEach((cell, i) => {
            const btn = document.createElement('button');
            btn.className = 'ttt-cell';
            btn.innerText = cell;
            btn.onclick = () => tttGame.click(i);
            if(cell === 'X') btn.style.color = '#38bdf8';
            if(cell === 'O') btn.style.color = '#a78bfa';
            div.appendChild(btn);
        });
    },

    click: (i) => {
        if(!tttGame.active || tttGame.board[i] !== '') return;
        
        tttGame.board[i] = tttGame.turn;
        tttGame.render();
        
        if(tttGame.checkWin(tttGame.turn)) {
            document.getElementById('ttt-status').innerText = `ПОБЕДА ${tttGame.turn}!`;
            tttGame.active = false;
            return;
        }
        
        tttGame.turn = tttGame.turn === 'X' ? 'O' : 'X';
        document.getElementById('ttt-status').innerText = `Ход: ${tttGame.turn}`;

        if(tttGame.mode === 'pve' && tttGame.turn === 'O' && tttGame.active) {
            setTimeout(tttGame.botMove, 500);
        }
    },

    botMove: () => {
        const empties = tttGame.board.map((v, i) => v === '' ? i : null).filter(v => v !== null);
        if(empties.length > 0) {
            const move = empties[Math.floor(Math.random() * empties.length)];
            tttGame.click(move);
        }
    },

    checkWin: (p) => {
        const wins = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
        return wins.some(c => tttGame.board[c[0]]===p && tttGame.board[c[1]]===p && tttGame.board[c[2]]===p);
    }
};
