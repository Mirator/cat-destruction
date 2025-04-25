import { ACTIVITY_TYPES } from '../config/GameConfig.js';
import { GameEvents } from '../events/GameEvents.js';

export class CatState {
    constructor() {
        this.state = {
            hunger: 50,
            anger: 0,
            activity: ACTIVITY_TYPES.IDLE,
            movement: {
                position: null,
                targetPosition: null,
                currentSpeed: 0,
                facingAngle: 0,
                targetAngle: 0,
                isRotating: false
            },
            food: {
                targetBowl: null,
                lastBowlCheck: 0,
                isEating: false,
                heardFood: false,
                heardFoodBowl: null,
                lastFoodSound: 0
            },
            animation: {
                tailWag: 0,
                walkCycle: 0,
                isMeowing: false,
                lastMeow: 0
            }
        };
    }

    get hunger() { return this.state.hunger; }
    get anger() { return this.state.anger; }
    get activity() { return this.state.activity; }
    get movement() { return this.state.movement; }
    get food() { return this.state.food; }
    get animation() { return this.state.animation; }

    setHunger(value) {
        this.state.hunger = Math.max(0, Math.min(100, value));
        GameEvents.emit(GameEvents.EVENT_TYPES.CAT_STATE_CHANGED, { hunger: this.state.hunger });
    }

    setAnger(value) {
        this.state.anger = Math.max(0, value);
        GameEvents.emit(GameEvents.EVENT_TYPES.CAT_STATE_CHANGED, { anger: this.state.anger });
    }

    setActivity(activity) {
        if (this.state.activity !== activity) {
            this.state.activity = activity;
            GameEvents.emit(GameEvents.EVENT_TYPES.ACTIVITY_CHANGED, { activity });
        }
    }

    updateMovement(updates) {
        Object.assign(this.state.movement, updates);
    }

    updateFood(updates) {
        Object.assign(this.state.food, updates);
        if (updates.targetBowl !== undefined || updates.isEating !== undefined) {
            GameEvents.emit(GameEvents.EVENT_TYPES.CAT_STATE_CHANGED, { 
                targetBowl: this.state.food.targetBowl,
                isEating: this.state.food.isEating
            });
        }
    }

    updateAnimation(updates) {
        Object.assign(this.state.animation, updates);
    }
} 