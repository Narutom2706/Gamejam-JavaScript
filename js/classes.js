/* gère uniquement la position (x,y), la taille et l'affichage couleur */
class Entity {
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

/* Tous les objets héritant de cette classe s'arrêteront automatiquement lorsque le paramètre 'worldSpeed' sera à 0 */
class TimeSensitiveEntity extends Entity {
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

/* Il hérite directement de Entity (et non TimeSensitiveEntity) pour pouvoir bouger*/
class Player extends Entity { 
    constructor(x, y) {
        super(x, y, 32, 32, "#00ff0081");
        this.velX = 0;
        this.velY = 0;
        this.speed = 5;
        this.isGrounded = false;
    }

    update(input) {
        if (input.keys.includes('ArrowRight')) this.velX = this.speed;
        else if (input.keys.includes('ArrowLeft')) this.velX = -this.speed;
        else if (input.keys.includes('ArrowUp')) this.y -= this.speed;
        else this.velX = 0;

        this.x += this.velX;
    }
}

class Saw extends TimeSensitiveEntity {
    constructor(x, y, distance) {
        super(x, y, 40, 40, "Gray");
        this.startX = x;
        this.maxDistance = distance;
        this.vx = 3;
    }

    update(deltaTime, worldSpeed) {
        super.update(deltaTime, worldSpeed);

        if (worldSpeed > 0) {
            if (this.x > this.startX + this.maxDistance) {
                this.vx = -3;
            } else if (this.x < this.startX) {
                this.vx = 3;
            }
        }
    }

    draw(ctx) {
        super.draw(ctx);
        ctx.strokeStyle = "black";
        ctx.lineWidth = 2;
        ctx.strokeRect(this.x, this.y, this.width, this.height);
    }
}

class Spike extends TimeSensitiveEntity {
    constructor(x, y, isFalling = false) {
        super(x, y, 40, 40, "Gray");
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
class Block extends Entity {
    constructor(x, y) {
        super(x, y, 40, 40, "#555");
    }
}