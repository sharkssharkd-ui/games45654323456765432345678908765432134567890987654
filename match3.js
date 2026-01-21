const Match3 = {
    grid: [], rows: 8, cols: 8,
    colors: ['#ef4444', '#22c55e', '#3b82f6', '#eab308', '#a855f7', '#f97316'],
    selected: null, locking: false, moves: 0, score: 0,
    targets: {},

    init() {
        Nav.show('game-match3');
        const el = document.getElementById('m3-grid');
        el.innerHTML = '';
        this.grid = [];
        this.locking = false;
        
        // Генерация целей
        const targetCount = parseInt(document.getElementById('m3-targets').value);
        this.targets = {};
        const colorsIdx = [0,1,2,3,4,5].sort(()=>0.5-Math.random()).slice(0, targetCount);
        let total = 0;
        colorsIdx.forEach(c => {
            const amt = 5 + Math.floor(Math.random()*6);
            this.targets[c] = amt;
            total += amt;
        });
        
        this.moves = Math.floor(total * 1.5) + 5;
        this.renderTargets();
        
        // Заполнение
        for(let r=0; r<this.rows; r++) {
            this.grid[r] = [];
            for(let c=0; c<this.cols; c++) {
                this.spawnGem(r, c);
            }
        }
        
        // Проверка стартовых матчей (просто перекрасим, без анимации)
        this.resolveMatches(true);
    },

    spawnGem(r, c) {
        const type = Math.floor(Math.random() * this.colors.length);
        const div = document.createElement('div');
        div.className = 'gem';
        div.innerHTML = `<div class="gem-inner" style="background:${this.colors[type]}"></div>`;
        // Позиция в % для адаптивности
        div.style.top = (r * 12.5) + '%';
        div.style.left = (c * 12.5) + '%';
        
        div.onclick = () => this.click(r, c);
        
        document.getElementById('m3-grid').appendChild(div);
        this.grid[r][c] = { type, div, r, c };
        return this.grid[r][c];
    },

    renderTargets() {
        const bar = document.getElementById('m3-targets-display');
        bar.innerHTML = '';
        document.getElementById('m3-moves-display').innerText = this.moves;
        
        let win = true;
        for(let t in this.targets) {
            if(this.targets[t] > 0) {
                win = false;
                bar.innerHTML += `
                    <div class="target-badge">
                        <span class="mini-gem" style="background:${this.colors[t]}"></span>
                        ${this.targets[t]}
                    </div>`;
            }
        }
        if(win) this.endGame(true);
        else if(this.moves <= 0) this.endGame(false);
    },

    click(r, c) {
        if(this.locking) return;
        const gem = this.grid[r][c];
        
        if(!this.selected) {
            this.selected = gem;
            gem.div.classList.add('selected');
        } else {
            const first = this.selected;
            first.div.classList.remove('selected');
            this.selected = null;
            
            if(Math.abs(first.r - r) + Math.abs(first.c - c) === 1) {
                this.swap(first, gem);
            } else if (first !== gem) {
                // Если кликнули далеко - просто выбираем новый
                this.selected = gem;
                gem.div.classList.add('selected');
            }
        }
    },

    swap(a, b) {
        this.locking = true;
        // Логический свап
        const tempType = a.type; a.type = b.type; b.type = tempType;
        const tempInner = a.div.innerHTML; a.div.innerHTML = b.div.innerHTML; b.div.innerHTML = tempInner;
        
        // Проверка
        setTimeout(() => {
            if(this.findMatches().length > 0) {
                this.moves--;
                this.resolveMatches();
            } else {
                // Свап обратно
                const t = a.type; a.type = b.type; b.type = t;
                const h = a.div.innerHTML; a.div.innerHTML = b.div.innerHTML; b.div.innerHTML = h;
                this.locking = false;
            }
        }, 200);
    },

    findMatches() {
        const matches = new Set();
        // Hor
        for(let r=0; r<8; r++) {
            for(let c=0; c<6; c++) {
                if(this.grid[r][c].type === this.grid[r][c+1].type && 
                   this.grid[r][c].type === this.grid[r][c+2].type) {
                    matches.add(this.grid[r][c]); matches.add(this.grid[r][c+1]); matches.add(this.grid[r][c+2]);
                }
            }
        }
        // Ver
        for(let c=0; c<8; c++) {
            for(let r=0; r<6; r++) {
                if(this.grid[r][c].type === this.grid[r+1][c].type && 
                   this.grid[r][c].type === this.grid[r+2][c].type) {
                    matches.add(this.grid[r][c]); matches.add(this.grid[r+1][c]); matches.add(this.grid[r+2][c]);
                }
            }
        }
        return Array.from(matches);
    },

    resolveMatches(silent = false) {
        const matches = this.findMatches();
        if(matches.length === 0) {
            this.locking = false;
            if(!silent) this.renderTargets();
            return;
        }

        // Удаление и счет
        matches.forEach(g => {
            if(!silent) {
                if(this.targets[g.type] > 0) this.targets[g.type]--;
                // Анимация исчезновения
                g.div.querySelector('.gem-inner').style.transform = 'scale(0)';
            }
            // Меняем тип на рандомный (упрощенная гравитация для стабильности)
            // В полноценной версии тут должен быть сдвиг столбцов
            g.type = Math.floor(Math.random() * this.colors.length);
        });

        setTimeout(() => {
            matches.forEach(g => {
                g.div.innerHTML = `<div class="gem-inner" style="background:${this.colors[g.type]}"></div>`;
            });
            // Рекурсия (цепная реакция)
            this.resolveMatches(silent);
        }, 300);
    },

    endGame(win) {
        if(win) App.stats.m3_wins++;
        App.saveStats();
        const ov = document.getElementById('modal-overlay');
        document.getElementById('modal-title').innerText = win ? "ПОБЕДА!" : "ФИНИШ";
        document.getElementById('modal-content').innerHTML = win ? 
            "<p style='color:#4ade80'>Все цели собраны!</p>" : 
            "<p>Ходы закончились.</p>";
        ov.classList.add('active');
        document.querySelector('#modal-overlay .primary-btn').onclick = () => {
            ov.classList.remove('active');
            Nav.toSetup('match3');
        };
    }
};
