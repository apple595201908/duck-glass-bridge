import { AudioManager } from '../core/AudioManager';

export class GlassTile {
  readonly index: number;
  readonly row: number;
  readonly col: number;
  readonly element: HTMLElement;

  private innerPane: HTMLElement;
  private glowLayer: HTMLElement;
  private numberBadge: HTMLElement;
  private crackLayer: HTMLElement;
  private isCracked = false;

  constructor(index: number, row: number, col: number) {
    this.index = index;
    this.row = row;
    this.col = col;

    this.element = document.createElement('button');
    this.element.className = 'glass-tile';
    this.element.setAttribute('data-tile-index', index.toString());
    this.element.setAttribute('type', 'button');
    this.element.setAttribute('aria-label', `Tile ${index + 1}`);

    // 玻璃主體 (多層擬真：極致高光斜角、深色微磨砂折射晶體)
    this.innerPane = document.createElement('div');
    this.innerPane.className = 'glass-pane';

    // 亮起光效層 (強烈極光青光 / 能量霓虹)
    this.glowLayer = document.createElement('div');
    this.glowLayer.className = 'glass-glow';

    // 序列數字徽章 (醒目可讀，淡入 -> 停留 -> 淡出)
    this.numberBadge = document.createElement('div');
    this.numberBadge.className = 'glass-step-number';

    // 裂痕 SVG 層 (支援 stage1 細裂與 stage2 全面碎裂網)
    this.crackLayer = document.createElement('div');
    this.crackLayer.className = 'glass-cracks';

    this.innerPane.appendChild(this.glowLayer);
    this.innerPane.appendChild(this.numberBadge);
    this.innerPane.appendChild(this.crackLayer);
    this.element.appendChild(this.innerPane);
  }

  /**
   * 題目展示期間的亮燈動畫
   * 遵循嚴格規範：
   * 1. 總時長 onMs (不得低於 700ms)
   * 2. 約前 80ms 淡入
   * 3. 中間清楚停留，數字 1, 2, 3 醒目立體可讀
   * 4. 最後約 80ms 淡出
   * 5. 播完後有 gapMs 熄滅間隔
   */
  async highlight(stepNumber: number, onMs: number): Promise<void> {
    this.resetVisuals();
    this.numberBadge.textContent = stepNumber.toString();
    this.numberBadge.style.opacity = '0';
    this.numberBadge.style.transform = 'scale(0.82)';

    this.element.classList.add('is-lit');
    AudioManager.playTileTone();

    // 淡入 (80ms)
    const fadeInMs = 80;
    const fadeOutMs = 80;
    const holdMs = Math.max(200, onMs - fadeInMs - fadeOutMs);

    this.numberBadge.style.transition = `opacity ${fadeInMs}ms cubic-bezier(0.16, 1, 0.3, 1), transform ${fadeInMs}ms cubic-bezier(0.16, 1, 0.3, 1)`;
    this.glowLayer.style.transition = `opacity ${fadeInMs}ms ease-out`;

    requestAnimationFrame(() => {
      this.element.classList.add('glow-active');
      this.numberBadge.style.opacity = '1';
      this.numberBadge.style.transform = 'scale(1)';
    });

    // 等待淡入 + 清楚停留
    await new Promise((resolve) => setTimeout(resolve, fadeInMs + holdMs));

    // 淡出 (80ms)
    this.numberBadge.style.transition = `opacity ${fadeOutMs}ms ease-in, transform ${fadeOutMs}ms ease-in`;
    this.glowLayer.style.transition = `opacity ${fadeOutMs}ms ease-in`;

    this.element.classList.remove('glow-active');
    this.numberBadge.style.opacity = '0';
    this.numberBadge.style.transform = 'scale(0.88)';

    await new Promise((resolve) => setTimeout(resolve, fadeOutMs));
    this.element.classList.remove('is-lit');
  }

  /**
   * 玩家點擊反饋 (極速微波與短暫高亮)
   */
  tapFlash(isSuccess = true): void {
    const flashClass = isSuccess ? 'tap-flash-success' : 'tap-flash-fail';
    this.element.classList.add(flashClass);
    setTimeout(() => {
      this.element.classList.remove(flashClass);
    }, 200);
  }

  /**
   * 鴨鴨著地時產生的衝擊漣漪光環 (Juicy Land Feedback)
   */
  spawnLandRipple(): void {
    const ripple = document.createElement('div');
    ripple.className = 'glass-land-ripple';
    this.innerPane.appendChild(ripple);
    setTimeout(() => {
      if (ripple.parentElement) {
        ripple.parentElement.removeChild(ripple);
      }
    }, 420);
  }

  /**
   * 玻璃破裂演出
   * 第 1 階段：落地瞬間出現第一條裂紋
   * 約 100ms：全面蜘蛛網狀裂紋擴散
   */
  async startCracking(): Promise<void> {
    if (this.isCracked) return;
    this.isCracked = true;

    AudioManager.playGlassCrack();
    this.crackLayer.innerHTML = `
      <svg class="crack-svg" viewBox="0 0 100 100" preserveAspectRatio="none">
        <!-- 初始第一道衝擊主裂紋 -->
        <path class="crack-line crack-primary" d="M 50 50 L 35 30 L 22 15 M 50 50 L 68 38 L 85 22" stroke="#ffffff" stroke-width="2.4" stroke-linecap="round" fill="none" />
      </svg>
    `;
    this.crackLayer.classList.add('cracking-stage-1');

    await new Promise((resolve) => setTimeout(resolve, 110));

    // 裂紋全面擴散
    this.crackLayer.innerHTML = `
      <svg class="crack-svg" viewBox="0 0 100 100" preserveAspectRatio="none">
        <!-- 全面蜘蛛網狀深度碎裂紋 -->
        <path class="crack-line" d="M 50 50 L 35 30 L 22 15 M 50 50 L 68 38 L 85 22" stroke="#ffffff" stroke-width="2.4" stroke-linecap="round" fill="none" />
        <path class="crack-line" d="M 50 50 L 52 75 L 48 95 M 50 50 L 32 62 L 12 78" stroke="#ffffff" stroke-width="2.2" stroke-linecap="round" fill="none" />
        <path class="crack-line" d="M 50 50 L 72 65 L 90 82 M 35 30 L 52 20 L 70 25" stroke="#ffffff" stroke-width="1.8" stroke-linecap="round" fill="none" />
        <path class="crack-line" d="M 32 62 L 52 75 L 72 65 M 22 15 L 12 40 L 32 62" stroke="#d5eeff" stroke-width="1.4" stroke-linecap="round" fill="none" />
      </svg>
    `;
    this.crackLayer.classList.add('cracking-stage-2');
  }

  /**
   * 整塊玻璃粉碎演出，隱藏底盤
   */
  shatter(): void {
    AudioManager.playGlassShatter();
    this.element.classList.add('is-shattered');
  }

  /**
   * 重設為初始完整玻璃狀態
   */
  resetVisuals(): void {
    this.isCracked = false;
    this.element.className = 'glass-tile';
    this.numberBadge.textContent = '';
    this.numberBadge.style.opacity = '0';
    this.crackLayer.innerHTML = '';
    this.crackLayer.className = 'glass-cracks';
    this.glowLayer.style.opacity = '';
    this.element.classList.remove('is-lit', 'glow-active', 'is-shattered');

    const ripples = this.innerPane.querySelectorAll('.glass-land-ripple');
    ripples.forEach((r) => r.parentElement?.removeChild(r));
  }

  getCenterCoordinates(): { x: number; y: number } {
    const rect = this.element.getBoundingClientRect();
    const parentRect = this.element.parentElement?.getBoundingClientRect() || { left: 0, top: 0 };
    return {
      x: rect.left - parentRect.left + rect.width / 2,
      y: rect.top - parentRect.top + rect.height / 2,
    };
  }
}
