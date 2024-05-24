import { App, Plugin, PluginSettingTab, Setting, Modal, TextComponent, Notice } from 'obsidian';
import * as crypto from 'crypto';

interface PeekabooSettings {
    passwordHash: string;
    configuredHiddenFolders: string[];
    currentHiddenFolders: string[];
}

const DEFAULT_SETTINGS: PeekabooSettings = {
    passwordHash: '',
    configuredHiddenFolders: [],
    currentHiddenFolders: []
}

export default class Peekaboo extends Plugin {
    settings: PeekabooSettings;
    styleEl: HTMLStyleElement;
    ribbonIconEl: HTMLElement;

    async onload() {
        console.log('Loading Peekaboo plugin');

        await this.loadSettings();

        this.addSettingTab(new PeekabooSettingTab(this.app, this));

        this.addCommand({
            id: 'toggle-configured-files-visibility',
            name: 'Toggle Configured Files Visibility',
            callback: () => this.handlePasswordPrompt(async (password) => {
                if (this.verifyPassword(password)) {
                    await this.toggleConfiguredFoldersVisibility();
                } else {
                    this.showIncorrectPasswordDialog(() => this.handlePasswordPrompt(async (password) => {
                        if (this.verifyPassword(password)) {
                            await this.toggleConfiguredFoldersVisibility();
                        }
                    }));
                }
            })
        });

        this.styleEl = document.createElement('style');
        document.head.appendChild(this.styleEl);
        this.applyHiddenFolders();

        // Add ribbon icon
        this.ribbonIconEl = this.addRibbonIcon('eye', 'Toggle Configured Files Visibility', async () => {
            this.handlePasswordPrompt(async (password) => {
                if (this.verifyPassword(password)) {
                    await this.toggleConfiguredFoldersVisibility();
                } else {
                    this.showIncorrectPasswordDialog(() => this.handlePasswordPrompt(async (password) => {
                        if (this.verifyPassword(password)) {
                            await this.toggleConfiguredFoldersVisibility();
                        }
                    }));
                }
            });
        });

        this.updateRibbonIcon();
    }

    onunload() {
        document.head.removeChild(this.styleEl);
        this.ribbonIconEl.remove();
    }

    async loadSettings() {
        this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    }

    async saveSettings() {
        await this.saveData(this.settings);
    }

    applyHiddenFolders() {
        if (this.settings.currentHiddenFolders.length === 0) {
            this.styleEl.textContent = '';
            return;
        }
    
        console.log('Applying hidden folders:', this.settings.currentHiddenFolders);
    
        const hiddenSelectors = this.settings.currentHiddenFolders.map(folder => {
            // Remove the leading and trailing '/'
            folder = folder.replace(/^\/|\/$/g, '');

            if (folder.includes('*')) {
                if (folder.length == 1) {
                    return []
                } else if (!folder.endsWith('*')) {
                    return []
                } else {
                    return [`.nav-file-title[data-path^="${folder.replace(/.$/,'')}"]`]
                }
            } else {
                return [
                    `.nav-folder-title[data-path="${folder}"]`,
                    `.nav-folder-title[data-path^="${folder}/"]`,
                    `.nav-file-title[data-path="${folder}"]`,
                    `.nav-file-title[data-path^="${folder}."]`,
                    `.nav-file-title[data-path^="${folder}/"]`
                ]
            }
    
        }).flat().join(', ');
    
        this.styleEl.textContent = hiddenSelectors ? `${hiddenSelectors} { display: none !important; }` : '';
        console.log('Updated CSS:', this.styleEl.textContent);
        // Force Refresh Style
        const head = document.head;
        head.removeChild(this.styleEl);
        head.appendChild(this.styleEl);
    }

    handlePasswordPrompt(callback: (password: string) => void) {
        const promptForPassword = () => {
            this.promptForPassword(async (password) => {
                if (this.verifyPassword(password)) {
                    callback(password);
                } else {
                    this.showIncorrectPasswordDialog(promptForPassword);
                }
            });
        };
        promptForPassword();
    }

    promptForPassword(callback: (password: string) => void) {
        const modal = new PasswordPromptModal(this.app, callback);
        modal.open();
    }

    showIncorrectPasswordDialog(callback: () => void) {
        const modal = new IncorrectPasswordModal(this.app, callback);
        modal.open();
    }

    async toggleConfiguredFoldersVisibility() {
        if (this.settings.currentHiddenFolders.length > 0) {
            // Show all configured hidden folders
            console.log('Showing all configured hidden folders');
            this.settings.currentHiddenFolders = [];
        } else {
            // Hide all configured folders
            console.log('Hiding all configured folders');
            this.settings.currentHiddenFolders = [...this.settings.configuredHiddenFolders];
        }
        await this.saveSettings();
        this.applyHiddenFolders();
        this.updateRibbonIcon();
    }

    updateRibbonIcon() {
        if (this.settings.currentHiddenFolders.length > 0) {
            this.ribbonIconEl.setAttribute('aria-label', 'Peekaboo: Show Configured Files');
            this.ribbonIconEl.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-eye-slash" viewBox="0 0 16 16"> <path d="M13.359 11.238C15.06 9.72 16 8 16 8s-3-5.5-8-5.5a7 7 0 0 0-2.79.588l.77.771A6 6 0 0 1 8 3.5c2.12 0 3.879 1.168 5.168 2.457A13 13 0 0 1 14.828 8q-.086.13-.195.288c-.335.48-.83 1.12-1.465 1.755q-.247.248-.517.486z"/> <path d="M11.297 9.176a3.5 3.5 0 0 0-4.474-4.474l.823.823a2.5 2.5 0 0 1 2.829 2.829zm-2.943 1.299.822.822a3.5 3.5 0 0 1-4.474-4.474l.823.823a2.5 2.5 0 0 0 2.829 2.829"/> <path d="M3.35 5.47q-.27.24-.518.487A13 13 0 0 0 1.172 8l.195.288c.335.48.83 1.12 1.465 1.755C4.121 11.332 5.881 12.5 8 12.5c.716 0 1.39-.133 2.02-.36l.77.772A7 7 0 0 1 8 13.5C3 13.5 0 8 0 8s.939-1.721 2.641-3.238l.708.709zm10.296 8.884-12-12 .708-.708 12 12z"/> </svg>';
        } else {
            this.ribbonIconEl.setAttribute('aria-label', 'Peekaboo: Hide Configured Files');
            this.ribbonIconEl.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-eye" viewBox="0 0 16 16"> <path d="M16 8s-3-5.5-8-5.5S0 8 0 8s3 5.5 8 5.5S16 8 16 8M1.173 8a13 13 0 0 1 1.66-2.043C4.12 4.668 5.88 3.5 8 3.5s3.879 1.168 5.168 2.457A13 13 0 0 1 14.828 8q-.086.13-.195.288c-.335.48-.83 1.12-1.465 1.755C11.879 11.332 10.119 12.5 8 12.5s-3.879-1.168-5.168-2.457A13 13 0 0 1 1.172 8z"/> <path d="M8 5.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5M4.5 8a3.5 3.5 0 1 1 7 0 3.5 3.5 0 0 1-7 0"/> </svg>';
        }
    }

    hashPassword(password: string): string {
        return crypto.createHash('sha256').update(password).digest('hex');
    }

    verifyPassword(password: string): boolean {
        return this.hashPassword(password) === this.settings.passwordHash;
    }
}

class PeekabooSettingTab extends PluginSettingTab {
    plugin: Peekaboo;

    constructor(app: App, plugin: Peekaboo) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display(): void {
        const { containerEl } = this;

        containerEl.empty();
        containerEl.createEl('h2', { text: 'Settings for Peekaboo plugin.' });

        new Setting(containerEl)
            .setName('Password')
            .setDesc('Set a password to protect folder visibility.')
            .addButton(button => {
                button.setButtonText('Set Password')
                    .onClick(() => {
                        this.plugin.promptForPassword(async (password) => {
                            this.plugin.settings.passwordHash = this.plugin.hashPassword(password);
                            await this.plugin.saveSettings();
                        });
                    });
            });

        new Setting(containerEl)
            .setName('Configured Hidden Folders')
            .setDesc('Manage configured hidden folders and files.')
            .addButton(button => {
                button.setButtonText('Manage Hidden Items')
                    .onClick(() => {
                        if (!this.plugin.settings.passwordHash) {
                            // Create a dialog box to prompt the user to set a password
                            new Notice('Please set a password first.');
                            return;
                        }

                        // Define a function to prompt the user to enter a password
                        const promptForPassword = async () => {
                            this.plugin.handlePasswordPrompt(async (password) => {
                                if (this.plugin.verifyPassword(password)) {
                                    new HiddenFoldersModal(this.app, this.plugin).open();
                                } else {
                                    // Create a dialog box to prompt for incorrect password.
                                    this.plugin.showIncorrectPasswordDialog(promptForPassword);
                                }
                            });
                        };

                        // Initial prompt for user to enter password
                        promptForPassword();
                    });
            });
    }
}

class PasswordPromptModal extends Modal {
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

class IncorrectPasswordModal extends Modal {
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

class HiddenFoldersModal extends Modal {
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

        contentEl.createEl('button', { text: 'Save' }).addEventListener('click', async () => {
            const newHiddenFolders = textArea.value.split('\n').map(item => item.trim()).filter(item => item);
            this.plugin.settings.configuredHiddenFolders = newHiddenFolders;
            this.plugin.settings.currentHiddenFolders = newHiddenFolders;
            await this.plugin.saveSettings();
            this.plugin.applyHiddenFolders();
            this.plugin.updateRibbonIcon(); // Update Ribbon icon
            this.close();
        });
    }

    onClose() {
        const { contentEl } = this;
        contentEl.empty();
    }
}
