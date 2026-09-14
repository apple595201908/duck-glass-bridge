/**
 * 七段紅色電子數位顯示器 (7-Segment LED Display)
 * 模擬老式實驗室/工業測量儀器風格：
 * - 具備未點亮的暗紅背景段 (8888 淡淡陰影)
 * - 點亮段為醒目高對比鮮紅，帶適量儀器微光 Glow
 * - 支援指定位數自動補零 (例如 08, 003850)
 */
export class SevenSegmentDisplay {
  /**
   * 七段 LED 映射表
   * 段位標記：
   *     a
   *   f   b
   *     g
   *   e   c
   *     d
   */
  private static readonly DIGIT_SEGMENTS: Record<string, boolean[]> = {
    // a, b, c, d, e, f, g
    '0': [true, true, true, true, true, true, false],
    '1': [false, true, true, false, false, false, false],
    '2': [true, true, false, true, true, false, true],
    '3': [true, true, true, true, false, false, true],
    '4': [false, true, true, false, false, true, true],
    '5': [true, false, true, true, false, true, true],
    '6': [true, false, true, true, true, true, true],
    '7': [true, true, true, false, false, false, false],
    '8': [true, true, true, true, true, true, true],
    '9': [true, true, true, true, false, true, true],
    '-': [false, false, false, false, false, false, true],
    ' ': [false, false, false, false, false, false, false],
  };

  /**
   * 渲染單一字元的 7 段 SVG
   */
  private static renderCharSvg(char: string): string {
    const segs = this.DIGIT_SEGMENTS[char] || this.DIGIT_SEGMENTS[' '];

    // SVG 定義各個斜角邊線段 (尺寸微調適配手機 HUD)
    return `
      <svg class="seven-seg-digit" viewBox="0 0 34 56" width="16" height="28">
        <!-- a: 頂橫 -->
        <polygon points="6,4 28,4 25,8 9,8" class="seg ${segs[0] ? 'on' : 'off'}" />
        <!-- b: 右上豎 -->
        <polygon points="29,5 31,8 29,26 26,24 26,8" class="seg ${segs[1] ? 'on' : 'off'}" />
        <!-- c: 右下豎 -->
        <polygon points="29,29 31,31 29,51 26,47 26,31" class="seg ${segs[2] ? 'on' : 'off'}" />
        <!-- d: 底橫 -->
        <polygon points="6,52 28,52 25,48 9,48" class="seg ${segs[3] ? 'on' : 'off'}" />
        <!-- e: 左下豎 -->
        <polygon points="5,29 8,31 8,47 5,51 3,47" class="seg ${segs[4] ? 'on' : 'off'}" />
        <!-- f: 左上豎 -->
        <polygon points="5,5 8,8 8,24 5,26 3,23" class="seg ${segs[5] ? 'on' : 'off'}" />
        <!-- g: 中橫 -->
        <polygon points="7,27 27,27 25,29 9,29" class="seg ${segs[6] ? 'on' : 'off'}" />
      </svg>
    `;
  }

  /**
   * 格式化輸出 HTML
   */
  static render(value: number | string, digits: number): string {
    const rawStr = value.toString();
    const padded = rawStr.padStart(digits, '0').slice(-digits);

    let html = `<div class="seven-seg-cluster" aria-label="${value}">`;
    for (let i = 0; i < padded.length; i++) {
      html += this.renderCharSvg(padded[i]);
    }
    html += `</div>`;
    return html;
  }
}
