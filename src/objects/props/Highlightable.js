import * as THREE from 'three';

export class Highlightable {
    constructor(model) {
        this.model = model;
        this.isHighlighted = false;
        this.pulseTime = 0;
    }

    setHighlight(enabled) {
        if (this.isHighlighted === enabled) return;
        this.isHighlighted = enabled;
        
        this.model.traverse(obj => {
            if (obj.isMesh && obj.material) {
                if (enabled) {
                    obj.material.emissive = obj.material.emissive || new THREE.Color();
                    obj.material.emissive.set(0x222222);
                    obj.material.emissiveIntensity = 0.5;
                } else {
                    if (obj.material.emissive) {
                        obj.material.emissive.set(0);
                        obj.material.emissiveIntensity = 0;
                    }
                }
            }
        });
    }

    updateHighlight(deltaTime = 1/60) {
        if (!this.isHighlighted || !this.model) return;
        
        this.pulseTime += deltaTime * 2.0;
        const pulse = (Math.sin(this.pulseTime * Math.PI * 2) + 1) / 2;
        
        this.model.traverse(obj => {
            if (obj.isMesh && obj.material && 'emissive' in obj.material) {
                obj.material.emissiveIntensity = 0.8 + pulse * 0.4;
            }
        });
    }
} 