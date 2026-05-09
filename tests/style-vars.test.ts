import { describe, expect, it } from 'vitest';
import { applyStyleVars, computeHostHeight, computeLayoutMetrics } from '../src/style-vars';
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
				panelPadding: 16,
				panelHeight: 0,
				buttonHeight: 48,
				buttonRowGap: 14,
				buttonColumnGap: 10,
				buttonWidth: 120,
			},
		});

		expect(props.get('--bp-panel-padding')).toBe('16px');
		expect(props.get('--bp-effective-panel-padding')).toBe('16px');
		expect(props.get('--bp-fixed-panel-height')).toBe('142px');
		expect(props.get('--bp-button-height')).toBe('48px');
		expect(props.get('--bp-button-row-gap')).toBe('14px');
		expect(props.get('--bp-button-column-gap')).toBe('10px');
		expect(props.get('--bp-button-width')).toBe('120px');
		expect(props.get('--bp-button-grid-template-columns')).toBe('repeat(4, 120px)');
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
		expect(props.get('--bp-button-grid-template-columns')).toBe('repeat(auto-fit, minmax(var(--bp-button-min-width), 1fr))');
	});

	it('derives automatic panel height from padding, button height, row count, and row gap', () => {
		const metrics = computeLayoutMetrics({
			...DEFAULT_SETTINGS,
			layout: {
				...DEFAULT_SETTINGS.layout,
				panelHeight: 0,
				panelPadding: 20,
				buttonHeight: 50,
				buttonRowGap: 12,
				buttonGridColumns: 4,
			},
		}, 8);

		expect(metrics.buttonRows).toBe(2);
		expect(metrics.buttonBlockHeight).toBe(112);
		expect(metrics.panelHeight).toBe(152);
		expect(metrics.effectivePanelPadding).toBe(20);
	});

	it('distributes extra manual panel height evenly above and below the button block', () => {
		const metrics = computeLayoutMetrics({
			...DEFAULT_SETTINGS,
			layout: {
				...DEFAULT_SETTINGS.layout,
				panelHeight: 180,
				panelPadding: 14,
				buttonHeight: 48,
				buttonRowGap: 10,
				buttonGridColumns: 4,
			},
		}, 8);

		expect(metrics.buttonRows).toBe(2);
		expect(metrics.buttonBlockHeight).toBe(106);
		expect(metrics.panelHeight).toBe(180);
		expect(metrics.effectivePanelPadding).toBe(37);
	});

	it('treats zero button height as the default height so saved bad values cannot clip buttons', () => {
		const metrics = computeLayoutMetrics({
			...DEFAULT_SETTINGS,
			layout: {
				...DEFAULT_SETTINGS.layout,
				panelHeight: 145,
				panelPadding: 0,
				buttonHeight: 0,
				buttonRowGap: 15,
				buttonGridColumns: 4,
			},
		}, 8);

		expect(metrics.buttonRows).toBe(2);
		expect(metrics.buttonHeight).toBe(DEFAULT_SETTINGS.layout.buttonHeight);
		expect(metrics.buttonBlockHeight).toBe(111);
		expect(metrics.panelHeight).toBe(145);
		expect(metrics.effectivePanelPadding).toBe(17);
	});

	it('adds Obsidian chrome height to the fixed host height', () => {
		expect(computeHostHeight(150, 42)).toBe(192);
		expect(computeHostHeight(150, 0)).toBe(150);
	});
});
