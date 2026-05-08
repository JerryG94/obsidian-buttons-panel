export default {
	view: {
		title: '按钮面板',
	},
	cmd: {
		openLeft: '在左侧栏打开按钮面板',
		openRight: '在右侧栏打开按钮面板',
		toggle: '切换按钮面板',
		focus: '聚焦按钮面板',
		refresh: '刷新按钮面板',
	},
	settings: {
		sectionSource: '来源',
		sectionLayout: '布局',
		sectionDisplay: '显示过滤',
		sectionBehavior: '行为',
		sectionStatus: '状态',
		sectionActions: '操作',
		sourceNote: {
			label: '按钮源笔记路径',
			desc: '包含 Buttons 按钮定义的 Markdown 笔记路径。',
			placeholder: '00-系统/侧边栏快捷按钮.md',
		},
		sidebar: {
			label: '默认侧边栏',
			desc: '切换命令默认打开的侧边栏位置。',
			left: '左侧',
			right: '右侧',
		},
		layout: {
			buttonRowGap: '按钮行间距（px）',
			buttonColumnGap: '按钮列间距（px）',
			buttonGridColumns: '按钮目标列数',
			buttonWidth: '按钮固定宽度（px）',
		},
		display: {
			hideViewHeader: '隐藏视图标题栏',
			hideFrontmatter: '隐藏 frontmatter',
			hideInlineTitle: '隐藏内联标题',
			hideHeadings: '隐藏标题（H1–H6）',
			hideParagraphs: '隐藏不含按钮的段落',
			hideHr: '隐藏分隔线',
		},
		behavior: {
			autoRefresh: '源笔记变化时自动刷新',
			openOnStartup: '启动时打开面板',
		},
		status: {
			buttonsPluginPresent: 'Buttons 插件：已检测到',
			buttonsPluginMissing: 'Buttons 插件：未检测到',
		},
		actions: {
			openPanel: '打开面板',
			refreshPanel: '刷新面板',
			resetDefaults: '重置默认设置',
		},
	},
	error: {
		PATH_EMPTY: '请在插件设置中指定按钮源笔记路径。',
		NOT_FOUND: '未找到笔记：{detail}',
		IS_FOLDER: '路径必须指向 Markdown 文件，而不是文件夹：{detail}',
		WRONG_TYPE: '仅支持 .md 文件：{detail}',
		BUTTONS_PLUGIN_MISSING: '未检测到 Buttons 插件，按钮可能无法正常渲染。请安装并启用 Buttons 插件。',
		NO_MAIN_MARKDOWN_VIEW: '请先在主编辑区打开一个 Markdown 文件 —— Buttons Panel 的按钮命令作用于主区当前文件。',
		actionOpenSettings: '打开设置',
		actionRetry: '重试',
		actionOpenCommunityPlugins: '打开社区插件',
	},
	misc: {
		untitled: '未命名',
	},
} as const;
