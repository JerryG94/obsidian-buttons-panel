# AGENTS.md

本文件为 Codex（Codex.ai/code）在此仓库中工作时提供指引。

## 常用命令

```bash
# 开发监听模式（打包 JS + CSS，自动监听变更）
npm run dev

# 开发模式 + 热重载到 Obsidian 保险库（设置 OUTDIR 为插件目录）
$env:OUTDIR="D:/Documents/Obsidian/JerryG/.obsidian/plugins/buttons-panel"; npm run dev

# 仅类型检查（不输出文件）
npx tsc --noEmit --skipLibCheck

# 生产构建（类型检查 + 打包，无 sourcemap）
npm run build

# 运行测试
npm test

# 监听模式运行测试
npm run test:watch
```

测试文件放在 `tests/**/*.test.ts`（不是 `src/`）。`vitest.config.ts` 只扫描该路径。

## 代码架构

**入口：** `main.ts` — `ButtonsPanelPlugin extends Plugin`。负责连接设置、视图、命令、vault 事件和工作区生命周期，并在 layout-ready 时强制单实例。

**渲染管线：**
1. `path-resolver.ts` — `resolve(app, path)` 返回判别联合类型（`OK | PATH_EMPTY | NOT_FOUND | IS_FOLDER | WRONG_TYPE`），每次 `refresh()` 时调用。
2. `renderer.ts` — `Renderer.renderMarkdown()` 调用 `MarkdownRenderer.render()`。**关键约束：** `sourcePath` 必须是真实的 `file.path`——Buttons 插件通过它进行 `metadataCache.getFileCache()` block-id 查找，任何虚构路径都会导致 inline 按钮引用渲染失败（显示为 `<code>` 而非按钮）。
3. 渲染后，`observeAsyncButtonSwap`（MutationObserver，5 秒 TTL）和 `scheduleRescue`（最多重试 3 次）处理 Buttons 插件的异步 `<code>→<button>` 替换。

**视图（`src/view.ts`）：** `ButtonsPanelView extends ItemView`。三个区域：`bannerEl`（Buttons 插件缺失警告）、`errorEl`（路径解析错误）、`renderedEl`（Markdown 渲染输出）。每次刷新都调用 `applySettingsToDom()` 同步 CSS 变量和过滤类。

**焦点桥接（`src/active-leaf-bridge.ts`）：** 在面板上挂载捕获阶段点击监听器。在任何按钮点击到达 Buttons 插件之前，先将焦点重设到最后一个已知主编辑区 `MarkdownView`——这是必须的，因为 Buttons 插件的动作依赖当前活动叶节点。

**设置（`src/settings.ts`）：** `ButtonsPanelSettings` 包含嵌套的 `layout` 和 `display` 子组。`loadSettings` 先执行迁移，再与 `DEFAULT_SETTINGS` 深度合并（新字段始终获得默认值）。`saveSettings` 持久化后触发 `refreshAllViews`。

**样式系统（`src/style-vars.ts`）：** CSS 自定义属性（`--bp-*`）内联设置在 `contentEl` 上；显示过滤 CSS 类（`bp-hide-*`、`bp-compact-mode` 等）通过 `classList.toggle` 切换。

**i18n（`src/i18n/`）：** `t(key, params?)` 使用点分隔键名查找。Locale 从 `localStorage.language` 自动检测，缺失键回退到英文。

**构建：** esbuild 将 `main.ts` 打包为 `main.js`（CJS 格式，外部化 `obsidian`）。CSS 直接从 `src/styles/styles.css` 复制到 `styles.css`，无 PostCSS 或 CSS Modules。

## 关键约束

- 面板通过 `enforceSingleInstance()` 强制单实例——只允许一个类型为 `buttons-panel-view` 的侧边栏叶节点。
- `autoRefresh` 防抖延迟为 800 ms（在 `view.ts` 中设置）。
- `ButtonsDetector` 缓存社区插件 "buttons" 的启用状态；调用 `detector.refresh()` 使缓存失效（在 `layout-change` 事件时执行）。
- 设置迁移在 `migration.ts` 中按目标版本号注册，当前 schema 版本为 `1`。
