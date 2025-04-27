import * as THREE from 'three';
import { createFurniture } from '../furniture/furniture.js';
import { WallTelephone } from '../props/WallTelephone.js';
import { createWall, createParquetTexture, createCeilingTexture } from './roomUtils.js';
import { ROOM_DIMENSIONS, WALL_PALETTES, WALL_PATTERNS } from '../../config/RoomConfig.js';
import { FLOWER_CONFIG } from '../../config/GameConfig.js';
import { FlowerProp } from '../props/FlowerProp.js';

export class Room {
    /**
     * @param {Object} options
     * @param {THREE.Vector3} [options.position] - Position of the room
     * @param {Object} [options.config] - Room configuration (wallStyle, lighting, passages, skipWalls, etc.)
     * @param {THREE.WebGLRenderer} [options.renderer] - Renderer for texture generation
     * @param {string} [options.id] - Unique identifier for the room
     */
    constructor({ position = new THREE.Vector3(0, 0, 0), config = {}, renderer = null, id = null } = {}) {
        this.position = position;
        this.config = config;
        this.renderer = renderer;
        this.id = id || `room_${Math.floor(Math.random() * 10000)}`;
        this.group = new THREE.Group();
        this.group.position.copy(this.position);
        this.group.name = this.id;
        
        // Track neighboring rooms and connections
        this.neighbors = {
            north: null, // +z direction
            south: null, // -z direction
            east: null,  // +x direction
            west: null   // -x direction
        };
        
        // Wall status tracking
        this.walls = {
            north: null, // front wall
            south: null, // back wall
            east: null,  // right wall
            west: null   // left wall
        };
        
        this.generateRoom();
    }

    randomWallStyle() {
        const palette = WALL_PALETTES[Math.floor(Math.random() * WALL_PALETTES.length)];
        const pattern = WALL_PATTERNS[Math.floor(Math.random() * WALL_PATTERNS.length)];
        return { pattern, base: palette.base, accent: palette.accent };
    }
    
    /**
     * Connect this room to another room in the specified direction
     * @param {Room} room - The room to connect to
     * @param {string} direction - Direction from this room to the other ('north', 'south', 'east', 'west')
     * @param {Object} [passageConfig] - Configuration for the passage between rooms
     */
    connectTo(room, direction, passageConfig = { width: 1.2, height: 2.2 }) {
        if (!room || !direction) return;
        
        // Set up the bidirectional connection
        const oppositeDir = this.getOppositeDirection(direction);
        
        // Register as neighbors
        this.neighbors[direction] = { 
            room, 
            passage: passageConfig 
        };
        
        room.neighbors[oppositeDir] = { 
            room: this, 
            passage: passageConfig 
        };
        
        // For existing rooms, update their walls
        this.updateWalls();
        room.updateWalls();
    }
    
    /**
     * Get the opposite cardinal direction
     */
    getOppositeDirection(direction) {
        const opposites = {
            north: 'south',
            south: 'north',
            east: 'west',
            west: 'east'
        };
        return opposites[direction] || null;
    }
    
    /**
     * Update walls based on neighbors
     * This can be called after connections change
     */
    updateWalls() {
        // First clear existing walls if needed
        this.clearWalls();
        
        // Then regenerate them
        this.generateWalls();
    }
    
    /**
     * Remove all walls from the room
     */
    clearWalls() {
        const wallNames = ['frontWall', 'backWall', 'leftWall', 'rightWall'];
        wallNames.forEach(name => {
            const wall = this.group.getObjectByName(name);
            if (wall) {
                this.group.remove(wall);
            }
        });
        
        // Reset wall tracking
        this.walls = {
            north: null,
            south: null,
            east: null,
            west: null
        };
    }

    /**
     * Generates the room structure and contents.
     * Uses config.wallStyle, config.passages, and config.skipWalls if provided.
     */
    generateRoom() {
        const roomWidth = ROOM_DIMENSIONS.width;
        const roomLength = ROOM_DIMENSIONS.length;
        const roomHeight = ROOM_DIMENSIONS.height;
        
        // Store dimensions for future reference
        this.dimensions = { width: roomWidth, length: roomLength, height: roomHeight };
        
        // Get or generate wall style
        this.wallStyle = this.config.wallStyle || this.randomWallStyle();
        
        // Floor, rug, ceiling ONLY - explicitly create these without using createRoom
        const roomGroup = new THREE.Group();
        roomGroup.name = 'roomShell';
        
        // Create floor
        const floorTexture = createParquetTexture(this.renderer);
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
        roomGroup.add(floor);
        
        // Create rug
        const rugGeometry = new THREE.CircleGeometry(1.2, 32);
        const rugMaterial = new THREE.MeshStandardMaterial({ color: 0xf7cac9, roughness: 0.8 });
        const rug = new THREE.Mesh(rugGeometry, rugMaterial);
        rug.position.set(0, 0.01, 0);
        rug.rotation.x = -Math.PI / 2;
        rug.receiveShadow = true;
        rug.name = 'rug';
        roomGroup.add(rug);
        
        // Create ceiling
        const ceilingTexture = createCeilingTexture(this.renderer);
        const ceilingMaterial = new THREE.MeshStandardMaterial({
            map: ceilingTexture,
            color: 0xf7f3e8,
            roughness: 0.8,
            metalness: 0.05
        });
        const ceilingGeometry = new THREE.PlaneGeometry(roomWidth, roomLength);
        const ceiling = new THREE.Mesh(ceilingGeometry, ceilingMaterial);
        ceiling.position.y = roomHeight;
        ceiling.rotation.x = Math.PI / 2;
        ceiling.receiveShadow = true;
        ceiling.name = 'ceiling';
        roomGroup.add(ceiling);
        
        this.group.add(roomGroup);

        // Generate walls
        this.generateWalls();
        
        // --- Ceiling Lighting (configurable in the future) ---
        this.addLighting(roomHeight);
        
        // --- Furniture (configurable in the future) ---
        this.addFurniture(roomWidth, roomLength);
        
        // --- Props ---
        this.addWallProps(roomWidth, roomLength);
        this.addFlowers(roomWidth, roomLength);
    }
    
    /**
     * Generate walls based on neighbors
     */
    generateWalls() {
        const { width, length, height } = this.dimensions;
        
        // Check if we should skip walls or add passages based on neighbor connections
        const skipWalls = this.config.skipWalls || {};
        const passages = {};
        
        // Convert neighbor connections to wall configurations
        Object.entries(this.neighbors).forEach(([direction, neighborInfo]) => {
            if (neighborInfo) {
                // There's a connected room in this direction
                skipWalls[this.directionToWall(direction)] = true;
            }
        });
        
        // Create walls that aren't skipped
        // Back wall (south)
        if (!skipWalls.back && !skipWalls.south) {
            const backWall = createWall(width, height, true, this.wallStyle, true, passages.back || passages.south || null);
            backWall.position.z = -length/2;
            backWall.position.y = 0;
            backWall.name = 'backWall';
            this.group.add(backWall);
            this.walls.south = backWall;
        }
        
        // Front wall (north)
        if (!skipWalls.front && !skipWalls.north) {
            const frontWall = createWall(width, height, true, this.wallStyle, true, passages.front || passages.north || null);
            frontWall.position.z = length/2;
            frontWall.position.y = 0;
            frontWall.rotation.y = Math.PI;
            frontWall.name = 'frontWall';
            this.group.add(frontWall);
            this.walls.north = frontWall;
        }
        
        // Left wall (west)
        if (!skipWalls.left && !skipWalls.west) {
            const leftWall = createWall(length, height, false, this.wallStyle, true, passages.left || passages.west || null);
            leftWall.position.x = -width/2;
            leftWall.position.y = 0;
            leftWall.rotation.y = Math.PI / 2;
            leftWall.name = 'leftWall';
            this.group.add(leftWall);
            this.walls.west = leftWall;
        }
        
        // Right wall (east)
        if (!skipWalls.right && !skipWalls.east) {
            const rightWall = createWall(length, height, false, this.wallStyle, true, passages.right || passages.east || null);
            rightWall.position.x = width/2;
            rightWall.position.y = 0;
            rightWall.rotation.y = -Math.PI / 2;
            rightWall.name = 'rightWall';
            this.group.add(rightWall);
            this.walls.east = rightWall;
        }
    }
    
    /**
     * Convert cardinal direction to wall name
     */
    directionToWall(direction) {
        const map = {
            north: 'front',
            south: 'back',
            east: 'right',
            west: 'left'
        };
        return map[direction] || direction;
    }
    
    /**
     * Add ceiling lighting to the room
     */
    addLighting(roomHeight) {
        const ceilingLight = new THREE.PointLight(0xfff8e1, 1.1, 10, 2);
        ceilingLight.position.set(0, roomHeight - 0.05, 0);
        ceilingLight.castShadow = true;
        ceilingLight.shadow.mapSize.width = 1024;
        ceilingLight.shadow.mapSize.height = 1024;
        ceilingLight.shadow.radius = 8;
        ceilingLight.shadow.bias = -0.002;
        ceilingLight.name = 'ceilingLight';
        this.group.add(ceilingLight);
        
        // Lamp mesh
        const lampGeometry = new THREE.CircleGeometry(0.22, 24);
        const lampMaterial = new THREE.MeshStandardMaterial({ color: 0xfff8e1, emissive: 0xffe4b5, emissiveIntensity: 0.7, roughness: 0.5 });
        const lampMesh = new THREE.Mesh(lampGeometry, lampMaterial);
        lampMesh.position.set(0, roomHeight - 0.01, 0);
        lampMesh.rotation.x = -Math.PI / 2;
        lampMesh.receiveShadow = false;
        lampMesh.castShadow = false;
        lampMesh.name = 'ceiling_lamp';
        this.group.add(lampMesh);
    }
    
    /**
     * Add furniture to the room
     */
    addFurniture(roomWidth, roomLength) {
        const furniture = createFurniture(roomWidth, roomLength);
        const furnitureGroup = new THREE.Group();
        furnitureGroup.name = 'furniture';
        furniture.forEach(item => furnitureGroup.add(item));
        this.group.add(furnitureGroup);
    }
    
    /**
     * Add wall-mounted props
     */
    addWallProps(roomWidth, roomLength) {
        // Wall Telephone
        const phonePosition = new THREE.Vector3(roomWidth/2 - 0.04, 1.5, roomLength/2 - 1.0);
        const wallPhone = new WallTelephone(phonePosition);
        wallPhone.model.userData.telephoneInstance = wallPhone;
        wallPhone.model.name = 'wallPhone';
        this.group.add(wallPhone.model);
    }
    
    /**
     * Add flowers and other decoration props
     */
    addFlowers(roomWidth, roomLength) {
        // Find the table position for placement calculations
        const furnitureGroup = this.group.getObjectByName('furniture');
        const table = furnitureGroup ? furnitureGroup.children.find(obj => obj.name === 'table') : null;
        const tablePos = table ? table.position : new THREE.Vector3(0, 0, 0);
        const tableSize = { width: 1.4, depth: 1.0 };
        
        function isTooCloseXZ(posA, sizeA, posB, sizeB, minGap = 0.25) {
            return (
                Math.abs(posA.x - posB.x) < (sizeA.width / 2 + sizeB.width / 2 + minGap) &&
                Math.abs(posA.z - posB.z) < (sizeA.depth / 2 + sizeB.depth / 2 + minGap)
            );
        }
        
        function clampToRoom(x, z, margin = 0.3) {
            return {
                x: Math.max(-roomWidth/2 + margin, Math.min(roomWidth/2 - margin, x)),
                z: Math.max(-roomLength/2 + margin, Math.min(roomLength/2 - margin, z))
            };
        }
        
        // Create a group for flowers
        const flowerGroup = new THREE.Group();
        flowerGroup.name = 'flowers';
        
        FLOWER_CONFIG.variants.forEach(variant => {
            let pos = { ...variant.position };
            const flowerSize = { width: 0.18, depth: 0.18 };
            if (isTooCloseXZ(pos, flowerSize, tablePos, tableSize)) {
                if (pos.x < tablePos.x) pos.x -= (tableSize.width/2 + flowerSize.width/2 + 0.3);
                else pos.x += (tableSize.width/2 + flowerSize.width/2 + 0.3);
                const clamped = clampToRoom(pos.x, pos.z);
                pos.x = clamped.x;
                pos.z = clamped.z;
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
            flowerGroup.add(flower.model);
        });
        
        this.group.add(flowerGroup);
    }

    addToScene(scene) {
        scene.add(this.group);
    }

    removeFromScene(scene) {
        scene.remove(this.group);
    }
} 