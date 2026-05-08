import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

const css = readFileSync('src/styles/styles.css', 'utf8');

describe('buttons panel stylesheet', () => {
	it('uses high-priority button sizing rules inside the panel', () => {
		expect(css).toContain('width: var(--bp-button-width) !important;');
		expect(css).not.toContain('--bp-button-height');
		expect(css).not.toContain('--bp-button-min-height');
		expect(css).not.toContain('--bp-button-min-width-setting');
	});

	it('does not force-compress outer Obsidian workspace containers', () => {
		expect(css).not.toContain('bp-aggressive-compression');
		expect(css).not.toContain('.workspace-split.mod-vertical:has(> .workspace-leaf .workspace-leaf-content[data-type="buttons-panel-view"])');
		expect(css).not.toContain('.workspace-leaf:has(.workspace-leaf-content[data-type="buttons-panel-view"])');
	});

	it('removes markdown preview spacer layers so the card hugs the button rows', () => {
		expect(css).toContain('.buttons-panel-view .buttons-panel-rendered .markdown-preview-section');
		expect(css).toContain('.buttons-panel-view .buttons-panel-rendered .markdown-preview-pusher');
		expect(css).toContain('display: none !important;');
		expect(css).toContain('padding-bottom: 0 !important;');
	});
});
