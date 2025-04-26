import * as THREE from 'three';

// Base class for all props that can be knocked over
export class Prop {
    constructor(position = new THREE.Vector3(), config = {}) {
        this.position = position.clone();
        this.isKnockedOver = false;
        this.config = config;
        this.model = this.createModel();
        this.model.position.copy(this.position);
        this.model.userData.propInstance = this;
    }

    // To be implemented by subclasses
    createModel() {
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

// FlowerProp: a simple flower in a pot
export class FlowerProp extends Prop {
    constructor(position, config = {}) {
        super(position, config);
    }

    createModel() {
        const group = new THREE.Group();
        // Pot
        const potGeometry = new THREE.CylinderGeometry(0.08, 0.1, 0.12, 16);
        const potMaterial = new THREE.MeshStandardMaterial({ color: 0xA0522D, roughness: 0.7 });
        const pot = new THREE.Mesh(potGeometry, potMaterial);
        pot.position.y = 0.06;
        group.add(pot);
        // Stem
        const stemGeometry = new THREE.CylinderGeometry(0.015, 0.015, 0.18, 8);
        const stemMaterial = new THREE.MeshStandardMaterial({ color: 0x228B22, roughness: 0.6 });
        const stem = new THREE.Mesh(stemGeometry, stemMaterial);
        stem.position.y = 0.18;
        group.add(stem);
        // Flower (simple disk)
        const flowerGeometry = new THREE.CircleGeometry(0.06, 16);
        const flowerMaterial = new THREE.MeshStandardMaterial({ color: this.config.flowerColor || 0xFF69B4, roughness: 0.5 });
        const flower = new THREE.Mesh(flowerGeometry, flowerMaterial);
        flower.position.y = 0.28;
        flower.rotation.x = -Math.PI / 2;
        group.add(flower);
        // Center
        const centerGeometry = new THREE.CircleGeometry(0.025, 12);
        const centerMaterial = new THREE.MeshStandardMaterial({ color: 0xFFD700, roughness: 0.4 });
        const center = new THREE.Mesh(centerGeometry, centerMaterial);
        center.position.y = 0.281;
        center.rotation.x = -Math.PI / 2;
        group.add(center);
        return group;
    }
} 