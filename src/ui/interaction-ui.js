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
        this.promptElement.style.backgroundColor = 'rgba(255, 236, 210, 0.95)';
        this.promptElement.style.color = '#6d4c2c';
        this.promptElement.style.padding = '10px 20px';
        this.promptElement.style.borderRadius = '12px';
        this.promptElement.style.boxShadow = '0 2px 12px rgba(120,80,40,0.10)';
        this.promptElement.style.fontFamily = '"Quicksand", "Segoe UI", Arial, sans-serif';
        this.promptElement.style.fontSize = '18px';
        this.promptElement.style.textAlign = 'center';
        this.promptElement.style.zIndex = '99999';
        this.promptElement.style.display = 'none';
        this.promptElement.style.transition = 'opacity 0.5s, box-shadow 0.5s';
        
        // Add to document
        document.body.appendChild(this.promptElement);
    }

    createDistanceDisplay() {
        this.distanceElement = document.createElement('div');
        this.distanceElement.style.position = 'fixed';
        this.distanceElement.style.bottom = '20px';
        this.distanceElement.style.left = '20px';
        this.distanceElement.style.backgroundColor = 'rgba(255, 236, 210, 0.95)';
        this.distanceElement.style.color = '#6d4c2c';
        this.distanceElement.style.padding = '5px 10px';
        this.distanceElement.style.borderRadius = '12px';
        this.distanceElement.style.boxShadow = '0 2px 12px rgba(120,80,40,0.10)';
        this.distanceElement.style.fontFamily = 'monospace, "Quicksand", "Segoe UI", Arial, sans-serif';
        this.distanceElement.style.fontSize = '14px';
        this.distanceElement.style.zIndex = '1000';
        this.distanceElement.style.transition = 'opacity 0.5s, box-shadow 0.5s';
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

    updateInteractionPrompt(nearestFood, nearestBowl, isCarryingFood, nearestProp) {
        if (isCarryingFood) {
            if (nearestBowl) {
                this.showPrompt('Press [E] to fill the bowl');
            } else {
                this.showPrompt('Press [E] to drop food');
            }
        } else if (nearestFood) {
            this.showPrompt(`Press [E] to pick up ${nearestFood.getName()}`);
        } else if (nearestProp && nearestProp.isKnockedOver) {
            this.showPrompt('Press [E] to fix');
        } else {
            this.hidePrompt();
        }
    }
} 