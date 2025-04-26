import { CAT_CONFIG } from '../config/GameConfig.js';

export class CatAnimator {
    constructor(model, state, animation, tailSegments, legs, body, head) {
        this.model = model;
        this.state = state;
        this.animation = animation;
        this.tailSegments = tailSegments;
        this.legs = legs;
        this.body = body;
        this.head = head;
    }

    animateWalking(deltaTime) {
        const speedRatio = this.state.movement.currentSpeed / CAT_CONFIG.movement.maxSpeed;
        const cycleSpeed = 5 * speedRatio;
        this.animation.walkCycle += deltaTime * cycleSpeed;
        this.animateLegs(speedRatio);
        this.animateBody(speedRatio);
        this.animateTail(deltaTime, speedRatio);
    }

    animateLegs(speedRatio) {
        this.legs.forEach((leg, index) => {
            const offset = index * Math.PI / 2;
            const height = Math.sin(this.animation.walkCycle + offset) * 0.05 * speedRatio;
            leg.position.y = Math.max(0, height);
        });
    }

    animateBody(speedRatio) {
        const bodyBob = Math.sin(this.animation.walkCycle * 2) * 0.01 * speedRatio;
        this.body.position.y = CAT_CONFIG.dimensions.body.height + bodyBob;
        this.head.position.y = CAT_CONFIG.dimensions.head.heightOffset + bodyBob;
    }

    animateTail(deltaTime, speedRatio) {
        this.animation.tailWag += deltaTime * (1 + speedRatio * 2);
        this.tailSegments.forEach((segment, index) => {
            const baseWag = Math.sin(this.animation.tailWag - index * 0.5);
            const wagAmount = 0.1 + speedRatio * 0.2;
            segment.rotation.y = baseWag * wagAmount;
        });
    }

    animateIdle(deltaTime) {
        this.animation.tailWag += deltaTime;
        this.tailSegments.forEach((segment, index) => {
            const wagAmount = 0.1;
            segment.rotation.y = Math.sin(this.animation.tailWag - index * 0.5) * wagAmount;
        });
    }

    animateEating(deltaTime) {
        // Simple head bobbing animation
        const bobAmount = Math.sin(Date.now() * 0.01) * 0.03;
        this.head.position.y = CAT_CONFIG.dimensions.head.heightOffset + bobAmount;
    }
} 