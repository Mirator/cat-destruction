export class DialingUI {
    static rendererDomElement = null;
    static setRendererDomElement(domElement) {
        DialingUI.rendererDomElement = domElement;
    }

    constructor() {
        this.overlay = null;
        this.codeDisplay = null;
        this.inputDisplay = null;
        this.keypad = null;
        this.cancelBtn = null;
        this.onComplete = null;
        this.onCancel = null;
        this.active = false;
    }

    createElements() {
        // Overlay
        this.overlay = document.createElement('div');
        this.overlay.style.position = 'fixed';
        this.overlay.style.top = '0';
        this.overlay.style.left = '0';
        this.overlay.style.width = '100vw';
        this.overlay.style.height = '100vh';
        this.overlay.style.background = 'rgba(0,0,0,0.45)';
        this.overlay.style.zIndex = '100000';
        this.overlay.style.justifyContent = 'center';
        this.overlay.style.alignItems = 'center';
        this.overlay.style.flexDirection = 'column';
        this.overlay.style.fontFamily = 'monospace, Arial, sans-serif';
        this.overlay.style.fontSize = '2rem';
        this.overlay.style.textAlign = 'center';
        this.overlay.style.gap = '18px';
        this.overlay.style.display = 'flex';
        this.overlay.style.cursor = 'default';

        // Code display
        this.codeDisplay = document.createElement('div');
        this.codeDisplay.style.color = '#fff';
        this.codeDisplay.style.fontWeight = 'bold';
        this.overlay.appendChild(this.codeDisplay);

        // Input display
        this.inputDisplay = document.createElement('div');
        this.inputDisplay.style.color = '#fff';
        this.inputDisplay.style.marginBottom = '10px';
        this.overlay.appendChild(this.inputDisplay);

        // Keypad
        this.keypad = document.createElement('div');
        this.keypad.style.display = 'grid';
        this.keypad.style.gridTemplateColumns = 'repeat(3, 60px)';
        this.keypad.style.gap = '10px';
        this.keypad.style.justifyContent = 'center';
        this.keypad.style.margin = '0 auto 10px auto';
        for (let i = 1; i <= 9; i++) {
            this.keypad.appendChild(this.createKeyButton(i));
        }
        this.keypad.appendChild(this.createKeyButton(0));
        this.overlay.appendChild(this.keypad);

        // Cancel button
        this.cancelBtn = document.createElement('button');
        this.cancelBtn.textContent = 'Cancel';
        this.cancelBtn.style.marginTop = '10px';
        this.cancelBtn.style.fontSize = '1.2rem';
        this.cancelBtn.onclick = () => this.cancel();
        this.overlay.appendChild(this.cancelBtn);
    }

    createKeyButton(num) {
        const btn = document.createElement('button');
        btn.textContent = num;
        btn.style.width = '60px';
        btn.style.height = '60px';
        btn.style.fontSize = '2rem';
        btn.style.borderRadius = '12px';
        btn.style.border = 'none';
        btn.style.background = '#fff';
        btn.style.color = '#222';
        btn.style.cursor = 'pointer';
        btn.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)';
        btn.onclick = () => this.handleInput(num);
        return btn;
    }

    show(code, onComplete, onCancel) {
        if (!this.overlay) this.createElements();
        document.body.appendChild(this.overlay);
        this.active = true;
        this.code = code;
        this.input = [];
        this.onComplete = onComplete;
        this.onCancel = onCancel;
        this.overlay.style.display = 'flex';
        this.updateDisplay();
        document.addEventListener('keydown', this.keyListener);
        // Unlock pointer and show cursor
        if (document.exitPointerLock) {
            document.exitPointerLock();
        }
        document.body.style.cursor = 'default';
    }

    hide() {
        this.active = false;
        if (this.overlay && this.overlay.parentNode) {
            this.overlay.parentNode.removeChild(this.overlay);
        }
        document.removeEventListener('keydown', this.keyListener);
        // Re-lock pointer to renderer's DOM element and hide cursor
        if (DialingUI.rendererDomElement && DialingUI.rendererDomElement.requestPointerLock) {
            DialingUI.rendererDomElement.requestPointerLock();
        }
        document.body.style.cursor = 'none';
    }

    updateDisplay() {
        this.codeDisplay.textContent = 'Dial: ' + this.code.join(' ');
        this.inputDisplay.textContent = 'Input: ' + this.input.map(x => x).join(' ');
    }

    handleInput(num) {
        if (!this.active) return;
        if (this.input.length < this.code.length) {
            this.input.push(num);
            this.updateDisplay();
            if (this.input.length === this.code.length) {
                if (this.input.join('') === this.code.join('')) {
                    this.inputDisplay.textContent = 'Success!';
                    setTimeout(() => {
                        this.hide();
                        if (this.onComplete) this.onComplete();
                    }, 600);
                } else {
                    this.inputDisplay.textContent = 'Wrong! Try again.';
                    setTimeout(() => {
                        this.input = [];
                        this.updateDisplay();
                    }, 700);
                }
            }
        }
    }

    keyListener = (e) => {
        if (!this.active) return;
        if (e.key >= '0' && e.key <= '9') {
            this.handleInput(Number(e.key));
        } else if (e.key === 'Escape') {
            this.cancel();
        }
    };

    cancel() {
        this.hide();
        if (this.onCancel) this.onCancel();
    }
} 