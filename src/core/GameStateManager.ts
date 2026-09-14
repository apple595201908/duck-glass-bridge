import { GameState } from '../types';

export type StateChangeHandler = (newState: GameState, prevState: GameState) => void;

export class GameStateManager {
  private currentState: GameState = 'MENU';
  private previousState: GameState = 'MENU';
  private listeners: StateChangeHandler[] = [];

  getState(): GameState {
    return this.currentState;
  }

  getPreviousState(): GameState {
    return this.previousState;
  }

  setState(nextState: GameState): void {
    if (this.currentState === nextState) return;

    // 狀態轉移安全檢查
    if (this.currentState === 'GAME_OVER' && nextState === 'PLAYER_INPUT') {
      console.warn('Invalid state transition: GAME_OVER to PLAYER_INPUT');
      return;
    }

    const prev = this.currentState;
    this.previousState = prev;
    this.currentState = nextState;

    this.listeners.forEach((fn) => {
      try {
        fn(nextState, prev);
      } catch (err) {
        console.error('State change listener error:', err);
      }
    });
  }

  onStateChange(handler: StateChangeHandler): () => void {
    this.listeners.push(handler);
    return () => {
      this.listeners = this.listeners.filter((h) => h !== handler);
    };
  }

  canAcceptInput(): boolean {
    return this.currentState === 'PLAYER_INPUT' || this.currentState === 'TUTORIAL';
  }

  isPlaying(): boolean {
    return (
      this.currentState === 'LEVEL_INTRO' ||
      this.currentState === 'SHOW_SEQUENCE' ||
      this.currentState === 'PLAYER_INPUT' ||
      this.currentState === 'LEVEL_CLEAR'
    );
  }
}
