export class PlayerState {
    constructor(initialHealth = 100) {
        this.health = initialHealth;
        this.maxHealth = initialHealth;
        this.listeners = [];
    }

    getHealth() {
        return this.health;
    }

    setHealth(value) {
        this.health = Math.max(0, Math.min(this.maxHealth, value));
        this.notify();
    }

    changeHealth(amount) {
        this.setHealth(this.health + amount);
    }

    onChange(listener) {
        this.listeners.push(listener);
    }

    notify() {
        for (const listener of this.listeners) {
            listener(this.health, this.maxHealth);
        }
    }
} 