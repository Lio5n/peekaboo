import { App, Plugin, PluginSettingTab, Setting, Notice, Modal } from 'obsidian';
import { PeekabooSettings, DEFAULT_SETTINGS, loadSettings, saveSettings, applyHiddenFolders } from './settings';
import { PasswordPromptModal, IncorrectPasswordModal, HiddenFoldersModal, ExceptionFilesModal, FolderNameModal} from './modals';
import { hashPassword, verifyPassword } from './utils';

export default class Peekaboo extends Plugin {
    settings: PeekabooSettings;
    styleEl: HTMLStyleElement;
    ribbonIconEl: HTMLElement | null;

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

        this.addCommand({
            id: 'show-specified-file',
            name: 'Show Specified Note',
            callback: () => this.handlePasswordPrompt(async (password) => {
                if (this.verifyPassword(password)) {
                    const filePath = await this.promptForFilePath();
                    if (filePath) {
                        this.showSpecifiedFile(filePath);
                        this.updateExceptionFiles(filePath);
                    }
                } else {
                    this.showIncorrectPasswordDialog(() => this.handlePasswordPrompt(async (password) => {
                        if (this.verifyPassword(password)) {
                            const filePath = await this.promptForFilePath();
                            if (filePath) {
                                this.showSpecifiedFile(filePath);
                                this.updateExceptionFiles(filePath);
                            }
                        }
                    }));
                }
            })
        });

        this.addCommand({
            id: 'show-all-configured-files',
            name: 'Show All Configured Files',
            callback: () => this.handlePasswordPrompt(async (password) => {
                if (this.verifyPassword(password)) {
                    await this.showAllConfiguredFiles();
                } else {
                    this.showIncorrectPasswordDialog(() => this.handlePasswordPrompt(async (password) => {
                        if (this.verifyPassword(password)) {
                            await this.showAllConfiguredFiles();
                        }
                    }));
                }
            })
        });

        this.addCommand({
            id: 'hide-all-configured-files',
            name: 'Hide All Configured Files',
            callback: () => this.handlePasswordPrompt(async (password) => {
                if (this.verifyPassword(password)) {
                    await this.hideAllConfiguredFiles();
                } else {
                    this.showIncorrectPasswordDialog(() => this.handlePasswordPrompt(async (password) => {
                        if (this.verifyPassword(password)) {
                            await this.hideAllConfiguredFiles();
                        }
                    }));
                }
            })
        });

        this.addCommand({
            id: 'create-folder',
            name: 'Create Folder',
            callback: () => this.createFolder(),
        });

        this.styleEl = document.createElement('style');
        document.head.appendChild(this.styleEl);
        this.applyHiddenFolders();

        if (!this.settings.hideRibbonIcon) {
            this.ribbonIconEl = this.addRibbonIcon('eye', 'Peekaboo', () => {
                new CommandModal(this.app, this).open();
            });
        }

        this.updateRibbonIcon();
    }

    onunload() {
        document.head.removeChild(this.styleEl);
        if (this.ribbonIconEl) {
            this.ribbonIconEl.remove();
        }
    }

    async createFolder() {
        const folderName = await new FolderNameModal(this.app).open();
        if (folderName) {
            try {
                await this.app.vault.createFolder(folderName);
                new Notice(`Folder '${folderName}' created.`);
            } catch (error) {
                new Notice(`Failed to create folder '${folderName}': ${error.message}`);
            }
        }
    }

    async loadSettings() {
        this.settings = await loadSettings(this);
    }

    async saveSettings() {
        await saveSettings(this);
    }

    applyHiddenFolders() {
        applyHiddenFolders(this);
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
            this.settings.currentHiddenFolders = [];
            this.settings.currentExceptionFiles = [];
        } else {
            this.settings.currentHiddenFolders = [...this.settings.configuredHiddenFolders];
            this.settings.currentExceptionFiles = [...this.settings.configuredExceptionFiles];
        }
        await this.saveSettings();
        this.applyHiddenFolders();
        this.updateRibbonIcon();
    }

    async promptForFilePath(): Promise<string | null> {
        return new Promise((resolve) => {
            const modal = new PromptModal(this.app, resolve);
            modal.open();
        });
    }

    showSpecifiedFile(filePath: string) {
        this.settings.currentHiddenFolders = this.settings.currentHiddenFolders.filter(path => path !== filePath);
        this.applyHiddenFolders();
    }

    updateExceptionFiles(filePath: string) {
        if (!this.settings.currentExceptionFiles.includes(filePath)) {
            this.settings.currentExceptionFiles.push(filePath);
        }
        this.saveSettings();
        this.applyHiddenFolders();
    }

    async showAllConfiguredFiles() {
        this.settings.currentHiddenFolders = [];
        this.settings.configuredExceptionFiles = [];
        await this.saveSettings();
        this.applyHiddenFolders();
    }

    async hideAllConfiguredFiles() {
        this.settings.currentHiddenFolders = [...this.settings.configuredHiddenFolders];
        this.settings.currentExceptionFiles = [...this.settings.configuredExceptionFiles];
        await this.saveSettings();
        this.applyHiddenFolders();
    }

    updateRibbonIcon() {
        if (this.settings.hideRibbonIcon) {
            if (this.ribbonIconEl) {
                this.ribbonIconEl.remove();
                this.ribbonIconEl = null;
            }
        } else {
            if (!this.ribbonIconEl) {
                this.ribbonIconEl = this.addRibbonIcon('eye', 'Peekaboo', () => {
                    new CommandModal(this.app, this).open();
                });
            }

            if (this.settings.currentHiddenFolders.length > 0) {
                this.ribbonIconEl.setAttribute('aria-label', 'Peekaboo');
                this.ribbonIconEl.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-eye-slash" viewBox="0 0 16 16"> <path d="M13.359 11.238C15.06 9.72 16 8 16 8s-3-5.5-8-5.5a7 7 0 0 0-2.79.588l.77.771A6 6 0 0 1 8 3.5c2.12 0 3.879 1.168 5.168 2.457A13 13 0 0 1 14.828 8q-.086.13-.195.288c-.335.48-.83 1.12-1.465 1.755q-.247.248-.517.486z"/> <path d="M11.297 9.176a3.5 3.5 0 0 0-4.474-4.474l.823.823a2.5 2.5 0 0 1 2.829 2.829zm-2.943 1.299.822.822a3.5 3.5 0 0 1-4.474-4.474l.823.823a2.5 2.5 0 0 0 2.829 2.829"/> <path d="M3.35 5.47q-.27.24-.518.487A13 13 0 0 0 1.172 8l.195.288c.335.48.83 1.12 1.465 1.755C4.121 11.332 5.881 12.5 8 12.5c.716 0 1.39-.133 2.02-.36l.77.772A7 7 0 0 1 8 13.5C3 13.5 0 8 0 8s.939-1.721 2.641-3.238l.708.709zm10.296 8.884-12-12 .708-.708 12 12z"/> </svg>';
            } else {
                this.ribbonIconEl.setAttribute('aria-label', 'Peekaboo');
                this.ribbonIconEl.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-eye" viewBox="0 0 16 16"> <path d="M16 8s-3-5.5-8-5.5S0 8 0 8s3 5.5 8 5.5S16 8 16 8M1.173 8a13 13 0 0 1 1.66-2.043C4.12 4.668 5.88 3.5 8 3.5s3.879 1.168 5.168 2.457A13 13 0 0 1 14.828 8q-.086.13-.195.288c-.335.48-.83 1.12-1.465 1.755C11.879 11.332 10.119 12.5 8 12.5s-3.879-1.168-5.168-2.457A13 13 0 0 1 1.172 8z"/> <path d="M8 5.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5M4.5 8a3.5 3.5 0 1 1 7 0 3.5 3.5 0 0 1-7 0"/> </svg>';
            }
        }
    }

    verifyPassword(password: string): boolean {
        return verifyPassword(password, this.settings.passwordHash);
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
        containerEl.createEl('h2', { text: 'Peekaboo Settings' });

        new Setting(containerEl)
            .setName('Password')
            .setDesc('Set a password to protect the visibility of your files.')
            .addButton(button => {
                button.setButtonText('Set Password')
                    .onClick(() => {
                        this.plugin.promptForPassword(async (password) => {
                            this.plugin.settings.passwordHash = hashPassword(password);
                            await this.plugin.saveSettings();
                        });
                    });
            });

        new Setting(containerEl)
            .setName('Configured Hidden Files')
            .setDesc('Manage configure hidden folders and notes, one per line.')
            .addButton(button => {
                button.setButtonText('Manage Hidden Items')
                    .onClick(() => {
                        if (!this.plugin.settings.passwordHash) {
                            new Notice('Please set a password first.');
                            new SetPasswordPromptModal(this.app).open();
                            return;
                        }

                        const promptForPassword = async () => {
                            this.plugin.handlePasswordPrompt(async (password) => {
                                if (this.plugin.verifyPassword(password)) {
                                    new HiddenFoldersModal(this.app, this.plugin).open();
                                } else {
                                    this.plugin.showIncorrectPasswordDialog(promptForPassword);
                                }
                            });
                        };

                        promptForPassword();
                    });
            });

        new Setting(containerEl)
            .setName('Configured Exception Files')
            .setDesc('Manage configured exception notes, one per line. Notes only (folders not supported)')
            .addButton(button => {
                button.setButtonText('Manage Exception Items')
                    .onClick(() => {
                        if (!this.plugin.settings.passwordHash) {
                            new Notice('Please set a password first.');
                            new SetPasswordPromptModal(this.app).open();
                            return;
                        }

                        const promptForPassword = async () => {
                            this.plugin.handlePasswordPrompt(async (password) => {
                                if (this.plugin.verifyPassword(password)) {
                                    new ExceptionFilesModal(this.app, this.plugin).open();
                                } else {
                                    this.plugin.showIncorrectPasswordDialog(promptForPassword);
                                }
                            });
                        };

                        promptForPassword();
                    });
            });

        new Setting(containerEl)
            .setName('Hide Ribbon Icon')
            .setDesc('Hide the ribbon icon for this plugin.')
            .addToggle(toggle => {
                toggle.setValue(this.plugin.settings.hideRibbonIcon)
                    .onChange(async (value) => {
                        this.plugin.settings.hideRibbonIcon = value;
                        await this.plugin.saveSettings();
                        this.plugin.updateRibbonIcon();
                    });
            });

        new Setting(containerEl)
            .setName('Tips:')
            .setDesc("1. About 'Configured Exception Files': For example, when you want to show a note within a hidden folder...");

        containerEl.createEl('div', { cls: 'setting-item-description' })
            .createEl('p', { text: "2. Enhance Security with 'Excluded Files': To prevent hidden files from appearing in Search, Graph View, etc., configure 'Excluded files' under Options > Files and Links > Excluded files." })
            .style.marginTop='-13px';

    }
}

class PromptModal extends Modal {
    resolve: (filePath: string | null) => void;

    constructor(app: App, resolve: (filePath: string | null) => void) {
        super(app);
        this.resolve = resolve;
    }

    onOpen() {
        const { contentEl } = this;
        contentEl.createEl('h2', { text: 'Enter file path' });

        const inputEl = contentEl.createEl('input', { type: 'text', cls: 'my-file-name-input' });
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

        const buttonContainer = contentEl.createDiv({ cls: 'my-modal-button-container' });

        const submitBtn = buttonContainer.createEl('button', { text: 'Submit', cls: 'my-modals-button' });
        submitBtn.onclick = submit;

        const cancelBtn = buttonContainer.createEl('button', { text: 'Cancel', cls: 'my-modals-button' });
        cancelBtn.onclick = () => {
            this.resolve(null);
            this.close();
        };

        const style = document.createElement('style');
        style.textContent = `
            .my-file-name-input {
                width: 100%;
            }
            .my-modal-button-container {
                display: flex;
                justify-content: flex-start;
                align-items: center;
                margin-top: 9px;
            }
            .my-modals-button {
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
}

class SetPasswordPromptModal extends Modal {
    constructor(app: App) {
        super(app);
    }

    onOpen() {
        const { contentEl } = this;
        contentEl.createEl('h2', { text: 'Please set a password first.' });

        const okBtn = contentEl.createEl('button', { text: 'OK' });
        okBtn.onclick = () => {
            this.close();
        };
    }

    onClose() {
        const { contentEl } = this;
        contentEl.empty();
    }
}

class CommandModal extends Modal {
    plugin: Peekaboo;

    constructor(app: App, plugin: Peekaboo) {
        super(app);
        this.plugin = plugin;
    }

    onOpen() {
        const { contentEl } = this;
        this.modalEl.style.maxWidth = '500px';
        this.modalEl.style.margin = '0 auto'
        contentEl.style.width = '100%';
        contentEl.createEl('h2', { text: 'Peekaboo' });

        this.createButton(contentEl, 'Toggle Configured Files Visibility', async () => {
            this.close();
            this.plugin.handlePasswordPrompt(async (password) => {
                if (this.plugin.verifyPassword(password)) {
                    await this.plugin.toggleConfiguredFoldersVisibility();
                } else {
                    this.plugin.showIncorrectPasswordDialog(() => this.plugin.handlePasswordPrompt(async (password) => {
                        if (this.plugin.verifyPassword(password)) {
                            await this.plugin.toggleConfiguredFoldersVisibility();
                        }
                    }));
                }
            });
        });

        this.createButton(contentEl, 'Show Specified Note', async () => {
            this.close();
            this.plugin.handlePasswordPrompt(async (password) => {
                if (this.plugin.verifyPassword(password)) {
                    const filePath = await this.plugin.promptForFilePath();
                    if (filePath) {
                        this.plugin.showSpecifiedFile(filePath);
                        this.plugin.updateExceptionFiles(filePath);
                    }
                } else {
                    this.plugin.showIncorrectPasswordDialog(() => this.plugin.handlePasswordPrompt(async (password) => {
                        if (this.plugin.verifyPassword(password)) {
                            const filePath = await this.plugin.promptForFilePath();
                            if (filePath) {
                                this.plugin.showSpecifiedFile(filePath);
                                this.plugin.updateExceptionFiles(filePath);
                            }
                        }
                    }));
                }
            });
        });

        this.createButton(contentEl, 'Show All Configured Files', async () => {
            this.close();
            this.plugin.handlePasswordPrompt(async (password) => {
                if (this.plugin.verifyPassword(password)) {
                    await this.plugin.showAllConfiguredFiles();
                } else {
                    this.plugin.showIncorrectPasswordDialog(() => this.plugin.handlePasswordPrompt(async (password) => {
                        if (this.plugin.verifyPassword(password)) {
                            await this.plugin.showAllConfiguredFiles();
                        }
                    }));
                }
            });
        });

        this.createButton(contentEl, 'Hide All Configured Files', async () => {
            this.close();
            this.plugin.handlePasswordPrompt(async (password) => {
                if (this.plugin.verifyPassword(password)) {
                    await this.plugin.hideAllConfiguredFiles();
                } else {
                    this.plugin.showIncorrectPasswordDialog(() => this.plugin.handlePasswordPrompt(async (password) => {
                        if (this.plugin.verifyPassword(password)) {
                            await this.plugin.hideAllConfiguredFiles();
                        }
                    }));
                }
            });
        });
    }

    createButton(container: HTMLElement, text: string, onClick: () => void) {
        const buttonWrapper = container.createDiv({ cls: 'button-wrapper' });
        buttonWrapper.style.display = 'flex';
        buttonWrapper.style.justifyContent = 'center';
        const button = buttonWrapper.createEl('button', { text });
        button.addEventListener('click', onClick);
        button.style.width = '100%';
        button.style.maxWidth = '400px';
        buttonWrapper.style.marginBottom = '10px';
    }

    onClose() {
        const { contentEl } = this;
        contentEl.empty();
    }
}
