import * as THREE from 'three';
import { addFramesToWall } from '../props/pictureFrames.js';
import { ROOM_DIMENSIONS } from '../../config/RoomConfig.js';

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

// Wall mesh with dado rail/trim
export function createWall(width, height, isFrontOrBack, wallStyle, withFrames = false) {
    const group = new THREE.Group();
    const lowerHeight = height * 0.35;
    const lowerGeo = new THREE.PlaneGeometry(width, lowerHeight);
    const lowerMat = createWallMaterial(true, wallStyle.pattern, wallStyle.base, wallStyle.accent);
    const lower = new THREE.Mesh(lowerGeo, lowerMat);
    lower.position.y = lowerHeight / 2;
    lower.receiveShadow = true;
    group.add(lower);
    const upperHeight = height - lowerHeight;
    const upperGeo = new THREE.PlaneGeometry(width, upperHeight);
    const upperMat = createWallMaterial(false, wallStyle.pattern, wallStyle.base, wallStyle.accent);
    const upper = new THREE.Mesh(upperGeo, upperMat);
    upper.position.y = lowerHeight + upperHeight / 2;
    upper.receiveShadow = true;
    group.add(upper);
    // Dado rail (trim)
    const trimGeo = new THREE.BoxGeometry(width, 0.04, 0.04);
    const trimMat = new THREE.MeshStandardMaterial({ color: '#e2c290', roughness: 0.4 });
    const trim = new THREE.Mesh(trimGeo, trimMat);
    trim.position.y = lowerHeight + 0.02;
    trim.renderOrder = 0;
    group.add(trim);
    // Optionally add frames
    if (withFrames) {
        addFramesToWall(group, width, height);
    }
    return group;
}

export function createRoom(wallStyle, renderer) {
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
    const backWall = createWall(roomWidth, roomHeight, true, wallStyle, true);
    backWall.position.z = -roomLength/2;
    backWall.position.y = 0;
    roomGroup.add(backWall);
    const frontWall = createWall(roomWidth, roomHeight, true, wallStyle, true);
    frontWall.position.z = roomLength/2;
    frontWall.position.y = 0;
    frontWall.rotation.y = Math.PI;
    roomGroup.add(frontWall);
    const leftWall = createWall(roomLength, roomHeight, false, wallStyle, true);
    leftWall.position.x = -roomWidth/2;
    leftWall.position.y = 0;
    leftWall.rotation.y = Math.PI / 2;
    roomGroup.add(leftWall);
    const rightWall = createWall(roomLength, roomHeight, false, wallStyle, true);
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