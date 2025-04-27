import * as THREE from 'three';
import { FOOD_CONFIG } from '../../config/GameConfig.js';
import { BOWL_CONFIG } from '../../config/GameConfig.js';
import { Highlightable } from '../props/Highlightable.js';

export class Bowl extends Highlightable {
    constructor(position) {
        const model = new THREE.Group();
        model.name = 'food_bowl';
        super(model);
        this.position = position;
        this.currentFood = null;
        this.cats = new Set();
        this.createMaterials();
        this.model = model;
        this.fill = 0;
        this.targetFill = 0;
        this.createModel();
        this.setFoodFill(0);
    }

    createMaterials() {
        this.materials = {
            normal: new THREE.MeshStandardMaterial({
                color: BOWL_CONFIG.color,
                metalness: BOWL_CONFIG.materials.metalness,
                roughness: BOWL_CONFIG.materials.roughness
            }),
            highlight: new THREE.MeshStandardMaterial({
                color: BOWL_CONFIG.highlight.color,
                metalness: BOWL_CONFIG.materials.metalness,
                roughness: BOWL_CONFIG.materials.roughness,
                transparent: true,
                opacity: 0.5
            })
        };
    }

    createModel() {
        const bottom = this.createBottomPart();
        const walls = this.createWalls();
        const rim = this.createRim();
        this.foodContent = this.createFoodContent();
        
        this.model.add(bottom, walls, rim, this.foodContent);
        this.setupShadows();
        this.model.position.copy(this.position);
        this.model.userData.bowlInstance = this;
    }

    createBottomPart() {
        const geometry = new THREE.CylinderGeometry(
            BOWL_CONFIG.size.radius * 0.8,
            BOWL_CONFIG.size.radius,
            BOWL_CONFIG.size.height * 0.2,
            32
        );
        const bottom = new THREE.Mesh(geometry, this.materials.normal.clone());
        bottom.position.y = BOWL_CONFIG.size.height * 0.1;
        // Bottom is opaque by default
        return bottom;
    }

    createWalls() {
        const geometry = new THREE.CylinderGeometry(
            BOWL_CONFIG.size.radius * 1.2,
            BOWL_CONFIG.size.radius * 0.8,
            BOWL_CONFIG.size.height * 0.8,
            32,
            1,
            true
        );
        const walls = new THREE.Mesh(geometry, this.materials.normal);
        walls.position.y = BOWL_CONFIG.size.height * 0.5;
        return walls;
    }

    createRim() {
        const geometry = new THREE.TorusGeometry(
            BOWL_CONFIG.size.radius * 1.2,
            BOWL_CONFIG.size.height * 0.05,
            16,
            32
        );
        const rim = new THREE.Mesh(geometry, this.materials.normal);
        rim.position.y = BOWL_CONFIG.size.height * 0.9;
        rim.rotation.x = Math.PI / 2;
        return rim;
    }

    createFoodContent() {
        const geometry = new THREE.CylinderGeometry(
            BOWL_CONFIG.food.fillRadius,
            BOWL_CONFIG.food.fillRadius,
            0.1,
            32
        );
        const mesh = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({
            color: 0x6EC6FF, // Default food color (FISH)
            roughness: 0.8,
            metalness: 0.0,
            visible: true
        }));
        mesh.position.y = BOWL_CONFIG.size.height * 0.1 + 0.05; // raised to avoid z-fighting
        mesh.renderOrder = 2;
        return mesh;
    }

    setupShadows() {
        this.model.traverse(child => {
            if (child instanceof THREE.Mesh) {
                child.castShadow = true;
                child.receiveShadow = true;
            }
        });
    }

    addFood(food) {
        if (this.currentFood || !food) return false;
        food.model.visible = false;
        
        // Update the food content material
        const foodColor = FOOD_CONFIG.types[food.type].color.content;
        this.foodContent.material = new THREE.MeshStandardMaterial({
            color: foodColor,
            roughness: 0.8,
            metalness: 0.0,
            visible: true
        });
        
        this.currentFood = food;
        this.targetFill = 1;
        this.foodContent.visible = true;
        this.setFoodFill(1);
        this.fill = 1;
        
        // Make bottom transparent when food is added
        this.model.children[0].material.transparent = true;
        this.model.children[0].material.opacity = 0.3;
        
        // Notify all cats in the scene about the food
        this.cats.forEach(cat => cat.notifyFoodAdded(this));
        return true;
    }

    removeFood() {
        if (!this.currentFood) return null;
        this.foodContent.material.visible = false;
        const food = this.currentFood;
        this.currentFood = null;
        this.targetFill = 0;
        
        // Make bottom opaque again when food is removed
        this.model.children[0].material.transparent = false;
        this.model.children[0].material.opacity = 1.0;
        
        return food;
    }

    hasFood() {
        return this.currentFood !== null && this.fill > 0;
    }

    canAcceptFood() {
        return !this.currentFood;
    }

    static canInteract(playerPosition, bowlPosition) {
        return playerPosition.distanceTo(bowlPosition) <= BOWL_CONFIG.highlight.range;
    }

    static generateRandomPosition(roomWidth, roomLength) {
        const margin = 0.5;
        const wallOffset = BOWL_CONFIG.position.wallOffset;
        // Pick a wall at random: 0=back, 1=front, 2=left, 3=right
        const wall = Math.floor(Math.random() * 4);
        let x, z;
        if (wall === 0) { // back wall (south)
            x = (Math.random() * (roomWidth - 2 * margin)) - (roomWidth/2 - margin);
            z = -roomLength/2 + wallOffset;
        } else if (wall === 1) { // front wall (north)
            x = (Math.random() * (roomWidth - 2 * margin)) - (roomWidth/2 - margin);
            z = roomLength/2 - wallOffset;
        } else if (wall === 2) { // left wall (west)
            x = -roomWidth/2 + wallOffset;
            z = (Math.random() * (roomLength - 2 * margin)) - (roomLength/2 - margin);
        } else { // right wall (east)
            x = roomWidth/2 - wallOffset;
            z = (Math.random() * (roomLength - 2 * margin)) - (roomLength/2 - margin);
        }
        return new THREE.Vector3(x, 0, z);
    }

    registerCat(cat) {
        this.cats.add(cat);
    }

    unregisterCat(cat) {
        this.cats.delete(cat);
    }

    setFoodFill(fill) {
        this.fill = Math.max(0, Math.min(1, fill));
        this.foodContent.scale.y = this.fill;
        const baseY = BOWL_CONFIG.size.height * 0.3;
        const fullHeight = BOWL_CONFIG.food.fillHeight;
        this.foodContent.position.y = baseY - (fullHeight * (1 - this.fill)) / 2;
        this.foodContent.visible = this.fill > 0;
    }

    update(deltaTime) {
        // Smoothly interpolate fill toward targetFill
        const speed = 2.5; // fill per second
        if (Math.abs(this.fill - this.targetFill) > 0.001) {
            this.fill += Math.sign(this.targetFill - this.fill) * Math.min(Math.abs(this.targetFill - this.fill), speed * deltaTime);
            this.setFoodFill(this.fill);
        }
    }

    setHighlight(enabled) {
        if (this.isHighlighted === enabled) return;
        this.isHighlighted = enabled;
        this.pulseTime = 0;
        
        this.model.traverse(obj => {
            if (obj.isMesh && obj.material && obj !== this.foodContent) {
                obj.material = enabled ? this.materials.highlight : this.materials.normal;
            }
        });
    }
} 