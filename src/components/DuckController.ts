import { DuckState } from '../types';
import { AudioManager } from '../core/AudioManager';

export class DuckController {
  private container: HTMLElement;
  private duckElement: HTMLElement;
  private shadowElement: HTMLElement;
  private currentState: DuckState = 'idle';
  private currentX = 0;
  private currentY = 0;
  private targetX = 0;
  private targetY = 0;
  private isMoving = false;
  private animationFrameId: number | null = null;
  private moveStartTime = 0;
  private moveDuration = 150; // 120-180ms 內完成
  private startX = 0;
  private startY = 0;

  constructor(parent: HTMLElement) {
    this.container = document.createElement('div');
    this.container.className = 'duck-avatar-wrapper';
    this.container.style.position = 'absolute';
    this.container.style.top = '0';
    this.container.style.left = '0';
    this.container.style.pointerEvents = 'none';
    this.container.style.zIndex = '20';
    this.container.style.willChange = 'transform';

    // 陰影
    this.shadowElement = document.createElement('div');
    this.shadowElement.className = 'duck-shadow';
    this.container.appendChild(this.shadowElement);

    // 鴨鴨本體
    this.duckElement = document.createElement('div');
    this.duckElement.className = 'duck-body-container duck-idle';
    this.duckElement.innerHTML = this.getDuckSvg('idle');
    this.container.appendChild(this.duckElement);

    parent.appendChild(this.container);
  }

  /**
   * 繪製原創高解析可愛 Q 版小黃鴨 SVG
   * 包含：
   * - 大頭、呆毛、圓滾滾身體
   * - 短翅膀、短腳、橘黃色圓潤嘴巴、橘色腳掌
   * - 黑色圓滾大眼睛 (雙重水汪汪高光)
   * - 臉頰微粉紅腮紅
   * - 支援 idle / jump / surprised / falling 等表情切換
   */
  private getDuckSvg(state: DuckState): string {
    const isSurprised = state === 'surprised' || state === 'falling';

    return `
      <svg class="duck-vector" viewBox="0 0 100 100" width="76" height="76" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <!-- 鴨毛溫潤漸層 -->
          <radialGradient id="duckGrad" cx="38%" cy="32%" r="65%">
            <stop offset="0%" stop-color="#fff570" />
            <stop offset="60%" stop-color="#ffdc1c" />
            <stop offset="100%" stop-color="#f5b800" />
          </radialGradient>
          <!-- 翅膀立體漸層 -->
          <linearGradient id="wingGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#ffe640" />
            <stop offset="100%" stop-color="#e6a800" />
          </linearGradient>
          <!-- 嘴巴漸層 -->
          <linearGradient id="beakGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="#ff8d21" />
            <stop offset="100%" stop-color="#e85b00" />
          </linearGradient>
          <!-- 腳掌漸層 -->
          <linearGradient id="footGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="#ffa034" />
            <stop offset="100%" stop-color="#e56700" />
          </linearGradient>
        </defs>

        <!-- 腳掌 (平時在下，墜落時微收) -->
        <g class="duck-feet" style="transform-origin: 50% 90%;">
          <!-- 左腳 -->
          <path d="M 33 82 C 30 84 27 88 28 92 C 30 95 38 94 40 89 C 41 85 37 82 33 82 Z" fill="url(#footGrad)" />
          <!-- 右腳 -->
          <path d="M 67 82 C 70 84 73 88 72 92 C 70 95 62 94 60 89 C 59 85 63 82 67 82 Z" fill="url(#footGrad)" />
        </g>

        <!-- 圓滾滾身軀 -->
        <ellipse cx="50" cy="58" rx="34" ry="30" fill="url(#duckGrad)" />
        
        <!-- 肚皮高光柔亮 -->
        <path d="M 28 64 C 30 76 70 76 72 64 C 68 56 32 56 28 64 Z" fill="#fff9a8" opacity="0.45" />

        <!-- 翅膀 (左側短翅) -->
        <g class="duck-left-wing" style="transform-origin: 22% 54%;">
          <path d="M 22 50 C 14 53 13 67 20 70 C 27 72 29 60 25 52 Z" fill="url(#wingGrad)" />
        </g>
        <!-- 翅膀 (右側短翅) -->
        <g class="duck-right-wing" style="transform-origin: 78% 54%;">
          <path d="M 78 50 C 86 53 87 67 80 70 C 73 72 71 60 75 52 Z" fill="url(#wingGrad)" />
        </g>

        <!-- 呆毛 (頭頂俏皮呆毛) -->
        <path d="M 48 18 C 45 10 39 8 36 10 C 34 11 38 14 42 16 C 40 12 43 7 46 6 C 48 6 49 11 48 18 Z" fill="#ffe024" />

        <!-- 大圓頭部 (Q版大頭比例) -->
        <ellipse cx="50" cy="38" rx="30" ry="26" fill="url(#duckGrad)" />

        <!-- 腮紅 (粉嫩可愛微暈) -->
        <ellipse cx="28" cy="46" rx="5.5" ry="3.5" fill="#ff7f7f" opacity="0.6" />
        <ellipse cx="72" cy="46" rx="5.5" ry="3.5" fill="#ff7f7f" opacity="0.6" />

        <!-- 眼睛與表情 -->
        ${
          isSurprised
            ? `
          <!-- 驚訝大圓眼 (睜大驚恐) -->
          <g class="eyes-surprised">
            <circle cx="36" cy="35" r="7.5" fill="#ffffff" stroke="#222" stroke-width="1.5" />
            <circle cx="36" cy="35" r="3.2" fill="#111" />
            <circle cx="38" cy="33" r="1.2" fill="#ffffff" />

            <circle cx="64" cy="35" r="7.5" fill="#ffffff" stroke="#222" stroke-width="1.5" />
            <circle cx="64" cy="35" r="3.2" fill="#111" />
            <circle cx="66" cy="33" r="1.2" fill="#ffffff" />
          </g>
          <!-- 驚恐張大的 O 型嘴 -->
          <g class="beak-surprised">
            <ellipse cx="50" cy="50" rx="9" ry="11" fill="#4a0f00" stroke="url(#beakGrad)" stroke-width="3" />
            <ellipse cx="50" cy="53" rx="5" ry="4" fill="#ff5a5a" />
          </g>
        `
            : `
          <!-- 正常萌系水汪汪大黑眼 -->
          <g class="eyes-normal">
            <!-- 左眼 -->
            <ellipse cx="37" cy="35" rx="5.5" ry="6.5" fill="#1a150e" />
            <!-- 左眼主高光 -->
            <circle cx="35" cy="32.5" r="2.4" fill="#ffffff" />
            <!-- 左眼副高光 -->
            <circle cx="39" cy="37" r="1.1" fill="#ffffff" />

            <!-- 右眼 -->
            <ellipse cx="63" cy="35" rx="5.5" ry="6.5" fill="#1a150e" />
            <!-- 右眼主高光 -->
            <circle cx="61" cy="32.5" r="2.4" fill="#ffffff" />
            <!-- 右眼副高光 -->
            <circle cx="65" cy="37" r="1.1" fill="#ffffff" />
          </g>

          <!-- 圓潤可愛橘黃小鴨嘴 -->
          <g class="beak-normal">
            <path d="M 38 43 C 40 39 60 39 62 43 C 65 47 62 52 50 53 C 38 52 35 47 38 43 Z" fill="url(#beakGrad)" />
            <!-- 嘴唇反光 -->
            <path d="M 43 42 C 46 40 54 40 57 42" stroke="#ffc06a" stroke-width="1.5" stroke-linecap="round" fill="none" />
          </g>
        `
        }
      </svg>
    `;
  }

  setState(state: DuckState): void {
    if (this.currentState === state) return;
    this.currentState = state;

    this.duckElement.className = `duck-body-container duck-${state}`;
    this.duckElement.innerHTML = this.getDuckSvg(state);
  }

  /**
   * 瞬移設定初始位置（無動畫）
   */
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
   * 跳向目標位置
   * 規格：單次跳躍 120～180ms，具有 squash & stretch 與拋物線
   */
  jumpTo(x: number, y: number, onLand?: () => void): void {
    this.startX = this.currentX;
    this.startY = this.currentY;
    this.targetX = x;
    this.targetY = y;

    AudioManager.playJump();
    this.setState('jump');
    this.isMoving = true;
    this.moveStartTime = performance.now();

    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
    }

    const animate = (now: number) => {
      const elapsed = now - this.moveStartTime;
      const progress = Math.min(1, elapsed / this.moveDuration);

      // 線性移動 (X, Y)
      const curX = this.startX + (this.targetX - this.startX) * progress;
      const curY = this.startY + (this.targetY - this.startY) * progress;

      // 拋物線高度 (Arc height: 40px)
      const arcHeight = Math.sin(progress * Math.PI) * 42;

      // 壓扁拉伸效果 (Squash & Stretch)
      let scaleX = 1;
      let scaleY = 1;

      if (progress < 0.15) {
        // 起跳起跑微微下蹲 (Squash)
        scaleX = 1.15;
        scaleY = 0.85;
      } else if (progress < 0.8) {
        // 空中伸長 (Stretch)
        scaleX = 0.9;
        scaleY = 1.18;
      } else {
        // 落地瞬間擠壓
        const landT = (progress - 0.8) / 0.2;
        scaleX = 1.2 - 0.2 * landT;
        scaleY = 0.8 + 0.2 * landT;
      }

      this.currentX = curX;
      this.currentY = curY;
      this.updateTransform(arcHeight, scaleX, scaleY);

      // 影子隨跳躍高度縮放與淡化
      const shadowScale = 1 - (arcHeight / 42) * 0.45;
      const shadowOpacity = 0.4 - (arcHeight / 42) * 0.25;
      this.shadowElement.style.transform = `scale(${shadowScale})`;
      this.shadowElement.style.opacity = `${shadowOpacity}`;

      if (progress < 1) {
        this.animationFrameId = requestAnimationFrame(animate);
      } else {
        this.isMoving = false;
        this.animationFrameId = null;
        this.setState('landing');
        AudioManager.playLanding();

        // 觸發落地回呼
        if (onLand) {
          onLand();
        }

        // 短暫回彈至正常 idle
        setTimeout(() => {
          if (this.currentState === 'landing') {
            this.setState('idle');
          }
        }, 80);
      }
    };

    this.animationFrameId = requestAnimationFrame(animate);
  }

  /**
   * 掉落深淵演出
   * 鴨鴨露出驚訝表情，失去立足點，旋轉縮小跌入黑暗深淵
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

    // 陰影立即消失
    this.shadowElement.style.opacity = '0';

    const animateFall = (now: number) => {
      const elapsed = now - fallStart;
      const progress = Math.min(1, elapsed / fallDuration);

      // 加速度向下下墜
      const dropOffset = Math.pow(progress, 2.2) * 450;
      const rot = progress * 160;
      const scale = Math.max(0.05, 1 - progress * 0.85);
      const opacity = Math.max(0, 1 - progress * 1.2);

      this.container.style.transform = `translate3d(${this.currentX}px, ${startY + dropOffset}px, 0) scale(${scale}) rotate(${rot}deg)`;
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

  /**
   * 重設可見度與狀態
   */
  reset(x: number, y: number): void {
    this.container.style.visibility = 'visible';
    this.container.style.opacity = '1';
    this.shadowElement.style.opacity = '0.4';
    this.setState('idle');
    this.setPosition(x, y);
  }

  private updateTransform(arcHeight: number, scaleX: number, scaleY: number): void {
    this.container.style.transform = `translate3d(${this.currentX}px, ${this.currentY - arcHeight}px, 0)`;
    this.duckElement.style.transform = `scale(${scaleX}, ${scaleY})`;
  }

  getIsMoving(): boolean {
    return this.isMoving;
  }

  getElement(): HTMLElement {
    return this.container;
  }
}
