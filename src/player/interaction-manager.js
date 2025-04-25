import { InteractionUI } from '../ui/interaction-ui.js';
import { Food } from '../objects/food.js';
import { Bowl } from '../objects/bowl.js';

export class InteractionManager {
    constructor(scene, player) {
        this.scene = scene;
        this.player = player;
        this.ui = new InteractionUI();
        this.carriedFood = null;
        this.foodItems = [];
        this.bowls = [];

        // Initial collection of objects
        this.collectObjects();
        
        // Listen for keyboard events
        document.addEventListener('keydown', (e) => this.handleKeyPress(e));
    }

    collectObjects() {
        this.foodItems = [];
        this.bowls = [];
        
        this.scene.traverse((object) => {
            if (object.userData && object.userData.foodInstance) {
                this.foodItems.push(object.userData.foodInstance);
            }
            if (object.userData && object.userData.bowlInstance) {
                this.bowls.push(object.userData.bowlInstance);
            }
        });

        console.log('Found food items:', this.foodItems.length);
    }

    update(deltaTime) {
        if (!this.player?.camera) return;

        // Update carried food position
        if (this.carriedFood) {
            this.carriedFood.updateCarriedPosition(
                this.player.camera.position,
                this.player.camera.rotation
            );
        }

        // Find nearest interactable food
        const nearestFood = !this.carriedFood ? 
            Food.findBestTargetFood(this.player.camera, this.foodItems) : 
            null;

        // Find nearest bowl
        let nearestBowl = null;
        if (this.carriedFood) {
            for (const bowl of this.bowls) {
                if (bowl.canAcceptFood() && 
                    Bowl.canInteract(this.player.camera.position, bowl.position)) {
                    nearestBowl = bowl;
                    break;
                }
            }
        }

        // Update food highlights
        this.foodItems.forEach(food => {
            if (!food.isConsumed && !food.isPickedUp) {
                const canPickup = Food.canPickup(this.player.camera, food.model);
                food.setHighlight(canPickup);
                if (food.isHighlighted) {
                    food.updateHighlight(deltaTime);
                }
            }
        });

        // Update bowl highlights
        this.bowls.forEach(bowl => {
            bowl.setHighlight(bowl === nearestBowl);
            if (bowl.isHighlighted) {
                bowl.updateHighlight(deltaTime);
            }
        });

        // Update UI
        this.ui.updateInteractionPrompt(nearestFood, nearestBowl, this.carriedFood !== null);
        this.ui.updateDistance(this.player.camera, this.foodItems);
    }

    handleKeyPress(event) {
        if (event.key.toLowerCase() !== 'e' || !this.player?.camera) return;

        if (this.carriedFood) {
            // Try to place in nearest bowl
            let placed = false;
            for (const bowl of this.bowls) {
                if (bowl.canAcceptFood() && 
                    Bowl.canInteract(this.player.camera.position, bowl.position)) {
                    placed = bowl.addFood(this.carriedFood);
                    if (placed) break;
                }
            }

            // If not placed in bowl, drop on ground
            if (!placed) {
                const dropPos = this.player.camera.position.clone();
                dropPos.y = 0;
                this.carriedFood.drop(dropPos);
            }
            
            this.carriedFood = null;
        } else {
            // Try to pick up nearest food
            const nearestFood = Food.findBestTargetFood(this.player.camera, this.foodItems);

            if (nearestFood && !nearestFood.isConsumed && !nearestFood.isPickedUp) {
                if (nearestFood.pickup()) {
                    this.carriedFood = nearestFood;
                }
            }
        }
    }
} 