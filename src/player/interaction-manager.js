import { InteractionUI } from '../ui/interaction-ui.js';
import { Food } from '../objects/food.js';
import { Bowl } from '../objects/bowl.js';
import * as THREE from 'three';

export class InteractionManager {
    constructor(scene, player) {
        this.scene = scene;
        this.player = player;
        this.ui = new InteractionUI();
        this.carriedFood = null;
        this.foodItems = [];
        this.bowls = [];
        this.dropSurfaces = [];
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
        
        this.scene.traverse((object) => {
            if (object.userData?.foodInstance) {
                this.foodItems.push(object.userData.foodInstance);
            }
            if (object.userData?.bowlInstance) {
                this.bowls.push(object.userData.bowlInstance);
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
        for (const bowl of this.bowls) {
            if (bowl.canAcceptFood() && Bowl.canInteract(this.player.camera.position, bowl.position)) {
                const placed = bowl.addFood(this.carriedFood);
                if (placed) {
                    return true;
                }
            }
        }
        return false;
    }

    update(deltaTime) {
        if (!this.player?.camera) return;

        if (this.carriedFood) {
            this.carriedFood.updateCarriedPosition(
                this.player.camera.position,
                this.player.camera.rotation
            );
        }

        const nearestFood = !this.carriedFood ? 
            Food.findBestTargetFood(this.player.camera, this.foodItems) : 
            null;

        let nearestBowl = null;
        if (this.carriedFood) {
            for (const bowl of this.bowls) {
                if (bowl.canAcceptFood() && 
                    Bowl.canInteract(this.player.camera.position, bowl.position)) {
                    nearestBowl = bowl;
                    break;
                }
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
        if (event.key.toLowerCase() !== 'e' || !this.player?.camera) return;

        if (this.carriedFood) {
            this.handleDrop();
        } else {
            this.handlePickup();
        }
    }

    handleDrop() {
        if (this.tryPlaceInBowl()) {
            this.carriedFood = null;
            return;
        }

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
} 