import { Plugin } from 'obsidian';
import { PeekabooSettings, loadSettings, saveSettings, PeekabooSettingTab } from './settings';
import { PasswordPromptModal, IncorrectPasswordModal } from './modals';
import { verifyPassword } from './utils';
import { RibbonCommandModal, updateRibbonIcon } from './ribbon';
import { registerCommands } from './commands';
import { applyHiddenFolders } from './hider';

export default class Peekaboo extends Plugin {
    settings: PeekabooSettings;
    styleEl: HTMLStyleElement;
    ribbonIconEl: HTMLElement | null;

    async onload() {
        console.log('Loading Peekaboo plugin');

        await this.loadSettings();

        this.addSettingTab(new PeekabooSettingTab(this.app, this));

        registerCommands(this);

        this.styleEl = document.createElement('style');
        document.head.appendChild(this.styleEl);
        this.applyHiddenFolders();

        /*
        if (!this.settings.hideRibbonIcon) {
            this.ribbonIconEl = this.addRibbonIcon('eye', 'Peekaboo', () => {
                new RibbonCommandModal(this.app, this).open();
            });
        }
        */

        updateRibbonIcon(this);
    }

    onunload() {
        document.head.removeChild(this.styleEl);
        if (this.ribbonIconEl) {
            this.ribbonIconEl.remove();
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

    verifyPassword(password: string): boolean {
        return verifyPassword(password, this.settings.passwordHash);
    }

}
