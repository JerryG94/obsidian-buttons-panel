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
