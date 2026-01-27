import { KEYS, GRAVITY } from './constants.js'; 

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
export class Player extends Entity { 
    constructor(x, y) {
        super(x, y, 32, 32, "#00ff00");
        this.velX = 0;
        this.velY = 0;
        this.speed = 5;
        this.jumpForce = -12;
        this.isGrounded = false;
    }

    update(input) {
        if (input.isPressed(KEYS.RIGHT)) {
            this.velX = this.speed;
        } 
        else if (input.isPressed(KEYS.LEFT)) {
            this.velX = -this.speed;
        } 
        else {
            this.velX = 0;
        }
        this.velY += GRAVITY;
        this.x += this.velX;
        this.y += this.velY;

        if (this.y + this.height >= 600) { 
            this.y = 600 - this.height;
            this.velY = 0;              
            this.isGrounded = true;    
        } else {
            this.isGrounded = false;
        }

        if ((input.isPressed(KEYS.UP) || input.isPressed(KEYS.JUMP)) && this.isGrounded) {
            this.velY = this.jumpForce;
            this.isGrounded = false;
        }
    }
}


export class Saw extends TimeSensitiveEntity {
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