import type { App, TFile } from 'obsidian';
import type { ButtonsPanelSettings } from './settings';

export type ResolveErrorKind = 'PATH_EMPTY' | 'NOT_FOUND' | 'IS_FOLDER' | 'WRONG_TYPE';

export type ResolveResult =
	| { kind: 'OK'; file: TFile }
	| { kind: 'PATH_EMPTY' }
	| { kind: 'NOT_FOUND'; detail: string }
	| { kind: 'IS_FOLDER'; detail: string }
	| { kind: 'WRONG_TYPE'; detail: string };

export function resolve(app: App, path: string): ResolveResult {
	const trimmed = (path ?? '').trim();
	if (!trimmed) return { kind: 'PATH_EMPTY' };

	const af = app.vault.getAbstractFileByPath(trimmed);
	if (!af) return { kind: 'NOT_FOUND', detail: trimmed };

	const ext = (af as { extension?: unknown }).extension;
	if (typeof ext !== 'string') return { kind: 'IS_FOLDER', detail: trimmed };
	if (ext !== 'md') return { kind: 'WRONG_TYPE', detail: trimmed };

	return { kind: 'OK', file: af as TFile };
}

export function followRename(
	settings: ButtonsPanelSettings,
	newPath: string,
	oldPath: string,
): boolean {
	if (settings.sourceNotePath === oldPath) {
		settings.sourceNotePath = newPath;
		return true;
	}
	return false;
}
