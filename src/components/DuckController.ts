import { DuckState } from '../types';
import { AudioManager } from '../core/AudioManager';
import duckIdleUrl from '../assets/duck_idle.png';
import duckJumpUrl from '../assets/duck_jump.png';
import duckShockUrl from '../assets/duck_shock.png';
import duckCelebrateUrl from '../assets/duck_celebrate.png';

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
  private moveDuration = 230; // 220-240ms 最佳卡通跳躍反饋與彈性質感
  private startX = 0;
  private startY = 0;
  private currentOnLand?: () => void;

  // 高品質透明角色素材
  private static readonly SPRITE_PATHS = {
    idle: duckIdleUrl,
    jump: duckJumpUrl,
    surprised: duckShockUrl,
    falling: duckShockUrl,
    celebrate: duckCelebrateUrl,
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

    // 水平翻轉與跳躍伸展包裝層 (獨立處理 scale、朝向與微傾角)
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

    // 預加載全部圖片
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
    this.updateTransform(0, 1, 1, 0);
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
    } else if (state === 'celebrate') {
      this.duckImg.src = DuckController.SPRITE_PATHS.celebrate;
      this.duckImg.className = 'duck-sprite-img duck-celebrate-pose';
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
    this.updateTransform(0, 1, 1, 0);
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
    this.updateTransform(0, 1, 1, 0);
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
   * 1. 根據跳躍距離動態計算拋物線最高點
   * 2. 平滑卡通 Squash & Stretch (非線性彈性過渡)
   * 3. 移動方向微傾角與動態影子大小
   * 4. 落地回彈彈性曲線 (Elastic Bounce)
   */
  jumpTo(x: number, y: number, onLand?: () => void): void {
    // 依據水平位移自動翻轉角色
    if (x > this.currentX + 6) {
      this.facingDir = 1;
    } else if (x < this.currentX - 6) {
      this.facingDir = -1;
    }

    this.startX = this.currentX;
    this.startY = this.currentY;
    this.targetX = x;
    this.targetY = y;
    this.currentOnLand = onLand;

    const distance = Math.hypot(x - this.startX, y - this.startY);
    // 根據距離動態決定弧線高度 (35px ~ 66px)
    const maxArc = Math.min(66, Math.max(34, distance * 0.24));

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

      // 平滑線性插值位置
      const curX = this.startX + (this.targetX - this.startX) * progress;
      const curY = this.startY + (this.targetY - this.startY) * progress;

      // 拋物線重力弧線 (4 * p * (1 - p))
      const arcFactor = 4 * progress * (1 - progress);
      const arcHeight = arcFactor * maxArc;

      // 平滑非線性 squash & stretch
      let scaleX = 1;
      let scaleY = 1;
      let tilt = 0;

      if (progress < 0.14) {
        // 起跳下蹲預備 (Squash)
        this.setState('prepare');
        const t = progress / 0.14;
        scaleX = 1 + 0.18 * t;
        scaleY = 1 - 0.18 * t;
      } else if (progress < 0.45) {
        // 衝向頂點拉長 (Stretch)
        this.setState('jump');
        const t = (progress - 0.14) / 0.31;
        scaleX = 1.18 - 0.28 * t; // 1.18 -> 0.90
        scaleY = 0.82 + 0.33 * t; // 0.82 -> 1.15
        tilt = Math.sin(t * Math.PI * 0.5) * 8 * this.facingDir;
      } else if (progress < 0.85) {
        // 下落微收 (Apex to descent)
        this.setState('jump');
        const t = (progress - 0.45) / 0.40;
        scaleX = 0.90 + 0.12 * t; // 0.90 -> 1.02
        scaleY = 1.15 - 0.12 * t; // 1.15 -> 1.03
        tilt = (1 - t) * 8 * this.facingDir;
      } else {
        // 觸地壓縮 (Touchdown Squash)
        this.setState('landing');
        const t = (progress - 0.85) / 0.15;
        scaleX = 1.02 + 0.18 * Math.sin(t * Math.PI);
        scaleY = 1.03 - 0.22 * Math.sin(t * Math.PI);
        tilt = 0;
      }

      this.currentX = curX;
      this.currentY = curY;
      this.updateTransform(arcHeight, scaleX, scaleY, tilt);

      // 影子高度與透明度響應
      const shadowRatio = Math.max(0.35, 1 - (arcHeight / maxArc) * 0.55);
      this.shadowElement.style.transform = `scale(${shadowRatio})`;
      this.shadowElement.style.opacity = `${0.45 * shadowRatio}`;

      if (progress < 1) {
        this.animationFrameId = requestAnimationFrame(animate);
      } else {
        this.isMoving = false;
        this.animationFrameId = null;
        this.setState('landing');
        AudioManager.playLanding();

        // 觸發落地回呼
        const cb = this.currentOnLand;
        this.currentOnLand = undefined;
        if (cb) {
          cb();
        }

        // 著地二次彈性回彈 (Juicy Elastic Jiggle: 80ms)
        this.playLandingBounce();
      }
    };

    this.animationFrameId = requestAnimationFrame(animate);
  }

  /**
   * 著地彈性緩衝二次微彈
   */
  private playLandingBounce(): void {
    const bounceStart = performance.now();
    const bounceDuration = 120;

    const tickBounce = (now: number) => {
      const elapsed = now - bounceStart;
      const progress = Math.min(1, elapsed / bounceDuration);
      // 衰減正弦彈性回正
      const decay = 1 - progress;
      const wave = Math.sin(progress * Math.PI * 2) * 0.08 * decay;
      const sX = 1 + wave;
      const sY = 1 - wave;

      this.updateTransform(0, sX, sY, 0);

      if (progress < 1 && !this.isMoving) {
        requestAnimationFrame(tickBounce);
      } else {
        if (!this.isMoving && (this.currentState === 'landing' || this.currentState === 'prepare')) {
          this.setState('idle');
          this.updateTransform(0, 1, 1, 0);
        }
      }
    };

    requestAnimationFrame(tickBounce);
  }

  /**
   * 過關慶祝勝利跳躍 (Victory Cheer)
   */
  celebrateClear(onComplete?: () => void): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }

    this.setState('celebrate');
    const startTime = performance.now();
    const duration = 520;

    const animateCelebrate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / duration);

      // 歡樂向上躍起並平穩落回
      const arc = Math.sin(progress * Math.PI) * 32;
      const wave = Math.sin(progress * Math.PI * 4) * 0.06;
      const scaleX = 1 + wave;
      const scaleY = 1 - wave;

      this.updateTransform(arc, scaleX, scaleY, 0);
      const shadowRatio = Math.max(0.5, 1 - (arc / 32) * 0.4);
      this.shadowElement.style.transform = `scale(${shadowRatio})`;
      this.shadowElement.style.opacity = `${0.45 * shadowRatio}`;

      if (progress < 1) {
        requestAnimationFrame(animateCelebrate);
      } else {
        this.updateTransform(0, 1, 1, 0);
        this.shadowElement.style.transform = 'scale(1)';
        this.shadowElement.style.opacity = '0.45';
        if (onComplete) {
          onComplete();
        }
      }
    };

    requestAnimationFrame(animateCelebrate);
  }

  /**
   * 掉入深淵動畫：露出巨大驚恐表情，失重螺旋旋轉墜入黑洞
   * 已修復：完全分離外層平移與內層方向縮放，徹底消除反向翻轉問題
   */
  playFallIntoAbyss(onComplete?: () => void): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }

    this.setState('surprised');
    AudioManager.playFalling();

    const fallStart = performance.now();
    const fallDuration = 950;
    const startY = this.currentY;

    this.shadowElement.style.opacity = '0';

    const animateFall = (now: number) => {
      const elapsed = now - fallStart;
      const progress = Math.min(1, elapsed / fallDuration);

      // 重力加速度深淵下墜
      const dropOffset = Math.pow(progress, 2.2) * 580;
      // 驚恐螺旋打轉 (同朝向旋轉)
      const rot = progress * 260 * this.facingDir;
      // 遠離視角縮小
      const scale = Math.max(0.02, 1 - progress * 0.94);
      // 加速消隱
      const opacity = Math.max(0, 1 - Math.pow(progress, 1.4));

      // 容器只負責世界座標平移
      this.container.style.transform = `translate3d(${this.currentX}px, ${startY + dropOffset}px, 0)`;
      this.container.style.opacity = `${opacity}`;

      // 內層封裝層負責朝向、等比縮放與螺旋旋轉，絕不相互衝突
      const finalScaleX = scale * this.facingDir * this.gridScale;
      const finalScaleY = scale * this.gridScale;
      this.flipWrapper.style.transform = `scale(${finalScaleX}, ${finalScaleY}) rotate(${rot}deg)`;

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

  private updateTransform(arcHeight: number, scaleX: number, scaleY: number, tiltAngle = 0): void {
    const finalScaleX = scaleX * this.facingDir * this.gridScale;
    const finalScaleY = scaleY * this.gridScale;
    this.container.style.transform = `translate3d(${this.currentX}px, ${this.currentY - arcHeight}px, 0)`;
    this.flipWrapper.style.transform = `scale(${finalScaleX}, ${finalScaleY}) rotate(${tiltAngle}deg)`;
  }

  getIsMoving(): boolean {
    return this.isMoving;
  }

  getElement(): HTMLElement {
    return this.container;
  }

  getCurrentPosition(): { x: number; y: number } {
    return { x: this.currentX, y: this.currentY };
  }
}
