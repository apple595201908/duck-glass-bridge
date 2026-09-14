import { LevelConfig, ScoreState } from '../types';
import { StorageManager } from './StorageManager';

export class ScoreManager {
  private currentLevel = 1;
  private currentScore = 0;
  private bestLevel = 1;
  private bestScore = 0;

  constructor() {
    this.bestLevel = StorageManager.getBestLevel();
    this.bestScore = StorageManager.getBestScore();
  }

  reset(): void {
    this.currentLevel = 1;
    this.currentScore = 0;
    this.bestLevel = StorageManager.getBestLevel();
    this.bestScore = StorageManager.getBestScore();
  }

  /**
   * 計算過關得分
   * 遵循原則：
   * 主要分數來自：關卡數、Sequence Length、棋盤大小。
   * 速度 Bonus 嚴格限制在總分 5% ~ 8% 以下，禁止成為核心手段。
   */
  addLevelScore(config: LevelConfig, responseDurationMs: number): { added: number; isNewRecord: boolean } {
    const baseScore = config.level * 100;
    const sequenceBonus = config.sequenceLength * 50;
    const boardBonus = config.gridSize === 2 ? 100 : config.gridSize === 3 ? 250 : 500;

    // 速度加成：非常微量，上限不超過 (baseScore + sequenceBonus) 的 8%
    const standardAllowedMs = config.sequenceLength * 1500;
    const timeSavedRatio = Math.max(0, Math.min(1, (standardAllowedMs - responseDurationMs) / standardAllowedMs));
    const maxSpeedBonus = Math.round((baseScore + sequenceBonus) * 0.08);
    const speedBonus = Math.round(timeSavedRatio * maxSpeedBonus);

    const totalRoundScore = baseScore + sequenceBonus + boardBonus + speedBonus;
    this.currentScore += totalRoundScore;
    this.currentLevel = config.level;

    let isNewRecord = false;
    if (this.currentScore > this.bestScore) {
      this.bestScore = this.currentScore;
      StorageManager.setBestScore(this.bestScore);
      isNewRecord = true;
    }

    if (this.currentLevel > this.bestLevel) {
      this.bestLevel = this.currentLevel;
      StorageManager.setBestLevel(this.bestLevel);
    }

    return { added: totalRoundScore, isNewRecord };
  }

  getState(): ScoreState {
    return {
      currentLevel: this.currentLevel,
      currentScore: this.currentScore,
      bestLevel: this.bestLevel,
      bestScore: this.bestScore,
      isNewRecord: this.currentScore >= this.bestScore && this.currentScore > 0,
    };
  }

  getCurrentLevel(): number {
    return this.currentLevel;
  }

  setCurrentLevel(level: number): void {
    this.currentLevel = level;
    if (level > this.bestLevel) {
      this.bestLevel = level;
      StorageManager.setBestLevel(this.bestLevel);
    }
  }

  getCurrentScore(): number {
    return this.currentScore;
  }
}
