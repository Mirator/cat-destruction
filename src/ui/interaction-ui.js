import * as THREE from 'three';

export class InteractionUI {
    constructor() {
        this.createPromptElement();
        this.createDistanceDisplay();
        this.createHelpTipElement();
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

    createHelpTipElement() {
        this.helpTipElement = document.createElement('div');
        this.helpTipElement.style.position = 'fixed';
        this.helpTipElement.style.top = '7%';
        this.helpTipElement.style.left = '50%';
        this.helpTipElement.style.transform = 'translateX(-50%)';
        this.helpTipElement.style.backgroundColor = 'rgba(255, 255, 210, 0.98)';
        this.helpTipElement.style.color = '#2d2d1a';
        this.helpTipElement.style.padding = '14px 32px';
        this.helpTipElement.style.borderRadius = '16px';
        this.helpTipElement.style.boxShadow = '0 2px 18px rgba(120,80,40,0.13)';
        this.helpTipElement.style.fontFamily = '"Quicksand", "Segoe UI", Arial, sans-serif';
        this.helpTipElement.style.fontSize = '22px';
        this.helpTipElement.style.textAlign = 'center';
        this.helpTipElement.style.zIndex = '100001';
        this.helpTipElement.style.display = 'none';
        this.helpTipElement.style.transition = 'opacity 0.5s, box-shadow 0.5s';
        document.body.appendChild(this.helpTipElement);
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

    updateInteractionPrompt(nearestFood, nearestBowl, isCarryingFood, nearestProp, nearestPhone) {
        if (isCarryingFood) {
            if (nearestBowl) {
                this.showPrompt('Press [E] to fill the bowl');
            } else {
                this.hidePrompt();
            }
        } else if (nearestPhone) {
            this.showPrompt('Press [E] to use the phone');
        } else if (nearestFood) {
            this.showPrompt(`Press [E] to pick up ${nearestFood.getName()}`);
        } else if (nearestProp && nearestProp.isKnockedOver) {
            this.showPrompt('Press [E] to fix');
        } else {
            this.hidePrompt();
        }
    }

    showHelpTip(text) {
        this.helpTipElement.textContent = text;
        this.helpTipElement.style.display = 'block';
    }

    hideHelpTip() {
        this.helpTipElement.style.display = 'none';
    }
} 