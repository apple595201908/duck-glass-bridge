/**
 * 序列生成器
 * 核心規則：
 * 1. 隨機生成 0 至 (gridSize * gridSize - 1) 的位置
 * 2. 嚴格禁止 sequence[i] === sequence[i - 1] (相鄰兩步不能是同一格，防止誤判為單次長亮)
 * 3. 允許 A -> B -> A (非相鄰重複完全合法)
 */
export class SequenceGenerator {
  static generate(gridSize: number, length: number): number[] {
    const totalTiles = gridSize * gridSize;
    const sequence: number[] = [];

    for (let i = 0; i < length; i++) {
      let nextTile: number;
      do {
        nextTile = Math.floor(Math.random() * totalTiles);
      } while (i > 0 && nextTile === sequence[i - 1]);

      sequence.push(nextTile);
    }

    return sequence;
  }
}
