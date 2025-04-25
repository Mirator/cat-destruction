import * as THREE from 'three';

function createTable() {
    const tableGroup = new THREE.Group();
    tableGroup.name = 'table';
    
    // Table top - increased size
    const topGeometry = new THREE.BoxGeometry(1.4, 0.05, 1.0);
    const tableMaterial = new THREE.MeshStandardMaterial({
        color: 0x8B4513,
        roughness: 0.7,
        metalness: 0.1
    });
    const tableTop = new THREE.Mesh(topGeometry, tableMaterial);
    tableTop.name = 'table_top';
    tableTop.position.y = 0.7; // Standard table height
    tableTop.castShadow = true;
    tableTop.receiveShadow = true;
    
    // Table legs - adjusted for new table size
    const legGeometry = new THREE.BoxGeometry(0.05, 0.7, 0.05);
    for (let i = 0; i < 4; i++) {
        const leg = new THREE.Mesh(legGeometry, tableMaterial);
        leg.name = `table_leg_${i}`;
        leg.castShadow = true;
        leg.receiveShadow = true;
        
        // Position legs at corners - adjusted for new size
        leg.position.x = ((i % 2) * 2 - 1) * 0.65; // -0.65 or 0.65
        leg.position.z = (Math.floor(i / 2) * 2 - 1) * 0.45; // -0.45 or 0.45
        leg.position.y = 0.35; // Half of leg height
        
        tableGroup.add(leg);
    }
    
    tableGroup.add(tableTop);
    return tableGroup;
}

function createChair() {
    const chairGroup = new THREE.Group();
    chairGroup.name = 'chair';
    
    const chairMaterial = new THREE.MeshStandardMaterial({
        color: 0x8B4513,
        roughness: 0.7,
        metalness: 0.1
    });
    
    // Seat
    const seatGeometry = new THREE.BoxGeometry(0.4, 0.05, 0.4);
    const seat = new THREE.Mesh(seatGeometry, chairMaterial);
    seat.name = 'chair_seat';
    seat.position.y = 0.45; // Standard chair height
    seat.castShadow = true;
    seat.receiveShadow = true;
    
    // Back
    const backGeometry = new THREE.BoxGeometry(0.4, 0.4, 0.05);
    const back = new THREE.Mesh(backGeometry, chairMaterial);
    back.name = 'chair_back';
    back.position.y = 0.65;
    back.position.z = -0.175;
    back.castShadow = true;
    back.receiveShadow = true;
    
    // Legs
    const legGeometry = new THREE.BoxGeometry(0.04, 0.45, 0.04);
    for (let i = 0; i < 4; i++) {
        const leg = new THREE.Mesh(legGeometry, chairMaterial);
        leg.name = `chair_leg_${i}`;
        leg.castShadow = true;
        leg.receiveShadow = true;
        
        leg.position.x = ((i % 2) * 2 - 1) * 0.16; // -0.16 or 0.16
        leg.position.z = (Math.floor(i / 2) * 2 - 1) * 0.16; // -0.16 or 0.16
        leg.position.y = 0.225; // Half of leg height
        
        chairGroup.add(leg);
    }
    
    chairGroup.add(seat);
    chairGroup.add(back);
    return chairGroup;
}

function createShelvingUnit() {
    const shelfGroup = new THREE.Group();
    shelfGroup.name = 'shelf';
    
    // Materials
    const woodMaterial = new THREE.MeshStandardMaterial({
        color: 0x8B4513,
        roughness: 0.7,
        metalness: 0.1
    });
    
    // Create vertical sides
    const sideGeometry = new THREE.BoxGeometry(0.05, 1.8, 0.3);
    const leftSide = new THREE.Mesh(sideGeometry, woodMaterial);
    const rightSide = new THREE.Mesh(sideGeometry, woodMaterial);
    
    leftSide.name = 'shelf_left_side';
    rightSide.name = 'shelf_right_side';
    
    leftSide.position.set(-0.575, 0.9, 0);
    rightSide.position.set(0.575, 0.9, 0);
    
    leftSide.castShadow = true;
    rightSide.castShadow = true;
    
    shelfGroup.add(leftSide);
    shelfGroup.add(rightSide);
    
    // Create horizontal shelves
    const shelfGeometry = new THREE.BoxGeometry(1.2, 0.03, 0.28);
    const numShelves = 4; // 4 shelves creates 5 compartments
    
    for (let i = 0; i <= numShelves; i++) {
        const shelf = new THREE.Mesh(shelfGeometry, woodMaterial);
        shelf.name = `shelf_horizontal_${i}`;
        // Distribute shelves evenly
        const height = (i * (1.8 / numShelves));
        shelf.position.set(0, height, 0);
        shelf.castShadow = true;
        shelf.receiveShadow = true;
        shelfGroup.add(shelf);
        
        // Add vertical dividers for each shelf section (except the top)
        if (i < numShelves) {
            const dividerGeometry = new THREE.BoxGeometry(0.02, 1.8/numShelves - 0.03, 0.25);
            const divider = new THREE.Mesh(dividerGeometry, woodMaterial);
            divider.name = `shelf_divider_${i}`;
            divider.position.set(0, height + (1.8/numShelves)/2, 0);
            divider.castShadow = true;
            shelfGroup.add(divider);
        }
    }
    
    // Add backing board
    const backingGeometry = new THREE.BoxGeometry(1.2, 1.8, 0.02);
    const backingMaterial = new THREE.MeshStandardMaterial({
        color: 0x8B4513,
        roughness: 0.8,
        metalness: 0.1
    });
    const backing = new THREE.Mesh(backingGeometry, backingMaterial);
    backing.name = 'shelf_back';
    backing.position.set(0, 0.9, -0.14);
    backing.receiveShadow = true;
    shelfGroup.add(backing);
    
    return shelfGroup;
}

// Function to get random position within room bounds
function getRandomPosition(roomWidth, roomLength, objectWidth, objectLength) {
    // Define zones to avoid (near walls and shelves)
    const margin = 0.5;  // Margin from walls
    const shelfZoneDepth = 1.5;  // Area to avoid near the back wall where shelves are

    // Calculate available area
    const minX = -roomWidth/2 + margin + objectWidth/2;
    const maxX = roomWidth/2 - margin - objectWidth/2;
    const minZ = -roomLength/2 + shelfZoneDepth + objectLength/2;  // Keep away from back wall/shelves
    const maxZ = roomLength/2 - margin - objectLength/2;

    // Divide room into quadrants for better distribution
    const centerX = 0;
    const centerZ = (minZ + maxZ) / 2;

    // Randomly choose a quadrant (left or right side of room)
    const useLeftSide = Math.random() < 0.5;
    
    let x, z;
    if (useLeftSide) {
        x = Math.random() * (centerX - minX - objectWidth) + minX;
    } else {
        x = Math.random() * (maxX - centerX - objectWidth) + centerX;
    }
    
    // Random Z position in the front half of the room
    z = Math.random() * (maxZ - centerZ) + centerZ;

    return { x, z };
}

export function createFurniture(roomWidth, roomLength) {
    const furniture = [];
    
    // Create and position table
    const table = createTable();
    const tablePos = getRandomPosition(roomWidth, roomLength, 1.4, 1.0); // Updated for new table size
    table.position.set(tablePos.x, 0, tablePos.z);
    
    // Randomly rotate the table (0, 90, 180, or 270 degrees)
    const tableRotation = Math.floor(Math.random() * 4) * (Math.PI / 2);
    table.rotation.y = tableRotation;
    furniture.push(table);
    
    // Create and position chairs around the table
    const chairPositions = [
        { x: 0, z: 0.5, rotation: Math.PI },    // Front chair - swapped from 0 to PI
        { x: 0, z: -0.5, rotation: 0 },         // Back chair - swapped from PI to 0
        { x: 0.7, z: 0, rotation: -Math.PI/2 }, // Right chair - swapped from PI/2 to -PI/2
        { x: -0.7, z: 0, rotation: Math.PI/2 }  // Left chair - swapped from -PI/2 to PI/2
    ];
    
    chairPositions.forEach(pos => {
        const chair = createChair();
        // Calculate chair position relative to table, considering table rotation
        const rotatedX = pos.x * Math.cos(tableRotation) - pos.z * Math.sin(tableRotation);
        const rotatedZ = pos.x * Math.sin(tableRotation) + pos.z * Math.cos(tableRotation);
        
        chair.position.set(
            tablePos.x + rotatedX,
            0,
            tablePos.z + rotatedZ
        );
        chair.rotation.y = pos.rotation + tableRotation;
        furniture.push(chair);
    });
    
    // Create and position shelving unit against the back wall
    const shelf = createShelvingUnit();
    shelf.position.set(0, 0, -roomLength/2 + 0.15);
    furniture.push(shelf);
    
    return furniture;
} 