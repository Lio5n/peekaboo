import { App, Modal, TextComponent, Setting, Notice } from 'obsidian';
import Peekaboo from './main';
import { saveSettings, applyHiddenFolders } from './settings';

export class PasswordPromptModal extends Modal {
    callback: (password: string) => void;

    constructor(app: App, callback: (password: string) => void) {
        super(app);
        this.callback = callback;
    }

    onOpen() {
        const { contentEl } = this;
        contentEl.createEl('h2', { text: 'Enter Password' });

        const passwordInput = new TextComponent(contentEl);
        passwordInput.inputEl.type = 'password';
        passwordInput.inputEl.placeholder = 'Enter password';

        passwordInput.inputEl.addClass('my-password-input');
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

        const style = document.createElement('style');
        style.textContent = `
            .my-password-input {
                width: 210px;
                box-sizing: border-box;
                margin-right: 11px;
                margin-bottom: 8px;
            }
        `;
        document.head.appendChild(style);
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

export class HiddenFoldersModal extends Modal {
    plugin: Peekaboo;

    constructor(app: App, plugin: Peekaboo) {
        super(app);
        this.plugin = plugin;
    }

    onOpen() {
        const { contentEl } = this;
        contentEl.createEl('h2', { text: 'Manage Configured Hidden Folders and Files' });

        const textArea = contentEl.createEl('textarea', {
            placeholder: 'Enter folders or files to hide, one per line'
        });
        textArea.style.width = '100%';
        textArea.style.height = '300px';
        textArea.value = this.plugin.settings.configuredHiddenFolders.join('\n');

        const buttonContainer = contentEl.createDiv({ cls: 'config-file-list-button-container' });
        buttonContainer.createEl('button', { text: 'Save' }).addEventListener('click', async () => {
            const newHiddenFolders = textArea.value.split('\n').map(item => item.trim()).filter(item => item);
            this.plugin.settings.configuredHiddenFolders = newHiddenFolders;
            this.plugin.settings.currentHiddenFolders = newHiddenFolders;
            this.plugin.settings.currentExceptionFiles = [...this.plugin.settings.configuredExceptionFiles]
            await saveSettings(this.plugin);
            applyHiddenFolders(this.plugin);
            this.plugin.updateRibbonIcon();
            this.close();
        });

        const style = document.createElement('style');
        style.textContent = `
            .config-file-list-button-container {
                display: flex;
                justify-content: flex-start;
                align-items: center;
                margin-top: 8px;
            }
        `;
        document.head.appendChild(style);
    }

    onClose() {
        const { contentEl } = this;
        contentEl.empty();
    }
}

export class ExceptionFilesModal extends Modal {
    plugin: Peekaboo;

    constructor(app: App, plugin: Peekaboo) {
        super(app);
        this.plugin = plugin;
    }

    onOpen() {
        const { contentEl } = this;
        contentEl.createEl('h2', { text: 'Manage Configured Exception Folders and Files' });

        const textArea = contentEl.createEl('textarea', {
            placeholder: 'Enter folders or files to exclude, one per line'
        });
        textArea.style.width = '100%';
        textArea.style.height = '300px';
        textArea.value = this.plugin.settings.configuredExceptionFiles.join('\n');

        const buttonContainer = contentEl.createDiv({ cls: 'my-config-file-list-button-container' });
        buttonContainer.createEl('button', { text: 'Save' }).addEventListener('click', async () => {
            const newExceptionFiles = textArea.value.split('\n').map(item => item.trim()).filter(item => item);
            this.plugin.settings.configuredExceptionFiles = newExceptionFiles;
            this.plugin.settings.currentExceptionFiles = newExceptionFiles;
            await saveSettings(this.plugin);
            applyHiddenFolders(this.plugin);
            this.plugin.updateRibbonIcon();
            this.close();
        });

        const style = document.createElement('style');
        style.textContent = `
            .my-config-file-list-button-container {
                display: flex;
                justify-content: flex-start;
                align-items: center;
                margin-top: 8px;
            }
        `;
        document.head.appendChild(style);
    }

    onClose() {
        const { contentEl } = this;
        contentEl.empty();
    }
}

export class FolderNameModal extends Modal {
    folderName: string;
    resolve: (value: string | null) => void;

    constructor(app: App) {
        super(app);
    }

    onOpen() {
        const { contentEl } = this;
        contentEl.createEl('h2', { text: 'Enter Folder Name' });

        const inputEl = contentEl.createEl('input', { type: 'text', cls: 'my-folder-name-input' });
        inputEl.addEventListener('input', (e) => {
            this.folderName = (e.target as HTMLInputElement).value;
        });

        inputEl.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.resolve(this.folderName);
                this.close();
            }
        });

        const buttonContainer = contentEl.createDiv({ cls: 'my-modal-button-container-2' });
        buttonContainer.createEl('button', { text: 'Create', cls: 'my-modals-button-2' }).addEventListener('click', () => {
            this.resolve(this.folderName);
            this.close();
        });

        buttonContainer.createEl('button', { text: 'Cancel', cls: 'my-modals-button-2' }).addEventListener('click', () => {
            this.resolve(null);
            this.close();
        });

        const style = document.createElement('style');
        style.textContent = `
            .my-folder-name-input {
                width: 100%;
            }
            .my-modal-button-container-2 {
                display: flex;
                justify-content: flex-start;
                align-items: center;
                margin-top: 9px;
            }
            .my-modals-button-2 {
                margin-right: 13px;
                margin-top: 5px;
            }
        `;
        document.head.appendChild(style);
    }

    onClose() {
        const { contentEl } = this;
        contentEl.empty();
    }

    open(): Promise<string | null> {
        return new Promise((resolve) => {
            this.resolve = resolve;
            super.open();
        });
    }
}
