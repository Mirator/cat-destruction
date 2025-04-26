import { InteractionUI } from '../ui/interaction-ui.js';
import { Food } from '../objects/food.js';
import { Bowl } from '../objects/bowl.js';
import * as THREE from 'three';
import { FlowerProp } from '../objects/prop.js';

export class InteractionManager {
    constructor(scene, player) {
        this.scene = scene;
        this.player = player;
        this.ui = new InteractionUI();
        this.carriedFood = null;
        this.foodItems = [];
        this.bowls = [];
        this.dropSurfaces = [];
        this.flowerProps = [];
        this.raycaster = new THREE.Raycaster();
        
        // Configuration
        this.ROOM_BOUNDS = {
            minX: -2.0,
            maxX: 2.0,
            minZ: -4.0,
            maxZ: 4.0,
            floorY: 0.05,
            tableY: 0.73
        };
        this.DROP_CONFIG = {
            maxDistance: 1.2,
            minDistance: 0.5,
            fallbackDistance: 1.0
        };

        this.collectObjects();
        document.addEventListener('keydown', (e) => this.handleKeyPress(e));
    }

    collectObjects() {
        this.foodItems = [];
        this.bowls = [];
        this.dropSurfaces = [];
        this.flowerProps = [];
        this.scene.traverse((object) => {
            if (object.userData?.foodInstance) {
                this.foodItems.push(object.userData.foodInstance);
            }
            if (object.userData?.bowlInstance) {
                this.bowls.push(object.userData.bowlInstance);
            }
            if (object.userData?.propInstance instanceof FlowerProp) {
                this.flowerProps.push(object.userData.propInstance);
            }
            if (object.isMesh && object.geometry && (
                object.name === 'floor' ||
                object.name.includes('table') ||
                object.name.includes('shelf')
            )) {
                this.dropSurfaces.push(object);
            }
        });
    }

    isPositionInBounds(position) {
        return position.x >= this.ROOM_BOUNDS.minX &&
               position.x <= this.ROOM_BOUNDS.maxX &&
               position.z >= this.ROOM_BOUNDS.minZ &&
               position.z <= this.ROOM_BOUNDS.maxZ;
    }

    clampToBounds(position) {
        position.x = Math.max(this.ROOM_BOUNDS.minX, Math.min(this.ROOM_BOUNDS.maxX, position.x));
        position.z = Math.max(this.ROOM_BOUNDS.minZ, Math.min(this.ROOM_BOUNDS.maxZ, position.z));
        return position;
    }

    findDropHeight(position) {
        const start = position.clone();
        start.y = 2.0;
        
        const downRay = new THREE.Raycaster(
            start,
            new THREE.Vector3(0, -1, 0),
            0,
            2.5
        );
        
        const intersects = downRay.intersectObjects(this.dropSurfaces, false);
        
        if (intersects.length > 0) {
            const surface = intersects[0].object;
            if (surface.name.includes('table')) {
                return this.ROOM_BOUNDS.tableY;
            }
        }
        
        return this.ROOM_BOUNDS.floorY;
    }

    calculateDropPosition() {
        const cameraPos = this.player.camera.position.clone();
        const lookDir = new THREE.Vector3();
        this.player.camera.getWorldDirection(lookDir);

        this.raycaster.setFromCamera(new THREE.Vector2(0, 0), this.player.camera);
        const intersects = this.raycaster.intersectObjects(this.dropSurfaces, false);

        let dropPos = null;
        let distance = 0;

        if (intersects.length > 0) {
            const hit = intersects[0];
            distance = hit.distance;

            if (distance <= this.DROP_CONFIG.maxDistance && 
                distance >= this.DROP_CONFIG.minDistance) {
                dropPos = hit.point.clone();
            }
        }

        if (!dropPos) {
            dropPos = cameraPos.clone();
            lookDir.y = 0;
            lookDir.normalize();
            lookDir.multiplyScalar(this.DROP_CONFIG.fallbackDistance);
            dropPos.add(lookDir);
        }

        this.clampToBounds(dropPos);
        dropPos.y = this.findDropHeight(dropPos);
        
        return dropPos;
    }

    tryPlaceInBowl() {
        if (!this.carriedFood) return false;

        // Find the bowl we're looking at
        const bowlInView = this.findBestTargetBowl();
        if (!bowlInView) return false;

        // Check if bowl can accept food
        if (!bowlInView.canAcceptFood()) return false;

        // Add food to bowl
        bowlInView.addFood(this.carriedFood);
        return true;
    }

    findBestTargetBowl() {
        if (!this.bowls || this.bowls.length === 0) return null;

        // Update raycaster with camera position and direction
        this.raycaster.setFromCamera(new THREE.Vector2(0, 0), this.player.camera);

        // Find all bowls that intersect with the ray
        const intersects = this.raycaster.intersectObjects(this.bowls.map(bowl => bowl.model), true);
        if (intersects.length === 0) return null;

        // Get the closest bowl that was hit
        const closestIntersect = intersects[0];
        const bowlModel = closestIntersect.object.parent;
        
        // Find the Bowl instance that matches this model
        return this.bowls.find(bowl => bowl.model === bowlModel);
    }

    update(deltaTime) {
        if (!this.player?.camera) return;

        // Update all bowls (for smooth fill animation)
        this.bowls.forEach(bowl => bowl.update(deltaTime));

        // Update all flower props (for knock-over animation)
        this.flowerProps.forEach(flower => flower.update(deltaTime));

        if (this.carriedFood) {
            this.carriedFood.updateCarriedPosition(
                this.player.camera.position,
                this.player.camera.rotation
            );
        }

        const nearestFood = !this.carriedFood ? 
            Food.findBestTargetFood(this.player.camera, this.foodItems) : 
            null;

        // Use findBestTargetBowl for bowl detection when carrying food
        let nearestBowl = null;
        if (this.carriedFood) {
            nearestBowl = this.findBestTargetBowl();
            if (nearestBowl && !nearestBowl.canAcceptFood()) {
                nearestBowl = null;
            }
        }

        this.updateHighlights(deltaTime, nearestFood, nearestBowl);
        this.ui.updateInteractionPrompt(nearestFood, nearestBowl, this.carriedFood !== null);
        this.ui.updateDistance(this.player.camera, this.foodItems);
    }

    updateHighlights(deltaTime, nearestFood, nearestBowl) {
        this.foodItems.forEach(food => {
            if (!food.isConsumed && !food.isPickedUp) {
                const canPickup = Food.canPickup(this.player.camera, food.model);
                food.setHighlight(canPickup);
                if (food.isHighlighted) {
                    food.updateHighlight(deltaTime);
                }
            }
        });

        this.bowls.forEach(bowl => {
            bowl.setHighlight(bowl === nearestBowl);
            if (bowl.isHighlighted) {
                bowl.updateHighlight(deltaTime);
            }
        });
    }

    handleKeyPress(event) {
        if (event.key.toLowerCase() === 'e' && this.player?.camera) {
            if (this.carriedFood) {
                this.handleDrop();
            } else {
                this.handlePickup();
            }
        }
        if (event.key.toLowerCase() === 'r' && this.player?.camera) {
            this.resetNearestFlower();
        }
    }

    handleDrop() {
        if (!this.carriedFood) return;

        // Try to place in bowl first
        if (this.tryPlaceInBowl()) {
            // Food was placed in bowl, consume it
            this.carriedFood.consume();
            this.carriedFood = null;
            return;
        }

        // If not placed in bowl, drop on ground
        const dropPosition = this.calculateDropPosition();
        this.carriedFood.drop(dropPosition);
        this.carriedFood = null;
    }

    handlePickup() {
        const nearestFood = Food.findBestTargetFood(this.player.camera, this.foodItems);
        
        if (nearestFood && !nearestFood.isConsumed && !nearestFood.isPickedUp) {
            if (nearestFood.pickup()) {
                this.carriedFood = nearestFood;
            }
        }
    }

    resetNearestFlower() {
        if (!this.flowerProps.length) return;
        const camPos = this.player.camera.position;
        let nearest = null;
        let minDist = 2.0; // max reset distance
        this.flowerProps.forEach(flower => {
            if (flower.isKnockedOver) {
                const dist = flower.model.position.distanceTo(camPos);
                if (dist < minDist) {
                    minDist = dist;
                    nearest = flower;
                }
            }
        });
        if (nearest) {
            nearest.reset();
        }
    }
} 