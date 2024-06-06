import { App, Modal, setIcon } from "obsidian";
import Peekaboo from "./main";
import { hideAllConfiguredFiles, promptForFilePath, showAllConfiguredFiles, showSpecifiedFile, toggleConfiguredFoldersVisibility, updateExceptionFiles } from "./hider";

// dialog box for ribbon button commands
export class RibbonCommandModal extends Modal {
    plugin: Peekaboo;

    constructor(app: App, plugin: Peekaboo) {
        super(app);
        this.plugin = plugin;
    }

    onOpen() {
        const { contentEl } = this;
        contentEl.addClass('peekaboo-ribbon-commands-container');
        contentEl.createEl('h2', { text: 'Peekaboo' });

        this.createButton(contentEl, 'Toggle configured files visibility', async () => {
            this.close();
            this.plugin.handlePasswordPrompt(async (password) => {
                if (this.plugin.verifyPassword(password)) {
                    await toggleConfiguredFoldersVisibility(this.plugin);
                } else {
                    this.plugin.showIncorrectPasswordDialog(() => this.plugin.handlePasswordPrompt(async (password) => {
                        if (this.plugin.verifyPassword(password)) {
                            await toggleConfiguredFoldersVisibility(this.plugin);
                        }
                    }));
                }
            });
        });

        this.createButton(contentEl, 'Show specified note', async () => {
            this.close();
            this.plugin.handlePasswordPrompt(async (password) => {
                if (this.plugin.verifyPassword(password)) {
                    const filePath = await promptForFilePath(this.plugin);
                    if (filePath) {
                        showSpecifiedFile(this.plugin, filePath);
                        updateExceptionFiles(this.plugin, filePath);
                    }
                } else {
                    this.plugin.showIncorrectPasswordDialog(() => this.plugin.handlePasswordPrompt(async (password) => {
                        if (this.plugin.verifyPassword(password)) {
                            const filePath = await promptForFilePath(this.plugin);
                            if (filePath) {
                                showSpecifiedFile(this.plugin, filePath);
                                updateExceptionFiles(this.plugin, filePath);
                            }
                        }
                    }));
                }
            });
        });

        this.createButton(contentEl, 'Show all configured files', async () => {
            this.close();
            this.plugin.handlePasswordPrompt(async (password) => {
                if (this.plugin.verifyPassword(password)) {
                    await showAllConfiguredFiles(this.plugin);
                } else {
                    this.plugin.showIncorrectPasswordDialog(() => this.plugin.handlePasswordPrompt(async (password) => {
                        if (this.plugin.verifyPassword(password)) {
                            await showAllConfiguredFiles(this.plugin);
                        }
                    }));
                }
            });
        });

        this.createButton(contentEl, 'Hide all configured files', async () => {
            this.close();
            this.plugin.handlePasswordPrompt(async (password) => {
                if (this.plugin.verifyPassword(password)) {
                    await hideAllConfiguredFiles(this.plugin);
                } else {
                    this.plugin.showIncorrectPasswordDialog(() => this.plugin.handlePasswordPrompt(async (password) => {
                        if (this.plugin.verifyPassword(password)) {
                            await hideAllConfiguredFiles(this.plugin);
                        }
                    }));
                }
            });
        });
    }

    createButton(container: HTMLElement, text: string, onClick: () => void) {
        const buttonWrapper = container.createDiv({ cls: 'peekaboo-ribbon-commands-button-container' });
        const button = buttonWrapper.createEl('button', { text });
        button.addEventListener('click', onClick);
        button.addClass('peekaboo-ribbon-commands-button');
    }

    onClose() {
        const { contentEl } = this;
        contentEl.empty();
    }
}

/*
export function updateRibbonIcon(plugin: Peekaboo) {
    if (plugin.settings.hideRibbonIcon) {
        if (plugin.ribbonIconEl) {
            plugin.ribbonIconEl.remove();
            plugin.ribbonIconEl = null;
        }
    } else {
        if (!plugin.ribbonIconEl) {
            plugin.ribbonIconEl = plugin.addRibbonIcon('eye', 'Peekaboo', () => {
                new RibbonCommandModal(plugin.app, plugin).open();
            });
        }

        if (plugin.settings.currentHiddenFolders.length > 0) {
            plugin.ribbonIconEl.setAttribute('aria-label', 'Peekaboo');
            setIcon(plugin.ribbonIconEl, 'eye-off')
        } else {
            plugin.ribbonIconEl.setAttribute('aria-label', 'Peekaboo');
            setIcon(plugin.ribbonIconEl, 'eye')
        }
    }
}
*/

export function updateRibbonIcon(plugin: Peekaboo) {
    if (!plugin.ribbonIconEl) {
        plugin.ribbonIconEl = plugin.addRibbonIcon('eye', 'Peekaboo', () => {
            new RibbonCommandModal(plugin.app, plugin).open();
        });
    }

    if (plugin.settings.currentHiddenFolders.length > 0) {
        plugin.ribbonIconEl.setAttribute('aria-label', 'Peekaboo');
        setIcon(plugin.ribbonIconEl, 'eye-off')
    } else {
        plugin.ribbonIconEl.setAttribute('aria-label', 'Peekaboo');
        setIcon(plugin.ribbonIconEl, 'eye')
    }
}
