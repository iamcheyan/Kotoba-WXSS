/*
  说明：将 index.html 中使用到的内联 SVG 批量导出为 PNG 到 static/icons 下。
  用法：
    1) 在项目根目录执行：
       npm init -y && npm i sharp --save-dev
    2) 运行：
       node scripts/generate-icons.js
    3) 生成文件输出到 static/icons/，与 pages/index/index.wxml 中引用的文件名一致。
*/

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const OUTPUT_DIR = path.resolve(__dirname, '../static/icons');
const ICON_SIZE = 24; // 统一用 24x24，WXML 里可按需缩放到 18 或 16
const STROKE = '#8c5b3e'; // 与主题文字接近的棕色
const STROKE_WIDTH = 2;

function wrapSvg(paths, options = {}) {
  const {
    viewBox = '0 0 24 24',
    stroke = STROKE,
    strokeWidth = STROKE_WIDTH,
    fill = 'none',
  } = options;

  // paths 可以是字符串（片段）或数组（多个 <path>/<polyline>/<polygon>/<circle> 等）
  const body = Array.isArray(paths) ? paths.join('\n') : String(paths);
  return `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" ` +
    `fill="${fill}" stroke="${stroke}" stroke-width="${strokeWidth}" ` +
    `stroke-linecap="round" stroke-linejoin="round">\n${body}\n</svg>`;
}

const icons = [
  // 顶部模式切换
  {
    name: 'mode-input',
    svg: wrapSvg([
      '<path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>',
      '<path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>'
    ])
  },
  {
    name: 'mode-puzzle',
    svg: wrapSvg('<path d="M19.439 7.85c-.049.322.059.648.289.878l1.568 1.568c.47.47.706 1.087.706 1.704s-.235 1.233-.706 1.704l-1.611 1.611a.98.98 0 0 1-.837.276c-.47-.07-.802-.48-.968-.925a2.501 2.501 0 1 0-3.214 3.214c.446.166.855.497.925.968a.979.979 0 0 1-.276.837l-1.61 1.61a2.404 2.404 0 0 1-1.705.707 2.402 2.402 0 0 1-1.704-.706l-1.568-1.568a1.026 1.026 0 0 0-.877-.29c-.493.074-.84.504-1.02.968a2.5 2.5 0 1 1-3.237-3.237c.464-.18.894-.527.967-1.02a1.026 1.026 0 0 0-.289-.877l-1.568-1.568A2.402 2.402 0 0 1 1.998 12c0-.617.236-1.234.706-1.704L4.23 8.77c.24-.24.581-.353.917-.303.515.077.877.528 1.073 1.01a2.5 2.5 0 1 0 3.259-3.259c-.482-.196-.933-.558-1.01-1.073-.05-.336.062-.676.303-.917l1.525-1.525A2.402 2.402 0 0 1 12 1.998c.617 0 1.234.236 1.704.706l1.568 1.568c.23.23.556.338.877.29.493-.074.84-.504 1.02-.968a2.5 2.5 0 1 1 3.237 3.237c-.464.18-.894.527-.967 1.02z"></path>')
  },
  {
    name: 'mode-play',
    svg: wrapSvg('<polygon points="5 3 19 12 5 21 5 3"></polygon>')
  },

  // Header 排行榜按钮
  {
    name: 'leaderboard',
    svg: wrapSvg([
      '<path d="M8 21h8"/>',
      '<path d="M12 17v4"/>',
      '<path d="M7 4h10v5l-5 3-5-3V4z"/>',
      '<path d="M5 9H4a2 2 0 0 1-2-2V5h3"/>',
      '<path d="M19 9h1a2 2 0 0 0 2-2V5h-3"/>'
    ])
  },

  // 用户头像触发
  {
    name: 'user',
    svg: wrapSvg([
      '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>',
      '<circle cx="12" cy="7" r="4"></circle>'
    ])
  },

  // TTS 发音
  {
    name: 'tts',
    svg: wrapSvg([
      '<path d="M4 9v6h3.5L12 18V6L7.5 9H4z"></path>',
      '<path d="M16 12a2 2 0 01-1.17 1.83l-.33.12v-3.9l.33.12A2 2 0 0116 12z"></path>',
      '<path d="M18.5 12a4.5 4.5 0 01-3.05 4.24l-.45.15v-1.66l.18-.08A2.9 2.9 0 0017 12a2.9 2.9 0 00-1.82-2.65l-.18-.07V7.62l.45.15A4.5 4.5 0 0118.5 12z"></path>'
    ])
  },

  // 进度重置
  {
    name: 'reset',
    svg: wrapSvg([
      '<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path>',
      '<path d="M3 3v5h5"></path>'
    ])
  },

  // 统计图标
  {
    name: 'stat-correct',
    svg: wrapSvg([
      '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>',
      '<polyline points="22 4 12 14.01 9 11.01"></polyline>'
    ])
  },
  {
    name: 'stat-wrong',
    svg: wrapSvg([
      '<circle cx="12" cy="12" r="10"></circle>',
      '<line x1="15" y1="9" x2="9" y2="15"></line>',
      '<line x1="9" y1="9" x2="15" y2="15"></line>'
    ])
  },
  {
    name: 'stat-combo',
    svg: wrapSvg('<path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"></path>')
  },
  {
    name: 'stat-total',
    svg: wrapSvg('<path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>')
  },

  // 翻页箭头
  { name: 'chevron-left', svg: wrapSvg('<polyline points="15 18 9 12 15 6"></polyline>') },
  { name: 'chevron-right', svg: wrapSvg('<polyline points="9 18 15 12 9 6"></polyline>') },
];

async function ensureDir(dir) {
  await fs.promises.mkdir(dir, { recursive: true });
}

async function writeIconPng(name, svg, size = ICON_SIZE) {
  const outPath = path.join(OUTPUT_DIR, `${name}.png`);
  const png = await sharp(Buffer.from(svg)).resize(size, size, { fit: 'contain' }).png().toBuffer();
  await fs.promises.writeFile(outPath, png);
  return outPath;
}

async function main() {
  await ensureDir(OUTPUT_DIR);
  const results = [];
  for (const icon of icons) {
    try {
      const out = await writeIconPng(icon.name, icon.svg);
      results.push({ name: icon.name, file: out });
      console.log(`✔ Generated: ${path.relative(process.cwd(), out)}`);
    } catch (e) {
      console.error(`✖ Failed: ${icon.name}`, e);
    }
  }
  console.log(`\nDone. Generated ${results.length} icons to ${OUTPUT_DIR}`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});


