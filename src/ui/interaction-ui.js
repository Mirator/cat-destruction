import * as THREE from 'three';

export class InteractionUI {
    constructor() {
        this.createPromptElement();
        this.createDistanceDisplay();
    }

    createPromptElement() {
        // Create prompt container
        this.promptElement = document.createElement('div');
        this.promptElement.style.position = 'fixed';
        this.promptElement.style.bottom = '20%';
        this.promptElement.style.left = '50%';
        this.promptElement.style.transform = 'translateX(-50%)';
        this.promptElement.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
        this.promptElement.style.color = 'white';
        this.promptElement.style.padding = '10px 20px';
        this.promptElement.style.borderRadius = '5px';
        this.promptElement.style.fontFamily = 'Arial, sans-serif';
        this.promptElement.style.fontSize = '18px';
        this.promptElement.style.textAlign = 'center';
        this.promptElement.style.zIndex = '1000';
        this.promptElement.style.display = 'none';
        
        // Add to document
        document.body.appendChild(this.promptElement);
    }

    createDistanceDisplay() {
        this.distanceElement = document.createElement('div');
        this.distanceElement.style.position = 'fixed';
        this.distanceElement.style.bottom = '20px';
        this.distanceElement.style.left = '20px';
        this.distanceElement.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
        this.distanceElement.style.color = 'white';
        this.distanceElement.style.padding = '5px 10px';
        this.distanceElement.style.borderRadius = '5px';
        this.distanceElement.style.fontFamily = 'monospace';
        this.distanceElement.style.fontSize = '14px';
        this.distanceElement.style.zIndex = '1000';
        document.body.appendChild(this.distanceElement);
    }

    showPrompt(text) {
        this.promptElement.textContent = text;
        this.promptElement.style.display = 'block';
    }

    hidePrompt() {
        this.promptElement.style.display = 'none';
    }

    updateDistance(camera, foodItems) {
        if (!camera || !foodItems.length) {
            this.distanceElement.style.display = 'none';
            return;
        }

        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(new THREE.Vector2(0, 0), camera);
        
        let closestDistance = Infinity;
        let closestName = '';
        
        for (const food of foodItems) {
            if (food.isConsumed || food.isPickedUp) continue;
            
            const intersects = raycaster.intersectObject(food.model, true);
            if (intersects.length > 0) {
                const distance = intersects[0].distance;
                if (distance < closestDistance) {
                    closestDistance = distance;
                    closestName = food.getName();
                }
            }
        }

        if (closestDistance === Infinity) {
            this.distanceElement.style.display = 'none';
        } else {
            this.distanceElement.style.display = 'block';
            this.distanceElement.textContent = `Distance to ${closestName}: ${closestDistance.toFixed(2)}m`;
        }
    }

    updateInteractionPrompt(nearestFood, nearestBowl, isCarryingFood) {
        if (isCarryingFood) {
            if (nearestBowl) {
                this.showPrompt('Press [E] to place food in bowl');
            } else {
                this.showPrompt('Press [E] to drop food');
            }
        } else if (nearestFood) {
            this.showPrompt(`Press [E] to pick up ${nearestFood.getName()}`);
        } else {
            this.hidePrompt();
        }
    }
} 