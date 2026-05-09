import { DEFAULT_SETTINGS, type ButtonsPanelSettings } from './settings';

const FALLBACK_BUTTON_ROWS = 2;
const FALLBACK_HOST_CHROME_HEIGHT = 40;

export interface LayoutMetrics {
	buttonRows: number;
	buttonHeight: number;
	buttonBlockHeight: number;
	panelHeight: number;
	effectivePanelPadding: number;
}

export function computeLayoutMetrics(settings: ButtonsPanelSettings, buttonCount?: number): LayoutMetrics {
	const columns = Math.max(1, settings.layout.buttonGridColumns);
	const panelPadding = Math.max(0, settings.layout.panelPadding);
	const buttonHeight = settings.layout.buttonHeight > 0
		? settings.layout.buttonHeight
		: DEFAULT_SETTINGS.layout.buttonHeight;
	const buttonRowGap = Math.max(0, settings.layout.buttonRowGap);
	const count = Math.max(columns * FALLBACK_BUTTON_ROWS, buttonCount ?? 0);
	const buttonRows = Math.max(1, Math.ceil(count / columns));
	const buttonBlockHeight = buttonRows * buttonHeight
		+ Math.max(0, buttonRows - 1) * buttonRowGap;
	const minimumPanelHeight = buttonBlockHeight + panelPadding * 2;
	const panelHeight = settings.layout.panelHeight > 0
		? Math.max(settings.layout.panelHeight, minimumPanelHeight)
		: minimumPanelHeight;
	const effectivePanelPadding = Math.max(
		panelPadding,
		(panelHeight - buttonBlockHeight) / 2,
	);

	return {
		buttonRows,
		buttonHeight,
		buttonBlockHeight,
		panelHeight,
		effectivePanelPadding,
	};
}

export function computeHostHeight(panelHeight: number, chromeHeight: number): number {
	return panelHeight + Math.max(0, chromeHeight);
}

export function applyStyleVars(rootEl: HTMLElement, settings: ButtonsPanelSettings, buttonCount?: number): void {
	const metrics = computeLayoutMetrics(settings, buttonCount);
	const s = rootEl.style;
	s.setProperty('--bp-panel-padding', `${settings.layout.panelPadding}px`);
	s.setProperty('--bp-effective-panel-padding', `${metrics.effectivePanelPadding}px`);
	s.setProperty('--bp-fixed-panel-height', `${metrics.panelHeight}px`);
	s.setProperty('--bp-button-height', `${metrics.buttonHeight}px`);
	s.setProperty('--bp-button-row-gap', `${settings.layout.buttonRowGap}px`);
	s.setProperty('--bp-button-column-gap', `${settings.layout.buttonColumnGap}px`);
	s.setProperty('--bp-button-grid-columns', `${settings.layout.buttonGridColumns}`);
	s.setProperty('--bp-button-rows', `${metrics.buttonRows}`);
	s.setProperty('--bp-button-width', settings.layout.buttonWidth > 0 ? `${settings.layout.buttonWidth}px` : '100%');
	s.setProperty(
		'--bp-button-grid-template-columns',
		settings.layout.buttonWidth > 0
			? `repeat(${settings.layout.buttonGridColumns}, ${settings.layout.buttonWidth}px)`
			: 'repeat(auto-fit, minmax(var(--bp-button-min-width), 1fr))',
	);
}

export function applyHostStyleVars(rootEl: HTMLElement, settings: ButtonsPanelSettings, buttonCount?: number): void {
	const host = rootEl.closest('.workspace-tabs') as HTMLElement | null;
	if (!host) return;
	const metrics = computeLayoutMetrics(settings, buttonCount);
	const chromeHeight = getHostChromeHeight(host);
	host.style.setProperty('--bp-fixed-panel-height', `${metrics.panelHeight}px`);
	host.style.setProperty('--bp-host-chrome-height', `${chromeHeight}px`);
	host.style.setProperty('--bp-fixed-host-height', `${computeHostHeight(metrics.panelHeight, chromeHeight)}px`);
}

function getHostChromeHeight(host: HTMLElement): number {
	const tabHeader = host.querySelector(
		':scope > .workspace-tab-header-container, :scope .workspace-tab-header-container, :scope .workspace-leaf-header',
	) as HTMLElement | null;
	return tabHeader?.offsetHeight || FALLBACK_HOST_CHROME_HEIGHT;
}

export function applyDisplayFilterClasses(rootEl: HTMLElement, settings: ButtonsPanelSettings): void {
	const cls = rootEl.classList;
	cls.toggle('bp-hide-view-header', settings.display.hideViewHeader);
	cls.toggle('bp-hide-frontmatter', settings.display.hideFrontmatter);
	cls.toggle('bp-hide-inline-title', settings.display.hideInlineTitle);
	cls.toggle('bp-hide-headings', settings.display.hideHeadings);
	cls.toggle('bp-hide-paragraphs', settings.display.hideParagraphs);
	cls.toggle('bp-hide-hr', settings.display.hideHr);
}
