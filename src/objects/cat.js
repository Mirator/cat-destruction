import * as THREE from 'three';
import { HungerBar } from '../ui/hungerBar.js';
import { CatStatusBar } from '../ui/catStatusBar.js';
import { Bowl } from './bowl.js';

export const CAT_ACTIVITIES = {
    IDLE: 'idle',
    WALKING: 'walking',
    EATING: 'eating',
    SEARCHING_FOOD: 'searchingFood',
    MEOWING: 'meowing',
    ROTATING: 'rotating',
    HEARD_FOOD: 'heardFood'
};

const CAT_CONFIG = {
    dimensions: {
        body: {
            width: 0.4,
            height: 0.25,
            depth: 0.25
        },
        head: {
            size: 0.25,
            heightOffset: 0.32
        },
        eye: {
            size: 0.05,
            spacing: 0.08,
            heightOffset: 0.34
        },
        ear: {
            radius: 0.05,
            height: 0.1,
            spacing: 0.08,
            heightOffset: 0.45,
            tiltAngle: 0.3
        },
        tail: {
            segmentLength: 0.1,
            segmentHeight: 0.06,
            segmentSpacing: 0.08,
            heightOffset: 0.25,
            segments: 4
        },
        leg: {
            width: 0.08,
            height: 0.2,
            spacing: {
                x: 0.15,
                z: 0.15
            }
        },
        paw: {
            width: 0.09,
            height: 0.04,
            depth: 0.1
        }
    },
    materials: {
        body: {
            color: 0xFFA500,
            flatShading: true
        },
        white: {
            color: 0xFFFFFF,
            flatShading: true
        },
        black: {
            color: 0x000000,
            flatShading: true
        }
    },
    movement: {
        maxSpeed: 1.5,
        rotationSpeed: 2.0,
        acceleration: 2.0,
        deceleration: 4.0,
        collisionRadius: 0.2,
        collisionRays: 8,
        turnThreshold: 0.1,
        minSpeedThreshold: 0.01,
        bowlDetectionRadius: 3.0,
        bowlReachRadius: 0.2
    },
    hunger: {
        initial: 50,
        increaseRate: 2.0,
        checkInterval: 1.0,
        thresholds: {
            hungry: 30,
            veryHungry: 70,
            meow: 50,
            interested: 20
        }
    },
    hearing: {
        range: 8.0,
        reactionDelay: 0.5
    },
    meow: {
        size: 0.2,
        duration: 1.0,
        height: 0.5,
        color: 0xFFFF00,
        chance: 0.005
    },
    room: {
        width: 6,
        length: 8,
        margin: 0.5
    }
};

export class Cat {
    constructor(scene, initialPosition = new THREE.Vector3(0, 0, 0)) {
        this.scene = scene;
        this.position = initialPosition;
        
        this.initializeState();
        this.initializePhysics();
        this.initializeUI();
        this.createModel();
        
        this.scene.add(this.model);
        this.updatePosition();
        
        // Register with all bowls in the scene
        this.scene.children
            .filter(child => child instanceof Bowl)
            .forEach(bowl => bowl.registerCat(this));
    }

    initializeState() {
        this.hunger = 50;
        this.lastMeowTime = 0;
        this.isEating = false;
        this.knownBowlsWithFood = new Set();
        this.targetBowl = null;
        
        // Initialize audio context
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();

        this.state = {
            hunger: CAT_CONFIG.hunger.initial,
            anger: 0,
            targetPosition: null,
            currentSpeed: 0,
            isRotating: false,
            facingAngle: 0,
            targetAngle: 0,
            lastBowlCheck: 0,
            lastMeow: 0,
            isMeowing: false,
            heardFood: false,
            heardFoodBowl: null,
            lastFoodSound: 0,
            activity: CAT_ACTIVITIES.IDLE
        };

        this.animation = {
            tailWag: 0,
            walkCycle: 0
        };
    }

    initializePhysics() {
        this.raycaster = new THREE.Raycaster();
    }

    initializeUI() {
        this.hungerBar = new HungerBar();
        this.statusBar = new CatStatusBar();
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

    animateWalking(deltaTime) {
        const speedRatio = this.state.currentSpeed / CAT_CONFIG.movement.maxSpeed;
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
        const clampedDelta = Math.min(deltaTime, 0.1);
        
        // Update hunger over time
        if (!this.state.isEating) {
            this.state.hunger = Math.min(100, this.state.hunger + clampedDelta * 2); // Increase by 2 points per second
        }

        // Update hunger bar and anger
        this.hungerBar.update(this.state.hunger);
        this.state.anger = Math.max(0, (this.state.hunger - CAT_CONFIG.hunger.thresholds.hungry) * 2);
        this.statusBar.updateAnger(this.state.anger);

        // Handle hunger behavior
        if (this.state.hunger > CAT_CONFIG.hunger.thresholds.hungry && !this.state.isEating) {
            console.log('Cat is hungry:', {
                hunger: this.state.hunger,
                threshold: CAT_CONFIG.hunger.thresholds.hungry
            });
            
            // First check if we already have a target bowl
            if (!this.state.targetBowl || !this.state.targetBowl.hasFood()) {
                const nearestBowl = this.findNearestBowlWithFood();
                if (nearestBowl) {
                    this.moveTowardsBowl(nearestBowl);
                } else {
                    this.state.activity = 'searchingFood';
                    this.meowIfHungry();
                }
            }
        }

        // Check if we reached a bowl with food
        this.state.lastBowlCheck += clampedDelta;
        if (this.state.lastBowlCheck > CAT_CONFIG.hunger.checkInterval) {
            this.state.lastBowlCheck = 0;
            if (this.state.targetBowl) {
                const distance = this.position.distanceTo(this.state.targetBowl.position);
                console.log('Checking bowl reach:', {
                    distance,
                    reachRadius: CAT_CONFIG.movement.bowlReachRadius,
                    hasFood: this.state.targetBowl.hasFood()
                });
                
                if (distance <= CAT_CONFIG.movement.bowlReachRadius && this.state.targetBowl.hasFood()) {
                    this.state.activity = 'eating';
                    this.eat(this.state.targetBowl);
                    this.state.isEating = true;
                    setTimeout(() => {
                        this.state.isEating = false;
                        this.state.targetBowl = null;
                        this.state.targetPosition = null;
                        this.state.activity = 'idle';
                    }, 1000);
                }
            }
        }

        // Update movement and animation
        if (!this.state.targetPosition && !this.state.isEating && Math.random() < 0.01) {
            this.state.targetPosition = this.findNewTarget();
            this.state.activity = 'walking';
        }
        
        if (this.state.targetPosition && !this.state.isEating) {
            const reached = this.moveTowards(this.state.targetPosition, clampedDelta);
            if (reached) {
                this.state.targetPosition = null;
                // If we reached the target but it was a bowl and we're still hungry, keep trying
                if (this.state.targetBowl && this.state.hunger > CAT_CONFIG.hunger.thresholds.hungry) {
                    const nearestBowl = this.findNearestBowlWithFood();
                    if (nearestBowl) {
                        this.moveTowardsBowl(nearestBowl);
                    } else {
                        this.state.activity = 'idle';
                    }
                } else {
                    this.state.activity = 'idle';
                }
            }
        }

        if (this.state.currentSpeed > 0) {
            this.animateWalking(clampedDelta);
        } else {
            this.animateIdle(clampedDelta);
        }

        // Update status bar with current activity
        this.statusBar.updateActivity(this.state.activity);
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
            this.state.heardFood = true;
            this.state.heardFoodBowl = bowl;
            this.state.lastFoodSound = Date.now();
            this.state.activity = 'heard food';
            
            if (this.state.hunger >= CAT_CONFIG.hunger.thresholds.interested && !this.state.isEating) {
                console.log('Cat is interested in new food');
                this.state.targetBowl = bowl;
                this.state.targetPosition = bowl.position.clone();
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
        
        // Set the bowl as target
        this.state.targetBowl = bowl;
        this.state.targetPosition = bowl.position.clone();
        this.state.activity = 'searchingFood';
        
        // Calculate direction to bowl
        const direction = bowl.position.clone().sub(this.position);
        direction.y = 0; // Keep movement in horizontal plane
        
        // Set target angle for smooth rotation
        this.state.targetAngle = Math.atan2(direction.x, direction.z);
    }

    meowIfHungry() {
        const now = Date.now();
        if (now - this.lastMeowTime > 5000) { // Meow every 5 seconds when hungry
            this.playMeowSound();
            this.lastMeowTime = now;
            this.showMeow();
        }
    }

    playMeowSound() {
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
        if (!this.state.isEating) {
            this.state.isEating = true;
            // Start eating animation or visual feedback
            
            // Increase hunger while eating
            const eatInterval = setInterval(() => {
                this.state.hunger = Math.min(100, this.state.hunger + 5);
                if (this.state.hunger >= 100 || !bowl.hasFood()) {
                    clearInterval(eatInterval);
                    this.state.isEating = false;
                    this.state.targetBowl = null;
                }
            }, 500); // Eat every 0.5 seconds
        }
    }

    onBowlFilled(bowl) {
        this.knownBowlsWithFood.add(bowl.id);
    }
}
