import { describe, expect, it } from 'vitest';
import { applyStyleVars } from '../src/style-vars';
import { DEFAULT_SETTINGS } from '../src/settings';

describe('applyStyleVars', () => {
	it('writes visible layout variables from layout settings', () => {
		const props = new Map<string, string>();
		const root = {
			style: {
				setProperty: (name: string, value: string) => props.set(name, value),
			},
		} as unknown as HTMLElement;

		applyStyleVars(root, {
			...DEFAULT_SETTINGS,
			layout: {
				...DEFAULT_SETTINGS.layout,
				buttonRowGap: 14,
				buttonColumnGap: 10,
				buttonWidth: 120,
			},
		});

		expect(props.get('--bp-button-row-gap')).toBe('14px');
		expect(props.get('--bp-button-column-gap')).toBe('10px');
		expect(props.get('--bp-button-width')).toBe('120px');
		expect(props.has('--bp-max-panel-height')).toBe(false);
	});

	it('uses automatic button width when fixed width is zero', () => {
		const props = new Map<string, string>();
		const root = {
			style: {
				setProperty: (name: string, value: string) => props.set(name, value),
			},
		} as unknown as HTMLElement;

		applyStyleVars(root, {
			...DEFAULT_SETTINGS,
			layout: {
				...DEFAULT_SETTINGS.layout,
				buttonWidth: 0,
			},
		});

		expect(props.get('--bp-button-width')).toBe('100%');
	});
});
