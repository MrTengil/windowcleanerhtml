export function computeAngularDelta({ from, to }) {
  const delta = to - from;

  return Math.atan2(Math.sin(delta), Math.cos(delta));
}
