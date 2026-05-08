# Buttons Panel — 「面板按钮显示不全」诊断备忘

> 生成时间：2026-05-07
> 触发：用户报告 Obsidian 中 ButtonsPanel 面板没有完整显示应该出现的全部按钮。

## 1. 项目当前进度速览

- **M0 仓库初始化** ✅ 完成（已 push 到 `origin/main`）
- **M1 Stage 0 spike** ✅ 完成（三项验收均通过；spike 用真实 `file.path` 作 sourcePath；新增 Focus-Dance Bridge 解决 inline-button 命令派发问题）
- **M2 MVP 实现** ⏳ 进行中
  - 已完成（已提交到 main 的 commit 序列）：i18n、debounce、settings + migration、path-resolver、buttons-detector、style-vars、focus-dance bridge、view、settings-tab、main wire-up
  - 工作树未提交修改：`src/renderer.ts`、`src/view.ts`、`src/styles/styles.css`、`src/commands.ts`（新增）—— 这些都是用户最近一次本地调试时改的"加诊断/抢救逃逸按钮"那一批
- **M3 测试与 L3 手动验收** ⏳ 待启动
- **M4 首次 0.1.0 发布** ⏳ 待启动

## 2. 「按钮显示不全」根因（高置信度）

`src/renderer.ts` 在工作树未提交修改里把 `MarkdownRenderer.render` 的 sourcePath 从 spike 用的 `file.path` 改成合成路径：

```ts
const renderPath = `__bp_sidebar__/${file.path}`;
await MarkdownRenderer.render(this.app, markdown, containerEl, renderPath, this.component);
```

理由是「避免 Buttons 插件发现与主编辑器相同 file.path 后把侧边栏渲染的按钮异步移走」。

但是 Buttons v0.9.13 的 inline-button 替换路径（把 `` `button-id` `` 这种 `<code>` 替换成 `<button>`）会用 sourcePath 去 `app.metadataCache.getFileCache(sourcePath)` 查 block-id，**虚构路径在 metadataCache 里找不到任何条目**，于是 inline 引用类按钮**全部解析失败、保留为 `<code>` DOM**；只有 ` ```button ` 代码块按钮（不依赖 metadataCache）能正常渲染。

这与「显示不全」的现象一致：用户的 8 按钮笔记里，前若干个是代码块定义、末尾用 inline 引用复用 → 实际只能看到代码块那部分。

附注：spike 阶段验收（progress.md §M1）三项都通过，spike 用的是真实 `file.path`，所以合成路径回归是**M2 阶段引入的回归**。

### 次要风险点（顺带记录，不是首要根因）

1. `scheduleRescue` 的快照 `containerEl.querySelectorAll('button')` 只能找回「曾经在容器里、之后被搬走」的按钮；如果 Buttons 一开始就 append 到隐藏 registry，永远抓不到。
2. `autoRefresh: true` 默认开启，源笔记保存触发 800ms debounce 后会再 `containerEl.empty()` 一次；若赶上 Buttons 5 秒异步替换窗口，可能把已替换的按钮一起清掉（次要场景）。
3. CSS `bp-hide-paragraphs` 白名单已 cover button / .button-default / code 三态，不构成误杀。

## 3. 修复建议（最小动作）

最小回退：把 `src/renderer.ts` 的合成路径改回 `file.path`。spike 已经验证了用真实 path 时 inline 引用通过；之前担心的"按钮被异步移走"在 spike 中**未被实际观察到**，且 Focus-Dance Bridge 已经覆盖了主区文件 active 的语义。

```diff
-		const renderPath = `__bp_sidebar__/${file.path}`;
-		try {
-			await MarkdownRenderer.render(this.app, markdown, containerEl, renderPath, this.component);
-		} catch (e) {
-			if (!(e instanceof Error) || e.message !== 'File already exists') throw e;
-		}
+		await MarkdownRenderer.render(this.app, markdown, containerEl, file.path, this.component);
```

如果回退后真的再次出现「按钮被主编辑器抢走」的现象，再考虑：

- 方案 A（推荐）：保留 `file.path`，再在 `view.onClose()` 主动 `MarkdownRenderer.unrender(...)` / 让 component unload 时把订阅清掉。
- 方案 B：保留合成路径，但同时在 metadataCache 里桩接一份伪 cache 条目（hack 级，不建议 v0.1 走）。

## 4. Obsidian DevTools 控制台诊断脚本（用户可直接粘贴）

### 4.1 看面板内未替换的 inline-button（确认根因）

```js
(() => {
  const rendered = document.querySelector('.buttons-panel-rendered');
  if (!rendered) return console.warn('[bp-diag] 面板未打开');
  const codes = rendered.querySelectorAll('code');
  const btns = rendered.querySelectorAll('button');
  const stuck = [...codes].filter(c => /^button-/i.test(c.textContent.trim()));
  console.log(`[bp-diag] code=${codes.length} button=${btns.length} 未替换的 inline-button=${stuck.length}`);
  stuck.forEach(c => console.log('  →', c.textContent));
})();
```

如果 `未替换的 inline-button > 0`，根因就是 §2 描述的 metadataCache 查询失败。

### 4.2 比较真实 path 与合成 path 的 metadataCache 命中

把第一行换成你的源笔记真实路径：

```js
(() => {
  const realPath = '00-系统文档/00-HomePage/侧边按钮.md'; // ← 改成你设置里的源笔记 path
  const fakePath = `__bp_sidebar__/${realPath}`;
  console.log('[bp-diag] real cache:', !!app.metadataCache.getFileCache(realPath));
  console.log('[bp-diag] fake cache:', !!app.metadataCache.getFileCache(fakePath));
})();
```

预期：real=true、fake=false → 印证根因。

### 4.3 打开内置 debug 条带

```js
document.body.classList.add('bp-debug-on');
```

之后面板底部会出现 `[bp] HH:MM:SS | rendered <path>` 一行，方便看 refresh 时序。

## 5. 给 codex CLI 的校核 prompt

由于 Cowork 沙箱内没有安装 codex CLI，请在你自己 Windows PowerShell 里运行（在仓库根目录下）：

```powershell
codex --search-paths src,docs/superpowers "请独立校核以下假说：src/renderer.ts 把 MarkdownRenderer.render 的 sourcePath 从 file.path 改成合成路径 __bp_sidebar__/${file.path}，是否会导致 Buttons 0.9.13 在 inline-button 替换时调用 app.metadataCache.getFileCache(sourcePath) 拿到 null，从而让 `button-xxx` 形式的 inline 引用保留为 <code> 不被替换，进而表现为"面板按钮显示不全"。请阅读 src/renderer.ts、src/view.ts、src/styles/styles.css、docs/superpowers/specs/2026-05-06-buttons-panel-design.md §11，确认/反驳此假说，并提出最小修复方案。"
```

把 codex 的输出贴回来，我会比照我的诊断给一致性结论。

## 6. 一致性核对（已用 Plan 子代理做过一次独立审查）

我用了一名独立的"软件架构审查 agent"做盲审（它只读源码与设计文档、不知道我的结论），它独立得出：

- 根因 = 合成路径让 metadataCache 查询失败、inline 引用不被替换；
- 推荐最小修复 = 回退 `sourcePath = file.path`；
- B/C 级假说（rescue 抓不到逃逸按钮、CSS 误杀段落）次要 / 不成立。

与本备忘 §2、§3 完全一致。
