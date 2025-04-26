import * as THREE from 'three';
import { Highlightable } from './Highlightable.js';

// Base class for all props that can be knocked over
export class Prop extends Highlightable {
    constructor(position = new THREE.Vector3(), config = {}) {
        const model = (new.target).createModel(position, config);
        super(model);
        this.position = position.clone();
        this.isKnockedOver = false;
        this.config = config;
        // Only set up the model, do not reassign this.model
        this.model.position.copy(this.position);
        this.model.userData.propInstance = this;
    }

    // To be implemented by subclasses
    static createModel(position, config) {
        return new THREE.Group();
    }

    knockOver() {
        if (this.isKnockedOver) return;
        this.isKnockedOver = true;
        this.targetRotation = this.config.knockOverRotation || Math.PI / 2 * (Math.random() < 0.5 ? 1 : -1);
        this.animationTime = 0;
        this.animating = true;
        this.playKnockSound();
    }

    reset() {
        this.isKnockedOver = false;
        this.targetRotation = this.config.resetRotation || 0;
        this.animationTime = 0;
        this.animating = true;
    }

    update(deltaTime) {
        if (this.animating) {
            const current = this.model.rotation.x;
            const target = this.targetRotation;
            const speed = 3.5; // radians per second
            const diff = target - current;
            if (Math.abs(diff) > 0.01) {
                this.model.rotation.x += Math.sign(diff) * Math.min(Math.abs(diff), speed * deltaTime);
            } else {
                this.model.rotation.x = target;
                this.animating = false;
            }
        }
    }

    playKnockSound() {
        // TODO: Play knock-over sound effect here
        // Example: new Audio('assets/sounds/knock.mp3').play();
    }
} 