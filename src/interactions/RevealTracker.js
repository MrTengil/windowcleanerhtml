export class RevealTracker {
  constructor({ width, height, cellSize }) {
    this.cellSize = cellSize;
    this.columns = Math.ceil(width / cellSize);
    this.rows = Math.ceil(height / cellSize);
    this.revealedCells = new Set();
  }

  markRevealedAt(x, y) {
    const column = Math.floor(x / this.cellSize);
    const row = Math.floor(y / this.cellSize);

    this.revealedCells.add(`${column},${row}`);
  }

  revealedFraction() {
    return this.revealedCells.size / (this.columns * this.rows);
  }

  isFullyRevealed(threshold) {
    return this.revealedFraction() >= threshold;
  }
}
