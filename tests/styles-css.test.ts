import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

const css = readFileSync('src/styles/styles.css', 'utf8');

describe('buttons panel stylesheet', () => {
	it('uses high-priority button sizing rules inside the panel', () => {
		expect(css).toContain('width: var(--bp-button-width) !important;');
		expect(css).toContain('height: var(--bp-button-height) !important;');
		expect(css).toContain('min-height: var(--bp-button-height) !important;');
		expect(css).toContain('padding-top: 0 !important;');
		expect(css).toContain('padding-bottom: 0 !important;');
		expect(css).not.toContain('--bp-button-min-height');
		expect(css).not.toContain('--bp-button-min-width-setting');
	});

	it('does not force-compress outer Obsidian workspace containers', () => {
		expect(css).not.toContain('bp-aggressive-compression');
		expect(css).not.toContain('.workspace-split.mod-vertical:has(> .workspace-leaf .workspace-leaf-content[data-type="buttons-panel-view"])');
		expect(css).not.toContain('.workspace-leaf:has(.workspace-leaf-content[data-type="buttons-panel-view"])');
	});

	it('fixes the sidebar tab height only for the buttons panel view', () => {
		expect(css).toContain('--bp-fixed-panel-height: 160px;');
		expect(css).toContain('--bp-fixed-host-height: 200px;');
		expect(css).toContain('--bp-host-chrome-height: 40px;');
		expect(css).toContain('.workspace-split:is(.mod-left-split, .mod-right-split)');
		expect(css).toContain('.workspace-tabs:has(.workspace-leaf-content[data-type="buttons-panel-view"])');
		expect(css).toContain('flex: 0 0 var(--bp-fixed-host-height) !important;');
		expect(css).toContain('height: calc(100% - var(--bp-host-chrome-height)) !important;');
	});

	it('removes markdown preview spacer layers so the card hugs the button rows', () => {
		expect(css).toContain('.buttons-panel-view .buttons-panel-rendered .markdown-preview-section');
		expect(css).toContain('.buttons-panel-view .buttons-panel-rendered .markdown-preview-pusher');
		expect(css).toContain('display: none !important;');
		expect(css).toContain('padding-bottom: 0 !important;');
	});
});
