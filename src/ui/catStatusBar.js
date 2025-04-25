import { CAT_ACTIVITIES } from '../objects/cat.js';

const STATUS_UI_CONFIG = {
    container: {
        position: { top: '80px', right: '20px' },  // Position below hunger bar
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
    colors: {
        calm: '#4CAF50',      // Green
        annoyed: '#FFA726',   // Orange
        angry: '#F44336'      // Red
    },
    thresholds: {
        annoyed: 30,
        angry: 70
    },
    activities: {
        [CAT_ACTIVITIES.IDLE]: 'Relaxing',
        [CAT_ACTIVITIES.WALKING]: 'Exploring',
        [CAT_ACTIVITIES.EATING]: 'Eating',
        [CAT_ACTIVITIES.SEARCHING_FOOD]: 'Looking for Food',
        [CAT_ACTIVITIES.MEOWING]: 'Meowing',
        [CAT_ACTIVITIES.ROTATING]: 'Looking Around',
        [CAT_ACTIVITIES.HEARD_FOOD]: 'Noticed Food!'
    }
};

export class CatStatusBar {
    constructor() {
        this.createElements();
    }

    createElements() {
        this.container = this.createElement('div', {
            position: 'fixed',
            ...STATUS_UI_CONFIG.container.position,
            ...STATUS_UI_CONFIG.container.size,
            ...STATUS_UI_CONFIG.container.style
        });

        // Anger section
        this.angerSection = this.createElement('div', {
            marginBottom: '10px'
        });

        this.angerHeader = this.createElement('div', {
            display: 'flex',
            justifyContent: 'space-between',
            marginBottom: '5px',
            ...STATUS_UI_CONFIG.text.style
        });

        this.angerLabel = this.createElement('div');
        this.angerLabel.textContent = 'Mood';

        this.angerValue = this.createElement('div');

        this.angerBarContainer = this.createElement('div', {
            width: '100%',
            ...STATUS_UI_CONFIG.bar.size,
            ...STATUS_UI_CONFIG.bar.style,
            overflow: 'hidden'
        });

        this.angerFillBar = this.createElement('div', {
            height: '100%',
            transition: 'all 0.3s ease'
        });

        // Activity section
        this.activitySection = this.createElement('div');

        this.activityLabel = this.createElement('div', {
            marginBottom: '5px',
            ...STATUS_UI_CONFIG.text.style
        });
        this.activityLabel.textContent = 'Activity';

        this.activityValue = this.createElement('div', {
            ...STATUS_UI_CONFIG.text.style
        });

        // Assemble the UI
        this.angerHeader.appendChild(this.angerLabel);
        this.angerHeader.appendChild(this.angerValue);
        this.angerBarContainer.appendChild(this.angerFillBar);
        this.angerSection.appendChild(this.angerHeader);
        this.angerSection.appendChild(this.angerBarContainer);

        this.activitySection.appendChild(this.activityLabel);
        this.activitySection.appendChild(this.activityValue);

        this.container.appendChild(this.angerSection);
        this.container.appendChild(this.activitySection);
        document.body.appendChild(this.container);

        // Set initial state
        this.updateAnger(0);
        this.updateActivity(CAT_ACTIVITIES.IDLE);
    }

    createElement(type, styles) {
        const element = document.createElement(type);
        Object.assign(element.style, styles);
        return element;
    }

    getAngerColor(anger) {
        if (anger < STATUS_UI_CONFIG.thresholds.annoyed) {
            return STATUS_UI_CONFIG.colors.calm;
        } else if (anger < STATUS_UI_CONFIG.thresholds.angry) {
            return STATUS_UI_CONFIG.colors.annoyed;
        }
        return STATUS_UI_CONFIG.colors.angry;
    }

    getMoodText(anger) {
        if (anger < STATUS_UI_CONFIG.thresholds.annoyed) {
            return 'Calm';
        } else if (anger < STATUS_UI_CONFIG.thresholds.angry) {
            return 'Annoyed';
        }
        return 'Angry';
    }

    getActivityText(activity) {
        return STATUS_UI_CONFIG.activities[activity] || 'Idle';
    }

    updateAnger(anger) {
        // Ensure anger is within bounds
        const clampedAnger = Math.max(0, Math.min(100, anger));
        
        // Update numerical display
        this.angerValue.textContent = this.getMoodText(clampedAnger);

        // Update fill percentage
        this.angerFillBar.style.width = `${clampedAnger}%`;

        // Update color
        this.angerFillBar.style.backgroundColor = this.getAngerColor(clampedAnger);
    }

    updateActivity(activity) {
        this.activityValue.textContent = this.getActivityText(activity);
    }
} 