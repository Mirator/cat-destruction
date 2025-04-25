import * as THREE from 'three';

export class PlayerController {
    constructor(camera, domElement) {
        this.camera = camera;
        this.domElement = domElement;
        
        // Movement state
        this.moveForward = false;
        this.moveBackward = false;
        this.moveLeft = false;
        this.moveRight = false;
        this.isCrouching = false;
        
        // Movement parameters
        this.speed = 2.5; // meters per second (average walking speed)
        this.standingHeight = 1.7; // player height when standing
        this.crouchingHeight = 1.0; // player height when crouching
        this.bodyRadius = 0.25; // collision radius
        
        // Current height (starts at standing height)
        this.height = this.standingHeight;
        
        // Player body parameters
        this.bodyHeight = 1.7; // Total height
        this.checkPoints = 3; // Number of points to check for collision
        
        // Mouse look parameters
        this.euler = new THREE.Euler(0, 0, 0, 'YXZ');
        this.mouseSensitivity = 0.002;
        
        // Velocity and movement
        this.velocity = new THREE.Vector3();
        this.direction = new THREE.Vector3();
        this.raycaster = new THREE.Raycaster();
        this.moveDirection = new THREE.Vector3();
        this.sidewaysDirection = new THREE.Vector3();
        
        // Bind methods
        this.onKeyDown = this.onKeyDown.bind(this);
        this.onKeyUp = this.onKeyUp.bind(this);
        this.onMouseMove = this.onMouseMove.bind(this);
        this.update = this.update.bind(this);
        
        // Setup controls
        this.setupPointerLock();
        this.addEventListeners();
    }
    
    setupPointerLock() {
        this.domElement.requestPointerLock = this.domElement.requestPointerLock ||
                                           this.domElement.mozRequestPointerLock ||
                                           this.domElement.webkitRequestPointerLock;
        
        document.exitPointerLock = document.exitPointerLock ||
                                 document.mozExitPointerLock ||
                                 document.webkitExitPointerLock;
                                 
        // Lock pointer on click
        this.domElement.addEventListener('click', () => {
            this.domElement.requestPointerLock();
        });
    }
    
    addEventListeners() {
        document.addEventListener('keydown', this.onKeyDown);
        document.addEventListener('keyup', this.onKeyUp);
        document.addEventListener('mousemove', this.onMouseMove);
    }
    
    removeEventListeners() {
        document.removeEventListener('keydown', this.onKeyDown);
        document.removeEventListener('keyup', this.onKeyUp);
        document.removeEventListener('mousemove', this.onMouseMove);
    }
    
    onKeyDown(event) {
        switch (event.code) {
            case 'ArrowUp':
            case 'KeyW':
                this.moveForward = true;
                break;
            case 'ArrowDown':
            case 'KeyS':
                this.moveBackward = true;
                break;
            case 'ArrowLeft':
            case 'KeyA':
                this.moveLeft = true;
                break;
            case 'ArrowRight':
            case 'KeyD':
                this.moveRight = true;
                break;
            case 'KeyC':
                // Toggle crouch state
                this.isCrouching = !this.isCrouching;
                this.speed = this.isCrouching ? 1.5 : 2.5; // Adjust speed based on stance
                break;
        }
    }
    
    onKeyUp(event) {
        switch (event.code) {
            case 'ArrowUp':
            case 'KeyW':
                this.moveForward = false;
                break;
            case 'ArrowDown':
            case 'KeyS':
                this.moveBackward = false;
                break;
            case 'ArrowLeft':
            case 'KeyA':
                this.moveLeft = false;
                break;
            case 'ArrowRight':
            case 'KeyD':
                this.moveRight = false;
                break;
        }
    }
    
    onMouseMove(event) {
        if (document.pointerLockElement === this.domElement) {
            this.euler.setFromQuaternion(this.camera.quaternion);
            
            this.euler.y -= event.movementX * this.mouseSensitivity;
            this.euler.x -= event.movementY * this.mouseSensitivity;
            
            // Limit vertical look angle
            this.euler.x = Math.max(-Math.PI/2, Math.min(Math.PI/2, this.euler.x));
            
            this.camera.quaternion.setFromEuler(this.euler);
        }
    }
    
    checkCollision(position, direction, collidableObjects) {
        // Define collision rays based on movement direction
        const rayDirections = [];
        
        // Add main movement direction ray
        rayDirections.push(direction.clone().normalize());
        
        // Add slightly angled rays for better corner detection
        const angle = Math.PI / 8; // 22.5 degrees
        const rotationMatrix = new THREE.Matrix4();
        
        rotationMatrix.makeRotationY(angle);
        rayDirections.push(direction.clone().normalize().applyMatrix4(rotationMatrix));
        
        rotationMatrix.makeRotationY(-angle);
        rayDirections.push(direction.clone().normalize().applyMatrix4(rotationMatrix));

        // Check collision at different heights of the player's body
        const heightPoints = [
            0.2,  // Near feet (raised slightly)
            0.85, // Waist level
            1.5   // Head level (lowered slightly)
        ];

        let minCollisionDistance = Infinity;
        
        for (const object of collidableObjects) {
            // Skip objects that are too far away for optimization
            const objectPos = new THREE.Vector3();
            object.getWorldPosition(objectPos);
            if (position.distanceTo(objectPos) > 2) continue;

            // Check each height point
            for (const heightRatio of heightPoints) {
                const checkPosition = position.clone();
                checkPosition.y = heightRatio;

                for (const rayDir of rayDirections) {
                    this.raycaster.set(checkPosition, rayDir);
                    const intersects = this.raycaster.intersectObject(object, true);
                    
                    if (intersects.length > 0) {
                        const distance = intersects[0].distance;
                        let minDistance = this.bodyRadius;
                        
                        // Adjust collision distance based on object type
                        if (object.name && object.name.includes('table')) {
                            minDistance = 0.4; // Reduced from 0.7
                        } else if (object.name && object.name.includes('chair')) {
                            minDistance = 0.3; // Reduced from 0.4
                        } else if (object.name && object.name.includes('shelf')) {
                            minDistance = 0.35; // Reduced from 0.5
                        }

                        if (distance < minDistance && distance < minCollisionDistance) {
                            minCollisionDistance = distance;
                        }
                    }
                }
            }
        }
        
        return minCollisionDistance;
    }

    update(deltaTime, collidableObjects) {
        if (document.pointerLockElement !== this.domElement) return;
        
        // Smoothly transition height when crouching/standing
        const targetHeight = this.isCrouching ? this.crouchingHeight : this.standingHeight;
        const heightDiff = targetHeight - this.height;
        if (Math.abs(heightDiff) > 0.01) {
            this.height += heightDiff * 10 * deltaTime;
        }
        
        // Calculate movement direction
        this.direction.z = Number(this.moveForward) - Number(this.moveBackward);
        this.direction.x = Number(this.moveLeft) - Number(this.moveRight);
        this.direction.normalize();
        
        // Apply movement relative to camera direction
        const actualSpeed = this.speed * deltaTime;
        
        // Store current position for collision check
        const currentPosition = this.camera.position.clone();
        currentPosition.y = 0; // Set to ground level for collision checks
        
        // Calculate desired movement
        this.velocity.set(0, 0, 0);
        if (this.moveForward || this.moveBackward) {
            this.velocity.z = -this.direction.z * actualSpeed;
        }
        if (this.moveLeft || this.moveRight) {
            this.velocity.x = -this.direction.x * actualSpeed;
        }
        
        // Apply movement with collision check
        if (this.velocity.lengthSq() > 0) {
            const movement = this.velocity.clone().applyQuaternion(this.camera.quaternion);
            const movementDirection = movement.clone().normalize();
            const collisionDistance = this.checkCollision(currentPosition, movementDirection, collidableObjects);
            
            if (collisionDistance === Infinity) {
                // No collision, move freely
                this.camera.position.x += movement.x;
                this.camera.position.z += movement.z;
            } else if (collisionDistance > this.bodyRadius * 0.5) {
                // Close to collision, allow partial movement
                const scale = (collisionDistance - this.bodyRadius * 0.5) / collisionDistance;
                this.camera.position.x += movement.x * scale;
                this.camera.position.z += movement.z * scale;
                
                // Try sliding along the wall
                const slideDirection = new THREE.Vector3(-movementDirection.z, 0, movementDirection.x);
                const slideCollision = this.checkCollision(this.camera.position, slideDirection, collidableObjects);
                
                if (slideCollision > this.bodyRadius) {
                    const slideMovement = slideDirection.multiplyScalar(actualSpeed * 0.5);
                    this.camera.position.x += slideMovement.x;
                    this.camera.position.z += slideMovement.z;
                }
            }
        }
        
        // Update camera height
        this.camera.position.y = this.height;
    }
}
