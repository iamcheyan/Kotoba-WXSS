/*
  预计算振假名（高性能方案）：
  - 读取 static/dictionaries/*.json（原始字典：key 为词，value 为释义）
  - 使用 Kuroshiro + Kuromoji 生成 furigana HTML
  - 解析为 runs: [{ base, reading }]，并输出 JS 模块：static/dictionaries-built/*.js

  使用方法：
    npm i kuroshiro kuromoji --save-dev
    node scripts/build-furigana.js

  生成的模块结构：
    module.exports = {
      "単語": { meaning: "释义", reading: "かな", runs: [{ base: "漢", reading: "かん" }, ...] },
      ...
    }
*/

const fs = require('fs');
const path = require('path');
const Kuroshiro = require('kuroshiro').default || require('kuroshiro');
const KuromojiAnalyzer = require('kuroshiro-analyzer-kuromoji').default || require('kuroshiro-analyzer-kuromoji');

const SRC_DIR = path.resolve(__dirname, '../static/dictionaries');
const OUT_DIR = path.resolve(__dirname, '../static/dictionaries-built');

async function ensureDir(dir) { await fs.promises.mkdir(dir, { recursive: true }); }

function wrapModule(obj) {
  return 'module.exports = ' + JSON.stringify(obj, null, 2) + '\n';
}

function parseFuriganaHtml(html) {
  // Kuroshiro furigana 输出形如：<ruby>漢<rp>(</rp><rt>かん</rt><rp>)</rp>字<rp>(</rp><rt>じ</rt><rp>)</rp></ruby>
  const runs = [];
  // 先移除换行和多余空格
  const s = String(html || '').replace(/\n/g, '');
  const rubyMatch = s.match(/<ruby>([\s\S]*?)<\/ruby>/i);
  const inner = rubyMatch ? rubyMatch[1] : s;
  // 将 rp 标签去掉，方便处理
  const cleaned = inner.replace(/<rp>.*?<\/rp>/g, '');
  // 逻辑：把文本按 rt 片段分段：base + <rt>reading</rt>
  // 用一个循环解析：
  const rtRe = /<rt>(.*?)<\/rt>/g;
  let lastIndex = 0;
  let m;
  while ((m = rtRe.exec(cleaned)) !== null) {
    const reading = m[1];
    const before = cleaned.slice(lastIndex, m.index); // 这里是 base 文本
    const base = before.replace(/<[^>]+>/g, ''); // 去掉可能的标签
    if (base) runs.push({ base, reading });
    lastIndex = rtRe.lastIndex;
  }
  // 末尾可能无 rt（不常见），忽略
  return runs;
}

async function buildOne(kuroshiro, file) {
  const src = path.join(SRC_DIR, file);
  const out = path.join(OUT_DIR, file.replace(/\.json$/i, '.js'));
  const raw = JSON.parse(await fs.promises.readFile(src, 'utf-8'));
  const entries = Object.entries(raw);
  const outObj = {};
  for (const [word, meaning] of entries) {
    try {
      const html = await kuroshiro.convert(word, { to: 'hiragana', mode: 'furigana' });
      const runs = parseFuriganaHtml(html);
      const reading = runs.map(r => r.reading).join('');
      outObj[word] = { meaning: String(meaning), reading, runs };
    } catch (e) {
      outObj[word] = { meaning: String(meaning), reading: '', runs: [] };
      console.warn('Furigana failed for:', word, e.message);
    }
  }
  await fs.promises.writeFile(out, wrapModule(outObj), 'utf-8');
  console.log('✔ Built:', path.relative(process.cwd(), out));
}

async function main() {
  await ensureDir(OUT_DIR);
  const analyzer = new KuromojiAnalyzer();
  const kuroshiro = new Kuroshiro();
  await kuroshiro.init(analyzer);

  const files = (await fs.promises.readdir(SRC_DIR)).filter(f => f.endsWith('.json'));
  for (const f of files) {
    await buildOne(kuroshiro, f);
  }
  console.log('\nDone.');
}

main().catch(err => { console.error(err); process.exit(1); });


