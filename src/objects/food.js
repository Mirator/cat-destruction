import * as THREE from 'three';
import { Highlightable } from './Highlightable.js';

export const FOOD_TYPES = {
    BASIC: {
        name: 'Basic Cat Food',
        color: {
            package: 0x8B4513,  // Brown package
            content: 0xCD853F   // Lighter brown content
        },
        nutrition: 30,
        model: {
            width: 0.15,
            height: 0.1,
            depth: 0.15
        }
    },
    PREMIUM: {
        name: 'Premium Cat Food',
        color: {
            package: 0xFFD700,  // Gold package
            content: 0xFFA500   // Orange content
        },
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

export class Food extends Highlightable {
    constructor(type, position) {
        const config = FOOD_TYPES[type];
        const geometry = new THREE.BoxGeometry(
            config.model.width,
            config.model.height,
            config.model.depth
        );
        const material = new THREE.MeshStandardMaterial({
            color: config.color.package,
            flatShading: true
        });
        const model = new THREE.Mesh(geometry, material);
        model.position.copy(position);
        model.name = `food_${type.toLowerCase()}`;
        model.castShadow = true;
        model.receiveShadow = true;
        model.userData.foodInstance = null; // Set after super
        super(model);
        this.type = type;
        this.position = position.clone();
        this.isConsumed = false;
        this.isPickedUp = false;
        this.model.userData.foodInstance = this;
        // Add a small random rotation for variety
        this.model.rotation.y = Math.random() * Math.PI;
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
