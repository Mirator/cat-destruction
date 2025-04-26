import * as THREE from 'three';
import { createFurniture } from '../objects/furniture.js';
import { Food } from '../objects/food.js';
import { FlowerProp } from '../objects/prop.js';
import { FLOWER_CONFIG } from '../config/GameConfig.js';

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

    // Add furniture
    const furniture = createFurniture(roomWidth, roomLength);
    furniture.forEach(item => scene.add(item));

    // Add flower props
    FLOWER_CONFIG.variants.forEach(variant => {
        const flower = new FlowerProp(
            new THREE.Vector3(variant.position.x, variant.position.y, variant.position.z),
            { flowerColor: variant.flowerColor }
        );
        scene.add(flower.model);
    });

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
