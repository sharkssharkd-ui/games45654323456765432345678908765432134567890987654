// === ЯДРО ===
const App = {
    stats: JSON.parse(localStorage.getItem('mg_stats')) || { snake:0, m3:0, bs:0, sapper:0, ttt:0 },
    theme: localStorage.getItem('mg_theme') || 'blue',
    init() {
        this.setTheme(this.theme);
        // Загрузка настроек змейки
        const sf = localStorage.getItem('snake_fruits');
        if(sf) Setup.snakeFruits = JSON.parse(sf);
        Setup.renderSnakeToggles();
    },
    save() { localStorage.setItem('mg_stats', JSON.stringify(this.stats)); },
    setTheme(t) { document.body.className = 'theme-'+t; localStorage.setItem('mg_theme', t); }
};

const Nav = {
    show(id) {
        document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
        document.getElementById(id).classList.add('active');
        SnakeGame.stop(); 
        if(id === 'screen-stats') Stats.render();
    },
    toSetup(game) {
        this.show('screen-setup-' + game);
    },
    backFromGame(game) {
        this.show('screen-setup-' + game);
    }
};

const Modal = {
    show(t, m, cb) {
        document.getElementById('modal-h').innerText = t;
        document.getElementById('modal-p').innerText = m;
        document.getElementById('modal').classList.add('show');
        const btn = document.getElementById('modal-btn');
        btn.onclick = () => {
            document.getElementById('modal').classList.remove('show');
            if(cb) cb();
        };
    }
};

const Setup = {
    vals: { snakeSpeed:5, snakeApples:1, m3Targets:2, sapperMines:10 },
    snakeFruits: { gold:true, blue:true, purple:true, cherry:true, lime:false, mushroom:false, chili:false },
    
    updateLabel(key, val) {
        const map = {'snake-speed':'snakeSpeed', 'snake-apples':'snakeApples', 'm3-targets':'m3Targets'};
        this.vals[map[key]] = parseInt(val);
        document.getElementById('val-'+key).innerText = val;
    },
    toggleFruit(el, type) {
        this.snakeFruits[type] = !this.snakeFruits[type];
        el.classList.toggle('active', this.snakeFruits[type]);
        localStorage.setItem('snake_fruits', JSON.stringify(this.snakeFruits));
    },
    renderSnakeToggles() {
        document.querySelectorAll('.toggle-item').forEach(el => {
            const type = el.getAttribute('onclick').split("'")[1];
            if(!this.snakeFruits[type]) el.classList.remove('active');
        });
    },
    setSapperDiff(btn, mines) {
        document.querySelectorAll('.row-btn .opt-btn').forEach(b=>b.classList.remove('active'));
        btn.classList.add('active');
        this.vals.sapperMines = mines;
    }
};

// === ЗМЕЙКА (PRO) ===
const SnakeGame = {
    loop:null, snake:[], dir:{x:0,y:-1}, food:[], score:0, effects:{},
    
    start() {
        Nav.show('screen-game-snake');
        this.ctx = document.getElementById('snake-canvas').getContext('2d');
        this.snake = [{x:10,y:10},{x:10,y:11},{x:10,y:12}];
        this.dir = {x:0,y:-1};
        this.score = 0;
        this.food = [];
        this.effects = {};
        this.spawnFood();
        this.draw();
        
        // Base speed 
        this.baseSpeed = 220 - (Setup.vals.snakeSpeed * 18);
        this.currentSpeed = this.baseSpeed;
        
        this.runLoop();
        
        document.onkeydown = e => {
            const k=e.key;
            if(k==='w'||k==='ArrowUp') this.input(0,-1);
            if(k==='s'||k==='ArrowDown') this.input(0,1);
            if(k==='a'||k==='ArrowLeft') this.input(-1,0);
            if(k==='d'||k==='ArrowRight') this.input(1,0);
        };
    },
    
    runLoop() {
        if(this.loop) clearInterval(this.loop);
        this.loop = setInterval(() => this.update(), this.currentSpeed);
    },
    
    stop() { if(this.loop) clearInterval(this.loop); document.onkeydown=null; },
    input(x,y) { if(this.dir.x !== -x && this.dir.y !== -y) this.dir = {x,y}; },
    
    update() {
        // Ghost mode logic
        if(this.effects.ghost > 0) this.effects.ghost -= 100;
        
        const head = {x:this.snake[0].x+this.dir.x, y:this.snake[0].y+this.dir.y};
        
        // Walls
        const wallHit = head.x<0||head.x>16||head.y<0||head.y>16;
        if(this.effects.ghost > 0 && wallHit) {
            // Wrap around
            if(head.x<0) head.x=16; if(head.x>16) head.x=0;
            if(head.y<0) head.y=16; if(head.y>16) head.y=0;
        } else if(wallHit) {
            return this.over();
        }
        
        // Self collision
        if(this.snake.some(s=>s.x===head.x && s.y===head.y)) return this.over();
        
        this.snake.unshift(head);
        
        // Eat
        const fIdx = this.food.findIndex(f=>f.x===head.x && f.y===head.y);
        if(fIdx !== -1) {
            this.handleEat(this.food[fIdx]);
            this.food.splice(fIdx, 1);
            this.spawnFood();
        } else {
            this.snake.pop();
        }
        
        this.draw();
        document.getElementById('snake-score').innerText = this.score;
        
        // Effect UI
        const effDiv = document.getElementById('snake-effect');
        effDiv.innerText = this.effects.ghost>0 ? `👻 ПРИЗРАК ${(this.effects.ghost/1000).toFixed(1)}s` : "";
    },
    
    handleEat(item) {
        if(item.type === 'apple') this.score++;
        else if(item.type === 'gold') this.score += 5;
        else if(item.type === 'blue') { this.snake.splice(-3); }
        else if(item.type === 'purple') { 
            this.currentSpeed = this.baseSpeed * 1.5; this.runLoop();
            setTimeout(()=>{this.currentSpeed=this.baseSpeed; this.runLoop()}, 5000);
        }
        else if(item.type === 'lime') { this.effects.ghost = 5000; }
        else if(item.type === 'chili') { 
            this.currentSpeed = this.baseSpeed * 0.6; this.runLoop();
            setTimeout(()=>{this.currentSpeed=this.baseSpeed; this.runLoop()}, 5000);
        }
        else if(item.type === 'cherry') {
            // Bomb 3x3 (food only)
            this.score+=2;
        }
    },
    
    spawnFood() {
        const types = ['gold','blue','purple','cherry','lime','mushroom','chili'];
        const activeTypes = types.filter(t => Setup.snakeFruits[t]);
        
        while(this.food.length < Setup.vals.snakeApples) {
            let type = 'apple';
            // 20% шанс на бонус, если они включены
            if(activeTypes.length > 0 && Math.random() < 0.25) {
                type = activeTypes[Math.floor(Math.random()*activeTypes.length)];
            }
            
            let f = {x:Math.floor(Math.random()*17), y:Math.floor(Math.random()*17), type:type};
            if(!this.snake.some(s=>s.x===f.x && s.y===f.y)) this.food.push(f);
        }
    },
    
    draw() {
        this.ctx.fillStyle='#00000040'; this.ctx.fillRect(0,0,340,340);
        // Food
        const icons = {apple:'🍎', gold:'🍌', blue:'🫐', purple:'🍇', cherry:'🍒', lime:'🍈', mushroom:'🍄', chili:'🌶'};
        this.ctx.font = '16px serif';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        
        this.food.forEach(f => {
            this.ctx.fillText(icons[f.type], f.x*20+10, f.y*20+10);
        });
        
        // Snake
        this.snake.forEach((s,i) => {
            this.ctx.fillStyle = i===0 ? '#ffffff' : `rgba(56, 189, 248, ${Math.max(0.3, 1-(i*0.03))})`;
            if(this.effects.ghost > 0) this.ctx.fillStyle = `rgba(16, 185, 129, ${Math.max(0.3, 1-(i*0.03))})`;
            this.ctx.fillRect(s.x*20+1, s.y*20+1, 18, 18);
        });
    },
    
    over() {
        this.stop();
        if(this.score > App.stats.snake) App.stats.snake = this.score;
        App.save();
        Modal.show("GAME OVER", `Счет: ${this.score}`, ()=>Nav.backFromGame('snake'));
    }
};

// === 3 В РЯД (FIXED) ===
const Match3Game = {
    grid: [], colors: ['#EF4444','#10B981','#3B82F6','#FCD34D','#A855F7','#F97316'],
    moves: 0, targets: {}, lock: false, selected: null,
    
    start() {
        Nav.show('screen-game-match3');
        const board = document.getElementById('m3-board');
        board.innerHTML = '';
        this.grid = [];
        this.lock = false;
        this.selected = null;
        
        const tCount = Setup.vals.m3Targets;
        const used = new Set();
        while(used.size < tCount) used.add(Math.floor(Math.random()*6));
        this.targets = {};
        used.forEach(i => this.targets[i] = 5 + Math.floor(Math.random()*6));
        
        let sum = Object.values(this.targets).reduce((a,b)=>a+b,0);
        this.moves = 10 + Math.floor(sum*1.2);
        
        this.renderUI();
        
        for(let r=0; r<8; r++) {
            this.grid[r] = [];
            for(let c=0; c<8; c++) this.spawnGem(r, c, Math.floor(Math.random()*6));
        }
    },
    
    spawnGem(r, c, type) {
        const d = document.createElement('div');
        d.className = 'gem'; 
        d.innerHTML = `<div class="gem-inner" style="background:${this.colors[type]}"></div>`;
        d.style.top = (r*40)+'px'; d.style.left = (c*40)+'px';
        
        // ВАЖНО: Привязываем клик к координатам, а не к элементу, чтобы не было путаницы при анимации
        d.onclick = () => this.click(this.getCoords(d));
        
        document.getElementById('m3-board').appendChild(d);
        this.grid[r][c] = {dom:d, type:type, r:r, c:c};
    },
    
    getCoords(dom) {
        // Находим гем в сетке
        for(let r=0;r<8;r++) for(let c=0;c<8;c++) if(this.grid[r][c] && this.grid[r][c].dom === dom) return {r,c};
        return null;
    },
    
    renderUI() {
        document.getElementById('m3-moves').innerText = this.moves;
        const div = document.getElementById('m3-targets');
        div.innerHTML = '';
        let win = true;
        for(let k in this.targets) {
            if(this.targets[k] > 0) {
                win = false;
                div.innerHTML += `<div class="target-chip"><span class="tiny-gem" style="background:${this.colors[k]}"></span>${this.targets[k]}</div>`;
            }
        }
        if(win) this.end(true); else if(this.moves<=0) this.end(false);
    },
    
    click(coords) {
        if(this.lock || !coords) return;
        const {r, c} = coords;
        const g = this.grid[r][c];
        
        if(!this.selected) {
            this.selected = g; g.dom.classList.add('selected');
        } else {
            const s = this.selected;
            s.dom.classList.remove('selected');
            this.selected = null;
            if(s !== g && Math.abs(s.r-r)+Math.abs(s.c-c) === 1) this.swap(s, g);
            else if(s !== g) { this.selected = g; g.dom.classList.add('selected'); }
        }
    },
    
    swap(a, b) {
        this.lock = true;
        // Visual
        const at = a.dom.style.top, al = a.dom.style.left;
        a.dom.style.top = b.dom.style.top; a.dom.style.left = b.dom.style.left;
        b.dom.style.top = at; b.dom.style.left = al;
        // Logic
        this.grid[a.r][a.c] = b; this.grid[b.r][b.c] = a;
        const tr=a.r, tc=a.c; a.r=b.r; a.c=b.c; b.r=tr; b.c=tc;
        
        setTimeout(() => {
            if(this.check()) {
                this.moves--; this.renderUI();
            } else {
                // Swap back
                a.dom.style.top = at; a.dom.style.left = al;
                b.dom.style.top = b.dom.style.top; b.dom.style.left = b.dom.style.left;
                this.grid[a.r][a.c] = a; this.grid[b.r][b.c] = b;
                const tr=a.r, tc=a.c; a.r=b.r; a.c=b.c; b.r=tr; b.c=tc;
                this.lock = false;
            }
        }, 250);
    },
    
    check() {
        let m = new Set();
        // Simple 3 check
        for(let r=0; r<8; r++) for(let c=0; c<6; c++) {
            let t = this.grid[r][c].type;
            if(t === this.grid[r][c+1].type && t === this.grid[r][c+2].type) { m.add(this.grid[r][c]); m.add(this.grid[r][c+1]); m.add(this.grid[r][c+2]); }
        }
        for(let c=0; c<8; c++) for(let r=0; r<6; r++) {
            let t = this.grid[r][c].type;
            if(t === this.grid[r+1][c].type && t === this.grid[r+2][c].type) { m.add(this.grid[r][c]); m.add(this.grid[r+1][c]); m.add(this.grid[r+2][c]); }
        }
        if(m.size > 0) { this.process(Array.from(m)); return true; }
        return false;
    },
    
    process(gems) {
        gems.forEach(g => {
            if(this.targets[g.type] > 0) this.targets[g.type]--;
            g.dom.style.transform = 'scale(0)';
        });
        this.renderUI();
        
        setTimeout(() => {
            gems.forEach(g => {
                g.dom.remove();
                this.grid[g.r][g.c] = null;
            });
            this.gravity();
        }, 250);
    },
    
    gravity() {
        for(let c=0; c<8; c++) {
            let hole = 0;
            for(let r=7; r>=0; r--) {
                if(!this.grid[r][c]) hole++;
                else if(hole > 0) {
                    const g = this.grid[r][c];
                    this.grid[r+hole][c] = g; this.grid[r][c] = null;
                    g.r += hole; g.dom.style.top = (g.r*40)+'px';
                }
            }
            for(let i=0; i<hole; i++) {
                this.spawnGem(i, c, Math.floor(Math.random()*6));
                // Animate fall
                const g = this.grid[i][c];
                g.dom.style.transition = 'none';
                g.dom.style.top = '-40px';
                setTimeout(() => { g.dom.style.transition = ''; g.dom.style.top = (i*40)+'px'; }, 50);
            }
        }
        setTimeout(() => { if(!this.check()) this.lock = false; }, 350);
    },
    
    end(win) {
        if(win) App.stats.m3++; App.save();
        Modal.show(win?"ПОБЕДА!":"ФИНИШ", win?"Собрано!":"Ходы кончились", ()=>Nav.backFromGame('match3'));
    }
};

// === BATTLESHIP (REDESIGNED) ===
const BSGame = {
    pBoard:[], eBoard:[],
    start() {
        Nav.show('screen-game-battleship');
        this.pBoard = this.makeB(); this.eBoard = this.makeB();
        this.place(this.pBoard); this.place(this.eBoard);
        this.render();
    },
    makeB() { return Array(10).fill(0).map(()=>Array(10).fill(0)); },
    place(b) {
        [4,3,3,2,2,2,1,1,1,1].forEach(s => {
            let placed = false;
            while(!placed) {
                let r=Math.floor(Math.random()*10), c=Math.floor(Math.random()*10), h=Math.random()>0.5;
                if(this.can(b,r,c,s,h)) {
                    for(let i=0;i<s;i++) h ? b[r][c+i]=1 : b[r+i][c]=1;
                    placed = true;
                }
            }
        });
    },
    can(b,r,c,s,h) {
        if(h) { if(c+s>10)return false; for(let i=c;i<c+s;i++) if(b[r][i]) return false; }
        else { if(r+s>10)return false; for(let i=r;i<r+s;i++) if(b[i][c]) return false; }
        return true;
    },
    render() {
        const p = document.getElementById('bs-player');
        const e = document.getElementById('bs-enemy');
        p.innerHTML=''; e.innerHTML='';
        for(let r=0;r<10;r++) for(let c=0;c<10;c++) {
            // Player (Small, Top)
            let d = document.createElement('div');
            d.className = 'bs-cell ' + (this.pBoard[r][c]===1?'ship':(this.pBoard[r][c]===2?'miss':(this.pBoard[r][c]===3?'hit':'')));
            p.appendChild(d);
            // Enemy (Big, Bottom, Clickable)
            let d2 = document.createElement('div');
            let s = this.eBoard[r][c];
            d2.className = 'bs-cell ' + (s===2?'miss':(s===3?'hit':''));
            d2.onclick = () => this.shoot(r,c);
            e.appendChild(d2);
        }
    },
    shoot(r,c) {
        if(this.eBoard[r][c]>1) return;
        const hit = this.eBoard[r][c]===1;
        this.eBoard[r][c] = hit?3:2;
        document.getElementById('bs-status').innerText = hit ? "ПОПАЛ!" : "ПРОМАХ";
        if(hit) { if(this.checkWin()) return; }
        else setTimeout(()=>this.bot(), 500);
        this.render();
    },
    bot() {
        let r,c; do{r=Math.floor(Math.random()*10);c=Math.floor(Math.random()*10);}while(this.pBoard[r][c]>1);
        const hit = this.pBoard[r][c]===1;
        this.pBoard[r][c] = hit?3:2;
        if(hit) { if(this.checkWin()) return; setTimeout(()=>this.bot(), 500); }
        else document.getElementById('bs-status').innerText = "ВАШ ХОД";
        this.render();
    },
    checkWin() {
        const eAlive = this.eBoard.flat().includes(1);
        const pAlive = this.pBoard.flat().includes(1);
        if(!eAlive || !pAlive) {
            if(!eAlive) App.stats.bs++;
            App.save();
            Modal.show(pAlive?"ПОБЕДА":"ПОРАЖЕНИЕ", pAlive?"Флот разбит!":"Ваш флот уничтожен.", ()=>Nav.backFromGame('battleship'));
            return true;
        }
        return false;
    }
};

// === SAPPER (FLOOD FILL FIXED) ===
const SapperGame = {
    grid:[], tool:'dig', size:10, mines:10,
    start() {
        Nav.show('screen-game-sapper');
        const el = document.getElementById('sapper-field');
        el.innerHTML = '';
        el.style.gridTemplateColumns = 'repeat(10, 1fr)';
        this.mines = Setup.vals.sapperMines;
        document.getElementById('sapper-count').innerText = "💣 " + this.mines;
        
        this.grid = Array(100).fill(0).map((_,i)=>({i, m:false, o:false, f:false, n:0}));
        
        // Place mines (ensure first click is safe later or random now)
        let m=0; while(m<this.mines) { let i=Math.floor(Math.random()*100); if(!this.grid[i].m){this.grid[i].m=true; m++;} }
        
        this.grid.forEach(c => {
            if(c.m) return;
            const r=Math.floor(c.i/10), col=c.i%10;
            for(let x=-1;x<=1;x++) for(let y=-1;y<=1;y++) {
                const nr=r+y, nc=col+x;
                if(nr>=0&&nr<10&&nc>=0&&nc<10&&this.grid[nr*10+nc].m) c.n++;
            }
        });
        this.render();
    },
    setTool(t) { this.tool=t; document.querySelectorAll('.sapper-tools button').forEach(b=>b.classList.remove('active')); document.getElementById('tool-'+t).classList.add('active'); },
    render() {
        const el = document.getElementById('sapper-field');
        el.innerHTML='';
        this.grid.forEach(c => {
            let d = document.createElement('div');
            d.className = 'sapper-cell ' + (c.o?'revealed':'');
            if(c.o) { if(c.m) d.innerText='💣'; else if(c.n>0) {d.innerText=c.n; d.style.color=['#3B82F6','#10B981','#EF4444'][c.n-1]||'white';} }
            else if(c.f) d.innerText='🚩';
            d.onclick = () => this.click(c);
            el.appendChild(d);
        });
    },
    click(c) {
        if(c.o) return;
        if(this.tool==='flag') { c.f=!c.f; this.render(); return; }
        if(c.f) return;
        
        if(c.m) { 
            c.o=true; this.render();
            Modal.show("БАБАХ!", "Мина взорвана.", ()=>Nav.backFromGame('sapper')); 
        } else {
            this.reveal(c);
            this.render();
            if(this.grid.filter(x=>!x.m && x.o).length === (100 - this.mines)) { 
                App.stats.sapper++; App.save(); 
                Modal.show("ПОБЕДА!","Поле чисто.",()=>Nav.backFromGame('sapper')); 
            }
        }
    },
    reveal(c) {
        if(c.o || c.f) return;
        c.o = true;
        if(c.n === 0) {
            const r=Math.floor(c.i/10), col=c.i%10;
            for(let x=-1;x<=1;x++) for(let y=-1;y<=1;y++) {
                const nr=r+y, nc=col+x;
                if(nr>=0&&nr<10&&nc>=0&&nc<10) this.reveal(this.grid[nr*10+nc]);
            }
        }
    }
};

const TTTGame = {
    b:[], t:'X',
    start() { Nav.show('screen-game-ttt'); this.b=Array(9).fill(''); this.t='X'; this.render(); },
    render() {
        const el = document.getElementById('ttt-board'); el.innerHTML='';
        this.b.forEach((v,i) => {
            let d = document.createElement('div');
            d.className = 'ttt-cell'; d.innerText=v; d.style.color=v==='X'?'#38BDF8':'#A78BFA';
            d.onclick = () => this.move(i);
            el.appendChild(d);
        });
        document.getElementById('ttt-msg').innerText = "Ход: "+this.t;
    },
    move(i) {
        if(this.b[i]) return;
        this.b[i] = this.t;
        if(this.check(this.t)) { 
            Modal.show(this.t+" WIN!", "", ()=>Nav.backFromGame('ttt'));
            if(this.t==='X') App.stats.ttt++; App.save();
            return;
        }
        if(!this.b.includes('')) { Modal.show("НИЧЬЯ", "", ()=>Nav.backFromGame('ttt')); return; }
        this.t = this.t==='X'?'O':'X';
        this.render();
        if(this.t==='O') setTimeout(()=>this.bot(), 300);
    },
    bot() {
        // Блокировка / Победа
        const wins = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
        let move = -1;
        
        // 1. Попытка выиграть
        move = this.findBestMove('O', wins);
        // 2. Блокировка игрока
        if(move === -1) move = this.findBestMove('X', wins);
        // 3. Рандом
        if(move === -1) {
            let e = this.b.map((v,i)=>v===''?i:null).filter(v=>v!==null);
            if(e.length) move = e[Math.floor(Math.random()*e.length)];
        }
        
        if(move !== -1) this.move(move);
    },
    findBestMove(p, wins) {
        for(let c of wins) {
            const vals = [this.b[c[0]], this.b[c[1]], this.b[c[2]]];
            if(vals.filter(v=>v===p).length===2 && vals.includes('')) {
                return c[vals.indexOf('')];
            }
        }
        return -1;
    },
    check(p) {
        return [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]].some(c => this.b[c[0]]===p && this.b[c[1]]===p && this.b[c[2]]===p);
    }
};

App.init();
