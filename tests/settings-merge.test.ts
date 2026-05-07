import { describe, expect, it } from 'vitest';
import { mergeDefaults, DEFAULT_SETTINGS } from '../src/settings';

describe('mergeDefaults', () => {
	it('returns defaults when loaded is empty', () => {
		const out = mergeDefaults(DEFAULT_SETTINGS, {});
		expect(out).toEqual(DEFAULT_SETTINGS);
		expect(out).not.toBe(DEFAULT_SETTINGS); // shallow copy at top level
	});

	it('overrides primitive values from loaded', () => {
		const out = mergeDefaults(DEFAULT_SETTINGS, { sourceNotePath: 'foo.md', sidebar: 'right' });
		expect(out.sourceNotePath).toBe('foo.md');
		expect(out.sidebar).toBe('right');
	});

	it('keeps default sub-tree when only one nested field is provided', () => {
		const out = mergeDefaults(DEFAULT_SETTINGS, { layout: { panelPadding: 20 } } as any);
		expect(out.layout.panelPadding).toBe(20);
		expect(out.layout.contentGap).toBe(DEFAULT_SETTINGS.layout.contentGap);
		expect(out.layout.buttonGridColumns).toBe(DEFAULT_SETTINGS.layout.buttonGridColumns);
	});

	it('preserves explicit `false` for boolean fields', () => {
		const out = mergeDefaults(DEFAULT_SETTINGS, { aggressiveLeafCompression: false });
		expect(out.aggressiveLeafCompression).toBe(false);
	});

	it('preserves explicit `0` for number fields', () => {
		const out = mergeDefaults(DEFAULT_SETTINGS, { maxPanelHeight: 0 });
		expect(out.maxPanelHeight).toBe(0);
	});

	// Regression guard: a corrupted user file with `null` where an object is expected
	// must NOT collapse the default sub-tree to `null` (would crash style-vars at render time).
	it('drops `null` overrides for object sub-trees and falls back to defaults', () => {
		const out = mergeDefaults(DEFAULT_SETTINGS, { layout: null as any, display: null as any });
		expect(out.layout).toEqual(DEFAULT_SETTINGS.layout);
		expect(out.display).toEqual(DEFAULT_SETTINGS.display);
	});

	it('does not mutate the defaults object', () => {
		const before = JSON.stringify(DEFAULT_SETTINGS);
		mergeDefaults(DEFAULT_SETTINGS, { sourceNotePath: 'a.md', layout: { panelPadding: 99 } } as any);
		expect(JSON.stringify(DEFAULT_SETTINGS)).toBe(before);
	});
});
