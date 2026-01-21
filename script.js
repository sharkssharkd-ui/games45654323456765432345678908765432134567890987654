const App = {
    stats: JSON.parse(localStorage.getItem('mg_stats')) || { snake:0, m3:0, bs:0, sapper:0, ttt:0 },
    theme: localStorage.getItem('mg_theme') || 'blue',
    init() {
        this.setTheme(this.theme);
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
    toSetup(game) { this.show('screen-setup-' + game); },
    backFromGame(game) { this.show('screen-setup-' + game); }
};

const Modal = {
    show(t, m, cb) {
        document.getElementById('modal-h').innerText = t;
        document.getElementById('modal-p').innerText = m;
        document.getElementById('modal').classList.add('show');
        document.getElementById('modal-btn').onclick = () => {
            document.getElementById('modal').classList.remove('show');
            if(cb) cb();
        };
    }
};

const Setup = {
    vals: { snakeSpeed:5, snakeApples:1, m3Targets:2, sapperMines:10 },
    snakeFruits: { gold:true, blue:true, purple:true, chili:false, cherry:false, lime:false },
    
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
            const match = el.getAttribute('onclick').match(/'([^']+)'/);
            if(match && !this.snakeFruits[match[1]]) el.classList.remove('active');
        });
    },
    setSapperDiff(btn, mines) {
        document.querySelectorAll('.row-btn .opt-btn').forEach(b=>b.classList.remove('active'));
        btn.classList.add('active');
        this.vals.sapperMines = mines;
    }
};

const Stats = {
    render() {
        const s = App.stats;
        document.getElementById('stats-list').innerHTML = `
            <div class="stats-row"><span>🐍 Змейка (Рекорд)</span><b>${s.snake}</b></div>
            <div class="stats-row"><span>💎 3 в ряд (Побед)</span><b>${s.m3}</b></div>
            <div class="stats-row"><span>⚓ Морской бой (Побед)</span><b>${s.bs}</b></div>
            <div class="stats-row"><span>💣 Сапер (Побед)</span><b>${s.sapper}</b></div>
            <div class="stats-row"><span>❌ Крестики (Побед)</span><b>${s.ttt}</b></div>`;
    }
};

// === ЗМЕЙКА (GREEN + CYAN FRUIT) ===
const SnakeGame = {
    loop:null, snake:[], dir:{x:0,y:-1}, food:[], score:0, effects:{},
    
    start() {
        Nav.show('screen-game-snake');
        const c = document.getElementById('snake-canvas');
        c.width = 340; c.height = 340;
        this.ctx = c.getContext('2d');
        this.snake = [{x:10,y:10},{x:10,y:11},{x:10,y:12}];
        this.dir = {x:0,y:-1};
        this.score = 0;
        this.food = [];
        this.effects = { ghost:0 };
        this.spawnFood();
        this.draw();
        
        const speed = 250 - (Setup.vals.snakeSpeed * 20);
        if(this.loop) clearInterval(this.loop);
        this.loop = setInterval(() => this.update(), speed);
    },
    stop() { if(this.loop) clearInterval(this.loop); },
    input(x,y) { if(this.dir.x !== -x && this.dir.y !== -y) this.dir = {x,y}; },
    update() {
        const head = {x:this.snake[0].x+this.dir.x, y:this.snake[0].y+this.dir.y};
        if(head.x<0||head.x>16||head.y<0||head.y>16 || this.snake.some(s=>s.x===head.x && s.y===head.y)) return this.over();
        this.snake.unshift(head);
        const fIdx = this.food.findIndex(f=>f.x===head.x && f.y===head.y);
        if(fIdx !== -1) {
            this.handleEat(this.food[fIdx]); this.food.splice(fIdx, 1); this.spawnFood();
        } else this.snake.pop();
        document.getElementById('snake-score').innerText = this.score;
        this.draw();
    },
    handleEat(f) {
        if(f.type==='apple') this.score++;
        if(f.type==='gold') this.score+=5;
        if(f.type==='blue') this.snake.splice(-3);
    },
    spawnFood() {
        const types = ['gold','blue','purple','chili','cherry','lime'];
        const active = types.filter(t => Setup.snakeFruits[t]);
        while(this.food.length < Setup.vals.snakeApples) {
            let type = 'apple';
            if(active.length > 0 && Math.random() < 0.3) type = active[Math.floor(Math.random()*active.length)];
            let f = {x:Math.floor(Math.random()*17), y:Math.floor(Math.random()*17), type:type};
            if(!this.snake.some(s=>s.x===f.x && s.y===f.y)) this.food.push(f);
        }
    },
    draw() {
        this.ctx.fillStyle='#00000040'; this.ctx.fillRect(0,0,340,340);
        // Food
        const icons = {apple:'🍎', gold:'🍌', blue:'💠', purple:'🍇', chili:'🌶', cherry:'🍒', lime:'🍈'}; // Blue changed to Diamond icon for visibility
        this.ctx.font='18px serif'; this.ctx.textAlign='center'; this.ctx.textBaseline='middle';
        this.food.forEach(f => {
            this.ctx.fillText(icons[f.type], f.x*20+10, f.y*20+10);
        });
        // Snake (GREEN)
        this.snake.forEach((s,i) => {
            const alpha = Math.max(0.3, 1-(i*0.03));
            this.ctx.fillStyle = `rgba(74, 222, 128, ${alpha})`; // #4ade80 Green
            this.ctx.fillRect(s.x*20+1, s.y*20+1, 18, 18);
        });
    },
    over() {
        this.stop();
        if(this.score > App.stats.snake) App.stats.snake = this.score;
        App.save();
        Modal.show("GAME OVER", `Счет: ${this.score}`, ()=>Nav.toSetup('snake'));
    }
};

// === 3 В РЯД ===
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
        // Targets
        const tCount = Setup.vals.m3Targets;
        const used = new Set();
        while(used.size < tCount) used.add(Math.floor(Math.random()*6));
        this.targets = {};
        used.forEach(i => this.targets[i] = 5 + Math.floor(Math.random()*5));
        let sum = Object.values(this.targets).reduce((a,b)=>a+b,0);
        this.moves = 10 + Math.floor(sum*1.2); // Formula
        this.renderUI();
        // Grid
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
        d.onclick = () => this.click(r,c);
        document.getElementById('m3-board').appendChild(d);
        this.grid[r][c] = {dom:d, type:type, r:r, c:c};
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
    click(r, c) {
        if(this.lock) return;
        const g = this.grid[r][c];
        if(!this.selected) {
            this.selected = g; g.dom.classList.add('selected');
        } else {
            const s = this.selected;
            s.dom.classList.remove('selected');
            this.selected = null;
            if(Math.abs(s.r-r)+Math.abs(s.c-c) === 1) this.swap(s, g);
            else if(s !== g) { this.selected=g; g.dom.classList.add('selected'); }
        }
    },
    swap(a, b) {
        this.lock = true;
        const at = a.dom.style.top, al = a.dom.style.left;
        a.dom.style.top = b.dom.style.top; a.dom.style.left = b.dom.style.left;
        b.dom.style.top = at; b.dom.style.left = al;
        this.grid[a.r][a.c] = b; this.grid[b.r][b.c] = a;
        const tr=a.r, tc=a.c; a.r=b.r; a.c=b.c; b.r=tr; b.c=tc;
        setTimeout(() => {
            if(this.check()) { this.moves--; this.renderUI(); }
            else {
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
            g.dom.querySelector('.gem-inner').style.transform = 'scale(0)';
        });
        this.renderUI();
        setTimeout(() => {
            gems.forEach(g => {
                // Simple Gravity: Respawn at place
                g.type = Math.floor(Math.random()*6);
                g.dom.querySelector('.gem-inner').style.background = this.colors[g.type];
                g.dom.querySelector('.gem-inner').style.transform = 'scale(1)';
            });
            setTimeout(() => { if(!this.check()) this.lock = false; }, 300);
        }, 300);
    },
    end(win) {
        if(win) App.stats.m3++; App.save();
        Modal.show(win?"ПОБЕДА!":"ФИНИШ", win?"Собрано!":"Ходы кончились", ()=>Nav.backFromGame('match3'));
    }
};

// === BATTLESHIP ===
const BSGame = {
    pBoard:[], eBoard:[],
    start() {
        Nav.show('screen-game-battleship');
        this.pBoard = Array(100).fill(0);
        this.eBoard = Array(100).fill(0);
        this.place(this.pBoard); this.place(this.eBoard);
        this.render();
        document.getElementById('bs-status').innerText = "ВАШ ХОД";
    },
    place(b) {
        [4,3,3,2,2,2,1,1,1,1].forEach(s => {
            let placed = false;
            while(!placed) {
                let r=Math.floor(Math.random()*10), c=Math.floor(Math.random()*10), h=Math.random()>0.5;
                if(this.can(b,r,c,s,h)) {
                    for(let i=0;i<s;i++) h ? b[r*10+c+i]=1 : b[(r+i)*10+c]=1;
                    placed = true;
                }
            }
        });
    },
    can(b,r,c,s,h) {
        if(h) { if(c+s>10)return false; for(let i=c;i<c+s;i++) if(b[r*10+i]) return false; }
        else { if(r+s>10)return false; for(let i=r;i<r+s;i++) if(b[(i)*10+c]) return false; }
        return true;
    },
    render() {
        const p = document.getElementById('bs-player');
        const e = document.getElementById('bs-enemy');
        p.innerHTML=''; e.innerHTML='';
        for(let i=0; i<100; i++) {
            let d = document.createElement('div');
            d.className = 'bs-cell ' + (this.pBoard[i]===1?'ship':(this.pBoard[i]===2?'miss':(this.pBoard[i]===3?'hit':'')));
            p.appendChild(d);
            let d2 = document.createElement('div');
            let s = this.eBoard[i];
            d2.className = 'bs-cell ' + (s===2?'miss':(s===3?'hit':''));
            d2.onclick = () => this.shoot(i);
            e.appendChild(d2);
        }
    },
    shoot(i) {
        if(this.eBoard[i]>1) return;
        const hit = this.eBoard[i]===1;
        this.eBoard[i] = hit?3:2;
        document.getElementById('bs-status').innerText = hit ? "ПОПАЛ!" : "ПРОМАХ";
        this.render();
        if(hit) { if(this.checkWin()) return; }
        else setTimeout(()=>this.bot(), 500);
    },
    bot() {
        let i; do{i=Math.floor(Math.random()*100);}while(this.pBoard[i]>1);
        const hit = this.pBoard[i]===1;
        this.pBoard[i] = hit?3:2;
        this.render();
        if(hit) { if(this.checkWin()) return; setTimeout(()=>this.bot(), 600); }
        else document.getElementById('bs-status').innerText = "ВАШ ХОД";
    },
    checkWin() {
        if(!this.eBoard.includes(1)) { App.stats.bs++; App.save(); Modal.show("ПОБЕДА!", "Враг разбит", ()=>Nav.backFromGame('battleship')); return true; }
        if(!this.pBoard.includes(1)) { Modal.show("ПОРАЖЕНИЕ", "Флот потерян", ()=>Nav.backFromGame('battleship')); return true; }
        return false;
    }
};

// === CHESS (PVP) ===
const ChessGame = {
    board: [], sel: -1, turn: 'white',
    start() {
        Nav.show('screen-game-chess');
        const el = document.getElementById('chess-board');
        el.innerHTML = '';
        // Init board (uppercase=White, lowercase=black)
        const init = [
            'r','n','b','q','k','b','n','r',
            'p','p','p','p','p','p','p','p',
            '','','','','','','','',
            '','','','','','','','',
            '','','','','','','','',
            '','','','','','','','',
            'P','P','P','P','P','P','P','P',
            'R','N','B','Q','K','B','N','R'
        ];
        this.board = [...init];
        this.sel = -1;
        this.turn = 'white';
        this.render();
    },
    render() {
        const el = document.getElementById('chess-board');
        el.innerHTML = '';
        const sym = {'r':'♜','n':'♞','b':'♝','q':'♛','k':'♚','p':'♟', 'R':'♖','N':'♘','B':'♗','Q':'♕','K':'♔','P':'♙'};
        
        for(let i=0; i<64; i++) {
            const d = document.createElement('div');
            const row = Math.floor(i/8), col = i%8;
            d.className = `chess-cell ${(row+col)%2===0 ? 'light' : 'dark'}`;
            if(this.sel === i) d.classList.add('selected');
            d.innerText = sym[this.board[i]] || '';
            d.onclick = () => this.click(i);
            el.appendChild(d);
        }
        document.getElementById('chess-msg').innerText = "Ход: " + (this.turn==='white'?'Белые':'Черные');
    },
    click(i) {
        if(this.sel === -1) {
            // Select
            if(this.board[i]) this.sel = i;
        } else {
            // Move (NO RULES CHECK for simplicity)
            this.board[i] = this.board[this.sel];
            this.board[this.sel] = '';
            this.sel = -1;
            this.turn = this.turn==='white'?'black':'white';
        }
        this.render();
    }
};

// TTT и Sapper - стандартные (уже были выше, код тот же, убедитесь что ID совпадают)
const TTTGame = {
    b:[], t:'X',
    start() { Nav.show('screen-game-ttt'); this.b=Array(9).fill(''); this.t='X'; this.render(); },
    render() {
        const el = document.getElementById('ttt-board'); el.innerHTML='';
        this.b.forEach((v,i) => {
            let d = document.createElement('div');
            d.className = 'ttt-cell'; d.innerText=v; d.style.color=v==='X'?'#60A5FA':'#F87171';
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
        if(this.t==='O') setTimeout(()=>this.bot(), 400);
    },
    bot() {
        let e = this.b.map((v,i)=>v===''?i:null).filter(v=>v!==null);
        if(e.length) this.move(e[Math.floor(Math.random()*e.length)]);
    },
    check(p) { return [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]].some(c => this.b[c[0]]===p && this.b[c[1]]===p && this.b[c[2]]===p); }
};

const SapperGame = {
    grid:[], tool:'dig', mines:10,
    start() {
        Nav.show('screen-game-sapper');
        const el = document.getElementById('sapper-field');
        el.innerHTML = '';
        el.style.gridTemplateColumns = 'repeat(10, 1fr)';
        this.mines = Setup.vals.sapperMines;
        document.getElementById('sapper-count').innerText = "💣 " + this.mines;
        this.grid = Array(100).fill(0).map((_,i)=>({i, m:false, o:false, f:false, n:0}));
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
    setTool(t) { 
        this.tool=t; 
        document.querySelectorAll('.sapper-tools button').forEach(b=>b.classList.remove('active')); 
        document.getElementById('tool-'+t).classList.add('active'); 
    },
    render() {
        const el = document.getElementById('sapper-field');
        el.innerHTML='';
        this.grid.forEach(c => {
            let d = document.createElement('div');
            d.className = 'sapper-cell ' + (c.o?'revealed':'');
            if(c.o) { if(c.m) {d.innerText='💣'; d.style.background='#ef4444';} else if(c.n>0) {d.innerText=c.n; d.style.color=['#3B82F6','#10B981','#EF4444'][c.n-1]||'white';} }
            else if(c.f) d.innerText='🚩';
            d.onclick = () => this.click(c);
            el.appendChild(d);
        });
    },
    click(c) {
        if(c.o) return;
        if(this.tool==='flag') { c.f=!c.f; this.render(); return; }
        if(c.f) return;
        c.o=true;
        if(c.m) { this.render(); Modal.show("БАБАХ!", "Мина.", ()=>Nav.backFromGame('sapper')); }
        else {
            if(c.n===0) this.openZ(c.i);
            this.render();
            if(this.grid.filter(x=>!x.m && x.o).length === (100 - this.mines)) { 
                App.stats.sapper++; App.save(); Modal.show("ПОБЕДА!","Чисто.",()=>Nav.backFromGame('sapper')); 
            }
        }
    },
    openZ(i) {
        const r=Math.floor(i/10), col=i%10;
        for(let x=-1;x<=1;x++) for(let y=-1;y<=1;y++) {
            const nr=r+y, nc=col+x, ni=nr*10+nc;
            if(nr>=0&&nr<10&&nc>=0&&nc<10) {
                let n=this.grid[ni];
                if(!n.o && !n.m) { n.o=true; if(n.n===0) this.openZ(ni); }
            }
        }
    }
};

App.init();
