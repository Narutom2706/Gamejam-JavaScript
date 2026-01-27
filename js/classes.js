import { KEYS, GRAVITY } from './constants.js'; 
import { rectIntersect } from './utils.js';

export class Entity {
    constructor(x, y, width, height, color) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.color = color;
        this.jumpCooldown = 0;
    }

    draw(ctx) {
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);
    }

    update(deltaTime, worldSpeed) {}
}

export class TimeSensitiveEntity extends Entity {
    constructor(x, y, width, height, color) {
        super(x, y, width, height, color);
        this.vx = 0;
        this.vy = 0;
    }

    update(deltaTime, worldSpeed) {
        this.x += this.vx * worldSpeed;
        this.y += this.vy * worldSpeed;
    }
}
export class Player extends Entity { 
    constructor(x, y) {
        super(x, y, 32, 32, "#00ff00");
        this.velX = 0;
        this.velY = 0;
        this.speed = 2; // ici si vous voulez modifier la vitesse du perso
        this.jumpForce = -12;
        this.isGrounded = false;
        this.jumpCooldown = 0;
    }

    update(input, blocks) {

        if (this.jumpCooldown > 0) {
            this.jumpCooldown--;
        }
        
        if (input.isPressed(KEYS.RIGHT)) this.velX = this.speed;
        else if (input.isPressed(KEYS.LEFT)) this.velX = -this.speed;
        else this.velX = 0;

        this.x += this.velX;

        for (const block of blocks) {
            if (rectIntersect(this, block)) {
                if (this.velX > 0) { 
                    this.x = block.x - this.width - 0.1;
                } 
                else if (this.velX < 0) { 
                    this.x = block.x + block.width + 0.1;
                }
                this.velX = 0;
            }
        }

        this.velY += 0.5; /* Gravité */
        this.y += this.velY;
        
        this.isGrounded = false; 

        for (const block of blocks) {
            if (rectIntersect(this, block)) {
                if (this.velY > 0) { 
                    this.y = block.y - this.height - 0.1;
                    this.velY = 0;
                    this.isGrounded = true;
                } 
                else if (this.velY < 0) {
                    this.y = block.y + block.height + 0.1;
                    this.velY = 0;
                }
            }
        }

        if ((input.isPressed(KEYS.UP) || input.isPressed(KEYS.JUMP)) && this.isGrounded && this.jumpCooldown <= 0) {
            this.velY = this.jumpForce;
            this.isGrounded = false;
            
            this.jumpCooldown = 50; 
        }

        if (this.y > 800) {
            this.x = 100;
            this.y = 100;
            this.velY = 0;
        }
    }
}


export class Bat extends TimeSensitiveEntity {
    constructor(x, y, distance) {
        super(x, y, 40, 40, "red");
        this.startX = x;
        this.maxDistance = distance;
        this.vx = 3;
    }

    update(deltaTime, worldSpeed) {
        super.update(deltaTime, worldSpeed);
        if (worldSpeed > 0) {
             if (this.x > this.startX + this.maxDistance) this.vx = -3;
            else if (this.x < this.startX) this.vx = 3;
        }
    }

    draw(ctx) {
        super.draw(ctx);
        ctx.strokeStyle = "black";
        ctx.lineWidth = 2;
        ctx.strokeRect(this.x, this.y, this.width, this.height);
    }
}

export class Block extends Entity {
    constructor(x, y) {
        super(x, y, 40, 40, "#555");
    }
}

export class Spike extends TimeSensitiveEntity {
     constructor(x, y, isFalling = false) {
        super(x, y, 40, 40, "orange");
        this.isFalling = isFalling;
        this.hasFallen = false;
    }

    update(deltaTime, worldSpeed, player) {
        super.update(deltaTime, worldSpeed);
        if (this.isFalling && worldSpeed > 0) {
            if (!this.hasFallen && Math.abs(player.x - this.x) < 50) {
                this.vy = 8;
                this.hasFallen = true;
            }
        }
    }

    draw(ctx) {
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.moveTo(this.x, this.y + this.height);
        ctx.lineTo(this.x + this.width / 2, this.y);
        ctx.lineTo(this.x + this.width, this.y + this.height);
        ctx.fill();
    }
}

 export class Chrono {
     constructor() {
         this.startTime = 0;
         this.elapsed = 0;
         this.isRunning = false;
         this.element = document.getElementById('timer'); 
     }

     start() {
         this.startTime = Date.now(); 
         this.isRunning = true;
     }

     update() {
        if (!this.isRunning) return;

        // Calcul du temps écoulé
        const currentTime = Date.now();
        const timeDiff = currentTime - this.startTime;

        // On convertit en secondes avec 2 chiffres après la virgule 
        this.elapsed = (timeDiff / 1000).toFixed(2);

        // Mise à jour de l'affichage HTML
        if (this.element) {
            this.element.innerText = this.elapsed;
        }
    }

     stop() {
        this.isRunning = false;
    }

     reset() {
        this.startTime = Date.now();
        this.elapsed = 0;
        if (this.element) this.element.innerText = "0.00";
    }
}