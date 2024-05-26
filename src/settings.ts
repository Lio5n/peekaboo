import { Plugin } from 'obsidian';
import Peekaboo from './main';

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
