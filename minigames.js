// === МОРСКОЙ БОЙ ===
const BSGame = {
    player: [], enemy: [],
    setup() { /* Здесь можно добавить выбор сложности */ },
    start() {
        Nav.show('game-bs');
        this.player = this.createGrid();
        this.enemy = this.createGrid();
        this.placeShips(this.player);
        this.placeShips(this.enemy);
        this.render();
        document.getElementById('bs-message').innerText = "ВАШ ХОД";
    },
    createGrid() { return Array(100).fill(0); }, // 0:empty, 1:ship, 2:miss, 3:hit
    placeShips(grid) {
        [4,3,3,2,2,2,1,1,1,1].forEach(size => {
            let placed = false;
            while(!placed) {
                const hor = Math.random() > 0.5;
                const r = Math.floor(Math.random()*10);
                const c = Math.floor(Math.random()*10);
                if(this.canPlace(grid, r, c, size, hor)) {
                    for(let i=0; i<size; i++) {
                        const idx = hor ? r*10+(c+i) : (r+i)*10+c;
                        grid[idx] = 1;
                    }
                    placed = true;
                }
            }
        });
    },
    canPlace(grid, r, c, size, hor) {
        if(hor) {
            if(c+size > 10) return false;
            for(let i=0; i<size; i++) if(grid[r*10+(c+i)] !== 0) return false;
        } else {
            if(r+size > 10) return false;
            for(let i=0; i<size; i++) if(grid[(r+i)*10+c] !== 0) return false;
        }
        return true;
    },
    render() {
        const pEl = document.getElementById('bs-player');
        const eEl = document.getElementById('bs-enemy');
        pEl.innerHTML = ''; eEl.innerHTML = '';
        
        for(let i=0; i<100; i++) {
            // Player Cell
            let d = document.createElement('div');
            d.className = 'bs-cell ' + (this.player[i]===1?'ship':(this.player[i]===3?'hit':(this.player[i]===2?'miss':'')));
            pEl.appendChild(d);
            
            // Enemy Cell
            let d2 = document.createElement('div');
            let s = this.enemy[i];
            d2.className = 'bs-cell ' + (s===3?'hit':(s===2?'miss':''));
            d2.onclick = () => this.shoot(i);
            eEl.appendChild(d2);
        }
    },
    shoot(i) {
        if(this.enemy[i] > 1) return;
        
        if(this.enemy[i] === 1) {
            this.enemy[i] = 3;
            document.getElementById('bs-message').innerText = "ПОПАДАНИЕ!";
            this.render();
            if(this.checkWin()) return;
        } else {
            this.enemy[i] = 2;
            document.getElementById('bs-message').innerText = "ПРОМАХ. Ход бота...";
            this.render();
            setTimeout(() => this.botTurn(), 600);
        }
    },
    botTurn() {
        let i;
        do { i = Math.floor(Math.random()*100); } while(this.player[i] > 1);
        
        if(this.player[i] === 1) {
            this.player[i] = 3;
            if(this.checkWin()) return;
            setTimeout(() => this.botTurn(), 600);
        } else {
            this.player[i] = 2;
            document.getElementById('bs-message').innerText = "ВАШ ХОД";
        }
        this.render();
    },
    checkWin() {
        const pLost = !this.player.includes(1);
        const eLost = !this.enemy.includes(1);
        if(pLost || eLost) {
            if(eLost) App.stats.bs_wins++;
            App.saveStats();
            Modal.show(eLost?"ПОБЕДА":"ПОРАЖЕНИЕ", eLost?"Флот врага разбит!":"Наш флот уничтожен.", ()=>Nav.toSetup('battleship'));
            return true;
        }
        return false;
    }
};

// === САПЕР ===
const SapperGame = {
    grid: [], mines: 10, tool: 'dig',
    setup() { },
    start() {
        Nav.show('game-sapper');
        const el = document.getElementById('sapper-field');
        el.innerHTML = '';
        el.style.gridTemplateColumns = 'repeat(10, 1fr)';
        
        // Генерация (10x10)
        this.grid = Array(100).fill().map((_,i)=>({i, mine:false, open:false, flag:false, n:0}));
        let placed = 0;
        while(placed < this.mines) {
            let i = Math.floor(Math.random()*100);
            if(!this.grid[i].mine) { this.grid[i].mine=true; placed++; }
        }
        // Цифры
        this.grid.forEach(c => {
            if(c.mine) return;
            const r = Math.floor(c.i/10), col = c.i%10;
            for(let x=-1;x<=1;x++) for(let y=-1;y<=1;y++) {
                const nr=r+y, nc=col+x;
                if(nr>=0 && nr<10 && nc>=0 && nc<10) {
                    if(this.grid[nr*10+nc].mine) c.n++;
                }
            }
        });
        
        this.render();
    },
    setTool(t) {
        this.tool = t;
        document.querySelectorAll('.sapper-tools button').forEach(b => b.classList.remove('active'));
        document.getElementById('tool-'+t).classList.add('active');
    },
    render() {
        const el = document.getElementById('sapper-field');
        el.innerHTML = '';
        this.grid.forEach(c => {
            const d = document.createElement('div');
            d.className = 'sapper-cell ' + (c.open ? 'revealed' : '');
            if(c.open) {
                if(c.mine) { d.innerText = '💣'; d.style.background='#ef4444'; }
                else if(c.n > 0) { d.innerText = c.n; d.style.color = ['#60a5fa','#4ade80','#f87171'][c.n-1]||'white'; }
            } else if (c.flag) {
                d.innerText = '🚩';
            }
            d.onclick = () => this.click(c);
            el.appendChild(d);
        });
    },
    click(c) {
        if(c.open) return;
        if(this.tool === 'flag') {
            c.flag = !c.flag;
            this.render();
            return;
        }
        if(c.flag) return;
        
        c.open = true;
        if(c.mine) {
            this.render();
            Modal.show("БАБАХ!", "Вы подорвались на мине.", ()=>Nav.toSetup('sapper'));
        } else {
            if(c.n === 0) this.floodFill(c.i);
            this.render();
            // Win check
            if(this.grid.filter(x => !x.mine && x.open).length === (100 - this.mines)) {
                App.stats.sapper_wins++; App.saveStats();
                Modal.show("ЧИСТО!", "Минное поле обезврежено.", ()=>Nav.toSetup('sapper'));
            }
        }
    },
    floodFill(idx) {
        const r=Math.floor(idx/10), col=idx%10;
        for(let x=-1;x<=1;x++) for(let y=-1;y<=1;y++) {
            const nr=r+y, nc=col+x, ni=nr*10+nc;
            if(nr>=0&&nr<10&&nc>=0&&nc<10) {
                const n = this.grid[ni];
                if(!n.open && !n.mine) {
                    n.open = true;
                    if(n.n === 0) this.floodFill(ni);
                }
            }
        }
    }
};

// === TTT ===
const TTTGame = {
    board: [], turn: 'X',
    setup() {},
    start() {
        Nav.show('game-ttt');
        this.board = Array(9).fill('');
        this.turn = 'X';
        this.render();
    },
    render() {
        const el = document.getElementById('ttt-board');
        el.innerHTML = '';
        this.board.forEach((v, i) => {
            const d = document.createElement('div');
            d.className = 'ttt-cell';
            d.innerText = v;
            d.style.color = v==='X'?'#60a5fa':'#f87171';
            d.onclick = () => this.move(i);
            el.appendChild(d);
        });
        document.getElementById('ttt-msg').innerText = "Ход: " + this.turn;
    },
    move(i) {
        if(this.board[i] || this.checkWin()) return;
        this.board[i] = this.turn;
        this.render();
        
        if(this.checkWin()) return this.end(this.turn);
        if(!this.board.includes('')) return this.end(null);
        
        this.turn = this.turn==='X'?'O':'X';
        this.render();
        if(this.turn === 'O') setTimeout(() => this.bot(), 400);
    },
    bot() {
        // Простой ИИ: Блокировка или Рандом
        const empty = this.board.map((v,i)=>v===''?i:null).filter(v=>v!==null);
        if(empty.length === 0) return;
        
        // Попытка победить или блокировать (упрощено)
        let move = empty[Math.floor(Math.random()*empty.length)];
        this.move(move);
    },
    checkWin() {
        const wins = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
        return wins.some(c => this.board[c[0]] && this.board[c[0]]===this.board[c[1]] && this.board[c[0]]===this.board[c[2]]);
    },
    end(winner) {
        if(winner === 'X') App.stats.ttt_wins++;
        App.saveStats();
        Modal.show(winner ? `${winner} ПОБЕДИЛ!` : "НИЧЬЯ", "", ()=>Nav.toSetup('ttt'));
    }
};
