import { GlassTile } from './GlassTile';

export class Board {
  readonly element: HTMLElement;
  private tiles: GlassTile[] = [];
  private currentGridSize: 2 | 3 | 4 = 2;
  private onTileTapCallback: ((index: number) => void) | null = null;
  private isInteractive = false;

  constructor(parent: HTMLElement) {
    this.element = document.createElement('div');
    this.element.className = 'glass-board grid-size-2';
    this.element.style.touchAction = 'none';
    parent.appendChild(this.element);

    // 委派監聽點擊，極速 pointerdown 響應，徹底消除手機 300ms 延遲
    this.element.addEventListener('pointerdown', (e: PointerEvent) => {
      if (!this.isInteractive) return;

      const target = (e.target as HTMLElement).closest('.glass-tile');
      if (!target) return;

      const idxAttr = target.getAttribute('data-tile-index');
      if (idxAttr !== null) {
        const index = parseInt(idxAttr, 10);
        if (!isNaN(index) && this.onTileTapCallback) {
          e.preventDefault();
          this.onTileTapCallback(index);
        }
      }
    });
  }

  setupGrid(gridSize: 2 | 3 | 4): void {
    if (this.currentGridSize === gridSize && this.tiles.length === gridSize * gridSize) {
      this.resetAllTiles();
      return;
    }

    this.currentGridSize = gridSize;
    this.element.innerHTML = '';
    this.tiles = [];

    this.element.className = `glass-board grid-size-${gridSize}`;

    for (let r = 0; r < gridSize; r++) {
      for (let c = 0; c < gridSize; c++) {
        const index = r * gridSize + c;
        const tile = new GlassTile(index, r, c);
        this.tiles.push(tile);
        this.element.appendChild(tile.element);
      }
    }
  }

  onTileTap(callback: (index: number) => void): void {
    this.onTileTapCallback = callback;
  }

  setInteractive(val: boolean): void {
    this.isInteractive = val;
    if (val) {
      this.element.classList.add('is-interactive');
    } else {
      this.element.classList.remove('is-interactive');
    }
  }

  getTile(index: number): GlassTile | undefined {
    return this.tiles[index];
  }

  getTiles(): GlassTile[] {
    return this.tiles;
  }

  getTileCenter(index: number): { x: number; y: number } {
    const tile = this.tiles[index];
    if (!tile) {
      return { x: 0, y: 0 };
    }

    const tileRect = tile.element.getBoundingClientRect();
    const boardRect = this.element.getBoundingClientRect();

    return {
      x: tileRect.left - boardRect.left + tileRect.width / 2,
      y: tileRect.top - boardRect.top + tileRect.height / 2,
    };
  }

  resetAllTiles(): void {
    this.tiles.forEach((t) => t.resetVisuals());
  }

  getGridSize(): 2 | 3 | 4 {
    return this.currentGridSize;
  }
}
