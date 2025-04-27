import * as THREE from 'three';
import { Highlightable } from '../props/Highlightable.js';
import { FOOD_CONFIG } from '../../config/GameConfig.js';

export const INTERACTION_CONFIG = {
    pickupRange: 1.65,     // Maximum distance for pickup (increased by 50% from 1.1 meters)
    hoverHeight: 1.0,     // Height when being carried (at eye level)
    carryOffset: 1.0,     // Forward offset when being carried (1 meter in front)
    highlightColor: 0xFFFFFF,  // Color for interaction highlight
    pulseSpeed: 2.0      // Speed of highlight pulse
};

export class Food extends Highlightable {
    constructor(type, position) {
        const config = FOOD_CONFIG.types[type];
        // Can dimensions
        const radius = config.model.width / 2;
        const height = config.model.height;
        // Can body (label)
        const bodyGeometry = new THREE.CylinderGeometry(radius, radius, height, 32, 1, true);
        // Create a canvas label texture
        const labelCanvas = document.createElement('canvas');
        labelCanvas.width = 128; labelCanvas.height = 64;
        const ctx = labelCanvas.getContext('2d');
        ctx.fillStyle = '#fff';
        ctx.fillRect(0, 0, 128, 64);
        ctx.fillStyle = '#333';
        ctx.fillRect(0, 0, 128, 20);
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 18px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(config.name, 64, 32);
        ctx.fillStyle = '#333';
        ctx.fillRect(0, 44, 128, 20);
        // Draw cat face function
        function drawCatFace(ctx, x, y, size) {
            ctx.save();
            // Head (with black border)
            ctx.beginPath();
            ctx.arc(x, y, size, 0, Math.PI * 2);
            ctx.strokeStyle = '#222';
            ctx.lineWidth = 3;
            ctx.stroke();
            ctx.fillStyle = '#f6b26b'; // orange cat face
            ctx.fill();
            // Ears (with black border)
            ctx.beginPath();
            ctx.moveTo(x - size * 0.7, y - size * 0.2);
            ctx.lineTo(x - size * 0.4, y - size * 0.9);
            ctx.lineTo(x - size * 0.1, y - size * 0.2);
            ctx.closePath();
            ctx.strokeStyle = '#222';
            ctx.lineWidth = 3;
            ctx.stroke();
            ctx.fillStyle = '#f6b26b';
            ctx.fill();
            ctx.beginPath();
            ctx.moveTo(x + size * 0.7, y - size * 0.2);
            ctx.lineTo(x + size * 0.4, y - size * 0.9);
            ctx.lineTo(x + size * 0.1, y - size * 0.2);
            ctx.closePath();
            ctx.strokeStyle = '#222';
            ctx.lineWidth = 3;
            ctx.stroke();
            ctx.fillStyle = '#f6b26b';
            ctx.fill();
            // Eyes
            ctx.beginPath();
            ctx.arc(x - size * 0.25, y, size * 0.13, 0, Math.PI * 2);
            ctx.arc(x + size * 0.25, y, size * 0.13, 0, Math.PI * 2);
            ctx.fillStyle = '#222';
            ctx.fill();
            // Nose
            ctx.beginPath();
            ctx.arc(x, y + size * 0.18, size * 0.09, 0, Math.PI * 2);
            ctx.fillStyle = '#d28b5b';
            ctx.fill();
            // Whiskers
            ctx.strokeStyle = '#a67c52';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(x - size * 0.5, y + size * 0.18);
            ctx.lineTo(x - size * 0.9, y + size * 0.18);
            ctx.moveTo(x + size * 0.5, y + size * 0.18);
            ctx.lineTo(x + size * 0.9, y + size * 0.18);
            ctx.stroke();
            ctx.restore();
        }
        // Draw cat faces on both sides
        drawCatFace(ctx, 32, 32, 18);
        drawCatFace(ctx, 96, 32, 18);
        const labelTexture = new THREE.CanvasTexture(labelCanvas);
        labelTexture.wrapS = THREE.RepeatWrapping;
        labelTexture.repeat.x = 1.0;
        const bodyMaterial = new THREE.MeshStandardMaterial({
            color: config.color.package,
            map: labelTexture,
            metalness: 0.4,
            roughness: 0.3,
            side: THREE.DoubleSide
        });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        // Can top
        const topGeometry = new THREE.CircleGeometry(radius, 32);
        const topMaterial = new THREE.MeshStandardMaterial({
            color: 0xcccccc,
            metalness: 0.8,
            roughness: 0.2
        });
        const top = new THREE.Mesh(topGeometry, topMaterial);
        top.position.y = height / 2 + 0.001;
        top.rotation.x = -Math.PI / 2;
        // Can bottom
        const bottom = new THREE.Mesh(topGeometry, topMaterial);
        bottom.position.y = -height / 2 - 0.001;
        bottom.rotation.x = Math.PI / 2;
        // Group all parts
        const group = new THREE.Group();
        group.add(body);
        group.add(top);
        group.add(bottom);
        group.position.copy(position);
        group.name = `food_${type.toLowerCase()}`;
        group.castShadow = true;
        group.receiveShadow = true;
        super(group);
        this.type = type;
        this.position = position.clone();
        this.isConsumed = false;
        this.isPickedUp = false;
        this.model.userData.foodInstance = this;
        // No random rotation for cans
        this.model.rotation.set(0, 0, 0);
    }

    consume() {
        if (this.isConsumed || this.isPickedUp) return 0;
        
        this.isConsumed = true;
        const nutrition = FOOD_CONFIG.types[this.type].nutrition;
        
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
        const type = Math.random() < 0.7 ? 'FISH' : 'CHICKEN';
        
        return new Food(type, new THREE.Vector3(x, y, z));
    }

    static scene = null;

    static setScene(scene) {
        this.scene = scene;
    }

    static isLookingAt(camera, foodObject) {
        if (!this.scene) {
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

        let closestFood = null;
        let closestDistance = Infinity;
        for (const food of foods) {
            if (food.isConsumed) continue;
            if (food.isPickedUp) continue;
            if (!food.model.visible) continue;
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
        return FOOD_CONFIG.types[this.type].name;
    }
}
