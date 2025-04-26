import * as THREE from 'three';

// Array of cute SVG data URIs for frame images, each with a unique cozy pastel background
const CUTE_IMAGES = [
    // Heart - soft pink
    'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64"><rect width="100%" height="100%" fill="%23fff0f6"/><path d="M32 56s-20-12.6-20-28A12 12 0 0132 16a12 12 0 0120 12c0 15.4-20 28-20 28z" fill="%23ff6f91"/></svg>',
    // Cat face - pale yellow
    'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64"><rect width="100%" height="100%" fill="%23fffbe6"/><circle cx="32" cy="36" r="20" fill="%23ffe066"/><ellipse cx="18" cy="20" rx="8" ry="12" fill="%23ffe066"/><ellipse cx="46" cy="20" rx="8" ry="12" fill="%23ffe066"/><ellipse cx="24" cy="38" rx="3" ry="4" fill="%23000"/><ellipse cx="40" cy="38" rx="3" ry="4" fill="%23000"/><ellipse cx="32" cy="46" rx="5" ry="3" fill="%23ff6f91"/></svg>',
    // Flower - soft lavender
    'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64"><rect width="100%" height="100%" fill="%23f3e8ff"/><circle cx="32" cy="32" r="10" fill="%23ffe066"/><g><ellipse cx="32" cy="16" rx="6" ry="12" fill="%23ffb3c6"/><ellipse cx="32" cy="48" rx="6" ry="12" fill="%23ffb3c6"/><ellipse cx="16" cy="32" rx="12" ry="6" fill="%23ffb3c6"/><ellipse cx="48" cy="32" rx="12" ry="6" fill="%23ffb3c6"/></g></svg>',
    // Star - pale blue
    'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64"><rect width="100%" height="100%" fill="%23e6f2ff"/><polygon points="32,8 39,26 58,26 42,38 48,56 32,45 16,56 22,38 6,26 25,26" fill="%23ffe066"/></svg>',
    // Smiley face - warm cream
    'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64"><rect width="100%" height="100%" fill="%23fff8e1"/><circle cx="32" cy="32" r="28" fill="%23fff176"/><ellipse cx="22" cy="28" rx="4" ry="6" fill="%23000"/><ellipse cx="42" cy="28" rx="4" ry="6" fill="%23000"/><path d="M22 44q10 8 20 0" stroke="%23000" stroke-width="3" fill="none"/></svg>',
    // Rainbow - soft mint
    'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64"><rect width="100%" height="100%" fill="%23e6fff7"/><path d="M8 56a24 24 0 0148 0" stroke="%23ff6f91" stroke-width="6" fill="none"/><path d="M14 56a18 18 0 0136 0" stroke="%23ffe066" stroke-width="6" fill="none"/><path d="M20 56a12 12 0 0124 0" stroke="%2366e6ff" stroke-width="6" fill="none"/></svg>',
    // Paw print - soft beige
    'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64"><rect width="100%" height="100%" fill="%23f7e6c4"/><ellipse cx="32" cy="44" rx="10" ry="12" fill="%23b3a580"/><ellipse cx="16" cy="32" rx="4" ry="6" fill="%23b3a580"/><ellipse cx="48" cy="32" rx="4" ry="6" fill="%23b3a580"/><ellipse cx="24" cy="24" rx="3" ry="4" fill="%23b3a580"/><ellipse cx="40" cy="24" rx="3" ry="4" fill="%23b3a580"/></svg>',
    // Sun - soft yellow
    'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64"><rect width="100%" height="100%" fill="%23fffde7"/><circle cx="32" cy="32" r="14" fill="%23ffe066"/><g stroke="%23ffe066" stroke-width="4"><line x1="32" y1="4" x2="32" y2="20"/><line x1="32" y1="44" x2="32" y2="60"/><line x1="4" y1="32" x2="20" y2="32"/><line x1="44" y1="32" x2="60" y2="32"/><line x1="12" y1="12" x2="22" y2="22"/><line x1="42" y1="42" x2="52" y2="52"/><line x1="12" y1="52" x2="22" y2="42"/><line x1="42" y1="22" x2="52" y2="12"/></g></svg>',
    // Cloud - pale blue
    'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64"><rect width="100%" height="100%" fill="%23e6f2ff"/><ellipse cx="32" cy="40" rx="20" ry="12" fill="%23b3e0ff"/><ellipse cx="22" cy="36" rx="8" ry="6" fill="%23e0f7fa"/><ellipse cx="42" cy="36" rx="8" ry="6" fill="%23e0f7fa"/></svg>',
    // Music note - soft peach
    'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64"><rect width="100%" height="100%" fill="%23ffe6e1"/><ellipse cx="24" cy="48" rx="6" ry="8" fill="%23b3a580"/><ellipse cx="44" cy="52" rx="6" ry="8" fill="%23b3a580"/><rect x="28" y="12" width="8" height="32" fill="%23b3a580"/><rect x="36" y="8" width="8" height="36" fill="%23b3a580"/></svg>',
    // Leaf - soft green
    'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64"><rect width="100%" height="100%" fill="%23e6ffe6"/><ellipse cx="32" cy="40" rx="16" ry="24" fill="%239be7a6"/><path d="M32 16 Q36 32 32 56 Q28 32 32 16" stroke="%23096b2b" stroke-width="2" fill="none"/></svg>',
    // Balloon - soft pink
    'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64"><rect width="100%" height="100%" fill="%23fff0f6"/><ellipse cx="32" cy="32" rx="14" ry="20" fill="%23ff6f91"/><rect x="30" y="52" width="4" height="8" fill="%236a4a1a"/><path d="M32 52 Q28 56 32 60 Q36 56 32 52" stroke="%236a4a1a" stroke-width="2" fill="none"/></svg>',
    // Duck - soft yellow
    'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64"><rect width="100%" height="100%" fill="%23fffbe6"/><ellipse cx="32" cy="40" rx="18" ry="12" fill="%23ffe066"/><ellipse cx="44" cy="36" rx="8" ry="6" fill="%23ffe066"/><ellipse cx="48" cy="38" rx="3" ry="2" fill="%23ff6f00"/><ellipse cx="28" cy="44" rx="2" ry="1" fill="%23000"/></svg>',
    // Bunny - soft lavender
    'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64"><rect width="100%" height="100%" fill="%23f3e8ff"/><ellipse cx="32" cy="44" rx="12" ry="14" fill="%23fff"/><ellipse cx="24" cy="24" rx="4" ry="12" fill="%23fff"/><ellipse cx="40" cy="24" rx="4" ry="12" fill="%23fff"/><ellipse cx="28" cy="44" rx="2" ry="3" fill="%23000"/><ellipse cx="36" cy="44" rx="2" ry="3" fill="%23000"/><ellipse cx="32" cy="52" rx="3" ry="2" fill="%23ffb3c6"/></svg>',
    // Cupcake - soft cream
    'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64"><rect width="100%" height="100%" fill="%23fff8e1"/><ellipse cx="32" cy="40" rx="14" ry="10" fill="%23ffe066"/><rect x="18" y="40" width="28" height="12" fill="%23ffb3c6"/><ellipse cx="32" cy="40" rx="14" ry="6" fill="%23fff"/></svg>',
    // Fish - soft mint
    'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64"><rect width="100%" height="100%" fill="%23e6fff7"/><ellipse cx="40" cy="32" rx="16" ry="8" fill="%2366e6ff"/><polygon points="16,32 8,24 8,40" fill="%2366e6ff"/><ellipse cx="48" cy="32" rx="2" ry="2" fill="%23000"/></svg>',
    // Bear - soft beige
    'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64"><rect width="100%" height="100%" fill="%23f7e6c4"/><ellipse cx="32" cy="40" rx="14" ry="14" fill="%23b3a580"/><ellipse cx="20" cy="28" rx="5" ry="5" fill="%23b3a580"/><ellipse cx="44" cy="28" rx="5" ry="5" fill="%23b3a580"/><ellipse cx="28" cy="44" rx="2" ry="3" fill="%23000"/><ellipse cx="36" cy="44" rx="2" ry="3" fill="%23000"/><ellipse cx="32" cy="50" rx="3" ry="2" fill="%23ffb3c6"/></svg>',
];

// Create a picture frame mesh
export function createPictureFrame(width, height, color, image = null) {
    const frameGroup = new THREE.Group();
    // Frame
    const frameGeo = new THREE.BoxGeometry(width + 0.04, height + 0.04, 0.04);
    const frameMat = new THREE.MeshStandardMaterial({ color: color, roughness: 0.5 });
    const frameMesh = new THREE.Mesh(frameGeo, frameMat);
    frameGroup.add(frameMesh);
    // Picture (simple colored plane or image)
    const picGeo = new THREE.PlaneGeometry(width, height);
    let picMat;
    if (image) {
        const tex = new THREE.TextureLoader().load(image);
        picMat = new THREE.MeshStandardMaterial({ map: tex });
    } else {
        picMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.7 });
    }
    const picMesh = new THREE.Mesh(picGeo, picMat);
    picMesh.position.z = 0.022;
    frameGroup.add(picMesh);
    return frameGroup;
}

// Place 1-2 frames per wall, random positions (middle third of wall)
export function addFramesToWall(wall, width, height) {
    const numFrames = 1 + Math.floor(Math.random() * 2);
    for (let i = 0; i < numFrames; i++) {
        const frameW = 0.32 + Math.random() * 0.18;
        const frameH = 0.22 + Math.random() * 0.18;
        const frameColor = [0x8a6a3a, 0xc9a066, 0xb88b4a, 0x6a4a1a][Math.floor(Math.random() * 4)];
        // Pick a random cute image
        const image = CUTE_IMAGES[Math.floor(Math.random() * CUTE_IMAGES.length)];
        const frame = createPictureFrame(frameW, frameH, frameColor, image);
        // Random position: middle third of wall
        const x = (Math.random() - 0.5) * (width - frameW - 0.3);
        const y = height * (0.33 + Math.random() * 0.34); // between 1/3 and 2/3 of wall height
        frame.position.set(x, y, 0.045);
        wall.add(frame);
    }
} 