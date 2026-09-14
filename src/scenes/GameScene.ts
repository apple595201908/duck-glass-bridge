import { GameStateManager } from '../core/GameStateManager';
import { DifficultyManager } from '../core/DifficultyManager';
import { SequenceGenerator } from '../core/SequenceGenerator';
import { ScoreManager } from '../core/ScoreManager';
import { AudioManager } from '../core/AudioManager';
import { Board } from '../components/Board';
import { DuckController } from '../components/DuckController';
import { SevenSegmentDisplay } from '../ui/SevenSegmentDisplay';
import { GlassShatterEffect } from '../effects/GlassShatterEffect';
import { LevelConfig } from '../types';

export class GameScene {
  readonly element: HTMLElement;
  private stateManager: GameStateManager;
  private scoreManager: ScoreManager;
  private board: Board;
  private duck: DuckController;

  // UI 元素
  private hudLevelContainer: HTMLElement;
  private hudScoreContainer: HTMLElement;
  private hudBestContainer: HTMLElement;
  private statusPromptEl: HTMLElement;
  private pauseModalEl: HTMLElement;
  private gameOverModalEl: HTMLElement;
  private bannerAlertEl: HTMLElement;

  // 關卡進度與序列狀態
  private currentLevelConfig!: LevelConfig;
  private currentSequence: number[] = [];
  private playerInputStep = 0;
  private inputStartTime = 0;

  // 暫停與播放恢復控制
  private sequenceStepIndex = 0;
  private isSequenceCancelled = false;

  // 回呼
  private onReturnToMenuCallback: () => void;

  constructor(parent: HTMLElement, onReturnToMenu: () => void) {
    this.onReturnToMenuCallback = onReturnToMenu;
    this.stateManager = new GameStateManager();
    this.scoreManager = new ScoreManager();

    this.element = document.createElement('div');
    this.element.className = 'scene-container game-scene';

    this.element.innerHTML = `
      <!-- 頂部 HUD (老式實驗室紅色七段電子數位儀表) -->
      <header class="game-hud">
        <div class="hud-box">
          <div class="hud-label">LEVEL</div>
          <div class="hud-display" id="hudLevel"></div>
        </div>
        <div class="hud-box">
          <div class="hud-label">SCORE</div>
          <div class="hud-display" id="hudScore"></div>
        </div>
        <div class="hud-box">
          <div class="hud-label">BEST</div>
          <div class="hud-display" id="hudBest"></div>
        </div>
        <button type="button" class="icon-button pause-btn" id="pauseBtn" aria-label="暫停遊戲">⏸</button>
      </header>

      <!-- 狀態即時提示 (看題目 / 換你了 / 過關) -->
      <div class="status-banner-wrapper">
        <div class="status-prompt" id="statusPrompt">準備開始...</div>
        <!-- 關卡重大升級橫幅 (例如 3x3 / 4x4 提示) -->
        <div class="board-upgrade-banner" id="boardUpgradeBanner"></div>
      </div>

      <!-- 主遊戲棋盤舞台 -->
      <main class="game-board-container" id="gameBoardContainer">
        <!-- Board & DuckController 會掛載於此 -->
      </main>

      <!-- 起跳台 (Duck 於看題目期間在此待命，避免遮擋任何題目格子或數字) -->
      <div class="start-platform-dock" id="startPlatformDock">
        <div class="dock-glow"></div>
        <span class="dock-label">START PLATFORM</span>
      </div>

      <!-- 暫停遮罩視窗 (完全遮蔽棋盤，防止作弊偷看) -->
      <div class="modal-backdrop" id="pauseModal" style="display: none;">
        <div class="modal-card pause-card">
          <h2 class="modal-title">遊戲暫停</h2>
          <p class="modal-desc">深淵玻璃橋已暫時凍結</p>
          <div class="modal-actions">
            <button type="button" class="btn-primary" id="resumeBtn">繼續挑戰</button>
            <button type="button" class="btn-secondary" id="pauseMenuBtn">返回主選單</button>
          </div>
        </div>
      </div>

      <!-- 失敗 Game Over 結算視窗 -->
      <div class="modal-backdrop" id="gameOverModal" style="display: none;">
        <div class="modal-card game-over-card">
          <div class="game-over-header">
            <div class="skull-icon">⚠️</div>
            <h2 class="game-over-title">GAME OVER</h2>
            <p class="game-over-subtitle">踩中脆弱玻璃，摔落深淵！</p>
          </div>

          <div class="final-score-panel">
            <div class="final-score-row">
              <span class="label">本次關卡</span>
              <span class="val highlight" id="goLevel">1</span>
            </div>
            <div class="final-score-row">
              <span class="label">本次得分</span>
              <span class="val highlight" id="goScore">0</span>
            </div>
            <div class="final-score-divider"></div>
            <div class="final-score-row">
              <span class="label">歷史最高關卡</span>
              <span class="val" id="goBestLevel">1</span>
            </div>
            <div class="final-score-row">
              <span class="label">歷史最高得分</span>
              <span class="val" id="goBestScore">0</span>
            </div>
          </div>

          <div class="new-record-badge" id="newRecordBadge" style="display: none;">
            🏆 破紀錄啦！
          </div>

          <div class="modal-actions">
            <button type="button" class="btn-primary restart-btn" id="restartBtn">
              再玩一次
            </button>
            <div class="secondary-btn-row">
              <button type="button" class="btn-secondary" id="shareBtn">分享成績</button>
              <button type="button" class="btn-secondary" id="goMenuBtn">返回首頁</button>
            </div>
          </div>
        </div>
      </div>
    `;

    parent.appendChild(this.element);

    this.hudLevelContainer = this.element.querySelector('#hudLevel') as HTMLElement;
    this.hudScoreContainer = this.element.querySelector('#hudScore') as HTMLElement;
    this.hudBestContainer = this.element.querySelector('#hudBest') as HTMLElement;
    this.statusPromptEl = this.element.querySelector('#statusPrompt') as HTMLElement;
    this.pauseModalEl = this.element.querySelector('#pauseModal') as HTMLElement;
    this.gameOverModalEl = this.element.querySelector('#gameOverModal') as HTMLElement;
    this.bannerAlertEl = this.element.querySelector('#boardUpgradeBanner') as HTMLElement;

    const boardArea = this.element.querySelector('#gameBoardContainer') as HTMLElement;
    this.board = new Board(boardArea);
    this.duck = new DuckController(boardArea);

    this.bindEvents();
  }

  private bindEvents(): void {
    // 棋盤點擊回呼
    this.board.onTileTap((index) => this.handlePlayerTileTap(index));

    // 暫停按鈕
    const pauseBtn = this.element.querySelector('#pauseBtn');
    pauseBtn?.addEventListener('click', () => {
      AudioManager.playButtonClick();
      this.pauseGame();
    });

    // 繼續挑戰
    const resumeBtn = this.element.querySelector('#resumeBtn');
    resumeBtn?.addEventListener('click', () => {
      AudioManager.playButtonClick();
      this.resumeGame();
    });

    // 暫停內返回主選單
    const pauseMenuBtn = this.element.querySelector('#pauseMenuBtn');
    pauseMenuBtn?.addEventListener('click', () => {
      AudioManager.playButtonClick();
      this.returnToMenu();
    });

    // 再玩一次 (立即 Reset 遊戲狀態，絕不重新載入整個網頁)
    const restartBtn = this.element.querySelector('#restartBtn');
    restartBtn?.addEventListener('click', () => {
      AudioManager.playButtonClick();
      this.restartGame();
    });

    // 返回首頁
    const goMenuBtn = this.element.querySelector('#goMenuBtn');
    goMenuBtn?.addEventListener('click', () => {
      AudioManager.playButtonClick();
      this.returnToMenu();
    });

    // 分享成績
    const shareBtn = this.element.querySelector('#shareBtn');
    shareBtn?.addEventListener('click', () => {
      this.shareScore();
    });
  }

  /**
   * 開始新遊戲
   */
  startNewGame(): void {
    this.scoreManager.reset();
    this.gameOverModalEl.style.display = 'none';
    this.pauseModalEl.style.display = 'none';
    this.updateHud();
    this.loadLevel(1);
  }

  /**
   * 載入指定關卡
   */
  private async loadLevel(level: number): Promise<void> {
    this.stateManager.setState('LEVEL_INTRO');
    this.currentLevelConfig = DifficultyManager.getConfig(level);
    this.board.setInteractive(false);

    // 檢查是否有棋盤升級 (例如 Level 9 升為 3x3, Level 16 升為 4x4)
    const upgrade = DifficultyManager.isBoardUpgrade(level);
    if (upgrade.upgraded) {
      this.bannerAlertEl.textContent = upgrade.title;
      this.bannerAlertEl.classList.add('banner-visible');
      setTimeout(() => {
        this.bannerAlertEl.classList.remove('banner-visible');
      }, 1400);
    }

    // 初始化棋盤網格
    this.board.setupGrid(this.currentLevelConfig.gridSize);
    this.updateHud();

    // 鴨鴨初始就位於起跳台，絕不遮擋任何棋盤格子與數字
    requestAnimationFrame(() => {
      const dock = this.element.querySelector('#startPlatformDock');
      const boardArea = this.element.querySelector('#gameBoardContainer');
      if (dock && boardArea) {
        const dRect = dock.getBoundingClientRect();
        const bRect = boardArea.getBoundingClientRect();
        const x = dRect.left - bRect.left + dRect.width / 2;
        const y = dRect.top - bRect.top + dRect.height / 2;
        this.duck.reset(x, y);
      } else {
        const startPos = this.board.getTileCenter(0);
        this.duck.reset(startPos.x, startPos.y);
      }
    });

    // 顯示 LEVEL XX 提示
    this.statusPromptEl.textContent = `LEVEL ${level.toString().padStart(2, '0')}`;
    this.statusPromptEl.className = 'status-prompt prompt-intro';

    // 等待關卡介紹約 450ms
    await new Promise((r) => setTimeout(r, this.currentLevelConfig.timing.introDelayMs));

    // 生成題目
    this.currentSequence = SequenceGenerator.generate(
      this.currentLevelConfig.gridSize,
      this.currentLevelConfig.sequenceLength
    );

    // 進入題目展示
    this.playSequence(0);
  }

  /**
   * 播放題目亮格序列
   */
  private async playSequence(startIndex = 0): Promise<void> {
    this.stateManager.setState('SHOW_SEQUENCE');
    this.isSequenceCancelled = false;
    this.board.setInteractive(false);
    this.statusPromptEl.textContent = '👀 記住順序...';
    this.statusPromptEl.className = 'status-prompt prompt-watch';

    for (let i = startIndex; i < this.currentSequence.length; i++) {
      if (this.isSequenceCancelled) {
        this.sequenceStepIndex = i;
        return;
      }

      this.sequenceStepIndex = i;
      const tileIdx = this.currentSequence[i];
      const tile = this.board.getTile(tileIdx);

      if (tile) {
        // 每一格亮起時間與清晰數字
        await tile.highlight(i + 1, this.currentLevelConfig.timing.tileOnMs);

        if (this.isSequenceCancelled) return;

        // 熄滅間隔
        await new Promise((r) => setTimeout(r, this.currentLevelConfig.timing.tileGapMs));
      }
    }

    if (this.isSequenceCancelled) return;

    // 展示全部完成後短暫等待約 380ms
    await new Promise((r) => setTimeout(r, this.currentLevelConfig.timing.postSequenceDelayMs));
    if (this.isSequenceCancelled) return;

    // 解鎖玩家輸入
    this.statusPromptEl.textContent = '👉 換你了！';
    this.statusPromptEl.className = 'status-prompt prompt-turn';
    this.stateManager.setState('PLAYER_INPUT');
    this.playerInputStep = 0;
    this.inputStartTime = performance.now();
    this.board.setInteractive(true);
  }

  /**
   * 處理玩家點擊格子
   */
  private handlePlayerTileTap(tileIndex: number): void {
    if (!this.stateManager.canAcceptInput()) return;

    const expectedTile = this.currentSequence[this.playerInputStep];
    const targetPos = this.board.getTileCenter(tileIndex);

    if (tileIndex === expectedTile) {
      // 答對該步
      this.duck.jumpTo(targetPos.x, targetPos.y, () => {
        const tile = this.board.getTile(tileIndex);
        tile?.tapFlash(true);
      });

      this.playerInputStep++;

      // 檢查是否全數答對完成本關
      if (this.playerInputStep >= this.currentSequence.length) {
        this.handleLevelClear();
      }
    } else {
      // 答錯！觸發玻璃碎裂與深淵墜落演出
      this.handlePlayerMistake(tileIndex);
    }
  }

  /**
   * 過關處理
   */
  private async handleLevelClear(): Promise<void> {
    this.stateManager.setState('LEVEL_CLEAR');
    this.board.setInteractive(false);
    AudioManager.playLevelClear();

    const duration = performance.now() - this.inputStartTime;
    this.scoreManager.addLevelScore(this.currentLevelConfig, duration);
    this.updateHud();

    this.statusPromptEl.textContent = '✨ 過關！';
    this.statusPromptEl.className = 'status-prompt prompt-clear';

    // 等待約 600ms 成功慶祝後自動進入下一關
    await new Promise((r) => setTimeout(r, this.currentLevelConfig.timing.levelClearDelayMs));
    this.loadLevel(this.currentLevelConfig.level + 1);
  }

  /**
   * 答錯演出：
   * 鴨鴨跳往點擊的錯誤格子 -> 落地第一條裂痕 -> ~100ms 擴散 -> 碎裂 -> 鴨鴨驚恐摔入深淵 -> Game Over
   */
  private async handlePlayerMistake(wrongTileIndex: number): Promise<void> {
    this.stateManager.setState('GAME_OVER');
    this.board.setInteractive(false);

    const wrongTile = this.board.getTile(wrongTileIndex);
    const targetPos = this.board.getTileCenter(wrongTileIndex);

    // 鴨鴨先跳向該格
    this.duck.jumpTo(targetPos.x, targetPos.y, async () => {
      // 落地瞬間：玻璃出現第一條裂紋並擴散
      if (wrongTile) {
        await wrongTile.startCracking();
      }

      // 整塊玻璃粉碎
      wrongTile?.shatter();

      // 產生預製玻璃多邊形碎片落下
      if (wrongTile) {
        const tRect = wrongTile.element.getBoundingClientRect();
        const bRect = this.board.element.getBoundingClientRect();
        GlassShatterEffect.spawnShards(this.board.element, tRect, bRect);
      }

      // 輕微鏡頭晃動
      GlassShatterEffect.triggerCameraShake(this.board.element);

      // 鴨鴨驚恐掉落深淵
      this.duck.playFallIntoAbyss(() => {
        this.showGameOverModal();
      });
    });
  }

  /**
   * 顯示 Game Over 結算畫面
   */
  private showGameOverModal(): void {
    const scoreState = this.scoreManager.getState();

    const goLevelEl = this.element.querySelector('#goLevel');
    const goScoreEl = this.element.querySelector('#goScore');
    const goBestLevelEl = this.element.querySelector('#goBestLevel');
    const goBestScoreEl = this.element.querySelector('#goBestScore');
    const newRecordBadge = this.element.querySelector('#newRecordBadge') as HTMLElement;

    if (goLevelEl) goLevelEl.textContent = scoreState.currentLevel.toString();
    if (goScoreEl) goScoreEl.textContent = scoreState.currentScore.toLocaleString();
    if (goBestLevelEl) goBestLevelEl.textContent = scoreState.bestLevel.toString();
    if (goBestScoreEl) goBestScoreEl.textContent = scoreState.bestScore.toLocaleString();

    if (newRecordBadge) {
      newRecordBadge.style.display = scoreState.isNewRecord ? 'block' : 'none';
    }

    this.gameOverModalEl.style.display = 'flex';
  }

  /**
   * 重新開始遊戲 (即時 Reset，不 Reload 網頁)
   */
  private restartGame(): void {
    this.gameOverModalEl.style.display = 'none';
    this.startNewGame();
  }

  /**
   * 暫停遊戲
   */
  private pauseGame(): void {
    if (this.stateManager.getState() === 'GAME_OVER' || this.stateManager.getState() === 'PAUSED') return;

    if (this.stateManager.getState() === 'SHOW_SEQUENCE') {
      this.isSequenceCancelled = true;
    }

    this.stateManager.setState('PAUSED');
    this.board.setInteractive(false);
    this.pauseModalEl.style.display = 'flex';
  }

  /**
   * 繼續遊戲 (從原先位置流暢繼續)
   */
  private resumeGame(): void {
    this.pauseModalEl.style.display = 'none';
    const prev = this.stateManager.getPreviousState();

    if (prev === 'SHOW_SEQUENCE') {
      this.playSequence(this.sequenceStepIndex);
    } else if (prev === 'PLAYER_INPUT') {
      this.stateManager.setState('PLAYER_INPUT');
      this.board.setInteractive(true);
    } else {
      this.stateManager.setState(prev);
    }
  }

  /**
   * 返回主選單
   */
  private returnToMenu(): void {
    this.isSequenceCancelled = true;
    this.pauseModalEl.style.display = 'none';
    this.gameOverModalEl.style.display = 'none';
    this.element.style.display = 'none';
    this.onReturnToMenuCallback();
  }

  /**
   * 分享成績
   */
  private shareScore(): void {
    const scoreState = this.scoreManager.getState();
    const text = `🐥 我在《鴨鴨跳格子》挑戰到了第 ${scoreState.currentLevel} 關，拿下 ${scoreState.currentScore} 分！你能記得住深淵玻璃橋的順序嗎？`;

    if (navigator.share) {
      navigator.share({
        title: '鴨鴨跳格子 - 空間序列記憶挑戰',
        text,
        url: window.location.href,
      }).catch(() => {});
    } else if (navigator.clipboard) {
      navigator.clipboard.writeText(`${text} ${window.location.href}`).then(() => {
        alert('成績已複製到剪貼簿，快發給朋友挑戰吧！');
      }).catch(() => {});
    }
  }

  /**
   * 更新 HUD 七段 LED 顯示器
   */
  private updateHud(): void {
    const state = this.scoreManager.getState();
    this.hudLevelContainer.innerHTML = SevenSegmentDisplay.render(state.currentLevel, 2);
    this.hudScoreContainer.innerHTML = SevenSegmentDisplay.render(state.currentScore, 6);
    this.hudBestContainer.innerHTML = SevenSegmentDisplay.render(state.bestScore, 6);
  }

  /**
   * 測試與自動化驗證輔助方法
   */
  testLoadLevel(level: number): Promise<void> {
    return this.loadLevel(level);
  }

  testTriggerMistake(): void {
    const total = this.currentLevelConfig.gridSize * this.currentLevelConfig.gridSize;
    const expected = this.currentSequence[this.playerInputStep] ?? 0;
    const wrong = (expected + 1) % total;
    this.handlePlayerMistake(wrong);
  }

  show(): void {
    this.element.style.display = 'flex';
  }

  hide(): void {
    this.element.style.display = 'none';
  }
}
