import * as THREE from 'three';
import { FOOD_TYPES } from './food.js';

const BOWL_CONFIG = {
    size: {
        radius: 0.2,
        height: 0.08
    },
    color: 0x808080, // Gray metallic color
    position: {
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
    },
    materials: {
        metalness: 0.7,
        roughness: 0.3
    }
};

export class Bowl {
    constructor(position) {
        this.position = position;
        this.currentFood = null;
        this.isHighlighted = false;
        this.cats = new Set(); // Store references to cats in the scene
        this.createMaterials();
        this.createModel();
    }

    createMaterials() {
        this.materials = {
            normal: new THREE.MeshStandardMaterial({
                color: BOWL_CONFIG.color,
                metalness: BOWL_CONFIG.materials.metalness,
                roughness: BOWL_CONFIG.materials.roughness
            }),
            highlight: new THREE.MeshStandardMaterial({
                color: BOWL_CONFIG.highlight.color,
                metalness: BOWL_CONFIG.materials.metalness,
                roughness: BOWL_CONFIG.materials.roughness,
                transparent: true,
                opacity: 0.5
            })
        };
    }

    createModel() {
        this.model = new THREE.Group();
        this.model.name = 'food_bowl';
        
        // Create bottom part of the bowl
        const bottom = this.createBottomPart();
        
        // Create walls of the bowl
        const walls = this.createWalls();
        
        // Create rim of the bowl
        const rim = this.createRim();
        
        // Create food content mesh (initially invisible)
        this.foodContent = this.createFoodContent();
        
        // Add all parts to the group
        this.model.add(bottom, walls, rim, this.foodContent);
        
        // Setup shadows
        this.setupShadows();
        
        // Position the group
        this.model.position.copy(this.position);
        
        // Store reference to this instance
        this.model.userData.bowlInstance = this;
    }

    createBottomPart() {
        const geometry = new THREE.CylinderGeometry(
            BOWL_CONFIG.size.radius * 0.8,
            BOWL_CONFIG.size.radius,
            BOWL_CONFIG.size.height * 0.2,
            32
        );
        const bottom = new THREE.Mesh(geometry, this.materials.normal);
        bottom.position.y = BOWL_CONFIG.size.height * 0.1;
        return bottom;
    }

    createWalls() {
        const geometry = new THREE.CylinderGeometry(
            BOWL_CONFIG.size.radius * 1.2,
            BOWL_CONFIG.size.radius * 0.8,
            BOWL_CONFIG.size.height * 0.8,
            32,
            1,
            true
        );
        const walls = new THREE.Mesh(geometry, this.materials.normal);
        walls.position.y = BOWL_CONFIG.size.height * 0.5;
        return walls;
    }

    createRim() {
        const geometry = new THREE.TorusGeometry(
            BOWL_CONFIG.size.radius * 1.2,
            BOWL_CONFIG.size.height * 0.05,
            16,
            32
        );
        const rim = new THREE.Mesh(geometry, this.materials.normal);
        rim.position.y = BOWL_CONFIG.size.height * 0.9;
        rim.rotation.x = Math.PI / 2;
        return rim;
    }

    createFoodContent() {
        const geometry = new THREE.CylinderGeometry(
            BOWL_CONFIG.food.fillRadius,
            BOWL_CONFIG.food.fillRadius,
            BOWL_CONFIG.food.fillHeight,
            32
        );
        const mesh = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({
            visible: false
        }));
        mesh.position.y = BOWL_CONFIG.size.height * 0.3;
        return mesh;
    }

    setupShadows() {
        this.model.traverse(child => {
            if (child instanceof THREE.Mesh) {
                child.castShadow = true;
                child.receiveShadow = true;
            }
        });
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
            const pulse = (Math.sin(Date.now() * 0.003 * BOWL_CONFIG.highlight.pulseSpeed) + 1) / 2;
            this.materials.highlight.opacity = 0.3 + pulse * 0.2;
        }
    }

    addFood(food) {
        if (this.currentFood || !food) return false;
        
        food.model.visible = false;
        this.foodContent.material = new THREE.MeshStandardMaterial({
            color: FOOD_TYPES[food.type].color.content,
            metalness: 0.1,
            roughness: 0.8,
            visible: true
        });
        
        this.currentFood = food;
        this.setHighlight(false);

        // Notify all cats in the scene about the food
        this.cats.forEach(cat => cat.notifyFoodAdded(this));
        
        return true;
    }

    removeFood() {
        if (!this.currentFood) return null;
        
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
        return playerPosition.distanceTo(bowlPosition) <= BOWL_CONFIG.highlight.range;
    }

    static generateRandomPosition(roomWidth, roomLength) {
        const margin = 0.5;
        const wallOffset = BOWL_CONFIG.position.wallOffset;
        const alongBack = Math.random() < 0.7;
        
        let x, z;
        if (alongBack) {
            x = (Math.random() * (roomWidth - 2 * margin)) - (roomWidth/2 - margin);
            z = -roomLength/2 + wallOffset;
        } else {
            x = Math.random() < 0.5 ? -roomWidth/2 + wallOffset : roomWidth/2 - wallOffset;
            z = (Math.random() * (roomLength - 2 * margin)) - (roomLength/2 - margin);
        }
        
        return new THREE.Vector3(x, 0, z);
    }

    registerCat(cat) {
        this.cats.add(cat);
    }

    unregisterCat(cat) {
        this.cats.delete(cat);
    }
} 