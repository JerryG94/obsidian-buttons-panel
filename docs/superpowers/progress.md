# Buttons Panel — 实施进度

> 实施计划：[`docs/superpowers/plans/2026-05-06-buttons-panel-implementation.md`](./plans/2026-05-06-buttons-panel-implementation.md)
> 设计文档：[`docs/superpowers/specs/2026-05-06-buttons-panel-design.md`](./specs/2026-05-06-buttons-panel-design.md)
> Stage 0 spike 报告：[`docs/spike-stage-0-report.md`](../spike-stage-0-report.md)（spike 分支 `experiments/spike-stage-0`）

| 里程碑 | 状态 | 完成日期 | 说明 |
|---|---|---|---|
| M0 — 仓库初始化 | ✅ 完成 | 2026-05-06 | 5/5 task 全部通过 spec + 代码质量双审，已 push |
| M1 — Stage 0 spike | ✅ 完成 | 2026-05-07 | 三项验收全过；新增 Focus-Dance Bridge 方案（Plan C）；spike 分支不合并 |
| M2 — MVP 实现 | ⏳ 待启动 | — | 17 个 task（原 16 + 新 M2.10b ActiveLeafBridge），TDD-first |
| M3 — 测试与验收 | ⏳ 待启动 | — | 30 项 L3 手动验收（A 组追加 A11 主区桥接验证） |
| M4 — 首次发布 | ⏳ 待启动 | — | 打 tag `0.1.0` |

---

## M0 完成快照（2026-05-06）

### 已推送到 `origin/main` 的 commit 序列

```text
7296710 chore: gitignore root-level PRD scratch file       (M0.5 follow-up)
a2bb441 docs: include design spec and prd in repo          (M0.5)
4858df5 ci: add release workflow that drafts ...           (M0.4)
d3643ce chore: add typescript, esbuild, vitest config ...  (M0.3)
18bf632 chore: add plugin manifest, versions.json, ...     (M0.2)
7971740 chore: initialize repo with license and readmes    (M0.1)
e341f99 Initial commit                                     (GitHub auto)
```

### 验证状态

- `npm run build` 退出 0，产出 `main.js` + `styles.css`（gitignored）
- `npm test` 退出 0（vitest `--passWithNoTests`）
- 所有提交历史已 push 到 `https://github.com/JerryG94/obsidian-buttons-panel`

### 实施期间的 5 处偏离 plan 字面文本（均已记录原因）

1. **M0.1 GitHub 仓库非空** —— 用 `git rebase`（非破坏式）把本地 commit 落到 GitHub 自动生成的 `Initial commit` 之上，避免 force-push。
2. **M0.3 `vitest run` 在零测试时退出非零** —— plan Step 9 已预授权改为 `vitest run --passWithNoTests`。
3. **M0.3 `.gitignore` 裸模式 `styles.css` 误伤源文件** —— `main.js` / `styles.css` / `data.json` 改为根锚定（`/main.js` 等），避免任何深度匹配同名文件。
4. **M0.3 `.editorconfig` JSON override 与所有 JSON 实际 tab 缩进互冲** —— 从 `[*.{json,yml,yaml,md}]` glob 中去掉 `json`，让 JSON 跟随默认 tab 规则（与 `version-bump.mjs` 写出的 `JSON.stringify(..., null, '\t')` 一致）。
5. **M0.5 follow-up：根目录 `Buttons_Panel_PRD.md` 加入 .gitignore** —— canonical PRD 已经是 `docs/prd.md`，根目录文件保留为工作 scratch 但不入 git。

---

## M1 完成快照（2026-05-07）

### 分支与 commit

```text
c51278a spike: stage 0 acceptance report                                          (experiments/spike-stage-0)
9c7e757 spike: stage 0 verification - itemview + markdownrenderer + focus-dance bridge
```

`experiments/spike-stage-0` 已 push 到远端，**不合并到 main**（按 plan §M1.5 Step 3）。

### 三项验收结果

| # | 验收点 | 结果 |
|---|---|---|
| 1 | 按钮渲染（自定义 ItemView 内 ` ```button ` 代码块 + inline 引用） | ✅ 通过 |
| 2 | command 类按钮可点击（QuickAdd 命令真实触发） | ✅ 通过（**仅在加入 Focus-Dance Bridge 后**） |
| 3 | block-id inline 引用（`` `button-id` ``） | ✅ 通过 |

### 关键发现与决策

- **Buttons 插件 v0.9.13 inline-button click 路径硬依赖 `getActiveViewOfType(MarkdownView)`**：custom ItemView active 时报 "Could not get Active View" 并抛 TypeError，命令永不 dispatch。
- **方案：Plan C — Focus-Dance Bridge**（在 capture phase 主动把 active leaf 切回主区最近的 MarkdownView，再让 Buttons handler 走 bubble phase）。已用真实 vault 验证：8 个 QuickAdd 命令按钮全部正常触发，作用对象为主区 active 文件。
- **新增已知限制**（已写入设计文档 §16.2）：面板内按钮**无法操作 Buttons 源笔记本身**；位置上下文按钮（append/prepend/replace/swap/template/text/remove/calculate）不可用。

### 测试环境

- 测试 vault：`D:\Documents\Obsidian\JerryG`（用户实际使用的 vault）
- 真实测试笔记：`00-系统文档/00-HomePage/侧边按钮.md`（8 个 `type command` + QuickAdd action 按钮，inline 引用）
- Buttons 插件版本：0.9.13（id `buttons`，作者 shabegom）
- Obsidian 版本：_待用户在「设置 → 关于」补充_

---

## 由 M1 → M2 引发的文档修订（2026-05-07）

进入 M2 之前，三处文档已同步更新：

1. **设计文档 §11.4** —— 重写为「Spike 验收结果与最终路线」，新增 Plan C（Focus-Dance Bridge），原 Plan B（嵌入 MarkdownView）降级为备选。
2. **设计文档 §11.5** —— 重写已知限制表，明确「命令作用对象 = 主区 active 文件」、「位置上下文按钮不可用」、「主区无 MarkdownView 时按钮被拦截」三条。
3. **设计文档 §16.1** —— 风险 #1（post processor 不触发）从「高」降为「低（已验证）」；风险 #2（block-id 解析）标记为已消解。
4. **设计文档 §16.2** —— 新增已知限制条目，与 §11.5 对齐。
5. **实施计划** —— 在 M2.10 与 M2.11 之间插入 **Task M2.10b**：实现 `src/active-leaf-bridge.ts`（Focus-Dance Bridge），同时在 `src/i18n/{en,zh}.ts` 加 `error.NO_MAIN_MARKDOWN_VIEW`；M2.11 ButtonsPanelView 新增「在 `onOpen` 中 `attach` Bridge」要求。

---

## M2 启动前的就绪状态

- ✅ main 分支：M0 状态，工作树干净（仅 .omc/ 和 progress.md 是未跟踪辅助产物）
- ✅ spike 验证全过 + 报告归档于 spike 分支
- ✅ 设计 / 计划 / 进度三处文档已对齐 spike 决策
- ⏳ 等用户回填 Obsidian 应用版本号（spike 报告 §1）

下次会话恢复路径：

1. 读本文件确认 M2 待启动；
2. 切换到 `feat/m2-mvp` 新分支（plan §M2 在该分支推进 17 个 task）；
3. 用 superpowers:subagent-driven-development 按顺序走 M2.1 → M2.16；
4. 关键节点：M2.10b 完成后立即在真 vault 中起一次 smoke test，确认 Bridge 与 Renderer 共存无回归。

工作流偏好：本项目用 superpowers:subagent-driven-development 推进；plan 与 progress 中文输出；代码块/路径/命令保持原样；多文档批量改动须用户拍板再动手。
