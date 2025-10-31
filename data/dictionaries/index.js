const raw = {
  'dictionaries/confusing.json': require('../../static/dictionaries/confusing.json'),
  'dictionaries/beginner.json': require('../../static/dictionaries/beginner.json'),
  'dictionaries/grammar.json': require('../../static/dictionaries/grammar.json'),
  'dictionaries/base.json': require('../../static/dictionaries/base.json'),
  'dictionaries/jlpt_n5.json': require('../../static/dictionaries/jlpt_n5.json'),
  'dictionaries/jlpt_n4.json': require('../../static/dictionaries/jlpt_n4.json'),
  'dictionaries/jlpt_n3.json': require('../../static/dictionaries/jlpt_n3.json'),
  'dictionaries/jlpt_n2.json': require('../../static/dictionaries/jlpt_n2.json'),
  'dictionaries/jlpt_n1.json': require('../../static/dictionaries/jlpt_n1.json'),
  'dictionaries/jlpt_all.json': require('../../static/dictionaries/jlpt_all.json'),
  'dictionaries/conversation.json': require('../../static/dictionaries/conversation.json'),
  'dictionaries/computer.json': require('../../static/dictionaries/computer.json'),
  'dictionaries/katakana.json': require('../../static/dictionaries/katakana.json'),
};

module.exports = {
  getRaw(path) {
    return raw[path] || null;
  },
  available: Object.keys(raw)
};