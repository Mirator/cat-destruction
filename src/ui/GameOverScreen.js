export class GameOverScreen {
    constructor(onRestart) {
        this.createElements();
        this.onRestart = onRestart;
    }

    createElements() {
        this.overlay = document.createElement('div');
        Object.assign(this.overlay.style, {
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            background: 'rgba(0,0,0,0.85)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2000,
            color: 'white',
            fontFamily: 'Arial, sans-serif',
            fontSize: '2.5rem',
            letterSpacing: '2px',
            display: 'none',
        });

        this.message = document.createElement('div');
        this.message.textContent = 'Game Over';
        this.overlay.appendChild(this.message);

        // Cozy time area
        this.timeBox = document.createElement('div');
        this.timeBox.style.background = 'rgba(255,245,200,0.92)';
        this.timeBox.style.borderRadius = '22px';
        this.timeBox.style.padding = '18px 36px 14px 36px';
        this.timeBox.style.marginTop = '18px';
        this.timeBox.style.display = 'flex';
        this.timeBox.style.flexDirection = 'column';
        this.timeBox.style.alignItems = 'center';
        this.timeBox.style.boxShadow = '0 4px 24px rgba(120,80,40,0.13)';
        this.timeBox.style.opacity = '0';
        this.timeBox.style.transition = 'opacity 0.7s';

        // Paw icon
        this.pawIcon = document.createElement('span');
        this.pawIcon.textContent = '🐾';
        this.pawIcon.style.fontSize = '2.2rem';
        this.pawIcon.style.marginBottom = '6px';
        this.timeBox.appendChild(this.pawIcon);

        // Survival time
        this.survivalTime = document.createElement('div');
        this.survivalTime.style.fontSize = '2.2rem';
        this.survivalTime.style.color = '#ffe066';
        this.survivalTime.style.fontWeight = 'bold';
        this.survivalTime.style.marginTop = '32px';
        this.survivalTime.style.textAlign = 'center';
        this.survivalTime.textContent = '';
        this.overlay.appendChild(this.survivalTime);

        // Best time
        this.bestTime = document.createElement('div');
        this.bestTime.style.fontSize = '1.5rem';
        this.bestTime.style.color = '#fff';
        this.bestTime.style.fontWeight = 'bold';
        this.bestTime.style.marginTop = '10px';
        this.bestTime.style.textAlign = 'center';
        this.bestTime.textContent = '';
        this.overlay.appendChild(this.bestTime);

        // New record message
        this.recordMsg = document.createElement('div');
        this.recordMsg.style.fontSize = '1.1rem';
        this.recordMsg.style.color = '#ff69b4';
        this.recordMsg.style.fontWeight = 'bold';
        this.recordMsg.style.marginTop = '8px';
        this.recordMsg.style.display = 'none';
        this.timeBox.appendChild(this.recordMsg);

        this.overlay.appendChild(this.timeBox);

        this.restartButton = document.createElement('button');
        this.restartButton.textContent = 'Restart';
        Object.assign(this.restartButton.style, {
            marginTop: '32px',
            padding: '12px 32px',
            fontSize: '1.2rem',
            borderRadius: '8px',
            border: 'none',
            background: '#4CAF50',
            color: 'white',
            cursor: 'pointer',
            fontWeight: 'bold',
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
        });
        this.restartButton.onclick = () => {
            this.hide();
            if (this.onRestart) this.onRestart();
        };
        this.overlay.appendChild(this.restartButton);

        document.body.appendChild(this.overlay);
    }

    setTimes(current, best, isNewRecord = false) {
        this.survivalTime.textContent = `You survived: ${current}`;
        this.bestTime.textContent = `Best: ${best}`;
        if (isNewRecord) {
            this.recordMsg.textContent = 'New Record! Purr-fect!';
            this.recordMsg.style.display = 'block';
        } else {
            this.recordMsg.style.display = 'none';
        }
    }

    show() {
        this.overlay.style.display = 'flex';
    }

    hide() {
        this.overlay.style.display = 'none';
    }
} 