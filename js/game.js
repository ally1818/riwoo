/**
 * CipherBomb - 核心遊戲引擎與互動回饋
 */
class UltimatePasswordGame {
  constructor() {
    this.min = 1;
    this.max = 100;
    this.secret = 50;
    this.mode = 'party'; // 'single' | 'party' | 'custom'
    this.players = ['黃乙凌', '韓海音'];
    this.currentPlayerIdx = 0;
    this.guessHistory = [];
    this.isGameOver = false;

    // DOM 元素快取
    this.dom = {
      minVal: document.getElementById('min-val'),
      maxVal: document.getElementById('max-val'),
      rangeSpan: document.getElementById('range-span'),
      visualFill: document.getElementById('visual-bar-fill'),
      bombAvatar: document.getElementById('bomb-avatar'),
      bombStage: document.getElementById('game-stage'),
      currentPlayer: document.getElementById('current-player-name'),
      roundBadge: document.getElementById('round-badge'),
      guessInput: document.getElementById('guess-input'),
      inputFeedback: document.getElementById('input-feedback'),
      historyList: document.getElementById('history-list'),
      boomModal: document.getElementById('boom-modal'),
      boomPlayer: document.getElementById('boom-player'),
      boomSecret: document.getElementById('boom-secret'),
      punishCardContainer: document.getElementById('boom-punish-reveal')
    };

    this.init();
  }

  init() {
    this.resetGame();
  }

  // 設定模式
  setMode(mode) {
    this.mode = mode;
    this.resetGame();
  }

  // 設定自訂玩家名單
  setPlayers(playerList) {
    if (playerList && playerList.length > 0) {
      this.players = playerList;
      this.currentPlayerIdx = 0;
      this.updateUI();
    }
  }

  // 新局重設
  resetGame(customSecret = null) {
    this.min = 1;
    this.max = 100;
    this.isGameOver = false;
    this.guessHistory = [];
    this.currentPlayerIdx = 0;

    if (customSecret !== null) {
      this.secret = parseInt(customSecret);
    } else {
      // 隨機產生 2 到 99 之間的數字，確保能有猜測空間
      this.secret = Math.floor(Math.random() * 98) + 2;
    }

    console.log(`[CipherBomb] 新局開始！模式: ${this.mode}, 密碼: ${this.secret}`);

    if (this.dom.guessInput) {
      this.dom.guessInput.value = '';
      this.dom.guessInput.disabled = false;
    }
    if (this.dom.inputFeedback) {
      this.dom.inputFeedback.textContent = '';
    }

    this.updateUI();
    this.renderHistory();
  }

  // 處理玩家送出猜測
  handleGuess(num) {
    if (this.isGameOver) return;
    const guess = parseInt(num);

    if (isNaN(guess)) {
      this.showFeedback('請輸入有效數字！', true);
      return;
    }

    // 檢查範圍有效性
    if (guess <= this.min || guess >= this.max) {
      this.showFeedback(`請輸入大於 ${this.min} 且小於 ${this.max} 的數字！`, true);
      window.soundEngine.playTension();
      return;
    }

    const currentName = this.getCurrentPlayerName();
    this.showFeedback('');

    // 1. 踩到炸彈（遊戲結束）
    if (guess === this.secret) {
      this.isGameOver = true;
      this.guessHistory.unshift({
        step: this.guessHistory.length + 1,
        player: currentName,
        value: guess,
        type: 'boom'
      });
      this.triggerBoom(currentName, guess);
      return;
    }

    // 2. 猜測成功縮小範圍 (安全)
    window.soundEngine.playPass();

    let hint = '';
    if (guess < this.secret) {
      this.min = guess;
      hint = 'higher'; // 密碼比猜測值大
    } else {
      this.max = guess;
      hint = 'lower';  // 密碼比猜測值小
    }

    this.guessHistory.unshift({
      step: this.guessHistory.length + 1,
      player: currentName,
      value: guess,
      type: hint
    });

    // 換下一位玩家
    if (this.mode === 'party') {
      this.currentPlayerIdx = (this.currentPlayerIdx + 1) % this.players.length;
    }

    // 清空輸入框
    if (this.dom.guessInput) {
      this.dom.guessInput.value = '';
    }

    this.updateUI();
    this.renderHistory();

    // 檢查緊張度音效
    const span = this.max - this.min;
    if (span <= 15) {
      window.soundEngine.playTension();
    }
  }

  getCurrentPlayerName() {
    if (this.mode === 'single') return '挑戰者';
    return this.players[this.currentPlayerIdx] || '玩家';
  }

  // 更新視覺狀態
  updateUI() {
    if (!this.dom.minVal) return;

    this.dom.minVal.textContent = this.min;
    this.dom.maxVal.textContent = this.max;

    const span = this.max - this.min;
    this.dom.rangeSpan.textContent = `剩餘區間: ${span}`;

    // 計算進度條寬度與位移 (從 1~100 映射)
    const leftPct = ((this.min - 1) / 99) * 100;
    const widthPct = (span / 99) * 100;
    this.dom.visualFill.style.left = `${leftPct}%`;
    this.dom.visualFill.style.width = `${Math.max(widthPct, 2)}%`;

    // 當前玩家狀態
    this.dom.currentPlayer.textContent = this.getCurrentPlayerName();
    this.dom.roundBadge.textContent = `第 ${this.guessHistory.length + 1} 回合`;

    // 緊張度氛圍更新
    this.updateTensionAtmosphere(span);
  }

  updateTensionAtmosphere(span) {
    const avatar = this.dom.bombAvatar;
    const stage = this.dom.bombStage;
    if (!avatar || !stage) return;

    avatar.classList.remove('danger-1', 'danger-2');

    if (span <= 10) {
      // 極度危險
      avatar.classList.add('danger-2');
      avatar.textContent = '💣';
      stage.style.setProperty('--tension-color', 'rgba(239, 68, 68, 0.45)');
    } else if (span <= 25) {
      // 警惕警戒
      avatar.classList.add('danger-1');
      avatar.textContent = '⚠️';
      stage.style.setProperty('--tension-color', 'rgba(245, 158, 11, 0.35)');
    } else {
      avatar.textContent = '🎯';
      stage.style.setProperty('--tension-color', 'rgba(99, 102, 241, 0.25)');
    }
  }

  showFeedback(msg, isError = false) {
    if (this.dom.inputFeedback) {
      this.dom.inputFeedback.textContent = msg;
      this.dom.inputFeedback.style.color = isError ? 'var(--accent-pink)' : 'var(--accent-cyan)';
    }
  }

  renderHistory() {
    if (!this.dom.historyList) return;
    if (this.guessHistory.length === 0) {
      this.dom.historyList.innerHTML = `<div class="empty-history">尚未有猜測紀錄<br>請在下方輸入數字開始！</div>`;
      return;
    }

    this.dom.historyList.innerHTML = this.guessHistory.map(item => {
      let badgeHtml = '';
      if (item.type === 'higher') {
        badgeHtml = `<span class="history-badge higher">▲ 密碼更大</span>`;
      } else if (item.type === 'lower') {
        badgeHtml = `<span class="history-badge lower">▼ 密碼更小</span>`;
      } else {
        badgeHtml = `<span class="history-badge boom">💥 踩中炸彈</span>`;
      }

      return `
        <div class="history-item">
          <div>
            <span class="history-step">#${item.step}</span>
            <span class="history-name" style="margin-left: 6px;">${item.player}</span>
          </div>
          <div style="display: flex; align-items: center; gap: 8px;">
            <span class="history-val">${item.value}</span>
            ${badgeHtml}
          </div>
        </div>
      `;
    }).join('');
  }

  // 踩雷爆炸觸發結算
  triggerBoom(loserName, secretNum) {
    window.soundEngine.playBoom();

    // 觸發粒子特效
    this.launchConfetti();

    // 從 CRUD 懲罰題庫中隨機抽取懲罰卡片
    const punishment = window.punishmentManager.getRandom();

    // 儲存戰績到戰績榜
    window.recordManager.addRecord({
      playerName: loserName,
      mode: this.mode,
      secret: secretNum,
      guessesCount: this.guessHistory.length,
      result: 'boom',
      note: `引爆 ${secretNum}！抽中懲罰：${punishment.title}`
    });

    // 彈出爆炸結算視窗
    if (this.dom.boomPlayer) this.dom.boomPlayer.textContent = loserName;
    if (this.dom.boomSecret) this.dom.boomSecret.textContent = secretNum;

    if (this.dom.punishCardContainer) {
      this.dom.punishCardContainer.innerHTML = `
        <div style="font-size: 0.8rem; font-weight: 700; color: var(--accent-red); margin-bottom: 4px;">
          🃏 抽取的命運懲罰卡：【${punishment.title}】
        </div>
        <div style="font-size: 0.95rem; color: #fff; line-height: 1.5;">
          ${punishment.description}
        </div>
        <div style="margin-top: 8px; font-size: 0.75rem; color: var(--text-muted);">
          難度指數：${'⭐'.repeat(punishment.stars)} ｜ 分類：${punishment.category}
        </div>
      `;
    }

    if (this.dom.boomModal) {
      this.dom.boomModal.classList.add('active');
    }

    // 重新渲染戰績排行榜與題庫
    if (window.renderLeaderboard) window.renderLeaderboard();
  }

  // 粒子噴射 (Canvas Confetti / Firework)
  launchConfetti() {
    const canvas = document.getElementById('confetti-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles = [];
    const colors = ['#ef4444', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4', '#10b981'];

    for (let i = 0; i < 90; i++) {
      particles.push({
        x: canvas.width / 2,
        y: canvas.height / 2,
        vx: (Math.random() - 0.5) * 18,
        vy: (Math.random() - 0.5) * 18 - 4,
        size: Math.random() * 8 + 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        alpha: 1,
        decay: Math.random() * 0.02 + 0.015,
        shape: Math.random() > 0.5 ? 'circle' : 'rect'
      });
    }

    function render() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      let alive = false;

      particles.forEach(p => {
        if (p.alpha > 0) {
          alive = true;
          ctx.save();
          ctx.globalAlpha = p.alpha;
          ctx.fillStyle = p.color;
          ctx.translate(p.x, p.y);

          if (p.shape === 'circle') {
            ctx.beginPath();
            ctx.arc(0, 0, p.size, 0, Math.PI * 2);
            ctx.fill();
          } else {
            ctx.fillRect(-p.size/2, -p.size/2, p.size, p.size);
          }

          ctx.restore();
          p.x += p.vx;
          p.y += p.vy;
          p.vy += 0.35; // 重力
          p.alpha -= p.decay;
        }
      });

      if (alive) {
        requestAnimationFrame(render);
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    }

    render();
  }
}

window.UltimatePasswordGame = UltimatePasswordGame;
