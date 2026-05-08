import type { Plugin } from 'obsidian';
import { runMigrations } from './migration';

export interface ButtonsPanelSettings {
	version: number;
	sourceNotePath: string;
	sidebar: 'left' | 'right';
	layout: {
		buttonRowGap: number;
		buttonColumnGap: number;
		buttonGridColumns: number;
		buttonWidth: number;
	};
	display: {
		hideViewHeader: boolean;
		hideFrontmatter: boolean;
		hideInlineTitle: boolean;
		hideHeadings: boolean;
		hideParagraphs: boolean;
		hideHr: boolean;
	};
	autoRefresh: boolean;
	openOnStartup: boolean;
}

export const DEFAULT_SETTINGS: ButtonsPanelSettings = {
	version: 1,
	sourceNotePath: '',
	sidebar: 'left',
	layout: {
		buttonRowGap: 10,
		buttonColumnGap: 10,
		buttonGridColumns: 4,
		buttonWidth: 0,
	},
	display: {
		hideViewHeader: true,
		hideFrontmatter: true,
		hideInlineTitle: true,
		hideHeadings: true,
		hideParagraphs: false,
		hideHr: false,
	},
	autoRefresh: true,
	openOnStartup: false,
};

export async function loadSettings(plugin: Plugin): Promise<ButtonsPanelSettings> {
	const raw = (await plugin.loadData()) ?? {};
	const migrated = runMigrations(raw);
	return mergeDefaults(DEFAULT_SETTINGS, migrated);
}

export async function saveSettings(plugin: Plugin & { settings: ButtonsPanelSettings }): Promise<void> {
	await plugin.saveData(plugin.settings);
}

export function mergeDefaults<T>(defaults: T, loaded: Partial<T>): T {
	const out: Record<string, unknown> = (Array.isArray(defaults) ? [] : { ...(defaults as object) }) as Record<string, unknown>;
	for (const key of Object.keys(loaded ?? {})) {
		const dv = (defaults as Record<string, unknown>)[key];
		const lv = (loaded as Record<string, unknown>)[key];
		if (lv === null || lv === undefined) continue;
		if (dv && typeof dv === 'object' && !Array.isArray(dv) && typeof lv === 'object' && !Array.isArray(lv)) {
			out[key] = mergeDefaults(dv as object, lv as object);
		} else {
			out[key] = lv;
		}
	}
	return out as T;
}
