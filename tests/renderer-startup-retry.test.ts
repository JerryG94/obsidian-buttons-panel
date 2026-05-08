import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const rendererSource = readFileSync('src/renderer.ts', 'utf8');
const viewSource = readFileSync('src/view.ts', 'utf8');
const bridgeSource = readFileSync('src/active-leaf-bridge.ts', 'utf8');

describe('renderer startup retry', () => {
	it('retries markdown rendering when inline button ids remain stuck after startup', () => {
		expect(rendererSource).toContain('MAX_INLINE_BUTTON_RENDER_RETRIES');
		expect(rendererSource).toContain('scheduleInlineButtonRetry');
		expect(rendererSource).toContain('hasStuckInlineButtonCodes');
		expect(rendererSource).toContain('button-');
	});

	it('nudges the Buttons plugin past its startup-only inline index gate before rendering', () => {
		expect(rendererSource).toContain('ensureButtonsInlineIndexReady');
		expect(rendererSource).toContain('indexCount');
		expect(rendererSource).toContain('buttonsPlugin.indexCount = 2');
	});

	it('primes the main markdown leaf after startup render so Buttons rebuilds its store without a manual click', () => {
		expect(bridgeSource).toContain('primeLastMainLeaf');
		expect(bridgeSource).toContain('setActiveLeaf(leaf, { focus: false })');
		expect(viewSource).toContain('this.bridge.primeLastMainLeaf()');
	});
});
