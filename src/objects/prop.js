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

// FlowerProp: a simple flower in a pot
export class FlowerProp extends Prop {
    constructor(position, config = {}) {
        super(position, config);
        // No reassignment of this.model here
    }

    static createModel(position, config = {}) {
        const group = new THREE.Group();
        // Pot (with rim and base)
        const potColor = 0xC68642; // warm terracotta
        const rimColor = 0xA0522D; // darker rim
        const baseColor = 0x8B5C2A; // base
        // Main pot body
        const potGeometry = new THREE.CylinderGeometry(0.08, 0.1, 0.12, 24);
        const potMaterial = new THREE.MeshStandardMaterial({ color: potColor, roughness: 0.7, emissive: 0x222222 });
        const pot = new THREE.Mesh(potGeometry, potMaterial);
        pot.position.y = 0.06;
        group.add(pot);
        // Pot rim
        const rimGeometry = new THREE.TorusGeometry(0.09, 0.015, 12, 24);
        const rimMaterial = new THREE.MeshStandardMaterial({ color: rimColor, roughness: 0.6, emissive: 0x222222 });
        const rim = new THREE.Mesh(rimGeometry, rimMaterial);
        rim.position.y = 0.12;
        rim.rotation.x = Math.PI / 2;
        group.add(rim);
        // Pot base
        const baseGeometry = new THREE.CylinderGeometry(0.06, 0.07, 0.02, 20);
        const baseMaterial = new THREE.MeshStandardMaterial({ color: baseColor, roughness: 0.8, emissive: 0x222222 });
        const base = new THREE.Mesh(baseGeometry, baseMaterial);
        base.position.y = 0.01;
        group.add(base);
        // Soil
        const soilGeometry = new THREE.CylinderGeometry(0.075, 0.085, 0.025, 18);
        const soilMaterial = new THREE.MeshStandardMaterial({ color: 0x6B4F27, roughness: 0.9, emissive: 0x222222 });
        const soil = new THREE.Mesh(soilGeometry, soilMaterial);
        soil.position.y = 0.12;
        group.add(soil);
        // Curved stem
        const stemCurve = new THREE.CatmullRomCurve3([
            new THREE.Vector3(0, 0.13, 0),
            new THREE.Vector3(0.01, 0.19, 0.01),
            new THREE.Vector3(-0.01, 0.25, 0.01),
            new THREE.Vector3(0, 0.31, 0)
        ]);
        const stemPoints = stemCurve.getPoints(20);
        const stemGeometry = new THREE.TubeGeometry(stemCurve, 20, 0.012, 8, false);
        const stemMaterial = new THREE.MeshStandardMaterial({ color: 0x3A7D3B, roughness: 0.5, emissive: 0x222222 });
        const stem = new THREE.Mesh(stemGeometry, stemMaterial);
        group.add(stem);
        // Leaves (two, on the stem)
        const leafShape = new THREE.Shape();
        leafShape.moveTo(0, 0);
        leafShape.quadraticCurveTo(0.04, 0.03, 0, 0.09);
        leafShape.quadraticCurveTo(-0.04, 0.03, 0, 0);
        const leafGeometry = new THREE.ExtrudeGeometry(leafShape, { depth: 0.005, bevelEnabled: false });
        const leafMaterial = new THREE.MeshStandardMaterial({ color: 0x4CAF50, roughness: 0.6, emissive: 0x222222 });
        const leaf1 = new THREE.Mesh(leafGeometry, leafMaterial);
        leaf1.position.set(0.012, 0.19, 0.012);
        leaf1.rotation.set(Math.PI / 2, 0.2, 0.5);
        group.add(leaf1);
        const leaf2 = new THREE.Mesh(leafGeometry, leafMaterial);
        leaf2.position.set(-0.012, 0.23, -0.012);
        leaf2.rotation.set(Math.PI / 2, -0.2, -0.5);
        group.add(leaf2);
        // Simple cartoon flower head (petals)
        const petalColor = config.flowerColor || 0xFFD1DC; // soft pink
        const petalMaterial = new THREE.MeshStandardMaterial({ color: petalColor, roughness: 0.4, emissive: 0x222222 });
        const numPetals = 8;
        const petalRadius = 0.025;
        const petalDistance = 0.055;
        for (let i = 0; i < numPetals; i++) {
            const angle = (i / numPetals) * Math.PI * 2;
            const petalGeometry = new THREE.CircleGeometry(petalRadius, 16);
            const petal = new THREE.Mesh(petalGeometry, petalMaterial);
            petal.position.set(Math.cos(angle) * petalDistance, 0.36, Math.sin(angle) * petalDistance);
            petal.scale.set(1, 1.8, 1); // oval shape
            petal.rotation.x = -Math.PI / 2;
            group.add(petal);
        }
        // Simple flower center (sphere)
        const centerGeometry = new THREE.SphereGeometry(0.028, 18, 18);
        const centerMaterial = new THREE.MeshStandardMaterial({ color: 0xFFE066, roughness: 0.3, emissive: 0x222222 });
        const center = new THREE.Mesh(centerGeometry, centerMaterial);
        center.position.y = 0.36;
        group.add(center);
        return group;
    }
} 