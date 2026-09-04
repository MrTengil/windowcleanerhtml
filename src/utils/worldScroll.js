export function segmentWorldY({ floor, restingY, spacing }) {
  return restingY - (floor - 1) * spacing;
}

export function hasScrolledOutOfView({ worldY, offset, canvasHeight, spacing }) {
  return worldY + offset > canvasHeight + spacing;
}
