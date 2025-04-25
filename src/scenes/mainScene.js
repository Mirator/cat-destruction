import * as THREE from 'three';
import { createFurniture } from '../objects/furniture.js';
import { Food } from '../objects/food.js';

export function createScene() {
    // Create scene, camera and renderer
    const scene = new THREE.Scene();
    Food.setScene(scene);
    
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // Add ambient light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    // Add directional light
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(2, 2.5, 2);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 1024;
    directionalLight.shadow.mapSize.height = 1024;
    scene.add(directionalLight);

    // Room dimensions (in meters)
    const roomWidth = 6;  // 6 meters wide
    const roomLength = 8; // 8 meters long
    const roomHeight = 3; // 3 meters high

    // Create floor
    const floorGeometry = new THREE.PlaneGeometry(roomWidth, roomLength);
    const floorMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x808080,
        roughness: 0.8,
        metalness: 0.2
    });
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    floor.name = 'floor';
    scene.add(floor);

    // Create walls
    const wallMaterial = new THREE.MeshStandardMaterial({ 
        color: 0xcccccc,
        roughness: 0.7,
        metalness: 0.1
    });

    // Back wall
    const backWall = new THREE.Mesh(
        new THREE.PlaneGeometry(roomWidth, roomHeight),
        wallMaterial.clone()
    );
    backWall.position.z = -roomLength/2;
    backWall.position.y = roomHeight/2;
    backWall.receiveShadow = true;
    scene.add(backWall);

    // Front wall
    const frontWall = new THREE.Mesh(
        new THREE.PlaneGeometry(roomWidth, roomHeight),
        wallMaterial.clone()
    );
    frontWall.position.z = roomLength/2;
    frontWall.position.y = roomHeight/2;
    frontWall.rotation.y = Math.PI;
    frontWall.receiveShadow = true;
    scene.add(frontWall);

    // Left wall
    const leftWall = new THREE.Mesh(
        new THREE.PlaneGeometry(roomLength, roomHeight),
        wallMaterial.clone()
    );
    leftWall.position.x = -roomWidth/2;
    leftWall.position.y = roomHeight/2;
    leftWall.rotation.y = Math.PI / 2;
    leftWall.receiveShadow = true;
    scene.add(leftWall);

    // Right wall
    const rightWall = new THREE.Mesh(
        new THREE.PlaneGeometry(roomLength, roomHeight),
        wallMaterial.clone()
    );
    rightWall.position.x = roomWidth/2;
    rightWall.position.y = roomHeight/2;
    rightWall.rotation.y = -Math.PI / 2;
    rightWall.receiveShadow = true;
    scene.add(rightWall);

    // Add furniture
    const furniture = createFurniture(roomWidth, roomLength);
    furniture.forEach(item => scene.add(item));

    // Set initial camera position
    camera.position.set(0, 1.7, 0); // Eye height
    camera.lookAt(0, 1.7, -1);

    // Handle window resize
    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });

    return { scene, camera, renderer };
}
