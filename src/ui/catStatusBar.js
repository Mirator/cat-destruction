import { UI_CONFIG, ACTIVITY_TYPES, ACTIVITY_DESCRIPTIONS } from '../config/GameConfig.js';
import { GameEvents } from '../events/GameEvents.js';

export class CatStatusBar {
    constructor() {
        this.createElements();
        this.setupEventListeners();
    }

    setupEventListeners() {
        GameEvents.subscribe(GameEvents.EVENT_TYPES.ACTIVITY_CHANGED, 
            ({activity}) => this.updateActivity(activity));
        GameEvents.subscribe(GameEvents.EVENT_TYPES.CAT_STATE_CHANGED, 
            (state) => {
                if (state.anger !== undefined) {
                    this.updateAnger(state.anger);
                }
            });
    }

    createElements() {
        this.container = this.createElement('div', {
            position: 'fixed',
            ...UI_CONFIG.statusBar.position,
            ...UI_CONFIG.statusBar.size,
            ...UI_CONFIG.statusBar.style
        });

        // Anger section
        this.angerSection = this.createElement('div', {
            marginBottom: '10px'
        });

        this.angerHeader = this.createElement('div', {
            display: 'flex',
            justifyContent: 'space-between',
            marginBottom: '5px',
            color: 'white',
            fontSize: '14px'
        });

        this.angerLabel = this.createElement('div');
        this.angerLabel.textContent = 'Mood';

        this.angerValue = this.createElement('div');

        this.angerBarContainer = this.createElement('div', {
            width: '100%',
            height: '20px',
            backgroundColor: 'rgba(255, 255, 255, 0.2)',
            borderRadius: '3px',
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
            color: 'white',
            fontSize: '14px'
        });
        this.activityLabel.textContent = 'Activity';

        this.activityValue = this.createElement('div', {
            color: 'white',
            fontSize: '14px'
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
        this.updateActivity(ACTIVITY_TYPES.IDLE);
    }

    createElement(type, styles) {
        const element = document.createElement(type);
        Object.assign(element.style, styles);
        return element;
    }

    getAngerColor(anger) {
        if (anger < UI_CONFIG.statusBar.thresholds.annoyed) {
            return UI_CONFIG.hungerBar.colors.fill.good;
        } else if (anger < UI_CONFIG.statusBar.thresholds.angry) {
            return UI_CONFIG.hungerBar.colors.fill.warning;
        }
        return UI_CONFIG.hungerBar.colors.fill.critical;
    }

    getMoodText(anger) {
        if (anger < UI_CONFIG.statusBar.thresholds.annoyed) {
            return 'Calm';
        } else if (anger < UI_CONFIG.statusBar.thresholds.angry) {
            return 'Annoyed';
        }
        return 'Angry';
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
        this.activityValue.textContent = ACTIVITY_DESCRIPTIONS[activity] || 'Idle';
    }
} 