export type GameState =
  | 'MENU'
  | 'TUTORIAL'
  | 'LEVEL_INTRO'
  | 'SHOW_SEQUENCE'
  | 'PLAYER_INPUT'
  | 'LEVEL_CLEAR'
  | 'PAUSED'
  | 'GAME_OVER';

export interface PresentationTimingConfig {
  tileOnMs: number;
  tileGapMs: number;
  introDelayMs: number;
  postSequenceDelayMs: number;
  levelClearDelayMs: number;
}

export interface LevelConfig {
  level: number;
  gridSize: 2 | 3 | 4;
  sequenceLength: number;
  timing: PresentationTimingConfig;
}

export type DuckState =
  | 'idle'
  | 'prepare'
  | 'jump'
  | 'landing'
  | 'surprised'
  | 'falling'
  | 'celebrate';

export interface ScoreState {
  currentLevel: number;
  currentScore: number;
  bestLevel: number;
  bestScore: number;
  isNewRecord: boolean;
}

export interface TileCoord {
  index: number;
  row: number;
  col: number;
}
