import * as THREE from 'three';
import { addFramesToWall } from '../props/pictureFrames.js';
import { ROOM_DIMENSIONS, SHARED_WALL_THICKNESS } from '../../config/RoomConfig.js';

// Parquet floor texture
export function createParquetTexture(renderer) {
    const size = 512;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#e2c290';
    ctx.fillRect(0, 0, size, size);
    const colors = ['#e2c290', '#d1a974', '#c9a066', '#b88b4a'];
    const tile = 64;
    for (let y = 0; y < size; y += tile) {
        for (let x = 0; x < size; x += tile) {
            const offset = (Math.floor(y / tile) % 2) * (tile / 2);
            ctx.save();
            ctx.translate(x + offset, y);
            ctx.rotate((Math.floor((x + y) / tile) % 2) * Math.PI / 2);
            ctx.fillStyle = colors[Math.floor(Math.random() * colors.length)];
            ctx.fillRect(-2, -2, tile + 4, tile + 4);
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
    for (let i = 0; i < 1200; i++) {
        ctx.fillStyle = 'rgba(200, 170, 110, 0.06)';
        ctx.beginPath();
        ctx.arc(Math.random() * size, Math.random() * size, Math.random() * 2, 0, 2 * Math.PI);
        ctx.fill();
    }
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(4, 4);
    texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
    return texture;
}

// Dynamic wall pattern generator
export function createDynamicWallTexture(pattern, baseColor, accentColor) {
    const size = 256;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = baseColor;
    ctx.fillRect(0, 0, size, size);
    if (pattern === 'stripes') {
        ctx.globalAlpha = 0.18;
        ctx.fillStyle = accentColor;
        for (let i = 0; i < size; i += 32) {
            ctx.fillRect(i, 0, 16, size);
        }
        ctx.globalAlpha = 1.0;
    } else if (pattern === 'polka') {
        ctx.globalAlpha = 0.18;
        ctx.fillStyle = accentColor;
        for (let y = 16; y < size; y += 40) {
            for (let x = 16 + (y % 80 === 0 ? 0 : 20); x < size; x += 40) {
                ctx.beginPath();
                ctx.arc(x, y, 7, 0, 2 * Math.PI);
                ctx.fill();
            }
        }
        ctx.globalAlpha = 1.0;
    } else if (pattern === 'floral') {
        ctx.globalAlpha = 0.13;
        ctx.strokeStyle = accentColor;
        for (let i = 0; i < 12; i++) {
            const cx = Math.random() * size;
            const cy = Math.random() * size;
            ctx.beginPath();
            for (let j = 0; j < 6; j++) {
                const angle = (j / 6) * Math.PI * 2;
                ctx.moveTo(cx, cy);
                ctx.lineTo(cx + Math.cos(angle) * 12, cy + Math.sin(angle) * 12);
            }
            ctx.stroke();
        }
        ctx.globalAlpha = 1.0;
    }
    for (let i = 0; i < 400; i++) {
        ctx.fillStyle = 'rgba(200, 170, 110, 0.04)';
        ctx.beginPath();
        ctx.arc(Math.random() * size, Math.random() * size, Math.random() * 2, 0, 2 * Math.PI);
        ctx.fill();
    }
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(2, 2);
    return texture;
}

// Ceiling texture
export function createCeilingTexture(renderer) {
    const size = 256;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#f7f3e8';
    ctx.fillRect(0, 0, size, size);
    for (let i = 0; i < 800; i++) {
        ctx.fillStyle = 'rgba(220, 210, 180, 0.07)';
        ctx.beginPath();
        ctx.arc(Math.random() * size, Math.random() * size, Math.random() * 2, 0, 2 * Math.PI);
        ctx.fill();
    }
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(2, 2);
    texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
    return texture;
}

// Wall material helper
export function createWallMaterial(isLower, pattern, base, accent) {
    const color = isLower ? accent : base;
    const texture = pattern === 'plain' ? null : createDynamicWallTexture(pattern, base, accent);
    return new THREE.MeshStandardMaterial({
        map: texture,
        color: color,
        roughness: 0.6,
        metalness: 0.08
    });
}

/**
 * Creates a wall mesh, optionally with a passage (gap) in the middle.
 * @param {number} width - Wall width
 * @param {number} height - Wall height
 * @param {boolean} isFrontOrBack - Orientation
 * @param {object} wallStyle - Wall style
 * @param {boolean} [withFrames=false] - Add frames
 * @param {object} [passage] - Optional passage { width, height, x } (centered at x, in wall local space)
 * @param {boolean} [addTrim=true] - Whether to add dado rail (trim)
 */
export function createWall(width, height, isFrontOrBack, wallStyle, withFrames = false, passage = null, addTrim = true) {
    const group = new THREE.Group();
    const lowerHeight = height * 0.35;
    const upperHeight = height - lowerHeight;
    
    // If no passage, create full wall as before
    if (!passage) {
        const lowerGeo = new THREE.PlaneGeometry(width, lowerHeight);
        const lowerMat = createWallMaterial(true, wallStyle.pattern, wallStyle.base, wallStyle.accent);
        const lower = new THREE.Mesh(lowerGeo, lowerMat);
        lower.position.y = lowerHeight / 2;
        lower.receiveShadow = true;
        group.add(lower);
        const upperGeo = new THREE.PlaneGeometry(width, upperHeight);
        const upperMat = createWallMaterial(false, wallStyle.pattern, wallStyle.base, wallStyle.accent);
        const upper = new THREE.Mesh(upperGeo, upperMat);
        upper.position.y = lowerHeight + upperHeight / 2;
        upper.receiveShadow = true;
        group.add(upper);
        // Dado rail (trim)
        if (addTrim) {
            const trimGeo = new THREE.BoxGeometry(width, 0.04, 0.04);
            const trimMat = new THREE.MeshStandardMaterial({ color: '#e2c290', roughness: 0.4 });
            const trim = new THREE.Mesh(trimGeo, trimMat);
            trim.position.y = lowerHeight + 0.02;
            trim.renderOrder = 0;
            group.add(trim);
        }
        if (withFrames) {
            addFramesToWall(group, width, height);
        }
        return group;
    }
    // Passage logic
    const { width: pWidth, height: pHeight, x: pX = 0 } = passage;
    
    // Calculate left and right segment widths
    const leftW = width / 2 + pX - pWidth / 2;
    const rightW = width / 2 - pX - pWidth / 2;
    const topH = height - pHeight; // Height of the wall above the passage
    const passageY = pHeight / 2; // Center of the passage opening

    // Lower part (below passage)
    if (pHeight < lowerHeight) {
        // Passage is above dado rail, so just split horizontally
        // Left segment
        if (leftW > 0.01) {
            const geo = new THREE.PlaneGeometry(leftW, lowerHeight);
            const mat = createWallMaterial(true, wallStyle.pattern, wallStyle.base, wallStyle.accent);
            const mesh = new THREE.Mesh(geo, mat);
            mesh.position.x = -width/2 + leftW/2;
            mesh.position.y = lowerHeight/2;
            mesh.receiveShadow = true;
            group.add(mesh);
        }
        // Right segment
        if (rightW > 0.01) {
            const geo = new THREE.PlaneGeometry(rightW, lowerHeight);
            const mat = createWallMaterial(true, wallStyle.pattern, wallStyle.base, wallStyle.accent);
            const mesh = new THREE.Mesh(geo, mat);
            mesh.position.x = width/2 - rightW/2;
            mesh.position.y = lowerHeight/2;
            mesh.receiveShadow = true;
            group.add(mesh);
        }
        // Add wall above passage (lintel)
        if (topH > 0.01) {
            const geo = new THREE.PlaneGeometry(pWidth, topH);
            const mat = createWallMaterial(false, wallStyle.pattern, wallStyle.base, wallStyle.accent);
            const mesh = new THREE.Mesh(geo, mat);
            mesh.position.x = pX;
            mesh.position.y = lowerHeight + pHeight + topH/2;
            mesh.receiveShadow = true;
            group.add(mesh);
        }
    } else {
        // Passage cuts into dado rail, so split vertically
        // Left segment (full height)
        if (leftW > 0.01) {
            const geo = new THREE.PlaneGeometry(leftW, height);
            const mat = createWallMaterial(false, wallStyle.pattern, wallStyle.base, wallStyle.accent);
            const mesh = new THREE.Mesh(geo, mat);
            mesh.position.x = -width/2 + leftW/2;
            mesh.position.y = height/2;
            mesh.receiveShadow = true;
            group.add(mesh);
        }
        // Right segment (full height)
        if (rightW > 0.01) {
            const geo = new THREE.PlaneGeometry(rightW, height);
            const mat = createWallMaterial(false, wallStyle.pattern, wallStyle.base, wallStyle.accent);
            const mesh = new THREE.Mesh(geo, mat);
            mesh.position.x = width/2 - rightW/2;
            mesh.position.y = height/2;
            mesh.receiveShadow = true;
            group.add(mesh);
        }
        // Add wall above passage (lintel)
        if (topH > 0.01) {
            const geo = new THREE.PlaneGeometry(pWidth, topH);
            const mat = createWallMaterial(false, wallStyle.pattern, wallStyle.base, wallStyle.accent);
            const mesh = new THREE.Mesh(geo, mat);
            mesh.position.x = pX;
            mesh.position.y = pHeight + topH/2;
            mesh.receiveShadow = true;
            group.add(mesh);
        }
    }
    // Dado rail (trim) - left
    if (addTrim) {
        const leftTrimW = pX - pWidth/2;
        if (leftTrimW > 0.01) {
            const trimGeo = new THREE.BoxGeometry(leftTrimW, 0.04, 0.04);
            const trimMat = new THREE.MeshStandardMaterial({ color: '#e2c290', roughness: 0.4 });
            const trim = new THREE.Mesh(trimGeo, trimMat);
            trim.position.x = -width/2 + leftTrimW/2;
            trim.position.y = lowerHeight + 0.02;
            trim.renderOrder = 0;
            group.add(trim);
        }
        // Dado rail (trim) - right
        const rightTrimW = width - (pX + pWidth/2) - (width/2 - (pX + pWidth/2));
        if (rightTrimW > 0.01) {
            const trimGeo = new THREE.BoxGeometry(rightTrimW, 0.04, 0.04);
            const trimMat = new THREE.MeshStandardMaterial({ color: '#e2c290', roughness: 0.4 });
            const trim = new THREE.Mesh(trimGeo, trimMat);
            trim.position.x = pX + pWidth/2 + rightTrimW/2 - width/2;
            trim.position.y = lowerHeight + 0.02;
            trim.renderOrder = 0;
            group.add(trim);
        }
        // Optionally add frames (to left/right segments only)
        if (withFrames) {
            if (leftTrimW > 0.01) addFramesToWall(group, leftTrimW, height);
            if (rightTrimW > 0.01) addFramesToWall(group, rightTrimW, height);
        }
    }
    return group;
}

/**
 * Creates a room group, optionally with passages in any wall.
 * @param {object} wallStyle - Wall style
 * @param {THREE.WebGLRenderer} renderer
 * @param {object} [passages] - Optional passages for walls: { front, back, left, right }
 *   Each value is either null or a passage object { width, height, x }
 */
export function createRoom(wallStyle, renderer, passages = {}) {
    const roomWidth = ROOM_DIMENSIONS.width;
    const roomLength = ROOM_DIMENSIONS.length;
    const roomHeight = ROOM_DIMENSIONS.height;
    const roomGroup = new THREE.Group();
    // Floor
    const floorTexture = createParquetTexture(renderer);
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
    // Rug (optional, but included for completeness)
    const rugGeometry = new THREE.CircleGeometry(1.2, 32);
    const rugMaterial = new THREE.MeshStandardMaterial({ color: 0xf7cac9, roughness: 0.8 });
    const rug = new THREE.Mesh(rugGeometry, rugMaterial);
    rug.position.set(0, 0.01, 0);
    rug.rotation.x = -Math.PI / 2;
    rug.receiveShadow = true;
    rug.name = 'rug';
    roomGroup.add(rug);
    // Walls (with frames)
    const backWall = createWall(roomWidth, roomHeight, true, wallStyle, true, passages.back || null);
    backWall.position.z = -roomLength/2;
    backWall.position.y = 0;
    roomGroup.add(backWall);
    const frontWall = createWall(roomWidth, roomHeight, true, wallStyle, true, passages.front || null);
    frontWall.position.z = roomLength/2;
    frontWall.position.y = 0;
    frontWall.rotation.y = Math.PI;
    roomGroup.add(frontWall);
    const leftWall = createWall(roomLength, roomHeight, false, wallStyle, true, passages.left || null);
    leftWall.position.x = -roomWidth/2;
    leftWall.position.y = 0;
    leftWall.rotation.y = Math.PI / 2;
    roomGroup.add(leftWall);
    const rightWall = createWall(roomLength, roomHeight, false, wallStyle, true, passages.right || null);
    rightWall.position.x = roomWidth/2;
    rightWall.position.y = 0;
    rightWall.rotation.y = -Math.PI / 2;
    roomGroup.add(rightWall);
    // Ceiling
    const ceilingTexture = createCeilingTexture(renderer);
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
    return roomGroup;
}

export function getWallInteriorOffset(thickness) {
    return thickness / 2;
}

export function createSharedWall({ dimensions, position, passage, style1, style2, rotation = 0, addDoorFrame = false, renderer = null }) {
    const width = dimensions.width;
    const height = dimensions.height;
    const depth = SHARED_WALL_THICKNESS;
    const mat1 = createWallMaterial(false, style1.pattern, style1.base, style1.accent);
    const mat2 = createWallMaterial(false, style2.pattern, style2.base, style2.accent);
    // Neutral material for sides/top/bottom (use base wall color)
    const neutralMat = new THREE.MeshStandardMaterial({ color: style1.base, roughness: 0.6, metalness: 0.08 });
    const group = new THREE.Group();
    const lowerHeight = height * 0.35;
    const upperHeight = height - lowerHeight;
    const gap = 0.002;
    function makeWallSegment(segWidth, segHeight, segY, matFront, matBack) {
        const geo = new THREE.BoxGeometry(segWidth, segHeight, depth);
        // Use matFront for right/left faces so the thickness matches the room's wall style
        const mats = [
            matFront, // right
            matFront, // left
            neutralMat, // top
            neutralMat, // bottom
            matFront,   // front
            matBack     // back
        ];
        const mesh = new THREE.Mesh(geo, mats);
        mesh.position.y = segY;
        return mesh;
    }
    function addTrimBox(group, segWidth, segX, segY) {
        const trimGeo = new THREE.BoxGeometry(segWidth, 0.04,0.001);
        const trimMat = new THREE.MeshStandardMaterial({ color: '#e2c290', roughness: 0.4 });
        // Front face trim
        const trimFront = new THREE.Mesh(trimGeo, trimMat);
        trimFront.position.set(segX, segY, depth/2 + 0.005);
        group.add(trimFront);
        // Back face trim
        const trimBack = new THREE.Mesh(trimGeo, trimMat);
        trimBack.position.set(segX, segY, -depth/2 - 0.005);
        group.add(trimBack);
    }
    if (!passage) {
        // Solid wall: build from lower and upper segments
        // Lower (dado)
        const lowerFront = createWallMaterial(true, style1.pattern, style1.base, style1.accent);
        const lowerBack = createWallMaterial(true, style2.pattern, style2.base, style2.accent);
        const lowerMesh = makeWallSegment(width, lowerHeight, lowerHeight/2, lowerFront, lowerBack);
        group.add(lowerMesh);
        // Upper (with gap)
        const upperFront = createWallMaterial(false, style1.pattern, style1.base, style1.accent);
        const upperBack = createWallMaterial(false, style2.pattern, style2.base, style2.accent);
        const upperMesh = makeWallSegment(width, upperHeight, lowerHeight + upperHeight/2 + gap, upperFront, upperBack);
        group.add(upperMesh);
        // Add trim
        addTrimBox(group, width, 0, lowerHeight + 0.02);
    } else {
        // Wall with passage (doorway)
        const pWidth = passage.width;
        const pHeight = passage.height;
        const pX = passage.x || 0;
        // Left segment
        const leftW = width / 2 + pX - pWidth / 2;
        if (leftW > 0.01) {
            // Lower
            const lowerFront = createWallMaterial(true, style1.pattern, style1.base, style1.accent);
            const lowerBack = createWallMaterial(true, style2.pattern, style2.base, style2.accent);
            const lowerMesh = makeWallSegment(leftW, lowerHeight, lowerHeight/2, lowerFront, lowerBack);
            lowerMesh.position.x = -width/2 + leftW/2;
            group.add(lowerMesh);
            // Upper (with gap)
            const upperFront = createWallMaterial(false, style1.pattern, style1.base, style1.accent);
            const upperBack = createWallMaterial(false, style2.pattern, style2.base, style2.accent);
            const upperMesh = makeWallSegment(leftW, upperHeight, lowerHeight + upperHeight/2 + gap, upperFront, upperBack);
            upperMesh.position.x = -width/2 + leftW/2;
            group.add(upperMesh);
            // Add trim for left segment
            addTrimBox(group, leftW, -width/2 + leftW/2, lowerHeight + 0.02);
        }
        // Right segment
        const rightW = width / 2 - pX - pWidth / 2;
        if (rightW > 0.01) {
            // Lower
            const lowerFront = createWallMaterial(true, style1.pattern, style1.base, style1.accent);
            const lowerBack = createWallMaterial(true, style2.pattern, style2.base, style2.accent);
            const lowerMesh = makeWallSegment(rightW, lowerHeight, lowerHeight/2, lowerFront, lowerBack);
            lowerMesh.position.x = width/2 - rightW/2;
            group.add(lowerMesh);
            // Upper (with gap)
            const upperFront = createWallMaterial(false, style1.pattern, style1.base, style1.accent);
            const upperBack = createWallMaterial(false, style2.pattern, style2.base, style2.accent);
            const upperMesh = makeWallSegment(rightW, upperHeight, lowerHeight + upperHeight/2 + gap, upperFront, upperBack);
            upperMesh.position.x = width/2 - rightW/2;
            group.add(upperMesh);
            // Add trim for right segment
            addTrimBox(group, rightW, width/2 - rightW/2, lowerHeight + 0.02);
        }
        // Top segment (lintel)
        const topH = height - pHeight;
        if (topH > 0.01) {
            // Lower (none, as passage is here)
            // Upper
            const upperFront = createWallMaterial(false, style1.pattern, style1.base, style1.accent);
            const upperBack = createWallMaterial(false, style2.pattern, style2.base, style2.accent);
            const upperMesh = makeWallSegment(pWidth, topH, pHeight + topH/2 + gap, upperFront, upperBack);
            upperMesh.position.x = pX;
            group.add(upperMesh);
            // No trim for top segment
        }
        // Floor patch for the passage
        if (renderer) {
            const floorPatchGeo = new THREE.BoxGeometry(pWidth, 0.04, depth + 0.01);
            const floorPatchMat = new THREE.MeshStandardMaterial({
                map: createParquetTexture(renderer),
                roughness: 0.7,
                metalness: 0.15
            });
            const floorPatch = new THREE.Mesh(floorPatchGeo, floorPatchMat);
            floorPatch.position.set(pX, 0.02, 0); // Slightly above y=0
            group.add(floorPatch);
        }
    }
    group.position.copy(position);
    group.rotation.y = rotation;
    group.name = 'sharedWall';
    return group;
} 