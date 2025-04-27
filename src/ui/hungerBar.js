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
            backgroundColor: '#232323',
            padding: '20px',
            borderRadius: '12px',
            fontFamily: 'Arial, sans-serif',
            zIndex: '1000',
            boxShadow: '0 4px 16px rgba(0,0,0,0.25)'
        });

        this.headerContainer = this.createElement('div', {
            display: 'flex',
            justifyContent: 'space-between',
            marginBottom: '2px',
            fontSize: '16px',
            fontWeight: 'bold',
            color: 'white',
            letterSpacing: '0.5px'
        });

        this.label = this.createElement('div', {});
        this.label.textContent = 'Hunger';

        this.hungerValue = this.createElement('div', {
            color: 'white',
            fontSize: '16px',
            fontWeight: 'bold',
            marginLeft: '10px'
        });

        this.barLabel = this.createElement('div', {
            color: '#bbbbbb',
            fontSize: '13px',
            fontStyle: 'italic',
            marginBottom: '6px',
            marginTop: '2px',
            textAlign: 'right',
            opacity: '0.8',
            fontWeight: '400'
        });
        this.barLabel.textContent = 'Hunger Level';

        this.barContainer = this.createElement('div', {
            width: '100%',
            height: '22px',
            backgroundColor: 'rgba(255, 255, 255, 0.13)',
            borderRadius: '6px',
            overflow: 'hidden',
            boxShadow: '0 2px 8px rgba(0,0,0,0.10)',
            border: '1px solid #333'
        });

        this.fillBar = this.createElement('div', {
            height: '100%',
            transition: 'all 0.3s cubic-bezier(.4,2,.6,1)',
            borderRadius: '6px 0 0 6px'
        });

        this.barElement = document.createElement('div');
        Object.assign(this.barElement.style, {
            background: 'rgba(255, 236, 210, 0.92)',
            borderRadius: '16px',
            boxShadow: '0 2px 12px rgba(120,80,40,0.10)',
            fontFamily: '"Quicksand", "Segoe UI", Arial, sans-serif',
            color: '#6d4c2c',
            fontSize: '1.1rem',
            padding: '10px 24px',
            margin: '12px',
            display: 'flex',
            alignItems: 'center',
            transition: 'opacity 0.5s, box-shadow 0.5s',
        });

        // Assemble the UI
        this.headerContainer.appendChild(this.label);
        this.headerContainer.appendChild(this.hungerValue);
        this.barContainer.appendChild(this.fillBar);
        this.container.appendChild(this.headerContainer);
        this.container.appendChild(this.barLabel);
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

    update(hunger, foodPreference = null) {
        // Ensure hunger is within bounds
        const clampedHunger = Math.max(0, Math.min(100, hunger));
        
        // Update numerical display
        this.hungerValue.textContent = `${Math.round(clampedHunger)}%`;

        // Update fill percentage (now directly maps to hunger)
        this.fillBar.style.width = `${clampedHunger}%`;

        // Update color and text based on hunger level
        this.fillBar.style.backgroundColor = this.getStatusColor(clampedHunger);
        this.label.textContent = this.getStatusText(clampedHunger);

        // Show food preference if set
        if (foodPreference === 'FISH') {
            this.barLabel.textContent = 'Wants: Fish';
        } else if (foodPreference === 'CHICKEN') {
            this.barLabel.textContent = 'Wants: Chicken';
        } else {
            this.barLabel.textContent = 'Hunger Level';
        }
    }
}
