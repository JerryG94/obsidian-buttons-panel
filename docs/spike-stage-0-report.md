# Stage 0 Spike — 验收报告

> 分支：`experiments/spike-stage-0`（不合并）
> 实施计划参考：[`docs/superpowers/plans/2026-05-06-buttons-panel-implementation.md`](./superpowers/plans/2026-05-06-buttons-panel-implementation.md) §M1
> 设计文档参考：[`docs/superpowers/specs/2026-05-06-buttons-panel-design.md`](./superpowers/specs/2026-05-06-buttons-panel-design.md) §11

## 1. 时间与环境

| 项 | 值 |
|---|---|
| 日期 | 2026-05-07 |
| 操作系统 | Windows 11 Pro 10.0.26200 |
| Obsidian 版本 | 1.12.7（安装程序版本 1.12.4） |
| Buttons 插件版本 | 0.9.13（id `buttons`，作者 shabegom） |
| 测试 vault | `D:\Documents\Obsidian\JerryG`（用户实际使用的 vault） |
| 测试笔记（最终版） | `00-系统文档/00-HomePage/侧边按钮.md` |
| 按钮定义文件 | `00-系统文档/00-HomePage/组件按钮.md`（8 个按钮全部 `type command`，action 为 `QuickAdd: 插入随笔` 等） |

> 备注：`TestButtons.md`（plan §M1.3 Step 4 模板）只在最初的 baseline 验证中使用过一次，验证 #1/#3 通过后切换到用户真实文档，以便在真实使用场景下验证 #2。

## 2. 三项验收结果

| # | 验收点 | 结果 | 证据 |
|---|---|---|---|
| 1 | 按钮渲染 | ✅ 通过 | spike view 内 8 个按钮（"随笔/摘录/待办/灵感" + "同步/卡片/科研/整理"）正常显示为可点击元素，未出现 ` ```button ` 代码块字面量。Buttons 插件的 edit mover 也按预期出现在每个按钮旁边。 |
| 2 | 命令可点击 | ✅ 通过（**仅在加入 Focus-Dance Bridge 后**） | 主区打开任意 markdown 文件，sidebar 点 "随笔" → 不再弹 "Could not get Active View" 错误 → QuickAdd 命令 `插入随笔` 真实触发，按预期效果作用于主区当前文件。 |
| 3 | block-id inline 引用 | ✅ 通过 | `侧边按钮.md` 内每个按钮均通过 `` `button-suibi` `` 等 inline 语法引用，渲染为按钮副本（不是 inline code）。 |

## 3. 关键发现：buttons 插件 click 路径对 sidebar ItemView 不友好

Plan A 的 baseline 实现（custom ItemView + `MarkdownRenderer.render`，未做任何额外 hook）**渲染层 100% 正常**，但**click 层硬性失败**。源码追踪：

```
点击 inline 按钮
  └── (Buttons plugin main.js)
      ├── line 2257: button.on("click", "button", () => clickHandler(...))
      ├── line 2272: position = inline ? await getInlineButtonPosition(app, id) : ...
      ├── line 1777: const content = await createContentArray(app);
      └── line 1170: const activeView = app.workspace.getActiveViewOfType(MarkdownView);
          └── activeView == null （我们的 spike view 是 ItemView，不是 MarkdownView）
              ├── line 1176: new Notice("Could not get Active View")  ← 用户看到的提示
              └── createContentArray 返回 undefined
                  └── line 1779: content.contentArray.map(...)  ← TypeError，clickHandler 中断
                      └── 命令永不 dispatch
```

**触发条件**：

- 即使按钮是 `type command`（不依赖 buttonStart / position），inline 路径仍**无条件**调用 `getInlineButtonPosition`，所以 type 检查根本走不到。
- 此问题**仅影响 inline button reference**（用户场景）；纯 ` ```button ``` ` 代码块按钮走另一条路径（`getBlockButtonPositionById`），可能没有同样的硬依赖（未在本次 spike 中验证）。

设计文档 §11.5 原本将此风险归类为"上下文相关按钮可能作用错文件"的轻量限制，**实际严重程度高于预估**：

- 不是"可能作用错文件"，而是 inline 按钮**根本走不到 dispatch**；
- 且即使绕过 inline 路径，QuickAdd 类命令本身也依赖 `app.workspace.getActiveFile()` 决定写入目标，sidebar leaf 一旦成为 active 就会让 QuickAdd 写入到 buttons 源文件而不是用户当前文件——这是一个语义错误，不是技术 bug。

## 4. 解决方案：Focus-Dance Bridge（方案子）

**核心思路**：保留 Plan A 的渲染骨架，**在 click 触达 buttons 插件 handler 之前主动桥接 active leaf 到主区最近的 MarkdownView**。

实现要点（`main.ts`）：

1. SpikeView 持有 `lastMainLeaf: WorkspaceLeaf | null`；
2. `onOpen` 时 `iterateAllLeaves` 扫描已存在的主区 MarkdownView 作为 seed；
3. `registerEvent('active-leaf-change')` 持续追踪主区 MarkdownView 切换；
4. `contentEl.addEventListener('click', handler, true)` —— **capture phase**，确保早于 buttons 插件的 bubble-phase listener；
5. handler 中：若 `lastMainLeaf` 存在且仍是 MarkdownView → `setActiveLeaf(lastMainLeaf, { focus: false })`；否则弹 Notice "请先在主编辑区打开一个 markdown 文件" 并 `stopImmediatePropagation` + `preventDefault`。

`isInMainPane` 判定：`leaf.getRoot() === app.workspace.rootSplit`。

## 5. 副发现

| 项 | 现象 | 处理 |
|---|---|---|
| 居中 / 紧凑 CSS | `.workspace-leaf-content[data-type="spike-view"] .view-content p { text-align: center }` 可有效让 inline 按钮按 sidebar 宽度居中。**确认 CSS 不是 click 失效原因**（一度被误判）。 | 写入 `src/styles/styles.css`，作为 spike 级 quick fix；M2.14 重新设计。 |
| Buttons 插件 edit mover | 按钮旁的"编辑"图标是 buttons 插件自己注入的，不是我们渲染重复。 | 无需处理；M2 阶段若想隐藏可单独 CSS 控制。 |
| `setActiveLeaf` 同步性 | 实测从 capture-phase listener 调用 `setActiveLeaf({ focus: false })` 后，buttons 插件后续的 bubble-phase listener 同步看到了切换后的 active view。 | 方案子可行的关键前置假设，已验证。 |
| 主区无 markdown 文件时 | 弹我们自己的中文 Notice，按钮 click 被阻止冒泡，不会触达 buttons 插件 → 不再出现 "Could not get Active View"。 | 用户体验闭环 OK。 |
| Component 生命周期 | `MarkdownRenderer.render(..., this)` 中 `this` 是 SpikeView，未观察到 child component 泄漏；切换/关闭 spike view 时 buttons 插件的 InlineButton MarkdownRenderChild 正常清理。 | 暂未深入测试；M2 阶段需继续观察。 |

## 6. 决策

**M1 退出条件全部满足，进入 M2，但 M2 的设计与任务清单需要修订。**

| 修订项 | 原方案 | 新方案 |
|---|---|---|
| 渲染策略 | Plan A（custom ItemView + MarkdownRenderer.render） | **保留** Plan A，**新增** Focus-Dance Bridge 作为 click 上下文层 |
| 适用按钮类型 | 设计文档 §11.5 列举的 6 类（context-independent commands） | **同上**，但需在 README / 设置中明确说明：v0.1 不支持依赖按钮**所在文件**位置上下文的按钮类型（template / swap / text / replace / remove / calculate / append / prepend），原因是 Focus-Dance Bridge 切换的是 **active view**，buttons 插件随后从 `app.vault.read(activeFile)` 读取的是**主区那个文件**而非 buttons 源文件，按钮位置会错。 |
| 设计文档 §11.4 | "Plan B：嵌入 MarkdownView" | **新增 Plan C：Focus-Dance Bridge**，并将其作为 v0.1 的实际实现路线；Plan B 降级为备选 |
| 设计文档 §16.1 风险 #1 | "高风险，spike 验证；失败走 Plan B" | "已验证；通过 Focus-Dance Bridge 缓解，伴随上下文相关按钮的明确限制" |
| 设计文档 §16.2 已知限制 | _待补_ | 新增条目："命令在 Focus-Dance Bridge 切换的主区文件上执行；面板内按钮无法操作 buttons 源文件本身" |
| 实施 plan §M2 任务 | 原 16 个 task | **新增** 一个 task（建议 M2.10 之后、M2.11 之前）："实现 ActiveLeafBridge 模块（追踪主区 MarkdownView + capture-phase click 桥接 + 主区无文件时友好 Notice）"；其他 task 暂不调整，但 M2.10 renderer 与 M2.11 ButtonsPanelView 需在内部接入 ActiveLeafBridge |

**M1 不合并到 main**（按 plan §M1.5 Step 3）；以上修订项作为后续在 main 上单独的 commit 落地，再启动 M2。

## 7. 待办（main 分支上的下一步）

- [ ] 修订 `docs/superpowers/specs/2026-05-06-buttons-panel-design.md` §11.4 / §16.1 / §16.2
- [ ] 修订 `docs/superpowers/plans/2026-05-06-buttons-panel-implementation.md` M2 任务清单（新增 ActiveLeafBridge task）
- [ ] 更新 `docs/superpowers/progress.md`：M1 标记为 ✅、记录决策与方案变更摘要、链接本报告
- [ ] 让用户在 Obsidian 设置 → 关于 中确认应用版本号，回填本报告"Obsidian 版本"字段
