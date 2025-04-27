import { HungerBar } from '../../ui/hungerBar.js';
import { CatStatusBar } from '../../ui/catStatusBar.js';

export class CatUIManager {
    constructor(state) {
        this.state = state;
        this.hungerBar = new HungerBar();
        this.statusBar = new CatStatusBar();
    }

    update() {
        this.hungerBar.update(this.state.hunger, this.state.foodPreference);
        this.statusBar.updateAnger(this.state.anger);
        this.statusBar.updateActivity(this.state.activity);
    }

    dispose() {
        // Add any cleanup logic for UI elements if needed
    }
} 