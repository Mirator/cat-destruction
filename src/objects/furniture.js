import * as THREE from 'three';

// Common material configurations
const WOOD_MATERIAL_CONFIG = {
    color: 0x8B4513,
    roughness: 0.7,
    metalness: 0.1
};

// Furniture dimensions
const FURNITURE_DIMENSIONS = {
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
        shelfThickness: 0.03
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

function createShelvingUnit() {
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
    
    // Create horizontal shelves
    const shelfGeometry = new THREE.BoxGeometry(dims.width, dims.shelfThickness, dims.depth - 0.02);
    const numShelves = 4;
    
    for (let i = 0; i <= numShelves; i++) {
        const shelf = new THREE.Mesh(shelfGeometry, woodMaterial);
        shelf.name = `shelf_horizontal_${i}`;
        const height = (i * (dims.height / numShelves));
        shelf.position.set(0, height, 0);
        shelf.castShadow = true;
        shelf.receiveShadow = true;
        shelfGroup.add(shelf);
        
        // Add dividers except for top shelf
        if (i < numShelves) {
            const dividerGeometry = new THREE.BoxGeometry(0.02, dims.height/numShelves - dims.shelfThickness, dims.depth - 0.05);
            const divider = new THREE.Mesh(dividerGeometry, woodMaterial);
            divider.name = `shelf_divider_${i}`;
            divider.position.set(0, height + (dims.height/numShelves)/2, 0);
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
    
    return shelfGroup;
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

export function createFurniture(roomWidth, roomLength) {
    const furniture = [];
    
    // Create and position table
    const table = createTable();
    const tablePos = getRandomPosition(roomWidth, roomLength, FURNITURE_DIMENSIONS.table.width, FURNITURE_DIMENSIONS.table.depth);
    table.position.set(tablePos.x, 0, tablePos.z);
    
    const tableRotation = Math.floor(Math.random() * 4) * (Math.PI / 2);
    table.rotation.y = tableRotation;
    furniture.push(table);
    
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
    });
    
    // Create and position shelf
    const shelf = createShelvingUnit();
    shelf.position.set(0, 0, -roomLength/2 + 0.15);
    furniture.push(shelf);
    
    return furniture;
} 