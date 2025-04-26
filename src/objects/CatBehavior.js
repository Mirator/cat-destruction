import { ACTIVITY_TYPES, CAT_CONFIG } from '../config/GameConfig.js';

export class CatBehavior {
    constructor(cat) {
        this.cat = cat;
        this.state = cat.state;
        this._lastMoveLogTime = 0;
    }

    update(deltaTime) {
        this.handleHunger(deltaTime);
        this.handleMovement(deltaTime);
        this.handleEating(deltaTime);
    }

    handleHunger(deltaTime) {
        if (!this.state.food.isEating) {
            this.state.setHunger(Math.min(100, this.state.hunger + Math.min(deltaTime, 0.1) * CAT_CONFIG.hunger.increaseRate));
        }
        this.state.setAnger(Math.max(0, (this.state.hunger - CAT_CONFIG.hunger.thresholds.hungry) * 2));
    }

    handleMovement(deltaTime) {
        const movement = this.state.movement;
        const foodState = this.state.food;
        // Throttle moving towards target log
        if (!this._lastMoveLogTime) this._lastMoveLogTime = 0;
        const now = Date.now();
        // Randomly pick a new target if idle
        if (!movement.targetPosition && !foodState.isEating && Math.random() < 0.01) {
            this.state.updateMovement({
                targetPosition: this.cat.findNewTarget()
            });
            this.state.setActivity(ACTIVITY_TYPES.WALKING);
        }
        // Move towards target
        if (movement.targetPosition && !foodState.isEating) {
            // Set activity to GOING_TO_BOWL if going to a known bowl with food
            if (foodState.targetBowl && foodState.targetBowl.hasFood()) {
                this.state.setActivity(ACTIVITY_TYPES.GOING_TO_BOWL);
            }
            const reached = this.cat.moveTowards(movement.targetPosition, Math.min(deltaTime, 0.1));
            if (reached) {
                this.state.updateMovement({ targetPosition: null });
                if (foodState.targetBowl && this.state.hunger > CAT_CONFIG.hunger.thresholds.hungry) {
                    const nearestBowl = this.cat.findNearestBowlWithFood();
                    if (nearestBowl) {
                        this.cat.moveTowardsBowl(nearestBowl);
                    } else {
                        this.state.setActivity(ACTIVITY_TYPES.IDLE);
                    }
                } else {
                    this.state.setActivity(ACTIVITY_TYPES.IDLE);
                }
            }
        }
        // Food seeking
        if (this.state.hunger > CAT_CONFIG.hunger.thresholds.hungry && !foodState.isEating) {
            if (!foodState.targetBowl || !foodState.targetBowl.hasFood()) {
                const nearestBowl = this.cat.findNearestBowlWithFood();
                if (nearestBowl) {
                    this.cat.moveTowardsBowl(nearestBowl);
                } else {
                    this.state.setActivity(ACTIVITY_TYPES.SEARCHING_FOOD);
                    this.cat.meowIfHungry();
                }
            }
        }
    }

    handleEating(deltaTime) {
        const foodState = this.state.food;
        foodState.lastBowlCheck += Math.min(deltaTime, 0.1);
        if (foodState.lastBowlCheck > CAT_CONFIG.hunger.checkInterval) {
            foodState.lastBowlCheck = 0;
            if (foodState.targetBowl) {
                const distance = this.cat.position.distanceTo(foodState.targetBowl.position);
                if (distance <= CAT_CONFIG.movement.bowlReachRadius && foodState.targetBowl.hasFood()) {
                    this.state.setActivity(ACTIVITY_TYPES.EATING);
                    this.cat.eat(foodState.targetBowl);
                    this.state.updateFood({
                        isEating: true,
                        targetBowl: null
                    });
                    this.state.updateMovement({ targetPosition: null });
                    setTimeout(() => {
                        this.state.updateFood({ isEating: false });
                        this.state.setActivity(ACTIVITY_TYPES.IDLE);
                    }, 1000);
                }
            }
        }
    }

    // Add more methods as needed for bowl finding, meowing, etc.
} 