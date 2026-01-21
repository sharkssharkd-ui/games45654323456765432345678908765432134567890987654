// === ЯДРО ===
const App = {
    stats: JSON.parse(localStorage.getItem('mg_stats')) || { snake:0, m3:0, bs:0, sapper:0, ttt:0 },
    theme: localStorage.getItem('mg_theme') || 'blue',
    
    init() {
        this.setTheme(this.theme);
        // Обработчик кнопок "назад"
        document.addEventListener('keydown', e => {
            if(e.key === 'Escape') Nav.show('menu');
        });
    },
    save() { localStorage.setItem('mg_stats', JSON.stringify(this.stats)); },
    setTheme(t) { 
        document.body.className = 'theme-'+t; 
        this.theme = t; 
        localStorage.setItem('mg_theme', t); 
    }
};

const Nav = {
    show(id) {
        document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
        document.getElementById(id.startsWith('screen') ? id : 'screen-' + id).classList.add('active');
        SnakeGame.stop(); // Остановить таймеры
        if(id === 'stats') Stats.render();
    },
    toSetup(game) {
        this.show('menu'); // Сброс
        document.getElementById('screen-menu').classList.remove('active');
        document.getElementById('setup-' + game).classList.add('active');
    }
};

const Modal = {
    show(t, m, cb) {
        document.getElementById('modal-h').innerText = t;
        document.getElementById('modal-p').innerText = m;
        const el = document.getElementById('modal');
        el.classList.add('show');
        this.cb = cb;
    },
    close() {
        document.getElementById('modal').classList.remove('show');
        if(this.cb) { this.cb(); this.cb = null; }
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
            <div class="stats-row"><span>❌ Крестики (Побед)</span><b>${s.ttt}</b></div>
        `;
    }
};

const Setup = {
    vals: { snakeSpeed:5, snakeApples:1, m3Targets:2 },
    updateLabel(key, val) {
        this.vals[key.replace('-','')] = parseInt(val); // snake-speed -> snakeSpeed
        document.getElementById('val-'+key).innerText = val;
    }
};

// === ЗМЕЙКА ===
const SnakeGame = {
    loop: null, snake: [], dir: {x:0,y:-1}, food: [], score: 0,
    
    start() {
        Nav.show('game-snake');
        const c = document.getElementById('snake-canvas');
        this.ctx = c.getContext('2d');
        this.snake = [{x:10,y:10}, {x:10,y:11}, {x:10,y:12}];
        this.dir = {x:0,y:-1};
        this.score = 0;
        this.food = [];
        this.spawnFood();
        this.draw();
        
        const speed = 250 - (Setup.vals.snakeSpeed * 20); // 1=230ms, 10=50ms
        if(this.loop) clearInterval(this.loop);
        this.loop = setInterval(() => this.update(), speed);
        
        document.onkeydown = e => {
            const k=e.key;
            if(k==='w'||k==='ArrowUp') this.input(0,-1);
            if(k==='s'||k==='ArrowDown') this.input(0,1);
            if(k==='a'||k==='ArrowLeft') this.input(-1,0);
            if(k==='d'||k==='ArrowRight') this.input(1,0);
        };
    },
    stop() { if(this.loop) clearInterval(this.loop); document.onkeydown=null; },
    input(x,y) { if(this.dir.x !== -x) this.dir = {x,y}; },
    
    update() {
        const head = {x:this.snake[0].x+this.dir.x, y:this.snake[0].y+this.dir.y};
        // Стены (смерть)
        if(head.x<0||head.x>16||head.y<0||head.y>16) return this.over();
        // Хвост
        if(this.snake.some(s=>s.x===head.x && s.y===head.y)) return this.over();
        
        this.snake.unshift(head);
        
        const fIdx = this.food.findIndex(f=>f.x===head.x && f.y===head.y);
        if(fIdx !== -1) {
            this.score++;
            this.food.splice(fIdx, 1);
            this.spawnFood();
        } else {
            this.snake.pop();
        }
        this.draw();
        document.getElementById('snake-score').innerText = this.score;
    },
    spawnFood() {
        while(this.food.length < Setup.vals.snakeApples) {
            const f = {x:Math.floor(Math.random()*17), y:Math.floor(Math.random()*17)};
            if(!this.snake.some(s=>s.x===f.x && s.y===f.y)) this.food.push(f);
        }
    },
    draw() {
        this.ctx.fillStyle='#00000040'; this.ctx.fillRect(0,0,340,340); // Clear
        // Food
        this.ctx.fillStyle='#EF4444';
        this.food.forEach(f => {
            this.ctx.beginPath(); this.ctx.arc(f.x*20+10, f.y*20+10, 8, 0, Math.PI*2); this.ctx.fill();
            this.ctx.fillStyle='#10B981'; this.ctx.fillRect(f.x*20+8, f.y*20, 4, 6); // Leaf
            this.ctx.fillStyle='#EF4444'; // Restore red
        });
        // Snake
        this.snake.forEach((s,i) => {
            this.ctx.fillStyle = i===0 ? '#ffffff' : `rgba(255,255,255,${1-(i*0.02)})`;
            this.ctx.fillRect(s.x*20+1, s.y*20+1, 18, 18);
        });
    },
    over() {
        this.stop();
        if(this.score > App.stats.snake) App.stats.snake = this.score;
        App.save();
        Modal.show("GAME OVER", `Счет: ${this.score}`, ()=>Nav.show('menu'));
    }
};

// === 3 В РЯД ===
const Match3Game = {
    grid: [], colors: ['#EF4444','#10B981','#3B82F6','#FCD34D','#A855F7','#F97316'],
    moves: 0, targets: {}, lock: false,
    
    start() {
        Nav.show('game-match3');
        const board = document.getElementById('m3-board');
        board.innerHTML = '';
        this.grid = [];
        this.lock = false;
        
        // Цели
        const tCount = Setup.vals.m3Targets;
        const used = new Set();
        while(used.size < tCount) used.add(Math.floor(Math.random()*6));
        this.targets = {};
        used.forEach(i => this.targets[i] = 5 + Math.floor(Math.random()*5));
        
        let sum = Object.values(this.targets).reduce((a,b)=>a+b,0);
        this.moves = 10 + Math.floor(sum*1.2);
        
        this.renderUI();
        
        // Сетка
        for(let r=0; r<8; r++) {
            this.grid[r] = [];
            for(let c=0; c<8; c++) {
                this.spawnGem(r, c, Math.floor(Math.random()*6));
            }
        }
    },
    
    spawnGem(r, c, type) {
        const d = document.createElement('div');
        d.className = 'gem';
        d.style.background = this.colors[type];
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
        if(win) this.end(true);
        else if(this.moves<=0) this.end(false);
    },
    
    click(r, c) {
        if(this.lock) return;
        const g = this.grid[r][c];
        if(!this.sel) {
            this.sel = g; g.dom.classList.add('selected');
        } else {
            this.sel.dom.classList.remove('selected');
            if(Math.abs(this.sel.r-r)+Math.abs(this.sel.c-c) === 1) this.swap(this.sel, g);
            this.sel = null;
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
        let matches = new Set();
        // Horizontal
        for(let r=0; r<8; r++) for(let c=0; c<6; c++) {
            let t = this.grid[r][c].type;
            if(t === this.grid[r][c+1].type && t === this.grid[r][c+2].type) {
                matches.add(this.grid[r][c]); matches.add(this.grid[r][c+1]); matches.add(this.grid[r][c+2]);
            }
        }
        // Vertical
        for(let c=0; c<8; c++) for(let r=0; r<6; r++) {
            let t = this.grid[r][c].type;
            if(t === this.grid[r+1][c].type && t === this.grid[r+2][c].type) {
                matches.add(this.grid[r][c]); matches.add(this.grid[r+1][c]); matches.add(this.grid[r+2][c]);
            }
        }
        
        if(matches.size > 0) {
            this.process(Array.from(matches));
            return true;
        }
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
        let maxTime = 0;
        for(let c=0; c<8; c++) {
            let hole = 0;
            for(let r=7; r>=0; r--) {
                if(!this.grid[r][c]) {
                    hole++;
                } else if(hole > 0) {
                    const g = this.grid[r][c];
                    this.grid[r+hole][c] = g;
                    this.grid[r][c] = null;
                    g.r += hole;
                    g.dom.style.top = (g.r*40)+'px';
                    maxTime = Math.max(maxTime, hole*50);
                }
            }
            // Spawn new
            for(let i=0; i<hole; i++) {
                const r = i; 
                // Actual pos is (hole-1-i), but visual spawn above
                // Simplified: Just respawn at correct place logic
                const finalR = hole - 1 - i; // Incorrect logic shortcut, fixing:
                // Correct: find empty spots from top
            }
            // Re-scan column to fill nulls
            for(let r=0; r<8; r++) {
                if(!this.grid[r][c]) {
                    this.spawnGem(r, c, Math.floor(Math.random()*6));
                    // Animate fall (hacky)
                    const g = this.grid[r][c];
                    g.dom.style.top = '-40px';
                    setTimeout(() => g.dom.style.top = (r*40)+'px', 50);
                }
            }
        }
        setTimeout(() => {
            if(!this.check()) this.lock = false;
        }, 300);
    },
    
    end(win) {
        if(win) App.stats.m3++;
        App.save();
        Modal.show(win?"ПОБЕДА!":"ФИНИШ", win?"Цели собраны!":"Ходы закончились", ()=>Nav.show('menu'));
    }
};

// === САПЕР ===
const SapperGame = {
    grid: [], tool: 'dig',
    start() {
        Nav.show('game-sapper');
        const el = document.getElementById('sapper-field');
        el.innerHTML = '';
        el.style.gridTemplateColumns = 'repeat(10, 1fr)';
        
        // Init logic
        this.grid = Array(100).fill(0).map((_,i)=>({i, mine:false, open:false, flag:false, n:0}));
        let m=0;
        while(m<10) {
            let i = Math.floor(Math.random()*100);
            if(!this.grid[i].mine) { this.grid[i].mine=true; m++; }
        }
        // Calc numbers
        this.grid.forEach(c => {
            if(c.mine) return;
            const r = Math.floor(c.i/10), col=c.i%10;
            for(let x=-1;x<=1;x++) for(let y=-1;y<=1;y++) {
                const nr=r+y, nc=col+x;
                if(nr>=0 && nr<10 && nc>=0 && nc<10) {
                    if(this.grid[nr*10+nc].mine) c.n++;
                }
            }
        });
        
        // Render
        this.grid.forEach(c => {
            const d = document.createElement('div');
            d.className = 'sapper-cell';
            d.onclick = () => this.click(c);
            c.dom = d;
            el.appendChild(d);
        });
    },
    
    setTool(t) {
        this.tool = t;
        document.querySelectorAll('.sapper-tools button').forEach(b=>b.classList.remove('active'));
        document.getElementById('tool-'+t).classList.add('active');
    },
    
    click(c) {
        if(c.open) return;
        if(this.tool === 'flag') {
            c.flag = !c.flag;
            c.dom.innerText = c.flag ? '🚩' : '';
            return;
        }
        if(c.flag) return;
        
        c.open = true;
        c.dom.className += ' open';
        
        if(c.mine) {
            c.dom.innerText = '💣';
            c.dom.style.background = 'red';
            Modal.show("БАБАХ!", "Вы подорвались.", ()=>Nav.show('menu'));
            App.stats.sapper++; // actually loss logic needed
        } else {
            if(c.n > 0) {
                c.dom.innerText = c.n;
                c.dom.style.color = ['#3B82F6','#10B981','#EF4444'][c.n-1] || 'white';
            } else {
                this.openZero(c.i);
            }
            // Check win
            if(this.grid.filter(x=>!x.mine && x.open).length === 90) {
                App.stats.sapper++; App.save();
                Modal.show("ПОБЕДА!", "Минное поле зачищено.", ()=>Nav.show('menu'));
            }
        }
    },
    
    openZero(idx) {
        const r=Math.floor(idx/10), col=idx%10;
        for(let x=-1;x<=1;x++) for(let y=-1;y<=1;y++) {
            const nr=r+y, nc=col+x;
            if(nr>=0 && nr<10 && nc>=0 && nc<10) {
                const ni = nr*10+nc;
                const nc_obj = this.grid[ni];
                if(!nc_obj.open && !nc_obj.mine) {
                    nc_obj.open = true;
                    nc_obj.dom.className += ' open';
                    if(nc_obj.n > 0) {
                        nc_obj.dom.innerText = nc_obj.n;
                        nc_obj.dom.style.color = ['#3B82F6','#10B981','#EF4444'][nc_obj.n-1] || 'white';
                    } else {
                        this.openZero(ni);
                    }
                }
            }
        }
    }
};

// === ИНИЦИАЛИЗАЦИЯ ===
App.init();
