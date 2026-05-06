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
