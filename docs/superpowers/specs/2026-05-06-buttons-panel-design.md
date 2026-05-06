# Buttons Panel — 完整开发设计文档

| 项 | 值 |
|---|---|
| 插件名（英文） | Buttons Panel |
| 插件名（中文） | 按钮面板 |
| 插件 ID | `buttons-panel` |
| 仓库 | https://github.com/JerryG94/obsidian-buttons-panel |
| 作者 | JerryG（GitHub: JerryG94） |
| 文档类型 | Engineering Blueprint（产品规格 + 工程蓝图 + 代码骨架级实现指引） |
| 文档版本 | v1.0 |
| 创建日期 | 2026-05-06 |
| 上游 PRD | `Buttons_Panel_PRD.md`（仓库根） |
| 文档定位 | PRD 的工程化、不一致点收敛后的最终落地版；写代码以本文档为准 |

---

## 目录

1. [文档信息与名词表](#1-文档信息与名词表)
2. [产品定义与定位](#2-产品定义与定位)
3. [v0.1.0 功能范围矩阵](#3-v010-功能范围矩阵)
4. [命名与标识体系](#4-命名与标识体系)
5. [系统架构与模块划分](#5-系统架构与模块划分)
6. [关键流程时序图](#6-关键流程时序图)
7. [模块详细设计](#7-模块详细设计)
8. [设置 schema 与默认值](#8-设置-schema-与默认值)
9. [CSS 架构](#9-css-架构)
10. [i18n 架构](#10-i18n-架构)
11. [Buttons 插件兼容性与 Stage 0 spike](#11-buttons-插件兼容性与-stage-0-spike)
12. [错误状态与边界场景对照表](#12-错误状态与边界场景对照表)
13. [命令行为矩阵](#13-命令行为矩阵)
14. [测试策略与验收清单](#14-测试策略与验收清单)
15. [构建、开发热重载、发布流程](#15-构建开发热重载发布流程)
16. [风险与已知限制](#16-风险与已知限制)
17. [后续版本路线](#17-后续版本路线)
18. [附录](#18-附录)

---

## 1. 文档信息与名词表

### 1.1 名词表

| 术语 | 定义 |
|---|---|
| 按钮源笔记 | 用户配置的一篇 Markdown 笔记，里面用 Buttons 插件的语法定义了按钮。本插件读取并渲染这篇笔记 |
| Buttons 插件 | 第三方 Obsidian 社区插件 [Buttons](https://github.com/shabegom/buttons)。本插件依赖它解析 button 代码块和 inline button 引用 |
| 自定义视图（Custom View） | Obsidian 的 `ItemView` 子类，注册一个新的 `viewType`，可以打开在左/右侧栏或主编辑区 |
| MarkdownRenderer | Obsidian 提供的 `MarkdownRenderer.render()` 静态方法，把 Markdown 字符串渲染成 DOM，并触发所有 Markdown post processor（包括 Buttons 插件的） |
| Markdown post processor | Obsidian 的扩展点，插件用 `registerMarkdownCodeBlockProcessor` 或 `registerMarkdownPostProcessor` 注册回调，对渲染后的 DOM 进行二次处理。Buttons 插件用此机制把 ` ```button` 代码块替换成真实按钮 |
| Leaf | Obsidian 工作区里的一个面板槽位（`WorkspaceLeaf`） |
| Sidebar | Obsidian 左/右侧栏，由 `mod-left-split` / `mod-right-split` class 标识 |
| PAT | GitHub Personal Access Token，用于 GitHub MCP 鉴权（与本插件运行时无关，仅开发阶段用） |
| Stage 0 spike | 在正式实现前的技术验证一次性原型，验证关键技术路线是否可行 |

### 1.2 文档惯例

- 代码块标 ts / css / json / bash / text 表示语言。
- "推荐 X" 在本文档中表示已经过 brainstorm 锁定，写代码时**必须**采用。
- 伪代码块以 `// pseudocode` 开头，**不直接复制为实现**，但函数签名是契约。
- 所有路径在 Windows 下用反斜杠样式书写，但代码内部使用 `path.posix` 或 Obsidian 的 `normalizePath`。

---

## 2. 产品定义与定位

### 2.1 一句话定义

> Buttons Panel 是一款 Obsidian 桌面端插件，在侧边栏提供一个紧凑、独立、样式隔离的"按钮容器"，渲染用户指定的 Markdown 笔记（其中由 Buttons 插件定义按钮），让用户在不污染其他视图样式的前提下获得贴合内容、留白最小的快捷按钮面板。

### 2.2 插件定位

**是**：

- 一个**容器/宿主**插件（Buttons Host），只负责把按钮源笔记装进侧边栏自定义视图并控制布局
- 依赖 Obsidian `MarkdownRenderer.render()` 触发 Buttons 插件的 post processor
- 依赖现有 Buttons 插件完成按钮语法解析、按钮动作执行

**不是**：

- 不重新实现按钮语法
- 不重新实现 command / link / template / templater / append / replace 等按钮动作
- 不替代 Buttons / QuickAdd / Templater / Advanced URI / Obsidian Git
- 不修改 Obsidian 全局侧边栏行为

### 2.3 解决的核心问题

| 问题 | 现状 | 本插件如何解决 |
|---|---|---|
| 整篇 Markdown 笔记作按钮面板，留白过大 | 笔记视图含标题栏、属性区、最小高度，2 排按钮也撑得很高 | 自定义 `ItemView`，仅渲染 Markdown 正文部分，用 `:has()` 收缩外层 Leaf 到内容高 |
| CSS Snippet 压缩高度会误伤其他视图 | `.mod-left-split .workspace-leaf { min-height: 110px }` 之类的全局选择器影响日历、文件管理器等 | CSS 全部限定在 `.buttons-panel-view` 或 `:has(.workspace-leaf-content[data-type="buttons-panel-view"])` 下 |
| Commander 等插件不适合侧栏内容区 | Commander 主面向 Ribbon / 状态栏 / 标题栏 | 本插件直接做"侧栏内容区的按钮容器" |
| 用户已有 Buttons 按钮定义不愿重写 | — | 不解析、不重写，直接复用 |

### 2.4 目标视觉效果

```text
┌────────────────────────────┐
│ 随笔  摘录  待办  灵感       │
│ 同步  卡片  科研  整理       │
└────────────────────────────┘
```

- 高度 = 2 排按钮 + 上下 padding + 1 个 gap，约 80–100px
- 容器变窄 → 自动降为 3 列、2 列
- 不显示笔记标题、frontmatter、内联标题、视图标题栏

---

## 3. v0.1.0 功能范围矩阵

### 3.1 v0.1.0 必含（P0）

| # | 功能 | 验收要点 |
|---|---|---|
| 1 | 注册自定义视图 `buttons-panel-view` | 视图能在左/右侧栏打开 |
| 2 | 设置项：源笔记路径（手输 + 文件选择器） | 输入框 + 内嵌建议下拉 |
| 3 | 用 `MarkdownRenderer.render()` 渲染源笔记 | Buttons 插件的按钮在视图中可见且可点击 |
| 4 | 高度自适应内容（始终 auto） | 2 排按钮 ≈ 80–100px，1 排 ≈ 40–50px |
| 5 | `aggressiveLeafCompression` 开关 | 用 `:has()` 收缩外层 Leaf；关闭时回退到 Obsidian 默认 |
| 6 | `maxPanelHeight` 可选上限 | 默认 0（不限制）；非 0 时超出滚动 |
| 7 | 紧凑布局设置（panelPadding、contentGap、buttonGridColumns、compactMode、hideOverflow） | 设置变更立即生效 |
| 8 | 显示过滤（hideViewHeader、hideFrontmatter、hideInlineTitle、hideHeadings、hideParagraphs、hideHr） | 各开关独立可切；hideParagraphs 排除含 button 的 p |
| 9 | 5 条命令：Toggle / Open Left / Open Right / Focus / Refresh | 命令面板可见且可执行 |
| 10 | 自动刷新（监听 modify / rename / Buttons 启用变化，800ms debounce） | 编辑源笔记保存后 ≤ 1.5 秒可见 |
| 11 | 重命名跟随（监听 `vault.on('rename')` 写回设置） | 在 Obsidian 内移动/改名源笔记不触发"未找到"错误 |
| 12 | Buttons 插件检测 + banner 提示（不启用仍渲染普通 Markdown） | banner 可见，按钮变成普通代码块 |
| 13 | 错误状态 UI（路径空 / 不存在 / 是文件夹 / 非 .md / 文件被删） | 各场景显示对应错误文案 + 操作按钮 |
| 14 | 设置页（中/英 i18n） | 跟随 Obsidian 界面语言 |
| 15 | 单实例约束 | 已存在视图时，Open 命令复用而非新建 |
| 16 | 设置版本化骨架（`version: 1` + 迁移调度器） | 当前无 v0→v1 迁移，仅留扩展点 |

### 3.2 v0.1.0 不含（明确 defer）

| 功能 | 推迟到 |
|---|---|
| 多面板（多套源笔记同时打开） | v0.2 或 v0.3 |
| 移动端布局 | v0.3+ |
| `showOnlyButtons`（只显示按钮，过滤其他元素） | v0.2，需要更复杂的 DOM 判断 |
| 拖拽排序按钮 | 不计划（属于 Buttons 插件本职） |
| 按钮动作配置器 | 不计划（属于 QuickAdd 等插件本职） |

---

## 4. 命名与标识体系

### 4.1 标识符总表

| 用途 | 值 |
|---|---|
| `manifest.id` | `buttons-panel` |
| `manifest.name` | `Buttons Panel` |
| 中文显示名（i18n） | `按钮面板` |
| `viewType` 常量 | `buttons-panel-view` |
| 视图根 DOM class | `.buttons-panel-view` |
| 视图渲染容器 class | `.buttons-panel-rendered` |
| 视图 banner class | `.buttons-panel-banner` |
| 视图 error class | `.buttons-panel-error` |
| CSS 变量前缀 | `--bp-*` |
| 命令前缀（自动） | `buttons-panel:*` |
| 设置键命名规范 | camelCase |
| 设置文件键名 | `data.json`（Obsidian 默认，存于 `.obsidian/plugins/buttons-panel/`） |

### 4.2 CSS 变量清单

```css
:root,
.buttons-panel-view {
  --bp-panel-padding: 6px;
  --bp-content-gap: 6px;
  --bp-button-grid-columns: 4;
  --bp-button-min-width: calc(
    (100% - (var(--bp-button-grid-columns) - 1) * var(--bp-content-gap))
    / var(--bp-button-grid-columns)
  );
  --bp-max-panel-height: 0px; /* 0 = unlimited */
}
```

> 说明：变量名一律 `--bp-` 前缀，避免污染主题命名空间。`--bp-button-min-width` 是 derived，由 `--bp-button-grid-columns` 和 `--bp-content-gap` 计算得出，运行时由 `BpStyleVarController` 写入。

### 4.3 命令 ID 与显示名

| 命令 ID | 英文显示名 | 中文显示名 |
|---|---|---|
| `open-left` | Open Buttons Panel in Left Sidebar | 在左侧栏打开按钮面板 |
| `open-right` | Open Buttons Panel in Right Sidebar | 在右侧栏打开按钮面板 |
| `toggle` | Toggle Buttons Panel | 切换按钮面板 |
| `focus` | Focus Buttons Panel | 聚焦按钮面板 |
| `refresh` | Refresh Buttons Panel | 刷新按钮面板 |

> Obsidian 自动加 `manifest.id` 前缀，最终命令完整 ID 形如 `buttons-panel:toggle`。

---

## 5. 系统架构与模块划分

### 5.1 模块依赖图

```text
                       ┌────────────┐
                       │  main.ts   │
                       │ (Plugin)   │
                       └─────┬──────┘
                             │
        ┌────────────────────┼─────────────────────────┐
        │                    │                         │
        ▼                    ▼                         ▼
┌──────────────┐    ┌──────────────────┐    ┌──────────────────┐
│ settings.ts  │    │ commands.ts      │    │ view.ts          │
│ (Schema/Load │    │ (5 commands)     │    │ (ButtonsPanelView│
│  Save/Migrate│    │                  │    │  : ItemView)     │
└──────┬───────┘    └────┬─────────────┘    └────┬─────────────┘
       │                 │                       │
       │                 │                       │
       ▼                 ▼                       ▼
┌──────────────┐    ┌──────────────────┐    ┌──────────────────┐
│ migration.ts │    │ path-resolver.ts │    │ renderer.ts      │
│              │    │ (resolve/        │    │ (MarkdownRenderer│
│              │    │  rename-follow)  │    │  + error states) │
└──────────────┘    └──────────────────┘    └────┬─────────────┘
                                                 │
                          ┌──────────────────────┴──────────────────┐
                          │                                         │
                          ▼                                         ▼
                 ┌──────────────────┐                    ┌──────────────────┐
                 │ buttons-detector │                    │ i18n/index.ts    │
                 │ .ts              │                    │ + en.ts + zh.ts  │
                 └──────────────────┘                    └──────────────────┘

settings-tab.ts (UI for settings page) → settings.ts + path-resolver.ts + i18n
styles/styles.css (源 CSS) → 构建时合并到根 styles.css
```

### 5.2 文件结构

```text
obsidian-buttons-panel/
├── manifest.json
├── package.json
├── package-lock.json
├── tsconfig.json
├── esbuild.config.mjs
├── version-bump.mjs               # SemVer 自动同步 manifest/versions.json
├── versions.json                  # Obsidian 兼容性版本映射
├── README.md                      # 英文为主
├── README.zh.md                   # 中文（链接放 README.md 顶部）
├── LICENSE                        # MIT
├── styles.css                     # 编译产物（生产构建合并）
├── main.ts                        # 入口
├── src/
│   ├── view.ts
│   ├── renderer.ts
│   ├── settings.ts
│   ├── settings-tab.ts
│   ├── commands.ts
│   ├── path-resolver.ts
│   ├── buttons-detector.ts
│   ├── migration.ts
│   ├── style-vars.ts              # CSS 变量动态写入
│   ├── debounce.ts                # debounce 工具（独立可单测）
│   ├── i18n/
│   │   ├── index.ts
│   │   ├── en.ts
│   │   └── zh.ts
│   └── styles/
│       └── styles.css
├── tests/
│   ├── path-resolver.test.ts
│   ├── migration.test.ts
│   ├── debounce.test.ts
│   └── i18n.test.ts
├── docs/
│   ├── design.md                  # 本文档（最终版）
│   └── prd.md                     # PRD 历史版本
├── .github/
│   └── workflows/
│       └── release.yml
├── .gitignore                     # node_modules, main.js, styles.css(产物), data.json
├── .editorconfig
└── tsconfig.json
```

### 5.3 模块职责一句话总结

| 模块 | 职责 |
|---|---|
| `main.ts` | 注册视图、命令、设置页；启动/卸载生命周期；订阅全局事件并分发 |
| `view.ts` | `ButtonsPanelView` 自定义视图；持有 banner / error / rendered 三个区域的 DOM 引用 |
| `renderer.ts` | 调用 `MarkdownRenderer.render()`；判断错误状态切换；应用显示过滤 CSS |
| `settings.ts` | 设置 schema / 默认值 / load / save |
| `settings-tab.ts` | 设置页 UI（PluginSettingTab 子类） |
| `commands.ts` | 5 条命令的 `editorCallback` / `callback` 实现 |
| `path-resolver.ts` | 路径解析、文件存在判断、rename 跟随 |
| `buttons-detector.ts` | 检测 Buttons 插件是否启用；订阅启用状态变化 |
| `migration.ts` | 设置迁移调度器（v0.1 仅骨架） |
| `style-vars.ts` | 把设置项写入 CSS 变量（在视图根上 set） |
| `debounce.ts` | `debounce(fn, ms)` 工具 |
| `i18n/index.ts` | `t(key)` / `getLocale()` |

---

## 6. 关键流程时序图

### 6.1 插件启动

```text
Obsidian   main.ts            settings.ts   migration.ts   buttons-detector  i18n
   │           │                  │             │                 │             │
   │ onload()  │                  │             │                 │             │
   │──────────>│                  │             │                 │             │
   │           │  loadSettings()  │             │                 │             │
   │           │─────────────────>│             │                 │             │
   │           │                  │ run all     │                 │             │
   │           │                  │ migrations  │                 │             │
   │           │                  │────────────>│                 │             │
   │           │                  │<────────────│                 │             │
   │           │<─────settings────│             │                 │             │
   │           │                  │             │                 │             │
   │           │  init()                        │                 │             │
   │           │───────────────────────────────────────────────>  │             │
   │           │  init i18n with localStorage['language']         │             │
   │           │─────────────────────────────────────────────────────────────>  │
   │           │                                                                │
   │           │  registerView('buttons-panel-view', leaf -> new ButtonsPanelView)
   │           │  addCommand × 5
   │           │  addSettingTab(new ButtonsPanelSettingTab(...))
   │           │  registerEvent vault.on('modify' | 'rename' | 'delete')
   │           │  registerEvent app.workspace.on('layout-change') (for buttons-detector)
   │           │
   │           │  if settings.openOnStartup → activateView()
   │           │
   │ ✓ ready   │
```

### 6.2 视图渲染流程

```text
ButtonsPanelView.onOpen()
   │
   ├── render container DOM (banner / error / rendered)
   │
   ├── apply CSS vars (style-vars.ts)
   │
   └── refresh()
        │
        ├── pathResolver.resolve(settings.sourceNotePath)
        │     │
        │     ├── if empty → state = "PATH_EMPTY"
        │     ├── if not found → state = "NOT_FOUND"
        │     ├── if folder → state = "IS_FOLDER"
        │     ├── if non-md → state = "WRONG_TYPE"
        │     └── else → state = "OK", file = TFile
        │
        ├── if state !== "OK" → renderer.renderError(state) → return
        │
        ├── buttonsDetector.isEnabled()
        │     └── if false → set banner visible
        │
        └── renderer.renderMarkdown(file)
              │
              ├── markdown = await app.vault.cachedRead(file)
              ├── containerEl.empty()
              ├── await MarkdownRenderer.render(app, markdown, containerEl, file.path, view)
              │     ↳ Buttons 插件的 post processor 自动接管 button 代码块
              ├── apply display filter classes (hideHeadings, hideParagraphs, ...)
              └── done
```

### 6.3 自动刷新（debounced）

```text
vault.on('modify', file)
   │
   ├── if file.path === settings.sourceNotePath
   │     └── debouncedRefresh() ← 800ms debounce
   │
vault.on('rename', file, oldPath)
   │
   ├── if oldPath === settings.sourceNotePath
   │     ├── settings.sourceNotePath = file.path
   │     ├── saveSettings()
   │     └── debouncedRefresh()
   │
vault.on('delete', file)
   │
   ├── if file.path === settings.sourceNotePath
   │     └── debouncedRefresh()  // 会触发 NOT_FOUND 状态
   │
workspace.on('layout-change')  // 用于 buttons-detector
   │
   └── if Buttons 插件启用状态变化 → debouncedRefresh()

settings change (via settings-tab.ts)
   │
   └── refresh()  // 立即，不 debounce
```

### 6.4 Toggle 命令行为

```text
toggle()
   │
   ├── leaves = app.workspace.getLeavesOfType('buttons-panel-view')
   │
   ├── if leaves.length === 0 → openInConfiguredSidebar()
   │
   ├── if leaves.length >= 1 → leaves.forEach(detach())
   │     // 单实例约束已在视图侧保证 leaves.length <= 1，
   │     // 此处兼容用户手动复制的极端情况

openInConfiguredSidebar()
   │
   ├── leaf = (settings.sidebar === 'left'
   │            ? app.workspace.getLeftLeaf(false)
   │            : app.workspace.getRightLeaf(false))
   │
   └── await leaf.setViewState({ type: 'buttons-panel-view', active: true })
```

### 6.5 重命名跟随

```text
用户操作         Obsidian 事件            插件响应
   │                  │                       │
   │  在 vault 中     │                       │
   │  把 A.md 重命名  │                       │
   │  为 B.md         │                       │
   │─────────────────>│                       │
   │                  │  vault.on('rename',   │
   │                  │  newFile, 'A.md')     │
   │                  │──────────────────────>│
   │                  │                       │ if oldPath === settings.sourceNotePath
   │                  │                       │   settings.sourceNotePath = 'B.md'
   │                  │                       │   saveSettings()
   │                  │                       │   debouncedRefresh()
   │                  │                       │ else
   │                  │                       │   ignore
```

---

## 7. 模块详细设计

> 每个模块给出：职责、对外 API、关键内部状态、伪代码或函数签名。**不是要你照抄，而是契约。**

### 7.1 `main.ts`

```ts
// pseudocode
import { Plugin, WorkspaceLeaf } from 'obsidian';
import { ButtonsPanelView, VIEW_TYPE_BUTTONS_PANEL } from './src/view';
import { ButtonsPanelSettings, DEFAULT_SETTINGS, loadSettings, saveSettings } from './src/settings';
import { ButtonsPanelSettingTab } from './src/settings-tab';
import { registerCommands } from './src/commands';
import { ButtonsDetector } from './src/buttons-detector';
import { initI18n } from './src/i18n';

export default class ButtonsPanelPlugin extends Plugin {
  settings: ButtonsPanelSettings;
  detector: ButtonsDetector;

  async onload() {
    initI18n();
    this.settings = await loadSettings(this);
    this.detector = new ButtonsDetector(this.app);

    this.registerView(VIEW_TYPE_BUTTONS_PANEL, (leaf) => new ButtonsPanelView(leaf, this));
    this.addSettingTab(new ButtonsPanelSettingTab(this.app, this));
    registerCommands(this);

    this.registerEvent(this.app.vault.on('rename', (file, oldPath) => this.onRename(file, oldPath)));
    this.registerEvent(this.app.vault.on('modify', (file) => this.onModify(file)));
    this.registerEvent(this.app.vault.on('delete', (file) => this.onDelete(file)));
    this.registerEvent(this.app.workspace.on('layout-change', () => this.detector.refresh()));

    // 单实例约束：启动时若发现多个 view 实例，detach 多余的
    this.enforceSingleInstance();
  }

  async onunload() {
    // ItemView 会被 Obsidian 自动 detach；不要在 onunload 里手动 detach（会影响重启恢复）
  }

  async saveSettings() {
    await saveSettings(this);
    this.refreshAllViews();  // 设置变更立即生效（无 debounce）
  }

  private onRename(file: TAbstractFile, oldPath: string) { /* see §6.5 */ }
  private onModify(file: TAbstractFile) { /* debounced refresh */ }
  private onDelete(file: TAbstractFile) { /* debounced refresh */ }

  private enforceSingleInstance() { /* if leaves > 1, keep first, detach rest */ }
  private refreshAllViews() { /* iterate leaves, call view.refresh() */ }
}
```

### 7.2 `src/view.ts`

```ts
// pseudocode
import { ItemView, WorkspaceLeaf } from 'obsidian';
import { Renderer } from './renderer';

export const VIEW_TYPE_BUTTONS_PANEL = 'buttons-panel-view';

export class ButtonsPanelView extends ItemView {
  private bannerEl: HTMLElement;
  private errorEl: HTMLElement;
  private renderedEl: HTMLElement;
  private renderer: Renderer;
  private debouncedRefresh: () => void;

  constructor(leaf: WorkspaceLeaf, private plugin: ButtonsPanelPlugin) {
    super(leaf);
    this.renderer = new Renderer(plugin.app, this);
    this.debouncedRefresh = debounce(() => this.refresh(), 800);
  }

  getViewType(): string { return VIEW_TYPE_BUTTONS_PANEL; }
  getDisplayText(): string { return t('view.title'); }
  getIcon(): string { return 'mouse-pointer-click'; }  // 选个 lucide 图标

  async onOpen() {
    this.contentEl.addClass('buttons-panel-view');
    this.applyDisplayFilters();
    this.bannerEl = this.contentEl.createDiv({ cls: 'buttons-panel-banner' });
    this.errorEl = this.contentEl.createDiv({ cls: 'buttons-panel-error' });
    this.renderedEl = this.contentEl.createDiv({ cls: 'buttons-panel-rendered markdown-preview-view' });
    this.applyStyleVars();
    await this.refresh();
  }

  async onClose() { /* nothing special */ }

  async refresh() {
    const result = pathResolver.resolve(this.plugin.app, this.plugin.settings.sourceNotePath);
    if (result.kind !== 'OK') {
      this.renderer.renderError(this.errorEl, result.kind, result.detail);
      this.renderedEl.empty();
      this.bannerEl.empty();
      return;
    }
    this.errorEl.empty();
    this.updateBanner();
    await this.renderer.renderMarkdown(this.renderedEl, result.file);
  }

  triggerDebouncedRefresh() { this.debouncedRefresh(); }

  private updateBanner() { /* show banner if Buttons plugin not enabled */ }
  private applyStyleVars() { /* read settings, write CSS vars on contentEl */ }
  private applyDisplayFilters() { /* add classes like 'bp-hide-headings' based on settings */ }
}
```

### 7.3 `src/renderer.ts`

```ts
// pseudocode
import { App, MarkdownRenderer, TFile, Component } from 'obsidian';
import { t } from './i18n';

export type ResolveErrorKind = 'PATH_EMPTY' | 'NOT_FOUND' | 'IS_FOLDER' | 'WRONG_TYPE';

export class Renderer {
  constructor(private app: App, private component: Component) {}

  async renderMarkdown(containerEl: HTMLElement, file: TFile) {
    containerEl.empty();
    const markdown = await this.app.vault.cachedRead(file);
    await MarkdownRenderer.render(this.app, markdown, containerEl, file.path, this.component);
    // Buttons 插件的 markdown post processor 此时应自动接管
  }

  renderError(containerEl: HTMLElement, kind: ResolveErrorKind, detail?: string) {
    containerEl.empty();
    const card = containerEl.createDiv({ cls: 'buttons-panel-error-card' });
    card.createEl('p', { text: t(`error.${kind}`, { detail }) });
    const actions = card.createDiv({ cls: 'buttons-panel-error-actions' });
    // 添加"打开设置"按钮等，按 §12 表格映射
  }
}
```

### 7.4 `src/settings.ts`

```ts
// pseudocode
import { Plugin } from 'obsidian';
import { runMigrations } from './migration';

export interface ButtonsPanelSettings {
  version: number;
  sourceNotePath: string;
  sidebar: 'left' | 'right';
  aggressiveLeafCompression: boolean;
  maxPanelHeight: number; // 0 = unlimited
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
  return Object.assign({}, DEFAULT_SETTINGS, migrated);  // 缺字段兜底
}

export async function saveSettings(plugin: Plugin & { settings: ButtonsPanelSettings }): Promise<void> {
  await plugin.saveData(plugin.settings);
}
```

### 7.5 `src/settings-tab.ts`

```ts
// pseudocode
import { App, PluginSettingTab, Setting } from 'obsidian';
import { t } from './i18n';

export class ButtonsPanelSettingTab extends PluginSettingTab {
  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    // === 来源 ===
    new Setting(containerEl)
      .setName(t('settings.sourceNote.label'))
      .setDesc(t('settings.sourceNote.desc'))
      .addText((text) => {
        text.setPlaceholder('00-系统/侧边栏快捷按钮.md')
            .setValue(this.plugin.settings.sourceNotePath)
            .onChange(async (v) => {
              this.plugin.settings.sourceNotePath = v;
              await this.plugin.saveSettings();
            });
        // 文件选择器：用 Obsidian 的 AbstractInputSuggest 实现路径补全
        new MarkdownFileSuggest(this.app, text.inputEl);
      });

    // === 位置 ===
    new Setting(containerEl)
      .setName(t('settings.sidebar.label'))
      .addDropdown((dd) => dd.addOption('left', t('settings.sidebar.left'))
                            .addOption('right', t('settings.sidebar.right'))
                            .setValue(this.plugin.settings.sidebar)
                            .onChange(async (v: 'left' | 'right') => {
                              this.plugin.settings.sidebar = v;
                              await this.plugin.saveSettings();
                            }));

    // === 高度 ===
    new Setting(containerEl)
      .setName(t('settings.aggressiveLeafCompression.label'))
      .setDesc(t('settings.aggressiveLeafCompression.desc'))
      .addToggle(/* ... */);

    new Setting(containerEl)
      .setName(t('settings.maxPanelHeight.label'))
      .setDesc(t('settings.maxPanelHeight.desc'))
      .addText(/* number input, 0 = unlimited */);

    // === 布局：panelPadding / contentGap / buttonGridColumns / compactMode / hideOverflow
    // === 显示：hideViewHeader / hideFrontmatter / hideInlineTitle / hideHeadings / hideParagraphs / hideHr
    // === 行为：autoRefresh / openOnStartup
    // === 状态：Buttons 插件检测结果显示
    // === 操作：打开面板 / 刷新面板 / 重置默认设置
  }
}
```

### 7.6 `src/commands.ts`

```ts
// pseudocode
export function registerCommands(plugin: ButtonsPanelPlugin) {
  plugin.addCommand({ id: 'open-left',  name: t('cmd.openLeft'),  callback: () => openIn(plugin, 'left') });
  plugin.addCommand({ id: 'open-right', name: t('cmd.openRight'), callback: () => openIn(plugin, 'right') });
  plugin.addCommand({ id: 'toggle',     name: t('cmd.toggle'),    callback: () => toggle(plugin) });
  plugin.addCommand({ id: 'focus',      name: t('cmd.focus'),     callback: () => focus(plugin) });
  plugin.addCommand({ id: 'refresh',    name: t('cmd.refresh'),   callback: () => refresh(plugin) });
}

// 行为见 §13 命令行为矩阵
function openIn(plugin: ButtonsPanelPlugin, side: 'left' | 'right') { /* ... */ }
function toggle(plugin: ButtonsPanelPlugin) { /* ... */ }
function focus(plugin: ButtonsPanelPlugin) { /* ... */ }
function refresh(plugin: ButtonsPanelPlugin) { /* ... */ }
```

### 7.7 `src/path-resolver.ts`

```ts
// pseudocode
export type ResolveResult =
  | { kind: 'OK'; file: TFile }
  | { kind: 'PATH_EMPTY' }
  | { kind: 'NOT_FOUND'; detail: string }
  | { kind: 'IS_FOLDER'; detail: string }
  | { kind: 'WRONG_TYPE'; detail: string };

export function resolve(app: App, path: string): ResolveResult {
  const trimmed = (path ?? '').trim();
  if (!trimmed) return { kind: 'PATH_EMPTY' };

  const af = app.vault.getAbstractFileByPath(normalizePath(trimmed));
  if (!af) return { kind: 'NOT_FOUND', detail: trimmed };
  if (af instanceof TFolder) return { kind: 'IS_FOLDER', detail: trimmed };
  if (!(af instanceof TFile) || af.extension !== 'md')
    return { kind: 'WRONG_TYPE', detail: trimmed };

  return { kind: 'OK', file: af };
}

export function followRename(
  settings: ButtonsPanelSettings,
  newPath: string,
  oldPath: string,
): boolean {
  if (settings.sourceNotePath === oldPath) {
    settings.sourceNotePath = newPath;
    return true;  // 调用方负责 saveSettings + refresh
  }
  return false;
}
```

### 7.8 `src/buttons-detector.ts`

```ts
// pseudocode
export class ButtonsDetector {
  private cached: boolean | null = null;
  constructor(private app: App) {}

  isEnabled(): boolean {
    if (this.cached !== null) return this.cached;
    // @ts-expect-error - Obsidian 内部 API
    const plugins = this.app.plugins;
    this.cached = plugins?.enabledPlugins?.has('buttons') ?? false;
    return this.cached!;
  }

  refresh() {
    this.cached = null;
    this.isEnabled();  // re-warm
  }
}
```

> 注：`app.plugins.enabledPlugins` 是 Obsidian 内部 API，社区插件惯用，但官方 `obsidian.d.ts` 未声明。需要 `@ts-expect-error` 注释。

### 7.9 `src/migration.ts`

```ts
// pseudocode
const CURRENT_VERSION = 1;

type MigrationFn = (raw: any) => any;

const migrations: Record<number, MigrationFn> = {
  // v0.1.0 没有迁移函数；保留扩展点
  // 1: (raw) => { /* v0 → v1 时填这里 */ return raw; },
};

export function runMigrations(raw: any): any {
  let data = raw ?? {};
  const fromVersion = data.version ?? 0;
  for (let v = fromVersion + 1; v <= CURRENT_VERSION; v++) {
    const fn = migrations[v];
    if (fn) data = fn(data);
  }
  data.version = CURRENT_VERSION;
  return data;
}
```

> Breaking change（重命名键、改值类型、删除字段）必须升 `version` 并写迁移函数。加新字段或新可选项靠 `Object.assign(DEFAULT_SETTINGS, loaded)` 兜底，不升 version。

### 7.10 `src/style-vars.ts`

```ts
// pseudocode
export function applyStyleVars(rootEl: HTMLElement, settings: ButtonsPanelSettings) {
  const s = rootEl.style;
  s.setProperty('--bp-panel-padding', `${settings.layout.panelPadding}px`);
  s.setProperty('--bp-content-gap', `${settings.layout.contentGap}px`);
  s.setProperty('--bp-button-grid-columns', `${settings.layout.buttonGridColumns}`);
  s.setProperty('--bp-max-panel-height', `${settings.maxPanelHeight}px`);
}

export function applyDisplayFilterClasses(rootEl: HTMLElement, settings: ButtonsPanelSettings) {
  const cls = rootEl.classList;
  cls.toggle('bp-hide-view-header', settings.display.hideViewHeader);
  cls.toggle('bp-hide-frontmatter', settings.display.hideFrontmatter);
  cls.toggle('bp-hide-inline-title', settings.display.hideInlineTitle);
  cls.toggle('bp-hide-headings', settings.display.hideHeadings);
  cls.toggle('bp-hide-paragraphs', settings.display.hideParagraphs);
  cls.toggle('bp-hide-hr', settings.display.hideHr);
  cls.toggle('bp-aggressive-compression', settings.aggressiveLeafCompression);
}
```

### 7.11 `src/debounce.ts`

```ts
// pseudocode
export function debounce<F extends (...args: any[]) => any>(fn: F, ms: number): F {
  let timer: ReturnType<typeof setTimeout> | null = null;
  return ((...args: Parameters<F>) => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  }) as F;
}
```

### 7.12 `src/i18n/index.ts`

```ts
// pseudocode
import en from './en';
import zh from './zh';

const dicts: Record<string, any> = { en, zh };

let currentLocale: 'en' | 'zh' = 'en';

export function initI18n() {
  const lang = window.localStorage.getItem('language') ?? 'en';
  currentLocale = lang.startsWith('zh') ? 'zh' : 'en';
}

export function getLocale(): 'en' | 'zh' { return currentLocale; }

export function t(key: string, params?: Record<string, string>): string {
  const dict = dicts[currentLocale] ?? dicts.en;
  const value = lookupNested(dict, key) ?? lookupNested(dicts.en, key) ?? key;
  return interpolate(value, params);
}

function lookupNested(obj: any, key: string): string | undefined {
  return key.split('.').reduce((acc, k) => acc?.[k], obj);
}
function interpolate(s: string, params?: Record<string, string>): string {
  if (!params) return s;
  return s.replace(/\{(\w+)\}/g, (_, k) => params[k] ?? `{${k}}`);
}
```

### 7.13 `src/i18n/en.ts` 和 `zh.ts`

```ts
// en.ts
export default {
  view: { title: 'Buttons Panel' },
  cmd: {
    openLeft: 'Open Buttons Panel in Left Sidebar',
    openRight: 'Open Buttons Panel in Right Sidebar',
    toggle: 'Toggle Buttons Panel',
    focus: 'Focus Buttons Panel',
    refresh: 'Refresh Buttons Panel',
  },
  settings: {
    sourceNote: { label: 'Source note path', desc: 'Path to the Markdown note that contains your Buttons definitions.' },
    sidebar: { label: 'Default sidebar', left: 'Left', right: 'Right' },
    aggressiveLeafCompression: { label: 'Aggressive leaf compression', desc: 'Use :has() to shrink the outer Leaf to fit content. Disable if your theme conflicts.' },
    maxPanelHeight: { label: 'Max panel height (px)', desc: '0 = unlimited (panel sizes to content). When set, content overflowing will scroll.' },
    // ... rest
  },
  error: {
    PATH_EMPTY: 'Please specify a source note in plugin settings.',
    NOT_FOUND: 'Note not found: {detail}',
    IS_FOLDER: 'Path must point to a Markdown file, not a folder: {detail}',
    WRONG_TYPE: 'Only .md files are supported: {detail}',
    BUTTONS_PLUGIN_MISSING: 'Buttons plugin not detected. Buttons may not render. Please install and enable Buttons plugin.',
  },
};

// zh.ts —— 镜像结构，全部翻译为中文
```

---

## 8. 设置 schema 与默认值

详见 §7.4 `src/settings.ts`。这里给出表格摘要，方便审阅：

| 字段 | 类型 | 默认值 | 说明 |
|---|---|---|---|
| `version` | `number` | `1` | 设置版本号（迁移用） |
| `sourceNotePath` | `string` | `''` | 源笔记路径，相对 vault root |
| `sidebar` | `'left' \| 'right'` | `'left'` | Toggle 默认打开位置 |
| `aggressiveLeafCompression` | `boolean` | `true` | 是否启用 `:has()` 收缩 Leaf |
| `maxPanelHeight` | `number` | `0` | 0 = 不限制，>0 = 像素上限，超出滚动 |
| `layout.panelPadding` | `number` | `6` | 面板内边距（px） |
| `layout.contentGap` | `number` | `6` | 内容间距（px） |
| `layout.buttonGridColumns` | `number` | `4` | 目标列数 |
| `layout.compactMode` | `boolean` | `true` | 启用紧凑样式 |
| `layout.hideOverflow` | `boolean` | `true` | 隐藏溢出 |
| `display.hideViewHeader` | `boolean` | `true` | 隐藏 view 标题栏 |
| `display.hideFrontmatter` | `boolean` | `true` | 隐藏 frontmatter |
| `display.hideInlineTitle` | `boolean` | `true` | 隐藏内联标题 |
| `display.hideHeadings` | `boolean` | `true` | 隐藏 h1-h6 |
| `display.hideParagraphs` | `boolean` | `false` | 隐藏不含 button 的段落 |
| `display.hideHr` | `boolean` | `false` | 隐藏 hr |
| `autoRefresh` | `boolean` | `true` | 监听源笔记/Buttons 插件变化 |
| `openOnStartup` | `boolean` | `false` | 启动时是否自动打开面板 |

> 已显式删除：`panelHeightMode`、`fixedPanelHeight`、`showOnlyButtons`（不在 v0.1）。

---

## 9. CSS 架构

### 9.1 隔离原则

所有 CSS 选择器必须以 `.buttons-panel-view` 或 `:has(.workspace-leaf-content[data-type="buttons-panel-view"])` 开头，绝不写裸的 `.workspace-leaf` / `.markdown-preview-view` 之类的全局选择器。

### 9.2 完整 CSS（生产 styles.css 雏形）

```css
/* === 1. CSS 变量声明（视图根） === */
.buttons-panel-view {
  --bp-panel-padding: 6px;
  --bp-content-gap: 6px;
  --bp-button-grid-columns: 4;
  --bp-button-min-width: calc(
    (100% - (var(--bp-button-grid-columns) - 1) * var(--bp-content-gap))
    / var(--bp-button-grid-columns)
  );
  --bp-max-panel-height: 0px;

  /* === 2. 基础布局 === */
  padding: var(--bp-panel-padding);
  background: var(--background-secondary);
  height: auto;
  min-height: 0;
  overflow: hidden;
}

/* maxPanelHeight 不为 0 时启用滚动上限 */
.buttons-panel-view[style*="--bp-max-panel-height"]:not([style*="--bp-max-panel-height: 0px"]) {
  max-height: var(--bp-max-panel-height);
  overflow-y: auto;
}

/* === 3. 渲染容器 === */
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

/* === 4. 列数自适应（核心） === */
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

/* === 5. 显示过滤（与 settings 联动的 class） === */
.buttons-panel-view.bp-hide-headings :is(h1, h2, h3, h4, h5, h6) { display: none; }
.buttons-panel-view.bp-hide-frontmatter .frontmatter,
.buttons-panel-view.bp-hide-frontmatter .frontmatter-container { display: none; }
.buttons-panel-view.bp-hide-inline-title .inline-title { display: none; }
.buttons-panel-view.bp-hide-paragraphs p:not(:has(button)):not(:has(.button-default)) {
  display: none;
}
.buttons-panel-view.bp-hide-hr hr { display: none; }

/* hideViewHeader: 作用于外层 view-header（不在 contentEl 内，需要单独选择器） */
.workspace-leaf-content[data-type="buttons-panel-view"] .view-header {
  display: none;
}
/* 可通过 :has 反向控制：当 .buttons-panel-view 有 .bp-hide-view-header 时 */
.workspace-leaf-content[data-type="buttons-panel-view"]:has(.bp-hide-view-header) .view-header {
  display: none;
}
.workspace-leaf-content[data-type="buttons-panel-view"]:not(:has(.bp-hide-view-header)) .view-header {
  display: flex;
}

/* === 6. 外层 Leaf 收缩（仅在 aggressive-compression 开启时） === */
.mod-left-split .workspace-leaf:has(.workspace-leaf-content[data-type="buttons-panel-view"] .bp-aggressive-compression),
.mod-right-split .workspace-leaf:has(.workspace-leaf-content[data-type="buttons-panel-view"] .bp-aggressive-compression) {
  flex: 0 0 auto !important;
  min-height: 0 !important;
}

/* === 7. Banner（Buttons 插件未启用提示） === */
.buttons-panel-view .buttons-panel-banner {
  font-size: var(--font-ui-small);
  color: var(--text-muted);
  padding: 4px 6px;
  border-bottom: 1px solid var(--background-modifier-border);
  margin-bottom: var(--bp-content-gap);
}
.buttons-panel-view .buttons-panel-banner:empty { display: none; }

/* === 8. 错误状态 === */
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

### 9.3 主题兼容

只用 Obsidian CSS 变量（`var(--background-secondary)` 等），不写死颜色。开发时分别在以下场景验证：

- 默认主题（深/浅）
- Minimal 主题
- Things 主题
- AnuPpuccin 主题

---

## 10. i18n 架构

### 10.1 选择回顾

- 方案：仿 Obsidian 风格的嵌套 dict（无第三方依赖）
- 语言来源：`window.localStorage.getItem('language')`（Obsidian 自身设置写入）
- Fallback：英文
- 命令名也双语

### 10.2 key 命名规范

- 一律点分嵌套：`view.title` / `cmd.toggle` / `settings.sourceNote.label`
- 顶层 namespace 固定：`view`、`cmd`、`settings`、`error`、`misc`
- 占位符 `{name}` 形式，由 `interpolate()` 替换

### 10.3 文件结构

见 §7.12 / §7.13。

### 10.4 如何加新 key

1. 同时往 `en.ts` 和 `zh.ts` 加同名 key
2. 写一行 `tests/i18n.test.ts`：断言两个 dict 的 key 集合相等
3. 在使用处用 `t('your.key')`

---

## 11. Buttons 插件兼容性与 Stage 0 spike

### 11.1 风险陈述

整个项目最大的技术不确定性：**Buttons 插件能否在我们自定义 ItemView 中通过 `MarkdownRenderer.render()` 正常工作。**

具体不确定点：

1. **Markdown post processor 注册时机**：Buttons 是否对所有 `MarkdownRenderer.render` 都触发 post processor，还是只对 `MarkdownView` 类型 leaf 触发？
2. **block-id 引用解析**：源笔记内 `` `^button-essay` `` inline 引用依赖 metadata cache，自定义视图传 `sourcePath = file.path` 时能否正确查到同文件 block-id？
3. **按钮动作上下文**：按钮点击时 Buttons 插件用 `app.workspace.getActiveFile()` 决定上下文。我们的视图不是 active file，导致 `append`/`replace` 类按钮可能指向错文件。
4. **Component 生命周期**：`MarkdownRenderer.render` 的 component 参数传 `this`（ItemView）能否让 Buttons 的 child component 正确管理生命周期？

### 11.2 Stage 0 spike 范围（半天 ~ 1 天）

**目标**：以最小代码验证 3 项关键能力。**spike 不入主分支**，结束后 squash 删除或归档到 `experiments/` 分支。

**spike 代码骨架**（一个 main.ts，硬编码路径）：

```ts
// experimental
class SpikeView extends ItemView {
  getViewType() { return 'spike-view'; }
  getDisplayText() { return 'Spike'; }
  async onOpen() {
    const file = this.app.vault.getAbstractFileByPath('TestButtons.md') as TFile;
    const md = await this.app.vault.cachedRead(file);
    await MarkdownRenderer.render(this.app, md, this.contentEl, file.path, this);
  }
}
```

**TestButtons.md 内容**：

````markdown
```button
name 测试
type command
action Open today's daily note
```
^button-test

`button-test`
````

### 11.3 Stage 0 验收三项

| # | 验收点 | 通过判据 |
|---|---|---|
| 1 | 按钮渲染 | spike view 中能看到一个写着 "测试" 的按钮，而不是显示 ` ```button` 代码块 |
| 2 | command 类按钮可点击 | 点击 "测试" 按钮，Obsidian 真的打开了今日 daily note |
| 3 | block-id inline 引用 | 第二处 `` `button-test` `` 也渲染为同一个按钮（不是变成 inline code） |

### 11.4 Spike 失败的应对路线

| 失败项 | Plan B |
|---|---|
| #1 渲染失败 | 改路线为"嵌入 MarkdownView"：用 `WorkspaceLeaf.openFile(file, { state: { mode: 'preview' } })` 代替自定义 ItemView，CSS 隔离改用 `:has` 配合自定义标记 |
| #2 命令不可点击 | 调研 Buttons 插件源码看是否暴露 API；最坏情况通知用户：v0.1 不支持自定义 view 中的按钮动作 |
| #3 block-id 解析失败 | 退回"按钮直接散装写"模式（不用 inline 引用） |

### 11.5 已知限制（即使 spike 全过）

- **场景上下文**：`append`/`replace`/`prepend`/`swap`/`template` 等改文本类按钮，可能在面板视图中作用于源笔记本身而不是用户当前编辑的笔记。文档明确建议用户：**v0.1 中只在面板里放上下文无关的按钮**（command / link / URI / QuickAdd command / Templater command / Obsidian Git command）

---

## 12. 错误状态与边界场景对照表

整体取向 **P（明确报错）**，场景 7 例外为 Q（重命名跟随）。

| # | 场景 | 状态 | UI | 操作按钮 |
|---|---|---|---|---|
| 1 | `sourceNotePath` 为空 | `PATH_EMPTY` | 显示 t('error.PATH_EMPTY') | "打开设置"（跳到本插件设置页） |
| 2 | 路径不存在 | `NOT_FOUND` | 显示 t('error.NOT_FOUND', {detail: path}) | "打开设置"、"重试" |
| 3 | 路径是文件夹 | `IS_FOLDER` | 显示 t('error.IS_FOLDER', {detail: path}) | "打开设置" |
| 4 | 路径非 .md | `WRONG_TYPE` | 显示 t('error.WRONG_TYPE', {detail: path}) | "打开设置" |
| 5 | Buttons 插件未启用 | OK + banner | banner: t('error.BUTTONS_PLUGIN_MISSING')；下方仍渲染 markdown | banner 内 "打开社区插件市场"（用 `app.setting.open` + `app.setting.openTabById('community-plugins')`） |
| 6 | 源笔记被删除 | `NOT_FOUND` | 同 #2 | 同 #2 |
| 7 | 源笔记被重命名 | OK（自动跟随） | 监听 vault.on('rename')，写回 settings.sourceNotePath，refresh | — |
| 8 | 设置中清空路径 | `PATH_EMPTY` | 同 #1 | 同 #1 |

> 实现要点：错误状态由 `pathResolver.resolve()` 返回的 union type 驱动，`renderer.renderError()` 据此渲染。一切都是确定性的、可单测的。

---

## 13. 命令行为矩阵

整体取向 **P（保守、可预测）**，场景 9 取 **Q（v0.1 阻止多实例）**。

| # | 场景 | 行为 |
|---|---|---|
| 1 | 面板未打开 → `Toggle` | 在 `settings.sidebar` 配置位置打开 |
| 2 | 面板已打开在配置位置 → `Toggle` | 关闭 |
| 3 | 面板已打开但被拖到非配置位置 → `Toggle` | 关闭那个面板（不重新打开到原位置） |
| 4 | 面板在右侧 → `Open Left` | 关闭右侧实例，在左侧打开新实例 |
| 5 | 面板已在左侧 → `Open Left` | 仅 focus，不重开 |
| 6 | 对称：4/5 反过来对应 `Open Right` | 同理 |
| 7 | 面板未打开 → `Focus` | 按配置位置打开并 focus |
| 8 | 面板已打开 → `Focus` | 仅 focus，不切换状态 |
| 9 | 面板未打开 → `Refresh` | 静默 no-op（不自动打开；console.log 一个 debug 提示） |
| 10 | 面板已打开 → `Refresh` | 调用 `view.refresh()` |
| 11 | 用户手动复制了一个 view 实例 → 已存在 leaves >= 2 | 启动时 `enforceSingleInstance` 保留第一个、detach 其余；运行时如果发生（用户手动开第二个），不自动 detach（避免奇怪行为），但 Toggle 命令会关闭所有 |

---

## 14. 测试策略与验收清单

### 14.1 测试分层

- **L1 单元测试**（Vitest）：纯函数逻辑，不依赖 Obsidian API
- **L2**：跳过（性价比低）
- **L3 手动验收清单**：30 项，发布前必过

### 14.2 L1 单元测试范围

| 测试文件 | 覆盖模块 | 关键用例 |
|---|---|---|
| `tests/path-resolver.test.ts` | `path-resolver.ts` | 空路径、相对路径、根路径、文件夹、非 md、正常文件、normalizePath 边界 |
| `tests/migration.test.ts` | `migration.ts` | 空对象、缺 version、未来 version（向前兼容警告）、骨架不抛错 |
| `tests/debounce.test.ts` | `debounce.ts` | 单次调用、连续调用合并、多次调用最后一次胜出、清除 timer 正确 |
| `tests/i18n.test.ts` | `i18n/*.ts` | en/zh dict key 集合相等（forbid drift）、嵌套 lookup、interpolate 占位符替换、未知 key 返回原样 |

### 14.3 Vitest 配置（极简）

```ts
// vitest.config.ts
import { defineConfig } from 'vitest/config';
export default defineConfig({
  test: { globals: true, environment: 'node' },
});
```

```json
// package.json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest"
  }
}
```

### 14.4 L3 手动验收清单（30 项）

> 发布前在 Obsidian 1.5.0 + Buttons 插件最新版的 vault 中跑完。**全过才打 release tag。**

格式：每项 [操作步骤 / 预期结果 / 实际结果 / 通过] 四列，下面是范本（实施时建一份 markdown 表格）。

#### A 组：基础功能（10 项）

| # | 操作 | 预期 |
|---|---|---|
| A1 | 启用插件 → 命令面板搜 "Buttons Panel" | 看到 5 条命令 |
| A2 | 跑 `Toggle Buttons Panel` | 在配置 sidebar 打开面板 |
| A3 | 再跑 `Toggle` | 面板关闭 |
| A4 | 设置里改 `sidebar = 'right'`，再跑 `Toggle` | 在右侧栏打开 |
| A5 | 在源笔记里写 5 个 button + 5 个 inline 引用，刷新面板 | 看到 5 个真实按钮（不是代码块） |
| A6 | 点击 command 类按钮（如 "今日笔记"） | Obsidian 执行对应命令 |
| A7 | 跑 `Refresh Buttons Panel` 命令（面板已开） | 内容刷新 |
| A8 | 改设置里 `panelPadding = 12`，立即生效 | 面板 padding 变大 |
| A9 | 重启 Obsidian | 设置保留、面板状态保留（如 openOnStartup） |
| A10 | 跑 `Open Buttons Panel in Left Sidebar` 时面板在右侧 | 关闭右侧、左侧重开 |

#### B 组：样式隔离（5 项）

| # | 操作 | 预期 |
|---|---|---|
| B1 | 左侧栏同时开 Buttons Panel + Calendar + File Explorer | Buttons Panel 高度紧凑，Calendar/FE 高度不变 |
| B2 | 改 `panelPadding`、`buttonGridColumns` | 仅 Buttons Panel 变化，其他视图无影响 |
| B3 | 主编辑区开一篇 Markdown 笔记 | 笔记的 paragraph、heading、frontmatter 显示正常 |
| B4 | 关闭 `aggressiveLeafCompression` | 面板回到 Obsidian 默认最小高度 |
| B5 | 启用 `aggressiveLeafCompression` | 面板贴合内容高度 |

#### C 组：错误/边界（8 项，对应 §12）

| # | 操作 | 预期 |
|---|---|---|
| C1 | 设置中清空 `sourceNotePath`，刷新面板 | 显示 PATH_EMPTY 错误 + "打开设置" 按钮 |
| C2 | 设置中填一个不存在的路径 | 显示 NOT_FOUND 错误 |
| C3 | 设置中填一个文件夹路径 | 显示 IS_FOLDER 错误 |
| C4 | 设置中填一个 .canvas 文件 | 显示 WRONG_TYPE 错误 |
| C5 | 禁用 Buttons 插件，刷新面板 | 显示 banner，仍渲染普通 Markdown |
| C6 | 在 Obsidian 内删除源笔记 | 面板自动切到 NOT_FOUND（无需手动刷新） |
| C7 | 在 Obsidian 内重命名/移动源笔记 | 设置自动更新为新路径，面板正常显示 |
| C8 | 设置中清空路径后再填回 | 错误消失，正常渲染 |

#### D 组：视觉/主题（6 项）

| # | 操作 | 预期 |
|---|---|---|
| D1 | 切换到深色模式 | 按钮颜色、背景符合深色主题 |
| D2 | 切换到浅色模式 | 同理 |
| D3 | 切换到 Minimal 主题 | 不破坏 |
| D4 | 切换到 Things 主题 | 不破坏 |
| D5 | 切换到 AnuPpuccin 主题 | 不破坏 |
| D6 | 切换 Obsidian 界面语言（中→英→中） | 设置页和命令名跟随切换 |

#### E 组：自动行为（1 项）

| # | 操作 | 预期 |
|---|---|---|
| E1 | 主编辑区打开源笔记，输入新按钮代码并保存 | ≤ 1.5 秒后 Buttons Panel 自动出现新按钮 |

> 总计 10 + 5 + 8 + 6 + 1 = 30 项。

---

## 15. 构建、开发热重载、发布流程

### 15.1 工具链版本

| 工具 | 版本 | 来源 |
|---|---|---|
| Node.js | 18+（推荐 20 LTS） | nodejs.org |
| npm | 自带 | — |
| TypeScript | `^5.4.x`（与 obsidian-sample-plugin 对齐） | npm |
| esbuild | 最新 stable | npm |
| obsidian | `^1.5.0` | npm，作为 devDependency |

### 15.2 关键 npm scripts

```json
{
  "scripts": {
    "dev": "node esbuild.config.mjs",
    "build": "tsc -noEmit -skipLibCheck && node esbuild.config.mjs production",
    "version": "node version-bump.mjs && git add manifest.json versions.json",
    "test": "vitest run",
    "test:watch": "vitest"
  }
}
```

### 15.3 esbuild.config.mjs

```js
import esbuild from 'esbuild';
import process from 'process';
import builtins from 'builtin-modules';
import fs from 'fs';
import path from 'path';

const banner = `/* Buttons Panel — built ${new Date().toISOString()} */`;
const prod = process.argv[2] === 'production';

// 开发模式可选：通过 .env.local 配置 OUTDIR=<vault>/.obsidian/plugins/buttons-panel
const outDir = process.env.OUTDIR ?? '.';
const cssOut = path.join(outDir, 'styles.css');
const jsOut = path.join(outDir, 'main.js');

const ctx = await esbuild.context({
  entryPoints: ['main.ts'],
  bundle: true,
  external: ['obsidian', 'electron', '@codemirror/*', ...builtins],
  format: 'cjs',
  target: 'es2020',
  logLevel: 'info',
  sourcemap: prod ? false : 'inline',
  treeShaking: true,
  outfile: jsOut,
  banner: { js: banner },
});

// 简易 CSS 合并（src/styles/*.css → outDir/styles.css）
function buildCss() {
  const css = fs.readFileSync('src/styles/styles.css', 'utf8');
  fs.writeFileSync(cssOut, banner + '\n' + css);
}
buildCss();

if (prod) {
  await ctx.rebuild();
  await ctx.dispose();
} else {
  await ctx.watch();
  fs.watch('src/styles/styles.css', buildCss);
}
```

### 15.4 开发热重载流程

1. 装社区插件 [Hot Reload](https://github.com/pjeby/hot-reload) 到你日常用的 vault
2. 项目根创建 `.env.local`：
   ```text
   OUTDIR=D:\path\to\YourVault\.obsidian\plugins\buttons-panel
   ```
3. 第一次开发前，把 `manifest.json` 软链或拷贝到 `OUTDIR`
4. 跑 `npm run dev`
5. 改 ts/css → esbuild watch 触发 → 文件落到 `OUTDIR/main.js` → Hot Reload 插件检测到 → Obsidian 自动重载本插件
6. 体感 1-2 秒

### 15.5 SemVer 与 version-bump.mjs

```js
// version-bump.mjs
import { readFileSync, writeFileSync } from 'fs';

const targetVersion = process.env.npm_package_version;

const manifest = JSON.parse(readFileSync('manifest.json', 'utf8'));
const { minAppVersion } = manifest;
manifest.version = targetVersion;
writeFileSync('manifest.json', JSON.stringify(manifest, null, '\t'));

const versions = JSON.parse(readFileSync('versions.json', 'utf8'));
versions[targetVersion] = minAppVersion;
writeFileSync('versions.json', JSON.stringify(versions, null, '\t'));
```

### 15.6 GitHub Actions release.yml

```yaml
name: Release Obsidian Plugin

on:
  push:
    tags:
      - "*"

jobs:
  build:
    runs-on: ubuntu-latest
    permissions:
      contents: write
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm ci
      - run: npm run build
      - name: Create Release
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          tag: ${{ github.ref_name }}
        run: |
          gh release create "$tag" \
            --title="$tag" \
            --notes="See changelog." \
            --draft \
            main.js manifest.json styles.css
```

> 注意：tag 不带 `v` 前缀（社区插件市场要求）。

### 15.7 仓库根 .gitignore 关键项

```text
node_modules/
main.js
styles.css
data.json
*.local.*
.env.local
```

> 构建产物 `main.js` / `styles.css` 不入 git，仅 release 临时产出。

### 15.8 README.md 框架

```markdown
# Buttons Panel

> Render a compact Buttons-powered Markdown panel in the Obsidian sidebar.

[中文](./README.zh.md)

## What it does
... (1-2 paragraphs)

## How it works
... (1 short paragraph: relies on Buttons plugin + MarkdownRenderer)

## Requirements
- Obsidian 1.5.0+
- Buttons plugin enabled (recommended)

## Install
- Community Plugins: search "Buttons Panel" (after community store accepts)
- Manual: download `main.js`, `manifest.json`, `styles.css` from latest release into `<vault>/.obsidian/plugins/buttons-panel/`

## Quick start
1. Create a markdown note with Buttons-style buttons
2. Set its path in plugin settings
3. Run "Toggle Buttons Panel" command

## Settings
... (table of all settings, English)

## Known limitations
- Desktop only (mobile coming later)
- Buttons that depend on "current note" may behave unexpectedly...

## License
MIT
```

---

## 16. 风险与已知限制

### 16.1 已识别风险

| # | 风险 | 等级 | 应对 |
|---|---|---|---|
| 1 | Buttons 插件 post processor 在自定义 ItemView 不触发 | 高 | Stage 0 spike 验证；失败走 Plan B（嵌入 MarkdownView） |
| 2 | block-id inline 引用解析失败 | 中 | spike 验证；失败 → 文档建议用户不用 inline 引用 |
| 3 | `append`/`replace` 类按钮上下文错位 | 中 | 文档说明；建议用户只放上下文无关按钮 |
| 4 | Obsidian 外层 Pane 有内置最小高度 | 低 | `aggressiveLeafCompression` + `:has()` 兜底 |
| 5 | `:has()` 在某些老主题下视觉副作用 | 低 | 提供 `aggressiveLeafCompression` 开关 |
| 6 | 用户手动开多实例破坏单实例假设 | 低 | 启动时 `enforceSingleInstance`；运行时不强制 |
| 7 | 设置 schema 大改导致老用户数据丢失 | 低（首发版本无老用户） | `version` + 迁移骨架 |
| 8 | i18n key drift（en 加了 zh 没加） | 低 | `tests/i18n.test.ts` 自动检查 |

### 16.2 已知限制（v0.1）

- 仅桌面端
- 不支持多面板
- 上下文相关按钮（append / replace 等）行为不保证
- 不强制阻止用户手动开多个实例（仅启动时清理）
- `showOnlyButtons` 模式不支持

---

## 17. 后续版本路线

### v0.2（短期）

- `showOnlyButtons` 模式：智能过滤非按钮元素
- 多面板支持（多套源笔记，每套独立 view 实例）
- 面板右键菜单（刷新 / 设置 / 切换 sidebar）
- 自动监听设置文件变化（开发用）

### v0.3（中期）

- 移动端布局
- 快捷键直接聚焦特定按钮
- 状态提示（同步中、命令不可用）
- 导入/导出插件配置

### v0.4+（长期）

- 拖拽重排按钮（如果与 Buttons 插件协调）
- 主题预设（不同色彩方案）

---

## 18. 附录

### 18.1 PRD → 本文档变更点对照表

| PRD 字段 | PRD 默认值 / 描述 | 本文档变更 | 原因 |
|---|---|---|---|
| 插件名 | "Sidebar Buttons" / "Compact Sidebar Buttons Host" | 统一为 **Buttons Panel** | 命名一致性 |
| 插件 ID | `compact-sidebar-buttons-host` | `buttons-panel` | 简洁 |
| view type | `compact-sidebar-buttons-host-view` | `buttons-panel-view` | 同上 |
| `panelHeightMode` | `'auto' \| 'fixed'`，默认 `fixed` | **删除字段** | 改为始终自适应 |
| `fixedPanelHeight` | 110 | **删除字段** | 同上 |
| `maxPanelHeight` | — | **新增可选字段**，默认 0 | 自适应模式下保留安全上限 |
| `showOnlyButtons` | false | **删除字段** | v0.1 不实现 |
| `autoRefresh` | false | **改默认值为 true** | 用户期望编辑后自动更新 |
| `version` | 1 | 保留 | 迁移骨架预留 |

### 18.2 首次提交 Obsidian Community Plugins 清单

> 一次性流程，按顺序执行：

1. **仓库准备**：
   - [ ] 仓库根有：`manifest.json`、`README.md`、`LICENSE`、`versions.json`
   - [ ] 仓库根**无**：`main.js`、`styles.css`、`data.json`、`node_modules/`（已在 .gitignore）
   - [ ] 至少有一个发布过的 GitHub Release，资产含 `main.js`/`manifest.json`/`styles.css`

2. **Fork & PR `obsidianmd/obsidian-releases`**：
   - [ ] Fork [`obsidianmd/obsidian-releases`](https://github.com/obsidianmd/obsidian-releases)
   - [ ] 编辑 `community-plugins.json`，**追加**到列表末尾：
     ```json
     {
       "id": "buttons-panel",
       "name": "Buttons Panel",
       "author": "JerryG",
       "description": "Render a compact Buttons-powered Markdown panel in the Obsidian sidebar.",
       "repo": "JerryG94/obsidian-buttons-panel"
     }
     ```
   - [ ] 提交 PR，标题：`Add Buttons Panel plugin`
   - [ ] 等机器人 + 人工 review（1–4 周）
   - [ ] 按 reviewer 反馈修改（常见反馈：description 过长、ID 不规范、缺少 desktopOnly 等）

3. **合并后**：
   - [ ] 在 README 加上"Available in the community plugins store" 徽章

### 18.3 PR 模板（社区市场提交用）

```text
# I am submitting a new Community Plugin

## Repo URL
Link to my plugin: https://github.com/JerryG94/obsidian-buttons-panel

## Release Checklist
- [ ] I have tested the plugin on
  - [x] Windows
  - [ ] macOS  (TBD)
  - [ ] Linux  (TBD)
- [x] My GitHub release contains all required files
  - [x] main.js
  - [x] manifest.json
  - [x] styles.css
- [x] GitHub release name matches the exact version number specified in my manifest.json (
      not v0.1.0 but 0.1.0)
- [x] manifest.json contains: id, name, version, minAppVersion, description, author, isDesktopOnly
- [x] minAppVersion = 1.5.0
- [x] My latest release is at least v1.0.0  → N/A, first release is 0.1.0
- [ ] I have tested with Obsidian latest stable
- [x] My README.md describes the plugin's purpose and usage
- [x] I have updated my README.md
- [x] My plugin doesn't include `console.log` or other unnecessary logging
- [x] I have used `instanceof` to check types and not relied on duck-typing
- [x] I have NOT used `var` (only `const`/`let`)
```

### 18.4 字段对照：PRD 设置 vs 本文档设置

| PRD 字段路径 | 本文档字段路径 | 备注 |
|---|---|---|
| `sourceNotePath` | `sourceNotePath` | 不变 |
| `sidebar` | `sidebar` | 不变 |
| `panelHeightMode` | — | 删除 |
| `fixedPanelHeight` | — | 删除 |
| `aggressiveLeafCompression` | `aggressiveLeafCompression` | 不变 |
| — | `maxPanelHeight` | 新增 |
| `layout.panelPadding` | `layout.panelPadding` | 不变 |
| `layout.contentGap` | `layout.contentGap` | 不变 |
| `layout.buttonGridColumns` | `layout.buttonGridColumns` | 不变；语义改为"目标列数"，CSS Grid auto-fit 实现 |
| `layout.compactMode` | `layout.compactMode` | 不变 |
| `layout.hideOverflow` | `layout.hideOverflow` | 不变 |
| `display.hideViewHeader` | `display.hideViewHeader` | 不变 |
| `display.hideFrontmatter` | `display.hideFrontmatter` | 不变 |
| `display.hideInlineTitle` | `display.hideInlineTitle` | 不变 |
| `display.hideHeadings` | `display.hideHeadings` | 不变 |
| `display.hideParagraphs` | `display.hideParagraphs` | 不变；语义补充：排除含 button 的 p |
| `display.hideHr` | `display.hideHr` | 不变 |
| `display.showOnlyButtons` | — | 删除 |
| `autoRefresh` | `autoRefresh` | 默认值改 false → true |
| — | `openOnStartup` | 新增 |

---

**文档结束。**
