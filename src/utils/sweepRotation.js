const SWEEP_ROTATION_OFFSET = Math.PI / 2;

export function computeSweepRotation({ dx, dy }) {
  if (dx === 0 && dy === 0) {
    return null;
  }

  return Math.atan2(dy, dx) + SWEEP_ROTATION_OFFSET;
}
