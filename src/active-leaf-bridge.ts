import { App, Component, MarkdownView, Notice, WorkspaceLeaf } from 'obsidian';
import { t } from './i18n';

export class ActiveLeafBridge {
	private lastMainLeaf: WorkspaceLeaf | null = null;

	constructor(private readonly app: App, private readonly host: Component) {}

	attach(panelContentEl: HTMLElement): void {
		this.seedFromExistingLeaves();

		this.host.registerEvent(
			this.app.workspace.on('active-leaf-change', (leaf) => {
				if (leaf && this.isMainPaneMarkdownView(leaf)) {
					this.lastMainLeaf = leaf;
				}
			}),
		);

		const handler = (evt: MouseEvent) => this.onCaptureClick(evt);
		panelContentEl.addEventListener('click', handler, true);
		this.host.register(() => panelContentEl.removeEventListener('click', handler, true));
	}

	private seedFromExistingLeaves(): void {
		this.app.workspace.iterateAllLeaves((leaf) => {
			if (this.lastMainLeaf) return;
			if (this.isMainPaneMarkdownView(leaf)) this.lastMainLeaf = leaf;
		});
	}

	private isMainPaneMarkdownView(leaf: WorkspaceLeaf): boolean {
		return leaf.view instanceof MarkdownView && leaf.getRoot() === this.app.workspace.rootSplit;
	}

	private onCaptureClick(evt: MouseEvent): void {
		const leaf = this.lastMainLeaf;
		if (leaf && leaf.view instanceof MarkdownView && leaf.getRoot() === this.app.workspace.rootSplit) {
			this.app.workspace.setActiveLeaf(leaf, { focus: false });
			return;
		}
		new Notice(t('error.NO_MAIN_MARKDOWN_VIEW'));
		evt.stopImmediatePropagation();
		evt.preventDefault();
	}
}
