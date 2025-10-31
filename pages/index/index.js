const config = require('../../data/config.js');
const dictIndex = require('../../data/dictionaries/index.js');

function pickRandomEntry(entries) {
  if (!entries || entries.length === 0) return null;
  const i = Math.floor(Math.random() * entries.length);
  return entries[i];
}

Page({
  data: {
    dictionaryName: '',
    dictionaryPath: '',
    questionWord: '',
    questionMeaning: '',
    questionReading: '',
    questionRomaji: '',
    progressFraction: '0 / 0',
    progressPercentage: '0%',
    showBackdrop: false,
    showDictionaryModal: false,
    dictNames: [],
    selectedDictIndex: 0,
    speechRate: 1.0
  },

  onLoad() {
    this.initDictionaries();
  },

  openDictionaryModal() {
    var idx = 0;
    for (var i = 0; i < (this.availableDicts || []).length; i++) {
      if (this.availableDicts[i].path === this.data.dictionaryPath) { idx = i; break; }
    }
    this.setData({ showBackdrop: true, showDictionaryModal: true, selectedDictIndex: idx });
  },

  closeModals() {
    this.setData({ showBackdrop: false, showDictionaryModal: false });
  },

  initDictionaries() {
    const available = config.dictionaries || [];
    this.availableDicts = available.slice();

    // 读取上次选择，否则用默认
    let path = '';
    try {
      path = wx.getStorageSync('lastSelectedDictionary') || config.defaultDictionary || (available[0] && available[0].path) || '';
    } catch (_) {}
    this.setData({ dictNames: this.availableDicts.map(function(d){ return d.name; }) });
    this.setDictionary(path, { silent: true });
  },

  onDictPickerChange(e) {
    this.setData({ selectedDictIndex: Number(e.detail.value || 0) });
  },

  onRateChange(e) {
    this.setData({ speechRate: Number(e.detail.value || 1) });
    try { wx.setStorageSync('speechRate', String(this.data.speechRate)); } catch (_) {}
  },

  onDictionarySave() {
    const idx = this.data.selectedDictIndex || 0;
    const picked = (this.availableDicts || [])[idx];
    if (picked) {
      this.setDictionary(picked.path);
    }
    this.closeModals();
  },

  setDictionary(path, { silent } = {}) {
    const meta = (this.availableDicts || []).find(d => d.path === path) || this.availableDicts[0];
    const usePath = meta ? meta.path : path;
    const name = meta ? meta.name : '';
    let dictObj = null;
    if (usePath && usePath !== 'wrong-words') {
      dictObj = dictIndex.getRaw(usePath);
    } else {
      // 简单的错题本占位：从本地取数组，结构与常规词典一致时生效
      try {
        const wrong = wx.getStorageSync('wrongWords') || [];
        if (Array.isArray(wrong)) {
          dictObj = wrong.reduce((acc, it) => { acc[it.word || it[0]] = it.meaning || it[1] || ''; return acc; }, {});
        }
      } catch (_) {}
    }

    this.currentEntries = [];
    if (dictObj && typeof dictObj === 'object') {
      this.currentEntries = Object.keys(dictObj).map(function(k){ return [k, String(dictObj[k])]; });
    }

    // fallback：若无法读取本地词典，用内置少量示例保证功能可用
    if (!this.currentEntries || this.currentEntries.length === 0) {
      this.currentEntries = [
        ['総務', '名词 总务'],
        ['熊本県', '专有词 熊本县'],
        ['勉強', '名・他动 学习'],
      ];
    }

    try { wx.setStorageSync('lastSelectedDictionary', usePath); } catch (_) {}

    this.setData({
      dictionaryName: name ? `（${name}）` : '',
      dictionaryPath: usePath
    });
    try {
      console.info('[dict] setDictionary:', usePath, 'name:', name, 'entries:', (this.currentEntries || []).length);
    } catch (_) {}
    if (!silent) {
      wx.showToast({ title: '辞書を切り替えました', icon: 'none' });
    }
    this.nextQuestion();
  },

  pickDictionary() {
    const list = (this.availableDicts || []).map(d => d.name);
    const that = this;
    wx.showActionSheet({
      itemList: list,
      success(res) {
        const idx = res.tapIndex;
        const picked = that.availableDicts[idx];
        if (picked) that.setDictionary(picked.path);
      }
    });
  },

  nextQuestion() {
    const entry = pickRandomEntry(this.currentEntries);
    if (!entry) {
      this.setData({
        questionWord: '',
        questionMeaning: '',
        questionReading: '',
        questionRomaji: ''
      });
      return;
    }
    const word = entry[0];
    const meaning = String(entry[1] || '');
    this.setData({
      questionWord: word,
      questionMeaning: meaning,
      questionReading: '',
      questionRomaji: ''
    });
  },

  onSubmitAnswer() {
    // 先简单跳过校验，直接出下一题
    this.nextQuestion();
  }
});
