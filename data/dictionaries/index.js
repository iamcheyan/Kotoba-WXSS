// 小程序环境不支持直接 require JSON；改为引用 convert 脚本生成的 JS 导出。
// 运行 scripts/convert-dicts.js 后会在 static/dictionaries-js 下生成同名 .js。

const map = {
  'dictionaries/confusing.json': require('../../static/dictionaries-js/confusing.js'),
  'dictionaries/beginner.json': require('../../static/dictionaries-js/beginner.js'),
  'dictionaries/grammar.json': require('../../static/dictionaries-js/grammar.js'),
  'dictionaries/base.json': require('../../static/dictionaries-js/base.js'),
  'dictionaries/jlpt_n5.json': require('../../static/dictionaries-js/jlpt_n5.js'),
  'dictionaries/jlpt_n4.json': require('../../static/dictionaries-js/jlpt_n4.js'),
  'dictionaries/jlpt_n3.json': require('../../static/dictionaries-js/jlpt_n3.js'),
  'dictionaries/jlpt_n2.json': require('../../static/dictionaries-js/jlpt_n2.js'),
  'dictionaries/jlpt_n1.json': require('../../static/dictionaries-js/jlpt_n1.js'),
  'dictionaries/jlpt_all.json': require('../../static/dictionaries-js/jlpt_all.js'),
  'dictionaries/conversation.json': require('../../static/dictionaries-js/conversation.js'),
  'dictionaries/computer.json': require('../../static/dictionaries-js/computer.js'),
  'dictionaries/katakana.json': require('../../static/dictionaries-js/katakana.js'),
};

module.exports = {
  getRaw(p) {
    const m = map[p];
    if (!m) {
      try { console.warn('[dict] Not found in map:', p); } catch (_) {}
    }
    return m || null;
  },
  available: Object.keys(map)
};
