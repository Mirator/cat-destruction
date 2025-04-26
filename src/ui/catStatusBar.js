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
            ...UI_CONFIG.statusBar.style,
            padding: '20px',
            backgroundColor: '#232323',
            borderRadius: '12px',
            boxShadow: '0 4px 16px rgba(0,0,0,0.25)'
        });

        // Anger section
        this.angerSection = this.createElement('div', {
            marginBottom: '24px'
        });

        this.angerHeader = this.createElement('div', {
            display: 'flex',
            justifyContent: 'space-between',
            marginBottom: '2px',
            color: 'white',
            fontSize: '16px',
            fontWeight: 'bold',
            letterSpacing: '0.5px'
        });

        this.angerLabel = this.createElement('div');
        this.angerLabel.textContent = 'Mood';

        this.angerValue = this.createElement('div');

        // Angriness label, improved style
        this.angerBarLabel = this.createElement('div', {
            color: '#bbbbbb',
            fontSize: '13px',
            fontStyle: 'italic',
            marginBottom: '6px',
            marginTop: '2px',
            textAlign: 'right',
            opacity: '0.8',
            fontWeight: '400'
        });
        this.angerBarLabel.textContent = 'Angriness';

        this.angerBarContainer = this.createElement('div', {
            width: '100%',
            height: '22px',
            backgroundColor: 'rgba(255, 255, 255, 0.13)',
            borderRadius: '6px',
            overflow: 'hidden',
            boxShadow: '0 2px 8px rgba(0,0,0,0.10)',
            border: '1px solid #333'
        });

        this.angerFillBar = this.createElement('div', {
            height: '100%',
            transition: 'all 0.3s cubic-bezier(.4,2,.6,1)',
            borderRadius: '6px 0 0 6px'
        });

        // Activity section
        this.activitySection = this.createElement('div');

        this.activityLabel = this.createElement('div', {
            marginBottom: '5px',
            color: 'white',
            fontSize: '16px',
            fontWeight: 'bold',
            letterSpacing: '0.5px'
        });
        this.activityLabel.textContent = 'Activity';

        this.activityValue = this.createElement('div', {
            color: 'white',
            fontSize: '15px',
            fontWeight: '500',
            marginBottom: '2px'
        });

        // Divider between sections
        this.divider = this.createElement('div', {
            width: '100%',
            height: '1px',
            backgroundColor: 'rgba(255,255,255,0.08)',
            margin: '18px 0 14px 0',
            borderRadius: '1px'
        });

        // Assemble the UI
        this.angerHeader.appendChild(this.angerLabel);
        this.angerHeader.appendChild(this.angerValue);
        this.angerBarContainer.appendChild(this.angerFillBar);
        this.angerSection.appendChild(this.angerHeader);
        this.angerSection.appendChild(this.angerBarLabel);
        this.angerSection.appendChild(this.angerBarContainer);

        this.activitySection.appendChild(this.activityLabel);
        this.activitySection.appendChild(this.activityValue);

        this.container.appendChild(this.angerSection);
        this.container.appendChild(this.divider);
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