import { createScene } from './src/scenes/mainScene.js';
import { PlayerController } from './src/player/movement.js';

// Initialize the scene
const { scene, camera, renderer } = createScene();
document.body.appendChild(renderer.domElement);

// Get all collidable objects (walls and furniture)
const collidableObjects = scene.children.filter(child => {
    // Include all meshes except the floor
    if (child.isMesh && child.name !== 'floor') return true;
    // Include all groups (furniture)
    if (child.isGroup) return true;
    return false;
});

// Initialize player controller
const playerController = new PlayerController(camera, renderer.domElement);

// Time tracking for smooth movement
let lastTime = performance.now();

// Animation loop
function animate() {
    requestAnimationFrame(animate);
    
    // Calculate delta time for smooth movement
    const currentTime = performance.now();
    const deltaTime = (currentTime - lastTime) / 1000; // Convert to seconds
    lastTime = currentTime;
    
    // Update player movement with collision detection
    playerController.update(deltaTime, collidableObjects);
    
    // Render the scene
    renderer.render(scene, camera);
}

// Start the animation loop
animate();
