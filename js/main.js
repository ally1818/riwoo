/**
 * CipherBomb - 主要介面控制器與互動事件綁定
 */

document.addEventListener('DOMContentLoaded', () => {
  // 1. 初始化主題外觀 (預設淺色簡約大方 / 支援深色沉靜)
  const themeToggleBtn = document.getElementById('theme-toggle-btn');
  const savedTheme = localStorage.getItem('cipherbomb_theme') || 'light';
  
  const applyTheme = (theme) => {
    if (theme === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark');
      if (themeToggleBtn) {
        themeToggleBtn.textContent = '🌙';
        themeToggleBtn.title = '目前：深色沉靜（點擊切換為淺色簡約）';
      }
    } else {
      document.documentElement.removeAttribute('data-theme');
      if (themeToggleBtn) {
        themeToggleBtn.textContent = '☀️';
        themeToggleBtn.title = '目前：淺色簡約（點擊切換為深色沉靜）';
      }
    }
  };

  applyTheme(savedTheme);

  if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
      const next = current === 'dark' ? 'light' : 'dark';
      localStorage.setItem('cipherbomb_theme', next);
      applyTheme(next);
      window.soundEngine.playClick();
    });
  }

  // 2. 初始化遊戲與音效
  const game = new window.UltimatePasswordGame();
  window.currentGame = game;

  // 3. 音效開關切換
  const soundToggleBtn = document.getElementById('sound-toggle-btn');
  const updateSoundIcon = () => {
    if (soundToggleBtn) {
      soundToggleBtn.textContent = window.soundEngine.isMuted() ? '🔇' : '🔊';
      soundToggleBtn.title = window.soundEngine.isMuted() ? '開啟音效' : '靜音';
    }
  };
  updateSoundIcon();

  if (soundToggleBtn) {
    soundToggleBtn.addEventListener('click', () => {
      window.soundEngine.toggleMute();
      updateSoundIcon();
      if (!window.soundEngine.isMuted()) {
        window.soundEngine.playClick();
      }
    });
  }

  // 3. 頁籤導覽 (Tabs Navigation)
  const tabButtons = document.querySelectorAll('.nav-tab-btn');
  const viewSections = document.querySelectorAll('.view-section');

  const switchTab = (tabId) => {
    window.soundEngine.playClick();
    tabButtons.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tab === tabId);
    });
    viewSections.forEach(sec => {
      sec.classList.toggle('active', sec.id === `section-${tabId}`);
    });

    if (tabId === 'stats') renderLeaderboard();
    if (tabId === 'punish') renderPunishmentGrid();
  };

  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => switchTab(btn.dataset.tab));
  });

  // 4. 模式選擇按鈕切換
  const modeButtons = document.querySelectorAll('.mode-btn');
  modeButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      window.soundEngine.playClick();
      modeButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const selectedMode = btn.dataset.mode;
      if (selectedMode === 'custom') {
        openModal('custom-secret-modal');
      } else if (selectedMode === 'party') {
        openModal('party-setup-modal');
        game.setMode('party');
      } else {
        game.setMode('single');
      }
    });
  });

  // 5. 虛擬撥號鍵盤事件
  const guessInput = document.getElementById('guess-input');
  const keypadButtons = document.querySelectorAll('.key-btn');

  keypadButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const key = btn.dataset.key;
      window.soundEngine.playClick();

      if (key === 'submit') {
        game.handleGuess(guessInput.value);
      } else if (key === 'backspace') {
        guessInput.value = guessInput.value.slice(0, -1);
      } else if (key === 'clear') {
        guessInput.value = '';
      } else if (key !== undefined) {
        // 最多輸入 3 位數
        if (guessInput.value.length < 3) {
          guessInput.value += key;
        }
      }
    });
  });

  // 實體鍵盤快捷支援
  document.addEventListener('keydown', (e) => {
    // 若正在輸入彈出視窗中的表單，則不攔截鍵盤
    if (document.querySelector('.modal-backdrop.active')) {
      if (e.key === 'Escape') closeModal();
      return;
    }

    if (e.key === 'Enter') {
      e.preventDefault();
      game.handleGuess(guessInput.value);
    } else if (e.key === 'Backspace') {
      // 保持自然倒退或避免聚焦丟失
    } else if (e.key >= '0' && e.key <= '9') {
      if (document.activeElement !== guessInput) {
        if (guessInput.value.length < 3) {
          guessInput.value += e.key;
        }
      }
    }
  });

  // 6. 重新開始遊戲按鈕
  const restartBtn = document.getElementById('restart-game-btn');
  if (restartBtn) {
    restartBtn.addEventListener('click', () => {
      window.soundEngine.playClick();
      game.resetGame();
    });
  }

  // 再來一局按鈕 (從結算視窗)
  const boomPlayAgainBtn = document.getElementById('boom-play-again-btn');
  if (boomPlayAgainBtn) {
    boomPlayAgainBtn.addEventListener('click', () => {
      closeModal();
      game.resetGame();
    });
  }

  // ----------------------------------------------------
  // 7. 懲罰題庫管理 (CRUD) 介面渲染與事件
  // ----------------------------------------------------
  let currentPunishFilter = 'all';

  window.renderPunishmentGrid = () => {
    const container = document.getElementById('punishment-cards-container');
    if (!container) return;

    let items = window.punishmentManager.getAll();
    if (currentPunishFilter !== 'all') {
      items = items.filter(item => item.category === currentPunishFilter);
    }

    const categoryNames = {
      funny: '搞笑幽默',
      dare: '體能大冒險',
      truth: '真心話拷問',
      treat: '友情請客'
    };

    if (items.length === 0) {
      container.innerHTML = `<div style="grid-column: 1/-1; text-align: center; color: var(--text-muted); padding: 3rem;">此分類目前無懲罰卡片，歡迎點擊右上角新增！</div>`;
      return;
    }

    container.innerHTML = items.map(card => {
      return `
        <div class="punish-card">
          <div>
            <div class="card-top">
              <span class="card-tag tag-${card.category}">${categoryNames[card.category] || card.category}</span>
              <span class="card-stars">${'⭐'.repeat(card.stars || 3)}</span>
            </div>
            <div class="card-title" style="margin-top: 0.6rem;">${card.title}</div>
            <div class="card-desc" style="margin-top: 0.4rem;">${card.description}</div>
          </div>
          <div class="card-actions">
            <button class="btn-outline" style="padding: 0.35rem 0.7rem; font-size: 0.75rem;" onclick="openEditPunishModal('${card.id}')">
              ✏️ 編輯
            </button>
            <button class="btn-danger" onclick="deletePunishCard('${card.id}')">
              🗑️ 刪除
            </button>
          </div>
        </div>
      `;
    }).join('');
  };

  // 分類篩選標籤
  const filterChips = document.querySelectorAll('.filter-chip');
  filterChips.forEach(chip => {
    chip.addEventListener('click', () => {
      window.soundEngine.playClick();
      filterChips.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      currentPunishFilter = chip.dataset.filter;
      renderPunishmentGrid();
    });
  });

  // 新增懲罰卡表單
  const addPunishForm = document.getElementById('add-punish-form');
  if (addPunishForm) {
    addPunishForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const title = document.getElementById('punish-title').value;
      const description = document.getElementById('punish-desc').value;
      const category = document.getElementById('punish-category').value;
      const stars = document.getElementById('punish-stars').value;

      window.punishmentManager.create({ title, description, category, stars });
      window.soundEngine.playPass();
      closeModal();
      addPunishForm.reset();
      renderPunishmentGrid();
    });
  }

  // 編輯懲罰卡表單
  const editPunishForm = document.getElementById('edit-punish-form');
  if (editPunishForm) {
    editPunishForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const id = document.getElementById('edit-punish-id').value;
      const title = document.getElementById('edit-punish-title').value;
      const description = document.getElementById('edit-punish-desc').value;
      const category = document.getElementById('edit-punish-category').value;
      const stars = document.getElementById('edit-punish-stars').value;

      window.punishmentManager.update(id, { title, description, category, stars });
      window.soundEngine.playPass();
      closeModal();
      renderPunishmentGrid();
    });
  }

  // 測試隨機抽卡按鈕
  const testDrawBtn = document.getElementById('test-draw-btn');
  if (testDrawBtn) {
    testDrawBtn.addEventListener('click', () => {
      window.soundEngine.playCardFlip();
      const card = window.punishmentManager.getRandom();
      alert(`🎉 隨機抽卡測試：\n\n【${card.title}】\n${card.description}\n\n難度：${'⭐'.repeat(card.stars)}`);
    });
  }

  // 還原預設題庫按鈕
  const restoreDefaultsBtn = document.getElementById('restore-defaults-btn');
  if (restoreDefaultsBtn) {
    restoreDefaultsBtn.addEventListener('click', () => {
      if (confirm('確定要還原為預設的派對懲罰題庫嗎？這將覆蓋現有項目。')) {
        window.punishmentManager.restoreDefaults();
        window.soundEngine.playClick();
        renderPunishmentGrid();
      }
    });
  }

  // ----------------------------------------------------
  // 8. 戰績榜管理 (CRUD) 介面渲染與事件
  // ----------------------------------------------------
  window.renderLeaderboard = () => {
    const tbody = document.getElementById('records-tbody');
    const stats = window.recordManager.getStats();

    // 更新總覽統計
    const statTotalGames = document.getElementById('stat-total-games');
    const statAvgGuesses = document.getElementById('stat-avg-guesses');
    const statBoomCount = document.getElementById('stat-boom-count');
    const statTopLoser = document.getElementById('stat-top-loser');

    if (statTotalGames) statTotalGames.textContent = stats.totalGames;
    if (statAvgGuesses) statAvgGuesses.textContent = stats.avgGuesses;
    if (statBoomCount) statBoomCount.textContent = stats.boomCount;
    if (statTopLoser) statTopLoser.textContent = stats.topLoser;

    if (!tbody) return;

    const records = window.recordManager.getAll();
    if (records.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--text-muted); padding: 2rem;">尚無對戰紀錄</td></tr>`;
      return;
    }

    const modeLabels = {
      single: '單人挑戰',
      party: '多人派對',
      custom: '魔王出題'
    };

    tbody.innerHTML = records.map(r => {
      return `
        <tr>
          <td>
            <strong>${r.playerName}</strong>
            <span style="font-size: 0.72rem; color: var(--text-muted); display: block;">${r.date}</span>
          </td>
          <td><span style="background: rgba(255,255,255,0.06); padding: 2px 8px; border-radius: 4px; font-size: 0.8rem;">${modeLabels[r.mode] || r.mode}</span></td>
          <td style="font-family: var(--font-mono); font-weight: 700; color: var(--accent-pink);">${r.secret}</td>
          <td style="font-family: var(--font-mono);">${r.guessesCount} 步</td>
          <td style="color: var(--text-secondary); max-width: 250px;">${r.note}</td>
          <td>
            <div style="display: flex; gap: 6px;">
              <button class="btn-outline" style="padding: 0.25rem 0.5rem; font-size: 0.75rem;" onclick="openEditRecordModal('${r.id}')">✏️ 備註</button>
              <button class="btn-danger" style="padding: 0.25rem 0.5rem; font-size: 0.75rem;" onclick="deleteMatchRecord('${r.id}')">🗑️</button>
            </div>
          </td>
        </tr>
      `;
    }).join('');
  };

  // 編輯戰績備註表單
  const editRecordForm = document.getElementById('edit-record-form');
  if (editRecordForm) {
    editRecordForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const id = document.getElementById('edit-record-id').value;
      const playerName = document.getElementById('edit-record-player').value;
      const note = document.getElementById('edit-record-note').value;

      window.recordManager.updateRecord(id, playerName, note);
      window.soundEngine.playPass();
      closeModal();
      renderLeaderboard();
    });
  }

  // 清空戰績按鈕
  const clearRecordsBtn = document.getElementById('clear-records-btn');
  if (clearRecordsBtn) {
    clearRecordsBtn.addEventListener('click', () => {
      if (confirm('確定要清空所有歷史戰績嗎？此操作無法撤回。')) {
        window.recordManager.clearAll();
        window.soundEngine.playClick();
        renderLeaderboard();
      }
    });
  }

  // ----------------------------------------------------
  // 9. 自訂模式與多人名單表單事件
  // ----------------------------------------------------
  const customSecretForm = document.getElementById('custom-secret-form');
  if (customSecretForm) {
    customSecretForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const secret = parseInt(document.getElementById('custom-secret-input').value);
      if (secret >= 2 && secret <= 99) {
        game.setMode('custom');
        game.resetGame(secret);
        window.soundEngine.playFanfare();
        closeModal();
        customSecretForm.reset();
      } else {
        alert('自訂密碼必須介於 2 到 99 之間！');
      }
    });
  }

  const partySetupForm = document.getElementById('party-setup-form');
  if (partySetupForm) {
    partySetupForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const names = document.getElementById('party-player-names').value
        .split(/[,，\n]/)
        .map(n => n.trim())
        .filter(n => n.length > 0);

      if (names.length >= 2) {
        game.setPlayers(names);
        game.setMode('party');
        window.soundEngine.playPass();
        closeModal();
      } else {
        alert('派對模式至少需輸入 2 位玩家的名字！');
      }
    });
  }

  // 初始渲染
  renderPunishmentGrid();
  renderLeaderboard();
});

// 全域彈出視窗控制器
window.openModal = (modalId) => {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.add('active');
    window.soundEngine.playClick();
  }
};

window.closeModal = () => {
  document.querySelectorAll('.modal-backdrop').forEach(modal => {
    modal.classList.remove('active');
  });
  window.soundEngine.playClick();
};

window.openEditPunishModal = (id) => {
  const card = window.punishmentManager.getById(id);
  if (!card) return;
  document.getElementById('edit-punish-id').value = card.id;
  document.getElementById('edit-punish-title').value = card.title;
  document.getElementById('edit-punish-desc').value = card.description;
  document.getElementById('edit-punish-category').value = card.category;
  document.getElementById('edit-punish-stars').value = card.stars;
  openModal('edit-punish-modal');
};

window.deletePunishCard = (id) => {
  if (confirm('確定要刪除這張懲罰卡片嗎？')) {
    window.punishmentManager.delete(id);
    window.soundEngine.playClick();
    window.renderPunishmentGrid();
  }
};

window.openEditRecordModal = (id) => {
  const record = window.recordManager.getAll().find(r => r.id === id);
  if (!record) return;
  document.getElementById('edit-record-id').value = record.id;
  document.getElementById('edit-record-player').value = record.playerName;
  document.getElementById('edit-record-note').value = record.note;
  openModal('edit-record-modal');
};

window.deleteMatchRecord = (id) => {
  if (confirm('確定刪除這筆戰績紀錄？')) {
    window.recordManager.deleteRecord(id);
    window.soundEngine.playClick();
    window.renderLeaderboard();
  }
};
