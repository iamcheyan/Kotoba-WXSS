const config = require('../static/config.js');

module.exports = {
  dictionaries: config.dictionaries || [],
  defaultDictionary: config.default_dictionary || ''
};
