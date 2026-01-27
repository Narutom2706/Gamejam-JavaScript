/* liste des imports */
import { InputHandler } from './inputs.js';
import { Player, Block, Bat, Spike, Chrono } from './classes.js';
import { Level1Block } from './level.js';
import { KEYS } from './constants.js';
import { rectIntersect } from './utils.js';

const screenMenu = document.getElementById('menu-screen');
const screenGame = document.getElementById('game-screen');
const screenGameOver = document.getElementById('gameover-screen');

/* surpirse */
const jojoSound = document.getElementById('jojo-sound');
const jojoGif = document.getElementById('jojo-gif');

const btnStart = document.getElementById('start-btn');
const btnRestart = document.getElementById('restart-btn');
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

canvas.width = 800;
canvas.height = 600;

const input = new InputHandler();
const player = new Player(100, 100);

const chrono = new Chrono();
let gameRunning = false;
let blocks = [];
let enemies = [];

let isTimeStopped = false;
let timeStopDuration = 0;
let timeStopCooldown = 0;

let lastTime = 0;
const targetFPS = 60;
const frameInterval = 1000 / targetFPS; // Environ 16.6ms

// Initialisation du niveau
function initLevel() {
    blocks = [];
    enemies = [];

    isTimeStopped = false;
    timeStopDuration = 0;
    timeStopCooldown = 0;
    
    Level1Block.forEach((row, y) => {
        row.forEach((symbol, x) => {
            const posX = x * 40;
            const posY = y * 40;
            
            if (symbol === 1) blocks.push(new Block(posX, posY));
            if (symbol === 2) enemies.push(new Bat(posX, posY, 100));
            if (symbol === 3) {
                player.velX = 0;
                player.velY = 0;
            };
        });
    });
}
chrono.update()

function animate(timestamp) {
    
    requestAnimationFrame(animate);
    if (!lastTime) {
        lastTime = performance.now();
        return;
    }

    if (!lastTime) {
        lastTime = timestamp;
    }

    // Calcul du temps écoulé depuis la dernière image
    const deltaTime = timestamp - lastTime;
    lastTime = timestamp;

    if (deltaTime > 100) { 
        requestAnimationFrame(animate);
        return;
    }
    const correction = deltaTime / (1000 / 60);

// ZA WARUDO
    if (input.isPressed(KEYS.TIME_STOP) && !isTimeStopped && timeStopCooldown <= 0) {
        isTimeStopped = true;
        timeStopDuration = 600;
        
        if (jojoSound) {
            jojoSound.currentTime = 0; 
            jojoSound.volume = 0.5;    
            jojoSound.play();
        }
        
if (jojoGif) {
            const gifSrc = jojoGif.src;
            jojoGif.src = "";          
            jojoGif.src = gifSrc;      

            jojoGif.classList.remove('hidden'); 
            
            setTimeout(() => {
                jojoGif.classList.add('hidden');
            }, 2150);
        }
    }

    if (isTimeStopped) {
        timeStopDuration--;
        if (timeStopDuration <= 0) {
            isTimeStopped = false;     
            timeStopCooldown = 500;    
        }
    } else {
        if (timeStopCooldown > 0) {
            timeStopCooldown--;
        }
    }

    // Définir la vitesse du monde (0 ou 1)
    let worldSpeed = (isTimeStopped ? 0 : 1) * correction;

    if (isTimeStopped) {
        ctx.fillStyle = "#0084ff"; 
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height); 
    }

    if (input.isPressed(KEYS.TIME_STOP)) {
        worldSpeed = 0;
        ctx.fillStyle = "#001a33"; 
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    }

    if (!gameRunning) return;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const levelWidth = Level1Block[0].length * 40;

    /* On calcule le décalage : PositionJoueur - MoitiéÉcran */
    let cameraX = player.x - 400;

    /* On empêche la caméra d'aller trop à gauche */
    if (cameraX < 0) {
        cameraX = 0;
    }

    if (cameraX > levelWidth - canvas.width) {
        cameraX = levelWidth - canvas.width;
    }

    ctx.save();
    ctx.translate(-cameraX, 0);

    blocks.forEach(block => block.draw(ctx));

    enemies.forEach(enemy => {
        // On passe effectiveSpeed qui contient déjà la correction temporelle
        enemy.update(16, worldSpeed, player); 
        enemy.draw(ctx);
    });

    player.update(input, blocks, correction);
    player.draw(ctx);

    ctx.restore();

    if (isTimeStopped) {
        ctx.save();
        ctx.fillStyle = "rgba(0, 150, 255, 0.2)"; 
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.restore();
    }

    
    chrono.update();
}

function startGame() {
    screenMenu.classList.add('hidden');
    if(screenGameOver) screenGameOver.classList.add('hidden');
    screenGame.classList.remove('hidden');

    initLevel(); 

    chrono.reset();
    chrono.start();

    if (!gameRunning) {
        gameRunning = true;
        animate();
    }
}

if(btnStart) btnStart.addEventListener('click', startGame);
if(btnRestart) btnRestart.addEventListener('click', () => location.reload());