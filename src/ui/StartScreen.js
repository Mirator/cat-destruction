export class StartScreen {
    constructor(onStart) {
        this.createElements();
        this.onStart = onStart;
        this.keyListener = (e) => {
            this.hide();
            window.removeEventListener('keydown', this.keyListener);
            window.removeEventListener('pointerdown', this.keyListener);
            if (this.onStart) this.onStart();
        };
    }

    createElements() {
        this.overlay = document.createElement('div');
        Object.assign(this.overlay.style, {
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            background: 'linear-gradient(135deg, #f7cac9 0%, #ffe4b5 100%)', // warm pink to cream
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 3000,
            color: '#3a2c1a',
            fontFamily: '"Quicksand", "Segoe UI", Arial, sans-serif',
            fontSize: '2rem',
            letterSpacing: '1px',
            transition: 'opacity 0.7s',
            opacity: '0',
        });

        // Centered cozy box
        this.cozyBox = document.createElement('div');
        Object.assign(this.cozyBox.style, {
            background: 'rgba(255,255,255,0.92)',
            borderRadius: '32px',
            boxShadow: '0 8px 32px rgba(120,80,40,0.18)',
            padding: '48px 40px 36px 40px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            minWidth: '340px',
            maxWidth: '90vw',
        });

        // Cat emoji
        const catEmoji = document.createElement('div');
        catEmoji.textContent = '🐾';
        catEmoji.style.fontSize = '3.5rem';
        catEmoji.style.marginBottom = '1.2rem';
        this.cozyBox.appendChild(catEmoji);

        // Game title
        const title = document.createElement('div');
        title.textContent = 'Cat Destruction';
        title.style.fontSize = '2.5rem';
        title.style.fontWeight = 'bold';
        title.style.marginBottom = '1.1rem';
        title.style.letterSpacing = '2px';
        title.style.fontFamily = '"Quicksand", "Segoe UI", Arial, sans-serif';
        this.cozyBox.appendChild(title);

        // Introduction
        const intro = document.createElement('div');
        intro.innerHTML = `Welcome to your cozy home!<br>Your goal is to keep your mischievous cat happy and well-fed.<br><br><i>Feed her before she gets too hungry... or she might cause chaos!</i>`;
        intro.style.marginBottom = '2rem';
        intro.style.textAlign = 'center';
        intro.style.fontSize = '1.25rem';
        intro.style.color = '#5a4633';
        this.cozyBox.appendChild(intro);

        // Controls
        const controls = document.createElement('div');
        controls.innerHTML = `
            <b>Controls:</b><br>
            Move: <b>WASD</b> or <b>Arrow Keys</b><br>
            Look: <b>Mouse</b><br>
            Crouch: <b>C</b><br>
            Interact: <b>E</b><br>
        `;
        controls.style.marginBottom = '2.5rem';
        controls.style.textAlign = 'center';
        controls.style.fontSize = '1.1rem';
        controls.style.color = '#6d4c2c';
        this.cozyBox.appendChild(controls);

        // Press any key to start
        const startMsg = document.createElement('div');
        startMsg.textContent = 'Press any key or click to start';
        startMsg.style.fontSize = '1.2rem';
        startMsg.style.opacity = '0.85';
        startMsg.style.marginTop = '1.5rem';
        startMsg.style.color = '#7a5c3a';
        this.cozyBox.appendChild(startMsg);

        this.overlay.appendChild(this.cozyBox);
        document.body.appendChild(this.overlay);

        // Fade in
        setTimeout(() => {
            this.overlay.style.opacity = '1';
        }, 30);
    }

    show() {
        this.overlay.style.display = 'flex';
        setTimeout(() => {
            this.overlay.style.opacity = '1';
        }, 30);
        window.addEventListener('keydown', this.keyListener);
        window.addEventListener('pointerdown', this.keyListener);
    }

    hide() {
        this.overlay.style.opacity = '0';
        setTimeout(() => {
            this.overlay.style.display = 'none';
        }, 700);
    }
} 