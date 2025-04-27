import * as THREE from 'three';
import { FOOD_CONFIG } from '../../config/GameConfig.js';
import { Food } from '../food/food.js';

// Adds 4-5 food items to the shelf, distributed across compartments
export function stockShelf(shelfGroup, shelfPositions, shelfWidth) {
    // Only remove food items that are not present in the compartments (e.g., dropped cans)
    if (!shelfGroup.userData.foodItems) {
        shelfGroup.userData.foodItems = [];
    }
    // Build a list of all possible compartments (level, left/right)
    const compartments = [];
    for (let i = 0; i < shelfPositions.length; i++) {
        compartments.push({ shelfIdx: i, left: true });
        compartments.push({ shelfIdx: i, left: false });
    }
    // Track how many cans are in each compartment
    const compartmentCounts = Array(compartments.length).fill(0);
    for (const food of shelfGroup.userData.foodItems) {
        let minDist = Infinity;
        let bestComp = null;
        for (let idx = 0; idx < compartments.length; idx++) {
            const comp = compartments[idx];
            const basePos = shelfPositions[comp.shelfIdx];
            const x = comp.left ? -1 : 1;
            const expectedX = x * Math.abs(food.model.position.x);
            const dist = Math.abs(food.model.position.y - basePos.y) + Math.abs(food.model.position.x - expectedX);
            if (dist < 0.2) {
                minDist = dist;
                bestComp = idx;
            }
        }
        if (bestComp !== null) compartmentCounts[bestComp]++;
    }
    // Build a list of available slots (each compartment can have 2 cans)
    const available = [];
    for (let i = 0; i < compartments.length; i++) {
        if (compartmentCounts[i] < 2) {
            // Add one slot for each available spot
            if (compartmentCounts[i] === 0) {
                available.push(i);
                available.push(i);
            } else if (compartmentCounts[i] === 1) {
                available.push(i);
            }
        }
    }
    // Shuffle and pick up to 4-5 available slots
    for (let i = available.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [available[i], available[j]] = [available[j], available[i]];
    }
    // Use a property on the shelfGroup to track first restock
    if (!shelfGroup.userData.hasRestockedOnce) {
        shelfGroup.userData.hasRestockedOnce = true;
        const types = ['FISH', 'CHICKEN'];
        for (let i = 0; i < types.length && i < available.length; i++) {
            const idx = available[i];
            const comp = compartments[idx];
            const basePos = shelfPositions[comp.shelfIdx];
            let x;
            if (comp.left) {
                const minX = -shelfWidth / 2 + 0.05 / 2 + FOOD_CONFIG.types.FISH.model.width / 2 + 0.05;
                const maxX = -0.02 / 2 - FOOD_CONFIG.types.FISH.model.width / 2 - 0.05;
                x = minX + Math.random() * (maxX - minX);
            } else {
                const minX = 0.02 / 2 + FOOD_CONFIG.types.FISH.model.width / 2 + 0.05;
                const maxX = shelfWidth / 2 - 0.05 / 2 - FOOD_CONFIG.types.FISH.model.width / 2 - 0.05;
                x = minX + Math.random() * (maxX - minX);
            }
            const shelfDepth = 0.3;
            const canRadius = FOOD_CONFIG.types.FISH.model.width / 2;
            const margin = 0.05;
            const zRange = shelfDepth / 2 - canRadius - margin;
            const z = basePos.z - zRange + Math.random() * (2 * zRange);
            const pos = { x, y: basePos.y, z };
            const food = createPickableFood(types[i], pos);
            shelfGroup.userData.foodItems.push(food);
            shelfGroup.add(food.model);
            compartmentCounts[idx]++;
        }
        return;
    }
    // Normal restock logic
    const numToAdd = Math.min(Math.floor(Math.random() * 2) + 4, available.length);
    const chosen = available.slice(0, numToAdd);
    // Prepare half fish, half chicken
    const types = [];
    for (let i = 0; i < numToAdd; i++) {
        types.push(i < Math.floor(numToAdd / 2) ? 'FISH' : 'CHICKEN');
    }
    // Shuffle types for variety
    for (let i = types.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [types[i], types[j]] = [types[j], types[i]];
    }
    // Place new cans
    const sideThickness = 0.05; // from furniture.js
    const partitionWidth = 0.02; // from divider geometry
    const canRadius = FOOD_CONFIG.types.FISH.model.width / 2;
    const margin = 0.05; // 5cm margin from edges/partition
    const shelfDepth = 0.3;
    const leftInnerEdge = -shelfWidth / 2 + sideThickness / 2;
    const rightInnerEdge = shelfWidth / 2 - sideThickness / 2;
    const leftCompartmentMax = -partitionWidth / 2 - canRadius - margin;
    const rightCompartmentMin = partitionWidth / 2 + canRadius + margin;
    for (let i = 0; i < chosen.length; i++) {
        const idx = chosen[i];
        const comp = compartments[idx];
        const basePos = shelfPositions[comp.shelfIdx];
        let x;
        if (comp.left) {
            const minX = leftInnerEdge + canRadius + margin;
            const maxX = leftCompartmentMax;
            x = minX + Math.random() * (maxX - minX);
        } else {
            const minX = rightCompartmentMin;
            const maxX = rightInnerEdge - canRadius - margin;
            x = minX + Math.random() * (maxX - minX);
        }
        if (compartmentCounts[idx] === 1) {
            x += comp.left ? 0.03 : -0.03;
        }
        const zRange = shelfDepth / 2 - canRadius - margin;
        const z = basePos.z - zRange + Math.random() * (2 * zRange);
        const pos = { x, y: basePos.y, z };
        const type = types[i];
        const food = createPickableFood(type, pos);
        shelfGroup.userData.foodItems.push(food);
        shelfGroup.add(food.model);
        compartmentCounts[idx]++;
    }
}

function createPickableFood(type, pos) {
    const food = new Food(type, new THREE.Vector3(pos.x, pos.y, pos.z));
    food.model.rotation.set(0, 0, 0);
    food.isConsumed = false;
    food.isPickedUp = false;
    food.inBowl = false;
    food.model.visible = true;
    return food;
} 