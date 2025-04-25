import * as THREE from 'three';
import { FOOD_TYPES } from './food.js';

const BOWL_CONFIG = {
    size: {
        radius: 0.2,
        height: 0.08,
        thickness: 0.02
    },
    color: 0x808080, // Gray metallic color
    position: {
        heightOffset: 0.02, // Slight offset from ground
        wallOffset: 0.3    // Distance from wall
    },
    highlight: {
        color: 0x00FF00,   // Green highlight for available bowl
        pulseSpeed: 2.0,   // Speed of highlight pulse
        range: 1.0         // How close player needs to be to interact
    },
    food: {
        fillHeight: 0.04,  // Height of the food content
        fillRadius: 0.16   // Radius of the food content (slightly smaller than bowl)
    }
};

export class Bowl {
    constructor(position) {
        this.position = position;
        this.currentFood = null;
        this.isHighlighted = false;
        
        // Create materials
        this.materials = {
            normal: new THREE.MeshStandardMaterial({
                color: BOWL_CONFIG.color,
                metalness: 0.7,
                roughness: 0.3
            }),
            highlight: new THREE.MeshStandardMaterial({
                color: BOWL_CONFIG.highlight.color,
                metalness: 0.7,
                roughness: 0.3,
                transparent: true,
                opacity: 0.5
            })
        };
        
        this.createModel();
    }

    createModel() {
        this.model = new THREE.Group();
        this.model.name = 'food_bowl';
        
        // Create bottom part of the bowl
        const bottomGeometry = new THREE.CylinderGeometry(
            BOWL_CONFIG.size.radius * 0.8,  // Top radius slightly smaller
            BOWL_CONFIG.size.radius,        // Bottom radius
            BOWL_CONFIG.size.height * 0.2,  // Height of bottom
            32  // Segments
        );
        const bottom = new THREE.Mesh(bottomGeometry, this.materials.normal);
        bottom.position.y = BOWL_CONFIG.size.height * 0.1;  // Half of bottom height
        
        // Create walls of the bowl
        const wallsGeometry = new THREE.CylinderGeometry(
            BOWL_CONFIG.size.radius * 1.2,  // Top radius larger for bowl shape
            BOWL_CONFIG.size.radius * 0.8,  // Bottom radius matches top of bottom part
            BOWL_CONFIG.size.height * 0.8,  // Main height of bowl
            32,  // Segments
            1,   // Height segments
            true // Open ended
        );
        const walls = new THREE.Mesh(wallsGeometry, this.materials.normal);
        walls.position.y = BOWL_CONFIG.size.height * 0.5;  // Center of height
        
        // Create rim of the bowl
        const rimGeometry = new THREE.TorusGeometry(
            BOWL_CONFIG.size.radius * 1.2,  // Radius matches top of walls
            BOWL_CONFIG.size.height * 0.05, // Thickness of rim
            16,  // Tube segments
            32   // Radial segments
        );
        const rim = new THREE.Mesh(rimGeometry, this.materials.normal);
        rim.position.y = BOWL_CONFIG.size.height * 0.9;  // Place at top of walls
        rim.rotation.x = Math.PI / 2;  // Rotate to horizontal position
        
        // Create food content mesh (initially invisible)
        const foodGeometry = new THREE.CylinderGeometry(
            BOWL_CONFIG.food.fillRadius,
            BOWL_CONFIG.food.fillRadius,
            BOWL_CONFIG.food.fillHeight,
            32
        );
        this.foodContent = new THREE.Mesh(foodGeometry, new THREE.MeshStandardMaterial({
            visible: false
        }));
        this.foodContent.position.y = BOWL_CONFIG.size.height * 0.3; // Position at bottom of bowl
        
        // Add all parts to the group
        this.model.add(bottom);
        this.model.add(walls);
        this.model.add(rim);
        this.model.add(this.foodContent);
        
        // Setup shadows
        this.model.traverse(child => {
            if (child instanceof THREE.Mesh) {
                child.castShadow = true;
                child.receiveShadow = true;
            }
        });
        
        // Position the group
        this.model.position.copy(this.position);
        
        // Store reference to this instance
        this.model.userData.bowlInstance = this;
    }

    setHighlight(enabled) {
        if (this.isHighlighted === enabled) return;
        this.isHighlighted = enabled;
        
        const material = enabled ? this.materials.highlight : this.materials.normal;
        this.model.traverse((object) => {
            if (object.isMesh && object !== this.foodContent) {
                object.material = material;
            }
        });
    }

    updateHighlight(deltaTime) {
        if (this.isHighlighted) {
            // Create a pulsing effect
            const pulse = (Math.sin(Date.now() * 0.003 * BOWL_CONFIG.highlight.pulseSpeed) + 1) / 2;
            this.materials.highlight.opacity = 0.3 + pulse * 0.2;
        }
    }

    addFood(food) {
        if (this.currentFood || !food) return false;
        
        // Hide the original food model
        food.model.visible = false;
        
        // Show and update the food content in bowl
        this.foodContent.material = new THREE.MeshStandardMaterial({
            color: FOOD_TYPES[food.type].color.content,
            metalness: 0.1,
            roughness: 0.8,
            visible: true
        });
        
        this.currentFood = food;
        this.setHighlight(false);
        return true;
    }

    removeFood() {
        if (!this.currentFood) return null;
        
        // Hide the food content
        this.foodContent.material.visible = false;
        
        const food = this.currentFood;
        this.currentFood = null;
        return food;
    }

    hasFood() {
        return this.currentFood !== null && !this.currentFood.isConsumed;
    }

    canAcceptFood() {
        return !this.currentFood;
    }

    static canInteract(playerPosition, bowlPosition) {
        const distance = playerPosition.distanceTo(bowlPosition);
        return distance <= BOWL_CONFIG.highlight.range;
    }

    static generateRandomPosition(roomWidth, roomLength) {
        const margin = 0.5;
        const wallOffset = BOWL_CONFIG.position.wallOffset;
        
        // Randomly choose which wall to place the bowl against
        const alongBack = Math.random() < 0.7; // 70% chance to be along back wall
        
        let x, z;
        
        if (alongBack) {
            // Place along back wall
            x = (Math.random() * (roomWidth - 2 * margin)) - (roomWidth/2 - margin);
            z = -roomLength/2 + wallOffset;
        } else {
            // Place along side walls
            x = Math.random() < 0.5 ? 
                -roomWidth/2 + wallOffset : // Left wall
                roomWidth/2 - wallOffset;   // Right wall
            z = (Math.random() * (roomLength - 2 * margin)) - (roomLength/2 - margin);
        }
        
        return new THREE.Vector3(x, 0, z);
    }
} 