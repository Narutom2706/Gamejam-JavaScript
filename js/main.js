import { InputHandler } from './inputs.js';
import { Player, Block, PatrolBat, Spike, Chrono, StretchWall } from './classes.js';
import { Level1Block } from './level.js';
import { KEYS } from './constants.js';
import { rectIntersect } from './utils.js';

const screenMenu = document.getElementById('menu-screen');
const screenGame = document.getElementById('game-screen');
const screenGameOver = document.getElementById('gameover-screen');

let activeWalls = [];
const jojoSound = document.getElementById('jojo-sound');
const jojoGif = document.getElementById('jojo-gif');
const dieCounterElement = document.getElementById('die_counter');
const timeStopCounterElement = document.getElementById('timestop_counter'); 

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
let proximityWalls = []; 
let deathCount = 0;
let timeStopCount = 0; 

let isTimeStopped = false;
let timeStopDuration = 0;
let timeStopCooldown = 0;

function initLevel() {
    blocks = [];
    enemies = [];
    activeWalls = []; 
    
    isTimeStopped = false;
    timeStopDuration = 0;
    timeStopCooldown = 0;
    timeStopCount = 0;
    if(timeStopCounterElement) timeStopCounterElement.innerText = "0";
    
    Level1Block.forEach((row, y) => {
        row.forEach((symbol, x) => {
            const posX = x * 40;
            const posY = y * 40;
            
            if (symbol === 1) blocks.push(new Block(posX, posY));
            if (symbol === 4) enemies.push(new Spike(posX, posY, false));
            if (symbol === 5) enemies.push(new Spike(posX, posY, true));
            
            if (symbol === 6) {
                let endX = posX + 100;
                for(let k = x + 1; k < row.length; k++) {
                    if (row[k] === 7) {
                        endX = k * 40;
                        break;
                    }
                }
                enemies.push(new PatrolBat(posX, posY, endX));
            }

            if (symbol === 8) {
                let size = 0;
                let direction = 'down'; 
                // Chercher à DROITE
                for(let k = x + 1; k < row.length; k++) {
                    if (row[k] === 9) { size = (k - x + 1) * 40; direction = 'right'; break; }
                    if (row[k] === 1) break;
                }
                // Chercher à GAUCHE
                if (size === 0) {
                    for(let k = x - 1; k >= 0; k--) {
                        // AJOUT DE "+ 1"
                        if (row[k] === 9) { size = (x - k + 1) * 40; direction = 'left'; break; }
                        if (row[k] === 1) break;
                    }
                }
                // Chercher en BAS
                if (size === 0) {
                    for(let k = y + 1; k < Level1Block.length; k++) {
                        // AJOUT DE "+ 1"
                        if (Level1Block[k][x] === 9) { size = (k - y + 1) * 40; direction = 'down'; break; }
                        if (Level1Block[k][x] === 1) break;
                    }
                }
                // Chercher en HAUT
                if (size === 0) {
                    for(let k = y - 1; k >= 0; k--) {
                        // AJOUT DE "+ 1"
                        if (Level1Block[k][x] === 9) { size = (y - k + 1) * 40; direction = 'up'; break; }
                        if (Level1Block[k][x] === 1) break;
                    }
                }

                if (size > 0) {
                    const wall = new StretchWall(posX, posY, size, direction);
                    blocks.push(wall);      
                    activeWalls.push(wall);
                }
            }

            if (symbol === 3) {
                player.x = posX;
                player.y = posY;
                player.velX = 0;
                player.velY = 0;
            }
        });
    });
}

function handleDeath() {
    deathCount++;
    if (dieCounterElement) {
        dieCounterElement.innerText = deathCount;
    }
    console.log("Mort n°" + deathCount);
    initLevel();
}

function animate() {
    if (!gameRunning) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (input.isPressed(KEYS.TIME_STOP) && !isTimeStopped && timeStopCooldown <= 0) {
        isTimeStopped = true;
        timeStopDuration = 300;
        timeStopCount++;
        if(timeStopCounterElement) timeStopCounterElement.innerText = timeStopCount;
        if (jojoSound) { jojoSound.currentTime = 0; jojoSound.volume = 0.5; jojoSound.play(); }
        if (jojoGif) { 
            const gifSrc = jojoGif.src; jojoGif.src = ""; jojoGif.src = gifSrc; 
            jojoGif.classList.remove('hidden'); 
            setTimeout(() => jojoGif.classList.add('hidden'), 2150); 
        }
    }
    if (isTimeStopped) {
        timeStopDuration--;
        if (timeStopDuration <= 0) { isTimeStopped = false; timeStopCooldown = 180; }
    } else {
        if (timeStopCooldown > 0) timeStopCooldown--;
    }

    let worldSpeed = isTimeStopped ? 0 : 1;

    activeWalls.forEach(wall => {
        wall.update(16, worldSpeed, player); 
    });

    const levelWidth = Level1Block[0].length * 40;
    const levelHeight = Level1Block.length * 40;
    let cameraX = player.x - 400;
    if (cameraX < 0) cameraX = 0;
    if (cameraX > levelWidth - canvas.width) cameraX = levelWidth - canvas.width;
    let cameraY = player.y - 300;
    if (cameraY < 0) cameraY = 0;
    if (cameraY > levelHeight - canvas.height) cameraY = levelHeight - canvas.height;

    ctx.save();
    ctx.translate(-cameraX, -cameraY);

    blocks.forEach(block => block.draw(ctx)); 
    
    enemies.forEach(enemy => {
        enemy.update(16, worldSpeed, player);
        enemy.draw(ctx);
        if (rectIntersect(player, enemy)) handleDeath();
    });

    player.update(input, blocks);
    player.draw(ctx);
    if (player.y > levelHeight + 100) handleDeath();

    ctx.restore();

    if (isTimeStopped) {
        ctx.save();
        ctx.fillStyle = "rgba(0, 150, 255, 0.2)"; 
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.restore();
    }
    
    chrono.update();
    requestAnimationFrame(animate);
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