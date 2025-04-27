import * as THREE from 'three';
import { Room } from '../objects/room/Room.js';
import { Food } from '../objects/food/food.js';
import { createParquetTexture, createDynamicWallTexture, createCeilingTexture, createWallMaterial, createWall, createRoom, createSharedWall } from '../objects/room/roomUtils.js';
import { ROOM_DIMENSIONS, ROOM_CONFIGS, SHARED_WALL_THICKNESS } from '../config/RoomConfig.js';

/**
 * Manages rooms, connections between rooms, and shared walls
 */
class RoomManager {
    constructor(scene, renderer) {
        this.scene = scene;
        this.renderer = renderer;
        this.rooms = new Map();
        this.sharedWalls = [];
    }
    
    /**
     * Create a new room and add it to the manager
     * @param {Object} options - Room creation options
     * @returns {Room} - The newly created room
     */
    createRoom(options) {
        const room = new Room({
            position: options.position || new THREE.Vector3(0, 0, 0),
            config: options.config || {},
            renderer: this.renderer,
            id: options.id || `room_${this.rooms.size}`
        });
        
        this.rooms.set(room.id, room);
        room.addToScene(this.scene);
        return room;
    }
    
    /**
     * Connect two rooms with optional shared wall
     * @param {string} room1Id - ID of first room
     * @param {string} room2Id - ID of second room
     * @param {string} direction - Direction from room1 to room2 ('north', 'south', 'east', 'west')
     * @param {Object} options - Connection options including passage and shared wall config
     */
    connectRooms(room1Id, room2Id, direction, options = {}) {
        const room1 = this.rooms.get(room1Id);
        const room2 = this.rooms.get(room2Id);
        
        if (!room1 || !room2) {
            console.error(`Cannot connect rooms: room not found`);
            return;
        }
        
        // Default connection options
        const defaults = {
            hasPassage: true,
            passageWidth: 1.2,
            passageHeight: 2.2,
            addDoorFrame: true,
            createSharedWall: options.hasPassage === false
        };
        
        const config = { ...defaults, ...options };
        
        // Configure the passage if one exists
        const passage = config.hasPassage ? {
            width: config.passageWidth,
            height: config.passageHeight,
            x: config.passageX || 0,
            y: config.passageY || defaults.passageHeight / 2
        } : null;
        
        // Connect the rooms logically (this handles wall skipping)
        room1.connectTo(room2, direction, passage);
        
        // If createSharedWall is true, we should create a wall at the boundary
        if (config.createSharedWall) {
            this.createSharedWallBetween(room1, room2, direction, {
                passage,
                addDoorFrame: config.addDoorFrame
            });
        }
    }
    
    /**
     * Create a shared wall between two connected rooms
     */
    createSharedWallBetween(room1, room2, direction, options = {}) {
        if (!room1 || !room2) return;
        
        const roomWidth = ROOM_DIMENSIONS.width;
        const roomLength = ROOM_DIMENSIONS.length;
        const roomHeight = ROOM_DIMENSIONS.height;
        
        // Calculate wall position and rotation based on direction
        let position = new THREE.Vector3();
        let rotation = 0;
        
        // Position the wall at the boundary between the rooms
        if (direction === 'east') {
            position.set(
                room1.position.x + roomWidth/2,
                room1.position.y, 
                room1.position.z
            );
            rotation = -Math.PI / 2;
        } else if (direction === 'west') {
            position.set(
                room1.position.x - roomWidth/2,
                room1.position.y, 
                room1.position.z
            );
            rotation = Math.PI / 2;
        } else if (direction === 'north') {
            position.set(
                room1.position.x,
                room1.position.y, 
                room1.position.z + roomLength/2
            );
            rotation = Math.PI;
        } else if (direction === 'south') {
            position.set(
                room1.position.x,
                room1.position.y, 
                room1.position.z - roomLength/2
            );
            rotation = 0;
        }
        
        // Get wall dimensions based on direction
        const wallWidth = (direction === 'north' || direction === 'south') ? roomWidth : roomLength;
        
        // Create the shared wall
        const sharedWall = createSharedWall({
            dimensions: { width: wallWidth, height: roomHeight },
            position,
            passage: options.passage,
            style1: room1.wallStyle,
            style2: room2.wallStyle,
            rotation,
            addDoorFrame: options.addDoorFrame,
            renderer: this.renderer
        });
        
        // Add to scene and track
        this.scene.add(sharedWall);
        this.sharedWalls.push(sharedWall);
        return sharedWall;
    }
    
    /**
     * Get a room by its ID
     */
    getRoom(roomId) {
        return this.rooms.get(roomId);
    }
    
    /**
     * Create a grid of connected rooms
     * @param {Object} options - Grid configuration
     * @returns {Object} Map of created rooms by position key
     */
    createRoomGrid(options = {}) {
        const defaults = {
            rows: 2,
            cols: 2,
            roomSpacing: { x: ROOM_DIMENSIONS.width, z: ROOM_DIMENSIONS.length },
            startPosition: { x: 0, y: 0, z: 0 },
            passageConfig: { width: 1.2, height: 2.2 },
            createSharedWalls: false
        };
        
        const config = { ...defaults, ...options };
        const { rows, cols, roomSpacing, startPosition } = config;
        
        // Create rooms with position based on grid
        const roomsById = {};
        const roomsByPosition = {};
        
        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                const position = new THREE.Vector3(
                    startPosition.x + col * roomSpacing.x,
                    startPosition.y,
                    startPosition.z + row * roomSpacing.z
                );
                
                const roomId = `room_${row}_${col}`;
                const room = this.createRoom({
                    id: roomId,
                    position,
                    config: {}
                });
                
                roomsById[roomId] = room;
                roomsByPosition[`${row}_${col}`] = room;
            }
        }
        
        // Connect adjacent rooms
        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                const currentRoomId = `room_${row}_${col}`;
                
                // Connect to east room if it exists
                if (col < cols - 1) {
                    const eastRoomId = `room_${row}_${col+1}`;
                    this.connectRooms(currentRoomId, eastRoomId, 'east', {
                        ...config.passageConfig,
                        createSharedWall: config.createSharedWalls
                    });
                }
                
                // Connect to south room if it exists
                if (row < rows - 1) {
                    const southRoomId = `room_${row+1}_${col}`;
                    this.connectRooms(currentRoomId, southRoomId, 'south', {
                        ...config.passageConfig,
                        createSharedWall: config.createSharedWalls
                    });
                }
            }
        }
        
        return { roomsById, roomsByPosition };
    }
}

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

    // --- Create Room Manager ---
    const roomManager = new RoomManager(scene, renderer);
    
    // Create two adjacent rooms
    const room1 = roomManager.createRoom({
        id: 'room1',
        position: new THREE.Vector3(0, 0, 0),
        config: ROOM_CONFIGS.mainRoom
    });
    
    const room2 = roomManager.createRoom({
        id: 'room2',
        position: new THREE.Vector3(ROOM_DIMENSIONS.width, 0, 0),
        config: ROOM_CONFIGS.sleepingRoom
    });
    
    // Connect the rooms (this handles wall skipping automatically)
    roomManager.connectRooms('room1', 'room2', 'east', {
        hasPassage: true,
        passageWidth: 1.2,
        passageHeight: 2.2,
        createSharedWall: true
    });
    
    // Set initial camera position - positioned to look at the boundary
    camera.position.set(3, 1.7, 3); // Positioned to see both rooms
    camera.lookAt(ROOM_DIMENSIONS.width/2, 1.0, 0);

    // Handle window resize
    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });

    // Add the roomManager to the scene's userData for access elsewhere
    scene.userData.roomManager = roomManager;

    return { scene, camera, renderer, roomManager };
}
