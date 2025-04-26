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
        this.pulseTime = 0;
        if (!this.model) return;
        this.model.traverse(obj => {
            if (obj.isMesh && obj.material && 'emissive' in obj.material) {
                if (enabled) {
                    if (!obj.userData._originalEmissive) {
                        obj.userData._originalEmissive = obj.material.emissive.clone();
                        obj.userData._originalEmissiveIntensity = obj.material.emissiveIntensity;
                    }
                    obj.material.emissive.set(0xffe066);
                    obj.material.emissiveIntensity = 1.0;
                } else if (obj.userData._originalEmissive) {
                    obj.material.emissive.copy(obj.userData._originalEmissive);
                    obj.material.emissiveIntensity = obj.userData._originalEmissiveIntensity || 1.0;
                }
            }
        });
    }

    updateHighlight(deltaTime = 1/60) {
        if (!this.isHighlighted) return;
        this.pulseTime += deltaTime * 2.0;
        const pulse = (Math.sin(this.pulseTime * Math.PI * 2) + 1) / 2;
        if (!this.model) return;
        this.model.traverse(obj => {
            if (obj.isMesh && obj.material && 'emissive' in obj.material && this.isHighlighted) {
                obj.material.emissiveIntensity = 0.8 + pulse * 0.4;
            }
        });
    }
} 