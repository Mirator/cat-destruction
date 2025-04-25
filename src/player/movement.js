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
        this.canJump = true;
        
        // Movement parameters
        this.speed = 2.5; // meters per second (average walking speed)
        this.height = 1.7; // player height in meters
        this.collisionRadius = 0.3; // collision radius in meters
        
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
    
    checkCollision(position, walls) {
        const rays = [
            new THREE.Vector3(1, 0, 0),   // right
            new THREE.Vector3(-1, 0, 0),  // left
            new THREE.Vector3(0, 0, 1),   // front
            new THREE.Vector3(0, 0, -1),  // back
            // Diagonal rays for better collision detection
            new THREE.Vector3(1, 0, 1).normalize(),
            new THREE.Vector3(-1, 0, 1).normalize(),
            new THREE.Vector3(1, 0, -1).normalize(),
            new THREE.Vector3(-1, 0, -1).normalize()
        ];

        for (const direction of rays) {
            this.raycaster.set(position, direction);
            const intersects = this.raycaster.intersectObjects(walls);
            
            if (intersects.length > 0 && intersects[0].distance < this.collisionRadius) {
                return true;
            }
        }
        return false;
    }

    update(deltaTime, walls) {
        if (document.pointerLockElement !== this.domElement) return;
        
        // Calculate movement direction
        this.direction.z = Number(this.moveForward) - Number(this.moveBackward);
        this.direction.x = Number(this.moveLeft) - Number(this.moveRight);
        this.direction.normalize();
        
        // Apply movement relative to camera direction
        const actualSpeed = this.speed * deltaTime;
        
        // Store current position for collision check
        const currentPosition = this.camera.position.clone();
        
        // Calculate new position
        if (this.moveForward || this.moveBackward) {
            this.velocity.z = -this.direction.z * actualSpeed;
        }
        if (this.moveLeft || this.moveRight) {
            this.velocity.x = -this.direction.x * actualSpeed;
        }
        
        // Apply movement with collision check
        const movement = this.velocity.clone().applyQuaternion(this.camera.quaternion);
        const newPosition = currentPosition.clone().add(movement);
        
        // Check for collisions at new position
        if (!this.checkCollision(newPosition, walls)) {
            this.camera.position.copy(newPosition);
        }
        
        // Reset velocity
        this.velocity.set(0, 0, 0);
        
        // Maintain height
        this.camera.position.y = this.height;
    }
}
