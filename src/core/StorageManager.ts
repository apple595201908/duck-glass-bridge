const STORAGE_KEYS = {
  BEST_LEVEL: 'duck_glass_bridge_best_level',
  BEST_SCORE: 'duck_glass_bridge_best_score',
  SOUND_ENABLED: 'duck_glass_bridge_sound_enabled',
  TUTORIAL_COMPLETED: 'duck_glass_bridge_tutorial_completed',
};

export class StorageManager {
  private static memoryFallback: Record<string, string> = {};

  private static getItem(key: string): string | null {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        return window.localStorage.getItem(key);
      }
    } catch {
      // private mode / quota fallback
    }
    return this.memoryFallback[key] || null;
  }

  private static setItem(key: string, value: string): void {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(key, value);
        return;
      }
    } catch {
      // fallback
    }
    this.memoryFallback[key] = value;
  }

  static getBestLevel(): number {
    const val = this.getItem(STORAGE_KEYS.BEST_LEVEL);
    return val ? Math.max(1, parseInt(val, 10) || 1) : 1;
  }

  static setBestLevel(level: number): void {
    const current = this.getBestLevel();
    if (level > current) {
      this.setItem(STORAGE_KEYS.BEST_LEVEL, level.toString());
    }
  }

  static getBestScore(): number {
    const val = this.getItem(STORAGE_KEYS.BEST_SCORE);
    return val ? Math.max(0, parseInt(val, 10) || 0) : 0;
  }

  static setBestScore(score: number): void {
    const current = this.getBestScore();
    if (score > current) {
      this.setItem(STORAGE_KEYS.BEST_SCORE, score.toString());
    }
  }

  static isSoundEnabled(): boolean {
    const val = this.getItem(STORAGE_KEYS.SOUND_ENABLED);
    return val !== null ? val === 'true' : true;
  }

  static setSoundEnabled(enabled: boolean): void {
    this.setItem(STORAGE_KEYS.SOUND_ENABLED, enabled.toString());
  }

  static isTutorialCompleted(): boolean {
    const val = this.getItem(STORAGE_KEYS.TUTORIAL_COMPLETED);
    return val === 'true';
  }

  static setTutorialCompleted(completed: boolean): void {
    this.setItem(STORAGE_KEYS.TUTORIAL_COMPLETED, completed.toString());
  }
}
