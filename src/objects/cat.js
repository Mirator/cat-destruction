import * as THREE from 'three';

// Cat configuration
const CAT_DIMENSIONS = {
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
};

const CAT_MATERIALS = {
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
};

const MOVEMENT_CONFIG = {
    maxSpeed: 1.5,
    rotationSpeed: 2.0,
    acceleration: 2.0,
    deceleration: 4.0,
    collisionRadius: 0.2,
    collisionRays: 8,
    turnThreshold: 0.1,
    minSpeedThreshold: 0.01,
    bowlDetectionRadius: 3.0,  // How far the cat can detect food bowls
    bowlReachRadius: 0.2      // How close the cat needs to be to eat from bowl
};

export class Cat {
    constructor(scene, initialPosition = new THREE.Vector3(0, 0, 0)) {
        this.scene = scene;
        this.position = initialPosition;
        
        // State
        this.state = {
            hunger: 50,        // Start somewhat hungry
            anger: 0,
            targetPosition: null,
            currentSpeed: 0,
            isRotating: false,
            facingAngle: 0,
            targetAngle: 0,
            targetBowl: null,  // Reference to bowl being targeted
            isEating: false,
            lastBowlCheck: 0   // Time tracker for bowl detection
        };
        
        // Animation state
        this.animation = {
            tailWag: 0,
            walkCycle: 0
        };
        
        // Setup collision detection
        this.raycaster = new THREE.Raycaster();
        
        this.createCatModel();
        this.scene.add(this.model);
        this.updatePosition();
    }

    createMaterials() {
        return {
            orange: new THREE.MeshToonMaterial(CAT_MATERIALS.body),
            white: new THREE.MeshToonMaterial(CAT_MATERIALS.white),
            black: new THREE.MeshToonMaterial(CAT_MATERIALS.black)
        };
    }

    createCatModel() {
        this.model = new THREE.Group();
        const materials = this.createMaterials();
        
        // Create center point for better rotation
        this.centerPoint = new THREE.Group();
        this.model.add(this.centerPoint);
        this.centerPoint.rotation.y = -Math.PI / 2;
        
        // Create body parts
        this.createBody(materials);
        this.createHead(materials);
        this.createTail(materials);
        this.createLegs(materials);
        
        // Setup shadows
        this.model.traverse((object) => {
            if (object.isMesh) {
                object.castShadow = true;
                object.receiveShadow = true;
            }
        });
    }

    createBody(materials) {
        const dims = CAT_DIMENSIONS.body;
        const bodyGeometry = new THREE.BoxGeometry(dims.width, dims.height, dims.depth);
        this.body = new THREE.Mesh(bodyGeometry, materials.orange);
        this.body.position.y = dims.height;
        this.centerPoint.add(this.body);

        // Add chest
        const chestGeometry = new THREE.BoxGeometry(0.2, 0.15, 0.2);
        const chest = new THREE.Mesh(chestGeometry, materials.white);
        chest.position.set(0.1, 0.18, 0);
        this.centerPoint.add(chest);
    }

    createHead(materials) {
        const dims = CAT_DIMENSIONS.head;
        const headGeometry = new THREE.BoxGeometry(dims.size, dims.size, dims.size);
        this.head = new THREE.Mesh(headGeometry, materials.orange);
        this.head.position.set(0.2, dims.heightOffset, 0);
        this.centerPoint.add(this.head);

        // Add eyes
        const eyeDims = CAT_DIMENSIONS.eye;
        const eyeGeometry = new THREE.BoxGeometry(eyeDims.size, eyeDims.size, eyeDims.size);
        [-1, 1].forEach(side => {
            const eye = new THREE.Mesh(eyeGeometry, materials.black);
            eye.position.set(0.32, eyeDims.heightOffset, eyeDims.spacing * side);
            eye.scale.set(0.4, 0.8, 1);
            this.centerPoint.add(eye);
        });

        // Add ears
        const earDims = CAT_DIMENSIONS.ear;
        const earGeometry = new THREE.ConeGeometry(earDims.radius, earDims.height, 4);
        [-1, 1].forEach(side => {
            const ear = new THREE.Mesh(earGeometry, materials.orange);
            ear.position.set(0.2, earDims.heightOffset, earDims.spacing * side);
            ear.rotation.x = earDims.tiltAngle * side;
            this.centerPoint.add(ear);
        });
    }

    createTail(materials) {
        const dims = CAT_DIMENSIONS.tail;
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
        const legDims = CAT_DIMENSIONS.leg;
        const pawDims = CAT_DIMENSIONS.paw;
        const legGeometry = new THREE.BoxGeometry(legDims.width, legDims.height, legDims.width);
        const pawGeometry = new THREE.BoxGeometry(pawDims.width, pawDims.height, pawDims.depth);

        this.legs = [];
        const positions = [
            [legDims.spacing.x, 0, legDims.spacing.z],    // Front Left
            [legDims.spacing.x, 0, -legDims.spacing.z],   // Front Right
            [-legDims.spacing.x, 0, legDims.spacing.z],   // Back Left
            [-legDims.spacing.x, 0, -legDims.spacing.z]   // Back Right
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

    checkCollision(position, direction) {
        const rayAngles = [];
        const angleStep = (2 * Math.PI) / MOVEMENT_CONFIG.collisionRays;
        
        for (let i = 0; i < MOVEMENT_CONFIG.collisionRays; i++) {
            rayAngles.push(i * angleStep);
        }
        
        let collision = false;
        let collisionNormal = new THREE.Vector3();
        
        // Get collidable objects
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
        
        // Check collisions
        for (const angle of rayAngles) {
            const rayDirection = new THREE.Vector3(
                Math.cos(angle),
                0,
                Math.sin(angle)
            );
            
            this.raycaster.set(position, rayDirection);
            const intersects = this.raycaster.intersectObjects(collidableObjects, true);
            
            if (intersects.length > 0 && intersects[0].distance < MOVEMENT_CONFIG.collisionRadius) {
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
        
        // Handle stopping
        if (distance < 0.1) {
            this.state.currentSpeed = Math.max(0, this.state.currentSpeed - MOVEMENT_CONFIG.deceleration * deltaTime);
            if (this.state.currentSpeed < MOVEMENT_CONFIG.minSpeedThreshold) {
                this.state.currentSpeed = 0;
                return true;
            }
        }

        // Update rotation
        this.state.targetAngle = Math.atan2(toTarget.x, toTarget.z);
        let angleDiff = this.state.targetAngle - this.state.facingAngle;
        while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
        while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
        
        this.state.isRotating = Math.abs(angleDiff) > MOVEMENT_CONFIG.turnThreshold;
        
        if (this.state.isRotating) {
            const rotationStep = Math.sign(angleDiff) * 
                Math.min(Math.abs(angleDiff), MOVEMENT_CONFIG.rotationSpeed * deltaTime);
            this.state.facingAngle += rotationStep;
            
            while (this.state.facingAngle > Math.PI) this.state.facingAngle -= Math.PI * 2;
            while (this.state.facingAngle < -Math.PI) this.state.facingAngle += Math.PI * 2;
            
            this.model.rotation.y = this.state.facingAngle;
            this.state.currentSpeed = Math.max(0, this.state.currentSpeed - MOVEMENT_CONFIG.deceleration * deltaTime);
        } else {
            this.state.currentSpeed = Math.min(
                MOVEMENT_CONFIG.maxSpeed,
                this.state.currentSpeed + MOVEMENT_CONFIG.acceleration * deltaTime
            );
        }

        // Move forward
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
                const normal = collisionCheck.normal;
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
            
            this.updatePosition();
        }

        // Add head tilt during turns
        const tiltAmount = this.state.isRotating ? (angleDiff / Math.PI) * 0.1 : 0;
        this.head.rotation.z = -tiltAmount;

        return false;
    }

    animateWalking(deltaTime) {
        const speedRatio = this.state.currentSpeed / MOVEMENT_CONFIG.maxSpeed;
        const cycleSpeed = 5 * speedRatio;
        
        this.animation.walkCycle += deltaTime * cycleSpeed;
        
        // Animate legs
        this.legs.forEach((leg, index) => {
            const offset = index * Math.PI / 2;
            const height = Math.sin(this.animation.walkCycle + offset) * 0.05 * speedRatio;
            leg.position.y = Math.max(0, height);
        });
        
        // Animate body bob
        const bodyBob = Math.sin(this.animation.walkCycle * 2) * 0.01 * speedRatio;
        this.body.position.y = CAT_DIMENSIONS.body.height + bodyBob;
        this.head.position.y = CAT_DIMENSIONS.head.heightOffset + bodyBob;
        
        // Animate tail
        this.animation.tailWag += deltaTime * (1 + speedRatio * 2);
        this.tailSegments.forEach((segment, index) => {
            const baseWag = Math.sin(this.animation.tailWag - index * 0.5);
            const wagAmount = 0.1 + speedRatio * 0.2;
            segment.rotation.y = baseWag * wagAmount;
        });
    }

    findNewTarget() {
        const roomWidth = 6;
        const roomLength = 8;
        const margin = 0.5;
        
        const x = (Math.random() * (roomWidth - 2 * margin)) - (roomWidth/2 - margin);
        const z = (Math.random() * (roomLength - 2 * margin)) - (roomLength/2 - margin);
        
        return new THREE.Vector3(x, 0, z);
    }

    updatePosition() {
        this.model.position.copy(this.position);
    }

    detectFoodBowl() {
        if (!this.state.targetBowl) {
            // Find all food bowls in the scene
            let nearestBowl = null;
            let nearestDistance = Infinity;

            this.scene.traverse((object) => {
                if (object.name === 'food_bowl') {
                    const bowl = object.parent;
                    if (bowl && bowl.hasFood && bowl.hasFood()) {
                        const distance = this.position.distanceTo(bowl.position);
                        if (distance < MOVEMENT_CONFIG.bowlDetectionRadius && distance < nearestDistance) {
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
            if (distance < MOVEMENT_CONFIG.bowlReachRadius) {
                const food = this.state.targetBowl.currentFood;
                const nutrition = food.consume();
                this.state.hunger = Math.max(0, this.state.hunger - nutrition);
                this.state.anger = Math.max(0, this.state.anger - nutrition/2);
                this.state.targetBowl = null;
                this.state.targetPosition = null;
                this.state.isEating = true;
                return true;
            }
        }
        return false;
    }

    update(deltaTime) {
        const clampedDelta = Math.min(deltaTime, 0.1);
        
        // Update states
        this.state.hunger += clampedDelta * 2; // Increase hunger over time
        if (this.state.hunger > 100) this.state.hunger = 100;
        this.state.anger = Math.max(0, (this.state.hunger - 50) * 2);
        
        // Check for food bowls periodically
        this.state.lastBowlCheck += clampedDelta;
        if (this.state.lastBowlCheck > 1.0) { // Check every second
            this.state.lastBowlCheck = 0;
            if (this.state.hunger > 30) { // Only look for food if somewhat hungry
                this.detectFoodBowl();
            }
        }
        
        // Check if we've reached food bowl
        if (this.checkBowlReach()) {
            // Stay still briefly while "eating"
            setTimeout(() => {
                this.state.isEating = false;
            }, 1000);
        }
        
        // Random movement only if not targeting food and not eating
        if (!this.state.targetPosition && !this.state.isEating && Math.random() < 0.01) {
            this.state.targetPosition = this.findNewTarget();
        }
        
        // Move if we have a target and aren't eating
        if (this.state.targetPosition && !this.state.isEating) {
            const reached = this.moveTowards(this.state.targetPosition, clampedDelta);
            if (reached) {
                this.state.targetPosition = null;
            }
        }

        // Animate based on movement state
        if (this.state.currentSpeed > 0) {
            this.animateWalking(clampedDelta);
        } else {
            // Idle animations
            this.animation.tailWag += clampedDelta;
            this.tailSegments.forEach((segment, index) => {
                const wagAmount = 0.1;
                segment.rotation.y = Math.sin(this.animation.tailWag - index * 0.5) * wagAmount;
            });
        }
    }
}
