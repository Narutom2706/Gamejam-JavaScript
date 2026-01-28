import { KEYS } from './constants.js'; 
import { rectIntersect } from './utils.js';

export class Entity {
    constructor(x, y, width, height, color) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.color = color;
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

export class Block extends Entity {
    constructor(x, y) {
        super(x, y, 40, 40, "#444");
    }
    
    draw(ctx) {
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);
        ctx.strokeStyle = "#222";
        ctx.lineWidth = 2;
        ctx.strokeRect(this.x, this.y, this.width, this.height);
    }
}

export class StretchWall extends Block {
    constructor(x, y, size, direction) {
        super(x, y);
        this.color = "#38b6ff"; 
        this.initialX = x;
        this.initialY = y;
        this.direction = direction; 
        
        this.currentLength = 40; 
        this.targetLength = size; 
        this.speed = 10;          
        this.retractSpeed = 2;    
    }

    update(deltaTime, worldSpeed, player) {
        if (worldSpeed === 0) return;

        let sensorRect = { x: 0, y: 0, width: 0, height: 0 };
        // AJOUT DES MARGES (C'est ça qui manquait !)
        const margin = 10; 

        if (this.direction === 'right') {
            sensorRect = { x: this.initialX, y: this.initialY - margin, width: this.targetLength + 40 + margin, height: 40 + margin * 2 };
        } else if (this.direction === 'left') {
            sensorRect = { x: this.initialX - this.targetLength - margin, y: this.initialY - margin, width: this.targetLength + 40 + margin, height: 40 + margin * 2 };
        } else if (this.direction === 'down') {
            sensorRect = { x: this.initialX - margin, y: this.initialY, width: 40 + margin * 2, height: this.targetLength + 40 + margin };
        } else if (this.direction === 'up') {
            sensorRect = { x: this.initialX - margin, y: this.initialY - this.targetLength - margin, width: 40 + margin * 2, height: this.targetLength + 40 + margin };
        }

        const isPlayerDetected = rectIntersect(player, sensorRect);

        if (isPlayerDetected) {
            if (this.currentLength < this.targetLength) {
                this.currentLength += this.speed;
                if (this.currentLength > this.targetLength) this.currentLength = this.targetLength;
            }
        } else {
            if (this.currentLength > 40) {
                this.currentLength -= this.retractSpeed;
                if (this.currentLength < 40) this.currentLength = 40;
            }
        }

        if (this.direction === 'right') {
            this.width = this.currentLength;
            this.height = 40;
        } 
        else if (this.direction === 'left') {
            this.width = this.currentLength;
            this.height = 40;
            this.x = this.initialX - (this.currentLength - 40); 
        } 
        else if (this.direction === 'down') {
            this.width = 40;
            this.height = this.currentLength;
        } 
        else if (this.direction === 'up') {
            this.width = 40;
            this.height = this.currentLength;
            this.y = this.initialY - (this.currentLength - 40); 
        }
    }
    
    draw(ctx) {
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);
        
        ctx.strokeStyle = "white";
        ctx.lineWidth = 2;
        ctx.strokeRect(this.x, this.y, this.width, this.height);

        ctx.fillStyle = (this.currentLength > 45) ? "#ff0000" : "#00ff00";
        ctx.fillRect(this.initialX + 10, this.initialY + 10, 20, 20);
    }
}

export class Player extends Entity { 
    constructor(x, y) {
        super(x, y, 32, 32, "#00ffcc");
        this.velX = 0;
        this.velY = 0;
        this.speed = 3; 
        this.jumpForce = -9;
        this.isGrounded = false;
        
        // Anti-Spam Jump
        this.hasReleasedJump = true; 
    }

    update(input, blocks) {
        if (input.isPressed(KEYS.RIGHT)) this.velX = this.speed;
        else if (input.isPressed(KEYS.LEFT)) this.velX = -this.speed;
        else this.velX = 0;

        this.x += this.velX;

        for (const block of blocks) {
            if (rectIntersect(this, block)) {
                if (this.velX > 0) this.x = block.x - this.width - 0.1;
                else if (this.velX < 0) this.x = block.x + block.width + 0.1;
                this.velX = 0;
            }
        }

        this.velY += 0.3; 
        this.y += this.velY;
        this.isGrounded = false; 

        for (const block of blocks) {
            if (rectIntersect(this, block)) {
                if (this.velY > 0) { 
                    // Anti-Téléportation : On vérifie si on est bien au-dessus
                    if (this.y < block.y + 20) {
                        this.y = block.y - this.height - 0.1;
                        this.velY = 0;
                        this.isGrounded = true;
                    } else {
                        // Sinon on tape la tête ou le côté
                        this.y = block.y + block.height + 0.1;
                        this.velY = 0;
                    }
                } 
                else if (this.velY < 0) {
                    this.y = block.y + block.height + 0.1;
                    this.velY = 0;
                }
            }
        }

        const jumpPressed = input.isPressed(KEYS.UP) || input.isPressed(KEYS.JUMP);

        if (!jumpPressed) {
            this.hasReleasedJump = true;
        }

        if (jumpPressed && this.isGrounded && this.hasReleasedJump) {
            this.velY = this.jumpForce;
            this.isGrounded = false;
            this.hasReleasedJump = false; 
        }
    }
}

export class PatrolBat extends TimeSensitiveEntity {
    constructor(x, y, endX) {
        // 1. On garde la hitbox à 40x40 pour qu'elle passe dans les couloirs sans bugger
        super(x, y, 40, 40, "#ff0066"); 

        this.startX = x; 
        this.endX = endX; 
        this.speed = 3;
        this.vx = this.speed;

        // 2. On définit une taille VISUELLE plus grande (le sprite)
        this.visualSize = 80; 

        // --- ANIMATION ---
        this.currentFrame = 1; 
        this.animTimer = 0;    
        this.animSpeed = 24;    

        if (!PatrolBat.images.frame1) {
            PatrolBat.images.frame1 = new Image();
            PatrolBat.images.frame1.src = 'assets/Image/Sprite/bat/bat_1.png';
            PatrolBat.images.frame2 = new Image();
            PatrolBat.images.frame2.src = 'assets/Image/Sprite/bat/bat_2.png';
        }
    }

    update(deltaTime, worldSpeed) {
        super.update(deltaTime, worldSpeed);
        
        if (worldSpeed > 0) {
            if (this.x >= this.endX) {
                this.x = this.endX;
                this.vx = -this.speed;
            } else if (this.x <= this.startX) {
                this.x = this.startX;
                this.vx = this.speed;
            }

            this.animTimer++;
            if (this.animTimer >= this.animSpeed) {
                this.animTimer = 0;
                this.currentFrame = (this.currentFrame === 1) ? 2 : 1;
            }
        }
    }

    draw(ctx) {
        if (!PatrolBat.images.frame1 || !PatrolBat.images.frame1.complete || !PatrolBat.images.frame2.complete) {
             super.draw(ctx);
             return;
        }

        const img = (this.currentFrame === 1) ? PatrolBat.images.frame1 : PatrolBat.images.frame2;

        ctx.save();

        ctx.translate(this.x + this.width / 2, this.y + this.height / 2);

        if (this.vx < 0) {
            ctx.scale(-1, 1);
        }

        ctx.drawImage(img, -this.visualSize / 2, -this.visualSize / 2, this.visualSize, this.visualSize);

        ctx.restore();
    }
}

PatrolBat.images = { frame1: null, frame2: null };

export class Spike extends TimeSensitiveEntity {
     constructor(x, y, isFalling = false) {
        super(x, y, 40, 40, "orange");
        this.isFalling = isFalling;
        this.hasFallen = false;
        
        if (!Spike.image) {
            Spike.image = new Image();
            Spike.image.src = 'assets/Image/Sprite/spike/spike.png';
        }
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
        if (!Spike.image || !Spike.image.complete) {
             super.draw(ctx);
             return;
        }

        if (this.isFalling) {
            ctx.drawImage(Spike.image, this.x, this.y, this.width, this.height);
        } else {
            ctx.save();
            ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
            ctx.scale(1, -1);
            ctx.drawImage(Spike.image, -this.width / 2, -this.height / 2, this.width, this.height);
            ctx.restore();
        }
    }
}
Spike.image = null;

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
        const currentTime = Date.now();
        const timeDiff = currentTime - this.startTime;
        this.elapsed = (timeDiff / 1000).toFixed(2);
        if (this.element) this.element.innerText = this.elapsed;
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