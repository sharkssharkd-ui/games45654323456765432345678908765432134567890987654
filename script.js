/* --- СИСТЕМА НАВИГАЦИИ --- */
const nav = {
    to: (screenId) => {
        document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
        document.getElementById(`screen-${screenId}`).classList.add('active');
    }
};

/* --- МЕНЕДЖЕР ТЕМ --- */
const themes = {
    set: (name) => {
        document.body.className = `theme-${name}`;
        // Сохраним выбор (опционально)
        localStorage.setItem('theme', name);
    }
};

// Загрузка темы при старте
if(localStorage.getItem('theme')) themes.set(localStorage.getItem('theme'));

/* =========================================
   ЗМЕЙКА (SNAKE GAME)
   ========================================= */
const snakeGame = {
    canvas: document.getElementById('snake-canvas'),
    ctx: null,
    interval: null,
    snake: [],
    food: {},
    dir: {x:0, y:-1},
    nextDir: {x:0, y:-1}, // Исправление бага с быстрым разворотом
    running: false,
    
    start: () => {
        nav.to('snake-game');
        snakeGame.ctx = snakeGame.canvas.getContext('2d');
        snakeGame.snake = [{x:7, y:7}, {x:7, y:8}, {x:7, y:9}];
        snakeGame.placeFood();
        snakeGame.dir = {x:0, y:-1};
        snakeGame.nextDir = {x:0, y:-1};
        snakeGame.running = true;
        
        // Расчет скорости
        let val = document.getElementById('snake-speed').value;
        let ms = 200 - (val * 15);
        
        if(snakeGame.interval) clearInterval(snakeGame.interval);
        snakeGame.interval = setInterval(snakeGame.update, ms);
        
        document.addEventListener('keydown', snakeGame.keyHandler);
    },

    stop: () => {
        snakeGame.running = false;
        clearInterval(snakeGame.interval);
        document.removeEventListener('keydown', snakeGame.keyHandler);
        nav.to('snake-menu');
    },

    placeFood: () => {
        snakeGame.food = { x: Math.floor(Math.random()*15), y: Math.floor(Math.random()*15) };
    },

    setDir: (x, y) => {
        if (snakeGame.dir.x === 0 && x !== 0) snakeGame.nextDir = {x, y};
        if (snakeGame.dir.y === 0 && y !== 0) snakeGame.nextDir = {x, y};
    },

    keyHandler: (e) => {
        const k = e.key;
        if(k==='ArrowUp' || k==='w') snakeGame.setDir(0, -1);
        if(k==='ArrowDown' || k==='s') snakeGame.setDir(0, 1);
        if(k==='ArrowLeft' || k==='a') snakeGame.setDir(-1, 0);
        if(k==='ArrowRight' || k==='d') snakeGame.setDir(1, 0);
    },

    update: () => {
        snakeGame.dir = snakeGame.nextDir;
        const head = {x: snakeGame.snake[0].x + snakeGame.dir.x, y: snakeGame.snake[0].y + snakeGame.dir.y};

        // Смерть об стену или хвост
        if(head.x < 0 || head.x >= 15 || head.y < 0 || head.y >= 15 || 
           snakeGame.snake.some(s => s.x === head.x && s.y === head.y)) {
            alert(`GAME OVER! Счет: ${snakeGame.snake.length - 3}`);
            snakeGame.stop();
            return;
        }

        snakeGame.snake.unshift(head);

        if(head.x === snakeGame.food.x && head.y === snakeGame.food.y) {
            document.getElementById('snake-score').innerText = snakeGame.snake.length - 3;
            snakeGame.placeFood();
        } else {
            snakeGame.snake.pop();
        }
        snakeGame.draw();
    },

    draw: () => {
        const ctx = snakeGame.ctx;
        const cs = 20; // 300px / 15 клеток
        
        ctx.fillStyle = getComputedStyle(document.body).getPropertyValue('--snake-bg').trim();
        ctx.fillRect(0,0,300,300);

        // Еда
        ctx.fillStyle = getComputedStyle(document.body).getPropertyValue('--apple').trim();
        ctx.beginPath();
        ctx.arc(snakeGame.food.x*cs + 10, snakeGame.food.y*cs + 10, 8, 0, Math.PI*2);
        ctx.fill();

        // Змея
        ctx.fillStyle = getComputedStyle(document.body).getPropertyValue('--snake-body').trim();
        snakeGame.snake.forEach(s => {
            ctx.fillRect(s.x*cs+1, s.y*cs+1, cs-2, cs-2);
        });
    }
};

/* =========================================
   КРЕСТИКИ-НОЛИКИ (TIC-TAC-TOE)
   ========================================= */
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
            btn.className = 'ttt-cell ' + (cell === 'X' ? 'cell-x' : 'cell-o');
            btn.innerText = cell;
            btn.onclick = () => tttGame.click(i);
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
        if(!tttGame.board.includes('')) {
            document.getElementById('ttt-status').innerText = "НИЧЬЯ!";
            tttGame.active = false;
            return;
        }
        
        tttGame.turn = tttGame.turn === 'X' ? 'O' : 'X';
        document.getElementById('ttt-status').innerText = `Ход: ${tttGame.turn}`;

        if(tttGame.mode === 'pve' && tttGame.turn === 'O' && tttGame.active) {
            setTimeout(tttGame.botMove, 400);
        }
    },

    botMove: () => {
        const empties = tttGame.board.map((v, i) => v === '' ? i : null).filter(v => v !== null);
        if(empties.length > 0) {
            tttGame.click(empties[Math.floor(Math.random() * empties.length)]);
        }
    },

    checkWin: (p) => {
        const wins = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
        return wins.some(c => tttGame.board[c[0]]===p && tttGame.board[c[1]]===p && tttGame.board[c[2]]===p);
    }
};

/* =========================================
   САПЕР (MINESWEEPER)
   ========================================= */
const sapperGame = {
    grid: [],
    size: 8,
    mines: 10,
    gameOver: false,

    start: (diff) => {
        nav.to('sapper-game');
        sapperGame.gameOver = false;
        
        if(diff === 'easy') { sapperGame.size = 8; sapperGame.mines = 10; }
        if(diff === 'medium') { sapperGame.size = 10; sapperGame.mines = 18; }
        if(diff === 'hard') { sapperGame.size = 12; sapperGame.mines = 25; } // Уменьшил для экрана

        document.getElementById('sapper-mines-left').innerText = sapperGame.mines;
        sapperGame.generateGrid();
        sapperGame.render();
    },

    generateGrid: () => {
        sapperGame.grid = [];
        // Создаем пустую сетку
        for(let r=0; r<sapperGame.size; r++) {
            let row = [];
            for(let c=0; c<sapperGame.size; c++) {
                row.push({ isMine: false, revealed: false, flagged: false, neighbors: 0 });
            }
            sapperGame.grid.push(row);
        }

        // Расставляем мины
        let placed = 0;
        while(placed < sapperGame.mines) {
            let r = Math.floor(Math.random() * sapperGame.size);
            let c = Math.floor(Math.random() * sapperGame.size);
            if(!sapperGame.grid[r][c].isMine) {
                sapperGame.grid[r][c].isMine = true;
                placed++;
            }
        }

        // Считаем соседей
        for(let r=0; r<sapperGame.size; r++) {
            for(let c=0; c<sapperGame.size; c++) {
                if(!sapperGame.grid[r][c].isMine) {
                    let count = 0;
                    for(let i=-1; i<=1; i++) {
                        for(let j=-1; j<=1; j++) {
                            if(r+i>=0 && r+i<sapperGame.size && c+j>=0 && c+j<sapperGame.size) {
                                if(sapperGame.grid[r+i][c+j].isMine) count++;
                            }
                        }
                    }
                    sapperGame.grid[r][c].neighbors = count;
                }
            }
        }
    },

    render: () => {
        const div = document.getElementById('sapper-grid');
        div.style.gridTemplateColumns = `repeat(${sapperGame.size}, 1fr)`;
        div.innerHTML = '';

        for(let r=0; r<sapperGame.size; r++) {
            for(let c=0; c<sapperGame.size; c++) {
                const cell = sapperGame.grid[r][c];
                const btn = document.createElement('div');
                btn.className = 'sap-cell';
                
                if(cell.revealed) {
                    btn.classList.add('revealed');
                    if(cell.isMine) {
                        btn.classList.add('mine');
                        btn.innerText = '💣';
                    } else if(cell.neighbors > 0) {
                        btn.innerText = cell.neighbors;
                        // Цвета цифр
                        const colors = ['#22d3ee', '#34d399', '#f472b6', '#a78bfa'];
                        btn.style.color = colors[cell.neighbors-1] || 'white';
                    }
                } else if(cell.flagged) {
                    btn.classList.add('flag');
                    btn.innerText = '🚩';
                }

                // ЛКМ
                btn.onclick = () => sapperGame.click(r, c);
                // ПКМ (Флаг)
                btn.oncontextmenu = (e) => { e.preventDefault(); sapperGame.flag(r, c); };
                
                div.appendChild(btn);
            }
        }
    },

    click: (r, c) => {
        if(sapperGame.gameOver || sapperGame.grid[r][c].flagged || sapperGame.grid[r][c].revealed) return;

        sapperGame.grid[r][c].revealed = true;

        if(sapperGame.grid[r][c].isMine) {
            sapperGame.gameOver = true;
            // Показать все мины
            sapperGame.grid.forEach(row => row.forEach(cell => { if(cell.isMine) cell.revealed = true; }));
            sapperGame.render();
            alert('ВЗРЫВ!');
        } else {
            if(sapperGame.grid[r][c].neighbors === 0) {
                sapperGame.revealNeighbors(r, c);
            }
            sapperGame.render();
        }
    },

    revealNeighbors: (r, c) => {
        for(let i=-1; i<=1; i++) {
            for(let j=-1; j<=1; j++) {
                let nr = r+i, nc = c+j;
                if(nr>=0 && nr<sapperGame.size && nc>=0 && nc<sapperGame.size) {
                    let neighbor = sapperGame.grid[nr][nc];
                    if(!neighbor.revealed && !neighbor.isMine && !neighbor.flagged) {
                        neighbor.revealed = true;
                        if(neighbor.neighbors === 0) sapperGame.revealNeighbors(nr, nc);
                    }
                }
            }
        }
    },

    flag: (r, c) => {
        if(sapperGame.gameOver || sapperGame.grid[r][c].revealed) return;
        sapperGame.grid[r][c].flagged = !sapperGame.grid[r][c].flagged;
        sapperGame.render();
    }
};
