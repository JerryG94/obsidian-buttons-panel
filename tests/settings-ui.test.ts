import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

const settingsTab = readFileSync('src/settings-tab.ts', 'utf8');
const settings = readFileSync('src/settings.ts', 'utf8');
const en = readFileSync('src/i18n/en.ts', 'utf8');
const zh = readFileSync('src/i18n/zh.ts', 'utf8');

describe('settings ui surface', () => {
	it('does not expose ineffective compression and max-height settings', () => {
		for (const text of [settingsTab, settings, en, zh]) {
			expect(text).not.toContain('aggressiveLeafCompression');
			expect(text).not.toContain('maxPanelHeight');
		}
	});

	it('keeps only visible button layout controls in layout settings', () => {
		expect(settingsTab).toContain('settings.layout.panelPadding');
		expect(settingsTab).toContain('settings.layout.buttonRowGap');
		expect(settingsTab).toContain('settings.layout.buttonColumnGap');
		expect(settingsTab).toContain('settings.layout.buttonGridColumns');
		expect(settingsTab).toContain('settings.layout.buttonWidth');
		expect(settingsTab).not.toContain('settings.layout.hideOverflow');
	});
});
