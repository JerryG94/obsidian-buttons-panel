import type { App } from 'obsidian';

const BUTTONS_PLUGIN_ID = 'buttons';

export class ButtonsDetector {
	private cached: boolean | null = null;
	constructor(private readonly app: App) {}

	isEnabled(): boolean {
		if (this.cached !== null) return this.cached;
		this.cached = this.detect();
		return this.cached;
	}

	refresh(): boolean {
		const before = this.cached;
		this.cached = this.detect();
		return before !== this.cached;
	}

	private detect(): boolean {
		// @ts-expect-error - app.plugins is internal API; widely used by community plugins.
		const plugins = this.app.plugins;
		const enabled = plugins?.enabledPlugins;
		if (enabled && typeof enabled.has === 'function') {
			return enabled.has(BUTTONS_PLUGIN_ID);
		}
		return false;
	}
}
