import { ItemView, WorkspaceLeaf } from 'obsidian';
import type ButtonsPanelPlugin from '../main';
import { Renderer } from './renderer';
import { resolve } from './path-resolver';
import { applyDisplayFilterClasses, applyHostStyleVars, applyStyleVars } from './style-vars';
import { debounce } from './debounce';
import { t } from './i18n';
import { ActiveLeafBridge } from './active-leaf-bridge';

export const VIEW_TYPE_BUTTONS_PANEL = 'buttons-panel-view';

export class ButtonsPanelView extends ItemView {
	private bannerEl!: HTMLElement;
	private errorEl!: HTMLElement;
	private renderedEl!: HTMLElement;
	private debugEl!: HTMLElement;
	private renderer!: Renderer;
	private bridge!: ActiveLeafBridge;
	private debouncedRefresh!: () => void;
	private layoutObserver: MutationObserver | null = null;

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
		// 关键：用 try/catch 包裹整个初始化，任何步骤抛错都把信息显示到 contentEl，
		// 永远不让面板沉默地空白。
		try {
			this.contentEl.addClass('buttons-panel-view');
			this.bannerEl = this.contentEl.createDiv({ cls: 'buttons-panel-banner' });
			this.errorEl = this.contentEl.createDiv({ cls: 'buttons-panel-error' });
			this.renderedEl = this.contentEl.createDiv({ cls: 'buttons-panel-rendered' });
			this.debugEl = this.contentEl.createDiv({ cls: 'buttons-panel-debug' });
			this.observeLayoutInputs();

			// 永远可见的诊断标记：证明 onOpen 已经执行；display 由 styles.css 控制
			// （默认隐藏，加 .bp-debug-on 可以显示）。即便隐藏，DOM 在审查器里也能看到。
			this.debugEl.setText(`[bp] onOpen ok @ ${new Date().toLocaleTimeString()}`);

			try {
				this.applySettingsToDom();
			} catch (e) {
				this.showFatal('applySettingsToDom', e);
			}

			try {
				this.bridge.attach(this.contentEl);
			} catch (e) {
				this.showFatal('bridge.attach', e);
			}

			await this.refresh();
		} catch (e) {
			// 兜底：onOpen 路径上任何意外都把堆栈写到 contentEl
			console.error('[buttons-panel] onOpen failed:', e);
			this.contentEl.empty();
			this.contentEl.addClass('buttons-panel-view');
			const card = this.contentEl.createDiv({ cls: 'buttons-panel-error-card' });
			card.createEl('p', { text: '[buttons-panel] onOpen 致命错误（请将此信息发给开发者）：' });
			card.createEl('pre', { text: e instanceof Error ? `${e.message}\n${e.stack ?? ''}` : String(e) });
		}
	}

	async onClose(): Promise<void> {
		this.layoutObserver?.disconnect();
		this.layoutObserver = null;
		this.renderer.dispose();
		/* listener teardown handled via host.register in bridge */
	}

	applySettingsToDom(): void {
		const buttonCount = this.countLayoutButtons();
		applyStyleVars(this.contentEl, this.plugin.settings, buttonCount);
		applyHostStyleVars(this.contentEl, this.plugin.settings, buttonCount);
		applyDisplayFilterClasses(this.contentEl, this.plugin.settings);
	}

	triggerDebouncedRefresh(): void {
		this.debouncedRefresh();
	}

	async refresh(): Promise<void> {
		const _caller = new Error().stack?.split('\n').slice(1, 4).join(' | ') ?? '?';
		console.log('[bp] refresh() called |', _caller);
		try {
			this.applySettingsToDom();

			const result = resolve(this.app, this.plugin.settings.sourceNotePath);

			if (result.kind !== 'OK') {
				console.log('[bp] refresh(): resolve non-OK kind=', result.kind, '→ clearing renderedEl');
				this.renderer.clearContent(this.renderedEl);
				this.renderer.clearBanner(this.bannerEl);
				this.renderer.renderError(
					this.errorEl,
					result.kind,
					'detail' in result ? result.detail : undefined,
					this.actionsForErrorKind(result.kind),
				);
				this.updateDebug(`resolve=${result.kind}`);
				return;
			}

			this.errorEl.empty();
			this.updateBanner();
			try {
				await this.renderer.renderMarkdown(this.renderedEl, result.file);
				this.bridge.primeLastMainLeaf();
				this.applySettingsToDom();
				this.updateDebug(`rendered ${result.file.path}`);
			} catch (e) {
				console.error('[buttons-panel] renderMarkdown failed:', e);
				this.renderedEl.empty();
				const card = this.renderedEl.createDiv({ cls: 'buttons-panel-error-card' });
				card.createEl('p', { text: '[buttons-panel] 渲染失败：' });
				card.createEl('pre', {
					text: e instanceof Error ? `${e.message}\n${e.stack ?? ''}` : String(e),
				});
				this.updateDebug(`render-error: ${e instanceof Error ? e.message : String(e)}`);
			}
		} catch (e) {
			// refresh 自身的兜底（resolve / applySettingsToDom 抛错也能显示）
			console.error('[buttons-panel] refresh failed:', e);
			this.showFatal('refresh', e);
		}
	}

	/** 把致命错误信息追加到 contentEl，永不让面板空白。 */
	private showFatal(stage: string, e: unknown): void {
		const card = this.contentEl.createDiv({ cls: 'buttons-panel-error-card' });
		card.createEl('p', { text: `[buttons-panel] 阶段「${stage}」抛错：` });
		card.createEl('pre', { text: e instanceof Error ? `${e.message}\n${e.stack ?? ''}` : String(e) });
	}

	private updateDebug(extra: string): void {
		if (this.debugEl) {
			this.debugEl.setText(`[bp] ${new Date().toLocaleTimeString()} | ${extra}`);
		}
	}

	private observeLayoutInputs(): void {
		this.layoutObserver?.disconnect();
		this.layoutObserver = new MutationObserver(() => this.applySettingsToDom());
		this.layoutObserver.observe(this.renderedEl, {
			attributes: true,
			childList: true,
			subtree: true,
		});
	}

	private countLayoutButtons(): number | undefined {
		if (!this.renderedEl) return undefined;
		const buttonEls = new Set<HTMLElement>();
		for (const el of Array.from(this.renderedEl.querySelectorAll('button, .button-default'))) {
			buttonEls.add(el as HTMLElement);
		}
		if (buttonEls.size > 0) return buttonEls.size;

		let inlineCodeCount = 0;
		for (const codeEl of Array.from(this.renderedEl.querySelectorAll('code'))) {
			const text = codeEl.textContent?.trim() ?? '';
			if (/^button-[\w-]+$/i.test(text)) inlineCodeCount++;
		}
		return inlineCodeCount > 0 ? inlineCodeCount : undefined;
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
