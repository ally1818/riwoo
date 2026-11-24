/**
 * CipherBomb - 資料管理系統 (CRUD 核心與 LocalStorage 存儲)
 * 滿足期末專題加分項：提供管理介面，實際新增、查看、編輯、刪除資料並即時更新
 */

// 1. 預設懲罰題庫 (大一～大四與設計系學生最愛的派對真心話大冒險)
const DEFAULT_PUNISHMENTS = [
  {
    id: "p-1",
    title: "設計系招牌動作",
    description: "現場模仿一位教授或主管看稿子時皺眉頭的表情 10 秒鐘！",
    category: "funny",
    stars: 3,
    createdAt: "2026-11-20T10:00:00Z"
  },
  {
    id: "p-2",
    title: "天使請客令",
    description: "替現場／同組每位夥伴買一杯飲料或下一堂課帶點心！",
    category: "treat",
    stars: 4,
    createdAt: "2026-11-20T10:05:00Z"
  },
  {
    id: "p-3",
    title: "才藝自走砲",
    description: "用氣音或外星語清唱一首時下流行歌曲的副歌！",
    category: "funny",
    stars: 2,
    createdAt: "2026-11-20T10:10:00Z"
  },
  {
    id: "p-4",
    title: "設計魂大考驗",
    description: "用屁股在空中寫出自己的中文名字，讓大家猜你在寫什麼！",
    category: "dare",
    stars: 5,
    createdAt: "2026-11-20T10:15:00Z"
  },
  {
    id: "p-5",
    title: "真心話大拷問",
    description: "誠實回答：最近一次做作業拖延到最後一刻的真正原因是什麼？",
    category: "truth",
    stars: 2,
    createdAt: "2026-11-20T10:20:00Z"
  },
  {
    id: "p-6",
    title: "AI 誇誇模式",
    description: "真誠用 50 個字稱讚現場任何一位組員或今天最辛苦的人！",
    category: "truth",
    stars: 1,
    createdAt: "2026-11-20T10:25:00Z"
  },
  {
    id: "p-7",
    title: "極限體能挑戰",
    description: "原地做 15 下深蹲或開合跳，邊做邊喊「終極密碼太好玩了」！",
    category: "dare",
    stars: 3,
    createdAt: "2026-11-20T10:30:00Z"
  },
  {
    id: "p-8",
    title: "深情告白",
    description: "深情對著自己的滑鼠或筆記型電腦告白 20 秒不准笑場！",
    category: "funny",
    stars: 4,
    createdAt: "2026-11-20T10:35:00Z"
  }
];

class PunishmentManager {
  constructor() {
    this.storageKey = 'cipherbomb_punishments_v1';
    this.init();
  }

  init() {
    if (!localStorage.getItem(this.storageKey)) {
      this.saveAll(DEFAULT_PUNISHMENTS);
    }
  }

  getAll() {
    try {
      const data = localStorage.getItem(this.storageKey);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error("Failed to load punishments:", e);
      return [];
    }
  }

  saveAll(list) {
    localStorage.setItem(this.storageKey, JSON.stringify(list));
  }

  getById(id) {
    return this.getAll().find(item => item.id === id);
  }

  // Create (新增)
  create(item) {
    const list = this.getAll();
    const newItem = {
      id: "p-" + Date.now(),
      title: item.title.trim(),
      description: item.description.trim(),
      category: item.category || 'funny',
      stars: parseInt(item.stars) || 3,
      createdAt: new Date().toISOString()
    };
    list.unshift(newItem);
    this.saveAll(list);
    return newItem;
  }

  // Update (編輯修改)
  update(id, updatedFields) {
    const list = this.getAll();
    const index = list.findIndex(item => item.id === id);
    if (index !== -1) {
      list[index] = {
        ...list[index],
        ...updatedFields,
        stars: parseInt(updatedFields.stars) || list[index].stars,
        updatedAt: new Date().toISOString()
      };
      this.saveAll(list);
      return list[index];
    }
    return null;
  }

  // Delete (刪除)
  delete(id) {
    const list = this.getAll();
    const filtered = list.filter(item => item.id !== id);
    this.saveAll(filtered);
    return filtered.length !== list.length;
  }

  // 隨機抽一張 (支援過濾星級或分類)
  getRandom(category = 'all') {
    let list = this.getAll();
    if (category !== 'all') {
      list = list.filter(item => item.category === category);
    }
    if (list.length === 0) list = this.getAll();
    const randomIndex = Math.floor(Math.random() * list.length);
    return list[randomIndex];
  }

  // 還原預設值
  restoreDefaults() {
    this.saveAll(DEFAULT_PUNISHMENTS);
  }
}

// 2. 戰績榜管理器 (CRUD)
const INITIAL_RECORDS = [
  {
    id: "rec-1",
    playerName: "黃乙凌",
    mode: "party",
    secret: 73,
    guessesCount: 8,
    result: "survived",
    note: "關鍵一擊安全閃過，超刺激！",
    date: "2026-11-22 14:30"
  },
  {
    id: "rec-2",
    playerName: "韓海音",
    mode: "party",
    secret: 73,
    guessesCount: 9,
    result: "boom",
    note: "最後只剩 72~74，直接踩爆炸彈啦 😭",
    date: "2026-11-22 14:32"
  },
  {
    id: "rec-3",
    playerName: "AI挑戰者",
    mode: "single",
    secret: 42,
    guessesCount: 5,
    result: "boom",
    note: "二分搜尋法極速縮減範圍！",
    date: "2026-11-23 09:15"
  }
];

class RecordManager {
  constructor() {
    this.storageKey = 'cipherbomb_records_v1';
    this.init();
  }

  init() {
    if (!localStorage.getItem(this.storageKey)) {
      this.saveAll(INITIAL_RECORDS);
    }
  }

  getAll() {
    try {
      const data = localStorage.getItem(this.storageKey);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error("Failed to load records:", e);
      return [];
    }
  }

  saveAll(list) {
    localStorage.setItem(this.storageKey, JSON.stringify(list));
  }

  // Create (新增戰績)
  addRecord(record) {
    const list = this.getAll();
    const now = new Date();
    const formattedDate = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')} ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;

    const newRecord = {
      id: "rec-" + Date.now(),
      playerName: record.playerName || "匿名玩家",
      mode: record.mode || "single",
      secret: record.secret,
      guessesCount: record.guessesCount,
      result: record.result || "boom", // 'boom' 或 'survived'
      note: record.note || "無備註",
      date: formattedDate
    };
    list.unshift(newRecord);
    this.saveAll(list);
    return newRecord;
  }

  // Update (編輯戰績備註與玩家名)
  updateRecord(id, playerName, note) {
    const list = this.getAll();
    const idx = list.findIndex(r => r.id === id);
    if (idx !== -1) {
      if (playerName) list[idx].playerName = playerName.trim();
      if (note !== undefined) list[idx].note = note.trim();
      this.saveAll(list);
      return list[idx];
    }
    return null;
  }

  // Delete (刪除單筆紀錄)
  deleteRecord(id) {
    const list = this.getAll();
    const filtered = list.filter(r => r.id !== id);
    this.saveAll(filtered);
    return filtered.length !== list.length;
  }

  // Delete All (清空戰績)
  clearAll() {
    this.saveAll([]);
  }

  // 取得統計分析數據
  getStats() {
    const list = this.getAll();
    const totalGames = list.length;
    if (totalGames === 0) {
      return { totalGames: 0, avgGuesses: 0, boomCount: 0, topLoser: "–" };
    }

    const totalGuesses = list.reduce((sum, r) => sum + (r.guessesCount || 0), 0);
    const avgGuesses = (totalGuesses / totalGames).toFixed(1);
    const boomCount = list.filter(r => r.result === 'boom').length;

    // 計算踩雷次數最多的玩家
    const loserCount = {};
    list.filter(r => r.result === 'boom').forEach(r => {
      loserCount[r.playerName] = (loserCount[r.playerName] || 0) + 1;
    });
    let topLoser = "–";
    let maxLoss = 0;
    for (const [name, count] of Object.entries(loserCount)) {
      if (count > maxLoss) {
        maxLoss = count;
        topLoser = `${name} (${count}次)`;
      }
    }

    return { totalGames, avgGuesses, boomCount, topLoser };
  }
}

window.punishmentManager = new PunishmentManager();
window.recordManager = new RecordManager();
