import { AbstractInputSuggest, App, Notice, PluginSettingTab, Setting, TFile } from 'obsidian';
import type ButtonsPanelPlugin from '../main';
import { DEFAULT_SETTINGS } from './settings';
import { t } from './i18n';

class MarkdownFileSuggest extends AbstractInputSuggest<TFile> {
	constructor(app: App, private readonly inputEl: HTMLInputElement) {
		super(app, inputEl);
	}
	getSuggestions(query: string): TFile[] {
		const lower = query.toLowerCase();
		return this.app.vault.getMarkdownFiles()
			.filter((f) => f.path.toLowerCase().includes(lower))
			.slice(0, 50);
	}
	renderSuggestion(file: TFile, el: HTMLElement): void {
		el.setText(file.path);
	}
	selectSuggestion(file: TFile): void {
		this.inputEl.value = file.path;
		this.inputEl.trigger('input');
		this.close();
	}
}

export class ButtonsPanelSettingTab extends PluginSettingTab {
	constructor(app: App, private readonly plugin: ButtonsPanelPlugin) {
		super(app, plugin);
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		this.section('settings.sectionSource');
		this.sourceNoteSetting();
		this.sidebarSetting();

		this.section('settings.sectionLayout');
		this.numberSubSetting(['layout', 'buttonRowGap'], 'settings.layout.buttonRowGap', 0, 64);
		this.numberSubSetting(['layout', 'buttonColumnGap'], 'settings.layout.buttonColumnGap', 0, 64);
		this.numberSubSetting(['layout', 'buttonGridColumns'], 'settings.layout.buttonGridColumns', 1, 12);
		this.numberSubSetting(['layout', 'buttonWidth'], 'settings.layout.buttonWidth', 0, 400);

		this.section('settings.sectionDisplay');
		this.toggleSubSetting(['display', 'hideViewHeader'], 'settings.display.hideViewHeader');
		this.toggleSubSetting(['display', 'hideFrontmatter'], 'settings.display.hideFrontmatter');
		this.toggleSubSetting(['display', 'hideInlineTitle'], 'settings.display.hideInlineTitle');
		this.toggleSubSetting(['display', 'hideHeadings'], 'settings.display.hideHeadings');
		this.toggleSubSetting(['display', 'hideParagraphs'], 'settings.display.hideParagraphs');
		this.toggleSubSetting(['display', 'hideHr'], 'settings.display.hideHr');

		this.section('settings.sectionBehavior');
		this.toggleSetting('autoRefresh', 'settings.behavior.autoRefresh');
		this.toggleSetting('openOnStartup', 'settings.behavior.openOnStartup');

		this.section('settings.sectionStatus');
		const detected = this.plugin.detector.isEnabled();
		new Setting(containerEl).setName(detected
			? t('settings.status.buttonsPluginPresent')
			: t('settings.status.buttonsPluginMissing'));

		this.section('settings.sectionActions');
		new Setting(containerEl).addButton((b) => b.setButtonText(t('settings.actions.openPanel')).onClick(() => this.plugin.commands_openConfigured()));
		new Setting(containerEl).addButton((b) => b.setButtonText(t('settings.actions.refreshPanel')).onClick(() => this.plugin.refreshAllViews()));
		new Setting(containerEl).addButton((b) => b.setButtonText(t('settings.actions.resetDefaults')).setWarning().onClick(async () => {
			this.plugin.settings = structuredClone(DEFAULT_SETTINGS);
			await this.plugin.saveSettings();
			new Notice('Buttons Panel: settings reset.');
			this.display();
		}));
	}

	private section(key: string): void {
		this.containerEl.createEl('h3', { text: t(key) });
	}

	private sourceNoteSetting(): void {
		new Setting(this.containerEl)
			.setName(t('settings.sourceNote.label'))
			.setDesc(t('settings.sourceNote.desc'))
			.addText((text) => {
				text.setPlaceholder(t('settings.sourceNote.placeholder'))
					.setValue(this.plugin.settings.sourceNotePath)
					.onChange(async (v) => {
						this.plugin.settings.sourceNotePath = v;
						await this.plugin.saveSettings();
					});
				new MarkdownFileSuggest(this.app, text.inputEl);
			});
	}

	private sidebarSetting(): void {
		new Setting(this.containerEl)
			.setName(t('settings.sidebar.label'))
			.setDesc(t('settings.sidebar.desc'))
			.addDropdown((dd) => dd
				.addOption('left', t('settings.sidebar.left'))
				.addOption('right', t('settings.sidebar.right'))
				.setValue(this.plugin.settings.sidebar)
				.onChange(async (v) => {
					this.plugin.settings.sidebar = v as 'left' | 'right';
					await this.plugin.saveSettings();
				}));
	}

	private toggleSetting<K extends 'autoRefresh' | 'openOnStartup'>(
		key: K, labelKey: string,
	): void {
		new Setting(this.containerEl)
			.setName(t(`${labelKey}.label`))
			.setDesc(this.descIfExists(`${labelKey}.desc`))
			.addToggle((tog) => tog
				.setValue(this.plugin.settings[key] as boolean)
				.onChange(async (v) => {
					(this.plugin.settings[key] as boolean) = v;
					await this.plugin.saveSettings();
				}));
	}

	private toggleSubSetting(path: ['display', string], labelKey: string): void {
		const [group, k] = path;
		new Setting(this.containerEl)
			.setName(t(labelKey))
			.addToggle((tog) => tog
				.setValue(((this.plugin.settings[group] as Record<string, unknown>)[k]) as boolean)
				.onChange(async (v) => {
					(this.plugin.settings[group] as Record<string, unknown>)[k] = v;
					await this.plugin.saveSettings();
				}));
	}

	private numberSubSetting(path: ['layout', string], labelKey: string, min: number, max: number): void {
		const [group, k] = path;
		new Setting(this.containerEl)
			.setName(t(labelKey))
			.addText((text) => text
				.setValue(String((this.plugin.settings[group] as Record<string, unknown>)[k]))
				.onChange(async (v) => {
					const n = clamp(parseInt(v, 10) || 0, min, max);
					(this.plugin.settings[group] as Record<string, unknown>)[k] = n;
					await this.plugin.saveSettings();
				}));
	}

	private descIfExists(key: string): string {
		const v = t(key);
		return v === key ? '' : v;
	}
}

function clamp(n: number, min: number, max: number): number {
	return Math.max(min, Math.min(max, n));
}
