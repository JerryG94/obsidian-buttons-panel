import { ItemView, MarkdownRenderer, MarkdownView, Notice, Plugin, TFile, WorkspaceLeaf } from 'obsidian';

const SPIKE_VIEW = 'spike-view';
const SPIKE_NOTE_PATH = '00-系统文档/00-HomePage/侧边按钮.md';

class SpikeView extends ItemView {
	private lastMainLeaf: WorkspaceLeaf | null = null;

	getViewType() { return SPIKE_VIEW; }
	getDisplayText() { return 'Spike'; }
	getIcon() { return 'flask-conical'; }

	async onOpen() {
		this.seedLastMainLeaf();
		this.registerEvent(this.app.workspace.on('active-leaf-change', (leaf) => {
			if (leaf && leaf.view instanceof MarkdownView && this.isInMainPane(leaf)) {
				this.lastMainLeaf = leaf;
			}
		}));

		const file = this.app.vault.getAbstractFileByPath(SPIKE_NOTE_PATH);
		if (!(file instanceof TFile)) {
			this.contentEl.setText(`Spike: file not found at ${SPIKE_NOTE_PATH}`);
			return;
		}
		const md = await this.app.vault.cachedRead(file);
		this.contentEl.empty();
		await MarkdownRenderer.render(this.app, md, this.contentEl, file.path, this);

		this.contentEl.addEventListener('click', (e) => {
			const target = e.target as HTMLElement | null;
			if (!target || !target.closest('button')) return;
			if (this.lastMainLeaf && this.lastMainLeaf.view instanceof MarkdownView) {
				this.app.workspace.setActiveLeaf(this.lastMainLeaf, { focus: false });
			} else {
				new Notice('请先在主编辑区打开一个 markdown 文件');
				e.stopImmediatePropagation();
				e.preventDefault();
			}
		}, true);
	}

	private seedLastMainLeaf() {
		this.app.workspace.iterateAllLeaves((leaf) => {
			if (leaf.view instanceof MarkdownView && this.isInMainPane(leaf)) {
				this.lastMainLeaf = leaf;
			}
		});
	}

	private isInMainPane(leaf: WorkspaceLeaf): boolean {
		const root = (leaf as unknown as { getRoot: () => unknown }).getRoot();
		return root === (this.app.workspace as unknown as { rootSplit: unknown }).rootSplit;
	}
}

export default class ButtonsPanelSpikePlugin extends Plugin {
	async onload() {
		this.registerView(SPIKE_VIEW, (leaf: WorkspaceLeaf) => new SpikeView(leaf));
		this.addCommand({
			id: 'open-spike',
			name: 'Open Buttons Panel Spike',
			callback: async () => {
				const leaf = this.app.workspace.getLeftLeaf(false);
				if (leaf) await leaf.setViewState({ type: SPIKE_VIEW, active: true });
			},
		});
	}
	async onunload() {
		this.app.workspace.detachLeavesOfType(SPIKE_VIEW);
	}
}
