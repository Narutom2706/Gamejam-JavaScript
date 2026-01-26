class InputHandler {
    constructor() {
        this.keys = []; 

        window.addEventListener('keydown', (e) => {
            // On ajoute la touche à la liste si elle n'y est pas déjà
            if (this.keys.indexOf(e.key) === -1) {
                this.keys.push(e.key);
            }
        });

        window.addEventListener('keyup', (e) => {
            // On retire la touche de la liste quand on la relâche
            this.keys.splice(this.keys.indexOf(e.key), 1);
        });
    }

    // Petite fonction pour vérifier une touche
    isPressed(key) {
        return this.keys.includes(key);
    }
}