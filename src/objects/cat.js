import * as THREE from 'three';
import { Bowl } from './bowl.js';
import { CAT_CONFIG, ACTIVITY_TYPES } from '../config/GameConfig.js';
import { CatState } from '../state/CatState.js';
import { CatAnimator } from './CatAnimator.js';
import { CatUIManager } from './CatUIManager.js';
import { CatBehavior } from './CatBehavior.js';

export class Cat {
    constructor(scene, initialPosition = new THREE.Vector3(0, 0, 0)) {
        this.scene = scene;
        this.position = initialPosition;
        
        // Initialize audio context
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        
        this.state = new CatState();
        
        // Initialize animation state
        this.animation = {
            tailWag: 0,
            walkCycle: 0
        };
        
        this.initializePhysics();
        this.createModel();
        
        // Instantiate CatAnimator after model and parts are created
        this.animator = new CatAnimator(
            this.model,
            this.state,
            this.animation,
            this.tailSegments,
            this.legs,
            this.body,
            this.head
        );
        // Instantiate CatUIManager
        this.uiManager = new CatUIManager(this.state);
        
        this.scene.add(this.model);
        this.updatePosition();
        
        // Register with all bowls in the scene
        this.scene.children
            .filter(child => child instanceof Bowl)
            .forEach(bowl => bowl.registerCat(this));

        this.behavior = new CatBehavior(this);
    }

    initializePhysics() {
        this.raycaster = new THREE.Raycaster();
    }

    createModel() {
        this.model = new THREE.Group();
        const materials = this.createMaterials();
        
        this.centerPoint = new THREE.Group();
        this.model.add(this.centerPoint);
        this.centerPoint.rotation.y = -Math.PI / 2;
        
        this.createBody(materials);
        this.createHead(materials);
        this.createTail(materials);
        this.createLegs(materials);
        this.createMeowBubble();
        
        this.setupShadows();
    }

    createMaterials() {
        return {
            orange: new THREE.MeshToonMaterial(CAT_CONFIG.materials.body),
            white: new THREE.MeshToonMaterial(CAT_CONFIG.materials.white),
            black: new THREE.MeshToonMaterial(CAT_CONFIG.materials.black)
        };
    }

    createBody(materials) {
        const dims = CAT_CONFIG.dimensions.body;
        const bodyGeometry = new THREE.BoxGeometry(dims.width, dims.height, dims.depth);
        this.body = new THREE.Mesh(bodyGeometry, materials.orange);
        this.body.position.y = dims.height;
        this.centerPoint.add(this.body);

        const chestGeometry = new THREE.BoxGeometry(0.2, 0.15, 0.2);
        const chest = new THREE.Mesh(chestGeometry, materials.white);
        chest.position.set(0.1, 0.18, 0);
        this.centerPoint.add(chest);
    }

    createHead(materials) {
        const dims = CAT_CONFIG.dimensions.head;
        const headGeometry = new THREE.BoxGeometry(dims.size, dims.size, dims.size);
        this.head = new THREE.Mesh(headGeometry, materials.orange);
        this.head.position.set(0.2, dims.heightOffset, 0);
        this.centerPoint.add(this.head);

        this.createEyes(materials);
        this.createEars(materials);
    }

    createEyes(materials) {
        const dims = CAT_CONFIG.dimensions.eye;
        const eyeGeometry = new THREE.BoxGeometry(dims.size, dims.size, dims.size);
        [-1, 1].forEach(side => {
            const eye = new THREE.Mesh(eyeGeometry, materials.black);
            eye.position.set(0.32, dims.heightOffset, dims.spacing * side);
            eye.scale.set(0.4, 0.8, 1);
            this.centerPoint.add(eye);
        });
    }

    createEars(materials) {
        const dims = CAT_CONFIG.dimensions.ear;
        const earGeometry = new THREE.ConeGeometry(dims.radius, dims.height, 4);
        [-1, 1].forEach(side => {
            const ear = new THREE.Mesh(earGeometry, materials.orange);
            ear.position.set(0.2, dims.heightOffset, dims.spacing * side);
            ear.rotation.x = dims.tiltAngle * side;
            this.centerPoint.add(ear);
        });
    }

    createTail(materials) {
        const dims = CAT_CONFIG.dimensions.tail;
        const tailGeometry = new THREE.BoxGeometry(dims.segmentLength, dims.segmentHeight, dims.segmentHeight);
        this.tailSegments = [];

        for (let i = 0; i < dims.segments; i++) {
            const segment = new THREE.Mesh(tailGeometry, materials.orange);
            segment.position.set(
                -0.2 - (i * dims.segmentSpacing),
                dims.heightOffset + Math.sin(i * 0.5) * 0.05,
                0
            );
            this.tailSegments.push(segment);
            this.centerPoint.add(segment);
        }
    }

    createLegs(materials) {
        const legDims = CAT_CONFIG.dimensions.leg;
        const pawDims = CAT_CONFIG.dimensions.paw;
        const legGeometry = new THREE.BoxGeometry(legDims.width, legDims.height, legDims.width);
        const pawGeometry = new THREE.BoxGeometry(pawDims.width, pawDims.height, pawDims.depth);

        this.legs = [];
        const positions = [
            [legDims.spacing.x, 0, legDims.spacing.z],
            [legDims.spacing.x, 0, -legDims.spacing.z],
            [-legDims.spacing.x, 0, legDims.spacing.z],
            [-legDims.spacing.x, 0, -legDims.spacing.z]
        ];

        positions.forEach(pos => {
            const legGroup = new THREE.Group();
            const leg = new THREE.Mesh(legGeometry, materials.orange);
            const paw = new THREE.Mesh(pawGeometry, materials.white);
            
            leg.position.y = legDims.height / 2;
            paw.position.y = -legDims.height / 2;
            
            legGroup.add(leg);
            legGroup.add(paw);
            legGroup.position.set(...pos);
            this.legs.push(legGroup);
            this.centerPoint.add(legGroup);
        });
    }

    createMeowBubble() {
        const geometry = new THREE.SphereGeometry(CAT_CONFIG.meow.size, 8, 8);
        const material = new THREE.MeshBasicMaterial({
            color: CAT_CONFIG.meow.color,
            transparent: true,
            opacity: 0.7,
            visible: false
        });
        this.meowBubble = new THREE.Mesh(geometry, material);
        this.model.add(this.meowBubble);
        this.meowBubble.position.set(0, CAT_CONFIG.meow.height, 0);
    }

    setupShadows() {
        this.model.traverse((object) => {
            if (object.isMesh) {
                object.castShadow = true;
                object.receiveShadow = true;
            }
        });
    }

    showMeow() {
        if (this.state.isMeowing) return;
        
        this.state.isMeowing = true;
        this.meowBubble.material.visible = true;
        
        setTimeout(() => {
            this.state.isMeowing = false;
            this.meowBubble.material.visible = false;
        }, CAT_CONFIG.meow.duration * 1000);
    }

    checkEmptyBowl() {
        if (!this.state.targetBowl) return false;
        
        const distance = this.position.distanceTo(this.state.targetBowl.position);
        if (distance < CAT_CONFIG.movement.bowlReachRadius) {
            if (!this.state.targetBowl.hasFood()) {
                this.showMeow();
                this.state.targetBowl = null;
                this.state.targetPosition = null;
                return true;
            }
        }
        return false;
    }

    detectFoodBowl() {
        if (this.state.heardFood && this.state.heardFoodBowl && 
            this.state.targetBowl === this.state.heardFoodBowl) {
            return;
        }

        if (!this.state.targetBowl) {
            let nearestBowl = null;
            let nearestDistance = Infinity;

            this.scene.traverse((object) => {
                if (object.name === 'food_bowl') {
                    const bowl = object.userData.bowlInstance;
                    if (bowl) {
                        const distance = this.position.distanceTo(bowl.position);
                        if (distance < CAT_CONFIG.movement.bowlDetectionRadius && distance < nearestDistance) {
                            if (this.state.hunger >= CAT_CONFIG.hunger.thresholds.veryHungry || bowl.hasFood()) {
                                nearestBowl = bowl;
                                nearestDistance = distance;
                            }
                        }
                    }
                }
            });

            if (nearestBowl) {
                this.state.targetBowl = nearestBowl;
                this.state.targetPosition = nearestBowl.position.clone();
            }
        }
    }

    checkBowlReach() {
        if (this.state.targetBowl && this.state.targetBowl.hasFood()) {
            const distance = this.position.distanceTo(this.state.targetBowl.position);
            if (distance < CAT_CONFIG.movement.bowlReachRadius) {
                const food = this.state.targetBowl.currentFood;
                const nutrition = food.consume();
                this.state.hunger = Math.max(0, this.state.hunger - nutrition);
                this.state.anger = Math.max(0, this.state.anger - nutrition/2);
                this.state.targetBowl = null;
                this.state.targetPosition = null;
                this.state.isEating = true;
                this.state.heardFood = false;
                this.state.heardFoodBowl = null;
                return true;
            }
        }
        return false;
    }

    checkCollision(position, direction) {
        const rayAngles = [];
        const angleStep = (2 * Math.PI) / CAT_CONFIG.movement.collisionRays;
        
        for (let i = 0; i < CAT_CONFIG.movement.collisionRays; i++) {
            rayAngles.push(i * angleStep);
        }
        
        let collision = false;
        let collisionNormal = new THREE.Vector3();
        
        const collidableObjects = [];
        this.scene.traverse((object) => {
            if (object.name && (
                object.name.includes('table') ||
                object.name.includes('chair') ||
                object.name.includes('shelf') ||
                object.name === 'floor' ||
                object.name.includes('wall')
            )) {
                collidableObjects.push(object);
            }
        });
        
        for (const angle of rayAngles) {
            const rayDirection = new THREE.Vector3(
                Math.cos(angle),
                0,
                Math.sin(angle)
            );
            
            this.raycaster.set(position, rayDirection);
            const intersects = this.raycaster.intersectObjects(collidableObjects, true);
            
            if (intersects.length > 0 && intersects[0].distance < CAT_CONFIG.movement.collisionRadius) {
                collision = true;
                collisionNormal.add(intersects[0].face.normal);
            }
        }
        
        if (collision) {
            collisionNormal.normalize();
        }
        
        return { collision, normal: collisionNormal };
    }

    moveTowards(target, deltaTime) {
        if (!target) return false;

        const toTarget = target.clone().sub(this.position);
        const distance = toTarget.length();
        
        if (distance < 0.1) {
            this.state.currentSpeed = Math.max(0, this.state.currentSpeed - CAT_CONFIG.movement.deceleration * deltaTime);
            if (this.state.currentSpeed < CAT_CONFIG.movement.minSpeedThreshold) {
                this.state.currentSpeed = 0;
                return true;
            }
        }

        this.updateRotation(toTarget, deltaTime);
        this.updateMovement(deltaTime);

        return false;
    }

    updateRotation(toTarget, deltaTime) {
        this.state.targetAngle = Math.atan2(toTarget.x, toTarget.z);
        let angleDiff = this.state.targetAngle - this.state.facingAngle;
        
        while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
        while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
        
        this.state.isRotating = Math.abs(angleDiff) > CAT_CONFIG.movement.turnThreshold;
        
        if (this.state.isRotating) {
            const rotationStep = Math.sign(angleDiff) * 
                Math.min(Math.abs(angleDiff), CAT_CONFIG.movement.rotationSpeed * deltaTime);
            this.state.facingAngle += rotationStep;
            
            while (this.state.facingAngle > Math.PI) this.state.facingAngle -= Math.PI * 2;
            while (this.state.facingAngle < -Math.PI) this.state.facingAngle += Math.PI * 2;
            
            this.model.rotation.y = this.state.facingAngle;
            this.state.currentSpeed = Math.max(0, this.state.currentSpeed - CAT_CONFIG.movement.deceleration * deltaTime);
        } else {
            this.state.currentSpeed = Math.min(
                CAT_CONFIG.movement.maxSpeed,
                this.state.currentSpeed + CAT_CONFIG.movement.acceleration * deltaTime
            );
        }

        const tiltAmount = this.state.isRotating ? (angleDiff / Math.PI) * 0.1 : 0;
        this.head.rotation.z = -tiltAmount;
    }

    updateMovement(deltaTime) {
        if (this.state.currentSpeed > 0) {
            const movement = new THREE.Vector3(
                Math.sin(this.state.facingAngle),
                0,
                Math.cos(this.state.facingAngle)
            ).multiplyScalar(this.state.currentSpeed * deltaTime);
            
            const nextPosition = this.position.clone().add(movement);
            const collisionCheck = this.checkCollision(nextPosition, movement.normalize());
            
            if (!collisionCheck.collision) {
                this.position.copy(nextPosition);
            } else {
                this.handleCollision(movement, collisionCheck.normal);
            }
            
            this.updatePosition();
        }
    }

    handleCollision(movement, normal) {
        const slide = movement.clone()
            .sub(normal.multiplyScalar(movement.dot(normal)))
            .multiplyScalar(0.5);
        
        const slidePosition = this.position.clone().add(slide);
        const slideCollision = this.checkCollision(slidePosition, slide.normalize());
        
        if (!slideCollision.collision) {
            this.position.copy(slidePosition);
        }
        
        if (this.state.currentSpeed < 0.1) {
            this.state.targetPosition = this.findNewTarget();
        }
    }

    findNewTarget() {
        const room = CAT_CONFIG.room;
        const x = (Math.random() * (room.width - 2 * room.margin)) - (room.width/2 - room.margin);
        const z = (Math.random() * (room.length - 2 * room.margin)) - (room.length/2 - room.margin);
        return new THREE.Vector3(x, 0, z);
    }

    updatePosition() {
        this.model.position.copy(this.position);
    }

    update(deltaTime) {
        this.behavior.update(deltaTime);
        // UI and animation updates remain here
        this.uiManager.update();
        const movement = this.state.movement;
        const foodState = this.state.food;
        if (movement.currentSpeed > 0) {
            this.animator.animateWalking(Math.min(deltaTime, 0.1));
        } else {
            this.animator.animateIdle(Math.min(deltaTime, 0.1));
        }
    }

    notifyFoodAdded(bowl) {
        const distance = this.position.distanceTo(bowl.position);
        
        console.log('Food added notification:', {
            distance,
            hearingRange: CAT_CONFIG.hearing.range,
            hunger: this.state.hunger,
            interestThreshold: CAT_CONFIG.hunger.thresholds.interested
        });
        
        if (distance <= CAT_CONFIG.hearing.range) {
            this.state.updateFood({
                heardFood: true,
                heardFoodBowl: bowl,
                lastFoodSound: Date.now()
            });
            this.state.setActivity(ACTIVITY_TYPES.HEARD_FOOD);
            
            if (this.state.hunger >= CAT_CONFIG.hunger.thresholds.interested && !this.state.food.isEating) {
                console.log('Cat is interested in new food');
                this.state.updateFood({
                    targetBowl: bowl
                });
                this.state.updateMovement({
                    targetPosition: bowl.position.clone()
                });
                this.showMeow();
            }
        }
    }

    dispose() {
        // Unregister from all bowls
        this.scene.children
            .filter(child => child instanceof Bowl)
            .forEach(bowl => bowl.unregisterCat(this));
            
        // ... any other cleanup code ...
    }

    findNearestBowlWithFood() {
        let nearestBowl = null;
        let minDistance = Infinity;

        // Search through all objects in the scene
        this.scene.traverse((object) => {
            if (object.name === 'food_bowl') {
                const bowl = object.userData.bowlInstance;
                if (bowl && bowl.hasFood()) {
                    const distance = this.position.distanceTo(bowl.position);
                    console.log('Found bowl with food:', {
                        distance,
                        detectionRadius: CAT_CONFIG.movement.bowlDetectionRadius,
                        bowlPosition: bowl.position,
                        catPosition: this.position
                    });
                    if (distance < CAT_CONFIG.movement.bowlDetectionRadius && distance < minDistance) {
                        minDistance = distance;
                        nearestBowl = bowl;
                    }
                }
            }
        });

        if (nearestBowl) {
            console.log('Found nearest bowl:', nearestBowl);
        }
        return nearestBowl;
    }

    moveTowardsBowl(bowl) {
        if (!bowl) return;
        
        console.log('Moving towards bowl:', {
            bowlPosition: bowl.position,
            catPosition: this.position
        });
        
        // Update state through state manager
        this.state.updateFood({
            targetBowl: bowl
        });
        this.state.updateMovement({
            targetPosition: bowl.position.clone()
        });
        this.state.setActivity(ACTIVITY_TYPES.SEARCHING_FOOD);
        
        // Calculate direction to bowl
        const direction = bowl.position.clone().sub(this.position);
        direction.y = 0; // Keep movement in horizontal plane
        
        // Set target angle for smooth rotation
        this.state.updateMovement({
            targetAngle: Math.atan2(direction.x, direction.z)
        });
    }

    meowIfHungry() {
        const now = Date.now();
        const animation = this.state.animation;
        if (now - animation.lastMeow > 5000) {
            this.playMeowSound();
            this.state.updateAnimation({
                lastMeow: now,
                isMeowing: true
            });
            this.showMeow();
            this.state.setActivity(ACTIVITY_TYPES.MEOWING);
        }
    }

    playMeowSound() {
        // Resume audio context if it was suspended
        if (this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }

        // Create oscillator
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        // Connect nodes
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        // Configure sound
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(400, this.audioContext.currentTime);
        oscillator.frequency.linearRampToValueAtTime(600, this.audioContext.currentTime + 0.2);
        
        // Configure volume envelope
        gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.3, this.audioContext.currentTime + 0.05);
        gainNode.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + 0.3);
        
        // Play sound
        oscillator.start();
        oscillator.stop(this.audioContext.currentTime + 0.3);
    }

    eat(bowl) {
        if (!this.state.food.isEating) {
            this.state.food.isEating = true;
            // Start eating animation or visual feedback
            
            // Increase hunger while eating
            const eatInterval = setInterval(() => {
                this.state.hunger = Math.min(100, this.state.hunger + 5);
                if (this.state.hunger >= 100 || !bowl.hasFood()) {
                    clearInterval(eatInterval);
                    this.state.food.isEating = false;
                    this.state.food.targetBowl = null;
                }
            }, 500); // Eat every 0.5 seconds
        }
    }

    onBowlFilled(bowl) {
        this.knownBowlsWithFood.add(bowl.id);
    }
}
