/*
  将 static/dictionaries/*.json 批量转换为 JS 模块：static/dictionaries-js/*.js
  用法：
    node scripts/convert-dicts.js
*/
const fs = require('fs');
const path = require('path');

const SRC_DIR = path.resolve(__dirname, '../static/dictionaries');
const OUT_DIR = path.resolve(__dirname, '../static/dictionaries-js');

async function ensureDir(dir) {
  await fs.promises.mkdir(dir, { recursive: true });
}

function safeModule(content) {
  return 'module.exports = ' + content.trim() + ';\n';
}

async function convertOne(file) {
  const src = path.join(SRC_DIR, file);
  const out = path.join(OUT_DIR, file.replace(/\.json$/i, '.js'));
  const json = await fs.promises.readFile(src, 'utf-8');
  try { JSON.parse(json); } catch (e) { console.error('JSON parse failed:', file, e.message); }
  await fs.promises.writeFile(out, safeModule(json), 'utf-8');
  console.log('✔ Converted:', path.relative(process.cwd(), out));
}

async function main() {
  await ensureDir(OUT_DIR);
  const files = (await fs.promises.readdir(SRC_DIR)).filter(f => f.endsWith('.json'));
  for (const f of files) {
    await convertOne(f);
  }
  console.log('\nDone.');
}

main().catch(err => { console.error(err); process.exit(1); });


