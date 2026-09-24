// Allowed Players
const allowedPlayers = {
    'tilly': '0607',
    'broadie': '6767',
    'arthur': '9911',
    'remy': '3337',
    'patrick': '4163',
    'mackenzie': '2412'
};

const weapons = [
    { name: 'Bow & Arrow', threshold: 0, color: 'white', size: 5, speed: 5 },
    { name: 'Fire Bow & Arrow', threshold: 3, color: 'orange', size: 6, speed: 7 },
    { name: 'Laser Sword', threshold: 8, color: 'cyan', size: 8, speed: 10 },
    { name: 'Electric Trident', threshold: 13, color: 'yellow', size: 10, speed: 12 },
    { name: 'Laser Gun', threshold: 25, color: '#f0f', size: 12, speed: 15 }
];

const ENEMY_TYPES = [
    { type: 'Robot', emoji: '🤖', points: 1, speed: 1, hp: 1, prob: 0.6 },
    { type: 'Octo', emoji: '🐙', points: 5, speed: 1.5, hp: 1, prob: 0.25 },
    { type: 'Ice', emoji: '🧊', points: 10, speed: 2, hp: 2, prob: 0.12 },
    { type: 'Croc', emoji: '🐊', points: 30, speed: 3, hp: 3, prob: 0.03 }
];

// DOM Elements
const loginForm = document.getElementById('login-form');
const loginContainer = document.getElementById('login-container');
const loginError = document.getElementById('login-error');
const gameContainer = document.getElementById('game-container');
const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('score');
const weaponEl = document.getElementById('weapon-display');
const aliensKilledEl = document.getElementById('aliens-killed');
const msgEl = document.getElementById('message-display');
const gameOverModal = document.getElementById('game-over-modal');
const restartBtn = document.getElementById('restart-btn');

let animationId;
let gameActive = false;

// Game State
let player = {};
let bullets = [];
let enemies = [];
let particles = [];
let score = 0;
let totalKilled = 0;
let currentWeaponIdx = 0;
let keys = {};
const TOTAL_TO_WIN = 100;
let avatarEmoji = '🥋';

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    if (player.y === 0) {
        player.x = canvas.width / 2;
        player.y = canvas.height - 60;
    } else {
        player.y = canvas.height - 60; // Keep player at bottom on resize
    }
}

window.addEventListener('resize', resizeCanvas);

loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('username').value.trim().toLowerCase();
    const code = document.getElementById('passcode').value.trim();
    const avatar = document.querySelector('input[name="avatar"]:checked').value;

    if (allowedPlayers[name] && allowedPlayers[name] === code) {
        avatarEmoji = avatar === 'karate' ? '🥋' : '🦇';
        loginContainer.style.display = 'none';
        gameContainer.style.display = 'block';
        resizeCanvas();
        startGame();
    } else {
        loginError.style.display = 'block';
    }
});

restartBtn.addEventListener('click', () => {
    gameOverModal.style.display = 'none';
    startGame();
});

function startGame() {
    score = 0;
    totalKilled = 0;
    currentWeaponIdx = 0;
    bullets = [];
    enemies = [];
    particles = [];
    gameActive = true;
    keys = {};
    
    player = {
        x: canvas.width / 2,
        y: canvas.height - 60,
        size: 40,
        speed: 5
    };
    
    updateHUD();
    msgEl.innerText = "Get ready!";
    setTimeout(() => msgEl.innerText = "", 2000);
    
    cancelAnimationFrame(animationId);
    spawnEnemies();
    gameLoop();
}

function updateHUD() {
    scoreEl.innerText = `Points: ${score}`;
    weaponEl.innerText = `Weapon: ${weapons[currentWeaponIdx].name}`;
    aliensKilledEl.innerText = `Aliens Defeated: ${totalKilled}/${TOTAL_TO_WIN}`;
}

// Input Handling
window.addEventListener('keydown', e => keys[e.code] = true);
window.addEventListener('keyup', e => {
    keys[e.code] = false;
    if (e.code === 'Space' && gameActive) {
        shoot();
    }
});

// Mobile Controls
const joystickArea = document.getElementById('joystick-area');
const shootBtn = document.getElementById('shoot-btn');

let touchX = null;
joystickArea.addEventListener('touchstart', e => handleTouchMove(e));
joystickArea.addEventListener('touchmove', e => handleTouchMove(e));
joystickArea.addEventListener('touchend', () => touchX = null);

function handleTouchMove(e) {
    e.preventDefault();
    const rect = joystickArea.getBoundingClientRect();
    const touch = e.touches[0];
    const relX = touch.clientX - rect.left;
    touchX = (relX / rect.width) * 2 - 1; // -1 to 1
}

shootBtn.addEventListener('touchstart', (e) => {
    e.preventDefault();
    if(gameActive) shoot();
});

function shoot() {
    const w = weapons[currentWeaponIdx];
    bullets.push({
        x: player.x,
        y: player.y - player.size/2,
        radius: w.size,
        color: w.color,
        speed: w.speed
    });
}

function checkWeaponUpgrades() {
    for (let i = weapons.length - 1; i >= 0; i--) {
        if (score >= weapons[i].threshold && i > currentWeaponIdx) {
            currentWeaponIdx = i;
            msgEl.innerText = `Upgraded to ${weapons[i].name}!`;
            setTimeout(() => {
                if (msgEl.innerText.includes('Upgraded')) msgEl.innerText = "";
            }, 2000);
            updateHUD();
            break;
        }
    }
}

function spawnEnemies() {
    if (!gameActive) return;
    
    const rand = Math.random();
    let enemyDef = ENEMY_TYPES[0]; // default robot
    
    let cumProb = 0;
    for (const et of ENEMY_TYPES) {
        cumProb += et.prob;
        if (rand < cumProb) {
            enemyDef = et;
            break;
        }
    }
    
    const size = 40;
    const x = Math.random() * (canvas.width - size * 2) + size;
    
    enemies.push({
        x: x,
        y: -size,
        size: size,
        type: enemyDef.emoji,
        points: enemyDef.points,
        speed: enemyDef.speed + (Math.random() * 0.5), // slight variation
        hp: enemyDef.hp,
        angle: 0
    });
    
    // speed up spawning as game progresses
    const spawnRate = Math.max(500, 2000 - (totalKilled * 15));
    setTimeout(spawnEnemies, spawnRate);
}

function createParticles(x, y, color) {
    for (let i = 0; i < 10; i++) {
        particles.push({
            x, y,
            vx: (Math.random() - 0.5) * 5,
            vy: (Math.random() - 0.5) * 5,
            life: 1,
            color: color
        });
    }
}

function gameOver(won) {
    gameActive = false;
    gameOverModal.style.display = 'block';
    if (won) {
        document.getElementById('game-over-title').innerText = "YOU WIN!";
        document.getElementById('game-over-message').innerText = `You saved the world! Final Score: ${score}`;
        document.getElementById('game-over-title').style.color = "#0f0";
    } else {
        document.getElementById('game-over-title').innerText = "GAME OVER!";
        document.getElementById('game-over-message').innerText = `The aliens got you. Final Score: ${score}`;
        document.getElementById('game-over-title').style.color = "red";
    }
}

function gameLoop() {
    if (!gameActive) return;
    
    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)'; // trail effect
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Player move
    if (keys['ArrowLeft'] || keys['KeyA']) player.x -= player.speed;
    if (keys['ArrowRight'] || keys['KeyD']) player.x += player.speed;
    
    if (touchX !== null) {
        player.x += touchX * player.speed;
    }
    
    // Bounds
    player.x = Math.max(player.size, Math.min(canvas.width - player.size, player.x));
    
    // Draw Player
    ctx.font = `${player.size}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(avatarEmoji, player.x, player.y);
    
    // Handle Bullets
    for (let i = bullets.length - 1; i >= 0; i--) {
        const b = bullets[i];
        b.y -= b.speed;
        
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
        ctx.fillStyle = b.color;
        ctx.fill();
        ctx.closePath();
        
        if (b.y < -50) bullets.splice(i, 1);
    }
    
    // Handle Particles
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life -= 0.05;
        
        if (p.life <= 0) {
            particles.splice(i, 1);
        } else {
            ctx.globalAlpha = Math.max(0, p.life);
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1;
        }
    }
    
    // Handle Enemies
    for (let i = enemies.length - 1; i >= 0; i--) {
        const e = enemies[i];
        
        // Ice alien erratic movement
        if (e.type === '🧊') {
            e.angle += 0.1;
            e.x += Math.sin(e.angle) * 2;
        }
        
        e.y += e.speed;
        
        ctx.font = `${e.size}px Arial`;
        ctx.fillText(e.type, e.x, e.y);
        
        // Collision with player
        const distToPlayer = Math.hypot(player.x - e.x, player.y - e.y);
        if (distToPlayer < (player.size/2 + e.size/2)) {
            gameOver(false);
            return;
        }
        
        // Out of bounds - lose points? Or lose game? 
        // User says "the goal is to get as many points before the aliens get you". Let's say if they pass player, you lose.
        if (e.y > canvas.height + 50) {
            gameOver(false);
            return;
        }
        
        // Collision with bullets
        for (let j = bullets.length - 1; j >= 0; j--) {
            const b = bullets[j];
            const dist = Math.hypot(b.x - e.x, b.y - e.y);
            
            if (dist < e.size/2 + b.radius) {
                // Hit!
                createParticles(b.x, b.y, b.color);
                bullets.splice(j, 1);
                
                e.hp -= 1;
                if (e.hp <= 0) {
                    createParticles(e.x, e.y, '#fff');
                    score += e.points;
                    totalKilled += 1;
                    enemies.splice(i, 1);
                    checkWeaponUpgrades();
                    updateHUD();
                    
                    if (totalKilled >= TOTAL_TO_WIN) {
                        gameOver(true);
                        return;
                    }
                }
                break; // bullet can only hit one enemy
            }
        }
    }
    
    animationId = requestAnimationFrame(gameLoop);
}

