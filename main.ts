import { Plugin, TAbstractFile, TFile, WorkspaceLeaf } from 'obsidian';
import { ButtonsPanelView, VIEW_TYPE_BUTTONS_PANEL } from './src/view';
import {
	ButtonsPanelSettings,
	DEFAULT_SETTINGS,
	loadSettings,
	saveSettings,
} from './src/settings';
import { ButtonsPanelSettingTab } from './src/settings-tab';
import { registerCommands } from './src/commands';
import { ButtonsDetector } from './src/buttons-detector';
import { followRename } from './src/path-resolver';
import { initI18n } from './src/i18n';

export default class ButtonsPanelPlugin extends Plugin {
	settings!: ButtonsPanelSettings;
	detector!: ButtonsDetector;

	async onload(): Promise<void> {
		initI18n();
		this.settings = await loadSettings(this);
		this.detector = new ButtonsDetector(this.app);

		this.registerView(VIEW_TYPE_BUTTONS_PANEL, (leaf) => new ButtonsPanelView(leaf, this));
		this.addSettingTab(new ButtonsPanelSettingTab(this.app, this));
		registerCommands(this);

		this.registerEvent(this.app.vault.on('rename', (file, oldPath) => this.onRename(file, oldPath)));
		this.registerEvent(this.app.vault.on('modify', (file) => this.onModify(file)));
		this.registerEvent(this.app.vault.on('delete', (file) => this.onDelete(file)));
		this.registerEvent(this.app.workspace.on('layout-change', () => this.onLayoutChange()));

		this.app.workspace.onLayoutReady(() => {
			this.enforceSingleInstance();
			if (this.settings.openOnStartup) void this.commands_openConfigured();
		});
	}

	async onunload(): Promise<void> {
		// Obsidian detaches leaves automatically.
	}

	async saveSettings(): Promise<void> {
		await saveSettings(this);
		this.refreshAllViews();
	}

	refreshAllViews(): void {
		const _caller = new Error().stack?.split('\n').slice(1, 4).join(' | ') ?? '?';
		console.log('[bp] refreshAllViews() called |', _caller);
		for (const leaf of this.app.workspace.getLeavesOfType(VIEW_TYPE_BUTTONS_PANEL)) {
			const view = leaf.view;
			if (view instanceof ButtonsPanelView) void view.refresh();
		}
	}

	openSettingsTab(): void {
		// @ts-expect-error - private API
		this.app.setting.open();
		// @ts-expect-error - private API
		this.app.setting.openTabById('buttons-panel');
	}

	openCommunityPluginsTab(): void {
		// @ts-expect-error - private API
		this.app.setting.open();
		// @ts-expect-error - private API
		this.app.setting.openTabById('community-plugins');
	}

	async commands_openConfigured(): Promise<void> {
		const side = this.settings.sidebar;
		const leaves = this.app.workspace.getLeavesOfType(VIEW_TYPE_BUTTONS_PANEL);
		if (leaves.length > 0) {
			this.app.workspace.revealLeaf(leaves[0]);
			return;
		}
		const leaf = side === 'left'
			? this.app.workspace.getLeftLeaf(false)
			: this.app.workspace.getRightLeaf(false);
		if (!leaf) return;
		await leaf.setViewState({ type: VIEW_TYPE_BUTTONS_PANEL, active: true });
		this.app.workspace.revealLeaf(leaf);
	}

	private onRename(file: TAbstractFile, oldPath: string): void {
		if (followRename(this.settings, file.path, oldPath)) {
			void this.saveSettings();
		}
		this.scheduleRefreshIfMatches(file);
	}

	private onModify(file: TAbstractFile): void {
		if (!this.settings.autoRefresh) return;
		this.scheduleRefreshIfMatches(file);
	}

	private onDelete(file: TAbstractFile): void {
		this.scheduleRefreshIfMatches(file);
	}

	private onLayoutChange(): void {
		const changed = this.detector.refresh();
		console.log('[bp] onLayoutChange(): detector.refresh()=', changed);
		if (changed) this.refreshAllViews();
	}

	private scheduleRefreshIfMatches(file: TAbstractFile): void {
		if (!(file instanceof TFile)) return;
		if (file.path !== this.settings.sourceNotePath) return;
		for (const leaf of this.app.workspace.getLeavesOfType(VIEW_TYPE_BUTTONS_PANEL)) {
			const view = leaf.view;
			if (view instanceof ButtonsPanelView) view.triggerDebouncedRefresh();
		}
	}

	private enforceSingleInstance(): void {
		const leaves = this.app.workspace.getLeavesOfType(VIEW_TYPE_BUTTONS_PANEL);
		for (let i = 1; i < leaves.length; i++) leaves[i].detach();
	}
}
