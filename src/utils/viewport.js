export function computeGameWidth({ viewportWidth, viewportHeight, designHeight, minAspect, maxAspect }) {
  const aspect = Math.min(Math.max(viewportWidth / viewportHeight, minAspect), maxAspect);

  return Math.round(designHeight * aspect);
}
