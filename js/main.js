import { InputHandler } from './inputs.js';
import { Player, Block, Saw, Spike } from './classes.js';
import { Level1Block } from './level.js';

const screenMenu = document.getElementById('menu-screen');
const screenGame = document.getElementById('game-screen');
const screenGameOver = document.getElementById('gameover-screen');

const btnStart = document.getElementById('start-btn');
const btnRestart = document.getElementById('restart-btn');
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

canvas.width = 800;
canvas.height = 600;

const input = new InputHandler();
const player = new Player(100, 100);
let gameRunning = false;
let blocks = [];
let enemies = [];

// Initialisation du niveau
function initLevel() {
    blocks = [];
    enemies = [];
    
    Level1Block.forEach((row, y) => {
        row.forEach((symbol, x) => {
            const posX = x * 40;
            const posY = y * 40;
            
            if (symbol === 1) blocks.push(new Block(posX, posY));
            if (symbol === 2) enemies.push(new Saw(posX, posY, 100));
            if (symbol === 3) {
                player.x = posX;
                player.y = posY;
            }
        });
    });
}

function animate() {
    if (!gameRunning) return;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    blocks.forEach(block => block.draw(ctx));

    enemies.forEach(enemy => {
        enemy.update(16, 1); 
        enemy.draw(ctx);
    });

    player.update(input, blocks); 
    
    player.draw(ctx);
    
    requestAnimationFrame(animate);
}

function startGame() {
    screenMenu.classList.add('hidden');
    if(screenGameOver) screenGameOver.classList.add('hidden');
    screenGame.classList.remove('hidden');

    initLevel(); 

    if (!gameRunning) {
        gameRunning = true;
        animate();
    }
}

if(btnStart) btnStart.addEventListener('click', startGame);
if(btnRestart) btnRestart.addEventListener('click', () => location.reload());