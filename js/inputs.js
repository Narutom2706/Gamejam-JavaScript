export class InputHandler {
    constructor() {
        this.keys = []; 

        window.addEventListener('keydown', (e) => {
            // On convertit toujours en minuscule
            const key = e.key.toLowerCase(); 

            if (this.keys.indexOf(key) === -1) {
                this.keys.push(key);
            }
        });

        window.addEventListener('keyup', (e) => {
            const key = e.key.toLowerCase();
            const index = this.keys.indexOf(key);
            
            // On ne splice que si la touche existe vraiment
            if (index > -1) {
                this.keys.splice(index, 1);
            }
        });

        // Si on quitte la fenêtre plus rien marche
        window.addEventListener('blur', () => {
            this.keys = [];
        });
    }

    isPressed(allowedKeys) {
        // permet de vérifier si une ou plusieurs touches sont pressées
        if (Array.isArray(allowedKeys)) {
            return allowedKeys.some(k => this.keys.includes(k.toLowerCase()));
        }
        return this.keys.includes(allowedKeys.toLowerCase());
    }
}