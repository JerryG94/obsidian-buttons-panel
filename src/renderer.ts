import { App, Component, MarkdownRenderer, TFile } from 'obsidian';
import { t } from './i18n';
import type { ResolveErrorKind } from './path-resolver';

export interface ErrorAction {
	label: string;
	onClick: () => void;
}

export class Renderer {
	constructor(private readonly app: App, private readonly component: Component) {}

	async renderMarkdown(containerEl: HTMLElement, file: TFile): Promise<void> {
		containerEl.empty();
		const markdown = await this.app.vault.cachedRead(file);
		await MarkdownRenderer.render(this.app, markdown, containerEl, file.path, this.component);
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
}
