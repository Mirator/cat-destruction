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

        // Survival time
        this.survivalTime = document.createElement('div');
        this.survivalTime.style.fontSize = '1.3rem';
        this.survivalTime.style.marginTop = '18px';
        this.survivalTime.style.color = '#ffe6a0';
        this.survivalTime.textContent = '';
        this.overlay.appendChild(this.survivalTime);

        // Best time
        this.bestTime = document.createElement('div');
        this.bestTime.style.fontSize = '1.1rem';
        this.bestTime.style.marginTop = '6px';
        this.bestTime.style.color = '#ffd700';
        this.bestTime.textContent = '';
        this.overlay.appendChild(this.bestTime);

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

    setTimes(current, best) {
        this.survivalTime.textContent = `You survived: ${current}`;
        this.bestTime.textContent = `Best: ${best}`;
    }

    show() {
        this.overlay.style.display = 'flex';
    }

    hide() {
        this.overlay.style.display = 'none';
    }
} 