import './style.css';
import { AudioManager } from './core/AudioManager';
import { StorageManager } from './core/StorageManager';
import { MenuScene } from './scenes/MenuScene';
import { TutorialScene } from './scenes/TutorialScene';
import { GameScene } from './scenes/GameScene';

class App {
  private appContainer: HTMLElement;
  private menuScene!: MenuScene;
  private tutorialScene!: TutorialScene;
  private gameScene!: GameScene;

  constructor() {
    this.appContainer = document.getElementById('app') as HTMLElement;
    AudioManager.init();

    this.initScenes();
    this.showMenu();
  }

  private initScenes(): void {
    // 主選單
    this.menuScene = new MenuScene(this.appContainer, () => {
      this.handleStartGame();
    });

    // 遊戲主畫面
    this.gameScene = new GameScene(this.appContainer, () => {
      this.showMenu();
    });

    if (typeof window !== 'undefined') {
      (window as unknown as { __GAME_SCENE__: GameScene }).__GAME_SCENE__ = this.gameScene;
    }

    // 新手教學
    this.tutorialScene = new TutorialScene(this.appContainer, () => {
      this.tutorialScene.hide();
      this.gameScene.show();
      this.gameScene.startNewGame();
    });
  }

  private handleStartGame(): void {
    this.menuScene.hide();

    // 若第一次玩則進入 3~5 秒超精簡教學，否則直接開始 Level 1
    if (!StorageManager.isTutorialCompleted()) {
      this.tutorialScene.show();
    } else {
      this.gameScene.show();
      this.gameScene.startNewGame();
    }
  }

  private showMenu(): void {
    this.tutorialScene.hide();
    this.gameScene.hide();
    this.menuScene.show();
  }
}

// 啟動應用
window.addEventListener('DOMContentLoaded', () => {
  new App();
});
