import * as THREE from 'three';

export class InteractionUI {
    constructor() {
        this.createPromptElement();
        this.createHelpTipElement();
        this.createAttentionElement();
    }

    createPromptElement() {
        // Create prompt container
        this.promptElement = document.createElement('div');
        this.promptElement.style.position = 'fixed';
        this.promptElement.style.bottom = '20%';
        this.promptElement.style.left = '50%';
        this.promptElement.style.transform = 'translateX(-50%)';
        this.promptElement.style.backgroundColor = 'rgba(255, 236, 210, 0.95)';
        this.promptElement.style.color = '#6d4c2c';
        this.promptElement.style.padding = '10px 20px';
        this.promptElement.style.borderRadius = '12px';
        this.promptElement.style.boxShadow = '0 2px 12px rgba(120,80,40,0.10)';
        this.promptElement.style.fontFamily = '"Quicksand", "Segoe UI", Arial, sans-serif';
        this.promptElement.style.fontSize = '18px';
        this.promptElement.style.textAlign = 'center';
        this.promptElement.style.zIndex = '99999';
        this.promptElement.style.display = 'none';
        this.promptElement.style.transition = 'opacity 0.5s, box-shadow 0.5s';
        
        // Add to document
        document.body.appendChild(this.promptElement);
    }

    createHelpTipElement() {
        this.helpTipElement = document.createElement('div');
        this.helpTipElement.style.position = 'fixed';
        this.helpTipElement.style.top = '7%';
        this.helpTipElement.style.left = '50%';
        this.helpTipElement.style.transform = 'translateX(-50%)';
        this.helpTipElement.style.backgroundColor = 'rgba(255, 255, 210, 0.98)';
        this.helpTipElement.style.color = '#2d2d1a';
        this.helpTipElement.style.padding = '14px 32px';
        this.helpTipElement.style.borderRadius = '16px';
        this.helpTipElement.style.boxShadow = '0 2px 18px rgba(120,80,40,0.13)';
        this.helpTipElement.style.fontFamily = '"Quicksand", "Segoe UI", Arial, sans-serif';
        this.helpTipElement.style.fontSize = '22px';
        this.helpTipElement.style.textAlign = 'center';
        this.helpTipElement.style.zIndex = '100001';
        this.helpTipElement.style.display = 'none';
        this.helpTipElement.style.transition = 'opacity 0.5s, box-shadow 0.5s';
        document.body.appendChild(this.helpTipElement);
    }

    createAttentionElement() {
        this.attentionElement = document.createElement('div');
        this.attentionElement.style.position = 'fixed';
        this.attentionElement.style.top = '50%';
        this.attentionElement.style.left = '50%';
        this.attentionElement.style.transform = 'translate(-50%, -50%)';
        this.attentionElement.style.backgroundColor = 'rgba(255, 80, 80, 0.97)';
        this.attentionElement.style.color = '#fff';
        this.attentionElement.style.padding = '28px 60px';
        this.attentionElement.style.borderRadius = '24px';
        this.attentionElement.style.boxShadow = '0 4px 32px rgba(120,80,40,0.18)';
        this.attentionElement.style.fontFamily = 'Quicksand, Segoe UI, Arial, sans-serif';
        this.attentionElement.style.fontSize = '2.2rem';
        this.attentionElement.style.textAlign = 'center';
        this.attentionElement.style.zIndex = '100002';
        this.attentionElement.style.display = 'none';
        this.attentionElement.style.opacity = '0';
        this.attentionElement.style.transition = 'opacity 0.7s';
        document.body.appendChild(this.attentionElement);
        this.attentionTimeout = null;
    }

    showPrompt(text) {
        this.promptElement.textContent = text;
        this.promptElement.style.display = 'block';
    }

    hidePrompt() {
        this.promptElement.style.display = 'none';
    }

    updateInteractionPrompt(nearestFood, nearestBowl, isCarryingFood, nearestProp, nearestPhone, nearestParcel) {
        if (isCarryingFood) {
            if (nearestBowl) {
                this.showPrompt('Press [E] to fill the bowl');
            } else {
                this.hidePrompt();
            }
        } else if (nearestPhone) {
            this.showPrompt('Press [E] to use the phone');
        } else if (nearestParcel) {
            this.showPrompt('Press [E] to pick up the parcel');
        } else if (nearestFood) {
            this.showPrompt(`Press [E] to pick up ${nearestFood.getName()}`);
        } else if (nearestProp && nearestProp.isKnockedOver) {
            this.showPrompt('Press [E] to fix');
        } else {
            this.hidePrompt();
        }
    }

    showHelpTip(text) {
        this.helpTipElement.textContent = text;
        this.helpTipElement.style.display = 'block';
    }

    hideHelpTip() {
        this.helpTipElement.style.display = 'none';
    }

    showAttention(text, duration = 2500) {
        this.attentionElement.textContent = text;
        this.attentionElement.style.display = 'block';
        this.attentionElement.style.opacity = '1';
        if (this.attentionTimeout) clearTimeout(this.attentionTimeout);
        this.attentionTimeout = setTimeout(() => {
            this.hideAttention();
        }, duration);
    }

    hideAttention() {
        this.attentionElement.style.opacity = '0';
        setTimeout(() => {
            this.attentionElement.style.display = 'none';
        }, 700);
    }
} 