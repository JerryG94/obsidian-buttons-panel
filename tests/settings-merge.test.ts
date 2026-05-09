import { describe, expect, it } from 'vitest';
import { mergeDefaults, normalizeSettings, DEFAULT_SETTINGS } from '../src/settings';

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
		const out = mergeDefaults(DEFAULT_SETTINGS, { layout: { buttonRowGap: 20 } } as any);
		expect(out.layout.buttonRowGap).toBe(20);
		expect(out.layout.buttonGridColumns).toBe(DEFAULT_SETTINGS.layout.buttonGridColumns);
		expect(out.layout.buttonColumnGap).toBe(DEFAULT_SETTINGS.layout.buttonColumnGap);
		expect(out.layout.buttonWidth).toBe(DEFAULT_SETTINGS.layout.buttonWidth);
	});

	it('preserves explicit `false` for boolean fields', () => {
		const out = mergeDefaults(DEFAULT_SETTINGS, { autoRefresh: false });
		expect(out.autoRefresh).toBe(false);
	});

	it('preserves explicit `0` for number fields', () => {
		const out = mergeDefaults(DEFAULT_SETTINGS, { layout: { buttonWidth: 0 } } as any);
		expect(out.layout.buttonWidth).toBe(0);
	});

	it('normalizes invalid button height while preserving automatic button width', () => {
		const out = normalizeSettings(mergeDefaults(DEFAULT_SETTINGS, {
			layout: {
				buttonHeight: 0,
				buttonWidth: 0,
			},
		} as any));
		expect(out.layout.buttonHeight).toBe(DEFAULT_SETTINGS.layout.buttonHeight);
		expect(out.layout.buttonWidth).toBe(0);
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
		mergeDefaults(DEFAULT_SETTINGS, { sourceNotePath: 'a.md', layout: { buttonRowGap: 99 } } as any);
		expect(JSON.stringify(DEFAULT_SETTINGS)).toBe(before);
	});
});
