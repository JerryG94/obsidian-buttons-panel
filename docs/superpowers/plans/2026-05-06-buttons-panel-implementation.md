# Buttons Panel 实施计划

> **执行者须知：** 必选子技能 — 用 superpowers:subagent-driven-development（推荐）或 superpowers:executing-plans 按任务逐条实施。所有步骤使用复选框（`- [ ]`）语法跟踪进度。

**目标：** 交付 Buttons Panel v0.1.0 — 一款 Obsidian 桌面插件，把用户指定的 Markdown 笔记装进侧边栏的紧凑、样式隔离自定义视图，让现有 Buttons 社区插件继续负责按钮的渲染和动作。

**架构：** 一个围绕 `MarkdownRenderer.render()` 构建的薄壳宿主插件。`main.ts` 串起生命周期、设置、命令以及全局 vault/workspace 事件。`ButtonsPanelView`（继承 `ItemView`）持有三块 DOM 区域（banner / error / rendered），把渲染交给 `Renderer`，把错误/路径分类交给 `path-resolver`，把 Buttons 插件检测交给 `ButtonsDetector`。CSS 全部限定在 `.buttons-panel-view` 与基于 `:has()` 的外层 leaf 收缩选择器下。设置带 version 字段并预留迁移骨架。i18n 用一份内置的 en/zh 词典，由 `localStorage['language']` 驱动。

**技术栈：** TypeScript 5.4+、esbuild、Obsidian 1.5+ API、Vitest（单元测试，node 环境）。MIT 协议。GitHub Actions 在打 tag 时发布。仓库：`JerryG94/obsidian-buttons-panel`。

**上游设计：** `docs/superpowers/specs/2026-05-06-buttons-panel-design.md`（v1.0）。原始 PRD：`Buttons_Panel_PRD.md`。设计文档为权威来源 —— 下面所有默认值、标识符、错误 key、CSS 选择器都按设计文档原样照搬。

---

## 里程碑

- **M0 — 仓库初始化。** 把 GitHub 空仓变成可编译的本地骨架（manifest、package.json、tsconfig、esbuild、gitignore、MIT、vitest、GitHub Actions release workflow 占位、英文+中文 README 雏形）。结束态：`npm run build` 通过，`npm test` 在零测试下绿色退出。
- **M1 — Stage 0 spike。** 一次性分支 `experiments/spike-stage-0`。硬编码 `ItemView` + `MarkdownRenderer.render()` 跑一个 fixture 笔记。验证设计文档 §11.3 的三项通过/失败判据（按钮渲染 / 命令可点击 / inline block-id 引用）。决策：走主路线，还是按设计文档 §11.4 Plan B 退路。spike **不合并** 到主分支。
- **M2 — MVP 实现。** 用 TDD 先写 12 个生产模块及其单元测试，再在 `main.ts` 串起来。结束态：设计文档 §3.1 的所有 P0 项（#1–#16）都已实现，§14.2 全部 L1 单元测试绿色。
- **M3 — 测试与验收。** 跑完设计文档 §14.4 的 30 项 L3 手动验收清单，修复出现的失败项，在不同主题/语言下交叉验证。
- **M4 — 首次发布。** 打 tag `0.1.0`，GitHub Actions 自动构建并起草 GitHub Release（资产含 `main.js` + `manifest.json` + `styles.css`），把 draft 提升为 published。可选：按设计文档 §18.2 起一份提交到 `obsidianmd/obsidian-releases` 的 PR。

每个里程碑内部，**只要可单测就走 TDD**：先写失败测试 → 写最小实现 → 测试通过 → commit。所引用的文件路径全部对齐设计文档 §5.2。

---

# M0 — 仓库初始化

唯一目标：把一个干净、可编译的骨架推到 GitHub `main`，**先不写插件逻辑**。本里程碑全部直接 commit 到 `main`（项目处于初始化阶段）。

### Task M0.1：初始化本地仓库并连上 GitHub 远端

**文件：**
- 新建：`.gitignore`
- 新建：`LICENSE`
- 新建：`README.md`
- 新建：`README.zh.md`

- [ ] **Step 1：在项目根 `d:\Documents\Agent_Studio\ButtonsPanel` 初始化 git**

```bash
git init -b main
git remote add origin https://github.com/JerryG94/obsidian-buttons-panel.git
```

预期：`git remote -v` 能看到 `origin` 指向上述 GitHub URL。

- [ ] **Step 2：写 `.gitignore`**（与设计文档 §15.7 对齐）

```
node_modules/
main.js
styles.css
data.json
*.local.*
.env.local
.DS_Store
.vscode/
coverage/
dist/
```

- [ ] **Step 3：写 `LICENSE`** —— 标准 MIT 文本，版权 `2026 JerryG`，使用 SPDX 规范的原文。

- [ ] **Step 4：写 `README.md` 雏形**（参考设计文档 §15.8）

```markdown
# Buttons Panel

> Render a compact Buttons-powered Markdown panel in the Obsidian sidebar.

[中文](./README.zh.md)

## What it does
Buttons Panel is a desktop-only Obsidian plugin that hosts a user-specified Markdown note inside a compact, style-isolated sidebar view. It does not parse button syntax — it relies on the existing community [Buttons](https://github.com/shabegom/buttons) plugin to render and execute buttons.

## How it works
The plugin registers a custom `ItemView` and feeds the source note through `MarkdownRenderer.render()`, which lets the Buttons plugin's Markdown post processor pick up button code blocks and inline references just as it does in normal preview.

## Requirements
- Obsidian 1.5.0+
- Buttons plugin enabled (recommended)

## Install
- Community Plugins: search "Buttons Panel" (after community store accepts)
- Manual: download `main.js`, `manifest.json`, `styles.css` from the latest GitHub release into `<vault>/.obsidian/plugins/buttons-panel/`

## Quick start
1. Create a Markdown note with Buttons-style buttons
2. Set its path in plugin settings
3. Run "Toggle Buttons Panel" from the command palette

## Settings
See [docs/design.md](./docs/design.md) for the full schema.

## Known limitations
- Desktop only (mobile is on the v0.3 roadmap)
- Buttons whose action depends on the "current note" (`append`, `replace`, `prepend`, `swap`, `template`) may behave unexpectedly inside the sidebar view; prefer `command` / `link` / `URI` / QuickAdd / Templater / Obsidian Git buttons in v0.1.

## License
MIT
```

- [ ] **Step 5：写 `README.zh.md`** —— 同结构的中文镜像。术语对齐设计文档 §1.1（按钮源笔记、容器/宿主插件等）。

- [ ] **Step 6：commit**

```bash
git add .gitignore LICENSE README.md README.zh.md
git commit -m "chore: initialize repo with license and readme skeletons"
git push -u origin main
```

预期：GitHub 仓库 `main` 上能看到这四个文件。

---

### Task M0.2：添加 Obsidian 插件 manifest 与 version 文件

**文件：**
- 新建：`manifest.json`
- 新建：`versions.json`
- 新建：`version-bump.mjs`

- [ ] **Step 1：写 `manifest.json`**（设计文档 §4.1、§15）

```json
{
	"id": "buttons-panel",
	"name": "Buttons Panel",
	"version": "0.1.0",
	"minAppVersion": "1.5.0",
	"description": "Render a compact Buttons-powered Markdown panel in the Obsidian sidebar.",
	"author": "JerryG",
	"authorUrl": "https://github.com/JerryG94",
	"isDesktopOnly": true
}
```

- [ ] **Step 2：写 `versions.json`**

```json
{
	"0.1.0": "1.5.0"
}
```

- [ ] **Step 3：写 `version-bump.mjs`** —— 与设计文档 §15.5 一字不差。

- [ ] **Step 4：commit**

```bash
git add manifest.json versions.json version-bump.mjs
git commit -m "chore: add plugin manifest, versions.json, version-bump script"
```

---

### Task M0.3：添加 TypeScript / esbuild / package 配置

**文件：**
- 新建：`package.json`
- 新建：`tsconfig.json`
- 新建：`esbuild.config.mjs`
- 新建：`vitest.config.ts`
- 新建：`.editorconfig`

- [ ] **Step 1：写 `package.json`**

```json
{
	"name": "obsidian-buttons-panel",
	"version": "0.1.0",
	"description": "Render a compact Buttons-powered Markdown panel in the Obsidian sidebar.",
	"main": "main.js",
	"type": "module",
	"scripts": {
		"dev": "node esbuild.config.mjs",
		"build": "tsc -noEmit -skipLibCheck && node esbuild.config.mjs production",
		"version": "node version-bump.mjs && git add manifest.json versions.json",
		"test": "vitest run",
		"test:watch": "vitest"
	},
	"keywords": ["obsidian", "obsidian-plugin", "buttons", "sidebar"],
	"author": "JerryG",
	"license": "MIT",
	"devDependencies": {
		"@types/node": "^20.0.0",
		"builtin-modules": "^4.0.0",
		"esbuild": "^0.20.0",
		"obsidian": "^1.5.0",
		"tslib": "^2.6.0",
		"typescript": "^5.4.0",
		"vitest": "^1.4.0"
	}
}
```

- [ ] **Step 2：写 `tsconfig.json`**

```json
{
	"compilerOptions": {
		"baseUrl": ".",
		"inlineSourceMap": true,
		"inlineSources": true,
		"module": "ESNext",
		"target": "ES2020",
		"allowJs": true,
		"noImplicitAny": true,
		"moduleResolution": "Bundler",
		"importHelpers": true,
		"isolatedModules": true,
		"strictNullChecks": true,
		"strict": true,
		"esModuleInterop": true,
		"resolveJsonModule": true,
		"skipLibCheck": true,
		"types": ["node"],
		"lib": ["DOM", "ES2020"]
	},
	"include": ["main.ts", "src/**/*.ts", "tests/**/*.ts"]
}
```

- [ ] **Step 3：写 `esbuild.config.mjs`** —— 与设计文档 §15.3 一字不差。

- [ ] **Step 4：写 `vitest.config.ts`**（设计文档 §14.3）

```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
	test: {
		globals: true,
		environment: 'node',
		include: ['tests/**/*.test.ts'],
	},
});
```

- [ ] **Step 5：写 `.editorconfig`**

```
root = true

[*]
charset = utf-8
end_of_line = lf
indent_style = tab
indent_size = 4
insert_final_newline = true
trim_trailing_whitespace = true

[*.{json,yml,yaml,md}]
indent_style = space
indent_size = 2
```

- [ ] **Step 6：安装依赖、验证构建链**

```bash
npm install
```

预期：`node_modules/` 落地，无报错。

- [ ] **Step 7：写一个最小占位 `main.ts`，让 build 能跑通**

`main.ts`：

```ts
import { Plugin } from 'obsidian';

export default class ButtonsPanelPlugin extends Plugin {
	async onload() {
		// 占位实现，真实逻辑在 M2 写。
	}
}
```

`src/styles/styles.css` 写一行注释占位（让 css 复制步骤有输入）：

```css
/* Buttons Panel — styles assembled in M2. */
```

- [ ] **Step 8：跑 build**

```bash
npm run build
```

预期：tsc 通过，esbuild 在仓库根产出 `main.js` 和 `styles.css`（已被 gitignore）。

- [ ] **Step 9：跑测试**

```bash
npm test
```

预期：vitest 报告 `No test files found` 并以 0 退出（或 vitest 自带 `passWithNoTests` 行为）。如果 vitest 在没有测试时直接报错，把 `test` 脚本改成 `vitest run --passWithNoTests`，确认后再 commit。

- [ ] **Step 10：commit**

```bash
git add package.json tsconfig.json esbuild.config.mjs vitest.config.ts .editorconfig main.ts src/styles/styles.css
git commit -m "chore: add typescript, esbuild, vitest config and placeholder entry"
```

---

### Task M0.4：添加 GitHub Actions release workflow 占位

**文件：**
- 新建：`.github/workflows/release.yml`

- [ ] **Step 1：写 `release.yml`** —— 与设计文档 §15.6 一字不差。

- [ ] **Step 2：commit & push**

```bash
git add .github/workflows/release.yml
git commit -m "ci: add release workflow that drafts a github release on tag push"
git push origin main
```

预期：之后推 `0.1.0` 这种 tag 时会触发该 workflow（现在不打 tag）。

---

### Task M0.5：把设计文档与 PRD 复制进仓库 `docs/`

**文件：**
- 新建：`docs/design.md`
- 新建：`docs/prd.md`

- [ ] **Step 1：复制** `docs/superpowers/specs/2026-05-06-buttons-panel-design.md` 到 `docs/design.md`；复制 `Buttons_Panel_PRD.md` 到 `docs/prd.md`。原文件保留在原位（superpowers 工作目录默认入库；如果团队偏好不入库，本任务结束时和用户确认是否把 `docs/superpowers/` 加进 `.gitignore`）。

- [ ] **Step 2：决定** 是否把 `docs/superpowers/` 工作目录入库。默认入库，方便未来的 plan 与代码同行。**先和用户确认再加 .gitignore。**

- [ ] **Step 3：commit**

```bash
git add docs/design.md docs/prd.md
git commit -m "docs: include design spec and prd in repo"
git push origin main
```

**M0 退出条件：**
- GitHub 上的仓库已包含 manifest、license、双语 readme、带 build/test 脚本的 package.json、esbuild + tsc + vitest 配置、release workflow。
- 本地 `npm run build` 与 `npm test` 都成功。
- 还没有任何插件业务逻辑。

---

# M1 — Stage 0 spike

目标：用一次性分支验证设计文档 §11.3 的三项通过/失败判据。**spike 期间不要碰 `main`** 上 M0 之外的内容。

### Task M1.1：建 spike 分支

- [ ] **Step 1：从 `main` 切分支**

```bash
git checkout -b experiments/spike-stage-0
```

- [ ] **Step 2：gitignore 例外** —— 不需要（spike 产物全部留在本地）。

---

### Task M1.2：写一次性 spike 代码

**文件：**
- 修改（仅 spike 分支）：`main.ts`

- [ ] **Step 1：把 `main.ts` 改为硬编码 spike**（基于设计文档 §11.2）

```ts
import { ItemView, MarkdownRenderer, Plugin, TFile, WorkspaceLeaf } from 'obsidian';

const SPIKE_VIEW = 'spike-view';
const SPIKE_NOTE_PATH = 'TestButtons.md';

class SpikeView extends ItemView {
	getViewType() { return SPIKE_VIEW; }
	getDisplayText() { return 'Spike'; }
	getIcon() { return 'flask-conical'; }

	async onOpen() {
		const file = this.app.vault.getAbstractFileByPath(SPIKE_NOTE_PATH);
		if (!(file instanceof TFile)) {
			this.contentEl.setText(`Spike: file not found at ${SPIKE_NOTE_PATH}`);
			return;
		}
		const md = await this.app.vault.cachedRead(file);
		this.contentEl.empty();
		await MarkdownRenderer.render(this.app, md, this.contentEl, file.path, this);
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
```

- [ ] **Step 2：构建 spike**

```bash
npm run build
```

预期：`main.js`、`styles.css` 产出。

---

### Task M1.3：把 spike 装进真实 vault

- [ ] **Step 1：选一个测试 vault** —— 已经装好并启用 Buttons 社区插件的 vault，记下路径作为 `OUTDIR`。

- [ ] **Step 2：建插件目录**

```bash
mkdir -p "<vault>/.obsidian/plugins/buttons-panel"
```

- [ ] **Step 3：把 `manifest.json`、`main.js`、`styles.css`** 从仓库根复制到 vault 插件目录。先不软链 —— 这次要的是干净快照。

- [ ] **Step 4：在 vault 根建 `TestButtons.md`**，内容严格按设计文档 §11.2：

````markdown
```button
name 测试
type command
action Open today's daily note
```
^button-test

`button-test`
````

- [ ] **Step 5：在 Obsidian 内** —— 设置 → 第三方插件 → 启用 "Buttons Panel"（其实是 spike），命令面板执行 "Open Buttons Panel Spike"。

---

### Task M1.4：跑 Stage 0 三项验收

- [ ] **判据 #1 —— 按钮渲染。** spike view 里能看到一个写着 `测试` 的可点击按钮。如果显示成 ` ```button ` 代码块字面量则失败。**通过 / 失败。**

- [ ] **判据 #2 —— 命令可点击。** 点 `测试` 按钮，Obsidian 真的打开了今日 daily note（或在已配置 Daily Notes 的情况下提示创建）。**通过 / 失败。**

- [ ] **判据 #3 —— inline block-id 引用。** 末尾那行 `` `button-test` `` 渲染为同一个按钮的副本，而非 inline code。**通过 / 失败。**

- [ ] **Step 4：判定走向**
  - **三项全过：** 按设计文档原样推进 M2。
  - **#1 失败：** 启用设计文档 §11.4 Plan B（用 `MarkdownView` 嵌入而非自定义 `ItemView`）。**先把偏离写进 `docs/design.md` 附录、并据此调整 M2 任务**，再开始实现。停下来通知用户。
  - **#2 失败：** 简短调研 Buttons 插件源码（≤30min）。如无公开 API，v0.1 以 README 加注 "面板内按钮可能不可点击" 的限制发布，并更新设计文档 §16.2。
  - **#3 失败：** 在 README 写明 v0.1 不支持面板内 inline `` `button-id` `` 引用，其他不变继续 M2。

---

### Task M1.5：归档 spike

- [ ] **Step 1：在 spike 分支 commit**

```bash
git add main.ts
git commit -m "spike: stage 0 verification — markdownrenderer + itemview + buttons plugin"
git push -u origin experiments/spike-stage-0
```

- [ ] **Step 2：写报告** `docs/spike-stage-0-report.md`（在 spike 分支上）：
  - 日期
  - Obsidian 版本、Buttons 插件版本、操作系统
  - #1 / #2 / #3 各自结果
  - 任何意外（如 post-processor 触发时机、`Component` 生命周期是否泄漏等）
  - 决策：直接 M2 / Plan B

```bash
git add docs/spike-stage-0-report.md
git commit -m "spike: stage 0 acceptance report"
git push origin experiments/spike-stage-0
```

- [ ] **Step 3：切回 `main`，spike 分支不合并**

```bash
git checkout main
```

`experiments/spike-stage-0` 分支留在 GitHub 作为证据，永不合并。

**M1 退出条件：**
- spike 分支已推到 GitHub。
- 三项判据已执行，结果记录在该分支的 `docs/spike-stage-0-report.md`。
- 决策已写入报告：直接进 M2 / Plan B。

---

# M2 — MVP 实现

全部在从 `main` 切出的功能分支上进行：

```bash
git checkout main
git pull
git checkout -b feat/v0.1.0-mvp
```

实施顺序自下而上：先写带单测的纯函数，再写碰 DOM 的模块，最后在 `main.ts` 串起来。**只要文件可单测，就走 TDD。**

### Task M2.1：i18n —— 英文词典

**文件：**
- 新建：`src/i18n/en.ts`

- [ ] **Step 1：写完整的英文词典 `src/i18n/en.ts`**

key 命名按设计文档 §10.2，命令名按 §4.3，错误 key 按 §12，设置标签按 §8：

```ts
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
		aggressiveLeafCompression: {
			label: 'Aggressive leaf compression',
			desc: 'Use :has() to shrink the outer Leaf to fit content. Disable if your theme conflicts.',
		},
		maxPanelHeight: {
			label: 'Max panel height (px)',
			desc: '0 = unlimited (panel sizes to content). When set, overflowing content scrolls.',
		},
		layout: {
			panelPadding: 'Panel padding (px)',
			contentGap: 'Content gap (px)',
			buttonGridColumns: 'Target button columns',
			compactMode: 'Compact mode',
			hideOverflow: 'Hide overflow',
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
		actionOpenSettings: 'Open settings',
		actionRetry: 'Retry',
		actionOpenCommunityPlugins: 'Open community plugins',
	},
	misc: {
		untitled: 'Untitled',
	},
} as const;
```

- [ ] **Step 2：commit**

```bash
git add src/i18n/en.ts
git commit -m "feat(i18n): add english dictionary"
```

---

### Task M2.2：i18n —— 中文词典

**文件：**
- 新建：`src/i18n/zh.ts`

- [ ] **Step 1：写 `src/i18n/zh.ts`** —— 嵌套结构与 en.ts 严格一致（key 集合相同），译文用简体中文，术语对齐设计文档 §1.1、§4.3、§12

```ts
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
		aggressiveLeafCompression: {
			label: '强力压缩外层 Leaf',
			desc: '使用 :has() 把外层 Leaf 收缩到内容高度。若与主题冲突可关闭。',
		},
		maxPanelHeight: {
			label: '面板最大高度（px）',
			desc: '0 = 不限制（高度跟随内容）。设为正值时，超出内容会滚动。',
		},
		layout: {
			panelPadding: '面板内边距（px）',
			contentGap: '内容间距（px）',
			buttonGridColumns: '按钮目标列数',
			compactMode: '紧凑模式',
			hideOverflow: '隐藏溢出',
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
		actionOpenSettings: '打开设置',
		actionRetry: '重试',
		actionOpenCommunityPlugins: '打开社区插件',
	},
	misc: {
		untitled: '未命名',
	},
} as const;
```

- [ ] **Step 2：commit**

```bash
git add src/i18n/zh.ts
git commit -m "feat(i18n): add chinese dictionary"
```

---

### Task M2.3：i18n —— 运行时 + key 漂移测试

**文件：**
- 新建：`tests/i18n.test.ts`
- 新建：`src/i18n/index.ts`

- [ ] **Step 1：写失败测试**（`tests/i18n.test.ts`）

```ts
import { describe, expect, it, beforeEach } from 'vitest';
import en from '../src/i18n/en';
import zh from '../src/i18n/zh';
import * as i18n from '../src/i18n';

function flatten(obj: Record<string, unknown>, prefix = ''): string[] {
	const out: string[] = [];
	for (const [k, v] of Object.entries(obj)) {
		const key = prefix ? `${prefix}.${k}` : k;
		if (v && typeof v === 'object') out.push(...flatten(v as Record<string, unknown>, key));
		else out.push(key);
	}
	return out;
}

describe('i18n dictionaries', () => {
	it('en and zh have identical key sets', () => {
		const enKeys = flatten(en).sort();
		const zhKeys = flatten(zh).sort();
		expect(zhKeys).toEqual(enKeys);
	});
});

describe('i18n.t()', () => {
	beforeEach(() => {
		(globalThis as any).window = { localStorage: { getItem: () => 'en' } };
		i18n.initI18n();
	});

	it('returns the english value for a known key', () => {
		expect(i18n.t('view.title')).toBe('Buttons Panel');
	});

	it('uses zh when locale starts with zh', () => {
		(globalThis as any).window.localStorage.getItem = () => 'zh-CN';
		i18n.initI18n();
		expect(i18n.t('view.title')).toBe('按钮面板');
	});

	it('interpolates {placeholders}', () => {
		expect(i18n.t('error.NOT_FOUND', { detail: 'foo.md' })).toBe('Note not found: foo.md');
	});

	it('returns the key itself when not found', () => {
		expect(i18n.t('does.not.exist')).toBe('does.not.exist');
	});

	it('getLocale returns the resolved locale', () => {
		(globalThis as any).window.localStorage.getItem = () => 'zh-TW';
		i18n.initI18n();
		expect(i18n.getLocale()).toBe('zh');
	});
});
```

- [ ] **Step 2：跑测试，预期失败**

```bash
npx vitest run tests/i18n.test.ts
```

预期：`Cannot find module '../src/i18n'` 之类的报错。

- [ ] **Step 3：写 `src/i18n/index.ts`**（设计文档 §7.12）

```ts
import en from './en';
import zh from './zh';

type Dict = Record<string, unknown>;
const dicts: Record<string, Dict> = { en, zh };

let currentLocale: 'en' | 'zh' = 'en';

export function initI18n(): void {
	const lang = (typeof window !== 'undefined' && window.localStorage)
		? (window.localStorage.getItem('language') ?? 'en')
		: 'en';
	currentLocale = lang.startsWith('zh') ? 'zh' : 'en';
}

export function getLocale(): 'en' | 'zh' {
	return currentLocale;
}

export function t(key: string, params?: Record<string, string>): string {
	const fromCurrent = lookupNested(dicts[currentLocale], key);
	const fromEn = lookupNested(dicts.en, key);
	const value = (typeof fromCurrent === 'string' ? fromCurrent : undefined)
		?? (typeof fromEn === 'string' ? fromEn : undefined)
		?? key;
	return interpolate(value, params);
}

function lookupNested(obj: Dict | undefined, key: string): unknown {
	if (!obj) return undefined;
	return key.split('.').reduce<unknown>((acc, k) => {
		if (acc && typeof acc === 'object') return (acc as Record<string, unknown>)[k];
		return undefined;
	}, obj);
}

function interpolate(s: string, params?: Record<string, string>): string {
	if (!params) return s;
	return s.replace(/\{(\w+)\}/g, (_, k) => params[k] ?? `{${k}}`);
}
```

- [ ] **Step 4：跑测试，预期通过**

```bash
npx vitest run tests/i18n.test.ts
```

预期：5 个用例全过。

- [ ] **Step 5：commit**

```bash
git add src/i18n/index.ts tests/i18n.test.ts
git commit -m "feat(i18n): add runtime t() with parity test for en/zh"
```

---

### Task M2.4：debounce 工具

**文件：**
- 新建：`tests/debounce.test.ts`
- 新建：`src/debounce.ts`

- [ ] **Step 1：写失败测试**

```ts
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { debounce } from '../src/debounce';

describe('debounce', () => {
	beforeEach(() => { vi.useFakeTimers(); });
	afterEach(() => { vi.useRealTimers(); });

	it('calls fn once after the delay for a single trigger', () => {
		const fn = vi.fn();
		const d = debounce(fn, 100);
		d();
		expect(fn).not.toHaveBeenCalled();
		vi.advanceTimersByTime(99);
		expect(fn).not.toHaveBeenCalled();
		vi.advanceTimersByTime(1);
		expect(fn).toHaveBeenCalledTimes(1);
	});

	it('coalesces rapid calls to a single trailing invocation', () => {
		const fn = vi.fn();
		const d = debounce(fn, 100);
		d(); d(); d();
		vi.advanceTimersByTime(99);
		d();
		vi.advanceTimersByTime(100);
		expect(fn).toHaveBeenCalledTimes(1);
	});

	it('passes the latest arguments to fn', () => {
		const fn = vi.fn();
		const d = debounce(fn, 50);
		d(1); d(2); d(3);
		vi.advanceTimersByTime(50);
		expect(fn).toHaveBeenCalledWith(3);
	});
});
```

- [ ] **Step 2：跑测试，预期失败**（`npx vitest run tests/debounce.test.ts`）。

- [ ] **Step 3：实现 `src/debounce.ts`**（设计文档 §7.11）

```ts
export function debounce<F extends (...args: unknown[]) => unknown>(fn: F, ms: number): F {
	let timer: ReturnType<typeof setTimeout> | null = null;
	const wrapped = ((...args: Parameters<F>) => {
		if (timer !== null) clearTimeout(timer);
		timer = setTimeout(() => {
			timer = null;
			fn(...args);
		}, ms);
	}) as F;
	return wrapped;
}
```

- [ ] **Step 4：跑测试，预期通过。**

- [ ] **Step 5：commit**

```bash
git add src/debounce.ts tests/debounce.test.ts
git commit -m "feat: add debounce utility with unit tests"
```

---

### Task M2.5：settings schema 与默认值

**文件：**
- 新建：`src/settings.ts`

- [ ] **Step 1：写 `src/settings.ts`**（设计文档 §7.4、§8）

```ts
import type { Plugin } from 'obsidian';
import { runMigrations } from './migration';

export interface ButtonsPanelSettings {
	version: number;
	sourceNotePath: string;
	sidebar: 'left' | 'right';
	aggressiveLeafCompression: boolean;
	maxPanelHeight: number;
	layout: {
		panelPadding: number;
		contentGap: number;
		buttonGridColumns: number;
		compactMode: boolean;
		hideOverflow: boolean;
	};
	display: {
		hideViewHeader: boolean;
		hideFrontmatter: boolean;
		hideInlineTitle: boolean;
		hideHeadings: boolean;
		hideParagraphs: boolean;
		hideHr: boolean;
	};
	autoRefresh: boolean;
	openOnStartup: boolean;
}

export const DEFAULT_SETTINGS: ButtonsPanelSettings = {
	version: 1,
	sourceNotePath: '',
	sidebar: 'left',
	aggressiveLeafCompression: true,
	maxPanelHeight: 0,
	layout: {
		panelPadding: 6,
		contentGap: 6,
		buttonGridColumns: 4,
		compactMode: true,
		hideOverflow: true,
	},
	display: {
		hideViewHeader: true,
		hideFrontmatter: true,
		hideInlineTitle: true,
		hideHeadings: true,
		hideParagraphs: false,
		hideHr: false,
	},
	autoRefresh: true,
	openOnStartup: false,
};

export async function loadSettings(plugin: Plugin): Promise<ButtonsPanelSettings> {
	const raw = (await plugin.loadData()) ?? {};
	const migrated = runMigrations(raw);
	return mergeDefaults(DEFAULT_SETTINGS, migrated);
}

export async function saveSettings(plugin: Plugin & { settings: ButtonsPanelSettings }): Promise<void> {
	await plugin.saveData(plugin.settings);
}

function mergeDefaults<T>(defaults: T, loaded: Partial<T>): T {
	const out: Record<string, unknown> = Array.isArray(defaults) ? [] : { ...(defaults as object) };
	for (const key of Object.keys(loaded ?? {})) {
		const dv = (defaults as Record<string, unknown>)[key];
		const lv = (loaded as Record<string, unknown>)[key];
		if (dv && typeof dv === 'object' && !Array.isArray(dv) && lv && typeof lv === 'object') {
			out[key] = mergeDefaults(dv as object, lv as object);
		} else if (lv !== undefined) {
			out[key] = lv;
		}
	}
	return out as T;
}
```

- [ ] **Step 2：commit**（这个文件主要逻辑只有默认值与一个通用深合并，单测在 `migration.test.ts` 间接覆盖）

```bash
git add src/settings.ts
git commit -m "feat(settings): add schema, defaults, load/save with deep merge"
```

---

### Task M2.6：迁移骨架 + 测试

**文件：**
- 新建：`tests/migration.test.ts`
- 新建：`src/migration.ts`

- [ ] **Step 1：写失败测试**

```ts
import { describe, expect, it } from 'vitest';
import { runMigrations } from '../src/migration';

describe('runMigrations', () => {
	it('handles an empty object', () => {
		const out = runMigrations({});
		expect(out.version).toBe(1);
	});

	it('preserves user values', () => {
		const out = runMigrations({ sourceNotePath: 'foo.md' });
		expect(out.sourceNotePath).toBe('foo.md');
		expect(out.version).toBe(1);
	});

	it('does not throw for a future unknown version', () => {
		expect(() => runMigrations({ version: 99, x: 1 })).not.toThrow();
	});

	it('forces version up to CURRENT_VERSION even if missing', () => {
		const out = runMigrations({ sourceNotePath: 'a.md' });
		expect(out.version).toBe(1);
	});
});
```

- [ ] **Step 2：跑测试，预期失败。**

- [ ] **Step 3：实现 `src/migration.ts`**（设计文档 §7.9）

```ts
const CURRENT_VERSION = 1;

type MigrationFn = (raw: Record<string, unknown>) => Record<string, unknown>;

const migrations: Record<number, MigrationFn> = {
	// v0.1.0 没有迁移函数；表本身就是扩展点。
};

export function runMigrations(raw: unknown): Record<string, unknown> {
	const data: Record<string, unknown> = raw && typeof raw === 'object'
		? { ...(raw as Record<string, unknown>) }
		: {};
	const fromVersion = typeof data.version === 'number' ? data.version : 0;
	for (let v = fromVersion + 1; v <= CURRENT_VERSION; v++) {
		const fn = migrations[v];
		if (fn) Object.assign(data, fn(data));
	}
	data.version = Math.max(CURRENT_VERSION, fromVersion);
	return data;
}
```

- [ ] **Step 4：跑测试，预期通过。**

- [ ] **Step 5：commit**

```bash
git add src/migration.ts tests/migration.test.ts
git commit -m "feat(settings): add versioned migration scaffolding"
```

---

### Task M2.7：path resolver + 测试

**文件：**
- 新建：`tests/path-resolver.test.ts`
- 新建：`src/path-resolver.ts`

- [ ] **Step 1：写失败测试**

测试用最简的 `app.vault.getAbstractFileByPath` 假实现，加最小 `TFile`/`TFolder` 替身。vitest 在 node 环境跑 —— 不导入真实 `obsidian` 包。

```ts
import { describe, expect, it } from 'vitest';
import { resolve, followRename } from '../src/path-resolver';

class FakeTFile { constructor(public path: string, public extension: string) {} }
class FakeTFolder { constructor(public path: string) {} }

function fakeApp(map: Record<string, FakeTFile | FakeTFolder>) {
	return {
		vault: {
			getAbstractFileByPath: (p: string) => map[p] ?? null,
		},
	};
}

describe('resolve', () => {
	it('returns PATH_EMPTY for empty/whitespace input', () => {
		const app = fakeApp({}) as any;
		expect(resolve(app, '').kind).toBe('PATH_EMPTY');
		expect(resolve(app, '   ').kind).toBe('PATH_EMPTY');
	});

	it('returns NOT_FOUND when missing', () => {
		const app = fakeApp({}) as any;
		const r = resolve(app, 'missing.md');
		expect(r.kind).toBe('NOT_FOUND');
		if (r.kind === 'NOT_FOUND') expect(r.detail).toBe('missing.md');
	});

	it('returns IS_FOLDER for folders', () => {
		const app = fakeApp({ 'foo': new FakeTFolder('foo') }) as any;
		expect(resolve(app, 'foo').kind).toBe('IS_FOLDER');
	});

	it('returns WRONG_TYPE for non-md files', () => {
		const app = fakeApp({ 'a.canvas': new FakeTFile('a.canvas', 'canvas') }) as any;
		expect(resolve(app, 'a.canvas').kind).toBe('WRONG_TYPE');
	});

	it('returns OK for an .md file', () => {
		const f = new FakeTFile('a.md', 'md');
		const app = fakeApp({ 'a.md': f }) as any;
		const r = resolve(app, 'a.md');
		expect(r.kind).toBe('OK');
		if (r.kind === 'OK') expect(r.file).toBe(f);
	});

	it('trims whitespace before lookup', () => {
		const f = new FakeTFile('a.md', 'md');
		const app = fakeApp({ 'a.md': f }) as any;
		expect(resolve(app, '  a.md  ').kind).toBe('OK');
	});
});

describe('followRename', () => {
	const settings = () => ({ sourceNotePath: 'old.md' }) as any;

	it('updates settings when oldPath matches', () => {
		const s = settings();
		const updated = followRename(s, 'new.md', 'old.md');
		expect(updated).toBe(true);
		expect(s.sourceNotePath).toBe('new.md');
	});

	it('does nothing when oldPath does not match', () => {
		const s = settings();
		const updated = followRename(s, 'new.md', 'other.md');
		expect(updated).toBe(false);
		expect(s.sourceNotePath).toBe('old.md');
	});
});
```

- [ ] **Step 2：跑测试，预期失败。**

- [ ] **Step 3：实现 `src/path-resolver.ts`**（设计文档 §7.7）

为了让该文件能在 node 端单测，类型判断走 **结构性检查**（`extension === 'md'` 当文件，"在 vault map 中且无 extension" 当文件夹），而不用 `instanceof TFile`/`TFolder`。`obsidian` 仅作为类型导入，不在运行时引入。

```ts
import type { App, TFile } from 'obsidian';
import type { ButtonsPanelSettings } from './settings';

export type ResolveErrorKind = 'PATH_EMPTY' | 'NOT_FOUND' | 'IS_FOLDER' | 'WRONG_TYPE';

export type ResolveResult =
	| { kind: 'OK'; file: TFile }
	| { kind: 'PATH_EMPTY' }
	| { kind: 'NOT_FOUND'; detail: string }
	| { kind: 'IS_FOLDER'; detail: string }
	| { kind: 'WRONG_TYPE'; detail: string };

export function resolve(app: App, path: string): ResolveResult {
	const trimmed = (path ?? '').trim();
	if (!trimmed) return { kind: 'PATH_EMPTY' };

	const af = app.vault.getAbstractFileByPath(trimmed);
	if (!af) return { kind: 'NOT_FOUND', detail: trimmed };

	const hasExtension = typeof (af as { extension?: unknown }).extension === 'string';
	if (!hasExtension) return { kind: 'IS_FOLDER', detail: trimmed };

	const ext = (af as { extension: string }).extension;
	if (ext !== 'md') return { kind: 'WRONG_TYPE', detail: trimmed };

	return { kind: 'OK', file: af as TFile };
}

export function followRename(
	settings: ButtonsPanelSettings,
	newPath: string,
	oldPath: string,
): boolean {
	if (settings.sourceNotePath === oldPath) {
		settings.sourceNotePath = newPath;
		return true;
	}
	return false;
}
```

> 说明：结构性判断（无 `extension` 字段 ⇒ 文件夹）匹配 Obsidian 运行时事实（`TFolder` 没 `extension`，`TFile` 有）。运行时不导入 `obsidian` 模块，vitest 在 node 跑无需 polyfill。

- [ ] **Step 4：跑测试，预期通过。**

- [ ] **Step 5：commit**

```bash
git add src/path-resolver.ts tests/path-resolver.test.ts
git commit -m "feat: add path resolver with structural error types and rename follow"
```

---

### Task M2.8：Buttons 插件检测

**文件：**
- 新建：`src/buttons-detector.ts`

> 不写专门单测：检测函数只是对一个内部 API 的属性访问。L3 清单 C5 会人工验证。

- [ ] **Step 1：写 `src/buttons-detector.ts`**（设计文档 §7.8）

```ts
import type { App } from 'obsidian';

const BUTTONS_PLUGIN_ID = 'buttons';

export class ButtonsDetector {
	private cached: boolean | null = null;
	constructor(private readonly app: App) {}

	isEnabled(): boolean {
		if (this.cached !== null) return this.cached;
		this.cached = this.detect();
		return this.cached;
	}

	refresh(): boolean {
		const before = this.cached;
		this.cached = this.detect();
		return before !== this.cached;
	}

	private detect(): boolean {
		// `app.plugins` 是 Obsidian 内部 API（obsidian.d.ts 未声明）。
		// 社区插件普遍使用，ts-expect-error 抑制类型错误。
		// @ts-expect-error - private API
		const plugins = this.app.plugins;
		const enabled = plugins?.enabledPlugins;
		if (enabled && typeof enabled.has === 'function') {
			return enabled.has(BUTTONS_PLUGIN_ID);
		}
		return false;
	}
}
```

- [ ] **Step 2：commit**

```bash
git add src/buttons-detector.ts
git commit -m "feat: detect whether buttons community plugin is enabled"
```

---

### Task M2.9：style-vars 助手

**文件：**
- 新建：`src/style-vars.ts`

> 简单的 DOM 改写助手；不写单测（L3 清单 B2 / A8 验证）。

- [ ] **Step 1：写 `src/style-vars.ts`**（设计文档 §7.10）

```ts
import type { ButtonsPanelSettings } from './settings';

export function applyStyleVars(rootEl: HTMLElement, settings: ButtonsPanelSettings): void {
	const s = rootEl.style;
	s.setProperty('--bp-panel-padding', `${settings.layout.panelPadding}px`);
	s.setProperty('--bp-content-gap', `${settings.layout.contentGap}px`);
	s.setProperty('--bp-button-grid-columns', `${settings.layout.buttonGridColumns}`);
	s.setProperty('--bp-max-panel-height', `${settings.maxPanelHeight}px`);
}

export function applyDisplayFilterClasses(rootEl: HTMLElement, settings: ButtonsPanelSettings): void {
	const cls = rootEl.classList;
	cls.toggle('bp-hide-view-header', settings.display.hideViewHeader);
	cls.toggle('bp-hide-frontmatter', settings.display.hideFrontmatter);
	cls.toggle('bp-hide-inline-title', settings.display.hideInlineTitle);
	cls.toggle('bp-hide-headings', settings.display.hideHeadings);
	cls.toggle('bp-hide-paragraphs', settings.display.hideParagraphs);
	cls.toggle('bp-hide-hr', settings.display.hideHr);
	cls.toggle('bp-aggressive-compression', settings.aggressiveLeafCompression);
	cls.toggle('bp-compact-mode', settings.layout.compactMode);
	cls.toggle('bp-hide-overflow', settings.layout.hideOverflow);
}
```

- [ ] **Step 2：commit**

```bash
git add src/style-vars.ts
git commit -m "feat: apply settings to css variables and filter classes"
```

---

### Task M2.10：renderer（markdown + 错误状态）

**文件：**
- 新建：`src/renderer.ts`

- [ ] **Step 1：写 `src/renderer.ts`**（设计文档 §7.3、§12）

```ts
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
```

- [ ] **Step 2：commit**

```bash
git add src/renderer.ts
git commit -m "feat(renderer): markdown render + error/banner cards"
```

---

### Task M2.11：ButtonsPanelView

**文件：**
- 新建：`src/view.ts`

- [ ] **Step 1：写 `src/view.ts`**（设计文档 §7.2、§6.2）

```ts
import { ItemView, WorkspaceLeaf } from 'obsidian';
import type ButtonsPanelPlugin from '../main';
import { Renderer } from './renderer';
import { resolve } from './path-resolver';
import { applyDisplayFilterClasses, applyStyleVars } from './style-vars';
import { debounce } from './debounce';
import { t } from './i18n';

export const VIEW_TYPE_BUTTONS_PANEL = 'buttons-panel-view';

export class ButtonsPanelView extends ItemView {
	private bannerEl!: HTMLElement;
	private errorEl!: HTMLElement;
	private renderedEl!: HTMLElement;
	private renderer!: Renderer;
	private debouncedRefresh!: () => void;

	constructor(leaf: WorkspaceLeaf, private readonly plugin: ButtonsPanelPlugin) {
		super(leaf);
		this.renderer = new Renderer(plugin.app, this);
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
		await this.refresh();
	}

	async onClose(): Promise<void> { /* nothing special */ }

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
```

- [ ] **Step 2：commit**

```bash
git add src/view.ts
git commit -m "feat(view): buttonspanelview with banner/error/rendered regions"
```

---

### Task M2.12：commands

**文件：**
- 新建：`src/commands.ts`

- [ ] **Step 1：写 `src/commands.ts`**（按设计文档 §13 命令矩阵）

```ts
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
```

- [ ] **Step 2：commit**

```bash
git add src/commands.ts
git commit -m "feat(commands): implement open/toggle/focus/refresh per matrix"
```

---

### Task M2.13：settings 标签页 UI

**文件：**
- 新建：`src/settings-tab.ts`

- [ ] **Step 1：写 `src/settings-tab.ts`**（设计文档 §7.5）

```ts
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
		this.toggleSetting('aggressiveLeafCompression', 'settings.aggressiveLeafCompression');
		this.numberSetting('maxPanelHeight', 'settings.maxPanelHeight', 0, 1000);
		this.numberSubSetting(['layout', 'panelPadding'], 'settings.layout.panelPadding', 0, 64);
		this.numberSubSetting(['layout', 'contentGap'], 'settings.layout.contentGap', 0, 64);
		this.numberSubSetting(['layout', 'buttonGridColumns'], 'settings.layout.buttonGridColumns', 1, 12);
		this.toggleSubSetting(['layout', 'compactMode'], 'settings.layout.compactMode');
		this.toggleSubSetting(['layout', 'hideOverflow'], 'settings.layout.hideOverflow');

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

	private toggleSetting<K extends 'aggressiveLeafCompression' | 'autoRefresh' | 'openOnStartup'>(
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

	private numberSetting<K extends 'maxPanelHeight'>(key: K, labelKey: string, min: number, max: number): void {
		new Setting(this.containerEl)
			.setName(t(`${labelKey}.label`))
			.setDesc(t(`${labelKey}.desc`))
			.addText((text) => text
				.setValue(String(this.plugin.settings[key]))
				.onChange(async (v) => {
					const n = clamp(parseInt(v, 10) || 0, min, max);
					(this.plugin.settings[key] as number) = n;
					await this.plugin.saveSettings();
				}));
	}

	private toggleSubSetting(path: ['layout' | 'display', string], labelKey: string): void {
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
```

> 注意：`settings-tab.ts` 用到 `plugin.commands_openConfigured`、`plugin.refreshAllViews`、`plugin.openSettingsTab`、`plugin.openCommunityPluginsTab` 四个公开方法，它们在 Task M2.15 的 `main.ts` 里实现。

- [ ] **Step 2：commit**

```bash
git add src/settings-tab.ts
git commit -m "feat(settings): settings tab ui with file suggester and reset action"
```

---

### Task M2.14：生产 CSS

**文件：**
- 修改：`src/styles/styles.css`

- [ ] **Step 1：把 `src/styles/styles.css` 替换为设计文档 §9.2 生产 CSS**（完整复制）：

```css
/* === 1. CSS variable defaults at view root === */
.buttons-panel-view {
	--bp-panel-padding: 6px;
	--bp-content-gap: 6px;
	--bp-button-grid-columns: 4;
	--bp-button-min-width: calc(
		(100% - (var(--bp-button-grid-columns) - 1) * var(--bp-content-gap))
		/ var(--bp-button-grid-columns)
	);
	--bp-max-panel-height: 0px;

	padding: var(--bp-panel-padding);
	background: var(--background-secondary);
	height: auto;
	min-height: 0;
	overflow: hidden;
}

/* maxPanelHeight !== 0: enable scroll */
.buttons-panel-view[style*="--bp-max-panel-height"]:not([style*="--bp-max-panel-height: 0px"]) {
	max-height: var(--bp-max-panel-height);
	overflow-y: auto;
}

/* === Rendered container === */
.buttons-panel-view .buttons-panel-rendered {
	padding: 0 !important;
	margin: 0 !important;
	overflow: hidden;
}

.buttons-panel-view .buttons-panel-rendered .markdown-preview-sizer {
	min-height: 0 !important;
	padding: 0 !important;
	margin: 0 !important;
}

/* === Auto-fit columns for paragraphs that contain buttons === */
.buttons-panel-view .buttons-panel-rendered p:has(button),
.buttons-panel-view .buttons-panel-rendered p:has(.button-default) {
	display: grid;
	grid-template-columns: repeat(
		auto-fit,
		minmax(var(--bp-button-min-width), 1fr)
	);
	gap: var(--bp-content-gap);
	margin: 0 !important;
}

/* === Display filters === */
.buttons-panel-view.bp-hide-headings :is(h1, h2, h3, h4, h5, h6) { display: none; }
.buttons-panel-view.bp-hide-frontmatter .frontmatter,
.buttons-panel-view.bp-hide-frontmatter .frontmatter-container { display: none; }
.buttons-panel-view.bp-hide-inline-title .inline-title { display: none; }
.buttons-panel-view.bp-hide-paragraphs p:not(:has(button)):not(:has(.button-default)) {
	display: none;
}
.buttons-panel-view.bp-hide-hr hr { display: none; }

/* hideViewHeader (lives outside contentEl) */
.workspace-leaf-content[data-type="buttons-panel-view"]:has(.bp-hide-view-header) .view-header {
	display: none;
}

/* === Outer leaf compression (only when aggressive-compression class is set on the view) === */
.mod-left-split .workspace-leaf:has(.workspace-leaf-content[data-type="buttons-panel-view"] .bp-aggressive-compression),
.mod-right-split .workspace-leaf:has(.workspace-leaf-content[data-type="buttons-panel-view"] .bp-aggressive-compression) {
	flex: 0 0 auto !important;
	min-height: 0 !important;
}

/* === Banner (Buttons plugin missing) === */
.buttons-panel-view .buttons-panel-banner {
	font-size: var(--font-ui-small);
	color: var(--text-muted);
	padding: 4px 6px;
	border-bottom: 1px solid var(--background-modifier-border);
	margin-bottom: var(--bp-content-gap);
	display: flex;
	gap: 6px;
	align-items: center;
}
.buttons-panel-view .buttons-panel-banner:empty { display: none; }
.buttons-panel-view .buttons-panel-banner-action {
	font-size: var(--font-ui-smaller);
	padding: 2px 6px;
}

/* === Error card === */
.buttons-panel-view .buttons-panel-error-card {
	padding: 8px;
	background: var(--background-modifier-error-hover);
	border-radius: var(--radius-s);
	font-size: var(--font-ui-small);
	color: var(--text-error);
}
.buttons-panel-view .buttons-panel-error-actions {
	display: flex;
	gap: 6px;
	margin-top: 6px;
}
.buttons-panel-view .buttons-panel-error-actions button {
	font-size: var(--font-ui-smaller);
	padding: 2px 6px;
}
```

- [ ] **Step 2：commit**

```bash
git add src/styles/styles.css
git commit -m "feat(css): production stylesheet — scoped, themable, has()-based"
```

---

### Task M2.15：main.ts —— 串起所有模块

**文件：**
- 修改：`main.ts`

- [ ] **Step 1：把 `main.ts` 替换为生产入口**（设计文档 §6.1、§6.3、§7.1、§13）

```ts
import { Plugin, TAbstractFile, TFile, WorkspaceLeaf } from 'obsidian';
import { ButtonsPanelView, VIEW_TYPE_BUTTONS_PANEL } from './src/view';
import {
	ButtonsPanelSettings,
	DEFAULT_SETTINGS,
	loadSettings,
	saveSettings,
} from './src/settings';
import { ButtonsPanelSettingTab } from './src/settings-tab';
import { registerCommands } from './src/commands';
import { ButtonsDetector } from './src/buttons-detector';
import { followRename } from './src/path-resolver';
import { initI18n } from './src/i18n';

export default class ButtonsPanelPlugin extends Plugin {
	settings!: ButtonsPanelSettings;
	detector!: ButtonsDetector;

	async onload(): Promise<void> {
		initI18n();
		this.settings = await loadSettings(this);
		this.detector = new ButtonsDetector(this.app);

		this.registerView(VIEW_TYPE_BUTTONS_PANEL, (leaf) => new ButtonsPanelView(leaf, this));
		this.addSettingTab(new ButtonsPanelSettingTab(this.app, this));
		registerCommands(this);

		this.registerEvent(this.app.vault.on('rename', (file, oldPath) => this.onRename(file, oldPath)));
		this.registerEvent(this.app.vault.on('modify', (file) => this.onModify(file)));
		this.registerEvent(this.app.vault.on('delete', (file) => this.onDelete(file)));
		this.registerEvent(this.app.workspace.on('layout-change', () => this.onLayoutChange()));

		this.app.workspace.onLayoutReady(() => {
			this.enforceSingleInstance();
			if (this.settings.openOnStartup) void this.commands_openConfigured();
		});
	}

	async onunload(): Promise<void> {
		// Obsidian 会自动 detach 我们的 leaves；这里不需要做事。
	}

	async saveSettings(): Promise<void> {
		await saveSettings(this);
		this.refreshAllViews();
	}

	refreshAllViews(): void {
		for (const leaf of this.app.workspace.getLeavesOfType(VIEW_TYPE_BUTTONS_PANEL)) {
			const view = leaf.view;
			if (view instanceof ButtonsPanelView) void view.refresh();
		}
	}

	openSettingsTab(): void {
		// `app.setting` 是 Obsidian 内部 API，社区惯用。
		// @ts-expect-error - private API
		this.app.setting.open();
		// @ts-expect-error - private API
		this.app.setting.openTabById('buttons-panel');
	}

	openCommunityPluginsTab(): void {
		// @ts-expect-error - private API
		this.app.setting.open();
		// @ts-expect-error - private API
		this.app.setting.openTabById('community-plugins');
	}

	async commands_openConfigured(): Promise<void> {
		const side = this.settings.sidebar;
		const leaves = this.app.workspace.getLeavesOfType(VIEW_TYPE_BUTTONS_PANEL);
		if (leaves.length > 0) {
			this.app.workspace.revealLeaf(leaves[0]);
			return;
		}
		const leaf = side === 'left'
			? this.app.workspace.getLeftLeaf(false)
			: this.app.workspace.getRightLeaf(false);
		if (!leaf) return;
		await leaf.setViewState({ type: VIEW_TYPE_BUTTONS_PANEL, active: true });
		this.app.workspace.revealLeaf(leaf);
	}

	private onRename(file: TAbstractFile, oldPath: string): void {
		if (followRename(this.settings, file.path, oldPath)) {
			void this.saveSettings();
		}
		this.scheduleRefreshIfMatches(file);
	}

	private onModify(file: TAbstractFile): void {
		if (!this.settings.autoRefresh) return;
		this.scheduleRefreshIfMatches(file);
	}

	private onDelete(file: TAbstractFile): void {
		this.scheduleRefreshIfMatches(file);
	}

	private onLayoutChange(): void {
		const changed = this.detector.refresh();
		if (changed) this.refreshAllViews();
	}

	private scheduleRefreshIfMatches(file: TAbstractFile): void {
		if (!(file instanceof TFile)) return;
		if (file.path !== this.settings.sourceNotePath) return;
		for (const leaf of this.app.workspace.getLeavesOfType(VIEW_TYPE_BUTTONS_PANEL)) {
			const view = leaf.view;
			if (view instanceof ButtonsPanelView) view.triggerDebouncedRefresh();
		}
	}

	private enforceSingleInstance(): void {
		const leaves = this.app.workspace.getLeavesOfType(VIEW_TYPE_BUTTONS_PANEL);
		for (let i = 1; i < leaves.length; i++) leaves[i].detach();
	}
}
```

> 注：`openTabById` 传的 id 必须等于 `manifest.id`，即 `buttons-panel`。✅

- [ ] **Step 2：类型检查 + 构建**

```bash
npm run build
```

预期：tsc 与 esbuild 全过，无错误。

- [ ] **Step 3：跑全部单元测试**

```bash
npm test
```

预期：i18n / debounce / migration / path-resolver 四组测试全绿。

- [ ] **Step 4：commit**

```bash
git add main.ts
git commit -m "feat(main): wire view, commands, settings, events, lifecycle"
```

---

### Task M2.16：推送 MVP 功能分支

- [ ] **Step 1：推送**

```bash
git push -u origin feat/v0.1.0-mvp
```

- [ ] **Step 2：开 draft PR 到 `main`**（推荐，便于追踪）。标题：`Buttons Panel v0.1.0 MVP`。正文列出已实现的设计文档章节（3.1 #1–#16）以及 L3 验收待办。

  用 `gh pr create --draft` 或 GitHub MCP 的 `create_pull_request`。

**M2 退出条件：**
- 设计文档 §3.1 全部 P0 项已实现。
- 四个 L1 单测文件（i18n、debounce、migration、path-resolver）全绿。
- `npm run build` 产出干净的 `main.js` + `styles.css`，零 TypeScript 错误。

---

# M3 — 测试与验收

目标：在真实 Obsidian vault 中走完设计文档 §14.4 的 30 项手动验收清单，发现失败就修，全部通过后才进 M4 打 tag。

### Task M3.1：搭建验收 vault

- [ ] **Step 1：选/建一个干净 vault** —— Windows 上 Obsidian 1.5.0+ 稳定版（设计文档 §15.7 唯一承诺平台）。macOS / Linux 暂未承诺。

- [ ] **Step 2：装并启用 Buttons 社区插件。**

- [ ] **Step 3：把构建产物投放到 `<vault>/.obsidian/plugins/buttons-panel/`**（`main.js`、`manifest.json`、`styles.css`）。便利做法：在仓库根写 `.env.local` 设置 `OUTDIR=<vault path>` 然后 `npm run dev`，保存即重新构建；再装个 [Hot Reload](https://github.com/pjeby/hot-reload) 插件实现自动热重载。

- [ ] **Step 4：建测试源笔记** `00-System/Shortcuts.md`，至少 8 个按钮（混合 `command`、`link`，并含一个 inline `` `button-id` `` 引用）。在 `设置 → Buttons Panel → 按钮源笔记路径` 中填入该路径。

---

### Task M3.2：跑 A 组 —— 基础功能（10 项）

依设计文档 §14.4 A 组顺序逐项执行。每项严格按描述构造场景，记录通过/失败。

- [ ] **A1** —— 命令面板搜 "Buttons Panel" → 看到 5 条命令。
- [ ] **A2** —— 跑 `Toggle Buttons Panel` → 在配置侧边栏打开。
- [ ] **A3** —— 再跑 `Toggle` → 关闭。
- [ ] **A4** —— 设置改 `sidebar = 'right'`，再跑 `Toggle` → 在右侧打开。
- [ ] **A5** —— 源笔记内放 5 个 button + 5 个 inline 引用 → 看到 5 个真实按钮（前提 Stage 0 #3 通过）。
- [ ] **A6** —— 点击一个 `command` 类按钮 → Obsidian 真的执行了对应命令。
- [ ] **A7** —— 面板已开时跑 `Refresh Buttons Panel` → 内容刷新。
- [ ] **A8** —— 设置里 `panelPadding = 12` → 面板 padding 立即变大。
- [ ] **A9** —— 重启 Obsidian → 设置保留；若 `openOnStartup` 开启，面板自动打开。
- [ ] **A10** —— 面板当前在右侧，跑 `Open Left` → 关闭右侧、左侧重开。

任一项失败：在 `feat/v0.1.0-mvp` 分支上修，可单测的优先 TDD，commit、rebuild、复测。

---

### Task M3.3：跑 B 组 —— 样式隔离（5 项）

- [ ] **B1** —— 左侧栏同时开 Buttons Panel + Calendar + File Explorer → 仅 Buttons Panel 紧凑，其余视图不变。
- [ ] **B2** —— 调 `panelPadding`、`buttonGridColumns` → 仅 Buttons Panel 变化。
- [ ] **B3** —— 主编辑区开普通 Markdown 笔记 → 段落 / 标题 / frontmatter 显示正常。
- [ ] **B4** —— 关闭 `aggressiveLeafCompression` → 面板回到 Obsidian 默认 leaf 最小高度。
- [ ] **B5** —— 重新启用 → 面板贴合内容高度。

---

### Task M3.4：跑 C 组 —— 错误与边界（8 项）

- [ ] **C1** —— 清空 `sourceNotePath` 并刷新 → `PATH_EMPTY` 错误卡片 + "打开设置" 按钮。
- [ ] **C2** —— 路径填 `nope/missing.md` → `NOT_FOUND` 错误。
- [ ] **C3** —— 路径填一个文件夹名 → `IS_FOLDER` 错误。
- [ ] **C4** —— 路径填一个 `.canvas` 文件 → `WRONG_TYPE` 错误。
- [ ] **C5** —— 禁用 Buttons 社区插件 → banner 出现，原始 markdown 仍渲染。
- [ ] **C6** —— 在 Obsidian 里删除源笔记 → 面板自动切到 `NOT_FOUND`，无需手动刷新。
- [ ] **C7** —— 在 Obsidian 里重命名/移动源笔记 → 设置自动更新，面板继续渲染。
- [ ] **C8** —— 清空路径再填回 → 错误消失，正常渲染恢复。

---

### Task M3.5：跑 D 组 —— 视觉/主题/语言（6 项）

- [ ] **D1** —— 切深色模式 → 颜色清晰可读。
- [ ] **D2** —— 切浅色模式 → 同理。
- [ ] **D3** —— 切到 Minimal 主题 → 布局不破坏。
- [ ] **D4** —— 切到 Things 主题 → 不破坏。
- [ ] **D5** —— 切到 AnuPpuccin 主题 → 不破坏。
- [ ] **D6** —— Obsidian 显示语言 英 → 中 → 英。设置标签和命令名跟随切换。

---

### Task M3.6：跑 E 组 —— 自动行为（1 项）

- [ ] **E1** —— 主编辑区打开源笔记，新增一个 button 代码块并保存 → 1.5 秒内 Buttons Panel 自动出现该按钮。

---

### Task M3.7：失败项分诊与修复

每个失败项：
- [ ] **Step 1：捕捉** Obsidian 版本、主题、复现步骤、截图、控制台输出。
- [ ] **Step 2：判定** 范围内修复（在 `feat/v0.1.0-mvp` 上改）或 已知限制（写进 README §"Known limitations" 与 `docs/design.md` §16.2）。
- [ ] **Step 3：可单测的失败** 顺手补一条回归单测；不可单测的，往 "M3 期间新增的人工检查" 列表里塞一条，避免下次回归。
- [ ] **Step 4：复跑** 涉及组直到全过。

---

### Task M3.8：锁定 MVP 分支

- [ ] **Step 1：最终构建 + 测试一遍**

```bash
npm run build
npm test
```

预期：双绿。

- [ ] **Step 2：把最终修复推到 `origin/feat/v0.1.0-mvp`**，把 draft PR 标 ready for review（或单人合作时直接 squash）。

- [ ] **Step 3：合并到 `main`**（推荐 squash —— 一个分支一个 commit）

```bash
git checkout main
git pull
git merge --squash feat/v0.1.0-mvp
git commit -m "feat: buttons panel v0.1.0 mvp"
git push origin main
```

**M3 退出条件：**
- 30 项验收要么通过，要么在文档里被记为已知限制。
- `feat/v0.1.0-mvp` 已合入 `main`。

---

# M4 — 首次发布

目标：打 tag `0.1.0` → GitHub Actions 自动起草 GitHub Release → 发布 → 可选向 Obsidian 社区市场提交 PR。

### Task M4.1：核对发布前置条件

按设计文档 §18.2 第 1 步检查清单本地核对：

- [ ] `manifest.json` 在仓库根，version `0.1.0`、`minAppVersion: 1.5.0`、`id: buttons-panel`、`isDesktopOnly: true`。
- [ ] `versions.json` 含 `"0.1.0": "1.5.0"`。
- [ ] `README.md`、`LICENSE` 在仓库根。
- [ ] `main.js`、`styles.css`、`data.json`、`node_modules/` 未入库（`git ls-files | grep -E '^(main\.js|styles\.css|data\.json)$'` 应为空）。

任一不符：先修并 push 到 `main`。

---

### Task M4.2：打 tag 并触发 release workflow

- [ ] **Step 1：bump 并打 tag**（`npm version` 会触发 package.json 中的 `version` 脚本即 `version-bump.mjs`）

```bash
npm version 0.1.0 -m "release: %s"
git push origin main --follow-tags
```

> 如果 package.json 已经是 0.1.0，`npm version 0.1.0` 会失败。这种情况手工打 tag：
>
> ```bash
> git tag -a 0.1.0 -m "release: 0.1.0"
> git push origin 0.1.0
> ```

**tag 名一定不带 `v` 前缀** —— Obsidian 社区市场硬要求（设计文档 §15.6 / §18.3）。

- [ ] **Step 2：观察 workflow** —— GitHub → Actions → "Release Obsidian Plugin" → 应当全绿。workflow 会创建 **draft** release，附带 `main.js`、`manifest.json`、`styles.css`。

---

### Task M4.3：把 draft release 提升为 published

- [ ] **Step 1：打开 draft release** `https://github.com/JerryG94/obsidian-buttons-panel/releases`。

- [ ] **Step 2：编辑 release notes**，模板如下：

```markdown
## Buttons Panel 0.1.0 — initial release

A compact, style-isolated container that renders a user-specified Markdown note (with [Buttons](https://github.com/shabegom/buttons)-defined buttons) in the Obsidian sidebar.

### Highlights
- 5 commands: Toggle / Open Left / Open Right / Focus / Refresh
- Auto-refresh on source-note edits and rename-follow
- Configurable padding, gap, columns, max height
- Display filters for headings, frontmatter, inline title, paragraphs, hr
- Versioned settings with migration scaffolding
- en / zh i18n following Obsidian's display language

### Known limitations
- Desktop only (`isDesktopOnly: true`).
- Buttons whose action depends on the "current note" (`append`, `replace`, `prepend`, `swap`, `template`) may behave unexpectedly inside the sidebar view.
- Single panel instance — multi-panel arrives in v0.2.

### Install (manual)
Copy `main.js`, `manifest.json`, `styles.css` to `<vault>/.obsidian/plugins/buttons-panel/`, then enable the plugin in Settings.
```

- [ ] **Step 3：点 "Publish release"。** 确认 3 个资产文件都已附带。

- [ ] **Step 4：在干净 vault 验证手动安装路径** —— 下载 3 个资产 → 投放到 `<vault>/.obsidian/plugins/buttons-panel/` → 重启 Obsidian → 启用插件 → 跑 `Toggle Buttons Panel`。冒烟通过。

---

### Task M4.4（可选）：提交到 Obsidian 社区插件市场

外部 review 1–4 周，不是 v0.1.0 必需步骤。

- [ ] **Step 1：fork** [`obsidianmd/obsidian-releases`](https://github.com/obsidianmd/obsidian-releases)（用 GitHub MCP `fork_repository`）。
- [ ] **Step 2：编辑 `community-plugins.json`** —— 在末尾追加设计文档 §18.2 第 2 步给出的条目。
- [ ] **Step 3：开 PR**，标题 `Add Buttons Panel plugin`，正文用设计文档 §18.3 的模板。
- [ ] **Step 4：跟进 reviewer 反馈**（常见反馈：description 过长、ID 不规范、缺 isDesktopOnly）。

如果决定先延后，把 Task M4.4 留空，下次 release 再来。

**M4 退出条件：**
- GitHub 上有 `0.1.0` tag。
- 公开 GitHub Release，附带 `main.js`、`manifest.json`、`styles.css`。
- 干净 vault 中手动安装冒烟通过。
- （可选）已向 `obsidianmd/obsidian-releases` 提 PR。

---

## 自检备注

本计划是设计文档的直译，没有重新做设计决策。关键对照：

- 设计文档 §3.1 P0 #1–#16 → M2.5–M2.15 实现 + M3 L3 清单验收。
- 设计文档 §5.2 文件结构 → 上文所有 `文件:` 段落路径完全对齐。
- 设计文档 §7.x 模块签名 → 代码块里函数名、返回类型、错误 union 形状全部保留。
- 设计文档 §11 Stage 0 spike → M1 里程碑，含 3 项判据和 Plan B 路线分支。
- 设计文档 §12 错误矩阵 → 落到 `view.ts::actionsForErrorKind` 与 `renderer.renderError`。
- 设计文档 §13 命令矩阵 → 落到 `commands.ts`（`openIn` / `toggle` / `focus` / `refresh`）。
- 设计文档 §14.2 单元测试 → 4 个文件，全部 test-first。
- 设计文档 §14.4 30 项 L3 清单 → M3 逐项走一遍。
- 设计文档 §15.6 发布流水线 → M4。

**计划里有一处与设计文档不完全对应的微调：** `MarkdownFileSuggest` 写在 `settings-tab.ts` 内部（仅一处使用），没单独建文件。这与设计文档 §3.1 第 2 行 "内嵌建议下拉" 的意图一致，但比 §5.2 文件结构少一个文件。如果你想拆出 `src/markdown-file-suggest.ts` 单文件，照拆不影响语义。

M2 期间如果发现 en/zh 词典缺 key（i18n 平价测试会拦下），**两份字典必须在同一 commit 里同时补齐。**

M3 期间如果发现需要真改代码的 spec 缺口（不是简单文档调整），开一个 follow-up issue，在 MVP 分支上修，再继续。
