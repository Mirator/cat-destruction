// AudioManager.js
// Centralized audio manager for loading and playing sound assets

class AudioManager {
    static instance = null;

    constructor() {
        if (AudioManager.instance) {
            return AudioManager.instance;
        }
        this.audioContext = null;
        this.buffers = {};
        this.isReady = false;
        this._initContext();
        AudioManager.instance = this;
    }

    _initContext() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.isReady = true;
        } catch (e) {
            this.isReady = false;
        }
    }

    async loadSound(name, url) {
        if (!this.isReady) return;
        if (this.buffers[name]) return; // Already loaded
        const response = await fetch(url);
        const arrayBuffer = await response.arrayBuffer();
        const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
        this.buffers[name] = audioBuffer;
    }

    play(name, options = {}) {
        if (!this.isReady || !this.buffers[name]) return;
        const source = this.audioContext.createBufferSource();
        source.buffer = this.buffers[name];
        const gainNode = this.audioContext.createGain();
        gainNode.gain.value = options.volume !== undefined ? options.volume : 1.0;
        source.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        source.start(0);
    }

    // Example: play a meow sound
    playMeow() {
        this.play('cat_meow');
    }
}

// Singleton export
const audioManager = new AudioManager();
export default audioManager; 