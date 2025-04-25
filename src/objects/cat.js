import * as THREE from 'three';

export class Cat {
    constructor(scene, initialPosition = new THREE.Vector3(0, 0, 0)) {
        this.scene = scene;
        this.position = initialPosition;
        
        // Cat state
        this.hunger = 0;     // 0-100
        this.anger = 0;      // 0-100
        this.targetPosition = null;
        
        // Movement parameters
        this.maxSpeed = 1.5;          // Reduced max speed for more control
        this.currentSpeed = 0;
        this.rotationSpeed = 2.0;     // Radians per second
        this.acceleration = 2.0;
        this.deceleration = 4.0;
        this.isRotating = false;      // Track if we're currently rotating
        this.facingAngle = 0;         // Current facing angle
        this.targetAngle = 0;         // Target rotation angle
        
        // Collision parameters
        this.bodyRadius = 0.2;        // Collision radius for the cat
        this.raycaster = new THREE.Raycaster();
        this.collisionRays = 8;       // Number of rays to check for collision
        
        // Animation
        this.tailWag = 0;
        this.walkCycle = 0;
        
        // Create and add to scene
        this.createCatModel();
        this.scene.add(this.model);
        this.updatePosition();
    }
    
    createCatModel() {
        this.model = new THREE.Group();
        
        // Materials - simple, flat colors for low-poly look
        const orangeMaterial = new THREE.MeshToonMaterial({ 
            color: 0xFFA500,
            flatShading: true 
        });
        const whiteMaterial = new THREE.MeshToonMaterial({ 
            color: 0xFFFFFF,
            flatShading: true 
        });
        const blackMaterial = new THREE.MeshToonMaterial({ 
            color: 0x000000,
            flatShading: true 
        });
        
        // Create a center point for the cat
        this.centerPoint = new THREE.Group();
        this.model.add(this.centerPoint);
        
        // Rotate the center point 90 degrees to align with movement direction
        this.centerPoint.rotation.y = -Math.PI / 2;
        
        // Body - boxy and cute
        const bodyGeometry = new THREE.BoxGeometry(0.4, 0.25, 0.25);
        this.body = new THREE.Mesh(bodyGeometry, orangeMaterial);
        this.body.position.y = 0.2;
        
        // Move all parts relative to center point
        this.centerPoint.position.set(0, 0, 0);
        
        // Add body to center point
        this.centerPoint.add(this.body);
        
        // Head - cube with slight adjustments
        const headGeometry = new THREE.BoxGeometry(0.25, 0.25, 0.25);
        this.head = new THREE.Mesh(headGeometry, orangeMaterial);
        this.head.position.set(0.2, 0.32, 0);
        this.centerPoint.add(this.head);
        
        // Eyes - simple black boxes, positioned closer to face
        const eyeGeometry = new THREE.BoxGeometry(0.05, 0.05, 0.05);
        const leftEye = new THREE.Mesh(eyeGeometry, blackMaterial);
        const rightEye = new THREE.Mesh(eyeGeometry, blackMaterial);
        
        // Position eyes on the face of the head cube
        leftEye.position.set(0.32, 0.34, 0.08);  // Moved closer to face
        rightEye.position.set(0.32, 0.34, -0.08); // Moved closer to face
        leftEye.scale.set(0.4, 0.8, 1);  // Make eyes more oval-shaped
        rightEye.scale.set(0.4, 0.8, 1);
        
        // Ears - triangular prisms
        const earGeometry = new THREE.ConeGeometry(0.05, 0.1, 4);
        this.leftEar = new THREE.Mesh(earGeometry, orangeMaterial);
        this.rightEar = new THREE.Mesh(earGeometry.clone(), orangeMaterial);
        this.leftEar.position.set(0.3, 0.45, 0.08);
        this.rightEar.position.set(0.3, 0.45, -0.08);
        this.leftEar.rotation.x = -0.3;
        this.rightEar.rotation.x = 0.3;
        
        // Tail - few segments for low-poly look
        this.tailSegments = [];
        const segmentCount = 4; // Fewer segments for low-poly
        const tailGeometry = new THREE.BoxGeometry(0.1, 0.06, 0.06);
        
        for (let i = 0; i < segmentCount; i++) {
            const segment = new THREE.Mesh(tailGeometry, orangeMaterial);
            segment.position.set(
                -0.2 - (i * 0.08),
                0.2 + Math.sin(i * 0.5) * 0.05,
                0
            );
            this.tailSegments.push(segment);
        }
        
        // Legs - make them visible below body
        const legGeometry = new THREE.BoxGeometry(0.08, 0.2, 0.08); // Make legs longer
        const pawGeometry = new THREE.BoxGeometry(0.09, 0.04, 0.1);
        
        this.legs = [];
        const legPositions = [
            // Front legs - at corners of the body
            [0.15, 0, 0.15],    // Front Left
            [0.15, 0, -0.15],   // Front Right
            // Back legs - at corners of the body
            [-0.15, 0, 0.15],   // Back Left
            [-0.15, 0, -0.15]   // Back Right
        ];
        
        legPositions.forEach(pos => {
            const legGroup = new THREE.Group();
            const leg = new THREE.Mesh(legGeometry, orangeMaterial);
            const paw = new THREE.Mesh(pawGeometry, whiteMaterial);
            
            // Position legs to extend below body
            leg.position.y = 0.1;  // Half of leg height
            paw.position.y = -0.1; // Bottom of leg
            
            legGroup.add(leg);
            legGroup.add(paw);
            legGroup.position.set(...pos);
            this.legs.push(legGroup);
        });
        
        // Adjust other parts to match new body height
        this.head.position.set(0.2, 0.32, 0);
        this.leftEar.position.set(0.2, 0.5, 0.08);
        this.rightEar.position.set(0.2, 0.5, -0.08);
        
        // Adjust chest position
        const chestGeometry = new THREE.BoxGeometry(0.2, 0.15, 0.2);
        const chest = new THREE.Mesh(chestGeometry, whiteMaterial);
        chest.position.set(0.1, 0.18, 0);
        
        // Adjust tail position
        this.tailSegments.forEach((segment, i) => {
            segment.position.set(
                -0.2 - (i * 0.08),
                0.25 + Math.sin(i * 0.5) * 0.05,
                0
            );
        });
        
        // Add everything to the centerPoint instead of model directly
        this.centerPoint.add(chest);
        this.centerPoint.add(leftEye);
        this.centerPoint.add(rightEye);
        this.centerPoint.add(this.leftEar);
        this.centerPoint.add(this.rightEar);
        this.tailSegments.forEach(segment => this.centerPoint.add(segment));
        this.legs.forEach(leg => this.centerPoint.add(leg));
        
        // Shadows
        this.model.traverse((object) => {
            if (object.isMesh) {
                object.castShadow = true;
                object.receiveShadow = true;
            }
        });
    }
    
    updatePosition() {
        this.model.position.copy(this.position);
    }
    
    checkCollision(position, direction) {
        const rayAngles = [];
        const angleStep = (2 * Math.PI) / this.collisionRays;
        
        // Create rays in a circle around the cat
        for (let i = 0; i < this.collisionRays; i++) {
            rayAngles.push(i * angleStep);
        }
        
        let collision = false;
        let collisionNormal = new THREE.Vector3();
        const minDistance = this.bodyRadius;
        
        // Get all collidable objects from the scene
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
        
        // Check collisions in all directions
        for (const angle of rayAngles) {
            const rayDirection = new THREE.Vector3(
                Math.cos(angle),
                0,
                Math.sin(angle)
            );
            
            this.raycaster.set(position, rayDirection);
            const intersects = this.raycaster.intersectObjects(collidableObjects, true);
            
            if (intersects.length > 0 && intersects[0].distance < minDistance) {
                collision = true;
                collisionNormal.add(intersects[0].face.normal);
            }
        }
        
        // If there's a collision, normalize the average normal vector
        if (collision) {
            collisionNormal.normalize();
        }
        
        return { collision, normal: collisionNormal };
    }
    
    moveTowards(target, deltaTime) {
        if (!target) return false;

        const toTarget = target.clone().sub(this.position);
        const distance = toTarget.length();
        
        // Stop if we're close enough
        if (distance < 0.1) {
            this.currentSpeed = Math.max(0, this.currentSpeed - this.deceleration * deltaTime);
            if (this.currentSpeed < 0.01) {
                this.currentSpeed = 0;
                return true;
            }
        }

        // Calculate target angle
        this.targetAngle = Math.atan2(toTarget.x, toTarget.z);
        
        // Calculate angle difference
        let angleDiff = this.targetAngle - this.facingAngle;
        while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
        while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
        
        // Determine if we need to rotate
        this.isRotating = Math.abs(angleDiff) > 0.1;
        
        if (this.isRotating) {
            // Rotate towards target
            const rotationStep = Math.sign(angleDiff) * Math.min(Math.abs(angleDiff), this.rotationSpeed * deltaTime);
            this.facingAngle += rotationStep;
            
            // Normalize facing angle
            while (this.facingAngle > Math.PI) this.facingAngle -= Math.PI * 2;
            while (this.facingAngle < -Math.PI) this.facingAngle += Math.PI * 2;
            
            // Apply rotation to the model
            this.model.rotation.y = this.facingAngle;
            
            // Slow down while rotating
            this.currentSpeed = Math.max(0, this.currentSpeed - this.deceleration * deltaTime);
        } else {
            // Only move forward when facing the right direction
            this.currentSpeed = Math.min(
                this.maxSpeed,
                this.currentSpeed + this.acceleration * deltaTime
            );
        }

        // Move forward in facing direction
        if (this.currentSpeed > 0) {
            const movement = new THREE.Vector3(
                Math.sin(this.facingAngle),
                0,
                Math.cos(this.facingAngle)
            ).multiplyScalar(this.currentSpeed * deltaTime);
            
            // Check for collisions before moving
            const nextPosition = this.position.clone().add(movement);
            const collisionCheck = this.checkCollision(nextPosition, movement.normalize());
            
            if (!collisionCheck.collision) {
                // No collision, move normally
                this.position.copy(nextPosition);
            } else {
                // Handle collision by sliding along the surface
                const normal = collisionCheck.normal;
                const slide = movement.clone()
                    .sub(normal.multiplyScalar(movement.dot(normal)))
                    .multiplyScalar(0.5); // Reduce sliding speed
                
                // Check if sliding movement is safe
                const slidePosition = this.position.clone().add(slide);
                const slideCollision = this.checkCollision(slidePosition, slide.normalize());
                
                if (!slideCollision.collision) {
                    this.position.copy(slidePosition);
                }
                
                // Find new target if we're stuck
                if (this.currentSpeed < 0.1) {
                    this.targetPosition = this.findNewTarget();
                }
            }
            
            this.updatePosition();
        }

        // Add slight head tilt during turns
        const tiltAmount = this.isRotating ? (angleDiff / Math.PI) * 0.1 : 0;
        this.head.rotation.z = -tiltAmount;

        return false;
    }
    
    findNewTarget() {
        // Get room dimensions from scene
        const roomWidth = 6;  // Default room width
        const roomLength = 8; // Default room length
        
        // Add some margin to avoid getting too close to walls
        const margin = 0.5;
        
        // Generate random position within room bounds
        const x = (Math.random() * (roomWidth - 2 * margin)) - (roomWidth/2 - margin);
        const z = (Math.random() * (roomLength - 2 * margin)) - (roomLength/2 - margin);
        
        return new THREE.Vector3(x, 0, z);
    }
    
    animateWalking(deltaTime) {
        const speedRatio = this.currentSpeed / this.maxSpeed;
        const cycleSpeed = 5 * speedRatio;
        
        // Update walk cycle
        this.walkCycle += deltaTime * cycleSpeed;
        
        // Leg animation
        this.legs.forEach((leg, index) => {
            const offset = index * Math.PI / 2;
            const height = Math.sin(this.walkCycle + offset) * 0.05 * speedRatio;
            leg.position.y = Math.max(0, height);
        });
        
        // Body bob
        const bodyBob = Math.sin(this.walkCycle * 2) * 0.01 * speedRatio;
        this.body.position.y = 0.2 + bodyBob;
        this.head.position.y = 0.32 + bodyBob;
        
        // Tail animation
        this.tailWag += deltaTime * (1 + speedRatio * 2);
        this.tailSegments.forEach((segment, index) => {
            const baseWag = Math.sin(this.tailWag - index * 0.5);
            const wagAmount = 0.1 + speedRatio * 0.2;
            segment.rotation.y = baseWag * wagAmount;
        });
    }
    
    update(deltaTime) {
        // Clamp deltaTime to prevent large jumps
        const clampedDelta = Math.min(deltaTime, 0.1);
        
        // Update states
        this.hunger += clampedDelta;
        if (this.hunger > 100) this.hunger = 100;
        this.anger = Math.max(0, (this.hunger - 50) * 2);
        
        // Random movement
        if (!this.targetPosition && Math.random() < 0.01) { // Reduced random movement frequency
            this.targetPosition = this.findNewTarget();
        }
        
        // Move if we have a target
        if (this.targetPosition) {
            const reached = this.moveTowards(this.targetPosition, clampedDelta);
            if (reached) {
                this.targetPosition = null;
            }
        }

        // Animate based on movement state
        if (this.currentSpeed > 0) {
            this.animateWalking(clampedDelta);
        } else {
            // Idle animations
            this.tailWag += clampedDelta;
            this.tailSegments.forEach((segment, index) => {
                const wagAmount = 0.1; // Reduced tail movement when idle
                segment.rotation.y = Math.sin(this.tailWag - index * 0.5) * wagAmount;
            });
        }
    }
    
    feed() {
        this.hunger = Math.max(0, this.hunger - 30);
        this.anger = Math.max(0, this.anger - 20);
        return true;
    }
}
