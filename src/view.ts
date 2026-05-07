import { ItemView, WorkspaceLeaf } from 'obsidian';
import type ButtonsPanelPlugin from '../main';
import { Renderer } from './renderer';
import { resolve } from './path-resolver';
import { applyDisplayFilterClasses, applyStyleVars } from './style-vars';
import { debounce } from './debounce';
import { t } from './i18n';
import { ActiveLeafBridge } from './active-leaf-bridge';

export const VIEW_TYPE_BUTTONS_PANEL = 'buttons-panel-view';

export class ButtonsPanelView extends ItemView {
	private bannerEl!: HTMLElement;
	private errorEl!: HTMLElement;
	private renderedEl!: HTMLElement;
	private renderer!: Renderer;
	private bridge!: ActiveLeafBridge;
	private debouncedRefresh!: () => void;

	constructor(leaf: WorkspaceLeaf, private readonly plugin: ButtonsPanelPlugin) {
		super(leaf);
		this.renderer = new Renderer(plugin.app, this);
		this.bridge = new ActiveLeafBridge(plugin.app, this);
		this.debouncedRefresh = debounce(() => { void this.refresh(); }, 800);
	}

	getViewType(): string { return VIEW_TYPE_BUTTONS_PANEL; }
	getDisplayText(): string { return t('view.title'); }
	getIcon(): string { return 'mouse-pointer-click'; }

	async onOpen(): Promise<void> {
		this.contentEl.addClass('buttons-panel-view');
		this.bannerEl = this.contentEl.createDiv({ cls: 'buttons-panel-banner' });
		this.errorEl = this.contentEl.createDiv({ cls: 'buttons-panel-error' });
		this.renderedEl = this.contentEl.createDiv({ cls: 'buttons-panel-rendered markdown-preview-view' });
		this.applySettingsToDom();
		this.bridge.attach(this.contentEl);
		await this.refresh();
	}

	async onClose(): Promise<void> { /* listener teardown handled via host.register in bridge */ }

	applySettingsToDom(): void {
		applyStyleVars(this.contentEl, this.plugin.settings);
		applyDisplayFilterClasses(this.contentEl, this.plugin.settings);
	}

	triggerDebouncedRefresh(): void {
		this.debouncedRefresh();
	}

	async refresh(): Promise<void> {
		this.applySettingsToDom();

		const result = resolve(this.app, this.plugin.settings.sourceNotePath);
		if (result.kind !== 'OK') {
			this.renderedEl.empty();
			this.renderer.clearBanner(this.bannerEl);
			this.renderer.renderError(
				this.errorEl,
				result.kind,
				'detail' in result ? result.detail : undefined,
				this.actionsForErrorKind(result.kind),
			);
			return;
		}

		this.errorEl.empty();
		this.updateBanner();
		await this.renderer.renderMarkdown(this.renderedEl, result.file);
	}

	private updateBanner(): void {
		if (this.plugin.detector.isEnabled()) {
			this.renderer.clearBanner(this.bannerEl);
			return;
		}
		this.renderer.renderBanner(
			this.bannerEl,
			t('error.BUTTONS_PLUGIN_MISSING'),
			{
				label: t('error.actionOpenCommunityPlugins'),
				onClick: () => this.plugin.openCommunityPluginsTab(),
			},
		);
	}

	private actionsForErrorKind(kind: 'PATH_EMPTY' | 'NOT_FOUND' | 'IS_FOLDER' | 'WRONG_TYPE') {
		const open = { label: t('error.actionOpenSettings'), onClick: () => this.plugin.openSettingsTab() };
		const retry = { label: t('error.actionRetry'), onClick: () => { void this.refresh(); } };
		switch (kind) {
			case 'NOT_FOUND': return [open, retry];
			default: return [open];
		}
	}
}
