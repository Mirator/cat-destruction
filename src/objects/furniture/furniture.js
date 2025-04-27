import * as THREE from 'three';
import { Food } from '../food/food.js';
import { Bowl } from './bowl.js';
import { stockShelf } from './shelfStocking.js';
import { BOWL_CONFIG } from '../../config/GameConfig.js';

// Common material configurations
const WOOD_MATERIAL_CONFIG = {
    color: 0x8B4513,
    roughness: 0.7,
    metalness: 0.1
};

// Furniture dimensions
export const FURNITURE_DIMENSIONS = {
    table: {
        width: 1.4,
        height: 0.7,
        depth: 1.0,
        topThickness: 0.05
    },
    chair: {
        width: 0.4,
        height: 0.45,
        depth: 0.4,
        backHeight: 0.4,
        seatThickness: 0.05
    },
    shelf: {
        width: 1.2,
        height: 1.8,
        depth: 0.3,
        shelfThickness: 0.03,
        shelfCount: 4
    },
    bed: {
        width: 1.6,
        height: 0.5,
        depth: 2.1,
        mattressHeight: 0.25,
        pillowWidth: 0.5,
        pillowHeight: 0.12,
        pillowDepth: 0.3
    }
};

// Create standard wood material
function createWoodMaterial() {
    return new THREE.MeshStandardMaterial(WOOD_MATERIAL_CONFIG);
}

function createTable() {
    const tableGroup = new THREE.Group();
    tableGroup.name = 'table';
    const dims = FURNITURE_DIMENSIONS.table;
    const tableMaterial = createWoodMaterial();
    
    // Table top
    const topGeometry = new THREE.BoxGeometry(dims.width, dims.topThickness, dims.depth);
    const tableTop = new THREE.Mesh(topGeometry, tableMaterial);
    tableTop.name = 'table_top';
    tableTop.position.y = dims.height;
    tableTop.castShadow = true;
    tableTop.receiveShadow = true;
    
    // Table legs
    const legGeometry = new THREE.BoxGeometry(0.05, dims.height, 0.05);
    const legPositions = [
        { x: dims.width * 0.45, z: dims.depth * 0.45 },
        { x: dims.width * 0.45, z: -dims.depth * 0.45 },
        { x: -dims.width * 0.45, z: dims.depth * 0.45 },
        { x: -dims.width * 0.45, z: -dims.depth * 0.45 }
    ];

    legPositions.forEach((pos, i) => {
        const leg = new THREE.Mesh(legGeometry, tableMaterial);
        leg.name = `table_leg_${i}`;
        leg.position.set(pos.x, dims.height/2, pos.z);
        leg.castShadow = true;
        leg.receiveShadow = true;
        tableGroup.add(leg);
    });
    
    tableGroup.add(tableTop);
    return tableGroup;
}

function createChair() {
    const chairGroup = new THREE.Group();
    chairGroup.name = 'chair';
    const dims = FURNITURE_DIMENSIONS.chair;
    const chairMaterial = createWoodMaterial();
    
    // Seat
    const seatGeometry = new THREE.BoxGeometry(dims.width, dims.seatThickness, dims.depth);
    const seat = new THREE.Mesh(seatGeometry, chairMaterial);
    seat.name = 'chair_seat';
    seat.position.y = dims.height;
    seat.castShadow = true;
    seat.receiveShadow = true;
    
    // Back
    const backGeometry = new THREE.BoxGeometry(dims.width, dims.backHeight, dims.seatThickness);
    const back = new THREE.Mesh(backGeometry, chairMaterial);
    back.name = 'chair_back';
    back.position.set(0, dims.height + dims.backHeight/2, -dims.depth/2 + dims.seatThickness/2);
    back.castShadow = true;
    back.receiveShadow = true;
    
    // Legs
    const legGeometry = new THREE.BoxGeometry(0.04, dims.height, 0.04);
    const legPositions = [
        { x: dims.width * 0.4, z: dims.depth * 0.4 },
        { x: dims.width * 0.4, z: -dims.depth * 0.4 },
        { x: -dims.width * 0.4, z: dims.depth * 0.4 },
        { x: -dims.width * 0.4, z: -dims.depth * 0.4 }
    ];

    legPositions.forEach((pos, i) => {
        const leg = new THREE.Mesh(legGeometry, chairMaterial);
        leg.name = `chair_leg_${i}`;
        leg.position.set(pos.x, dims.height/2, pos.z);
        leg.castShadow = true;
        leg.receiveShadow = true;
        chairGroup.add(leg);
    });
    
    chairGroup.add(seat);
    chairGroup.add(back);
    return chairGroup;
}

export function createShelvingUnit() {
    const shelfGroup = new THREE.Group();
    shelfGroup.name = 'shelf';
    const dims = FURNITURE_DIMENSIONS.shelf;
    const woodMaterial = createWoodMaterial();
    
    // Create vertical sides
    const sideGeometry = new THREE.BoxGeometry(0.05, dims.height, dims.depth);
    const sides = [
        { name: 'left_side', x: -dims.width/2 + 0.025 },
        { name: 'right_side', x: dims.width/2 - 0.025 }
    ];

    sides.forEach(side => {
        const sideMesh = new THREE.Mesh(sideGeometry, woodMaterial);
        sideMesh.name = `shelf_${side.name}`;
        sideMesh.position.set(side.x, dims.height/2, 0);
        sideMesh.castShadow = true;
        shelfGroup.add(sideMesh);
    });
    
    // Store shelf positions for food placement
    const shelfPositions = [];
    
    // Create horizontal shelves
    const shelfGeometry = new THREE.BoxGeometry(dims.width, dims.shelfThickness, dims.depth - 0.02);
    
    for (let i = 0; i <= dims.shelfCount; i++) {
        const shelf = new THREE.Mesh(shelfGeometry, woodMaterial);
        shelf.name = `shelf_horizontal_${i}`;
        const height = (i * (dims.height / dims.shelfCount));
        shelf.position.set(0, height, 0);
        shelf.castShadow = true;
        shelf.receiveShadow = true;
        shelfGroup.add(shelf);
        
        // Store shelf position for food placement
        if (i === 0) {
            // Place on the floor, just above y=0
            shelfPositions.push({
                x: 0,
                y: 0.5 * dims.shelfThickness, // slightly above floor
                z: 0
            });
        } else if (i < dims.shelfCount) {
            shelfPositions.push({
                x: 0,
                y: height + 2.5 * dims.shelfThickness,
                z: 0
            });
        }
        
        // Add dividers except for top shelf
        if (i < dims.shelfCount) {
            const dividerGeometry = new THREE.BoxGeometry(0.02, dims.height/dims.shelfCount - dims.shelfThickness, dims.depth - 0.05);
            const divider = new THREE.Mesh(dividerGeometry, woodMaterial);
            divider.name = `shelf_divider_${i}`;
            divider.position.set(0, height + (dims.height/dims.shelfCount)/2, 0);
            divider.castShadow = true;
            shelfGroup.add(divider);
        }
    }
    
    // Add backing board
    const backingGeometry = new THREE.BoxGeometry(dims.width, dims.height, 0.02);
    const backing = new THREE.Mesh(backingGeometry, woodMaterial);
    backing.name = 'shelf_back';
    backing.position.set(0, dims.height/2, -dims.depth/2 + 0.01);
    backing.receiveShadow = true;
    shelfGroup.add(backing);
    
    // Use stockShelf for initial stocking
    stockShelf(shelfGroup, shelfPositions, dims.width);
    
    // Add highlight method to shelfGroup
    shelfGroup.setHighlight = function(enabled) {
        const highlightColor = new THREE.Color(0x3399ff); // blue
        const highlightIntensity = 0.7;
        this.traverse(obj => {
            if (obj.isMesh && obj.material) {
                if (enabled) {
                    obj.material.emissive = highlightColor;
                    obj.material.emissiveIntensity = highlightIntensity;
                } else {
                    obj.material.emissive = new THREE.Color(0x000000);
                    obj.material.emissiveIntensity = 0.0;
                }
            }
        });
    };
    
    return shelfGroup;
}

function createBed() {
    const bedGroup = new THREE.Group();
    bedGroup.name = 'bed';
    const dims = FURNITURE_DIMENSIONS.bed;
    // Bed frame
    const frameMaterial = createWoodMaterial();
    const frameGeometry = new THREE.BoxGeometry(dims.width, 0.12, dims.depth);
    const frame = new THREE.Mesh(frameGeometry, frameMaterial);
    frame.position.y = 0.12/2 + 0.18; // raised for legs
    frame.castShadow = true;
    frame.receiveShadow = true;
    bedGroup.add(frame);
    // Mattress
    const mattressMaterial = new THREE.MeshStandardMaterial({ color: 0xfaf7f0, roughness: 0.6 });
    const mattressGeometry = new THREE.BoxGeometry(dims.width * 0.96, dims.mattressHeight, dims.depth * 0.96);
    const mattress = new THREE.Mesh(mattressGeometry, mattressMaterial);
    mattress.position.y = 0.12 + dims.mattressHeight / 2 + 0.18; // on top of frame
    mattress.castShadow = true;
    mattress.receiveShadow = true;
    bedGroup.add(mattress);
    // Blanket (blue, slightly offset, covers most of mattress)
    const blanketMaterial = new THREE.MeshStandardMaterial({ color: 0x4a90e2, roughness: 0.5 });
    const blanketWidth = dims.width * 0.90;
    const blanketDepth = dims.depth * 0.80;
    const blanketHeight = dims.mattressHeight * 0.55;
    const blanketGeometry = new THREE.BoxGeometry(blanketWidth, blanketHeight, blanketDepth);
    // Center the blanket on the mattress, with a stronger offset toward the foot, but not past the footboard
    const blanketZ = -dims.depth/2 + blanketDepth/2 + 0.3; // increased from 0.18 to 0.38 for more offset
    const blanket = new THREE.Mesh(blanketGeometry, blanketMaterial);
    blanket.position.set(0, 0.12 + dims.mattressHeight + blanketHeight/2 + 0.18 - 0.03, blanketZ);
    blanket.castShadow = true;
    blanket.receiveShadow = true;
    bedGroup.add(blanket);
    // Pillows (two, white)
    const pillowMaterial = new THREE.MeshStandardMaterial({ color: 0xf6f6f6, roughness: 0.4 });
    const pillowGeometry = new THREE.BoxGeometry(dims.pillowWidth * 0.9, dims.pillowHeight, dims.pillowDepth * 0.9);
    const pillow1 = new THREE.Mesh(pillowGeometry, pillowMaterial);
    pillow1.position.set(-0.28, 0.12 + dims.mattressHeight + dims.pillowHeight / 2 + 0.18, -dims.depth / 2 + dims.pillowDepth / 2 + 0.07);
    pillow1.castShadow = true;
    pillow1.receiveShadow = true;
    bedGroup.add(pillow1);
    const pillow2 = new THREE.Mesh(pillowGeometry, pillowMaterial);
    pillow2.position.set(0.28, 0.12 + dims.mattressHeight + dims.pillowHeight / 2 + 0.18, -dims.depth / 2 + dims.pillowDepth / 2 + 0.07);
    pillow2.castShadow = true;
    pillow2.receiveShadow = true;
    bedGroup.add(pillow2);
    // Headboard
    const headboardGeometry = new THREE.BoxGeometry(dims.width, 0.4, 0.08);
    const headboard = new THREE.Mesh(headboardGeometry, frameMaterial);
    headboard.position.set(0, 0.12 + 0.2 + 0.18, -dims.depth / 2 + 0.04);
    headboard.castShadow = true;
    headboard.receiveShadow = true;
    bedGroup.add(headboard);
    // Footboard (smaller)
    const footboardGeometry = new THREE.BoxGeometry(dims.width, 0.22, 0.07);
    const footboard = new THREE.Mesh(footboardGeometry, frameMaterial);
    footboard.position.set(0, 0.12 + 0.11 + 0.18, dims.depth / 2 - 0.035);
    footboard.castShadow = true;
    footboard.receiveShadow = true;
    bedGroup.add(footboard);
    // Legs (4)
    const legGeometry = new THREE.BoxGeometry(0.09, 0.18, 0.09);
    const legY = 0.09;
    const legX = dims.width / 2 - 0.09 / 2;
    const legZ = dims.depth / 2 - 0.09 / 2;
    for (const sx of [-1, 1]) {
        for (const sz of [-1, 1]) {
            const leg = new THREE.Mesh(legGeometry, frameMaterial);
            leg.position.set(sx * legX, legY, sz * legZ);
            leg.castShadow = true;
            leg.receiveShadow = true;
            bedGroup.add(leg);
        }
    }
    return bedGroup;
}

// Room layout configuration
const ROOM_LAYOUT = {
    chairSpacing: {
        front: 0.5,
        side: 0.7
    },
    margin: 0.5,
    shelfZoneDepth: 1.5
};

function getRandomPosition(roomWidth, roomLength, objectWidth, objectLength) {
    const margin = ROOM_LAYOUT.margin;
    const shelfZoneDepth = ROOM_LAYOUT.shelfZoneDepth;

    const minX = -roomWidth/2 + margin + objectWidth/2;
    const maxX = roomWidth/2 - margin - objectWidth/2;
    const minZ = -roomLength/2 + shelfZoneDepth + objectLength/2;
    const maxZ = roomLength/2 - margin - objectLength/2;

    const centerX = 0;
    const centerZ = (minZ + maxZ) / 2;
    const useLeftSide = Math.random() < 0.5;
    
    const x = useLeftSide
        ? Math.random() * (centerX - minX - objectWidth) + minX
        : Math.random() * (maxX - centerX - objectWidth) + centerX;
    
    const z = Math.random() * (maxZ - centerZ) + centerZ;

    return { x, z };
}

// Helper function to check AABB overlap in XZ plane
function isOverlapping(posA, sizeA, posB, sizeB) {
    return (
        Math.abs(posA.x - posB.x) < (sizeA.width / 2 + sizeB.width / 2) &&
        Math.abs(posA.z - posB.z) < (sizeA.depth / 2 + sizeB.depth / 2)
    );
}

export function createFurniture(roomWidth, roomLength) {
    const furniture = [];
    const placedObjects = [];
    
    // Create and position table
    const table = createTable();
    const tablePos = getRandomPosition(roomWidth, roomLength, FURNITURE_DIMENSIONS.table.width, FURNITURE_DIMENSIONS.table.depth);
    table.position.set(tablePos.x, 0, tablePos.z);
    
    const tableRotation = Math.floor(Math.random() * 4) * (Math.PI / 2);
    table.rotation.y = tableRotation;
    furniture.push(table);
    placedObjects.push({
        pos: { x: tablePos.x, z: tablePos.z },
        size: { width: FURNITURE_DIMENSIONS.table.width, depth: FURNITURE_DIMENSIONS.table.depth }
    });
    
    // Chair configuration
    const chairPositions = [
        { x: 0, z: ROOM_LAYOUT.chairSpacing.front, rotation: Math.PI },    // Front
        { x: 0, z: -ROOM_LAYOUT.chairSpacing.front, rotation: 0 },         // Back
        { x: ROOM_LAYOUT.chairSpacing.side, z: 0, rotation: -Math.PI/2 },  // Right
        { x: -ROOM_LAYOUT.chairSpacing.side, z: 0, rotation: Math.PI/2 }   // Left
    ];
    
    // Create and position chairs
    chairPositions.forEach(pos => {
        const chair = createChair();
        const rotatedX = pos.x * Math.cos(tableRotation) - pos.z * Math.sin(tableRotation);
        const rotatedZ = pos.x * Math.sin(tableRotation) + pos.z * Math.cos(tableRotation);
        
        chair.position.set(
            tablePos.x + rotatedX,
            0,
            tablePos.z + rotatedZ
        );
        chair.rotation.y = pos.rotation + tableRotation;
        furniture.push(chair);
        placedObjects.push({
            pos: { x: tablePos.x + rotatedX, z: tablePos.z + rotatedZ },
            size: { width: FURNITURE_DIMENSIONS.chair.width, depth: FURNITURE_DIMENSIONS.chair.depth }
        });
    });
    
    // Create and position shelf
    const shelf = createShelvingUnit();
    const shelfPos = { x: 0, z: -roomLength/2 + 0.15 };
    shelf.position.set(shelfPos.x, 0, shelfPos.z);
    furniture.push(shelf);
    placedObjects.push({
        pos: shelfPos,
        size: { width: FURNITURE_DIMENSIONS.shelf.width, depth: FURNITURE_DIMENSIONS.shelf.depth }
    });
    
    // Create and position bed (for sleeping room)
    const bed = createBed();
    // Place bed against the back wall, centered
    bed.position.set(0, 0, -roomLength/2 + FURNITURE_DIMENSIONS.bed.depth/2 + 0.1);
    furniture.push(bed);
    placedObjects.push({
        pos: { x: 0, z: -roomLength/2 + FURNITURE_DIMENSIONS.bed.depth/2 + 0.1 },
        size: { width: FURNITURE_DIMENSIONS.bed.width, depth: FURNITURE_DIMENSIONS.bed.depth }
    });
    
    // Create and position bowl at fixed config position
    const bowlPosition = new THREE.Vector3(BOWL_CONFIG.mainRoomPosition.x, BOWL_CONFIG.mainRoomPosition.y, BOWL_CONFIG.mainRoomPosition.z);
    const bowl = new Bowl(bowlPosition);
    bowl.model.name = 'bowl';
    furniture.push(bowl.model);
    
    return furniture;
} 