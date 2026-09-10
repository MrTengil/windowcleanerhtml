export function computeSprayStage({ elapsedMs, stageDurationMs, maxStage }) {
  return Math.min(maxStage, Math.floor(elapsedMs / stageDurationMs));
}
