import * as THREE from 'three';

function createTable() {
    const tableGroup = new THREE.Group();
    tableGroup.name = 'table';
    
    // Table top
    const topGeometry = new THREE.BoxGeometry(1.2, 0.05, 0.8);
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
    
    // Table legs
    const legGeometry = new THREE.BoxGeometry(0.05, 0.7, 0.05);
    for (let i = 0; i < 4; i++) {
        const leg = new THREE.Mesh(legGeometry, tableMaterial);
        leg.name = `table_leg_${i}`;
        leg.castShadow = true;
        leg.receiveShadow = true;
        
        // Position legs at corners
        leg.position.x = ((i % 2) * 2 - 1) * 0.55; // -0.55 or 0.55
        leg.position.z = (Math.floor(i / 2) * 2 - 1) * 0.35; // -0.35 or 0.35
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
    const minX = -roomWidth/2 + objectWidth;
    const maxX = roomWidth/2 - objectWidth;
    const minZ = -roomLength/2 + objectLength;
    const maxZ = roomLength/2 - objectLength;
    
    return {
        x: Math.random() * (maxX - minX) + minX,
        z: Math.random() * (maxZ - minZ) + minZ
    };
}

export function createFurniture(roomWidth, roomLength) {
    const furniture = [];
    
    // Create and position table
    const table = createTable();
    const tablePos = getRandomPosition(roomWidth, roomLength, 1.2, 0.8);
    table.position.set(tablePos.x, 0, tablePos.z);
    furniture.push(table);
    
    // Create and position chairs around the table
    const chairPositions = [
        { x: 0, z: 0.6, rotation: Math.PI }, // Front of table
        { x: 0, z: -0.6, rotation: 0 }      // Back of table
    ];
    
    chairPositions.forEach(pos => {
        const chair = createChair();
        // Position relative to table
        chair.position.set(
            tablePos.x + pos.x,
            0,
            tablePos.z + pos.z
        );
        chair.rotation.y = pos.rotation;
        furniture.push(chair);
    });
    
    // Create and position single shelving unit
    const shelf = createShelvingUnit();
    // Always place against the back wall
    shelf.position.set(0, 0, -roomLength/2 + 0.15);
    furniture.push(shelf);
    
    return furniture;
} 