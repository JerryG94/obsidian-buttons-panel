import type { ButtonsPanelSettings } from './settings';

export function applyStyleVars(rootEl: HTMLElement, settings: ButtonsPanelSettings): void {
	const s = rootEl.style;
	s.setProperty('--bp-panel-padding', `${settings.layout.panelPadding}px`);
	s.setProperty('--bp-content-gap', `${settings.layout.contentGap}px`);
	s.setProperty('--bp-button-grid-columns', `${settings.layout.buttonGridColumns}`);
	s.setProperty('--bp-max-panel-height', `${settings.maxPanelHeight}px`);
}

export function applyDisplayFilterClasses(rootEl: HTMLElement, settings: ButtonsPanelSettings): void {
	const cls = rootEl.classList;
	cls.toggle('bp-hide-view-header', settings.display.hideViewHeader);
	cls.toggle('bp-hide-frontmatter', settings.display.hideFrontmatter);
	cls.toggle('bp-hide-inline-title', settings.display.hideInlineTitle);
	cls.toggle('bp-hide-headings', settings.display.hideHeadings);
	cls.toggle('bp-hide-paragraphs', settings.display.hideParagraphs);
	cls.toggle('bp-hide-hr', settings.display.hideHr);
	cls.toggle('bp-aggressive-compression', settings.aggressiveLeafCompression);
	cls.toggle('bp-compact-mode', settings.layout.compactMode);
	cls.toggle('bp-hide-overflow', settings.layout.hideOverflow);
}
