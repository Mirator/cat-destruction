import { ACTIVITY_TYPES, CAT_CONFIG, UI_CONFIG } from '../../config/GameConfig.js';
import { FlowerProp } from '../props/FlowerProp.js';
import { InteractionUI } from '../../ui/interaction-ui.js';

const FOOD_TYPES = ['FISH', 'CHICKEN'];
let globalAttentionUI = null;
function getAttentionUI() {
    if (!globalAttentionUI) globalAttentionUI = new InteractionUI();
    return globalAttentionUI;
}

export class CatBehavior {
    constructor(cat, playerState = null) {
        this.cat = cat;
        this.state = cat.state;
        this.playerState = playerState;
        this._lastMoveLogTime = 0;
        this.angryDuration = 0;
        this.mischiefTarget = null;
        this.mischiefTimer = 0;
        this.attackMode = false;
        this.attackTimer = 0;
    }

    update(deltaTime) {
        this.handleHunger(deltaTime);
        this.handleMischief(deltaTime);
        this.handleMovement(deltaTime);
        this.handleEating(deltaTime);
        this.handleAttackMode(deltaTime);
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
        // If hungry and no food in any bowl, demand a food type
        const now = Date.now();
        const cooldown = 10000; // 10 seconds
        if (
            this.state.hunger > CAT_CONFIG.hunger.thresholds.hungry &&
            !this.cat.findNearestBowlWithFood()
        ) {
            if (
                !this.state.food.foodPreference &&
                (!this.state.food.foodPreferenceCooldown || now - this.state.food.foodPreferenceCooldown > cooldown)
            ) {
                // Pick a random preference
                const pref = FOOD_TYPES[Math.floor(Math.random() * FOOD_TYPES.length)];
                this.state.setFoodPreference(pref);
                getAttentionUI().showAttention(`Cat wants ${pref === 'FISH' ? 'Fish' : 'Chicken'}!`, 3000);
            }
        }
        // Do NOT reset preference just because food is available
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
        // Allow movement if a targetPosition is set, even in attack mode
        const movement = this.state.movement;
        const foodState = this.state.food;
        if (this.attackMode) {
            // If in attack mode, only move if a targetPosition is set (handled in handleAttackMode)
            if (movement.targetPosition) {
                this.cat.moveTowards(movement.targetPosition, deltaTime);
            }
            return;
        }
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
                    this.cat.meowIfAngry();
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

    handleAttackMode(deltaTime) {
        // Do not attack if cat is relaxed (anger below annoyed threshold)
        if (this.state.anger < UI_CONFIG.statusBar.thresholds.annoyed) {
            this.attackMode = false;
            this.attackTimer = 0;
            return;
        }
        // Check if any bowl has food; if so, exit attack mode
        const anyBowlWithFood = !!this.cat.findNearestBowlWithFood && this.cat.findNearestBowlWithFood();
        if (anyBowlWithFood) {
            this.attackMode = false;
            this.attackTimer = 0;
            return;
        }
        // Check if all FlowerProps are knocked over
        const flowers = [];
        this.cat.scene.traverse(obj => {
            if (obj.userData?.propInstance instanceof FlowerProp) {
                flowers.push(obj.userData.propInstance);
            }
        });
        const allKnocked = flowers.length > 0 && flowers.every(f => f.isKnockedOver);
        if (allKnocked && this.playerState && this.cat.scene && this.cat.scene.userData?.playerCamera) {
            this.attackMode = true;
        } else {
            this.attackMode = false;
            this.attackTimer = 0;
            return;
        }
        if (this.attackMode) {
            const playerCamera = this.cat.scene.userData.playerCamera;
            const playerPos = playerCamera.position.clone();
            // Use only horizontal distance (ignore y)
            const catXZ = this.cat.position.clone(); catXZ.y = 0;
            const playerXZ = playerPos.clone(); playerXZ.y = 0;
            const dist = catXZ.distanceTo(playerXZ);
            this.cat.state.updateMovement({ targetPosition: playerPos });
            this.cat.state.setActivity(ACTIVITY_TYPES.CHASING_PLAYER);
            this.cat.moveTowards(playerPos, deltaTime);
            if (dist <= 0.5) {
                this.playerState.changeHealth(-6 * deltaTime);
            }
        }
    }

    // Add more methods as needed for bowl finding, meowing, etc.
} 