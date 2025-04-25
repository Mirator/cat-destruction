import * as THREE from 'three';

export const FOOD_TYPES = {
    BASIC: {
        name: 'Basic Cat Food',
        color: 0x8B4513,
        nutrition: 30,
        model: {
            width: 0.15,
            height: 0.1,
            depth: 0.15
        }
    },
    PREMIUM: {
        name: 'Premium Cat Food',
        color: 0xFFD700,
        nutrition: 50,
        model: {
            width: 0.15,
            height: 0.12,
            depth: 0.15
        }
    }
};

export const INTERACTION_CONFIG = {
    pickupRange: 0.7,     // Maximum distance for pickup (0.6 meters)
    hoverHeight: 1.0,     // Height when being carried (at eye level)
    carryOffset: 1.0,     // Forward offset when being carried (1 meter in front)
    highlightColor: 0xFFFFFF,  // Color for interaction highlight
    pulseSpeed: 2.0      // Speed of highlight pulse
};

export class Food {
    constructor(type, position) {
        this.type = type;
        this.position = position.clone();
        this.isConsumed = false;
        this.isPickedUp = false;
        
        this.createModel();
        this.createHighlight();
        this.isHighlighted = false;
    }

    createModel() {
        const config = FOOD_TYPES[this.type];
        const geometry = new THREE.BoxGeometry(
            config.model.width,
            config.model.height,
            config.model.depth
        );
        
        this.originalMaterial = new THREE.MeshStandardMaterial({
            color: config.color,
            flatShading: true
        });

        this.model = new THREE.Mesh(geometry, this.originalMaterial);
        this.model.position.copy(this.position);
        this.model.name = `food_${this.type.toLowerCase()}`;
        
        // Add a small random rotation for variety
        this.model.rotation.y = Math.random() * Math.PI;
        
        // Setup shadows
        this.model.castShadow = true;
        this.model.receiveShadow = true;
        
        // Store reference to this instance
        this.model.userData.foodInstance = this;
    }

    createHighlight() {
        // Create highlight material with stronger emissive effect
        this.highlightMaterial = new THREE.MeshStandardMaterial({
            color: INTERACTION_CONFIG.highlightColor,
            emissive: INTERACTION_CONFIG.highlightColor,
            emissiveIntensity: 1.0,
            transparent: true,
            opacity: 0.8
        });
        this.isHighlighted = false;
        this.pulseTime = 0;
    }

    setHighlight(enabled) {
        if (this.isHighlighted === enabled) return;
        
        this.isHighlighted = enabled;
        this.pulseTime = 0;
        
        if (!this.model || !this.originalMaterial || !this.highlightMaterial) {
            console.warn('Materials not properly initialized');
            return;
        }

        this.model.material = enabled ? this.highlightMaterial : this.originalMaterial;
    }

    updateHighlight(deltaTime = 1/60) {
        if (!this.isHighlighted || !this.highlightMaterial) return;

        this.pulseTime += deltaTime * INTERACTION_CONFIG.pulseSpeed;
        const pulse = (Math.sin(this.pulseTime * Math.PI * 2) + 1) / 2;
        
        this.highlightMaterial.opacity = 0.6 + pulse * 0.4;
        this.highlightMaterial.emissiveIntensity = 0.8 + pulse * 0.4;
    }

    consume() {
        if (this.isConsumed || this.isPickedUp) return 0;
        
        this.isConsumed = true;
        const nutrition = FOOD_TYPES[this.type].nutrition;
        
        // Make the food invisible when consumed
        this.model.visible = false;
        
        return nutrition;
    }

    pickup() {
        if (this.isConsumed || this.isPickedUp) return false;
        this.isPickedUp = true;
        this.setHighlight(false);
        return true;
    }

    drop(position) {
        if (!this.isPickedUp) return false;
        this.isPickedUp = false;
        this.position.copy(position);
        this.model.position.copy(position);
        // Add a small random rotation when dropped
        this.model.rotation.y = Math.random() * Math.PI;
        return true;
    }

    updateCarriedPosition(playerPosition, playerRotation) {
        if (!this.isPickedUp) return;
        
        // Calculate forward direction from player's rotation
        const forward = new THREE.Vector3(0, 0, -1);
        forward.applyEuler(playerRotation);
        forward.normalize();
        
        // Calculate the carry position
        const carryPosition = playerPosition.clone();
        carryPosition.y = playerPosition.y - 0.5 + INTERACTION_CONFIG.hoverHeight; // Adjust for player height
        
        // Add forward offset
        carryPosition.add(forward.multiplyScalar(INTERACTION_CONFIG.carryOffset));
        
        // Update both the food and model position
        this.position.copy(carryPosition);
        this.model.position.copy(carryPosition);
        
        // Make food face the same direction as player
        this.model.rotation.y = playerRotation.y;
    }

    static generateRandomFood(shelfPosition, shelfWidth) {
        // Random position on the shelf
        const x = shelfPosition.x + (Math.random() * shelfWidth - shelfWidth/2);
        const y = shelfPosition.y;
        const z = shelfPosition.z + 0.1; // Slightly forward on the shelf
        
        // Random food type
        const type = Math.random() < 0.7 ? 'BASIC' : 'PREMIUM';
        
        return new Food(type, new THREE.Vector3(x, y, z));
    }

    static scene = null;

    static setScene(scene) {
        this.scene = scene;
    }

    static isLookingAt(camera, foodObject) {
        if (!this.scene) {
            console.warn('Scene not set for Food class. Call Food.setScene(scene) first.');
            return false;
        }

        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(new THREE.Vector2(0, 0), camera);
        
        const intersects = raycaster.intersectObject(foodObject, true);
        if (intersects.length === 0) return false;
        
        // Use the intersection distance for consistency
        return intersects[0].distance <= INTERACTION_CONFIG.pickupRange;
    }

    static canPickup(camera, foodObject) {
        return Food.isLookingAt(camera, foodObject);
    }

    static findBestTargetFood(camera, foods) {
        if (!this.scene) return null;

        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(new THREE.Vector2(0, 0), camera);
        
        // Find the closest food we can pick up
        let closestFood = null;
        let closestDistance = Infinity;

        for (const food of foods) {
            if (food.isConsumed || food.isPickedUp) continue;
            
            const intersects = raycaster.intersectObject(food.model, true);
            if (intersects.length > 0 && intersects[0].distance <= INTERACTION_CONFIG.pickupRange) {
                if (intersects[0].distance < closestDistance) {
                    closestDistance = intersects[0].distance;
                    closestFood = food;
                }
            }
        }

        return closestFood;
    }

    getName() {
        return FOOD_TYPES[this.type].name;
    }
}
