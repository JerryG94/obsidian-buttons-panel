# Obsidian 紧凑侧边栏 Buttons 容器插件需求文档

## 1. 文档信息

| 项目 | 内容 |
|---|---|
| 插件暂定名称 | Sidebar Buttons                                             |
| 中文名称 | 侧边栏 Buttons |
| 文档类型 | 产品需求文档（Product Requirements Document, PRD） |
| 目标平台 | Obsidian Desktop |
| 主要依赖 | Buttons 插件 |
| 核心目标 | 在 Obsidian 侧边栏中以紧凑面板形式显示现有 Buttons 插件按钮 |

---

## 2. 需求背景

当前用户在 Obsidian 中使用一篇 Markdown 笔记作为快捷按钮面板，并将该笔记固定到左侧边栏。该笔记中通过 Buttons 插件定义若干快捷按钮，例如：

```text
随笔  摘录  待办  灵感
同步  卡片  科研  整理
```

现有方案存在以下问题：

1. 侧边栏固定的是一整篇 Markdown 笔记，而不是一个真正的独立按钮组件。
2. Markdown 笔记视图包含标题栏、正文区域、属性区域、默认内边距和最小高度。
3. 即使笔记中只有两排按钮，侧边栏卡片仍然会保留大量空白区域。
4. 使用 CSS Snippet 可以临时压缩卡片高度，但容易误伤日历、文件管理器、搜索、反向链接等其他侧边栏视图。
5. Commander 等插件主要面向 Ribbon、标题栏、状态栏、菜单，不适合在侧边栏内容区显示两排紧凑按钮。
6. 用户已经有基于 Buttons 插件的按钮定义，不希望重新实现一套按钮系统。

因此，需要开发一款专门的 Obsidian 插件：

```text
它不重新定义按钮，也不重新实现按钮动作；
它只负责在侧边栏中提供一个紧凑、独立、样式隔离的 Buttons 渲染容器。
```

---

## 3. 插件定位

本插件不是新的按钮插件，而是一个 **Buttons 容器插件（Buttons Host Plugin）**。

它的职责是：

1. 注册一个 Obsidian 自定义侧边栏视图（Custom Sidebar View）。
2. 读取用户指定的一篇 Markdown 按钮源笔记。
3. 调用 Obsidian Markdown 渲染机制渲染该笔记内容。
4. 让 Buttons 插件继续处理原有的按钮语法和按钮动作。
5. 对该侧边栏视图进行紧凑化布局控制。
6. 确保 CSS 只作用于本插件视图，不影响其他侧边栏视图。

插件不负责：

1. 重新实现 Buttons 插件的按钮语法。
2. 重新实现命令执行、链接打开、模板创建、追加文本、替换文本等按钮动作。
3. 替代 QuickAdd、Templater、Advanced URI、Obsidian Git 等插件。
4. 修改 Obsidian 全局侧边栏行为。

---

## 4. 一句话需求摘要

开发一个 Obsidian 侧边栏 Buttons 容器插件：它读取一篇用户指定的 Markdown 按钮源笔记，并在左侧栏或右侧栏以紧凑面板形式渲染其中的 Buttons 插件按钮；插件只负责面板显示、高度压缩和样式隔离，不重新实现 Buttons 插件的按钮语法和动作逻辑。

---

## 5. 用户目标

用户希望实现以下效果：

```text
在 Obsidian 左侧边栏中，紧凑显示两排快捷按钮。
按钮仍然采用现有 Buttons 插件定义。
按钮面板高度应尽可能贴合按钮内容。
按钮下方不应出现大面积空白。
该面板不应影响日历、文件管理器或其他固定视图。
```

目标视觉效果示例：

```text
┌────────────────────────────┐
│ 随笔  摘录  待办  灵感      │
│ 同步  卡片  科研  整理      │
└────────────────────────────┘
```

---

## 6. 核心设计原则

### 6.1 保留 Buttons 插件原有定义

本插件应继续使用 Buttons 插件的原有按钮定义方式。

用户现有的按钮源笔记可以继续使用类似以下形式：

````markdown
```button
name 随笔
type command
action QuickAdd: 随笔
color default
```
^button-essay

```button
name 摘录
type command
action QuickAdd: 摘录
color default
```
^button-excerpt

`button-essay` `button-excerpt`
````

具体语法以 Buttons 插件自身规则为准。

本插件不解析 Buttons 语法，不维护按钮动作逻辑。

---

### 6.2 插件只作为渲染容器

本插件的核心功能是：

```text
读取指定 Markdown 笔记
→ 渲染到自定义侧边栏视图
→ 通过样式压缩显示区域
→ 让 Buttons 插件完成按钮渲染和动作执行
```

推荐技术路线：

```ts
MarkdownRenderer.render(
  this.app,
  markdownContent,
  containerEl,
  sourcePath,
  this
);
```

目的：通过 Obsidian 原生 Markdown 渲染流程，让 Buttons 插件的 Markdown Post Processor 有机会正常处理按钮代码块和 inline button。

---

### 6.3 样式必须精准隔离

本插件 CSS 必须只作用于本插件视图。

推荐选择器范围：

```css
.workspace-leaf-content[data-type="compact-sidebar-buttons-host-view"]
```

或插件根元素：

```css
.compact-sidebar-buttons-host-view
```

如果需要压缩 Obsidian 外层 Leaf，也必须限制在本插件视图范围内：

```css
.mod-left-split .workspace-leaf:has(.workspace-leaf-content[data-type="compact-sidebar-buttons-host-view"]) {
  min-height: var(--csbh-panel-height);
  height: var(--csbh-panel-height);
  max-height: var(--csbh-panel-height);
  flex: 0 0 var(--csbh-panel-height);
}
```

禁止使用以下全局选择器：

```css
.mod-left-split .workspace-leaf {
  min-height: 110px;
}
```

原因：这会影响左侧栏中的日历、文件管理器、搜索、反向链接、其他固定笔记等视图。

---

## 7. 功能需求

## 7.1 自定义侧边栏视图

插件应注册一个自定义视图：

```ts
const VIEW_TYPE_COMPACT_BUTTONS_HOST = "compact-sidebar-buttons-host-view";
```

该视图用于显示按钮源笔记渲染后的内容。

支持打开位置：

| 位置 | 是否支持 | 说明 |
|---|---:|---|
| 左侧栏 Left Sidebar | 必须支持 | 默认位置 |
| 右侧栏 Right Sidebar | 必须支持 | 可选位置 |
| 主编辑区 Main Workspace | 可选支持 | 主要用于调试或备用 |

---

## 7.2 按钮源笔记配置

插件设置页应允许用户指定按钮源笔记路径。

配置项：

```ts
interface SourceNoteSettings {
  sourceNotePath: string;
}
```

示例：

```json
{
  "sourceNotePath": "00-系统/侧边栏快捷按钮.md"
}
```

插件行为：

1. 启动时读取 `sourceNotePath` 对应的 Markdown 文件。
2. 如果文件存在，将其渲染到插件侧边栏视图中。
3. 如果文件不存在，显示错误提示和设置入口。
4. 如果文件内容更新，支持手动刷新或自动刷新。

---

## 7.3 Markdown 渲染

插件应使用 Obsidian 的 Markdown 渲染机制，而不是自行解析 Markdown。

目标：

1. 保留 Buttons 插件的按钮渲染能力。
2. 保留 inline button、button block-id 等既有写法。
3. 降低与 Buttons 插件内部 API 的耦合。
4. 减少开发工作量。

渲染流程：

```text
读取按钮源笔记内容
→ 清空插件视图容器
→ 调用 MarkdownRenderer.render()
→ 应用插件专属 CSS
→ 显示紧凑按钮面板
```

---

## 7.4 面板高度控制

插件应支持对按钮面板高度进行控制。

配置项：

```ts
interface PanelHeightSettings {
  panelHeightMode: "auto" | "fixed";
  fixedPanelHeight: number;
  aggressiveLeafCompression: boolean;
}
```

默认值：

```json
{
  "panelHeightMode": "fixed",
  "fixedPanelHeight": 110,
  "aggressiveLeafCompression": true
}
```

说明：

| 配置项 | 说明 |
|---|---|
| `auto` | 面板高度尽量由内容决定 |
| `fixed` | 使用固定高度，例如 100px、110px、120px |
| `aggressiveLeafCompression` | 是否使用增强 CSS 压缩外层 workspace leaf |

注意：Obsidian 的 Workspace Pane 可能存在内置最小高度限制，因此插件应尽量压缩，但不能承诺在所有主题和布局下完全消除最小高度限制。

---

## 7.5 紧凑布局控制

插件应提供以下布局设置：

```ts
interface LayoutSettings {
  panelPadding: number;
  contentGap: number;
  buttonGridColumns: number;
  compactMode: boolean;
  hideOverflow: boolean;
}
```

默认值：

```json
{
  "panelPadding": 6,
  "contentGap": 6,
  "buttonGridColumns": 4,
  "compactMode": true,
  "hideOverflow": true
}
```

说明：

| 设置项 | 默认值 | 说明 |
|---|---:|---|
| `panelPadding` | 6 | 面板内边距 |
| `contentGap` | 6 | 内容间距 |
| `buttonGridColumns` | 4 | 推荐 4 列，形成两排按钮 |
| `compactMode` | true | 启用紧凑样式 |
| `hideOverflow` | true | 隐藏超出面板高度的内容 |

---

## 7.6 隐藏非按钮内容

由于按钮源笔记可能包含标题、说明文字、空行、属性区等内容，插件应提供选项控制显示范围。

配置项：

```ts
interface DisplayFilterSettings {
  hideViewHeader: boolean;
  hideFrontmatter: boolean;
  hideInlineTitle: boolean;
  hideHeadings: boolean;
  hideParagraphs: boolean;
  hideHr: boolean;
  showOnlyButtons: boolean;
}
```

默认值：

```json
{
  "hideViewHeader": true,
  "hideFrontmatter": true,
  "hideInlineTitle": true,
  "hideHeadings": true,
  "hideParagraphs": false,
  "hideHr": false,
  "showOnlyButtons": false
}
```

MVP 阶段建议：

```text
要求按钮源笔记尽量只放按钮，不放正文说明。
插件只做基础隐藏，不做复杂内容识别。
```

后续版本可加入 `showOnlyButtons`，尝试隐藏非 button 相关元素。

---

## 7.7 刷新机制

插件应支持刷新按钮面板。

需要注册命令：

```text
Refresh Compact Sidebar Buttons Host
```

刷新逻辑：

```text
重新读取按钮源笔记
→ 清空当前视图
→ 重新渲染 Markdown
→ 重新应用样式
```

可选增强：

1. 当按钮源笔记被修改时自动刷新。
2. 当插件设置变化时自动刷新。
3. 提供右上角刷新按钮。

---

## 7.8 打开与切换命令

插件应注册以下命令：

```text
Open Compact Sidebar Buttons Host in Left Sidebar
Open Compact Sidebar Buttons Host in Right Sidebar
Toggle Compact Sidebar Buttons Host
Focus Compact Sidebar Buttons Host
Refresh Compact Sidebar Buttons Host
```

其中最重要的是：

```text
Toggle Compact Sidebar Buttons Host
```

行为：

```text
如果面板已打开，则关闭；
如果面板未打开，则按照设置中的 sidebar 位置打开。
```

---

## 7.9 Buttons 插件检测

由于本插件依赖 Buttons 插件完成按钮渲染，因此应在启动或渲染时检测 Buttons 插件是否安装并启用。

需求：

1. 如果检测到 Buttons 插件可用，正常渲染按钮面板。
2. 如果未检测到 Buttons 插件，显示提示：

```text
未检测到 Buttons 插件，按钮源笔记可能无法渲染为按钮。请安装并启用 Buttons 插件。
```

3. 不强制阻止插件运行，因为用户可能只想渲染普通 Markdown 内容。

---

## 7.10 设置页

插件设置页应至少包含以下配置：

| 分类 | 配置项 |
|---|---|
| 来源设置 | 按钮源笔记路径 |
| 位置设置 | 默认打开到左侧栏或右侧栏 |
| 高度设置 | auto / fixed，高度数值，是否强制压缩 Leaf |
| 布局设置 | padding、gap、列数、是否隐藏溢出 |
| 显示设置 | 是否隐藏标题栏、属性区、内联标题、标题、段落等 |
| 依赖状态 | Buttons 插件是否检测到 |
| 操作 | 打开面板、刷新面板、重置默认设置 |

---

## 8. 非功能需求

## 8.1 样式隔离

插件必须保证不影响其他 Obsidian 视图。

重点不应影响：

```text
Calendar 日历视图
File Explorer 文件管理器
Search 搜索面板
Backlinks 反向链接
Outgoing Links 出链
Bookmarks 书签
Graph View 图谱
其他固定 Markdown 笔记
其他第三方插件视图
```

验收标准：

```text
调整本插件面板高度时，其他侧边栏视图高度和样式不发生变化。
```

---

## 8.2 主题兼容

插件样式应使用 Obsidian CSS 变量，避免写死颜色。

推荐变量：

```css
var(--background-secondary)
var(--background-primary)
var(--background-modifier-hover)
var(--background-modifier-border)
var(--text-normal)
var(--text-muted)
var(--interactive-accent)
var(--radius-s)
var(--font-ui-small)
```

插件应兼容：

```text
默认主题
浅色模式
深色模式
常见第三方主题
```

---

## 8.3 性能要求

插件应保持轻量：

1. 不进行持续轮询。
2. 不监听全局文件变化，除非启用自动刷新。
3. 不重复渲染不必要的内容。
4. 设置变更或源笔记变更时才重新渲染。
5. 按钮动作由 Buttons 插件处理，本插件不额外拦截点击事件。

---

## 8.4 桌面端优先

MVP 阶段只要求支持 Obsidian Desktop。

移动端支持作为后续增强功能。

原因：

```text
Obsidian Mobile 的侧边栏结构与桌面端不同，紧凑面板的交互和布局需要单独设计。
```

---

## 9. 推荐技术实现

## 9.1 插件目录结构

```text
compact-sidebar-buttons-host/
├── manifest.json
├── package.json
├── tsconfig.json
├── esbuild.config.mjs
├── main.ts
├── styles.css
└── README.md
```

---

## 9.2 Manifest 示例

```json
{
  "id": "compact-sidebar-buttons-host",
  "name": "Compact Sidebar Buttons Host",
  "version": "0.1.0",
  "minAppVersion": "1.5.0",
  "description": "Render a compact Buttons-powered Markdown panel in the Obsidian sidebar.",
  "author": "JerryG",
  "isDesktopOnly": true
}
```

---

## 9.3 设置数据结构

```ts
interface CompactSidebarButtonsHostSettings {
  version: number;
  sourceNotePath: string;
  sidebar: "left" | "right";
  panelHeightMode: "auto" | "fixed";
  fixedPanelHeight: number;
  aggressiveLeafCompression: boolean;
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
    showOnlyButtons: boolean;
  };
  autoRefresh: boolean;
}
```

默认设置：

```ts
const DEFAULT_SETTINGS: CompactSidebarButtonsHostSettings = {
  version: 1,
  sourceNotePath: "00-系统/侧边栏快捷按钮.md",
  sidebar: "left",
  panelHeightMode: "fixed",
  fixedPanelHeight: 110,
  aggressiveLeafCompression: true,
  layout: {
    panelPadding: 6,
    contentGap: 6,
    buttonGridColumns: 4,
    compactMode: true,
    hideOverflow: true
  },
  display: {
    hideViewHeader: true,
    hideFrontmatter: true,
    hideInlineTitle: true,
    hideHeadings: true,
    hideParagraphs: false,
    hideHr: false,
    showOnlyButtons: false
  },
  autoRefresh: false
};
```

---

## 9.4 视图根元素建议

插件渲染后 HTML 结构建议：

```html
<div class="compact-sidebar-buttons-host-view">
  <div class="compact-sidebar-buttons-host-rendered markdown-preview-view">
    <!-- MarkdownRenderer 渲染后的内容 -->
  </div>
</div>
```

---

## 9.5 CSS 作用范围建议

基础样式：

```css
.compact-sidebar-buttons-host-view {
  padding: var(--csbh-panel-padding, 6px);
  overflow: hidden;
  background: var(--background-secondary);
}

.compact-sidebar-buttons-host-rendered {
  padding: 0 !important;
  margin: 0 !important;
  overflow: hidden;
}

.compact-sidebar-buttons-host-rendered .markdown-preview-sizer {
  min-height: 0 !important;
  padding: 0 !important;
  margin: 0 !important;
}
```

增强压缩外层 Leaf：

```css
.mod-left-split .workspace-leaf:has(.workspace-leaf-content[data-type="compact-sidebar-buttons-host-view"]) {
  min-height: var(--csbh-panel-height, 110px) !important;
  height: var(--csbh-panel-height, 110px) !important;
  max-height: var(--csbh-panel-height, 110px) !important;
  flex: 0 0 var(--csbh-panel-height, 110px) !important;
}
```

注意：增强压缩应通过设置项控制开关。

---

## 10. MVP 范围

第一版只做以下功能：

1. 注册自定义侧边栏视图。
2. 支持打开到左侧栏。
3. 支持配置按钮源笔记路径。
4. 读取并渲染按钮源笔记内容。
5. 通过 MarkdownRenderer 让 Buttons 插件处理按钮。
6. 提供固定面板高度设置。
7. 提供基础紧凑 CSS。
8. 提供刷新命令。
9. 样式只作用于本插件视图。
10. 检测 Buttons 插件是否启用。

MVP 不做：

1. 自研按钮系统。
2. 按钮动作配置器。
3. 命令搜索器。
4. 拖拽排序。
5. 多套按钮面板。
6. 移动端适配。
7. 复杂模板创建逻辑。
8. 复杂 show-only-buttons 解析器。

---

## 11. 后续增强功能

后续版本可以考虑：

1. 选择按钮源笔记时提供文件选择器。
2. 自动监听按钮源笔记变化并刷新。
3. 支持多套按钮面板。
4. 支持不同按钮源笔记绑定到不同侧边栏。
5. 支持导入 / 导出插件配置。
6. 支持仅显示 Buttons 元素，自动隐藏普通 Markdown 文本。
7. 支持面板右键菜单。
8. 支持状态提示，例如同步中、命令不可用。
9. 支持快捷键聚焦指定按钮面板。
10. 支持移动端专用布局。

---

## 12. 风险与注意事项

## 12.1 Buttons 插件渲染兼容性

风险：Buttons 插件是否能在自定义 View 中通过 MarkdownRenderer 正常渲染，需要实际测试。

解决策略：

1. 不直接调用 Buttons 插件内部 API。
2. 优先使用 Obsidian MarkdownRenderer。
3. 在 README 中说明本插件依赖 Buttons 插件的 Markdown 渲染能力。
4. 对常见 Buttons 类型进行测试。

---

## 12.2 当前文件上下文问题

某些 Buttons 动作可能依赖“当前笔记”。

在本插件视图中，Buttons 插件可能会将按钮源笔记识别为当前源文件，而不是主编辑区正在打开的笔记。

需要测试的按钮类型包括：

```text
append
prepend
replace
remove
swap
template
templater
```

建议 MVP 中优先支持更稳定的按钮类型：

```text
command
link
URI
QuickAdd command
Templater command
Obsidian Git command
```

---

## 12.3 Obsidian 外层 Pane 最小高度限制

风险：即使插件 CSS 精准作用于自身视图，Obsidian Workspace 仍可能保留外层最小高度。

解决策略：

1. 使用内部紧凑布局作为基础。
2. 提供 `aggressiveLeafCompression` 设置项。
3. 使用 `:has()` 选择器精准压缩本插件 Leaf。
4. 在插件说明中明确：不同主题和 Obsidian 版本下最小高度可能略有差异。

---

## 12.4 CSS `:has()` 兼容性

Obsidian Desktop 基于 Electron，现代版本通常支持 `:has()`，但仍需保留不依赖 `:has()` 的基础样式。

策略：

```text
基础样式：只控制插件内部容器。
增强样式：使用 :has() 压缩外层 Leaf。
设置项：启用 / 关闭强制面板高度压缩。
```

---

## 13. 验收标准

## 13.1 基础功能验收

| 项目 | 验收标准 |
|---|---|
| 侧边栏视图 | 可以在左侧栏打开独立插件面板 |
| 源笔记读取 | 可以读取指定 Markdown 按钮源笔记 |
| Buttons 渲染 | 源笔记中的 Buttons 按钮可以正常显示 |
| 按钮点击 | 常见 command 类型按钮可以正常执行 |
| 高度控制 | 面板高度明显小于固定整篇 Markdown 笔记的高度 |
| 刷新功能 | 修改源笔记后可以通过命令刷新面板 |
| 设置保存 | 重启 Obsidian 后配置不丢失 |

---

## 13.2 样式隔离验收

测试步骤：

1. 左侧栏同时打开以下视图：
   - 文件管理器
   - 日历
   - Compact Sidebar Buttons Host
2. 调整插件面板高度为 100px、110px、120px。
3. 检查日历和文件管理器是否发生样式变化。
4. 检查其他固定 Markdown 笔记是否被压缩。
5. 检查右侧栏视图是否受到影响。

预期结果：

```text
只有 Compact Sidebar Buttons Host 面板高度发生变化。
日历、文件管理器、搜索、反向链接、其他固定笔记均不受影响。
```

---

## 13.3 视觉验收

目标效果：

1. 面板只显示按钮区域。
2. 不显示多余笔记标题。
3. 不显示大面积空白。
4. 两排按钮能够紧凑排列。
5. 按钮外观与当前 Obsidian 主题协调。
6. 深色模式和浅色模式均可读。

---

## 14. 推荐开发路线

## 第一阶段：原型版

目标：验证技术可行性。

任务：

1. 注册自定义视图。
2. 写死一个按钮源笔记路径。
3. 渲染该笔记内容。
4. 测试 Buttons 插件是否正常接管渲染。
5. 用 CSS 压缩视图高度。

---

## 第二阶段：MVP 版

目标：形成可日常使用的插件。

任务：

1. 增加设置页。
2. 支持用户配置源笔记路径。
3. 支持设置面板高度。
4. 支持打开到左侧栏或右侧栏。
5. 支持刷新命令。
6. 支持 Buttons 插件检测。
7. 完成基础样式隔离。

---

## 第三阶段：增强版

目标：提升易用性和扩展性。

任务：

1. 文件选择器选择按钮源笔记。
2. 自动刷新。
3. 多面板支持。
4. 导入 / 导出配置。
5. 更强的 show-only-buttons 模式。
6. 移动端适配。

---

## 15. 最终产品定义

Sidebar Buttons是一个 Obsidian 侧边栏 Buttons 容器插件。它不重新实现按钮系统，而是读取用户指定的 Markdown 按钮源笔记，并通过 Obsidian MarkdownRenderer 在自定义侧边栏视图中渲染其内容，使 Buttons 插件继续负责按钮的显示和动作执行。插件重点解决固定 Markdown 笔记作为按钮面板时高度过大、空白过多、CSS 容易误伤其他视图的问题。

最终目标：

```text
让用户在 Obsidian 侧边栏中获得一个真正紧凑、独立、可控、样式隔离的快捷按钮面板，同时继续复用现有 Buttons 插件按钮定义。
```
