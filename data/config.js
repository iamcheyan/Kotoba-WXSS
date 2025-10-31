const config = require('../static/config.json');

module.exports = {
  dictionaries: config.dictionaries || [],
  defaultDictionary: config.default_dictionary || ''
};
