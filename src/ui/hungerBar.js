import { UI_CONFIG } from '../config/GameConfig.js';

export class HungerBar {
    constructor() {
        this.createElements();
    }

    createElements() {
        this.container = this.createElement('div', {
            position: 'fixed',
            ...UI_CONFIG.hungerBar.position,
            width: UI_CONFIG.hungerBar.size.width,
            backgroundColor: UI_CONFIG.hungerBar.colors.background,
            padding: '10px',
            borderRadius: '5px',
            fontFamily: 'Arial, sans-serif',
            zIndex: '1000'
        });

        this.headerContainer = this.createElement('div', {
            display: 'flex',
            justifyContent: 'space-between',
            marginBottom: '5px'
        });

        this.label = this.createElement('div', {
            color: 'white',
            fontSize: '14px'
        });
        this.label.textContent = 'Hunger';

        this.hungerValue = this.createElement('div', {
            color: 'white',
            fontSize: '14px'
        });

        this.barContainer = this.createElement('div', {
            width: '100%',
            height: UI_CONFIG.hungerBar.size.height,
            backgroundColor: 'rgba(255, 255, 255, 0.2)',
            borderRadius: '3px',
            overflow: 'hidden'
        });

        this.fillBar = this.createElement('div', {
            height: '100%',
            transition: 'all 0.3s ease'
        });

        // Assemble the UI
        this.headerContainer.appendChild(this.label);
        this.headerContainer.appendChild(this.hungerValue);
        this.barContainer.appendChild(this.fillBar);
        this.container.appendChild(this.headerContainer);
        this.container.appendChild(this.barContainer);
        document.body.appendChild(this.container);

        // Set initial state
        this.update(50);
    }

    createElement(type, styles) {
        const element = document.createElement(type);
        Object.assign(element.style, styles);
        return element;
    }

    getStatusColor(hunger) {
        if (hunger < 30) {
            return UI_CONFIG.hungerBar.colors.fill.good;
        } else if (hunger < 70) {
            return UI_CONFIG.hungerBar.colors.fill.warning;
        }
        return UI_CONFIG.hungerBar.colors.fill.critical;
    }

    getStatusText(hunger) {
        if (hunger < 30) {
            return 'Not Hungry';
        } else if (hunger < 70) {
            return 'Getting Hungry';
        }
        return 'Very Hungry!';
    }

    update(hunger) {
        // Ensure hunger is within bounds
        const clampedHunger = Math.max(0, Math.min(100, hunger));
        
        // Update numerical display
        this.hungerValue.textContent = `${Math.round(clampedHunger)}%`;

        // Update fill percentage (now directly maps to hunger)
        this.fillBar.style.width = `${clampedHunger}%`;

        // Update color and text based on hunger level
        this.fillBar.style.backgroundColor = this.getStatusColor(clampedHunger);
        this.label.textContent = this.getStatusText(clampedHunger);
    }
}
