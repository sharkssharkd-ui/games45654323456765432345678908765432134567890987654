const SnakeGame = {
    canvas: null, ctx: null, loop: null,
    grid: 20, snake: [], dir: {x:0,y:-1}, nextDir: {x:0,y:-1},
    food: [], score: 0, 
    // Настройки
    config: { speed: 5, walls: true, fruits: {gold:true, blue:true, purple:true} },
    
    init() {
        Nav.show('game-snake');
        this.canvas = document.getElementById('snake-canvas');
        this.ctx = this.canvas.getContext('2d');
        
        // Размер канваса под экран
        const size = Math.min(window.innerWidth - 40, 360);
        this.canvas.width = size;
        this.canvas.height = size;
        this.tileCount = Math.floor(size / this.grid);
        
        // Чтение настроек
        this.config.speed = parseInt(document.getElementById('snake-speed').value);
        this.config.walls = document.getElementById('snake-walls').classList.contains('active');
        
        // Активные фрукты
        document.querySelectorAll('.fruit-toggle.active').forEach(el => {
            this.config.fruits[el.dataset.f] = true;
        });

        this.snake = [{x:10, y:10}, {x:10, y:11}, {x:10, y:12}];
        this.score = 0;
        this.dir = {x:0, y:-1};
        this.nextDir = {x:0, y:-1};
        this.food = [];
        this.effects = { ghost:0, speedMod:1 };
        
        this.spawnFood();
        
        if(this.loop) clearInterval(this.loop);
        const ms = 250 - (this.config.speed * 20);
        this.loop = setInterval(() => this.update(), ms);
        
        document.addEventListener('keydown', this.handleKey);
        this.draw();
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
        // Защита от разворота на 180 (используем текущее направление змеи, а не последнего кадра)
        if (this.dir.x === -x || this.dir.y === -y) return;
        this.nextDir = {x, y};
    },

    update() {
        this.dir = this.nextDir;
        const head = {x: this.snake[0].x + this.dir.x, y: this.snake[0].y + this.dir.y};
        
        // Стены
        if (this.config.walls) {
            if(head.x < 0 || head.x >= this.tileCount || head.y < 0 || head.y >= this.tileCount) 
                return this.gameOver();
        } else {
            if(head.x < 0) head.x = this.tileCount-1;
            if(head.x >= this.tileCount) head.x = 0;
            if(head.y < 0) head.y = this.tileCount-1;
            if(head.y >= this.tileCount) head.y = 0;
        }

        // Самоедство
        if (this.snake.some(s => s.x === head.x && s.y === head.y)) return this.gameOver();

        this.snake.unshift(head);

        // Еда
        const fIdx = this.food.findIndex(f => f.x === head.x && f.y === head.y);
        if (fIdx !== -1) {
            this.eat(this.food[fIdx]);
            this.food.splice(fIdx, 1);
            this.spawnFood();
        } else {
            this.snake.pop();
        }

        this.draw();
        document.getElementById('snake-score').innerText = this.score;
    },

    eat(f) {
        if(f.type === 'apple') this.score++;
        if(f.type === 'gold') this.score += 5;
        if(f.type === 'blue') this.snake.splice(-3);
        // Другие эффекты можно добавить сюда
    },

    spawnFood() {
        // Шанс бонуса 25%
        const types = ['gold','blue','purple','cherry','lime','chili'];
        const activeTypes = types.filter(t => this.config.fruits[t]);
        
        let type = 'apple';
        if(activeTypes.length > 0 && Math.random() < 0.25) {
            type = activeTypes[Math.floor(Math.random()*activeTypes.length)];
        }

        let pos;
        do {
            pos = {x: Math.floor(Math.random()*this.tileCount), y: Math.floor(Math.random()*this.tileCount)};
        } while (this.snake.some(s => s.x===pos.x && s.y===pos.y));
        
        this.food.push({...pos, type});
    },

    draw() {
        this.ctx.fillStyle = '#0f172a'; // Clear
        this.ctx.fillRect(0,0,this.canvas.width,this.canvas.height);
        
        // Grid (optional)
        // this.ctx.strokeStyle = '#1e293b'; ...

        // Food
        this.food.forEach(f => {
            const x = f.x * this.grid;
            const y = f.y * this.grid;
            this.ctx.font = '18px serif';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            let icon = '🍎';
            if(f.type==='gold') icon='🍌';
            if(f.type==='blue') icon='🫐';
            if(f.type==='purple') icon='🍇';
            if(f.type==='cherry') icon='🍒';
            if(f.type==='lime') icon='🍈';
            if(f.type==='chili') icon='🌶';
            this.ctx.fillText(icon, x + 10, y + 10);
        });

        // Snake
        this.snake.forEach((s, i) => {
            const alpha = Math.max(0.3, 1 - (i * 0.02));
            this.ctx.fillStyle = i===0 ? '#fff' : `rgba(59, 130, 246, ${alpha})`;
            this.ctx.fillRect(s.x*this.grid+1, s.y*this.grid+1, this.grid-2, this.grid-2);
        });
    },

    gameOver() {
        this.stop();
        if(this.score > App.stats.snake_high) App.stats.snake_high = this.score;
        App.saveStats();
        // Красивое окно
        const ov = document.getElementById('modal-overlay');
        document.getElementById('modal-title').innerText = "ИГРА ОКОНЧЕНА";
        document.getElementById('modal-content').innerHTML = `
            <div style="font-size:3rem; margin-bottom:10px">💀</div>
            <p>Ваш счет: <b>${this.score}</b></p>
        `;
        ov.classList.add('active');
        // Кнопка закрытия вернет в настройки
        document.querySelector('#modal-overlay .primary-btn').onclick = () => {
            ov.classList.remove('active');
            Nav.toSetup('snake');
        };
    }
};
