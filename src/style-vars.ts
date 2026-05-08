import type { ButtonsPanelSettings } from './settings';

export function applyStyleVars(rootEl: HTMLElement, settings: ButtonsPanelSettings): void {
	const s = rootEl.style;
	s.setProperty('--bp-button-row-gap', `${settings.layout.buttonRowGap}px`);
	s.setProperty('--bp-button-column-gap', `${settings.layout.buttonColumnGap}px`);
	s.setProperty('--bp-button-grid-columns', `${settings.layout.buttonGridColumns}`);
	s.setProperty('--bp-button-width', settings.layout.buttonWidth > 0 ? `${settings.layout.buttonWidth}px` : '100%');
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
