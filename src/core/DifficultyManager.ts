import { LevelConfig } from '../types';
import { getLevelConfig } from '../config/difficultyConfig';

export class DifficultyManager {
  static getConfig(level: number): LevelConfig {
    return getLevelConfig(level);
  }

  /**
   * 判斷是否為棋盤升級關卡（例如 Level 9 升為 3x3，Level 16 升為 4x4）
   */
  static isBoardUpgrade(level: number): { upgraded: boolean; newSize: 2 | 3 | 4; title: string } {
    if (level === 9) {
      return { upgraded: true, newSize: 3, title: '進階挑戰：3×3 棋盤' };
    }
    if (level === 16) {
      return { upgraded: true, newSize: 4, title: '極限高手：4×4 棋盤' };
    }
    return { upgraded: false, newSize: 2, title: '' };
  }
}
