export const KEYS = {
    UP: ['ArrowUp', 'z'],
    LEFT: ['ArrowLeft', 'q'],
    RIGHT: ['ArrowRight', 'd'],
    JUMP: ['ArrowUp', 'z', ' '],
    TIME_STOP: ['shift'],
    RESTART: ['r']
};

export class InputHandler {
    constructor() {
        this.keys = [];

        window.addEventListener('keydown', (e) => { // Permet de gérer les touches appuyées 
            const key = e.key.toLowerCase(); // On les mets en minuscule pour éviter les bugs
            if (this.keys.indexOf(key) === -1) { 
                this.keys.push(key);
            }
        });

        window.addEventListener('keyup', (e) => {
            const key = e.key.toLowerCase();
            const index = this.keys.indexOf(key);
            if (index > -1) {
                this.keys.splice(index, 1);
            }
        });

        window.addEventListener('blur', () => {
            this.keys = [];
        });
    }

    isPressed(allowedKeys) { 
        if (Array.isArray(allowedKeys)) {
            return allowedKeys.some(k => this.keys.includes(k.toLowerCase()));
        }
        return this.keys.includes(allowedKeys.toLowerCase());
    }
}