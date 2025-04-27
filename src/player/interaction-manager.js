import { InteractionUI } from '../ui/interaction-ui.js';
import { Food } from '../objects/food/food.js';
import { Bowl } from '../objects/furniture/bowl.js';
import * as THREE from 'three';
import { FlowerProp } from '../objects/props/FlowerProp.js';
import { DialingUI } from '../ui/dialing-ui.js';
import { stockShelf } from '../objects/furniture/shelfStocking.js';

export class InteractionManager {
    constructor(scene, player) {
        this.scene = scene;
        this.player = player;
        this.ui = new InteractionUI();
        this.dialingUI = null;
        this.carriedFood = null;
        this.foodItems = [];
        this.bowls = [];
        this.dropSurfaces = [];
        this.flowerProps = [];
        this.raycaster = new THREE.Raycaster();
        this.telephone = null;
        this.dialingActive = false;
        this.parcelShouldSpawn = false;
        this.carriedParcel = null;
        this.shelf = null;
        // Forced help tip logic
        this.forcedHelpTipUntil = 0;
        this.forcedHelpTipTimeout = null;
        
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
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                this.dialingUI = new DialingUI();
            });
        } else {
            this.dialingUI = new DialingUI();
        }
    }

    collectObjects() {
        this.foodItems = [];
        this.bowls = [];
        this.dropSurfaces = [];
        this.flowerProps = [];
        this.telephone = null;
        this.parcel = null;
        this.shelf = null;
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
            if (object.userData?.telephoneInstance) {
                this.telephone = object.userData.telephoneInstance;
            }
            if (object.userData?.parcelInstance) {
                this.parcel = object.userData.parcelInstance;
            }
            if (object.name === 'shelf') {
                this.shelf = object;
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

        // Forced help tip: skip normal help tip logic if active
        if (this.forcedHelpTipUntil > Date.now()) {
            // Still show forced tip, skip rest of help tip logic
            this.updateHighlights(deltaTime, null, null);
            this.ui.updateInteractionPrompt(null, null, false, null, null, null);
            return;
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

        // --- PROP HIGHLIGHTING ---
        let nearestProp = null;
        let minPropDist = 2.2; // max highlight distance
        // Raycast for props in view
        this.raycaster.setFromCamera(new THREE.Vector2(0, 0), this.player.camera);
        const propIntersects = this.raycaster.intersectObjects(this.flowerProps.map(p => p.model), true);
        if (propIntersects.length > 0) {
            let hit = propIntersects[0].object;
            let prop = null;
            // Traverse up to find the propInstance
            while (hit) {
                if (hit.userData && hit.userData.propInstance) {
                    prop = hit.userData.propInstance;
                    break;
                }
                hit = hit.parent;
            }
            if (prop && prop.isKnockedOver) {
                const dist = this.player.camera.position.distanceTo(prop.model.position);
                if (dist < minPropDist) {
                    nearestProp = prop;
                    minPropDist = dist;
                }
            }
        }
        // Highlight only the nearest knocked-over prop
        this.flowerProps.forEach(prop => {
            prop.setHighlight(prop === nearestProp);
        });
        if (nearestProp) {
            nearestProp.updateHighlight(deltaTime);
        }
        if (nearestProp && nearestProp.isKnockedOver) {
        }

        let nearestPhone = null;
        let minPhoneDist = 2.2;
        if (this.telephone) {
            // Raycast for phone in view
            this.raycaster.setFromCamera(new THREE.Vector2(0, 0), this.player.camera);
            const phoneIntersects = this.raycaster.intersectObject(this.telephone.model, true);
            if (phoneIntersects.length > 0) {
                const dist = this.player.camera.position.distanceTo(this.telephone.model.position);
                if (dist < minPhoneDist) {
                    nearestPhone = this.telephone;
                    minPhoneDist = dist;
                }
            }
            this.telephone.setHighlight(this.telephone === nearestPhone);
        }
        this.nearestPhone = nearestPhone;

        // --- PARCEL HIGHLIGHTING & CARRYING ---
        let nearestParcel = null;
        let minParcelDist = 2.2;
        if (this.parcel && !this.carriedParcel) {
            this.raycaster.setFromCamera(new THREE.Vector2(0, 0), this.player.camera);
            const intersects = this.raycaster.intersectObject(this.parcel.model, true);
            if (intersects.length > 0) {
                nearestParcel = this.parcel;
                minParcelDist = this.player.camera.position.distanceTo(this.parcel.model.position);
            }
            this.parcel.setHighlight(this.parcel === nearestParcel);
            if (this.parcel.isHighlighted) {
                this.parcel.updateHighlight(deltaTime);
            }
        } else if (this.parcel) {
            this.parcel.setHighlight(false);
        }
        if (this.carriedParcel) {
            this.parcel.setHighlight(false);
            // Carry in front of camera
            const cam = this.player.camera;
            const offset = new THREE.Vector3(0, -0.3, -1.1);
            offset.applyQuaternion(cam.quaternion);
            this.carriedParcel.model.position.copy(cam.position.clone().add(offset));
            this.carriedParcel.model.position.y = Math.max(this.carriedParcel.model.position.y, 0.18);
            this.carriedParcel.model.rotation.y = cam.rotation.y;
        }

        // --- PARCEL RESTOCKING ---
        let shelfInView = false;
        if (this.carriedParcel && this.shelf) {
            // Raycast for shelf in view
            this.raycaster.setFromCamera(new THREE.Vector2(0, 0), this.player.camera);
            const intersects = this.raycaster.intersectObject(this.shelf, true);
            if (intersects.length > 0 && intersects[0].distance < 2.0) {
                shelfInView = true;
                this.shelf.setHighlight(true);
                this.ui.showPrompt('Press [E] to restock shelf');
            } else {
                this.shelf.setHighlight(false);
            }
        } else if (this.shelf) {
            this.shelf.setHighlight(false);
        }

        // --- FOOD CARRYING HELP TIP ---
        if (this.carriedFood) {
            this.ui.showHelpTip('Bring the food to the bowl to fill it!');
        } else if (!this.carriedParcel) {
            this.ui.hideHelpTip();
        }

        this.updateHighlights(deltaTime, nearestFood, nearestBowl);
        this.ui.updateInteractionPrompt(nearestFood, nearestBowl, this.carriedFood !== null, nearestProp, this.nearestPhone, nearestParcel);
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
        if (this.dialingActive) return; // Block normal controls during minigame
        if (event.key.toLowerCase() === 'e' && this.player?.camera) {
            if (this.carriedFood) {
                // Remove dropping food: only allow placing in bowl
                if (this.tryPlaceInBowl()) {
                    // Check if this was the last can of its type (after placing in bowl)
                    const type = this.carriedFood.type;
                    this.carriedFood.consume();
                    this.carriedFood = null;
                    // Clear all bowl highlights
                    this.bowls.forEach(bowl => bowl.setHighlight(false));
                    // Defer the check for remaining cans to ensure state is updated
                    setTimeout(() => {
                        const remainingOfType = this.foodItems.filter(f => !f.isConsumed && !f.isPickedUp && !f.inBowl && f.type === type);
                        if (remainingOfType.length === 0) {
                            this.ui.showHelpTip('Out of ' + (type === 'FISH' ? 'Fish' : 'Chicken') + ' cans! Use the telephone to restock.', true);
                        } else {
                            this.ui.hideHelpTip(); // Hide help tip after filling bowl
                        }
                    }, 0);
                }
            } else if (this.carriedParcel) {
                // --- RESTOCK SHELF ---
                if (this.shelf) {
                    this.raycaster.setFromCamera(new THREE.Vector2(0, 0), this.player.camera);
                    const intersects = this.raycaster.intersectObject(this.shelf, true);
                    if (intersects.length > 0 && intersects[0].distance < 2.0) {
                        // Remove parcel from scene
                        this.scene.remove(this.carriedParcel.model);
                        this.carriedParcel = null;
                        this.parcel = null;
                        // Restock shelf
                        if (this.shelf.userData && this.shelf.userData.shelfPositions) {
                            stockShelf(this.shelf, this.shelf.userData.shelfPositions, this.shelf.userData.shelfWidth);
                            Food.setScene(this.scene);
                            this.collectObjects();
                        } else {
                            // fallback: try to restock anyway
                            stockShelf(this.shelf, [
                                {x:0,y:0.015,z:0},
                                {x:0,y:0.525,z:0},
                                {x:0,y:0.975,z:0},
                                {x:0,y:1.425,z:0}
                            ], 1.2);
                            Food.setScene(this.scene);
                            this.collectObjects();
                        }
                        this.shelf.setHighlight(false);
                        this.ui.hidePrompt();
                        this.ui.hideHelpTip();
                        return;
                    }
                }
                this.handleDropParcel();
            } else if (this.tryResetNearestFlower()) {
                // Flower was reset, do nothing else
            } else if (this.nearestPhone) {
                this.startDialingMinigame();
            } else if (this.tryPickupParcel()) {
                // Picked up parcel, do nothing else
            } else {
                this.handlePickup();
            }
        }
    }

    handlePickup() {
        const nearestFood = Food.findBestTargetFood(this.player.camera, this.foodItems);
        if (nearestFood && !nearestFood.isConsumed && !nearestFood.isPickedUp) {
            if (nearestFood.pickup()) {
                this.carriedFood = nearestFood;
            }
        }
    }

    tryResetNearestFlower() {
        if (!this.flowerProps.length) return false;
        const camPos = this.player.camera.position;
        let nearest = null;
        let minDist = 2.2; // match highlight distance
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
            return true;
        }
        return false;
    }

    startDialingMinigame() {
        this.dialingActive = true;
        const code = Array.from({length: 5}, () => Math.floor(Math.random() * 10));
        if (!this.dialingUI) {
            this.dialingUI = new DialingUI();
        }
        this.dialingUI.show(
            code,
            () => { // onComplete
                this.dialingActive = false;
                if (this.scene && this.scene.userData && typeof this.scene.userData.spawnParcelAtDoor === 'function') {
                    this.scene.userData.spawnParcelAtDoor();
                }
            },
            () => { // onCancel
                this.dialingActive = false;
            }
        );
    }

    tryPickupParcel() {
        if (this.parcel && !this.carriedParcel && !this.carriedFood) {
            this.raycaster.setFromCamera(new THREE.Vector2(0, 0), this.player.camera);
            const intersects = this.raycaster.intersectObject(this.parcel.model, true);
            if (intersects.length > 0) {
                this.carriedParcel = this.parcel;
                this.ui.showHelpTip('Bring the parcel to the shelf to restock!');
                return true;
            }
        }
        return false;
    }

    handleDropParcel() {
        if (!this.carriedParcel) return;
        this.carriedParcel.setHighlight(false);
        // Drop at calculated position
        const dropPos = this.calculateDropPosition();
        this.carriedParcel.model.position.copy(dropPos);
        this.carriedParcel.model.position.y = 0.15;
        this.carriedParcel.model.rotation.y = 0;
        this.ui.hideHelpTip();
        this.carriedParcel = null;
    }

    showForcedHelpTip(text, durationMs = 6000) {
        this.forcedHelpTipUntil = Date.now() + durationMs;
        this.ui.showHelpTip(text);
        if (this.forcedHelpTipTimeout) clearTimeout(this.forcedHelpTipTimeout);
        this.forcedHelpTipTimeout = setTimeout(() => {
            this.forcedHelpTipUntil = 0;
            this.ui.hideHelpTip();
        }, durationMs);
    }
} 