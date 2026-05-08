import { App, Component, MarkdownRenderer, TFile } from 'obsidian';
import { t } from './i18n';
import type { ResolveErrorKind } from './path-resolver';

const MAX_INLINE_BUTTON_RENDER_RETRIES = 3;
const INLINE_BUTTON_RETRY_DELAYS_MS = [500, 1500, 3000];
const INLINE_BUTTON_CODE_PATTERN = /^button-[\w-]+$/i;

interface ButtonsPluginWithInlineIndex {
	indexCount?: number;
}

export interface ErrorAction {
	label: string;
	onClick: () => void;
}

export class Renderer {
	private renderScope: Component | null = null;
	private mutationObserver: MutationObserver | null = null;
	private timeoutIds: number[] = [];
	private renderGeneration = 0;

	constructor(private readonly app: App, private readonly component: Component) {}

	dispose(): void {
		console.log('[bp] renderer.dispose() called, gen was', this.renderGeneration);
		this.renderGeneration++;
		this.cleanupRenderScope();
	}

	async renderMarkdown(containerEl: HTMLElement, file: TFile, retryCount = 0): Promise<void> {
		const generation = ++this.renderGeneration;
		console.log('[bp] renderMarkdown() gen=', generation, 'start file=', file.path, 'retry=', retryCount);

		const markdown = await this.app.vault.cachedRead(file);

		if (this.renderGeneration !== generation) return;

		// Independent Component scope: not attached to view lifecycle tree, preventing
		// view/parent unload from cascading to Buttons plugin's InlineButton children.
		const nextScope = new Component();
		nextScope.load();

		// Render directly into containerEl (which is always connected to the document).
		// Using an off-DOM staging element would cause MarkdownRenderChild's MutationObserver
		// to see isConnected=false when children are moved, triggering spurious unload() calls
		// that remove button elements and blank the panel.
		this.cleanupRenderScope();
		containerEl.empty();
		this.ensureButtonsInlineIndexReady();

		try {
			await MarkdownRenderer.render(
				this.app,
				markdown,
				containerEl,
				file.path,
				nextScope,
			);
		} catch (e) {
			nextScope.unload();
			throw e;
		}

		if (this.renderGeneration !== generation) {
			nextScope.unload();
			// Do NOT empty containerEl — a newer generation already owns it.
			return;
		}

		this.renderScope = nextScope;
		console.log('[bp] renderMarkdown() gen=', generation, 'render DONE, children=', containerEl.childElementCount);

		this.observeAsyncButtonSwap(containerEl, generation);
		this.scheduleRescue(containerEl, generation);
		this.scheduleInlineButtonRetry(containerEl, file, generation, retryCount);
	}

	private cleanupRenderScope(): void {
		this.mutationObserver?.disconnect();
		this.mutationObserver = null;
		for (const timeoutId of this.timeoutIds) window.clearTimeout(timeoutId);
		this.timeoutIds = [];
		this.renderScope?.unload();
		this.renderScope = null;
	}

	private setRenderTimeout(callback: () => void, delay: number): void {
		const timeoutId = window.setTimeout(() => {
			this.timeoutIds = this.timeoutIds.filter((id) => id !== timeoutId);
			callback();
		}, delay);
		this.timeoutIds.push(timeoutId);
	}

	private observeAsyncButtonSwap(containerEl: HTMLElement, generation: number): void {
		const observer = new MutationObserver(() => {
			if (this.renderGeneration !== generation) return;
			// 标记：异步按钮已替换。CSS 选择器 :has(button) 会自动启用 grid 布局，
			// 此处仅强制触发一次 reflow，规避某些主题下 :has() 不及时重计算。
			containerEl.setAttribute('data-bp-buttons-arrived', String(Date.now()));
		});
		this.mutationObserver = observer;
		observer.observe(containerEl, { childList: true, subtree: true });
		// 5 秒后停止观察，避免长生命周期泄漏。
		this.setRenderTimeout(() => {
			if (this.mutationObserver === observer) this.mutationObserver = null;
			observer.disconnect();
		}, 5000);
	}

	private scheduleRescue(containerEl: HTMLElement, generation: number): void {
		const captured = Array.from(containerEl.querySelectorAll('button')) as HTMLElement[];
		if (captured.length === 0) {
			// 还没有按钮（说明 Buttons 插件正异步处理中），延迟两次再扫描一次：
			// 200ms / 800ms / 1600ms 三段重试，覆盖 indexCount<2 的等待窗口。
			let attempts = 0;
			const tryRescan = () => {
				if (this.renderGeneration !== generation) return;
				attempts++;
				const found = Array.from(containerEl.querySelectorAll('button')) as HTMLElement[];
				if (found.length > 0) {
					this.rescueEscaped(containerEl, found, attempts * 400, generation);
					return;
				}
				if (attempts < 3) this.setRenderTimeout(tryRescan, attempts * 400 + 200);
			};
			this.setRenderTimeout(tryRescan, 200);
			return;
		}
		this.rescueEscaped(containerEl, captured, 300, generation);
	}

	private scheduleInlineButtonRetry(
		containerEl: HTMLElement,
		file: TFile,
		generation: number,
		retryCount: number,
	): void {
		if (retryCount >= MAX_INLINE_BUTTON_RENDER_RETRIES) return;

		const delay = INLINE_BUTTON_RETRY_DELAYS_MS[retryCount] ?? INLINE_BUTTON_RETRY_DELAYS_MS.at(-1) ?? 3000;
		this.setRenderTimeout(() => {
			if (this.renderGeneration !== generation) return;
			if (!this.hasStuckInlineButtonCodes(containerEl)) return;
			void this.renderMarkdown(containerEl, file, retryCount + 1);
		}, delay);
	}

	private hasStuckInlineButtonCodes(containerEl: HTMLElement): boolean {
		const stuckCodeEl = Array.from(containerEl.querySelectorAll('code')).some((codeEl) => {
			const text = codeEl.textContent?.trim() ?? '';
			return INLINE_BUTTON_CODE_PATTERN.test(text);
		});
		if (stuckCodeEl) return true;
		if (containerEl.querySelector('button')) return false;
		return /\bbutton-[\w-]+\b/i.test(containerEl.textContent ?? '');
	}

	private ensureButtonsInlineIndexReady(): void {
		// Buttons waits for a second index-complete event when indexCount is below 2.
		// Sidebar startup renders can happen after the first event but before any later
		// file event, leaving inline button codes stuck forever. Its store is already
		// initialized at this point, so allow the post processor to resolve immediately.
		// @ts-expect-error - app.plugins is an internal Obsidian API used for compatibility.
		const buttonsPlugin = this.app.plugins?.plugins?.buttons as ButtonsPluginWithInlineIndex | undefined;
		if (!buttonsPlugin || typeof buttonsPlugin.indexCount !== 'number') return;
		if (buttonsPlugin.indexCount >= 2) return;
		buttonsPlugin.indexCount = 2;
	}

	private rescueEscaped(containerEl: HTMLElement, captured: HTMLElement[], delay: number, generation: number): void {
		this.setRenderTimeout(() => {
			if (this.renderGeneration !== generation) return;
			const escaped = captured.filter((btn) => !containerEl.contains(btn));
			if (escaped.length === 0) return;
			const row = containerEl.createDiv({ cls: 'buttons-panel-rescue' });
			for (const btn of escaped) row.appendChild(btn);
		}, delay);
	}

	renderError(
		containerEl: HTMLElement,
		kind: ResolveErrorKind,
		detail: string | undefined,
		actions: ErrorAction[],
	): void {
		containerEl.empty();
		const card = containerEl.createDiv({ cls: 'buttons-panel-error-card' });
		card.createEl('p', { text: t(`error.${kind}`, detail !== undefined ? { detail } : undefined) });
		if (actions.length === 0) return;
		const actionRow = card.createDiv({ cls: 'buttons-panel-error-actions' });
		for (const action of actions) {
			const btn = actionRow.createEl('button', { text: action.label });
			btn.addEventListener('click', action.onClick);
		}
	}

	renderBanner(containerEl: HTMLElement, message: string, action?: ErrorAction): void {
		containerEl.empty();
		containerEl.createSpan({ text: message });
		if (action) {
			const btn = containerEl.createEl('button', { text: action.label, cls: 'buttons-panel-banner-action' });
			btn.addEventListener('click', action.onClick);
		}
	}

	clearBanner(containerEl: HTMLElement): void {
		containerEl.empty();
	}

	clearContent(containerEl: HTMLElement): void {
		this.cleanupRenderScope();
		containerEl.empty();
	}
}
