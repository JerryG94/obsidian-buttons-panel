export default {
	view: {
		title: 'Buttons Panel',
	},
	cmd: {
		openLeft: 'Open Buttons Panel in Left Sidebar',
		openRight: 'Open Buttons Panel in Right Sidebar',
		toggle: 'Toggle Buttons Panel',
		focus: 'Focus Buttons Panel',
		refresh: 'Refresh Buttons Panel',
	},
	settings: {
		sectionSource: 'Source',
		sectionLayout: 'Layout',
		sectionDisplay: 'Display filters',
		sectionBehavior: 'Behavior',
		sectionStatus: 'Status',
		sectionActions: 'Actions',
		sourceNote: {
			label: 'Source note path',
			desc: 'Path to the Markdown note that contains your Buttons definitions.',
			placeholder: '00-System/SidebarShortcuts.md',
		},
		sidebar: {
			label: 'Default sidebar',
			desc: 'Where the Toggle command opens the panel.',
			left: 'Left',
			right: 'Right',
		},
		layout: {
			panelPadding: 'Panel padding (px)',
			buttonRowGap: 'Button row gap (px)',
			buttonColumnGap: 'Button column gap (px)',
			buttonGridColumns: 'Target button columns',
			buttonWidth: 'Button fixed width (px)',
		},
		display: {
			hideViewHeader: 'Hide view header',
			hideFrontmatter: 'Hide frontmatter',
			hideInlineTitle: 'Hide inline title',
			hideHeadings: 'Hide headings (H1–H6)',
			hideParagraphs: 'Hide paragraphs without buttons',
			hideHr: 'Hide horizontal rules',
		},
		behavior: {
			autoRefresh: 'Auto-refresh on source changes',
			openOnStartup: 'Open panel on startup',
		},
		status: {
			buttonsPluginPresent: 'Buttons plugin: detected',
			buttonsPluginMissing: 'Buttons plugin: not detected',
		},
		actions: {
			openPanel: 'Open panel',
			refreshPanel: 'Refresh panel',
			resetDefaults: 'Reset to defaults',
		},
	},
	error: {
		PATH_EMPTY: 'Please specify a source note in plugin settings.',
		NOT_FOUND: 'Note not found: {detail}',
		IS_FOLDER: 'Path must point to a Markdown file, not a folder: {detail}',
		WRONG_TYPE: 'Only .md files are supported: {detail}',
		BUTTONS_PLUGIN_MISSING: 'Buttons plugin not detected. Buttons may not render. Please install and enable the Buttons plugin.',
		NO_MAIN_MARKDOWN_VIEW: 'Open a Markdown file in the main pane first — Buttons Panel commands act on the active main-pane file.',
		actionOpenSettings: 'Open settings',
		actionRetry: 'Retry',
		actionOpenCommunityPlugins: 'Open community plugins',
	},
	misc: {
		untitled: 'Untitled',
	},
} as const;
