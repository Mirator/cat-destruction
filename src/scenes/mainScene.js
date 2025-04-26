import * as THREE from 'three';
import { createFurniture } from '../objects/furniture.js';
import { Food } from '../objects/food.js';
import { FlowerProp } from '../objects/FlowerProp.js';
import { FLOWER_CONFIG } from '../config/GameConfig.js';
import { WallTelephone } from '../objects/WallTelephone.js';
import { Parcel } from '../objects/parcel.js';

export function createScene() {
    // Create scene, camera and renderer
    const scene = new THREE.Scene();
    Food.setScene(scene);
    
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // Add warm ambient light
    const ambientLight = new THREE.AmbientLight(0xffe4b5, 0.7); // warm light
    scene.add(ambientLight);

    // Add warm directional light
    const directionalLight = new THREE.DirectionalLight(0xfff8dc, 0.9); // soft warm
    directionalLight.position.set(2, 2.5, 2);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 1024;
    directionalLight.shadow.mapSize.height = 1024;
    scene.add(directionalLight);

    // Room dimensions (in meters)
    const roomWidth = 6;  // 6 meters wide
    const roomLength = 8; // 8 meters long
    const roomHeight = 3; // 3 meters high

    // --- Cozy Floor ---
    // Create a parquet pattern using CanvasTexture
    function createParquetTexture() {
        const size = 512;
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        // Fill background with a light wood color
        ctx.fillStyle = '#e2c290';
        ctx.fillRect(0, 0, size, size);
        // Parquet colors (warm wood tones, no black)
        const colors = ['#e2c290', '#d1a974', '#c9a066', '#b88b4a'];
        const tile = 64; // bigger tiles for a larger pattern
        // Herringbone pattern
        for (let y = 0; y < size; y += tile) {
            for (let x = 0; x < size; x += tile) {
                // Offset every other row for herringbone effect
                const offset = (Math.floor(y / tile) % 2) * (tile / 2);
                ctx.save();
                ctx.translate(x + offset, y);
                ctx.rotate((Math.floor((x + y) / tile) % 2) * Math.PI / 2);
                ctx.fillStyle = colors[Math.floor(Math.random() * colors.length)];
                // Overlap tiles slightly to avoid gaps
                ctx.fillRect(-2, -2, tile + 4, tile + 4);
                // Add subtle wood grain lines (no black)
                ctx.strokeStyle = 'rgba(180, 140, 80, 0.13)';
                ctx.lineWidth = 2;
                for (let i = 8; i < tile; i += 12) {
                    ctx.beginPath();
                    ctx.moveTo(i, 0);
                    ctx.lineTo(i, tile);
                    ctx.stroke();
                }
                ctx.restore();
            }
        }
        // Add some subtle noise for texture (no black)
        for (let i = 0; i < 1200; i++) {
            ctx.fillStyle = 'rgba(200, 170, 110, 0.06)';
            ctx.beginPath();
            ctx.arc(Math.random() * size, Math.random() * size, Math.random() * 2, 0, 2 * Math.PI);
            ctx.fill();
        }
        const texture = new THREE.CanvasTexture(canvas);
        texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(4, 4);
        return texture;
    }
    const floorTexture = createParquetTexture();
    floorTexture.anisotropy = renderer.capabilities.getMaxAnisotropy();
    const floorMaterial = new THREE.MeshStandardMaterial({ 
        map: floorTexture,
        roughness: 0.7,
        metalness: 0.15
    });
    const floorGeometry = new THREE.PlaneGeometry(roomWidth, roomLength);
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    floor.name = 'floor';
    scene.add(floor);

    // Add a cozy rug in the center
    const rugGeometry = new THREE.CircleGeometry(1.2, 32);
    const rugMaterial = new THREE.MeshStandardMaterial({ color: 0xf7cac9, roughness: 0.8 }); // soft pink
    const rug = new THREE.Mesh(rugGeometry, rugMaterial);
    rug.position.set(0, 0.01, 0); // slightly above floor
    rug.rotation.x = -Math.PI / 2;
    rug.receiveShadow = true;
    rug.name = 'rug';
    scene.add(rug);

    // --- Cozy Walls ---
    // Create a vertical stripe pattern using CanvasTexture, but with a muted sage green base
    function createWallTexture() {
        const size = 256;
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        // Base color: muted sage green
        ctx.fillStyle = '#b7c7b0';
        ctx.fillRect(0, 0, size, size);
        // Stripes: slightly darker green
        ctx.globalAlpha = 0.18;
        ctx.fillStyle = '#8fa58c';
        for (let i = 0; i < size; i += 32) {
            ctx.fillRect(i, 0, 16, size);
        }
        ctx.globalAlpha = 1.0;
        const texture = new THREE.CanvasTexture(canvas);
        texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(2, 2);
        return texture;
    }
    const wallTexture = createWallTexture();
    wallTexture.anisotropy = renderer.capabilities.getMaxAnisotropy();
    // Two-tone wall: lower part is a bit darker
    function createWallMaterial(isLower) {
        return new THREE.MeshStandardMaterial({
            map: wallTexture,
            color: isLower ? 0x8fa58c : 0xb7c7b0,
            roughness: 0.6,
            metalness: 0.08
        });
    }
    // Helper to create a wall with two-tone effect
    function createWall(width, height, isFrontOrBack) {
        const group = new THREE.Group();
        // Lower part
        const lowerHeight = height * 0.35;
        const lowerGeo = new THREE.PlaneGeometry(width, lowerHeight);
        const lowerMat = createWallMaterial(true);
        const lower = new THREE.Mesh(lowerGeo, lowerMat);
        lower.position.y = lowerHeight / 2;
        lower.receiveShadow = true;
        group.add(lower);
        // Upper part
        const upperHeight = height - lowerHeight;
        const upperGeo = new THREE.PlaneGeometry(width, upperHeight);
        const upperMat = createWallMaterial(false);
        const upper = new THREE.Mesh(upperGeo, upperMat);
        upper.position.y = lowerHeight + upperHeight / 2;
        upper.receiveShadow = true;
        group.add(upper);
        // For front/back, z is set, for left/right, x is set
        return group;
    }
    // Back wall
    const backWall = createWall(roomWidth, roomHeight, true);
    backWall.position.z = -roomLength/2;
    backWall.position.y = 0;
    scene.add(backWall);
    // Front wall
    const frontWall = createWall(roomWidth, roomHeight, true);
    frontWall.position.z = roomLength/2;
    frontWall.position.y = 0;
    frontWall.rotation.y = Math.PI;
    scene.add(frontWall);
    // Left wall
    const leftWall = createWall(roomLength, roomHeight, false);
    leftWall.position.x = -roomWidth/2;
    leftWall.position.y = 0;
    leftWall.rotation.y = Math.PI / 2;
    scene.add(leftWall);
    // Right wall
    const rightWall = createWall(roomLength, roomHeight, false);
    rightWall.position.x = roomWidth/2;
    rightWall.position.y = 0;
    rightWall.rotation.y = -Math.PI / 2;
    scene.add(rightWall);

    // --- Add a Door to a Random Wall ---
    // Helper to create a simple door texture
    function createDoorTexture() {
        const size = 128;
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size * 2;
        const ctx = canvas.getContext('2d');
        // Door base
        ctx.fillStyle = '#bfa16a';
        ctx.fillRect(0, 0, size, size * 2);
        // Door panels
        ctx.strokeStyle = '#8a6a3a';
        ctx.lineWidth = 6;
        ctx.strokeRect(10, 10, size - 20, size * 2 - 20);
        ctx.lineWidth = 3;
        ctx.strokeRect(25, 25, size - 50, size - 40);
        ctx.strokeRect(25, size + 15, size - 50, size - 40);
        // Door knob
        ctx.beginPath();
        ctx.arc(size - 25, size, 7, 0, 2 * Math.PI);
        ctx.fillStyle = '#e2c290';
        ctx.fill();
        // Label
        ctx.font = 'bold 20px sans-serif';
        ctx.fillStyle = '#6a4a1a';
        ctx.fillText('DOOR', 30, size + 10);
        return new THREE.CanvasTexture(canvas);
    }
    const doorTexture = createDoorTexture();
    const doorMaterial = new THREE.MeshStandardMaterial({ map: doorTexture, roughness: 0.5, metalness: 0.1 });
    const doorWidth = 0.9;
    const doorHeight = 2.1;
    // Add furniture
    const furniture = createFurniture(roomWidth, roomLength);
    furniture.forEach(item => scene.add(item));

    // Add wall telephone to the right wall, 1.5m above the floor, near the front
    const phonePosition = new THREE.Vector3(roomWidth/2 - 0.04, 1.5, roomLength/2 - 1.0);
    const wallPhone = new WallTelephone(phonePosition);
    wallPhone.model.userData.telephoneInstance = wallPhone;
    scene.add(wallPhone.model);

    // --- Ensure flowers are not too close to the table ---
    // Find the table in the furniture array
    const table = furniture.find(obj => obj.name === 'table');
    const tablePos = table ? table.position : new THREE.Vector3(0, 0, 0);
    // Table size from config
    const tableSize = { width: 1.4, depth: 1.0 };
    // Helper: check if two objects are too close (AABB in XZ)
    function isTooCloseXZ(posA, sizeA, posB, sizeB, minGap = 0.25) {
        return (
            Math.abs(posA.x - posB.x) < (sizeA.width / 2 + sizeB.width / 2 + minGap) &&
            Math.abs(posA.z - posB.z) < (sizeA.depth / 2 + sizeB.depth / 2 + minGap)
        );
    }
    // Helper: clamp position within room bounds
    function clampToRoom(x, z, margin = 0.3) {
        return {
            x: Math.max(-roomWidth/2 + margin, Math.min(roomWidth/2 - margin, x)),
            z: Math.max(-roomLength/2 + margin, Math.min(roomLength/2 - margin, z))
        };
    }
    // Add flower props, adjusting if too close to table
    const flowerModels = [];
    FLOWER_CONFIG.variants.forEach(variant => {
        let pos = { ...variant.position };
        const flowerSize = { width: 0.18, depth: 0.18 }; // Pot + leaves
        // If too close, shift along X or Z (simple logic)
        if (isTooCloseXZ(pos, flowerSize, tablePos, tableSize)) {
            // Try shifting along X first
            if (pos.x < tablePos.x) pos.x -= (tableSize.width/2 + flowerSize.width/2 + 0.3);
            else pos.x += (tableSize.width/2 + flowerSize.width/2 + 0.3);
            // Clamp to room
            const clamped = clampToRoom(pos.x, pos.z);
            pos.x = clamped.x;
            pos.z = clamped.z;
            // If still too close, shift along Z
            if (isTooCloseXZ(pos, flowerSize, tablePos, tableSize)) {
                if (pos.z < tablePos.z) pos.z -= (tableSize.depth/2 + flowerSize.depth/2 + 0.3);
                else pos.z += (tableSize.depth/2 + flowerSize.depth/2 + 0.3);
                const clamped2 = clampToRoom(pos.x, pos.z);
                pos.x = clamped2.x;
                pos.z = clamped2.z;
            }
        }
        const flower = new FlowerProp(
            new THREE.Vector3(pos.x, pos.y, pos.z),
            { flowerColor: variant.flowerColor }
        );
        scene.add(flower.model);
        flowerModels.push({ position: new THREE.Vector3(pos.x, pos.y, pos.z), size: flowerSize });
    });

    // --- Door Placement: Avoid Overlap with Shelf, Flowers, Telephone, and Bowl ---
    // Get shelf position/size
    const shelfObj = furniture.find(obj => obj.name === 'shelf');
    const shelfSize = { width: 1.2, depth: 0.3 };
    const shelfPos = shelfObj ? shelfObj.position : null;
    // Telephone info (always on right wall)
    const telephoneSize = { width: 0.18, depth: 0.08 }; // Approximate
    const telephonePos = new THREE.Vector3(roomWidth/2 - 0.04, 1.5, roomLength/2 - 1.0);
    // Bowl info
    const bowlObj = furniture.find(obj => obj.name === 'bowl');
    const bowlSize = { width: 0.4, depth: 0.4 };
    const bowlPos = bowlObj ? bowlObj.position : null;
    // Helper: check overlap in XZ
    function isOverlapXZ(posA, sizeA, posB, sizeB, minGap = 0.15) {
        return (
            Math.abs(posA.x - posB.x) < (sizeA.width / 2 + sizeB.width / 2 + minGap) &&
            Math.abs(posA.z - posB.z) < (sizeA.depth / 2 + sizeB.depth / 2 + minGap)
        );
    }
    // Try to place the door up to 20 times
    let doorPos, doorRotY, wallIdx;
    let valid = false;
    for (let attempt = 0; attempt < 20 && !valid; attempt++) {
        wallIdx = Math.floor(Math.random() * 4);
        doorPos = new THREE.Vector3();
        doorRotY = 0;
        if (wallIdx === 0) { // back wall
            doorPos.set((Math.random() - 0.5) * (roomWidth - doorWidth - 1.2), doorHeight/2, -roomLength/2 + 0.01);
            doorRotY = 0;
        } else if (wallIdx === 1) { // front wall
            doorPos.set((Math.random() - 0.5) * (roomWidth - doorWidth - 1.2), doorHeight/2, roomLength/2 - 0.01);
            doorRotY = Math.PI;
        } else if (wallIdx === 2) { // left wall
            doorPos.set(-roomWidth/2 + 0.01, doorHeight/2, (Math.random() - 0.5) * (roomLength - doorWidth - 1.2));
            doorRotY = Math.PI / 2;
        } else { // right wall
            doorPos.set(roomWidth/2 - 0.01, doorHeight/2, (Math.random() - 0.5) * (roomLength - doorWidth - 1.2));
            doorRotY = -Math.PI / 2;
        }
        // Check overlap with shelf
        let overlap = false;
        if (shelfPos && isOverlapXZ(doorPos, { width: doorWidth, depth: 0.2 }, shelfPos, shelfSize)) {
            overlap = true;
        }
        // Check overlap with flowers
        for (const flower of flowerModels) {
            if (isOverlapXZ(doorPos, { width: doorWidth, depth: 0.2 }, flower.position, flower.size)) {
                overlap = true;
                break;
            }
        }
        // Check overlap with telephone (only if right wall)
        if (wallIdx === 3) {
            if (isOverlapXZ(doorPos, { width: doorWidth, depth: 0.2 }, telephonePos, telephoneSize, 0.15)) {
                overlap = true;
            }
        }
        // Check overlap with bowl
        if (bowlPos && isOverlapXZ(doorPos, { width: doorWidth, depth: 0.2 }, bowlPos, bowlSize)) {
            overlap = true;
        }
        if (!overlap) valid = true;
    }
    // Remove previous door if present (for hot reload/dev)
    const prevDoor = scene.getObjectByName('restock_door');
    if (prevDoor) scene.remove(prevDoor);
    // Create door mesh
    const doorGeometry = new THREE.PlaneGeometry(doorWidth, doorHeight);
    const doorMesh = new THREE.Mesh(doorGeometry, doorMaterial);
    doorMesh.position.copy(doorPos);
    doorMesh.rotation.y = doorRotY;
    doorMesh.name = 'restock_door';
    doorMesh.castShadow = false;
    doorMesh.receiveShadow = true;
    scene.add(doorMesh);
    // Store door info for parcel spawning
    scene.userData.restockDoor = { position: doorPos.clone(), rotationY: doorRotY };

    // Set initial camera position
    camera.position.set(0, 1.7, 0); // Eye height
    camera.lookAt(0, 1.7, -1);

    // Handle window resize
    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });

    // --- Parcel Spawning Helper ---
    scene.userData.spawnParcelAtDoor = function() {
        // Remove existing parcel if present
        const existing = scene.getObjectByName('restock_parcel');
        if (existing) scene.remove(existing);
        const { position, rotationY } = scene.userData.restockDoor;
        // Try both offset directions
        const offset = 0.5;
        const dir = new THREE.Vector3(Math.sin(rotationY), 0, Math.cos(rotationY));
        let parcelPos1 = position.clone().add(dir.clone().multiplyScalar(-offset));
        let parcelPos2 = position.clone().add(dir.clone().multiplyScalar(offset));
        // Room bounds
        const roomWidth = 6, roomLength = 8;
        function inRoomBounds(pos) {
            return (
                pos.x > -roomWidth/2 && pos.x < roomWidth/2 &&
                pos.z > -roomLength/2 && pos.z < roomLength/2
            );
        }
        let chosenPos = null;
        if (inRoomBounds(parcelPos1)) {
            chosenPos = parcelPos1;
        } else if (inRoomBounds(parcelPos2)) {
            chosenPos = parcelPos2;
        } else {
            chosenPos = position.clone(); // fallback: at the door
        }
        // Create parcel using the Parcel class
        const parcel = new Parcel(chosenPos);
        scene.add(parcel.model);
        if (scene.userData.interactionManager) {
            scene.userData.interactionManager.collectObjects();
        }
        return parcel;
    };

    return { scene, camera, renderer };
}
