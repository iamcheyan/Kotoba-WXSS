// 小程序环境不支持直接 require JSON；改为引用 convert 脚本生成的 JS 导出。
// 运行 scripts/convert-dicts.js 后会在 static/dictionaries-js 下生成同名 .js。

// 注意：微信小程序不支持动态 require，必须使用字面量路径。
let mod_confusing; try { mod_confusing = require('../../static/dictionaries-built/confusing.js'); } catch (e) { mod_confusing = require('../../static/dictionaries-js/confusing.js'); }
let mod_beginner; try { mod_beginner = require('../../static/dictionaries-built/beginner.js'); } catch (e) { mod_beginner = require('../../static/dictionaries-js/beginner.js'); }
let mod_grammar; try { mod_grammar = require('../../static/dictionaries-built/grammar.js'); } catch (e) { mod_grammar = require('../../static/dictionaries-js/grammar.js'); }
let mod_base; try { mod_base = require('../../static/dictionaries-built/base.js'); } catch (e) { mod_base = require('../../static/dictionaries-js/base.js'); }
let mod_jlpt_n5; try { mod_jlpt_n5 = require('../../static/dictionaries-built/jlpt_n5.js'); } catch (e) { mod_jlpt_n5 = require('../../static/dictionaries-js/jlpt_n5.js'); }
let mod_jlpt_n4; try { mod_jlpt_n4 = require('../../static/dictionaries-built/jlpt_n4.js'); } catch (e) { mod_jlpt_n4 = require('../../static/dictionaries-js/jlpt_n4.js'); }
let mod_jlpt_n3; try { mod_jlpt_n3 = require('../../static/dictionaries-built/jlpt_n3.js'); } catch (e) { mod_jlpt_n3 = require('../../static/dictionaries-js/jlpt_n3.js'); }
let mod_jlpt_n2; try { mod_jlpt_n2 = require('../../static/dictionaries-built/jlpt_n2.js'); } catch (e) { mod_jlpt_n2 = require('../../static/dictionaries-js/jlpt_n2.js'); }
let mod_jlpt_n1; try { mod_jlpt_n1 = require('../../static/dictionaries-built/jlpt_n1.js'); } catch (e) { mod_jlpt_n1 = require('../../static/dictionaries-js/jlpt_n1.js'); }
let mod_jlpt_all; try { mod_jlpt_all = require('../../static/dictionaries-built/jlpt_all.js'); } catch (e) { mod_jlpt_all = require('../../static/dictionaries-js/jlpt_all.js'); }
let mod_conversation; try { mod_conversation = require('../../static/dictionaries-built/conversation.js'); } catch (e) { mod_conversation = require('../../static/dictionaries-js/conversation.js'); }
let mod_computer; try { mod_computer = require('../../static/dictionaries-built/computer.js'); } catch (e) { mod_computer = require('../../static/dictionaries-js/computer.js'); }
let mod_katakana; try { mod_katakana = require('../../static/dictionaries-built/katakana.js'); } catch (e) { mod_katakana = require('../../static/dictionaries-js/katakana.js'); }

const map = {
  'dictionaries/confusing.json': mod_confusing,
  'dictionaries/beginner.json': mod_beginner,
  'dictionaries/grammar.json': mod_grammar,
  'dictionaries/base.json': mod_base,
  'dictionaries/jlpt_n5.json': mod_jlpt_n5,
  'dictionaries/jlpt_n4.json': mod_jlpt_n4,
  'dictionaries/jlpt_n3.json': mod_jlpt_n3,
  'dictionaries/jlpt_n2.json': mod_jlpt_n2,
  'dictionaries/jlpt_n1.json': mod_jlpt_n1,
  'dictionaries/jlpt_all.json': mod_jlpt_all,
  'dictionaries/conversation.json': mod_conversation,
  'dictionaries/computer.json': mod_computer,
  'dictionaries/katakana.json': mod_katakana,
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
