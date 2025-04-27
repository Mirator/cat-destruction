import * as THREE from 'three';
import { createScene } from './src/scenes/mainScene.js';
import { PlayerController } from './src/player/movement.js';
import { Cat } from './src/objects/cat/cat.js';
import { InteractionManager } from './src/player/interaction-manager.js';
import { PlayerState } from './src/state/PlayerState.js';
import { PlayerStatusBar } from './src/ui/playerStatusBar.js';
import { GameOverScreen } from './src/ui/GameOverScreen.js';
import { StartScreen } from './src/ui/StartScreen.js';
import { DialingUI } from './src/ui/dialing-ui.js';
import { ROOM_DIMENSIONS } from './src/config/RoomConfig.js';
import { ScoreManager } from './src/state/ScoreManager.js';
import audioManager from './src/audio/AudioManager.js';

// Make audioManager globally accessible
window.audioManager = audioManager;

// Initialize the scene
const { scene, camera, renderer } = createScene();
document.body.appendChild(renderer.domElement);
scene.userData.playerCamera = camera;

// Set renderer DOM element for pointer lock management in DialingUI
DialingUI.setRendererDomElement(renderer.domElement);

// Initialize player state and UI
const playerState = new PlayerState(100);
const playerStatusBar = new PlayerStatusBar(playerState);

const scoreManager = new ScoreManager();

let gameOver = false;
let gameStarted = false;

function restartGame() {
    window.location.reload();
}

const gameOverScreen = new GameOverScreen(restartGame);

playerState.onChange((health) => {
    if (health <= 0 && !gameOver) {
        gameOver = true;
        scoreManager.stop();
        scoreManager.saveIfBest();
        gameOverScreen.setTimes(scoreManager.getFormattedElapsed(), scoreManager.getFormattedBest());
        gameOverScreen.show();
    }
});

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

// Initialize interaction manager
const interactionManager = new InteractionManager(scene, playerController);
scene.userData.interactionManager = interactionManager;

// --- Cat spawn position to match bed/camera setup ---
const bedDepth = 2.1;
const bedZ = -ROOM_DIMENSIONS.length/2 + bedDepth/2 + 0.1;
const catStartX = ROOM_DIMENSIONS.width - 0.3;
const catStartZ = bedZ;
// Initialize cat
const cat = new Cat(scene, new THREE.Vector3(catStartX, 0, catStartZ), playerState); // Pass playerState

// Time tracking for smooth movement
let lastTime = performance.now();

const startScreen = new StartScreen(() => {
    gameStarted = true;
    lastTime = performance.now();
    scoreManager.start();
    // Show helper tooltip for 5 seconds using forced tip
    interactionManager.showForcedHelpTip('Find food in the shelf', 5000);
    animate();
});

startScreen.show();

// Load meow sound asset
await audioManager.loadSound('cat_meow', 'assets/sounds/Mnau.wav');
// Load door sound asset
await audioManager.loadSound('door', 'assets/sounds/doors.wav');

// Animation loop
function animate() {
    if (!gameStarted || gameOver) return;
    requestAnimationFrame(animate);
    
    // Calculate delta time for smooth movement
    const currentTime = performance.now();
    const deltaTime = (currentTime - lastTime) / 1000; // Convert to seconds
    lastTime = currentTime;
    
    // Update player movement with collision detection
    playerController.update(deltaTime, collidableObjects);
    
    // Update interaction manager
    interactionManager.update(deltaTime);
    
    // Update cat behavior
    cat.update(deltaTime);

    // Player mood recovery if cat is not close
    const catXZ = cat.position.clone(); catXZ.y = 0;
    const playerXZ = camera.position.clone(); playerXZ.y = 0;
    const dist = catXZ.distanceTo(playerXZ);
    if (dist > 0.5) {
        playerState.changeHealth(1 * deltaTime);
    }

    // Update timer UI (to be implemented in playerStatusBar)
    if (playerStatusBar.updateSurvivalTime) {
        playerStatusBar.updateSurvivalTime(scoreManager.getFormattedElapsed(), scoreManager.getFormattedBest());
    }

    // Render the scene
    renderer.render(scene, camera);
}

// Start the animation loop
animate();
