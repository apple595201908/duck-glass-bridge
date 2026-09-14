import { StorageManager } from '../core/StorageManager';
import { AudioManager } from '../core/AudioManager';
import duckIdleUrl from '../assets/duck_idle.png';

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
            <div class="pedestal-energy-ring"></div>
            <img src="${duckIdleUrl}" alt="Duck Mascot" class="menu-duck-hero-img" />
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
