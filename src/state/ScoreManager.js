export class ScoreManager {
    constructor(storageKey = 'catSurvivalBestTime') {
        this.storageKey = storageKey;
        this.startTime = null;
        this.endTime = null;
        this.elapsed = 0;
    }

    start() {
        this.startTime = Date.now();
        this.endTime = null;
        this.elapsed = 0;
    }

    stop() {
        if (this.startTime) {
            this.endTime = Date.now();
            this.elapsed = this.endTime - this.startTime;
        }
    }

    reset() {
        this.startTime = null;
        this.endTime = null;
        this.elapsed = 0;
    }

    getElapsed() {
        if (this.startTime && !this.endTime) {
            return Date.now() - this.startTime;
        }
        return this.elapsed;
    }

    getFormattedElapsed() {
        return ScoreManager.formatTime(this.getElapsed());
    }

    saveIfBest() {
        const best = this.getBest();
        if (this.getElapsed() > best) {
            localStorage.setItem(this.storageKey, this.getElapsed());
            return true;
        }
        return false;
    }

    getBest() {
        return parseInt(localStorage.getItem(this.storageKey) || '0', 10);
    }

    getFormattedBest() {
        return ScoreManager.formatTime(this.getBest());
    }

    static formatTime(ms) {
        const totalSeconds = Math.floor(ms / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }
} 