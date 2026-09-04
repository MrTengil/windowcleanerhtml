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

    this.markRevealedCell(column, row);
  }

  markRevealedInRadius(x, y, radius) {
    this.markRevealedAt(x, y);

    const minColumn = Math.floor((x - radius) / this.cellSize);
    const maxColumn = Math.floor((x + radius) / this.cellSize);
    const minRow = Math.floor((y - radius) / this.cellSize);
    const maxRow = Math.floor((y + radius) / this.cellSize);

    for (let column = minColumn; column <= maxColumn; column++) {
      for (let row = minRow; row <= maxRow; row++) {
        const cellCenterX = column * this.cellSize + this.cellSize / 2;
        const cellCenterY = row * this.cellSize + this.cellSize / 2;

        if (Math.hypot(cellCenterX - x, cellCenterY - y) <= radius) {
          this.markRevealedCell(column, row);
        }
      }
    }
  }

  markRevealedCell(column, row) {
    if (column < 0 || column >= this.columns || row < 0 || row >= this.rows) {
      return;
    }

    this.revealedCells.add(`${column},${row}`);
  }

  revealedFraction() {
    return this.revealedCells.size / (this.columns * this.rows);
  }

  isFullyRevealed(threshold) {
    return this.revealedFraction() >= threshold;
  }
}
