import { StorageManager } from '../core/StorageManager';
import { AudioManager } from '../core/AudioManager';

export class MenuScene {
  readonly element: HTMLElement;
  private onStartGameCallback: () => void;

  constructor(parent: HTMLElement, onStartGame: () => void) {
    this.onStartGameCallback = onStartGame;

    this.element = document.createElement('div');
    this.element.className = 'scene-container menu-scene';
    this.render();
    parent.appendChild(this.element);
  }

  private render(): void {
    const bestLevel = StorageManager.getBestLevel();
    const bestScore = StorageManager.getBestScore();
    const soundOn = AudioManager.isEnabled();

    this.element.innerHTML = `
      <div class="menu-content-wrapper">
        <!-- 頂部音效開關 -->
        <header class="menu-top-bar">
          <button type="button" class="icon-button sound-toggle-btn" id="menuSoundBtn" aria-label="切換音效">
            ${soundOn ? '🔊' : '🔇'}
          </button>
        </header>

        <!-- 標題區域 -->
        <div class="menu-hero-section">
          <div class="game-badge">MEMO CHALLENGE</div>
          <h1 class="game-title">鴨鴨跳格子</h1>
          <p class="game-subtitle">記住順序，帶鴨鴨跳過去。</p>
        </div>

        <!-- 鴨鴨舞台展示 -->
        <div class="menu-duck-stage">
          <div class="stage-pedestal-glass">
            <div class="pedestal-glow"></div>
            <div class="menu-duck-figure">
              <!-- 可愛 Q 版靜態鴨鴨展示 -->
              <svg viewBox="0 0 100 100" width="108" height="108">
                <defs>
                  <radialGradient id="mDuckGrad" cx="38%" cy="32%" r="65%">
                    <stop offset="0%" stop-color="#fff570" />
                    <stop offset="60%" stop-color="#ffdc1c" />
                    <stop offset="100%" stop-color="#f5b800" />
                  </radialGradient>
                  <linearGradient id="mBeakGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stop-color="#ff8d21" />
                    <stop offset="100%" stop-color="#e85b00" />
                  </linearGradient>
                  <linearGradient id="mFootGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stop-color="#ffa034" />
                    <stop offset="100%" stop-color="#e56700" />
                  </linearGradient>
                </defs>
                <ellipse cx="50" cy="92" rx="30" ry="7" fill="#000" opacity="0.4" />
                <path d="M 33 82 C 30 84 27 88 28 92 C 30 95 38 94 40 89 C 41 85 37 82 33 82 Z" fill="url(#mFootGrad)" />
                <path d="M 67 82 C 70 84 73 88 72 92 C 70 95 62 94 60 89 C 59 85 63 82 67 82 Z" fill="url(#mFootGrad)" />
                <ellipse cx="50" cy="58" rx="34" ry="30" fill="url(#mDuckGrad)" />
                <path d="M 28 64 C 30 76 70 76 72 64 C 68 56 32 56 28 64 Z" fill="#fff9a8" opacity="0.45" />
                <path d="M 22 50 C 14 53 13 67 20 70 C 27 72 29 60 25 52 Z" fill="#e6a800" />
                <path d="M 78 50 C 86 53 87 67 80 70 C 73 72 71 60 75 52 Z" fill="#e6a800" />
                <path d="M 48 18 C 45 10 39 8 36 10 C 34 11 38 14 42 16 C 40 12 43 7 46 6 C 48 6 49 11 48 18 Z" fill="#ffe024" />
                <ellipse cx="50" cy="38" rx="30" ry="26" fill="url(#mDuckGrad)" />
                <ellipse cx="28" cy="46" rx="5.5" ry="3.5" fill="#ff7f7f" opacity="0.6" />
                <ellipse cx="72" cy="46" rx="5.5" ry="3.5" fill="#ff7f7f" opacity="0.6" />
                <ellipse cx="37" cy="35" rx="5.5" ry="6.5" fill="#1a150e" />
                <circle cx="35" cy="32.5" r="2.4" fill="#ffffff" />
                <circle cx="39" cy="37" r="1.1" fill="#ffffff" />
                <ellipse cx="63" cy="35" rx="5.5" ry="6.5" fill="#1a150e" />
                <circle cx="61" cy="32.5" r="2.4" fill="#ffffff" />
                <circle cx="65" cy="37" r="1.1" fill="#ffffff" />
                <path d="M 38 43 C 40 39 60 39 62 43 C 65 47 62 52 50 53 C 38 52 35 47 38 43 Z" fill="url(#mBeakGrad)" />
              </svg>
            </div>
          </div>
        </div>

        <!-- 最高紀錄看板 -->
        <div class="menu-record-card">
          <div class="record-item">
            <span class="record-label">BEST LEVEL</span>
            <span class="record-val">${bestLevel}</span>
          </div>
          <div class="record-divider"></div>
          <div class="record-item">
            <span class="record-label">BEST SCORE</span>
            <span class="record-val">${bestScore.toLocaleString()}</span>
          </div>
        </div>

        <!-- 核心 CTA 按鈕 -->
        <div class="menu-cta-container">
          <button type="button" class="btn-primary start-game-btn" id="startBtn">
            <span class="btn-shine"></span>
            開始遊戲
          </button>
        </div>

        <!-- 底部極簡標語 -->
        <footer class="menu-footer">
          <span>考驗你的工作記憶與空間直覺</span>
        </footer>
      </div>
    `;

    this.bindEvents();
  }

  private bindEvents(): void {
    const startBtn = this.element.querySelector('#startBtn');
    if (startBtn) {
      startBtn.addEventListener('click', () => {
        AudioManager.playButtonClick();
        this.onStartGameCallback();
      });
    }

    const soundBtn = this.element.querySelector('#menuSoundBtn');
    if (soundBtn) {
      soundBtn.addEventListener('click', () => {
        const active = AudioManager.toggle();
        soundBtn.textContent = active ? '🔊' : '🔇';
      });
    }
  }

  show(): void {
    this.render();
    this.element.style.display = 'flex';
  }

  hide(): void {
    this.element.style.display = 'none';
  }
}
