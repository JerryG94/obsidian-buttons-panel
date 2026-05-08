import type ButtonsPanelPlugin from '../main';
import { VIEW_TYPE_BUTTONS_PANEL, ButtonsPanelView } from './view';
import { t } from './i18n';

export function registerCommands(plugin: ButtonsPanelPlugin): void {
	plugin.addCommand({ id: 'open-left',  name: t('cmd.openLeft'),  callback: () => openIn(plugin, 'left') });
	plugin.addCommand({ id: 'open-right', name: t('cmd.openRight'), callback: () => openIn(plugin, 'right') });
	plugin.addCommand({ id: 'toggle',     name: t('cmd.toggle'),    callback: () => toggle(plugin) });
	plugin.addCommand({ id: 'focus',      name: t('cmd.focus'),     callback: () => focus(plugin) });
	plugin.addCommand({ id: 'refresh',    name: t('cmd.refresh'),   callback: () => refresh(plugin) });
}

function getLeaves(plugin: ButtonsPanelPlugin) {
	return plugin.app.workspace.getLeavesOfType(VIEW_TYPE_BUTTONS_PANEL);
}

async function openIn(plugin: ButtonsPanelPlugin, side: 'left' | 'right'): Promise<void> {
	const existing = getLeaves(plugin);
	for (const leaf of existing) {
		const root = leaf.getRoot();
		const onCorrectSide = side === 'left'
			? root === plugin.app.workspace.leftSplit
			: root === plugin.app.workspace.rightSplit;
		if (onCorrectSide) {
			plugin.app.workspace.revealLeaf(leaf);
			return;
		}
		leaf.detach();
	}
	const leaf = side === 'left'
		? plugin.app.workspace.getLeftLeaf(false)
		: plugin.app.workspace.getRightLeaf(false);
	if (!leaf) return;
	await leaf.setViewState({ type: VIEW_TYPE_BUTTONS_PANEL, active: true });
	plugin.app.workspace.revealLeaf(leaf);
}

async function toggle(plugin: ButtonsPanelPlugin): Promise<void> {
	const existing = getLeaves(plugin);
	if (existing.length === 0) {
		await openIn(plugin, plugin.settings.sidebar);
		return;
	}
	for (const leaf of existing) leaf.detach();
}

async function focus(plugin: ButtonsPanelPlugin): Promise<void> {
	const existing = getLeaves(plugin);
	if (existing.length === 0) {
		await openIn(plugin, plugin.settings.sidebar);
		return;
	}
	plugin.app.workspace.revealLeaf(existing[0]);
}

function refresh(plugin: ButtonsPanelPlugin): void {
	const leaves = getLeaves(plugin);
	if (leaves.length === 0) {
		console.debug('[buttons-panel] refresh ignored — panel not open');
		return;
	}
	for (const leaf of leaves) {
		const view = leaf.view;
		if (view instanceof ButtonsPanelView) void view.refresh();
	}
}
