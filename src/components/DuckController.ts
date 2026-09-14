import { DuckState } from '../types';
import { AudioManager } from '../core/AudioManager';
import duckIdleUrl from '../assets/duck_idle.png';
import duckJumpUrl from '../assets/duck_jump.png';
import duckShockUrl from '../assets/duck_shock.png';

export class DuckController {
  private container: HTMLElement;
  private flipWrapper: HTMLElement;
  private duckImg: HTMLImageElement;
  private shadowElement: HTMLElement;
  private currentState: DuckState = 'idle';
  private currentX = 0;
  private currentY = 0;
  private targetX = 0;
  private targetY = 0;
  private facingDir: 1 | -1 = 1;
  private gridScale = 1.0;
  private isMoving = false;
  private animationFrameId: number | null = null;
  private moveStartTime = 0;
  private moveDuration = 145; // 130-160ms 極速流暢起跳
  private startX = 0;
  private startY = 0;
  private currentOnLand?: () => void;

  // 高品質透明角色素材
  private static readonly SPRITE_PATHS = {
    idle: duckIdleUrl,
    jump: duckJumpUrl,
    surprised: duckShockUrl,
    falling: duckShockUrl,
  };

  constructor(parent: HTMLElement) {
    this.container = document.createElement('div');
    this.container.className = 'duck-avatar-wrapper';
    this.container.style.position = 'absolute';
    this.container.style.top = '0';
    this.container.style.left = '0';
    this.container.style.pointerEvents = 'none';
    this.container.style.zIndex = '25';
    this.container.style.willChange = 'transform';

    // 落地柔和陰影
    this.shadowElement = document.createElement('div');
    this.shadowElement.className = 'duck-shadow';
    this.container.appendChild(this.shadowElement);

    // 水平翻轉與跳躍伸展包裝層 (獨立處理 scale 與朝向，徹底隔絕 CSS 呼吸動畫衝突)
    this.flipWrapper = document.createElement('div');
    this.flipWrapper.className = 'duck-flip-wrapper';

    // 鴨鴨本體圖片
    this.duckImg = document.createElement('img');
    this.duckImg.className = 'duck-sprite-img duck-idle-anim';
    this.duckImg.src = DuckController.SPRITE_PATHS.idle;
    this.duckImg.alt = 'Chibi Duck';
    this.duckImg.draggable = false;
    this.flipWrapper.appendChild(this.duckImg);
    this.container.appendChild(this.flipWrapper);

    // 預加載圖片
    Object.values(DuckController.SPRITE_PATHS).forEach((src) => {
      const preload = new Image();
      preload.src = src;
    });

    parent.appendChild(this.container);
  }

  /**
   * 根據棋盤網格大小 (2x2 / 3x3 / 4x4) 自動適配鴨鴨體型
   */
  setGridSize(gridSize: 2 | 3 | 4): void {
    if (gridSize === 2) {
      this.gridScale = 1.05;
    } else if (gridSize === 3) {
      this.gridScale = 0.88;
    } else {
      this.gridScale = 0.72;
    }
    this.updateTransform(0, 1, 1);
  }

  setState(state: DuckState): void {
    if (this.currentState === state) return;
    this.currentState = state;

    if (state === 'jump' || state === 'prepare') {
      this.duckImg.src = DuckController.SPRITE_PATHS.jump;
      this.duckImg.className = 'duck-sprite-img duck-jump-pose';
    } else if (state === 'surprised' || state === 'falling') {
      this.duckImg.src = DuckController.SPRITE_PATHS.surprised;
      this.duckImg.className = 'duck-sprite-img duck-shock-pose';
    } else {
      this.duckImg.src = DuckController.SPRITE_PATHS.idle;
      this.duckImg.className = 'duck-sprite-img duck-idle-anim';
    }
  }

  setPosition(x: number, y: number): void {
    this.currentX = x;
    this.currentY = y;
    this.targetX = x;
    this.targetY = y;
    this.isMoving = false;
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    this.updateTransform(0, 1, 1);
  }

  /**
   * 若玩家在空中快速連點，立即完成當前跳躍動作並回呼
   */
  finishCurrentJump(): void {
    if (!this.isMoving) return;
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    this.isMoving = false;
    this.currentX = this.targetX;
    this.currentY = this.targetY;
    this.updateTransform(0, 1, 1);
    this.shadowElement.style.transform = 'scale(1)';
    this.shadowElement.style.opacity = '0.45';
    this.setState('idle');

    if (this.currentOnLand) {
      const cb = this.currentOnLand;
      this.currentOnLand = undefined;
      cb();
    }
  }

  /**
   * 跳向目標格子
   * 具備：
   * 1. 水平自動翻轉朝向 (Facing Direction: 往右走朝右、往左走朝左)
   * 2. 起跳下蹲 (Squash) ➔ 空中換 Jump 圖拉長 (Stretch) ➔ 落地瞬間彈性擠壓
   * 3. 影子動態縮放與透明度
   */
  jumpTo(x: number, y: number, onLand?: () => void): void {
    // 依據移動方向自動翻轉角色
    if (x > this.currentX + 5) {
      this.facingDir = 1;
    } else if (x < this.currentX - 5) {
      this.facingDir = -1;
    }

    this.startX = this.currentX;
    this.startY = this.currentY;
    this.targetX = x;
    this.targetY = y;
    this.currentOnLand = onLand;

    AudioManager.playJump();
    this.setState('prepare');
    this.isMoving = true;
    this.moveStartTime = performance.now();

    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
    }

    const animate = (now: number) => {
      const elapsed = now - this.moveStartTime;
      const progress = Math.min(1, elapsed / this.moveDuration);

      // 線性位置插值
      const curX = this.startX + (this.targetX - this.startX) * progress;
      const curY = this.startY + (this.targetY - this.startY) * progress;

      // 拋物線高度 (最高約 44px)
      const arcHeight = Math.sin(progress * Math.PI) * 44;

      // 彈性 squash & stretch
      let scaleX = 1;
      let scaleY = 1;

      if (progress < 0.15) {
        // 起跳微蹲
        this.setState('prepare');
        scaleX = 1.15;
        scaleY = 0.85;
      } else if (progress < 0.82) {
        // 空中伸展並切換為飛躍翅膀姿態
        this.setState('jump');
        scaleX = 0.92;
        scaleY = 1.16;
      } else {
        // 落地觸地瞬間擠壓
        this.setState('landing');
        const landT = (progress - 0.82) / 0.18;
        scaleX = 1.18 - 0.18 * landT;
        scaleY = 0.82 + 0.18 * landT;
      }

      this.currentX = curX;
      this.currentY = curY;
      this.updateTransform(arcHeight, scaleX, scaleY);

      // 影子高度響應
      const shadowRatio = 1 - (arcHeight / 44) * 0.55;
      this.shadowElement.style.transform = `scale(${shadowRatio})`;
      this.shadowElement.style.opacity = `${0.45 * shadowRatio}`;

      if (progress < 1) {
        this.animationFrameId = requestAnimationFrame(animate);
      } else {
        this.isMoving = false;
        this.animationFrameId = null;
        this.setState('landing');
        AudioManager.playLanding();

        const cb = this.currentOnLand;
        this.currentOnLand = undefined;
        if (cb) {
          cb();
        }

        setTimeout(() => {
          if (this.currentState === 'landing') {
            this.setState('idle');
          }
        }, 70);
      }
    };

    this.animationFrameId = requestAnimationFrame(animate);
  }

  /**
   * 掉入深淵動畫：露出巨大驚恐表情，失重旋轉墜入黑洞
   */
  playFallIntoAbyss(onComplete?: () => void): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }

    this.setState('surprised');
    AudioManager.playFalling();

    const fallStart = performance.now();
    const fallDuration = 900;
    const startY = this.currentY;

    this.shadowElement.style.opacity = '0';

    const animateFall = (now: number) => {
      const elapsed = now - fallStart;
      const progress = Math.min(1, elapsed / fallDuration);

      // 重力加速度深淵下墜
      const dropOffset = Math.pow(progress, 2.3) * 500;
      const rot = progress * 160 * this.facingDir;
      const scale = Math.max(0.05, 1 - progress * 0.85);
      const opacity = Math.max(0, 1 - progress * 1.25);

      this.container.style.transform = `translate3d(${this.currentX}px, ${startY + dropOffset}px, 0) scale(${scale * this.facingDir}, ${scale}) rotate(${rot}deg)`;
      this.container.style.opacity = `${opacity}`;

      if (progress < 1) {
        requestAnimationFrame(animateFall);
      } else {
        this.container.style.visibility = 'hidden';
        if (onComplete) {
          onComplete();
        }
      }
    };

    requestAnimationFrame(animateFall);
  }

  reset(x: number, y: number): void {
    this.container.style.visibility = 'visible';
    this.container.style.opacity = '1';
    this.shadowElement.style.opacity = '0.45';
    this.shadowElement.style.transform = 'scale(1)';
    this.facingDir = 1;
    this.setState('idle');
    this.setPosition(x, y);
  }

  private updateTransform(arcHeight: number, scaleX: number, scaleY: number): void {
    const finalScaleX = scaleX * this.facingDir * this.gridScale;
    const finalScaleY = scaleY * this.gridScale;
    this.container.style.transform = `translate3d(${this.currentX}px, ${this.currentY - arcHeight}px, 0)`;
    this.flipWrapper.style.transform = `scale(${finalScaleX}, ${finalScaleY})`;
  }

  getIsMoving(): boolean {
    return this.isMoving;
  }

  getElement(): HTMLElement {
    return this.container;
  }
}

