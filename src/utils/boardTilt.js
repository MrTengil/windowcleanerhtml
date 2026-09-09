export function computeTiltedBoardWidth({ boardWidth, angle }) {
  return boardWidth / Math.cos(angle);
}
