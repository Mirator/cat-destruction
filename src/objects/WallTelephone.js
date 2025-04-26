import * as THREE from 'three';
import { Highlightable } from './Highlightable.js';

export class WallTelephone extends Highlightable {
    constructor(position) {
        // Move the phone farther from the wall
        const group = new THREE.Group();
        group.name = 'wall_telephone';
        group.position.copy(position);
        group.position.z += 0.04; // Move farther from wall
        group.rotation.y = -Math.PI / 2; // Rotate 90 degrees to sit flush on wall

        // --- Simple Colors ---
        const baseColor = 0xc0392b; // Red
        const handsetColor = 0x222222; // Black
        const buttonColor = 0xffffff; // White

        // --- Base (simple box) ---
        const baseGeometry = new THREE.BoxGeometry(0.16, 0.26, 0.06);
        const baseMaterial = new THREE.MeshStandardMaterial({ color: baseColor, roughness: 0.3 });
        const base = new THREE.Mesh(baseGeometry, baseMaterial);
        base.position.set(0, 0, 0);
        group.add(base);

        // --- Handset (straight cylinder with round ends, resting on top) ---
        const handsetLength = 0.16;
        const handsetRadius = 0.022;
        const handsetGeometry = new THREE.CylinderGeometry(handsetRadius, handsetRadius, handsetLength, 10);
        const handsetMaterial = new THREE.MeshStandardMaterial({ color: handsetColor, roughness: 0.2 });
        const handset = new THREE.Mesh(handsetGeometry, handsetMaterial);
        handset.rotation.z = Math.PI / 2;
        handset.position.set(0, 0.13, 0.04);
        group.add(handset);
        // Handset ends
        const endGeometry = new THREE.SphereGeometry(handsetRadius * 1.1, 8, 8);
        const end1 = new THREE.Mesh(endGeometry, handsetMaterial);
        end1.position.set(-handsetLength/2, 0.13, 0.04);
        const end2 = new THREE.Mesh(endGeometry, handsetMaterial);
        end2.position.set(handsetLength/2, 0.13, 0.04);
        group.add(end1);
        group.add(end2);

        // --- Buttons (3x4 grid, higher and closer to front edge) ---
        const buttonMeshes = [];
        const buttonRows = 4;
        const buttonCols = 3;
        const buttonSpacingX = 0.06;
        const buttonSpacingY = 0.03;
        const buttonRadius = 0.012;
        const buttonGeometry = new THREE.CylinderGeometry(buttonRadius, buttonRadius, 0.008, 8);
        for (let row = 0; row < buttonRows; row++) {
            for (let col = 0; col < buttonCols; col++) {
                const buttonMat = new THREE.MeshStandardMaterial({ color: buttonColor, roughness: 0.15 });
                const button = new THREE.Mesh(buttonGeometry, buttonMat);
                button.rotation.x = Math.PI / 2;
                button.position.set(
                    (col - 1) * buttonSpacingX,
                    0.01 - row * buttonSpacingY, // higher on the base
                    0.035 // closer to the base
                );
                group.add(button);
                buttonMeshes.push(button);
            }
        }

        // Call super AFTER building the group and meshes
        super(group);

        // Now assign to this
        this.highlightParts = [base, handset, end1, end2, ...buttonMeshes];
        this.baseMaterial = baseMaterial;
        this.handsetMaterial = handsetMaterial;
        this.buttonMeshes = buttonMeshes;
    }

    setHighlight(enabled) {
        if (this.isHighlighted === enabled) return;
        this.isHighlighted = enabled;
        const highlightColor = new THREE.Color(0x33aaff);
        const highlightIntensity = 0.7;
        for (const mesh of this.highlightParts) {
            if (mesh.material) {
                if (enabled) {
                    mesh.material.emissive = highlightColor;
                    mesh.material.emissiveIntensity = highlightIntensity;
                } else {
                    mesh.material.emissive = new THREE.Color(0x000000);
                    mesh.material.emissiveIntensity = 0.0;
                }
            }
        }
    }

    updateHighlight(deltaTime) {
        // Optionally add pulsing or animation here
    }
} 