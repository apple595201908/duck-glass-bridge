import { Board } from '../components/Board';
import { DuckController } from '../components/DuckController';
import { StorageManager } from '../core/StorageManager';
import { AudioManager } from '../core/AudioManager';

export class TutorialScene {
  readonly element: HTMLElement;
  private board: Board;
  private duck: DuckController;
  private onCompleteCallback: () => void;
  private promptTextEl: HTMLElement;
  private sequence = [0, 3, 1];
  private playerStep = 0;
  private isShowingSequence = false;
  private isDestroyed = false;

  constructor(parent: HTMLElement, onComplete: () => void) {
    this.onCompleteCallback = onComplete;

    this.element = document.createElement('div');
    this.element.className = 'scene-container tutorial-scene';

    this.element.innerHTML = `
      <div class="tutorial-header">
        <div class="tutorial-badge">新手導引</div>
        <button type="button" class="btn-text skip-btn" id="tutSkipBtn">跳過</button>
      </div>
      <div class="tutorial-prompt" id="tutPrompt">
        👀 記住亮起順序
      </div>
      <div class="tutorial-board-area" id="tutBoardArea"></div>
      <div class="start-platform-dock" id="tutStartDock">
        <div class="dock-glow"></div>
        <span class="dock-label">START PLATFORM</span>
      </div>
    `;

    parent.appendChild(this.element);

    this.promptTextEl = this.element.querySelector('#tutPrompt') as HTMLElement;
    const boardArea = this.element.querySelector('#tutBoardArea') as HTMLElement;

    this.board = new Board(boardArea);
    this.duck = new DuckController(boardArea);

    const skipBtn = this.element.querySelector('#tutSkipBtn');
    if (skipBtn) {
      skipBtn.addEventListener('click', () => {
        AudioManager.playButtonClick();
        this.finish();
      });
    }

    this.board.onTileTap((index) => this.handleTileTap(index));
  }

  start(): void {
    this.board.setupGrid(2);
    this.duck.setGridSize(2);
    this.playerStep = 0;
    this.isShowingSequence = false;

    // 將鴨鴨放置於起跳台中央，題目展示時完全不阻礙視野
    requestAnimationFrame(() => {
      const dock = this.element.querySelector('#tutStartDock');
      const boardArea = this.element.querySelector('#tutBoardArea');
      if (dock && boardArea) {
        const dRect = dock.getBoundingClientRect();
        const bRect = boardArea.getBoundingClientRect();
        const x = dRect.left - bRect.left + dRect.width / 2;
        const y = dRect.top - bRect.top + dRect.height / 2;
        this.duck.reset(x, y);
      } else {
        const pos = this.board.getTileCenter(0);
        this.duck.setPosition(pos.x, pos.y);
      }
      this.runSequencePresentation();
    });
  }

  private async runSequencePresentation(): Promise<void> {
    if (this.isDestroyed) return;
    this.isShowingSequence = true;
    this.board.setInteractive(false);
    this.promptTextEl.textContent = '👀 記住亮起順序';

    await new Promise((r) => setTimeout(r, 400));

    for (let i = 0; i < this.sequence.length; i++) {
      if (this.isDestroyed) return;
      const tileIdx = this.sequence[i];
      const tile = this.board.getTile(tileIdx);
      if (tile) {
        await tile.highlight(i + 1, 780);
        await new Promise((r) => setTimeout(r, 170));
      }
    }

    if (this.isDestroyed) return;
    await new Promise((r) => setTimeout(r, 300));

    this.promptTextEl.textContent = '👉 換你了！照剛才順序點格子';
    this.isShowingSequence = false;
    this.board.setInteractive(true);
    this.playerStep = 0;
  }

  private handleTileTap(tileIndex: number): void {
    if (this.isShowingSequence || this.isDestroyed) return;

    if (this.duck.getIsMoving()) {
      this.duck.finishCurrentJump();
    }

    const targetPos = this.board.getTileCenter(tileIndex);
    const expected = this.sequence[this.playerStep];
    const tile = this.board.getTile(tileIndex);

    if (tileIndex === expected) {
      // 答對該步：立即回饋閃光
      tile?.tapFlash(true);

      const isLastStep = this.playerStep + 1 >= this.sequence.length;
      this.playerStep++;

      this.duck.jumpTo(targetPos.x, targetPos.y, () => {
        if (isLastStep) {
          // 完成教學
          this.board.setInteractive(false);
          this.promptTextEl.textContent = '🎉 太棒了！準備開始第 1 關';
          AudioManager.playLevelClear();
          setTimeout(() => {
            this.finish();
          }, 650);
        }
      });
    } else {
      // 點錯，親切提示重新觀看
      tile?.tapFlash(false);
      this.duck.jumpTo(targetPos.x, targetPos.y, () => {
        this.promptTextEl.textContent = '💡 沒關係，再看一次！';
        setTimeout(() => {
          this.runSequencePresentation();
        }, 500);
      });
    }
  }

  private finish(): void {
    StorageManager.setTutorialCompleted(true);
    this.isDestroyed = true;
    this.element.style.display = 'none';
    this.onCompleteCallback();
  }

  show(): void {
    this.isDestroyed = false;
    this.element.style.display = 'flex';
    this.start();
  }

  hide(): void {
    this.isDestroyed = true;
    this.element.style.display = 'none';
  }
}
