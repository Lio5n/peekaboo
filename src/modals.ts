import { App, Modal, TextComponent } from 'obsidian';

export class PasswordPromptModal extends Modal {
    callback: (password: string) => void;

    constructor(app: App, callback: (password: string) => void) {
        super(app);
        this.callback = callback;
    }

    onOpen() {
        const { contentEl } = this;
        contentEl.createEl('h2', { text: 'Enter password' });

        const passwordInput = new TextComponent(contentEl);
        passwordInput.inputEl.type = 'password';
        passwordInput.inputEl.placeholder = 'Enter password';

        passwordInput.inputEl.addClass('peekaboo-inline-input-box');
        passwordInput.inputEl.addEventListener('keypress', (event) => {
            if (event.key === 'Enter') {
                this.callback(passwordInput.getValue());
                this.close();
            }
        });

        contentEl.createEl('button', { text: 'Submit' }).addEventListener('click', () => {
            this.callback(passwordInput.getValue());
            this.close();
        });
    }

    onClose() {
        const { contentEl } = this;
        contentEl.empty();
    }
}

export class IncorrectPasswordModal extends Modal {
    callback: () => void;

    constructor(app: App, callback: () => void) {
        super(app);
        this.callback = callback;
    }

    onOpen() {
        const { contentEl } = this;
        contentEl.createEl('h2', { text: 'Incorrect Password' });
        contentEl.createEl('p', { text: 'The password you entered is incorrect.' });

        contentEl.createEl('button', { text: 'OK' }).addEventListener('click', () => {
            this.callback();
            this.close();
        });
    }

    onClose() {
        const { contentEl } = this;
        contentEl.empty();
    }
}

export class HideSpecifyFileModal extends Modal {
    resolve: (filePath: string | null) => void;

    constructor(app: App, resolve: (filePath: string | null) => void) {
        super(app);
        this.resolve = resolve;
    }

    onOpen() {
        const { contentEl } = this;
        contentEl.createEl('h2', { text: 'Enter file path' });

        const inputEl = contentEl.createEl('input', { type: 'text', cls: 'peekaboo-single-line-input-box' });
        inputEl.focus();

        const submit = () => {
            this.resolve(inputEl.value);
            this.close();
        };

        inputEl.addEventListener('keydown', (event) => {
            if (event.key === 'Enter') {
                submit();
            }
        });

        const buttonContainer = contentEl.createDiv({ cls: 'peekaboo-single-line-button-container' });

        const submitBtn = buttonContainer.createEl('button', { text: 'Submit', cls: 'peekaboo-single-line-button' });
        submitBtn.onclick = submit;

        const cancelBtn = buttonContainer.createEl('button', { text: 'Cancel', cls: 'peekaboo-single-line-button' });
        cancelBtn.onclick = () => {
            this.resolve(null);
            this.close();
        };
    }

    onClose() {
        const { contentEl } = this;
        contentEl.empty();
    }
}