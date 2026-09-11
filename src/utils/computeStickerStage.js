export function computeStickerStage({ hitsRemaining, hitsToClean, stageCount }) {
  const hitsLanded = hitsToClean - hitsRemaining;

  return Math.min(stageCount, Math.floor((hitsLanded / hitsToClean) * stageCount) + 1);
}
