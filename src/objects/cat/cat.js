import * as THREE from 'three';
import { Bowl } from '../furniture/bowl.js';
import { CAT_CONFIG, ACTIVITY_TYPES } from '../../config/GameConfig.js';
import { CatState } from '../../state/CatState.js';
import { CatAnimator } from './CatAnimator.js';
import { CatUIManager } from './CatUIManager.js';
import { CatBehavior } from './CatBehavior.js';

export class Cat {
    constructor(scene, initialPosition = new THREE.Vector3(0, 0, 0), playerState = null) {
        this.scene = scene;
        this.position = initialPosition;
        // AudioContext will be created after user gesture
        this.audioContext = null;
        this.audioReady = false;
        this._setupAudioContextOnUserGesture();
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

        this.behavior = new CatBehavior(this, playerState);
        this.blockedFrames = 0;
        this.waypoints = [];
    }

    _setupAudioContextOnUserGesture() {
        const resumeAudio = () => {
            if (!this.audioContext) {
                this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            }
            if (this.audioContext.state === 'suspended') {
                this.audioContext.resume();
            }
            this.audioReady = true;
            window.removeEventListener('pointerdown', resumeAudio);
            window.removeEventListener('keydown', resumeAudio);
        };
        window.addEventListener('pointerdown', resumeAudio);
        window.addEventListener('keydown', resumeAudio);
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
        this.setupShadows();
    }

    createMaterials() {
        return {
            orange: new THREE.MeshToonMaterial({ color: CAT_CONFIG.materials.body.color }),
            white: new THREE.MeshToonMaterial({ color: CAT_CONFIG.materials.white.color }),
            black: new THREE.MeshToonMaterial({ color: CAT_CONFIG.materials.black.color })
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

    setupShadows() {
        this.model.traverse((object) => {
            if (object.isMesh) {
                object.castShadow = true;
                object.receiveShadow = true;
            }
        });
    }

    checkEmptyBowl() {
        if (!this.state.targetBowl) return false;
        
        const distance = this.position.distanceTo(this.state.targetBowl.position);
        if (distance < CAT_CONFIG.movement.bowlReachRadius) {
            if (!this.state.targetBowl.hasFood()) {
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
                        if ((this.state.hunger >= CAT_CONFIG.hunger.thresholds.veryHungry || bowl.hasFood()) && distance < nearestDistance) {
                            nearestBowl = bowl;
                            nearestDistance = distance;
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
                (object.name.includes('wall') && !this._isAtHole(position, object)) ||
                object.name.includes('bed')
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
        // If no waypoints or target changed, rebuild waypoints
        if (!this.waypoints || this.waypoints.length === 0 || !this.waypoints[this.waypoints.length-1].equals(target)) {
            this.setTargetPosition(target);
        }
        const toTarget = this.state.movement.targetPosition ? this.state.movement.targetPosition.clone().sub(this.position) : new THREE.Vector3();
        const distance = toTarget.length();
        if (distance < 0.1) {
            this.state.movement.currentSpeed = Math.max(0, this.state.movement.currentSpeed - CAT_CONFIG.movement.deceleration * deltaTime);
            if (this.state.movement.currentSpeed < CAT_CONFIG.movement.minSpeedThreshold) {
                this.state.movement.currentSpeed = 0;
                return true;
            }
        }
        this.updateRotation(toTarget, deltaTime);
        this.updateMovement(deltaTime);
        return false;
    }

    _moveTowardsBase(target, deltaTime) {
        const toTarget = target.clone().sub(this.position);
        const distance = toTarget.length();
        if (distance < 0.1) {
            this.state.movement.currentSpeed = Math.max(0, this.state.movement.currentSpeed - CAT_CONFIG.movement.deceleration * deltaTime);
            if (this.state.movement.currentSpeed < CAT_CONFIG.movement.minSpeedThreshold) {
                this.state.movement.currentSpeed = 0;
                return true;
            }
        }
        this.updateRotation(toTarget, deltaTime);
        this.updateMovement(deltaTime);
        return false;
    }

    updateRotation(toTarget, deltaTime) {
        this.state.movement.targetAngle = Math.atan2(toTarget.x, toTarget.z);
        let angleDiff = this.state.movement.targetAngle - this.state.movement.facingAngle;
        while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
        while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
        // Snap facing angle to target when close
        if (toTarget.length() < 2 && Math.abs(angleDiff) < 0.2) {
            this.state.movement.facingAngle = this.state.movement.targetAngle;
            this.model.rotation.y = this.state.movement.facingAngle;
            angleDiff = 0;
            this.state.movement.isRotating = false;
        }
        this.state.movement.isRotating = Math.abs(angleDiff) > CAT_CONFIG.movement.turnThreshold;
        if (this.state.movement.isRotating) {
            const rotationStep = Math.sign(angleDiff) * 
                Math.min(Math.abs(angleDiff), CAT_CONFIG.movement.rotationSpeed * deltaTime);
            this.state.movement.facingAngle += rotationStep;
            while (this.state.movement.facingAngle > Math.PI) this.state.movement.facingAngle -= Math.PI * 2;
            while (this.state.movement.facingAngle < -Math.PI) this.state.movement.facingAngle += Math.PI * 2;
            this.model.rotation.y = this.state.movement.facingAngle;
            this.state.movement.currentSpeed = Math.max(0, this.state.movement.currentSpeed - CAT_CONFIG.movement.deceleration * deltaTime);
        } else {
            this.state.movement.currentSpeed = Math.min(
                CAT_CONFIG.movement.maxSpeed,
                this.state.movement.currentSpeed + CAT_CONFIG.movement.acceleration * deltaTime
            );
        }
        const tiltAmount = this.state.movement.isRotating ? (angleDiff / Math.PI) * 0.1 : 0;
        this.head.rotation.z = -tiltAmount;
    }

    updateMovement(deltaTime) {
        window._catCollisionLoggedThisFrame = false;
        const angleDiff = Math.abs(this.state.movement.targetAngle - this.state.movement.facingAngle);
        if (angleDiff > 0.3) {
            this.state.movement.currentSpeed = 0;
            return;
        }
        // Use waypoints if present
        let targetPos = (this.waypoints && this.waypoints.length > 0) ? this.waypoints[0] : this.state.movement.targetPosition;
        if (!targetPos) return;
        const toTarget = targetPos.clone().sub(this.position);
        const distance = toTarget.length();
        if (distance < 0.15) {
            // Arrived at this waypoint
            if (this.waypoints && this.waypoints.length > 0) {
                this.waypoints.shift();
                if (this.waypoints.length > 0) {
                    this.state.movement.targetPosition = this.waypoints[0];
                } else {
                    this.state.movement.targetPosition = null;
                }
            }
            this.blockedFrames = 0;
            return;
        }
        if (this.state.movement.currentSpeed > 0) {
            const movement = new THREE.Vector3(
                Math.sin(this.state.movement.facingAngle),
                0,
                Math.cos(this.state.movement.facingAngle)
            ).multiplyScalar(this.state.movement.currentSpeed * deltaTime);
            const nextPosition = this.position.clone().add(movement);
            const collisionCheck = this.checkCollision(nextPosition, movement.normalize());
            if (collisionCheck.collision) {
                this.blockedFrames++;
                if (this.blockedFrames > 20 && (!this.waypoints || this.waypoints.length <= 1)) {
                    // Pick a random waypoint near the target
                    const angle = Math.random() * Math.PI * 2;
                    const radius = 0.5 + Math.random() * 0.5;
                    const offset = new THREE.Vector3(Math.cos(angle), 0, Math.sin(angle)).multiplyScalar(radius);
                    this.waypoints = [targetPos.clone().add(offset)];
                    this.state.movement.targetPosition = this.waypoints[0];
                    this.blockedFrames = 0;
                    return;
                }
            } else {
                this.position.copy(nextPosition);
                this.blockedFrames = 0;
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
        if (this.state.movement.currentSpeed < 0.1) {
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
        if (this.state.hunger >= CAT_CONFIG.hunger.thresholds.interested && !this.state.food.isEating) {
        }
        this.state.updateFood({
            heardFood: true,
            heardFoodBowl: bowl,
            lastFoodSound: Date.now()
        });
        this.state.setActivity(ACTIVITY_TYPES.HEARD_FOOD);
        if (this.state.hunger >= CAT_CONFIG.hunger.thresholds.interested && !this.state.food.isEating) {
            this.state.updateFood({
                targetBowl: bowl
            });
            this.state.updateMovement({
                targetPosition: bowl.position.clone()
            });
            this.state.setActivity(ACTIVITY_TYPES.GOING_TO_BOWL);
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
                    if (distance < minDistance) {
                        minDistance = distance;
                        nearestBowl = bowl;
                    }
                }
            }
        });

        return nearestBowl;
    }

    moveTowardsBowl(bowl) {
        if (!bowl) return;
        this.state.updateFood({
            targetBowl: bowl
        });
        this.state.updateMovement({
            targetPosition: bowl.position.clone()
        });
        this.state.setActivity(ACTIVITY_TYPES.GOING_TO_BOWL);
        
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
            this.state.setActivity(ACTIVITY_TYPES.MEOWING);
        }
    }

    playMeowSound() {
        if (!this.audioReady) return;
        if (!this.audioContext) {
            try {
                this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            } catch (e) {
                // Could not create audio context, skip sound
                return;
            }
        }
        if (!this.audioContext) return;
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
        if (!this.state.food.isEating && bowl.hasFood()) {
            this.state.food.isEating = true;
            this.state.setActivity(ACTIVITY_TYPES.EATING);

            // Move cat to 10cm in front of bowl and face it
            const direction = bowl.position.clone().sub(this.position);
            direction.y = 0;
            direction.normalize();
            const eatDistance = 0.1; // 10cm
            const eatPosition = bowl.position.clone().sub(direction.clone().multiplyScalar(eatDistance));
            this.position.copy(eatPosition);
            this.updatePosition();
            this.state.movement.facingAngle = Math.atan2(direction.x, direction.z);
            this.model.rotation.y = this.state.movement.facingAngle;

            // Eat as long as there is food in the bowl
            const cat = this;
            const food = bowl.currentFood;
            const totalTime = 10000; // 10 seconds to eat full bowl
            const intervalMs = 50;
            const steps = totalTime / intervalMs;
            const fillPerStep = 1 / steps;
            const hungerPerStep = cat.state.hunger / steps;
            const interval = setInterval(() => {
                if (!cat.state.food.isEating || !bowl.hasFood()) {
                    clearInterval(interval);
                    cat.state.food.isEating = false;
                    cat.state.food.targetBowl = null;
                    if (bowl.fill <= 0) {
                        if (food) food.isConsumed = true;
                        bowl.currentFood = null;
                        bowl.targetFill = 0;
                        cat.state.setHunger(0);
                    }
                    return;
                }
                // Reduce bowl fill and hunger
                bowl.targetFill = Math.max(0, bowl.targetFill - fillPerStep);
                cat.state.setHunger(Math.max(0, cat.state.hunger - hungerPerStep));
                cat.animator.animateEating(0.016);
            }, intervalMs);
        }
    }

    onBowlFilled(bowl) {
        this.knownBowlsWithFood.add(bowl.id);
    }

    // Helper: Determine which room the cat is in
    getCurrentRoom() {
        if (!this.scene.userData.roomManager) return null;
        const roomManager = this.scene.userData.roomManager;
        // Assume only two rooms for now
        const room1 = roomManager.getRoom('room1');
        const room2 = roomManager.getRoom('room2');
        if (!room1 || !room2) return null;
        // Room boundaries
        const r1min = room1.position.x - CAT_CONFIG.room.width/2;
        const r1max = room1.position.x + CAT_CONFIG.room.width/2;
        const r2min = room2.position.x - CAT_CONFIG.room.width/2;
        const r2max = room2.position.x + CAT_CONFIG.room.width/2;
        if (this.position.x >= r1min && this.position.x < r1max) return room1;
        if (this.position.x >= r2min && this.position.x < r2max) return room2;
        return null;
    }

    // Helper: Get the center of the shared wall hole
    getSharedWallHoleCenter() {
        const roomManager = this.scene.userData.roomManager;
        if (!roomManager) return new THREE.Vector3(0, 0, 0);
        const room1 = roomManager.getRoom('room1');
        const room2 = roomManager.getRoom('room2');
        if (!room1 || !room2) return new THREE.Vector3(0, 0, 0);
        const wallX = (room1.position.x + room2.position.x) / 2;
        const wallZ = 0;
        return new THREE.Vector3(wallX, 0, wallZ);
    }

    // Helper: Check if two positions are in different rooms
    arePositionsInDifferentRooms(posA, posB) {
        const roomManager = this.scene.userData.roomManager;
        if (!roomManager) return false;
        const room1 = roomManager.getRoom('room1');
        const room2 = roomManager.getRoom('room2');
        if (!room1 || !room2) return false;
        const r1min = room1.position.x - CAT_CONFIG.room.width/2;
        const r1max = room1.position.x + CAT_CONFIG.room.width/2;
        const r2min = room2.position.x - CAT_CONFIG.room.width/2;
        const r2max = room2.position.x + CAT_CONFIG.room.width/2;
        const inRoom1A = posA.x >= r1min && posA.x < r1max;
        const inRoom2A = posA.x >= r2min && posA.x < r2max;
        const inRoom1B = posB.x >= r1min && posB.x < r1max;
        const inRoom2B = posB.x >= r2min && posB.x < r2max;
        return (inRoom1A && inRoom2B) || (inRoom2A && inRoom1B);
    }

    // When a new target is set, build the waypoints
    setTargetPosition(target) {
        // If already at target, do nothing
        if (this.position.distanceTo(target) < 0.1) return;
        // If changing rooms, go to hole first, then to target
        if (this.arePositionsInDifferentRooms(this.position, target)) {
            this.waypoints = [this.getSharedWallHoleCenter(), target.clone()];
        } else {
            this.waypoints = [target.clone()];
        }
        // Set the first as the current target
        this.state.movement.targetPosition = this.waypoints[0];
    }

    // Helper: check if position is at the hole in the wall
    _isAtHole(position, wallObject) {
        // Only for the shared wall
        if (!wallObject.name.includes('sharedWall')) return false;
        // Get wall and passage info
        const roomManager = this.scene.userData.roomManager;
        if (!roomManager) return false;
        const room1 = roomManager.getRoom('room1');
        const room2 = roomManager.getRoom('room2');
        if (!room1 || !room2) return false;
        // Wall is at x = (room1.x + room2.x)/2, z = 0
        const wallX = (room1.position.x + room2.position.x) / 2;
        const wallZ = 0;
        // Passage info: get from room1's neighbor connection
        let passageWidth = 1.2;
        let passageHeight = 2.2;
        if (room1.neighbors && room1.neighbors.east && room1.neighbors.east.passage) {
            passageWidth = room1.neighbors.east.passage.width || passageWidth;
            passageHeight = room1.neighbors.east.passage.height || passageHeight;
        }
        // Check if position is within the passage bounds (centered at wallX, wallZ)
        const dx = Math.abs(position.x - wallX);
        const dz = Math.abs(position.z - wallZ);
        // Only allow if within passage width (z) and close to wall (x)
        const withinZ = dz < passageWidth / 2;
        const closeToWall = dx < 0.12; // allow a small margin for wall thickness
        return withinZ && closeToWall;
    }
}
