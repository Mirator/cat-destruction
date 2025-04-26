import * as THREE from 'three';
import { Highlightable } from './Highlightable.js';

export class Parcel extends Highlightable {
    constructor(position) {
        // Create box geometry and material
        const boxGeo = new THREE.BoxGeometry(0.72, 0.3, 0.4);
        boxGeo.rotateY(Math.PI / 2); // Rotate geometry before creating the mesh
        // Make the canvas match the box's front face aspect ratio
        const texWidth = 256, texHeight = 128; // 2:1 ratio for 0.72:0.3 box
        const canvas = document.createElement('canvas');
        canvas.width = texWidth; canvas.height = texHeight;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#a67c52'; ctx.fillRect(0,0,texWidth,texHeight);
        ctx.strokeStyle = '#bfa16a'; ctx.lineWidth = 10;
        ctx.strokeRect(8,8,texWidth-16,texHeight-16);
        ctx.font = 'bold 60px sans-serif';
        ctx.fillStyle = '#8a6a3a';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('PARCEL', texWidth/2, texHeight/2);
        const parcelTexture = new THREE.CanvasTexture(canvas);
        parcelTexture.anisotropy = 4;
        parcelTexture.wrapS = parcelTexture.wrapT = THREE.ClampToEdgeWrapping;
        const boxMat = new THREE.MeshStandardMaterial({ map: parcelTexture, roughness: 0.7 });
        const box = new THREE.Mesh(boxGeo, boxMat);
        box.position.copy(position);
        box.position.y = 0.15; // on floor
        box.name = 'restock_parcel';
        box.castShadow = true;
        box.receiveShadow = true;
        // Call Highlightable constructor
        super(box);
        // Store reference for logic
        this.model.userData.parcelInstance = this;
    }

    setHighlight(enabled) {
        if (this.isHighlighted === enabled) return;
        this.isHighlighted = enabled;
        this.model.traverse(obj => {
            if (obj.isMesh && obj.material) {
                if (enabled) {
                    obj.material.emissive = obj.material.emissive || new THREE.Color();
                    obj.material.emissive.set(0x99ccee); // softer blue
                    obj.material.emissiveIntensity = 0.4;
                } else {
                    if (obj.material.emissive) {
                        obj.material.emissive.set(0);
                        obj.material.emissiveIntensity = 0;
                    }
                }
            }
        });
    }
} 