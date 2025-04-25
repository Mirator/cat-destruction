import * as THREE from 'three';

function createTable() {
    const tableGroup = new THREE.Group();
    
    // Table top
    const topGeometry = new THREE.BoxGeometry(1.2, 0.05, 0.8);
    const tableMaterial = new THREE.MeshStandardMaterial({
        color: 0x8B4513,
        roughness: 0.7,
        metalness: 0.1
    });
    const tableTop = new THREE.Mesh(topGeometry, tableMaterial);
    tableTop.position.y = 0.7; // Standard table height
    tableTop.castShadow = true;
    tableTop.receiveShadow = true;
    
    // Table legs
    const legGeometry = new THREE.BoxGeometry(0.05, 0.7, 0.05);
    for (let i = 0; i < 4; i++) {
        const leg = new THREE.Mesh(legGeometry, tableMaterial);
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
    
    const chairMaterial = new THREE.MeshStandardMaterial({
        color: 0x8B4513,
        roughness: 0.7,
        metalness: 0.1
    });
    
    // Seat
    const seatGeometry = new THREE.BoxGeometry(0.4, 0.05, 0.4);
    const seat = new THREE.Mesh(seatGeometry, chairMaterial);
    seat.position.y = 0.45; // Standard chair height
    seat.castShadow = true;
    seat.receiveShadow = true;
    
    // Back
    const backGeometry = new THREE.BoxGeometry(0.4, 0.4, 0.05);
    const back = new THREE.Mesh(backGeometry, chairMaterial);
    back.position.y = 0.65;
    back.position.z = -0.175;
    back.castShadow = true;
    back.receiveShadow = true;
    
    // Legs
    const legGeometry = new THREE.BoxGeometry(0.04, 0.45, 0.04);
    for (let i = 0; i < 4; i++) {
        const leg = new THREE.Mesh(legGeometry, chairMaterial);
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

function createBookshelf() {
    const shelfGroup = new THREE.Group();
    
    const shelfMaterial = new THREE.MeshStandardMaterial({
        color: 0x8B4513,
        roughness: 0.7,
        metalness: 0.1
    });
    
    // Main frame
    const frameGeometry = new THREE.BoxGeometry(1.2, 1.8, 0.3);
    const frame = new THREE.Mesh(frameGeometry, shelfMaterial);
    frame.position.y = 0.9; // Half height
    frame.castShadow = true;
    frame.receiveShadow = true;
    
    // Shelves
    const shelfGeometry = new THREE.BoxGeometry(1.1, 0.03, 0.28);
    for (let i = 0; i < 4; i++) {
        const shelf = new THREE.Mesh(shelfGeometry, shelfMaterial);
        shelf.position.y = 0.2 + (i * 0.45); // Space shelves evenly
        shelf.castShadow = true;
        shelf.receiveShadow = true;
        shelfGroup.add(shelf);
    }
    
    shelfGroup.add(frame);
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
    
    // Create and position chairs
    for (let i = 0; i < 2; i++) {
        const chair = createChair();
        const chairPos = getRandomPosition(roomWidth, roomLength, 0.4, 0.4);
        chair.position.set(chairPos.x, 0, chairPos.z);
        // Random rotation for chairs
        chair.rotation.y = Math.random() * Math.PI * 2;
        furniture.push(chair);
    }
    
    // Create and position bookshelf
    const bookshelf = createBookshelf();
    const shelfPos = getRandomPosition(roomWidth, roomLength, 1.2, 0.3);
    bookshelf.position.set(shelfPos.x, 0, shelfPos.z);
    // Place bookshelf against a wall
    if (Math.abs(shelfPos.x) > Math.abs(shelfPos.z)) {
        bookshelf.position.x = Math.sign(shelfPos.x) * (roomWidth/2 - 0.15);
        bookshelf.rotation.y = Math.PI/2;
    } else {
        bookshelf.position.z = Math.sign(shelfPos.z) * (roomLength/2 - 0.15);
    }
    furniture.push(bookshelf);
    
    return furniture;
} 