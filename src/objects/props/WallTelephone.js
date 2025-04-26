import * as THREE from 'three';
import { Highlightable } from './Highlightable.js';

export class WallTelephone extends Highlightable {
    constructor(position) {
        const group = new THREE.Group();
        group.name = 'wall_telephone';
        group.position.copy(position);
        group.position.z += 0.04;
        group.rotation.y = -Math.PI / 2;

        const base = new THREE.Mesh(
            new THREE.BoxGeometry(0.16, 0.26, 0.06),
            new THREE.MeshStandardMaterial({ color: 0xc0392b, roughness: 0.3 })
        );
        group.add(base);

        const handsetLength = 0.16;
        const handsetRadius = 0.022;
        const handset = new THREE.Mesh(
            new THREE.CylinderGeometry(handsetRadius, handsetRadius, handsetLength, 10),
            new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.2 })
        );
        handset.rotation.z = Math.PI / 2;
        handset.position.set(0, 0.13, 0.04);
        group.add(handset);
        const endGeometry = new THREE.SphereGeometry(handsetRadius * 1.1, 8, 8);
        const end1 = new THREE.Mesh(endGeometry, handset.material);
        end1.position.set(-handsetLength/2, 0.13, 0.04);
        const end2 = new THREE.Mesh(endGeometry, handset.material);
        end2.position.set(handsetLength/2, 0.13, 0.04);
        group.add(end1);
        group.add(end2);

        const buttonMeshes = [];
        const buttonRows = 4;
        const buttonCols = 3;
        const buttonSpacingX = 0.06;
        const buttonSpacingY = 0.03;
        const buttonRadius = 0.012;
        const buttonGeometry = new THREE.CylinderGeometry(buttonRadius, buttonRadius, 0.008, 8);
        for (let row = 0; row < buttonRows; row++) {
            for (let col = 0; col < buttonCols; col++) {
                const button = new THREE.Mesh(
                    buttonGeometry,
                    new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.15 })
                );
                button.rotation.x = Math.PI / 2;
                button.position.set(
                    (col - 1) * buttonSpacingX,
                    0.01 - row * buttonSpacingY,
                    0.035
                );
                group.add(button);
                buttonMeshes.push(button);
            }
        }

        super(group);
        this.highlightParts = [base, handset, end1, end2, ...buttonMeshes];
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

    updateHighlight(deltaTime) {}
} 