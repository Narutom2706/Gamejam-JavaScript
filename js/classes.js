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

    update(deltaTime, worldSpeed, player, correction = 1) {
        this.x += this.vx * worldSpeed * correction;
        this.y += this.vy * worldSpeed * correction; //correction ici ne casse pas tout
    }
}

export class Block extends Entity {
    constructor(x, y) {
        super(x, y, 40, 40, "#444");

        if (!Block.image) {
            Block.image = new Image();
            Block.image.src = 'assets/Image/Sprite/mur/mur.png';
        }
    }
    
    draw(ctx) {
        if (Block.image && Block.image.complete) {
            ctx.drawImage(Block.image, this.x, this.y, this.width, this.height);
        } else {
            ctx.fillStyle = this.color;
            ctx.fillRect(this.x, this.y, this.width, this.height);
            ctx.strokeStyle = "#222";
            ctx.lineWidth = 2;
            ctx.strokeRect(this.x, this.y, this.width, this.height);
        }
    }
}
Block.image = null;

export class FinishBlock extends Entity {
    constructor(x, y) {
        super(x, y, 40, 40, "#FFD700");
    }
    
    draw(ctx) {
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);
        
        ctx.fillStyle = "#FFA500";
        ctx.font = "bold 24px Arial";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("⭐", this.x + this.width / 2, this.y + this.height / 2);
    }
}

export class StretchWall extends Block {
    constructor(x, y, size, direction, type = 'attack') {
        super(x, y);
        this.type = type; 
        this.color = (this.type === 'attack') ? "#38b6ff" : "#00ff88"; 
        
        this.initialX = x;
        this.initialY = y;
        this.direction = direction; 
        
        this.targetLength = size; 
        this.speed = 10;          
        this.retractSpeed = 4;    

        this.currentLength = (this.type === 'shy') ? this.targetLength : 40;

        if (!StretchWall.image) {
            StretchWall.image = new Image();
            StretchWall.image.src = 'assets/Image/Sprite/mur/mur.png';
        }
    }

    update(deltaTime, worldSpeed, player, correction = 1) {
        if (worldSpeed === 0) return;

        let sensorRect = { x: 0, y: 0, width: 0, height: 0 };
        const margin = 100; 

        if (this.direction === 'right') {
            sensorRect = { x: this.initialX, y: this.initialY - 10, width: this.targetLength + margin, height: 40 + 20 };
        } else if (this.direction === 'left') {
            sensorRect = { x: this.initialX - this.targetLength - margin, y: this.initialY - 10, width: this.targetLength + margin, height: 40 + 20 };
        } else if (this.direction === 'down') {
            sensorRect = { x: this.initialX - 10, y: this.initialY, width: 40 + 20, height: this.targetLength + margin };
        } else if (this.direction === 'up') {
            sensorRect = { x: this.initialX - 10, y: this.initialY - this.targetLength - margin, width: 40 + 20, height: this.targetLength + margin };
        }

        const isPlayerDetected = rectIntersect(player, sensorRect);

        const speedCorrected = this.speed * correction;
        const retractSpeedCorrected = this.retractSpeed * correction;

        if (this.type === 'attack') {
            if (isPlayerDetected) {
                if (this.currentLength < this.targetLength) {
                    this.currentLength += speedCorrected;
                    if (this.currentLength > this.targetLength) this.currentLength = this.targetLength;
                }
            } else {
                if (this.currentLength > 40) {
                    this.currentLength -= retractSpeedCorrected;
                    if (this.currentLength < 40) this.currentLength = 40;
                }
            }
        } else {
            if (isPlayerDetected) {
                if (this.currentLength > 40) {
                    this.currentLength -= speedCorrected;
                    if (this.currentLength < 40) this.currentLength = 40;
                }
            } else {
                if (this.currentLength < this.targetLength) {
                    this.currentLength += retractSpeedCorrected;
                    if (this.currentLength > this.targetLength) this.currentLength = this.targetLength;
                }
            }
        }

        if (this.direction === 'right') {
            this.width = this.currentLength;
            this.height = 40;
        } else if (this.direction === 'left') {
            this.width = this.currentLength;
            this.height = 40;
            this.x = this.initialX - (this.currentLength - 40); 
        } else if (this.direction === 'down') {
            this.width = 40;
            this.height = this.currentLength;
        } else if (this.direction === 'up') {
            this.width = 40;
            this.height = this.currentLength;
            this.y = this.initialY - (this.currentLength - 40); 
        }

        if (rectIntersect(player, this)) {
            if (this.direction === 'right') {
                player.x = this.x + this.width + 0.1;
            } else if (this.direction === 'left') {
                player.x = this.x - player.width - 0.1;
            } else if (this.direction === 'down') {
                player.y = this.y + this.height + 0.1;
                player.velY = 0;
            } else if (this.direction === 'up') {
                player.y = this.y - player.height - 0.1;
                player.velY = 0;
                player.isGrounded = true; 
            }
        }
    }
    
    draw(ctx) {
        if (!StretchWall.image || !StretchWall.image.complete) {
            ctx.fillStyle = this.color;
            ctx.fillRect(this.x, this.y, this.width, this.height);
            return;
        }

        ctx.save();
        ctx.beginPath();
        ctx.rect(this.x, this.y, this.width, this.height);
        ctx.clip();

        const blockSize = 40;
        
        if (this.direction === 'right' || this.direction === 'left') {
            const numBlocks = Math.ceil(this.width / blockSize);
            for (let i = 0; i < numBlocks; i++) {
                ctx.drawImage(StretchWall.image, this.x + (i * blockSize), this.y, blockSize, blockSize);
            }
        } else {
            const numBlocks = Math.ceil(this.height / blockSize);
            for (let i = 0; i < numBlocks; i++) {
                ctx.drawImage(StretchWall.image, this.x, this.y + (i * blockSize), blockSize, blockSize);
            }
        }

        ctx.restore();
    }
}
StretchWall.image = null;
export class Player extends Entity { 
    constructor(x, y) {
        super(x, y, 32, 32, "#00ffcc");
        this.velX = 0;
        this.velY = 0;
        this.speed = 8; 
        this.jumpForce = -9;
        this.isGrounded = false;
        
        this.hasReleasedJump = true; 
        this.jumpCooldown = 0;
    }

    update(input, blocks, correction = 1) {
        if (this.jumpCooldown > 0) this.jumpCooldown--;

        if (input.isPressed(KEYS.RIGHT)) this.velX = this.speed;
        else if (input.isPressed(KEYS.LEFT)) this.velX = -this.speed;
        else this.velX = 0;

        this.x += this.velX * correction;

        for (const block of blocks) {
            if (rectIntersect(this, block)) {
                if (this.velX > 0) this.x = block.x - this.width - 0.1;
                else if (this.velX < 0) this.x = block.x + block.width + 0.1;
                this.velX = 0;
            }
        }

        this.velY += 0.3 * correction; 
        this.y += this.velY * correction;
        this.isGrounded = false; 

        for (const block of blocks) {
            if (rectIntersect(this, block)) {
                if (this.velY > 0) { 
                    if (this.y < block.y + 20) {
                        this.y = block.y - this.height - 0.1;
                        this.velY = 0;
                        this.isGrounded = true;
                    } else {
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

        if (jumpPressed && this.isGrounded && this.hasReleasedJump && this.jumpCooldown <= 0) {
            this.velY = this.jumpForce;
            this.isGrounded = false;
            this.hasReleasedJump = false; 
            this.jumpCooldown = 10; 
        }
    }
}

export class PatrolBat extends TimeSensitiveEntity {
    constructor(x, y, endX) {
        super(x, y, 40, 40, "#ff0066"); 

        this.startX = x; 
        this.endX = endX; 
        this.speed = 2;
        this.vx = this.speed;

        this.visualSize = 80; 

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

    update(deltaTime, worldSpeed, player, blocks, correction) {
        super.update(deltaTime, worldSpeed, player, correction); //ne pas mettre correction ici
        
        if (worldSpeed > 0) {
            if (this.x >= this.endX) {
                this.x = this.endX;
                this.vx = -this.speed;
            } else if (this.x <= this.startX) {
                this.x = this.startX;
                this.vx = this.speed;
            }

            this.animTimer+= correction;
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
        this.markedForDeletion = false;
        
        if (!Spike.image) {
            Spike.image = new Image();
            Spike.image.src = 'assets/Image/Sprite/spike/spike.png';
        }
    }

    update(deltaTime, worldSpeed, player, blocks, correction) {
        super.update(deltaTime, worldSpeed, player, correction);
        
        if (this.isFalling && worldSpeed > 0) {
            if (!this.hasFallen && Math.abs(player.x - this.x) < 50 && player.y > this.y) {
                this.vy = 4;
                this.hasFallen = true;
            }

            if (this.hasFallen) {
                for (const block of blocks) {
                    if (rectIntersect(this, block)) {
                        this.markedForDeletion = true;
                        break;
                    }
                }
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