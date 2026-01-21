// === СИСТЕМА (APP) ===
const App = {
    stats: {
        snake: { high: 0, apples: 0 },
        match3: { high: 0, wins: 0 },
        bs: { wins: 0, loss: 0 },
        sapper: { wins: 0, loss: 0 },
        ttt: { x: 0, o: 0 }
    },
    
    init() {
        // Загрузка статистики
        const saved = localStorage.getItem('mega_stats');
        if (saved) this.stats = JSON.parse(saved);
        
        // Загрузка темы
        const theme = localStorage.getItem('mega_theme') || '';
        if(theme) document.body.className = theme;
    },

    saveStats() {
        localStorage.setItem('mega_stats', JSON.stringify(this.stats));
    },

    setTheme(name) {
        document.body.className = 'theme-' + name;
        localStorage.setItem('mega_theme', 'theme-' + name);
    },

    show(screenId) {
        document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
        document.getElementById('screen-' + screenId).classList.add('active');
        
        // Остановка игр
        SnakeGame.stop();
        
        if (screenId === 'stats') this.renderStats();
    },

    start(game) {
        this.show(game);
        if (game === 'snake') SnakeGame.init();
        if (game === 'match3') Match3Game.init();
        if (game === 'battleship') BSGame.init();
        if (game === 'sapper') SapperGame.init();
        if (game === 'ttt') TTTGame.init();
    },

    renderStats() {
        const s = this.stats;
        const html = `
            <p><b>ЗМЕЙКА:</b> Рекорд: ${s.snake.high} | Яблок: ${s.snake.apples}</p>
            <p><b>3 В РЯД:</b> Побед: ${s.match3.wins} | Рекорд: ${s.match3.high}</p>
            <p><b>МОРСКОЙ БОЙ:</b> Побед: ${s.bs.wins} | Поражений: ${s.bs.loss}</p>
            <p><b>САПЕР:</b> Побед: ${s.sapper.wins} | Взрывов: ${s.sapper.loss}</p>
            <p><b>КРЕСТИКИ:</b> X: ${s.ttt.x} | O: ${s.ttt.o}</p>
        `;
        document.getElementById('stats-content').innerHTML = html;
    },

    resetStats() {
        localStorage.removeItem('mega_stats');
        location.reload();
    }
};

// === ЗМЕЙКА ===
const SnakeGame = {
    canvas: null, ctx: null, loop: null,
    snake: [], food: [], bonus: null, dir: {x:0, y:-1}, score: 0,
    
    init() {
        this.canvas = document.getElementById('snake-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.snake = [{x:10, y:10}, {x:10, y:11}, {x:10, y:12}];
        this.dir = {x:0, y:-1};
        this.score = 0;
        this.food = [];
        this.bonus = null;
        this.spawnFood();
        this.updateScore();
        
        if(this.loop) clearInterval(this.loop);
        this.loop = setInterval(() => this.update(), 120);
        
        document.addEventListener('keydown', this.handleKey);
    },

    stop() {
        if(this.loop) clearInterval(this.loop);
        document.removeEventListener('keydown', this.handleKey);
    },

    handleKey(e) {
        const k = e.key;
        if(k==='w' || k==='ArrowUp') SnakeGame.input(0, -1);
        if(k==='s' || k==='ArrowDown') SnakeGame.input(0, 1);
        if(k==='a' || k==='ArrowLeft') SnakeGame.input(-1, 0);
        if(k==='d' || k==='ArrowRight') SnakeGame.input(1, 0);
    },

    input(x, y) {
        if (this.dir.x === -x || this.dir.y === -y) return;
        this.dir = {x, y};
    },

    update() {
        const head = {x: this.snake[0].x + this.dir.x, y: this.snake[0].y + this.dir.y};
        const max = 350/20; // grid size roughly

        // Стены (смерть)
        if(head.x < 0 || head.x >= 17 || head.y < 0 || head.y >= 17) return this.gameOver();
        
        // Хвост
        if(this.snake.some(s => s.x === head.x && s.y === head.y)) return this.gameOver();

        this.snake.unshift(head);

        // Еда
        const eatIdx = this.food.findIndex(f => f.x === head.x && f.y === head.y);
        let grew = false;
        
        if (eatIdx !== -1) {
            this.food.splice(eatIdx, 1);
            this.score++;
            App.stats.snake.apples++;
            this.spawnFood();
            this.trySpawnBonus();
            grew = true;
        } 
        
        // Бонус
        if (this.bonus && head.x === this.bonus.x && head.y === this.bonus.y) {
            if(this.bonus.type === 'gold') this.score += 5;
            if(this.bonus.type === 'blue') { this.snake.splice(-3); } // Укоротить
            // Purple (slow) сложнее в JS setInterval, пропустим для простоты
            this.bonus = null;
        }

        if(!grew) this.snake.pop();
        this.updateScore();
        this.draw();
    },

    spawnFood() {
        // Спавним яблоко (пока одно для простоты)
        if(this.food.length === 0) 
            this.food.push({x: Math.floor(Math.random()*17), y: Math.floor(Math.random()*17)});
    },

    trySpawnBonus() {
        if(!this.bonus && Math.random() < 0.2) {
            const types = ['gold', 'blue', 'purple'];
            this.bonus = {
                x: Math.floor(Math.random()*17), 
                y: Math.floor(Math.random()*17),
                type: types[Math.floor(Math.random()*3)]
            };
            setTimeout(() => this.bonus = null, 8000);
        }
    },

    draw() {
        const ctx = this.ctx;
        ctx.clearRect(0,0,350,350);
        
        // Еда
        ctx.fillStyle = '#EF4444';
        this.food.forEach(f => {
            ctx.fillRect(f.x*20, f.y*20, 18, 18);
            // Листик
            ctx.fillStyle = '#10B981';
            ctx.beginPath(); ctx.arc(f.x*20+10, f.y*20, 4, 0, Math.PI*2); ctx.fill();
        });

        // Бонус
        if(this.bonus) {
            ctx.fillStyle = this.bonus.type === 'gold' ? '#FCD34D' : (this.bonus.type === 'blue' ? '#3B82F6' : '#A855F7');
            ctx.beginPath(); ctx.arc(this.bonus.x*20+10, this.bonus.y*20+10, 8, 0, Math.PI*2); ctx.fill();
        }

        // Змея (Градиент)
        this.snake.forEach((s, i) => {
            const alpha = Math.max(0.3, 1 - (i * 0.02));
            ctx.fillStyle = `rgba(56, 189, 248, ${alpha})`; // Цвет темы
            ctx.fillRect(s.x*20, s.y*20, 18, 18);
        });
    },

    updateScore() {
        document.getElementById('snake-score').innerText = this.score;
    },

    gameOver() {
        clearInterval(this.loop);
        if(this.score > App.stats.snake.high) App.stats.snake.high = this.score;
        App.saveStats();
        alert('GAME OVER! Счет: ' + this.score);
        App.show('menu');
    }
};

// === 3 В РЯД ===
const Match3Game = {
    grid: [], colors: ['#EF4444', '#10B981', '#3B82F6', '#FCD34D', '#A855F7', '#F97316', '#06B6D4', '#FFFFFF'],
    selected: null, moves: 0, score: 0, targets: {},
    
    init() {
        const el = document.getElementById('m3-grid');
        el.innerHTML = '';
        this.grid = [];
        this.moves = 25;
        this.score = 0;
        
        // Генерация целей (2-4 случайных цвета)
        this.targets = {};
        const count = 2 + Math.floor(Math.random()*3);
        const used = new Set();
        while(used.size < count) used.add(Math.floor(Math.random()*8));
        used.forEach(idx => this.targets[idx] = 5 + Math.floor(Math.random()*5)); // 5-10 шт
        
        // Расчет ходов
        let sum = Object.values(this.targets).reduce((a,b)=>a+b, 0);
        this.moves = 10 + Math.floor(sum * 1.1);

        this.renderUI();

        // Заполнение
        for(let r=0; r<8; r++) {
            this.grid[r] = [];
            for(let c=0; c<8; c++) {
                const colorIdx = Math.floor(Math.random()*8);
                const gem = document.createElement('div');
                gem.className = 'gem';
                gem.style.backgroundColor = this.colors[colorIdx];
                gem.onclick = () => this.click(r, c);
                el.appendChild(gem);
                this.grid[r][c] = { dom: gem, val: colorIdx };
            }
        }
    },

    renderUI() {
        document.getElementById('m3-moves').innerText = 'Ходы: ' + this.moves;
        const tDiv = document.getElementById('m3-targets');
        tDiv.innerHTML = '';
        let win = true;
        for(let k in this.targets) {
            if(this.targets[k] > 0) {
                win = false;
                const d = document.createElement('div');
                d.className = 'target-item';
                d.innerHTML = `<span class="dot" style="background:${this.colors[k]}"></span><span>${this.targets[k]}</span>`;
                tDiv.appendChild(d);
            }
        }
        if(win) this.gameOver(true);
        else if(this.moves <= 0) this.gameOver(false);
    },

    click(r, c) {
        if(!this.selected) {
            this.selected = {r, c};
            this.grid[r][c].dom.classList.add('selected');
        } else {
            const s = this.selected;
            this.grid[s.r][s.c].dom.classList.remove('selected');
            this.selected = null;
            
            if (Math.abs(s.r - r) + Math.abs(s.c - c) === 1) {
                this.swap(s.r, s.c, r, c);
            }
        }
    },

    swap(r1, c1, r2, c2) {
        // Логический свап
        let temp = this.grid[r1][c1].val;
        this.grid[r1][c1].val = this.grid[r2][c2].val;
        this.grid[r2][c2].val = temp;
        
        // Визуальный свап
        this.grid[r1][c1].dom.style.backgroundColor = this.colors[this.grid[r1][c1].val];
        this.grid[r2][c2].dom.style.backgroundColor = this.colors[this.grid[r2][c2].val];
        
        this.moves--;
        this.checkMatches();
        this.renderUI();
    },

    checkMatches() {
        // Упрощенная проверка (только что свапнутые не проверяем, ищем все)
        // Для JS-версии "на коленке" делаем простую механику
        // В полной версии тут нужен BFS
        // Здесь реализуем "клик - проверка соседей цвета"
        // ПЕРЕПИСЫВАЮ на простую проверку: если свапнул и совпало 3 - удалить.
        
        let toRemove = new Set();
        // Гор
        for(let r=0; r<8; r++) {
            for(let c=0; c<6; c++) {
                let v = this.grid[r][c].val;
                if(v === this.grid[r][c+1].val && v === this.grid[r][c+2].val) {
                    toRemove.add(`${r},${c}`); toRemove.add(`${r},${c+1}`); toRemove.add(`${r},${c+2}`);
                }
            }
        }
        // Верт
        for(let c=0; c<8; c++) {
            for(let r=0; r<6; r++) {
                let v = this.grid[r][c].val;
                if(v === this.grid[r+1][c].val && v === this.grid[r+2][c].val) {
                    toRemove.add(`${r},${c}`); toRemove.add(`${r+1},${c}`); toRemove.add(`${r+2},${c}`);
                }
            }
        }

        if(toRemove.size > 0) {
            toRemove.forEach(key => {
                let [r,c] = key.split(',').map(Number);
                let v = this.grid[r][c].val;
                
                // Цели
                if(this.targets[v] !== undefined && this.targets[v] > 0) this.targets[v]--;
                
                // "Удаление" (смена на рандом сверху)
                this.grid[r][c].val = Math.floor(Math.random()*8);
                this.grid[r][c].dom.style.backgroundColor = this.colors[this.grid[r][c].val];
                
                // Анимация (мигание)
                this.grid[r][c].dom.style.opacity = 0;
                setTimeout(()=>this.grid[r][c].dom.style.opacity=1, 200);
            });
            this.renderUI();
        }
    },

    gameOver(win) {
        if(this.score > App.stats.match3.high) App.stats.match3.high = this.score;
        if(win) App.stats.match3.wins++;
        App.saveStats();
        setTimeout(() => {
            alert(win ? "ПОБЕДА!" : "Ходы кончились!");
            App.show('menu');
        }, 100);
    }
};

// === МОРСКОЙ БОЙ ===
const BSGame = {
    pBoard: [], eBoard: [],
    init() {
        this.pBoard = this.createBoard();
        this.eBoard = this.createBoard();
        this.placeShips(this.pBoard);
        this.placeShips(this.eBoard);
        this.renderBoards();
    },
    createBoard() { return Array(10).fill(0).map(()=>Array(10).fill(0)); }, // 0-empty, 1-ship, 2-miss, 3-hit
    
    placeShips(board) {
        [4,3,3,2,2,2,1,1,1,1].forEach(size => {
            let placed = false;
            while(!placed) {
                let r = Math.floor(Math.random()*10);
                let c = Math.floor(Math.random()*10);
                let hor = Math.random() > 0.5;
                if(this.canPlace(board, r, c, size, hor)) {
                    for(let i=0; i<size; i++) {
                        if(hor) board[r][c+i] = 1; else board[r+i][c] = 1;
                    }
                    placed = true;
                }
            }
        });
    },
    canPlace(b, r, c, size, hor) {
        if(hor) {
            if(c+size > 10) return false;
            for(let i=c; i<c+size; i++) if(b[r][i] !== 0) return false; // Упрощено (без соседей для краткости)
        } else {
            if(r+size > 10) return false;
            for(let i=r; i<r+size; i++) if(b[i][c] !== 0) return false;
        }
        return true;
    },
    renderBoards() {
        const pDiv = document.getElementById('bs-player');
        const eDiv = document.getElementById('bs-enemy');
        pDiv.innerHTML = ''; eDiv.innerHTML = '';
        
        for(let r=0; r<10; r++) {
            for(let c=0; c<10; c++) {
                // Player
                let d = document.createElement('div');
                d.className = 'bs-cell ' + (this.pBoard[r][c]===1?'ship':(this.pBoard[r][c]===2?'miss':(this.pBoard[r][c]===3?'hit':'')));
                pDiv.appendChild(d);
                
                // Enemy
                let d2 = document.createElement('div');
                let st = this.eBoard[r][c];
                d2.className = 'bs-cell ' + (st===2?'miss':(st===3?'hit':''));
                d2.onclick = () => this.shoot(r, c);
                eDiv.appendChild(d2);
            }
        }
    },
    shoot(r, c) {
        if(this.eBoard[r][c] > 1) return; // Уже стреляли
        
        if(this.eBoard[r][c] === 1) {
            this.eBoard[r][c] = 3;
            document.getElementById('bs-status').innerText = "ПОПАЛ!";
            this.checkWin();
        } else {
            this.eBoard[r][c] = 2;
            document.getElementById('bs-status').innerText = "ПРОМАХ! Ход бота...";
            setTimeout(() => this.botTurn(), 500);
        }
        this.renderBoards();
    },
    botTurn() {
        let r, c;
        do { r=Math.floor(Math.random()*10); c=Math.floor(Math.random()*10); } 
        while(this.pBoard[r][c] > 1);
        
        if(this.pBoard[r][c] === 1) {
            this.pBoard[r][c] = 3;
            if(this.checkWin()) return;
            setTimeout(() => this.botTurn(), 500); // Бот стреляет еще раз
        } else {
            this.pBoard[r][c] = 2;
            document.getElementById('bs-status').innerText = "ВАШ ХОД";
        }
        this.renderBoards();
    },
    checkWin() {
        // Простая проверка: остались ли корабли (1)
        let eAlive = this.eBoard.flat().includes(1);
        let pAlive = this.pBoard.flat().includes(1);
        
        if(!eAlive) { alert("ПОБЕДА!"); App.stats.bs.wins++; App.saveStats(); App.show('menu'); return true; }
        if(!pAlive) { alert("ПОРАЖЕНИЕ!"); App.stats.bs.loss++; App.saveStats(); App.show('menu'); return true; }
        return false;
    }
};

// === САПЕР ===
const SapperGame = {
    grid: [], size: 10, mines: 10, mode: 'dig',
    init() {
        this.grid = Array(this.size).fill(0).map(()=>Array(this.size).fill({mine:false, open:false, flag:false, n:0}));
        // Мины
        let placed = 0;
        while(placed < this.mines) {
            let r=Math.floor(Math.random()*10), c=Math.floor(Math.random()*10);
            if(!this.grid[r][c].mine) {
                this.grid[r][c] = {...this.grid[r][c], mine:true};
                placed++;
            }
        }
        // Цифры
        for(let r=0; r<10; r++) for(let c=0; c<10; c++) {
            if(!this.grid[r][c].mine) {
                let n=0;
                for(let i=-1;i<=1;i++) for(let j=-1;j<=1;j++) {
                    if(r+i>=0 && r+i<10 && c+j>=0 && c+j<10 && this.grid[r+i][c+j].mine) n++;
                }
                this.grid[r][c] = {...this.grid[r][c], n:n};
            }
        }
        this.render();
    },
    setMode(m) {
        this.mode = m;
        document.getElementById('btn-dig').className = m==='dig'?'active':'';
        document.getElementById('btn-flag').className = m==='flag'?'active':'';
    },
    click(r, c) {
        let cell = this.grid[r][c];
        if(cell.open) return;
        
        if(this.mode === 'flag') {
            cell.flag = !cell.flag;
        } else {
            if(cell.flag) return;
            cell.open = true;
            if(cell.mine) {
                alert('БАБАХ!'); App.stats.sapper.loss++; App.saveStats(); App.show('menu'); return;
            }
            if(cell.n === 0) this.openZero(r, c); // Рекурсия для пустых
        }
        this.render();
        this.checkWin();
    },
    openZero(r, c) {
        for(let i=-1;i<=1;i++) for(let j=-1;j<=1;j++) {
            let nr=r+i, nc=c+j;
            if(nr>=0 && nr<10 && nc>=0 && nc<10 && !this.grid[nr][nc].open) {
                this.grid[nr][nc].open = true;
                if(this.grid[nr][nc].n === 0) this.openZero(nr, nc);
            }
        }
    },
    checkWin() {
        let closed = this.grid.flat().filter(c => !c.open).length;
        if(closed === this.mines) {
            alert('ПОБЕДА!'); App.stats.sapper.wins++; App.saveStats(); App.show('menu');
        }
    },
    render() {
        const el = document.getElementById('sapper-grid');
        el.innerHTML = '';
        el.style.gridTemplateColumns = `repeat(${this.size}, 1fr)`;
        for(let r=0; r<10; r++) for(let c=0; c<10; c++) {
            let d = document.createElement('div');
            let cell = this.grid[r][c];
            d.className = 'sapper-cell ' + (cell.open ? 'revealed' : '');
            if(cell.open) {
                if(cell.mine) d.innerText = '💣';
                else if(cell.n > 0) { d.innerText = cell.n; d.style.color = ['blue','green','red'][cell.n-1]||'black'; }
            } else if(cell.flag) d.innerText = '🚩';
            d.onclick = () => this.click(r, c);
            el.appendChild(d);
        }
    }
};

// === TTT ===
const TTTGame = {
    board: [], turn: 'X',
    init() {
        this.board = Array(9).fill('');
        this.turn = 'X';
        this.render();
    },
    click(i) {
        if(this.board[i]) return;
        this.board[i] = this.turn;
        this.render();
        if(this.checkWin(this.turn)) {
            alert(this.turn + ' WIN!'); 
            if(this.turn==='X') App.stats.ttt.x++; else App.stats.ttt.o++;
            App.saveStats();
            this.init();
            return;
        }
        if(!this.board.includes('')) { alert('DRAW'); this.init(); return; }
        
        this.turn = this.turn==='X'?'O':'X';
        if(this.turn === 'O') setTimeout(() => this.bot(), 300);
    },
    bot() {
        let empties = this.board.map((v, i) => v===''?i:null).filter(v=>v!==null);
        if(empties.length > 0) this.click(empties[Math.floor(Math.random()*empties.length)]);
    },
    checkWin(p) {
        const w = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
        return w.some(c => this.board[c[0]]===p && this.board[c[1]]===p && this.board[c[2]]===p);
    },
    render() {
        const el = document.getElementById('ttt-grid');
        el.innerHTML = '';
        this.board.forEach((v, i) => {
            let d = document.createElement('div');
            d.className = 'ttt-cell';
            d.innerText = v;
            d.style.color = v==='X'?'#38BDF8':'#A78BFA';
            d.onclick = () => this.click(i);
            el.appendChild(d);
        });
        document.getElementById('ttt-status').innerText = 'Ход: ' + this.turn;
    }
};

// Запуск
App.init();
