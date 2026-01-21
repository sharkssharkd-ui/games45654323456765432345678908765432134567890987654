const App = {
    init() {
        Particles.init();
        Nav.init();
        // Загрузка статистики
        this.stats = JSON.parse(localStorage.getItem('mg_pro_stats')) || {
            snake_high: 0, m3_wins: 0, bs_wins: 0, sapper_wins: 0, ttt_wins: 0
        };
    },
    saveStats() {
        localStorage.setItem('mg_pro_stats', JSON.stringify(this.stats));
    }
};

const Nav = {
    init() {
        // Кнопка назад на телефонах
        window.onpopstate = () => this.toMenu();
    },
    show(id) {
        document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
        document.getElementById(id).classList.add('active');
        if(id.startsWith('game')) {
            // Блокируем скролл во время игры
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
    },
    toMenu() {
        this.show('page-menu');
        // Остановка всех игр
        SnakeGame.stop();
        // Сброс таймеров Match 3, BS и т.д.
    },
    toSetup(game) {
        this.show('setup-' + game);
        // Заполнение данных для универсального setup (если есть)
        if(game === 'battleship') BSGame.setup();
        if(game === 'sapper') SapperGame.setup();
        if(game === 'ttt') TTTGame.setup();
    },
    openModal(type) {
        const ov = document.getElementById('modal-overlay');
        const tit = document.getElementById('modal-title');
        const con = document.getElementById('modal-content');
        
        ov.classList.add('active');
        
        if(type === 'stats') {
            tit.innerText = "СТАТИСТИКА";
            con.innerHTML = `
                <div class="stats-row"><span>🐍 Змейка (Рекорд)</span> <b>${App.stats.snake_high}</b></div>
                <div class="stats-row"><span>💎 3 в ряд (Побед)</span> <b>${App.stats.m3_wins}</b></div>
                <div class="stats-row"><span>⚓ Морской бой</span> <b>${App.stats.bs_wins}</b></div>
                <div class="stats-row"><span>💣 Сапер</span> <b>${App.stats.sapper_wins}</b></div>
                <div class="stats-row"><span>❌ Крестики</span> <b>${App.stats.ttt_wins}</b></div>
            `;
        } else if (type === 'settings') {
            tit.innerText = "НАСТРОЙКИ";
            con.innerHTML = `<p>Темы скоро будут доступны!</p>`;
        }
    },
    closeModal() {
        document.getElementById('modal-overlay').classList.remove('active');
    }
};

const Particles = {
    init() {
        const c = document.getElementById('particles');
        const ctx = c.getContext('2d');
        let w, h;
        const resize = () => { w = c.width = window.innerWidth; h = c.height = window.innerHeight; };
        window.addEventListener('resize', resize);
        resize();

        const p = Array(50).fill().map(() => ({
            x: Math.random()*w, y: Math.random()*h,
            vx: (Math.random()-0.5)*0.5, vy: (Math.random()-0.5)*0.5,
            s: Math.random()*2
        }));

        function draw() {
            ctx.clearRect(0,0,w,h);
            ctx.fillStyle = '#3b82f6';
            p.forEach(i => {
                i.x += i.vx; i.y += i.vy;
                if(i.x<0) i.x=w; if(i.x>w) i.x=0;
                if(i.y<0) i.y=h; if(i.y>h) i.y=0;
                ctx.globalAlpha = 0.3;
                ctx.beginPath(); ctx.arc(i.x, i.y, i.s, 0, 7); ctx.fill();
            });
            requestAnimationFrame(draw);
        }
        draw();
    }
};

App.init();
