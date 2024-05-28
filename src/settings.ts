import { App, Modal, Notice, PluginSettingTab, Setting } from 'obsidian';
import Peekaboo from './main';
import { hashPassword } from './utils';
import { updateRibbonIcon } from './ribbon';
import { applyHiddenFolders } from './hider';

export interface PeekabooSettings {
    passwordHash: string;
    configuredHiddenFolders: string[];
    currentHiddenFolders: string[];
    hideRibbonIcon: boolean; 
    configuredExceptionFiles: string[];
    currentExceptionFiles: string[];
}

export const DEFAULT_SETTINGS: PeekabooSettings = {
    passwordHash: '',
    configuredHiddenFolders: [],
    currentHiddenFolders: [],
    hideRibbonIcon: false,
    configuredExceptionFiles: [],
    currentExceptionFiles: [],
}

export async function loadSettings(plugin: Peekaboo): Promise<PeekabooSettings> {
    return Object.assign({}, DEFAULT_SETTINGS, await plugin.loadData());
}

export async function saveSettings(plugin: Peekaboo) {
    await plugin.saveData(plugin.settings);
}

export class PeekabooSettingTab extends PluginSettingTab {
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
                        updateRibbonIcon(this.plugin);
                    });
            });

        new Setting(containerEl)
            .setName('Tips:')
            .setDesc("1. About 'Configured Exception Files': For example, when you want to show a note within a hidden folder...");

        containerEl.createEl('div', { cls: 'peekaboo-tips' })
            .createEl('p', { text: "2. Enhance Security with 'Excluded Files': To prevent hidden files from appearing in Search, Graph View, etc., configure 'Excluded files' under Options > Files and Links > Excluded files." });

    }
}

// dialog box prompting to set a password first
export class SetPasswordPromptModal extends Modal {
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
            placeholder: 'Enter folders or files to hide, one per line',
            cls: 'peekaboo-textarea'
        });
        textArea.value = this.plugin.settings.configuredHiddenFolders.join('\n');

        const buttonContainer = contentEl.createDiv({ cls: 'peekaboo-single-line-button-container' });
        buttonContainer.createEl('button', { text: 'Save' }).addEventListener('click', async () => {
            const newHiddenFolders = textArea.value.split('\n').map(item => item.trim()).filter(item => item);
            this.plugin.settings.configuredHiddenFolders = newHiddenFolders;
            this.plugin.settings.currentHiddenFolders = newHiddenFolders;
            this.plugin.settings.currentExceptionFiles = [...this.plugin.settings.configuredExceptionFiles]
            await saveSettings(this.plugin);
            applyHiddenFolders(this.plugin);
            updateRibbonIcon(this.plugin);
            this.close();
        });
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
            placeholder: 'Enter folders or files to exclude, one per line',
            cls: 'peekaboo-textarea'
        });
        textArea.value = this.plugin.settings.configuredExceptionFiles.join('\n');

        const buttonContainer = contentEl.createDiv({ cls: 'peekaboo-single-line-button-container' });
        buttonContainer.createEl('button', { text: 'Save' }).addEventListener('click', async () => {
            const newExceptionFiles = textArea.value.split('\n').map(item => item.trim()).filter(item => item);
            this.plugin.settings.configuredExceptionFiles = newExceptionFiles;
            this.plugin.settings.currentExceptionFiles = newExceptionFiles;
            await saveSettings(this.plugin);
            applyHiddenFolders(this.plugin);
            updateRibbonIcon(this.plugin);
            this.close();
        });
    }

    onClose() {
        const { contentEl } = this;
        contentEl.empty();
    }
}
