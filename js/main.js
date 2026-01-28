import { InputHandler } from './inputs.js';
import { Player, Block, PatrolBat, Spike, Chrono, StretchWall, FinishBlock } from './classes.js';
import { Level1Block } from './level.js';
import { KEYS } from './constants.js';
import { rectIntersect } from './utils.js';

const screenMenu = document.getElementById('menu-screen');
const screenGame = document.getElementById('game-screen');
const screenGameOver = document.getElementById('gameover-screen');
const screenFinish = document.getElementById('finish-screen');

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
const player = new Player(40, 520);
const chrono = new Chrono();

let gameRunning = false;
let blocks = [];
let enemies = [];
let proximityWalls = [];
let finishBlock = null; 
let deathCount = 0;
let timeStopCount = 0; 

let isTimeStopped = false;
let timeStopDuration = 0;
let timeStopCooldown = 0;

let lastTime = 0;

function initLevel() {
    blocks = [];
    enemies = [];
    activeWalls = []; 
    finishBlock = null;
    
    isTimeStopped = false;
    timeStopDuration = 0;
    timeStopCooldown = 0;
    timeStopCount = 0;
    if(timeStopCounterElement) timeStopCounterElement.innerText = "0";
    
    let playerFound = false; // <-- SÉCURITÉ

    Level1Block.forEach((row, y) => {
        row.forEach((symbol, x) => {
            const posX = x * 40;
            const posY = y * 40;
            
            if (symbol === 1) blocks.push(new Block(posX, posY));
            if (symbol === 3) enemies.push(new Spike(posX, posY, false));
            if (symbol === 4) enemies.push(new Spike(posX, posY, true));
            
            if (symbol === 5) {
                let endX = posX + 100;
                for(let k = x + 1; k < row.length; k++) {
                    if (row[k] === 6) { 
                        endX = k * 40;
                        break;
                    }
                }
                enemies.push(new PatrolBat(posX, posY, endX));
            }

            if (symbol === 7 || symbol === 9) {
                let size = 0;
                let direction = 'down'; 
                let type = (symbol === 7) ? 'attack' : 'shy';

                for(let k = x + 1; k < row.length; k++) {
                    if (row[k] === 8) { size = (k - x + 1) * 40; direction = 'right'; break; }
                    if (row[k] === 1) break;
                }
                if (size === 0) {
                    for(let k = x - 1; k >= 0; k--) {
                        if (row[k] === 8) { size = (x - k + 1) * 40; direction = 'left'; break; }
                        if (row[k] === 1) break;
                    }
                }
                if (size === 0) {
                    for(let k = y + 1; k < Level1Block.length; k++) {
                        if (Level1Block[k][x] === 8) { size = (k - y + 1) * 40; direction = 'down'; break; }
                        if (Level1Block[k][x] === 1) break;
                    }
                }
                if (size === 0) {
                    for(let k = y - 1; k >= 0; k--) {
                        if (Level1Block[k][x] === 8) { size = (y - k + 1) * 40; direction = 'up'; break; }
                        if (Level1Block[k][x] === 1) break;
                    }
                }

                if (size > 0) {
                    const wall = new StretchWall(posX, posY, size, direction, type);
                    blocks.push(wall);      
                    activeWalls.push(wall);
                }
            }

            if (symbol === 2) {
                player.x = posX;
                player.y = posY -10;
                player.velX = 0;
                player.velY = 0;
                playerFound = true; 
                console.log("✅ Joueur placé en :", posX, posY);
            }
            
            if (symbol === 10) {
                finishBlock = new FinishBlock(posX, posY);
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

function handleWin() {
    gameRunning = false;
    chrono.stop();
    
    if (screenFinish) {
        document.getElementById('final-time').innerText = chrono.elapsed;
        document.getElementById('final-deaths').innerText = deathCount;
        document.getElementById('final-timestops').innerText = timeStopCount;
        
        screenGame.classList.add('hidden');
        screenFinish.classList.remove('hidden');
    }
}

function animate(timeStamp) {
    if (!gameRunning) return;
    if (!timeStamp) timeStamp = performance.now(); 

    if (!lastTime) lastTime = timeStamp;
    const deltaTime = timeStamp - lastTime;
    lastTime = timeStamp;
    const targetFPS = 60; 
    const targetFrameTime = 1000 / targetFPS;
    let correction = deltaTime / targetFrameTime;
    if (correction > 3) correction = 3;



    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (input.isPressed(KEYS.TIME_STOP) && !isTimeStopped && timeStopCooldown <= 0) {
        isTimeStopped = true;
        timeStopDuration = 150;
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
        timeStopDuration -= 1 * correction;
        if (timeStopDuration <= 0) { isTimeStopped = false; timeStopCooldown = 150; }
    } else {
        if (timeStopCooldown > 0) timeStopCooldown-= correction;
    }

    let worldSpeed = isTimeStopped ? 0 : 1;

    activeWalls.forEach(wall => {
        wall.update(deltaTime, worldSpeed, player, correction); 
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
    
    if (finishBlock) {
        finishBlock.draw(ctx);
        if (rectIntersect(player, finishBlock)) handleWin();
    }
    
enemies.forEach(enemy => {
        enemy.update(16, worldSpeed, player, blocks, correction);
        enemy.draw(ctx);
        if (rectIntersect(player, enemy)) handleDeath();
    });
    enemies = enemies.filter(enemy => !enemy.markedForDeletion);

    player.update(input, blocks, correction);
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
        lastTime = 0; 
        requestAnimationFrame(animate); 
    }
}

if(btnStart) btnStart.addEventListener('click', startGame);
if(btnRestart) btnRestart.addEventListener('click', () => location.reload());