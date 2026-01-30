import { InputHandler, KEYS } from './inputs.js';
import { Player, Block, PatrolBat, Spike, Chrono, Wall, FinishBlock, rectIntersect } from './classes.js';
import { LevelTuto, Level1, Level2 } from './level.js'; 

const screenMenu = document.getElementById('menu-screen');
const screenGame = document.getElementById('game-screen');
const screenGameOver = document.getElementById('gameover-screen');
const screenFinish = document.getElementById('finish-screen');

const jojoSound = document.getElementById('jojo-sound');
const deathSound = document.getElementById('death-sound'); 
const jojoGif = document.getElementById('jojo-gif');
const dieCounterElement = document.getElementById('die_counter');
const timeStopCounterElement = document.getElementById('timestop_counter'); 
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
let activeWalls = []; 
let finishBlock = null; 
let deathCount = 0;
let timeStopCount = 0; 

let currentLevelData = Level1; 

let isTimeStopped = false;
let timeStopDuration = 0;
let timeStopCooldown = 0;

let lastTime = 0;
let pendingScore = null;

function loadLevelData() {  // Initialise le niveau choisi par le joueur
    blocks = [];
    enemies = [];
    activeWalls = []; 
    finishBlock = null;
    
    isTimeStopped = false;
    timeStopDuration = 0;
    timeStopCooldown = 0; 
    
    if(timeStopCounterElement) timeStopCounterElement.innerText = timeStopCount; // Met à jour l'affichage du compteur de pouvoirs
    
    currentLevelData.data.forEach((row, y) => { // Parcours chaque ligne du tableau de données du niveau
        row.forEach((symbol, x) => {
            const posX = x * 40;
            const posY = y * 40;
            
            if (symbol === 1) blocks.push(new Block(posX, posY)); // rappel : push permet d'ajouter un élément à la fin d'un tableau
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

            if (symbol === 7 || symbol === 9) { // pour les murs extensibles
                let size = 0;
                let direction = 'down'; 
                let type = (symbol === 7) ? 'attack' : 'shy';

                for(let k = x + 1; k < row.length; k++) {  // Verifie vers la droite
                    if (row[k] === 8) { size = (k - x + 1) * 40; direction = 'right'; break; }
                    if (row[k] === 1) break;
                }
                if (size === 0) { 
                    for(let k = x - 1; k >= 0; k--) { // Verifie vers la gauche
                        if (row[k] === 8) { size = (x - k + 1) * 40; direction = 'left'; break; }
                        if (row[k] === 1) break;
                    }
                }
                if (size === 0) { 
                    for(let k = y + 1; k < currentLevelData.data.length; k++) { // Verifie vers le bas
                        if (currentLevelData.data[k][x] === 8) { size = (k - y + 1) * 40; direction = 'down'; break; }
                        if (currentLevelData.data[k][x] === 1) break;
                    }
                }
                if (size === 0) {
                    for(let k = y - 1; k >= 0; k--) { // Verifie vers le haut
                        if (currentLevelData.data[k][x] === 8) { size = (y - k + 1) * 40; direction = 'up'; break; }
                        if (currentLevelData.data[k][x] === 1) break;
                    }
                }

                if (size > 0) { 
                    const wall = new Wall(posX, posY, size, direction, type); 
                    blocks.push(wall);      
                    activeWalls.push(wall);
                }
            }

            if (symbol === 2) { 
                player.x = posX;
                player.y = posY - 10;
                player.velX = 0;
                player.velY = 0;
            }
            
            if (symbol === 10) {
                finishBlock = new FinishBlock(posX, posY);
            }
        });
    });
}

function Death() { 
    deathCount++;
    if (dieCounterElement) {
        dieCounterElement.innerText = deathCount;
    }

    if (deathSound) {
        deathSound.currentTime = 0.9; 
        deathSound.volume = 1;  
        deathSound.play().catch(e => console.log("Audio error:", e));
    }

    loadLevelData();
}

function Victory() { 
    gameRunning = false;
    chrono.stop();
    
    if (screenFinish) {
        const time = parseFloat(chrono.elapsed);
        const deaths = deathCount;
        const powers = timeStopCount;
        const score = time + (powers * 20);

        pendingScore = { score: parseFloat(score.toFixed(2)), time: time, deaths: deaths, powers: powers, date: Date.now(), name: '' };
        const nameInput = document.getElementById('player-name');
        if (nameInput) {
            nameInput.value = localStorage.getItem('celeste_last_player_name') || '';
        }
        const saveBtn = document.getElementById('save-score-btn');
        if (saveBtn) { saveBtn.disabled = false; }

        const currentBest = parseFloat(localStorage.getItem('celeste_best_score'));
        if (!currentBest || score < currentBest) {
            localStorage.setItem('celeste_best_score', score.toFixed(2));
            refreshBestScoreUI();
        }

        const th = currentLevelData.thresholds;
        
        let rankLetter = "F"; let rankDesc = "Try Again"; let rankClass = "rank-d"; 
        
        if (score < th.sPlus) { rankLetter = "S+"; rankDesc = "JACKPOT !!"; rankClass = "rank-s-plus"; } 
        else if (score < th.s) { rankLetter = "S"; rankDesc = "Tu as gagné, maitenant tu peux reprendre ta vie champion"; rankClass = "rank-s"; } 
        else if (score < th.a) { rankLetter = "A"; rankDesc = "Nah i'd adapt"; rankClass = "rank-a"; } 
        else if (score < th.b) { rankLetter = "B"; rankDesc = "Tout cela pour un B..."; rankClass = "rank-b"; } 
        else if (score < th.c) { rankLetter = "C"; rankDesc = "C comme c'est dl'a merde"; rankClass = "rank-c"; } 
        else { rankLetter = "D"; rankDesc = "Tu sais il faut aller plus vite hein"; rankClass = "rank-d"; }

        document.getElementById('final-time').innerText = time.toFixed(2);
        document.getElementById('final-deaths').innerText = deaths;
        document.getElementById('final-timestops').innerText = powers;
        
        const scoreEl = document.getElementById('final-score');
        if (scoreEl) scoreEl.innerText = score.toFixed(2);

        const rankLetEl = document.getElementById('final-rank');
        const rankTxtEl = document.getElementById('rank-text');
        const videoEl = document.getElementById('rank-video');
        const imgEl = document.getElementById('rank-image');

        if (rankLetEl) {
            rankLetEl.innerText = rankLetter;
            rankTxtEl.innerText = rankDesc;
            rankLetEl.className = "rank-letter " + rankClass; 
        }

        if (videoEl && imgEl) {
            videoEl.classList.remove('hidden');
            imgEl.classList.add('hidden');

            let videoFilename = rankLetter;
            if (rankLetter === "S+") videoFilename = "SPlus";
            
            const mp4Path = `assets/Image/Video/Rank_${videoFilename}.mp4`;
            const gifPath = `assets/Image/gif/Gif_${rankLetter}.gif`;

            videoEl.src = mp4Path;
            videoEl.onerror = function() {
                videoEl.classList.add('hidden');
                imgEl.classList.remove('hidden');
                imgEl.src = gifPath;
            };

            videoEl.load();
            videoEl.play().catch(e => console.log("Autoplay blocked", e));
        }
        
        screenGame.classList.add('hidden');
        screenFinish.classList.remove('hidden');
    }
}

function gameLoop(timeStamp) { 
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

    if (input.isPressed(KEYS.TIME_STOP) && !isTimeStopped && timeStopCooldown <= 0) { // Activation du pouvoir d'arrêt du temps
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

    let worldSpeed = isTimeStopped ? 0 : 1; // Vitesse du monde affectée par le pouvoir d'arrêt du temps

    activeWalls.forEach(wall => {
        wall.update(deltaTime, worldSpeed, player, correction); 
    });

    const levelWidth = currentLevelData.data[0].length * 40;
    const levelHeight = currentLevelData.data.length * 40;
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
        if (rectIntersect(player, finishBlock)) Victory();
    }
    
    enemies.forEach(enemy => {
        enemy.update(16, worldSpeed, player, blocks, correction);
        enemy.draw(ctx);
        if (rectIntersect(player, enemy)) Death();
    });
    enemies = enemies.filter(enemy => !enemy.markedForDeletion);

    player.update(input, blocks, correction);
    player.draw(ctx);
    if (player.y > levelHeight + 100) Death();

    ctx.restore();

    if (isTimeStopped) {
        ctx.save();
        ctx.fillStyle = "rgba(0, 150, 255, 0.2)"; 
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.restore();
    }
    
    chrono.update();
    requestAnimationFrame(gameLoop);
}

const btnLevelTuto = document.getElementById('level-tuto-btn');
const btnLevel1 = document.getElementById('level1-btn');
const btnLevel2 = document.getElementById('level2-btn');
const btnRestart = document.getElementById('restart-btn');    
const btnMenuReturn = document.getElementById('menu-return-btn'); 

function launchLevel(levelData) {
    currentLevelData = levelData; 
    
    screenMenu.classList.add('hidden');
    screenFinish.classList.add('hidden');
    screenGame.classList.remove('hidden');
    
    deathCount = 0;
    timeStopCount = 0;
    if(dieCounterElement) dieCounterElement.innerText = "0";
    
    loadLevelData(); 
    chrono.reset();
    chrono.start();

    if (!gameRunning) {
        gameRunning = true;
        lastTime = 0; 
        requestAnimationFrame(gameLoop);
    }
}

if (btnLevelTuto) {
    btnLevelTuto.addEventListener('click', () => launchLevel(LevelTuto));
}
if (btnLevel1) {
    btnLevel1.addEventListener('click', () => launchLevel(Level1));
}
if (btnLevel2) {
    btnLevel2.addEventListener('click', () => launchLevel(Level2));
}

if (btnRestart) {
    btnRestart.addEventListener('click', () => {
        launchLevel(currentLevelData);
    });
}

if (btnMenuReturn) {
    btnMenuReturn.addEventListener('click', () => {
        screenFinish.classList.add('hidden');
        screenGame.classList.add('hidden');
        screenMenu.classList.remove('hidden');
        gameRunning = false;
        refreshBestScoreUI();
        updateScoreboardDisplay();
    });
}

function resetGame() {
    deathCount = 0;
    timeStopCount = 0;
    if(dieCounterElement) dieCounterElement.innerText = "0";
    
    launchLevel(currentLevelData);
}

window.addEventListener('keydown', (e) => {
    if ((e.key === 'r' || e.key === 'R') && gameRunning) {
        resetGame();
    }
});

// Gestion des scores avec localStorage

function refreshBestScoreUI() {
    const bestScore = localStorage.getItem('celeste_best_score');
    const displayElement = document.getElementById('best-score-display');
    if (displayElement) {
        displayElement.innerText = bestScore ? bestScore : "--";
    }
}

function getScores() {
    return JSON.parse(localStorage.getItem('celeste_scores') || '[]');
}

function updateScoreboardDisplay() {
    const listEl = document.getElementById('score-list');
    if (!listEl) return;
    const scores = getScores();
    if (!scores.length) { listEl.innerText = "Aucun score pour l'instant"; return; }
    const html = '<ol class="scores-table">' + scores.map((s, idx) => `<li class="score-row"><strong>#${idx+1}</strong> <span class="score-value">${s.score.toFixed(2)}</span> <span style="margin-left:8px; color:#fff;">${s.name ? s.name : 'Anonyme'}</span> <small style="margin-left:8px; color:#ccc;">${new Date(s.date).toLocaleString()} • t:${s.time.toFixed(2)}s d:${s.deaths} p:${s.powers}</small></li>`).join('') + '</ol>';
    listEl.innerHTML = html;
}

const clearScoresBtn = document.getElementById('clear-scores'); 
if (clearScoresBtn) {
    clearScoresBtn.addEventListener('click', () => {
        localStorage.removeItem('celeste_scores');
        localStorage.removeItem('celeste_best_score');
        refreshBestScoreUI();
        updateScoreboardDisplay();
    });
}

const saveScoreBtn = document.getElementById('save-score-btn');
if (saveScoreBtn) {
    saveScoreBtn.addEventListener('click', () => { 
        if (!pendingScore) return;
        const nameInputEl = document.getElementById('player-name');
        const name = (nameInputEl && nameInputEl.value.trim()) ? nameInputEl.value.trim() : 'Anonyme';
        pendingScore.name = name;
        localStorage.setItem('celeste_last_player_name', name);
        const scores = JSON.parse(localStorage.getItem('celeste_scores') || '[]');
        scores.push(pendingScore);
        scores.sort((a,b) => a.score - b.score);
        localStorage.setItem('celeste_scores', JSON.stringify(scores));
        localStorage.setItem('celeste_best_score', scores[0].score.toFixed(2));
        refreshBestScoreUI();
        updateScoreboardDisplay();
        saveScoreBtn.disabled = true;
        pendingScore = null;
    });
}

refreshBestScoreUI(); // Met à jour l'affichage du meilleur score au lancement
updateScoreboardDisplay(); // Met à jour l'affichage du tableau des scores au lancement