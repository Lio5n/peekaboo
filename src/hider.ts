import Peekaboo from "./main";
import { HideSpecifyFileModal } from "./modals";
import { updateRibbonIcon } from "./ribbon";

function generateSelectors(paths: string[]): string {
    return paths.map(path => {
        path = path.replace(/^\/|\/$/g, '');

        if (path.includes('*')) {
            if (path.length == 1) {
                return []
            } else if (!path.endsWith('*')) {
                return []
            } else {
                return [`.nav-file-title[data-path^="${path.replace(/.$/,'')}"]`]
            }
        } else {
            return [
                `.nav-folder-title[data-path="${path}"]`,
                `.nav-folder-title[data-path^="${path}/"]`,
                `.nav-file-title[data-path="${path}"]`,
                `.nav-file-title[data-path^="${path}."]`,
                `.nav-file-title[data-path^="${path}/"]`
            ]
        }
    }).flat().join(', ');
}

function notesSelectors(paths: string[]): string {
    return paths.map(path => {
        path = path.replace(/^\/|\/$/g, '');

        if (path.includes('*')) {
            if (path.length == 1) {
                return []
            } else if (!path.endsWith('*')) {
                return []
            } else {
                return [`.nav-file-title[data-path^="${path.replace(/.$/,'')}"]`]
            }
        } else {
            return [
                `.nav-file-title[data-path="${path}"]`,
                `.nav-file-title[data-path^="${path}."]`,
            ]
        }
    }).flat().join(', ');
}

export function applyHiddenFolders(plugin: Peekaboo) {
    if (plugin.settings.currentHiddenFolders.length === 0) {
        plugin.styleEl.textContent = '';
        return;
    }

    const hiddenSelectors = generateSelectors(plugin.settings.currentHiddenFolders);
    const exceptionSelectors = notesSelectors(plugin.settings.currentExceptionFiles);

    plugin.styleEl.textContent = hiddenSelectors ? `${hiddenSelectors} { display: none !important; } ${exceptionSelectors} { display: block !important; }` : '';

    const head = document.head;
    head.removeChild(plugin.styleEl);
    head.appendChild(plugin.styleEl);
}

export function updateExceptionFiles(plugin: Peekaboo, filePath: string) {
    if (!plugin.settings.currentExceptionFiles.includes(filePath)) {
        plugin.settings.currentExceptionFiles.push(filePath);
    }
    plugin.saveSettings();
    plugin.applyHiddenFolders();
}

export async function showAllConfiguredFiles(plugin: Peekaboo, ) {
    plugin.settings.currentHiddenFolders = [];
    plugin.settings.configuredExceptionFiles = [];
    await plugin.saveSettings();
    plugin.applyHiddenFolders();
}

export async function hideAllConfiguredFiles(plugin: Peekaboo, ) {
    plugin.settings.currentHiddenFolders = [...plugin.settings.configuredHiddenFolders];
    plugin.settings.currentExceptionFiles = [...plugin.settings.configuredExceptionFiles];
    await plugin.saveSettings();
    plugin.applyHiddenFolders();
}

export async function toggleConfiguredFoldersVisibility(plugin: Peekaboo) {
    if (plugin.settings.currentHiddenFolders.length > 0) {
        plugin.settings.currentHiddenFolders = [];
        plugin.settings.currentExceptionFiles = [];
    } else {
        plugin.settings.currentHiddenFolders = [...plugin.settings.configuredHiddenFolders];
        plugin.settings.currentExceptionFiles = [...plugin.settings.configuredExceptionFiles];
    }
    await plugin.saveSettings();
    plugin.applyHiddenFolders();
    updateRibbonIcon(plugin);
}

export function showSpecifiedFile(plugin: Peekaboo, filePath: string) {
    plugin.settings.currentHiddenFolders = plugin.settings.currentHiddenFolders.filter(path => path !== filePath);
    plugin.applyHiddenFolders();
}

export async function promptForFilePath(plugin: Peekaboo): Promise<string | null> {
    return new Promise((resolve) => {
        const modal = new HideSpecifyFileModal(plugin.app, resolve);
        modal.open();
    });
}