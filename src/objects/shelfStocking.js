import * as THREE from 'three';
import { Food, FOOD_TYPES } from './food.js';

// Adds 4-5 food items to the shelf, distributed across compartments
export function stockShelf(shelfGroup, shelfPositions, shelfWidth) {
    // Remove any existing food items
    if (shelfGroup.userData.foodItems) {
        shelfGroup.userData.foodItems.forEach(food => {
            if (food.model.parent === shelfGroup) {
                shelfGroup.remove(food.model);
            }
        });
    }
    const foodItems = [];
    const totalFood = Math.floor(Math.random() * 2) + 4;
    const sideThickness = 0.05; // from furniture.js
    const partitionWidth = 0.02; // from divider geometry
    const canRadius = FOOD_TYPES.BASIC.model.width / 2;
    const margin = 0.05; // 5cm margin from edges/partition
    const shelfDepth = 0.3;
    // Debug: log shelf positions
    console.log('[ShelfStocking] shelfPositions:', shelfPositions);
    // Build a list of all possible compartments (level, left/right)
    const compartments = [];
    for (let i = 0; i < shelfPositions.length; i++) {
        compartments.push({ shelfIdx: i, left: true });
        compartments.push({ shelfIdx: i, left: false });
    }
    // Shuffle and pick totalFood compartments
    for (let i = compartments.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [compartments[i], compartments[j]] = [compartments[j], compartments[i]];
    }
    const chosen = compartments.slice(0, totalFood);
    // Place cans
    const leftInnerEdge = -shelfWidth / 2 + sideThickness / 2;
    const rightInnerEdge = shelfWidth / 2 - sideThickness / 2;
    const leftCompartmentMax = -partitionWidth / 2 - canRadius - margin;
    const rightCompartmentMin = partitionWidth / 2 + canRadius + margin;
    for (const comp of chosen) {
        const basePos = shelfPositions[comp.shelfIdx];
        let x;
        if (comp.left) {
            // Left compartment: from leftInnerEdge + canRadius + margin to leftCompartmentMax
            const minX = leftInnerEdge + canRadius + margin;
            const maxX = leftCompartmentMax;
            x = minX + Math.random() * (maxX - minX);
        } else {
            // Right compartment: from rightCompartmentMin to rightInnerEdge - canRadius - margin
            const minX = rightCompartmentMin;
            const maxX = rightInnerEdge - canRadius - margin;
            x = minX + Math.random() * (maxX - minX);
        }
        // z: random but always inside shelf
        const zRange = shelfDepth / 2 - canRadius - margin;
        const z = basePos.z - zRange + Math.random() * (2 * zRange);
        const pos = { x, y: basePos.y, z };
        // Debug: log can position
        console.log(`[ShelfStocking] Placing can: shelfIdx=${comp.shelfIdx}, left=${comp.left}, pos=`, pos);
        const type = Math.random() < 0.7 ? 'BASIC' : 'PREMIUM';
        const food = new Food(type, new THREE.Vector3(pos.x, pos.y, pos.z));
        food.model.rotation.set(0, 0, 0);
        foodItems.push(food);
        shelfGroup.add(food.model);
    }
    shelfGroup.userData.foodItems = foodItems;
} 