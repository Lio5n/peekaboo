import { App, Modal, Notice } from "obsidian";
import Peekaboo from "./main";
import { hideAllConfiguredFiles, promptForFilePath, showAllConfiguredFiles, showSpecifiedFile, toggleConfiguredFoldersVisibility, updateExceptionFiles } from "./hider";
import { updateRibbonIcon } from "./ribbon";

export function registerCommands(plugin: Peekaboo) {
    plugin.addCommand({
        id: 'toggle-configured-files-visibility',
        name: 'Toggle Configured Files Visibility',
        callback: () => {
            if (!plugin.settings.passwordHash) {
                new Notice('Please set a password first.');
                return;
            }

            const promptForPassword = async () => {
                plugin.handlePasswordPrompt(async (password) => {
                    if (await plugin.verifyPassword(password)) {
                        toggleConfiguredFoldersVisibility(plugin);
                        updateRibbonIcon(plugin);
                    } else {
                        plugin.showIncorrectPasswordDialog(promptForPassword);
                    }
                });
            };

            promptForPassword();
        }
    });

    plugin.addCommand({
        id: 'show-specified-file',
        name: 'Show Specified File',
        callback: () => {
            if (!plugin.settings.passwordHash) {
                new Notice('Please set a password first.');
                return;
            }

            const promptForPassword = async () => {
                plugin.handlePasswordPrompt(async (password) => {
                    if (await plugin.verifyPassword(password)) {
                        promptForFilePath(plugin, (filePath) => {
                            if (filePath) {
                                showSpecifiedFile(plugin, filePath);
                                updateRibbonIcon(plugin);
                            }
                        });
                    } else {
                        plugin.showIncorrectPasswordDialog(promptForPassword);
                    }
                });
            };

            promptForPassword();
        }
    });

    plugin.addCommand({
        id: 'show-all-configured-files',
        name: 'Show all configured files',
        callback: () => plugin.handlePasswordPrompt(async (password) => {
            if (await plugin.verifyPassword(password)) {
                await showAllConfiguredFiles(plugin);
                updateRibbonIcon(plugin);
            } else {
                plugin.showIncorrectPasswordDialog(() => plugin.handlePasswordPrompt(async (password) => {
                    if (await plugin.verifyPassword(password)) {
                        await showAllConfiguredFiles(plugin);
                        updateRibbonIcon(plugin);
                    }
                }));
            }
        })
    });

    plugin.addCommand({
        id: 'hide-all-configured-files',
        name: 'Hide all configured files',
        callback: () => plugin.handlePasswordPrompt(async (password) => {
            if (await plugin.verifyPassword(password)) {
                await hideAllConfiguredFiles(plugin);
                updateRibbonIcon(plugin);
            } else {
                plugin.showIncorrectPasswordDialog(() => plugin.handlePasswordPrompt(async (password) => {
                    if (await plugin.verifyPassword(password)) {
                        await hideAllConfiguredFiles(plugin);
                        updateRibbonIcon(plugin);
                    }
                }));
            }
        })
    });

    plugin.addCommand({
        id: 'create-folder',
        name: 'Create folder',
        callback: () => createFolder(),
    });
}

export class CreateFolderModal extends Modal {
    folderName: string;
    resolve: (value: string | null) => void;

    constructor(app: App) {
        super(app);
    }

    onOpen() {
        const { contentEl } = this;
        contentEl.createEl('h2', { text: 'Enter Folder Name' });

        const inputEl = contentEl.createEl('input', { type: 'text', cls: 'peekaboo-single-line-input-box' });
        inputEl.addEventListener('input', (e) => {
            this.folderName = (e.target as HTMLInputElement).value;
        });

        inputEl.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.resolve(this.folderName);
                this.close();
            }
        });

        const buttonContainer = contentEl.createDiv({ cls: 'peekaboo-single-line-button-container' });
        buttonContainer.createEl('button', { text: 'Create', cls: 'peekaboo-single-line-button' }).addEventListener('click', () => {
            this.resolve(this.folderName);
            this.close();
        });

        buttonContainer.createEl('button', { text: 'Cancel', cls: 'peekaboo-single-line-button' }).addEventListener('click', () => {
            this.resolve(null);
            this.close();
        });
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

async function createFolder() {
    const folderName = await new CreateFolderModal(this.app).open();
    if (folderName) {
        try {
            await this.app.vault.createFolder(folderName);
            new Notice(`Folder '${folderName}' created.`);
        } catch (error) {
            new Notice(`Failed to create folder '${folderName}': ${error.message}`);
        }
    }
}

