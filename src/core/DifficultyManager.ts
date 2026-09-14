import { LevelConfig } from '../types';
import { getLevelConfig } from '../config/difficultyConfig';

export class DifficultyManager {
  static getConfig(level: number): LevelConfig {
    return getLevelConfig(level);
  }

  /**
   * 判斷是否為棋盤升級關卡
   * Level 5 升為 3x3 九宮格
   * Level 11 升為 4x4 十六宮格
   * Level 19 升為 5x5 二十五宮格
   */
  static isBoardUpgrade(level: number): { upgraded: boolean; newSize: 2 | 3 | 4 | 5; title: string } {
    if (level === 5) {
      return { upgraded: true, newSize: 3, title: '進階挑戰：3×3 九宮格！' };
    }
    if (level === 11) {
      return { upgraded: true, newSize: 4, title: '高手對決：4×4 十六宮格！' };
    }
    if (level === 19) {
      return { upgraded: true, newSize: 5, title: '神級巔峰：5×5 二十五宮格！' };
    }
    return { upgraded: false, newSize: 2, title: '' };
  }
}
