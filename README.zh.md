# Buttons Panel

> 在 Obsidian 侧边栏中渲染一个紧凑的、由 Buttons 驱动的 Markdown 面板。

[English](./README.md)

## 这是什么
Buttons Panel 是一个仅限桌面端的 Obsidian 插件，它将用户指定的 Markdown 笔记（按钮源笔记）托管在一个紧凑的、样式隔离的侧边栏视图中。本插件不解析按钮语法——它依赖现有的社区插件 [Buttons](https://github.com/shabegom/buttons) 来渲染和执行按钮。Buttons Panel 在此扮演容器/宿主插件的角色。

## 工作原理
插件注册一个自定义 ItemView，并通过 `MarkdownRenderer.render()` 渲染按钮源笔记，从而让 Buttons 插件的 Markdown post processor 像在普通预览模式下一样识别并处理按钮代码块和内联引用。

## 运行环境
- Obsidian 1.5.0+
- 已启用 Buttons 插件（推荐）

## 安装
- 社区插件市场：搜索"Buttons Panel"（待社区商店审核通过后可用）
- 手动安装：从最新 GitHub Release 下载 `main.js`、`manifest.json`、`styles.css`，放入 `<vault>/.obsidian/plugins/buttons-panel/`

## 快速上手
1. 创建一个包含 Buttons 风格按钮的 Markdown 笔记（即按钮源笔记）
2. 在插件设置中填写该笔记的路径
3. 在命令面板中执行"Toggle Buttons Panel"

## 设置
完整配置项说明请参阅 [docs/design.md](./docs/design.md)。

## 已知限制
- 仅支持桌面端（移动端支持列入 v0.3 路线图）
- 依赖"当前笔记"的按钮动作（`append`、`replace`、`prepend`、`swap`、`template`）在侧边栏视图中可能产生意外行为；v0.1 中建议优先使用 `command` / `link` / `URI` / QuickAdd / Templater / Obsidian Git 类型的按钮。

## 许可证
MIT
