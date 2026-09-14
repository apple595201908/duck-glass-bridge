import { LevelConfig, PresentationTimingConfig } from '../types';

export const MIN_TILE_ON_MS = 700;
export const MIN_TILE_GAP_MS = 120;
export const DEFAULT_INTRO_DELAY_MS = 450;
export const DEFAULT_POST_SEQUENCE_DELAY_MS = 380;
export const DEFAULT_LEVEL_CLEAR_DELAY_MS = 600;

export const BASE_LEVEL_CONFIGS: Record<number, { gridSize: 2 | 3 | 4 | 5; sequenceLength: number; tileOnMs: number; tileGapMs: number }> = {
  // ──── 2×2 新手啟蒙區 (長度 3 ~ 4 步，迅速熟悉手感) ────
  1:  { gridSize: 2, sequenceLength: 3,  tileOnMs: 780, tileGapMs: 170 },
  2:  { gridSize: 2, sequenceLength: 3,  tileOnMs: 780, tileGapMs: 170 },
  3:  { gridSize: 2, sequenceLength: 4,  tileOnMs: 760, tileGapMs: 160 },
  4:  { gridSize: 2, sequenceLength: 4,  tileOnMs: 760, tileGapMs: 160 },

  // ──── 3×3 九宮格進階區 (Level 5 升級！序列回退至 3 步，逐步增至 6 步) ────
  5:  { gridSize: 3, sequenceLength: 3,  tileOnMs: 780, tileGapMs: 170 },
  6:  { gridSize: 3, sequenceLength: 4,  tileOnMs: 760, tileGapMs: 160 },
  7:  { gridSize: 3, sequenceLength: 4,  tileOnMs: 760, tileGapMs: 160 },
  8:  { gridSize: 3, sequenceLength: 5,  tileOnMs: 750, tileGapMs: 150 },
  9:  { gridSize: 3, sequenceLength: 5,  tileOnMs: 740, tileGapMs: 150 },
  10: { gridSize: 3, sequenceLength: 6,  tileOnMs: 740, tileGapMs: 150 },

  // ──── 4×4 十六宮格高手區 (Level 11 升級！序列回退至 4 步，上限嚴格不超過 7 步！) ────
  11: { gridSize: 4, sequenceLength: 4,  tileOnMs: 760, tileGapMs: 160 },
  12: { gridSize: 4, sequenceLength: 4,  tileOnMs: 750, tileGapMs: 150 },
  13: { gridSize: 4, sequenceLength: 5,  tileOnMs: 750, tileGapMs: 150 },
  14: { gridSize: 4, sequenceLength: 5,  tileOnMs: 740, tileGapMs: 150 },
  15: { gridSize: 4, sequenceLength: 6,  tileOnMs: 740, tileGapMs: 150 },
  16: { gridSize: 4, sequenceLength: 6,  tileOnMs: 730, tileGapMs: 150 },
  17: { gridSize: 4, sequenceLength: 7,  tileOnMs: 730, tileGapMs: 150 },
  18: { gridSize: 4, sequenceLength: 7,  tileOnMs: 720, tileGapMs: 150 },

  // ──── 5×5 二十五宮格神級巔峰區 (Level 19 升級！序列回退至 4 步，全新宏大視野) ────
  19: { gridSize: 5, sequenceLength: 4,  tileOnMs: 760, tileGapMs: 160 },
  20: { gridSize: 5, sequenceLength: 5,  tileOnMs: 750, tileGapMs: 150 },
  21: { gridSize: 5, sequenceLength: 5,  tileOnMs: 740, tileGapMs: 150 },
  22: { gridSize: 5, sequenceLength: 6,  tileOnMs: 730, tileGapMs: 150 },
  23: { gridSize: 5, sequenceLength: 6,  tileOnMs: 720, tileGapMs: 150 },
  24: { gridSize: 5, sequenceLength: 7,  tileOnMs: 720, tileGapMs: 150 },
};

/**
 * 獲取指定關卡的難度設定
 * 包含 Level 24 以後的無盡專家模式 (Endless Expert) 計算
 * 硬性限制：tileOnMs 禁止低於 700ms，tileGapMs 禁止低於 120ms
 */
export function getLevelConfig(level: number): LevelConfig {
  let gridSize: 2 | 3 | 4 | 5 = 5;
  let sequenceLength = 7;
  let tileOnMs = 720;
  let tileGapMs = 150;

  if (level in BASE_LEVEL_CONFIGS) {
    const preset = BASE_LEVEL_CONFIGS[level];
    gridSize = preset.gridSize;
    sequenceLength = preset.sequenceLength;
    tileOnMs = preset.tileOnMs;
    tileGapMs = preset.tileGapMs;
  } else {
    // Level 25+ Endless Expert:
    // 保持 5x5 神級棋盤，播放節奏維持 720ms 穩定可讀，間隔 150ms
    // 每 2 關 +1 序列長度，Level 36 之後每 3 關 +1
    gridSize = 5;
    tileOnMs = 720;
    tileGapMs = 150;

    const extraLevels = level - 24;
    if (level <= 36) {
      sequenceLength = 7 + Math.floor(extraLevels / 2);
    } else {
      const baseAt36 = 7 + Math.floor(12 / 2); // 13
      const beyond36 = level - 36;
      sequenceLength = baseAt36 + Math.floor(beyond36 / 3);
    }
  }

  // 核心保護機制：保證絕不成為「速讀反應測驗」
  const safeTileOnMs = Math.max(tileOnMs, MIN_TILE_ON_MS);
  const safeTileGapMs = Math.max(tileGapMs, MIN_TILE_GAP_MS);

  const timing: PresentationTimingConfig = {
    tileOnMs: safeTileOnMs,
    tileGapMs: safeTileGapMs,
    introDelayMs: DEFAULT_INTRO_DELAY_MS,
    postSequenceDelayMs: DEFAULT_POST_SEQUENCE_DELAY_MS,
    levelClearDelayMs: DEFAULT_LEVEL_CLEAR_DELAY_MS,
  };

  return {
    level,
    gridSize,
    sequenceLength,
    timing,
  };
}
