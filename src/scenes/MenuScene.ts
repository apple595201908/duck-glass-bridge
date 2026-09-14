import { StorageManager } from '../core/StorageManager';
import { AudioManager } from '../core/AudioManager';
import duckIdleUrl from '../assets/duck_idle.png';
import gameLogoBadgeUrl from '../assets/game_logo_badge.png';

export class MenuScene {
  readonly element: HTMLElement;
  private onStartGameCallback: () => void;
  private onOpenTutorialCallback?: () => void;

  constructor(parent: HTMLElement, onStartGame: () => void, onOpenTutorial?: () => void) {
    this.onStartGameCallback = onStartGame;
    this.onOpenTutorialCallback = onOpenTutorial;

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
        <!-- 頂部狀態列與功能按鈕 -->
        <header class="menu-top-bar">
          <div class="steam-status-pill">
            <span class="status-pulse-dot"></span>
            <span class="status-text">OFFICIAL v1.4.0</span>
          </div>
          <div class="top-bar-actions">
            <button type="button" class="icon-button sound-toggle-btn" id="menuSoundBtn" aria-label="切換音效">
              ${soundOn ? '🔊' : '🔇'}
            </button>
          </div>
        </header>

        <!-- 商業級 3D 遊戲大標誌 (Logo Badge) -->
        <div class="menu-brand-showcase">
          <div class="logo-aura-glow"></div>
          <img src="${gameLogoBadgeUrl}" alt="DUCK GLASS BRIDGE 鴨鴨踩玻璃橋" class="menu-game-logo-badge" />
          <p class="menu-brand-slogan">記住光亮順序，引領鴨鴨橫跨深淵</p>
        </div>

        <!-- 浮空反重力展示座與 Q 萌飛行員鴨 -->
        <div class="menu-duck-stage">
          <div class="stage-pedestal-glass">
            <div class="pedestal-glow"></div>
            <div class="pedestal-energy-ring outer-ring"></div>
            <div class="pedestal-energy-ring inner-ring"></div>
            <img src="${duckIdleUrl}" alt="Pilot Duck Mascot" class="menu-duck-hero-img" />
          </div>
        </div>

        <!-- 歷史數據黑匣子看板 -->
        <div class="menu-record-card">
          <div class="record-item">
            <span class="record-label">HIGHEST LEVEL</span>
            <span class="record-val level-val">${bestLevel}</span>
          </div>
          <div class="record-divider"></div>
          <div class="record-item">
            <span class="record-label">MAX SCORE</span>
            <span class="record-val score-val">${bestScore.toLocaleString()}</span>
          </div>
        </div>

        <!-- 拇指操作區 (底部雙層互動 CTA) -->
        <div class="menu-cta-container">
          <button type="button" class="btn-primary start-game-btn" id="startBtn">
            <span class="btn-shine"></span>
            <span class="btn-text-glow">開始挑戰 START</span>
          </button>
          <div class="menu-secondary-actions">
            <button type="button" class="btn-secondary menu-tutorial-btn" id="tutorialBtn">
              📖 玩法導引
            </button>
          </div>
        </div>

        <!-- 底部科技標籤 -->
        <footer class="menu-footer">
          <span>NEO-CYBER ABYSS • SPATIAL MEMORY CHALLENGE</span>
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

    const tutorialBtn = this.element.querySelector('#tutorialBtn');
    if (tutorialBtn) {
      tutorialBtn.addEventListener('click', () => {
        AudioManager.playButtonClick();
        if (this.onOpenTutorialCallback) {
          this.onOpenTutorialCallback();
        } else {
          this.onStartGameCallback();
        }
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
