import { ACTIVITY_TYPES, CAT_CONFIG } from '../config/GameConfig.js';
import { FlowerProp } from './prop.js';

export class CatBehavior {
    constructor(cat) {
        this.cat = cat;
        this.state = cat.state;
        this._lastMoveLogTime = 0;
        this.angryDuration = 0;
        this.mischiefTarget = null;
        this.mischiefTimer = 0;
    }

    update(deltaTime) {
        this.handleHunger(deltaTime);
        this.handleMischief(deltaTime);
        this.handleMovement(deltaTime);
        this.handleEating(deltaTime);
    }

    handleHunger(deltaTime) {
        if (!this.state.food.isEating) {
            this.state.setHunger(Math.min(100, this.state.hunger + Math.min(deltaTime, 0.1) * CAT_CONFIG.hunger.increaseRate));
        }
        this.state.setAnger(Math.max(0, (this.state.hunger - CAT_CONFIG.hunger.thresholds.hungry) * 2));
        // Track how long cat is angry (above veryHungry)
        if (this.state.hunger > CAT_CONFIG.hunger.thresholds.veryHungry) {
            this.angryDuration += deltaTime;
        } else {
            if (this.angryDuration > 0) this.angryDuration = 0;
        }
    }

    handleMischief(deltaTime) {
        // If already targeting a flower for mischief
        if (this.mischiefTarget) {
            const dist = this.cat.position.distanceTo(this.mischiefTarget.model.position);
            if (dist > 0.3) {
                this.state.updateMovement({ targetPosition: this.mischiefTarget.model.position.clone() });
                this.state.setActivity(ACTIVITY_TYPES.KNOCKING_PROP);
                this.mischiefTimer = 0;
            } else {
                this.state.updateMovement({ targetPosition: null });
                this.state.setActivity(ACTIVITY_TYPES.KNOCKING_PROP);
                this.mischiefTimer += deltaTime;
                if (this.mischiefTimer > 1.0) { // 1 second pause
                    this.mischiefTarget.knockOver();
                    this.mischiefTarget = null;
                    this.mischiefTimer = 0;
                    this.state.setActivity(ACTIVITY_TYPES.IDLE);
                }
            }
            return;
        }
        // If angry for a while, increase chance to do mischief
        const foodState = this.state.food;
        const anyBowlWithFood = !!this.cat.findNearestBowlWithFood();
        if (
            this.angryDuration > 2.0 &&
            !foodState.isEating &&
            !anyBowlWithFood
        ) {
            const p = Math.min(0.1 + 0.2 * this.angryDuration, 0.95);
            if (Math.random() < p) {
                // Find all flowers
                const flowers = [];
                this.cat.scene.traverse(obj => {
                    if (obj.userData?.propInstance instanceof FlowerProp) {
                        flowers.push(obj.userData.propInstance);
                    }
                });
                if (flowers.length === 0) {
                    return;
                }
                // Find nearest flower
                let nearest = null;
                let minDist = Infinity;
                flowers.forEach(flower => {
                    const dist = this.cat.position.distanceTo(flower.model.position);
                    if (dist < minDist) {
                        minDist = dist;
                        nearest = flower;
                    }
                });
                if (nearest && !nearest.isKnockedOver) {
                    // Nearest flower is not knocked over, target it
                    this.mischiefTarget = nearest;
                    this.mischiefTimer = 0;
                    this.state.setActivity(ACTIVITY_TYPES.KNOCKING_PROP);
                } else {
                    // Nearest is knocked over, try to find another not knocked over
                    const notKnocked = flowers.filter(f => !f.isKnockedOver && f !== nearest);
                    if (notKnocked.length > 0) {
                        const randomOther = notKnocked[Math.floor(Math.random() * notKnocked.length)];
                        this.mischiefTarget = randomOther;
                        this.mischiefTimer = 0;
                        this.state.setActivity(ACTIVITY_TYPES.KNOCKING_PROP);
                    } else {
                        // All are knocked over, do nothing
                    }
                }
            }
        }
    }

    handleMovement(deltaTime) {
        const movement = this.state.movement;
        const foodState = this.state.food;
        // Throttle moving towards target log
        if (!this._lastMoveLogTime) this._lastMoveLogTime = 0;
        const now = Date.now();
        // Randomly pick a new target if idle
        if (!movement.targetPosition && !foodState.isEating && !this.mischiefTarget && Math.random() < 0.01) {
            this.state.updateMovement({
                targetPosition: this.cat.findNewTarget()
            });
            this.state.setActivity(ACTIVITY_TYPES.WALKING);
        }
        // Allow movement toward targetPosition even if mischiefTarget is set
        if (movement.targetPosition && !foodState.isEating) {
            if (this.mischiefTarget) {
                this.state.setActivity(ACTIVITY_TYPES.KNOCKING_PROP);
            } else if (foodState.targetBowl && foodState.targetBowl.hasFood()) {
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
        if (this.state.hunger > CAT_CONFIG.hunger.thresholds.hungry && !foodState.isEating && !this.mischiefTarget) {
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