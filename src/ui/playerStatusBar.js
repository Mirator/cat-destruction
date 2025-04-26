export class PlayerStatusBar {
    constructor(playerState) {
        this.playerState = playerState;
        this.createElements();
        this.playerState.onChange((health, maxHealth) => this.updateHealth(health, maxHealth));
        this.updateHealth(this.playerState.getHealth(), this.playerState.maxHealth);
    }

    createElements() {
        this.container = document.createElement('div');
        this.container.style.position = 'fixed';
        this.container.style.top = '20px';
        this.container.style.left = '20px';
        this.container.style.width = '220px';
        this.container.style.background = 'rgba(0,0,0,0.7)';
        this.container.style.borderRadius = '12px';
        this.container.style.padding = '18px 20px 14px 20px';
        this.container.style.boxShadow = '0 4px 16px rgba(0,0,0,0.25)';
        this.container.style.zIndex = '1001';
        this.container.style.fontFamily = 'Arial, sans-serif';

        // Header
        const header = document.createElement('div');
        header.textContent = 'Player Mood';
        header.style.color = 'white';
        header.style.fontSize = '16px';
        header.style.fontWeight = 'bold';
        header.style.marginBottom = '8px';
        this.container.appendChild(header);

        // Bar container
        this.barContainer = document.createElement('div');
        this.barContainer.style.width = '100%';
        this.barContainer.style.height = '22px';
        this.barContainer.style.background = 'rgba(255,255,255,0.13)';
        this.barContainer.style.borderRadius = '6px';
        this.barContainer.style.overflow = 'hidden';
        this.barContainer.style.border = '1px solid #333';
        this.container.appendChild(this.barContainer);

        // Fill bar
        this.fillBar = document.createElement('div');
        this.fillBar.style.height = '100%';
        this.fillBar.style.width = '100%';
        this.fillBar.style.background = '#4CAF50';
        this.fillBar.style.transition = 'all 0.3s cubic-bezier(.4,2,.6,1)';
        this.barContainer.appendChild(this.fillBar);

        // Value label
        this.valueLabel = document.createElement('div');
        this.valueLabel.style.color = 'white';
        this.valueLabel.style.fontSize = '15px';
        this.valueLabel.style.fontWeight = '500';
        this.valueLabel.style.marginTop = '6px';
        this.valueLabel.style.textAlign = 'right';
        this.container.appendChild(this.valueLabel);

        document.body.appendChild(this.container);
    }

    updateHealth(health, maxHealth) {
        const percent = Math.max(0, Math.min(100, (health / maxHealth) * 100));
        this.fillBar.style.width = percent + '%';
        this.fillBar.style.background = percent > 50 ? '#4CAF50' : (percent > 20 ? '#FFA726' : '#F44336');
        this.valueLabel.textContent = `Mood: ${Math.round(health)} / ${maxHealth}`;
    }
} 