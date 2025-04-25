const HUNGER_UI_CONFIG = {
    container: {
        position: { top: '20px', right: '20px' },
        size: { width: '200px' },
        style: {
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            padding: '10px',
            borderRadius: '5px',
            fontFamily: 'Arial, sans-serif',
            zIndex: '1000'
        }
    },
    text: {
        style: {
            color: 'white',
            fontSize: '14px'
        }
    },
    bar: {
        size: { height: '20px' },
        style: {
            backgroundColor: 'rgba(255, 255, 255, 0.2)',
            borderRadius: '3px'
        }
    },
    thresholds: {
        wellFed: 30,
        hungry: 70
    },
    colors: {
        wellFed: '#4CAF50',    // Green
        hungry: '#FFA726',     // Orange
        veryHungry: '#F44336'  // Red
    }
};

export class HungerBar {
    constructor() {
        this.createElements();
    }

    createElements() {
        this.container = this.createElement('div', {
            position: 'fixed',
            ...HUNGER_UI_CONFIG.container.position,
            ...HUNGER_UI_CONFIG.container.size,
            ...HUNGER_UI_CONFIG.container.style
        });

        this.headerContainer = this.createElement('div', {
            display: 'flex',
            justifyContent: 'space-between',
            marginBottom: '5px'
        });

        this.label = this.createElement('div', {
            ...HUNGER_UI_CONFIG.text.style
        });
        this.label.textContent = 'Hunger';

        this.hungerValue = this.createElement('div', {
            ...HUNGER_UI_CONFIG.text.style
        });

        this.barContainer = this.createElement('div', {
            width: '100%',
            ...HUNGER_UI_CONFIG.bar.size,
            ...HUNGER_UI_CONFIG.bar.style,
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
        if (hunger < HUNGER_UI_CONFIG.thresholds.wellFed) {
            return HUNGER_UI_CONFIG.colors.wellFed;
        } else if (hunger < HUNGER_UI_CONFIG.thresholds.hungry) {
            return HUNGER_UI_CONFIG.colors.hungry;
        }
        return HUNGER_UI_CONFIG.colors.veryHungry;
    }

    getStatusText(hunger) {
        if (hunger < HUNGER_UI_CONFIG.thresholds.wellFed) {
            return 'Not Hungry';
        } else if (hunger < HUNGER_UI_CONFIG.thresholds.hungry) {
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
