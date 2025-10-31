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
    this.audioContext = null;
  },

  onUnload() {
    // 页面卸载时清理音频实例
    if (this.audioContext) {
      this.audioContext.stop();
      this.audioContext.destroy();
      this.audioContext = null;
    }
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
      // 支持两种结构：
      // 1) 纯映射：word -> meaning
      // 2) 带振假名：word -> { meaning, reading, runs }
      this.currentEntries = Object.keys(dictObj).map(function(k){
        var v = dictObj[k];
        if (v && typeof v === 'object' && (v.meaning || v.reading || v.runs)) {
          return { word: k, meaning: String(v.meaning || ''), reading: String(v.reading || ''), runs: Array.isArray(v.runs) ? v.runs : [] };
        }
        return { word: k, meaning: String(v), reading: '', runs: [] };
      });
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
    var word = entry.word || entry[0];
    var meaning = String((entry.meaning != null ? entry.meaning : (entry[1] || '')));
    var reading = String(entry.reading || '');
    this.setData({
      questionWord: word,
      questionMeaning: meaning,
      questionReading: reading,
      questionRomaji: ''
    });
  },

  onSubmitAnswer() {
    // 先简单跳过校验，直接出下一题
    this.nextQuestion();
  },

  playTTS() {
    const word = this.data.questionWord;
    const reading = this.data.questionReading;
    const textToSpeak = reading || word;
    
    if (!textToSpeak) {
      wx.showToast({ title: '読み上げる内容がありません', icon: 'none' });
      return;
    }

    // 使用 Google TTS API（免费，无需API密钥）
    // 注意：实际项目中建议使用自己的TTS服务或后端API
    const ttsUrl = 'https://translate.google.com/translate_tts?ie=UTF-8&tl=ja&client=tw-ob&q=' + encodeURIComponent(textToSpeak);
    
    // 如果已有音频实例，先停止
    if (this.audioContext) {
      this.audioContext.stop();
      this.audioContext.destroy();
    }

    // 创建音频上下文
    this.audioContext = wx.createInnerAudioContext();
    this.audioContext.src = ttsUrl;
    this.audioContext.volume = 1;
    
    // 播放速度（如果支持）
    if (this.data.speechRate && this.audioContext.playbackRate !== undefined) {
      this.audioContext.playbackRate = this.data.speechRate;
    }

    this.audioContext.onPlay(() => {
      console.log('[TTS] 开始播放:', textToSpeak);
    });

    this.audioContext.onError((err) => {
      console.error('[TTS] 播放错误:', err);
      wx.showToast({ title: '音声再生に失敗しました', icon: 'none' });
      // Google TTS 可能被限制，尝试备用方案
      this.fallbackTTS(textToSpeak);
    });

    this.audioContext.onEnded(() => {
      console.log('[TTS] 播放结束');
      if (this.audioContext) {
        this.audioContext.destroy();
        this.audioContext = null;
      }
    });

    this.audioContext.play();
  },

  fallbackTTS(text) {
    // 备用方案：提示用户或使用其他TTS服务
    // 可以调用后端API或使用其他TTS提供商
    wx.showToast({ 
      title: 'TTSサービスを利用できません', 
      icon: 'none',
      duration: 2000
    });
  }
});
