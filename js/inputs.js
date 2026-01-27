export class InputHandler {
    constructor() {
        this.keys = []; 

        window.addEventListener('keydown', (e) => {
            if (this.keys.indexOf(e.key) === -1) {
                this.keys.push(e.key);
            }
            // console.log("Touche pressée :", e.key); 
        });

        window.addEventListener('keyup', (e) => {
            this.keys.splice(this.keys.indexOf(e.key), 1);
        });
    }

    isPressed(allowedKeys) {
        if (Array.isArray(allowedKeys)) {
            return allowedKeys.some(key => this.keys.includes(key));
        }
        return this.keys.includes(allowedKeys);
    }
}