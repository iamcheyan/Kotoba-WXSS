const { dictionaries: configDictionaries, defaultDictionary } = require('../../data/config');
const dictionaryData = require('../../data/dictionaries/index.js');

const STORAGE_KEYS = {
  SELECTED_DICTIONARY: 'kotoba.selectedDictionary',
  WRONG_WORDS: 'kotoba.wrongWords',
  PROGRESS_PREFIX: 'kotoba.progress.'
};

function normalizeMeaning(value) {
  if (value == null) {
    return '';
  }
  if (typeof value === 'string') {
    return value;
  }
  try {
    return JSON.stringify(value);
  } catch (error) {
    console.warn('Failed to stringify meaning value', error);
    return String(value);
  }
}

function toEntryList(raw) {
  if (!raw) {
    return [];
  }
  return Object.keys(raw).map((kanji) => {
    const meaning = normalizeMeaning(raw[kanji]);
    return {
      id: kanji,
      kanji,
      meaning
    };
  });
}

Page({
  data: {
    loading: true,
    dictionaries: [],
    selectedDictionaryId: '',
    selectedDictionaryName: '',
    dictionaryCompleted: false,
    progress: {
      mastered: 0,
      total: 0
    },
    currentEntry: null,
    showMeaning: false,
    feedback: '',
    cardHistoryCount: 0,
    emptyMessage: ''
  },

  onLoad() {
    this.masteredEntries = new Set();
    this.dictionaryEntries = [];
    this.previousIndex = -1;
    this.initialize();
  },

  initialize() {
    const dictionaries = (configDictionaries || []).map((item) => ({
      id: item.path,
      name: item.name,
      isWrongWords: !!item.isWrongWords
    }));
    const storedId = wx.getStorageSync(STORAGE_KEYS.SELECTED_DICTIONARY);
    const initialId = this.resolveInitialDictionary(dictionaries, storedId);
    this.setData({
      dictionaries,
      loading: false
    });
    this.loadDictionary(initialId || (dictionaries[0] && dictionaries[0].id));
  },

  resolveInitialDictionary(list, storedId) {
    if (storedId && list.some((item) => item.id === storedId)) {
      return storedId;
    }
    if (defaultDictionary && list.some((item) => item.id === defaultDictionary)) {
      return defaultDictionary;
    }
    return list.length ? list[0].id : '';
  },

  getDictionaryMeta(dictId) {
    return (this.data.dictionaries || []).find((item) => item.id === dictId) || null;
  },

  loadDictionary(dictId) {
    if (!dictId) {
      this.setData({
        selectedDictionaryId: '',
        selectedDictionaryName: '',
        currentEntry: null,
        emptyMessage: '未找到可用词典'
      });
      return;
    }

    const meta = this.getDictionaryMeta(dictId);
    wx.setStorageSync(STORAGE_KEYS.SELECTED_DICTIONARY, dictId);
    this.masteredEntries = new Set(this.readProgress(dictId));

    if (meta && meta.isWrongWords) {
      this.loadWrongWordsDictionary(meta);
      return;
    }

    const raw = dictionaryData.getRaw(dictId);
    if (!raw) {
      this.dictionaryEntries = [];
      this.masteredEntries.clear();
      this.setData({
        selectedDictionaryId: dictId,
        selectedDictionaryName: meta ? meta.name : dictId,
        currentEntry: null,
        emptyMessage: '词典数据缺失'
      });
      this.updateProgressState();
      return;
    }

    this.dictionaryEntries = toEntryList(raw);
    this.previousIndex = -1;

    this.setData({
      selectedDictionaryId: dictId,
      selectedDictionaryName: meta ? meta.name : dictId,
      emptyMessage: ''
    }, () => {
      this.updateProgressState();
      this.pickRandomEntry();
    });
  },

  loadWrongWordsDictionary(meta) {
    const wrongList = this.getWrongWordsList();
    this.dictionaryEntries = wrongList;
    this.previousIndex = -1;
    this.setData({
      selectedDictionaryId: meta.id,
      selectedDictionaryName: meta.name,
      emptyMessage: wrongList.length ? '' : '错题本目前为空'
    }, () => {
      this.updateProgressState();
      this.pickRandomEntry();
    });
  },

  readProgress(dictId) {
    try {
      return wx.getStorageSync(STORAGE_KEYS.PROGRESS_PREFIX + dictId) || [];
    } catch (error) {
      console.warn('Failed to read progress', error);
      return [];
    }
  },

  writeProgress(dictId) {
    try {
      const payload = Array.from(this.masteredEntries);
      wx.setStorageSync(STORAGE_KEYS.PROGRESS_PREFIX + dictId, payload);
    } catch (error) {
      console.warn('Failed to write progress', error);
    }
  },

  getWrongWordsList() {
    try {
      const stored = wx.getStorageSync(STORAGE_KEYS.WRONG_WORDS);
      if (Array.isArray(stored)) {
        return stored;
      }
      return [];
    } catch (error) {
      console.warn('Failed to read wrong words', error);
      return [];
    }
  },

  setWrongWordsList(list) {
    try {
      wx.setStorageSync(STORAGE_KEYS.WRONG_WORDS, list);
    } catch (error) {
      console.warn('Failed to write wrong words', error);
    }
    if (this.data.selectedDictionaryId === 'wrong-words') {
      this.dictionaryEntries = list;
      this.updateProgressState();
      this.pickRandomEntry();
    }
  },

  pickRandomEntry() {
    const entries = this.dictionaryEntries || [];
    if (!entries.length) {
      this.setData({
        currentEntry: null,
        showMeaning: false,
        feedback: '',
        cardHistoryCount: 0
      });
      return;
    }
    if (entries.length === 1) {
      this.previousIndex = 0;
    } else {
      let nextIndex = Math.floor(Math.random() * entries.length);
      if (nextIndex === this.previousIndex) {
        nextIndex = (nextIndex + 1) % entries.length;
      }
      this.previousIndex = nextIndex;
    }
    const entry = entries[this.previousIndex];
    this.setData({
      currentEntry: entry,
      showMeaning: false,
      feedback: '',
      cardHistoryCount: this.data.cardHistoryCount + 1
    });
  },

  updateProgressState() {
    const total = (this.dictionaryEntries || []).length;
    const mastered = this.masteredEntries ? this.masteredEntries.size : 0;
    const completed = total > 0 && mastered >= total;
    this.setData({
      progress: { mastered, total },
      dictionaryCompleted: completed
    });
  },

  onSelectDictionaryTap() {
    const list = this.data.dictionaries || [];
    if (!list.length) {
      wx.showToast({
        title: '没有可用词典',
        icon: 'none'
      });
      return;
    }
    wx.showActionSheet({
      itemList: list.map((item) => item.name || item.id),
      success: (res) => {
        const selected = list[res.tapIndex];
        if (selected && selected.id !== this.data.selectedDictionaryId) {
          this.loadDictionary(selected.id);
        }
      }
    });
  },

  onRevealMeaning() {
    if (!this.data.currentEntry) {
      return;
    }
    this.setData({
      showMeaning: true,
      feedback: ''
    });
  },

  onMarkMastered() {
    const entry = this.data.currentEntry;
    if (!entry) {
      return;
    }
    const { selectedDictionaryId } = this.data;
    this.masteredEntries.add(entry.id);
    this.writeProgress(selectedDictionaryId);
    if (selectedDictionaryId === 'wrong-words') {
      this.removeFromWrongWords(entry);
    }
    this.updateProgressState();
    this.setData({
      feedback: '标记为已掌握'
    });
    this.pickRandomEntry();
  },

  onMarkAgain() {
    const entry = this.data.currentEntry;
    if (!entry) {
      return;
    }
    const { selectedDictionaryId } = this.data;
    if (selectedDictionaryId !== 'wrong-words') {
      this.addToWrongWords(entry, selectedDictionaryId);
    }
    this.masteredEntries.delete(entry.id);
    this.writeProgress(selectedDictionaryId);
    this.updateProgressState();
    this.setData({
      feedback: '已加入错题'
    });
    this.pickRandomEntry();
  },

  addToWrongWords(entry, sourceDictionary) {
    const list = this.getWrongWordsList();
    const exists = list.some(
      (item) => item.kanji === entry.kanji && item.meaning === entry.meaning
    );
    if (!exists) {
      list.push({
        kanji: entry.kanji,
        meaning: entry.meaning,
        id: entry.id,
        sourceDictionary: sourceDictionary || ''
      });
      this.setWrongWordsList(list);
    }
  },

  removeFromWrongWords(entry) {
    const list = this.getWrongWordsList();
    const next = list.filter(
      (item) => !(item.kanji === entry.kanji && item.meaning === entry.meaning)
    );
    if (next.length !== list.length) {
      this.setWrongWordsList(next);
    }
  },

  onNextCard() {
    this.pickRandomEntry();
  },

  onClearProgress() {
    const { selectedDictionaryId } = this.data;
    if (!selectedDictionaryId) {
      return;
    }
    wx.showModal({
      title: '清除进度',
      content: '确定要清除当前词典的掌握记录吗？',
      success: (res) => {
        if (res.confirm) {
          this.masteredEntries.clear();
          this.writeProgress(selectedDictionaryId);
          this.updateProgressState();
          wx.showToast({ title: '已清除', icon: 'success' });
        }
      }
    });
  },

  onClearWrongWords() {
    wx.showModal({
      title: '清除错题本',
      content: '确定要清空错题本吗？',
      success: (res) => {
        if (res.confirm) {
          this.setWrongWordsList([]);
          wx.showToast({ title: '错题本已清空', icon: 'success' });
        }
      }
    });
  }
});
