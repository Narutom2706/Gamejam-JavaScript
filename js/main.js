const screenMenu = document.getElementById('screen-menu');
const screenGame = document.getElementById('screen-game');
const screenGameOver = document.getElementById('screen-gameover');

const btnStart = document.getElementById('start-btn');
const btnRestart = document.getElementById('restart-btn');

function startGame() {
    screenMenu.classList.add('hidden');
    screenGameOver.classList.add('hidden');
    screenGame.classList.remove('hidden');

    initLevel(); 

    if (!gameRunning) {
        gameRunning = true;
        animate();
    }
}

function triggerGameOver() {
    gameRunning = false; 
    screenGame.classList.add('hidden');
    screenGameOver.classList.remove('hidden');
}


btnStart.addEventListener('click', () => {
    startGame();
});

btnRestart.addEventListener('click', () => {
    startGame();
});

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
canvas.width = 800;
canvas.height = 600;

const input = new InputHandler();
const player = new Player(100, 100);
let gameRunning = false;

function animate() {
    if (!gameRunning) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    player.update(input);
    player.draw(ctx);
    requestAnimationFrame(animate);
}
function startGame() {
    gameRunning = true;
    animate();
}