const SCALE_MIN = 0.35;
const SCALE_MAX = 1.1;
const PARALLAX_BASE = 0.6;
const PARALLAX_PER_SCALE = 0.8;
const ALPHA_MIN = 0.45;
const ALPHA_MAX = 0.8;
const DRIFT_SPEED_MIN = 4;
const DRIFT_SPEED_MAX = 14;

function lerp(min, max, t) {
  return min + (max - min) * t;
}

export function createCloudSpec({ clouds, random }) {
  const index = Math.min(clouds.length - 1, Math.floor(random() * clouds.length));
  const scale = lerp(SCALE_MIN, SCALE_MAX, random());
  const alpha = lerp(ALPHA_MIN, ALPHA_MAX, random());
  const speed = lerp(DRIFT_SPEED_MIN, DRIFT_SPEED_MAX, random());
  const direction = random() < 0.5 ? -1 : 1;

  return {
    textureKey: clouds[index].textureKey,
    scale,
    alpha,
    driftSpeed: speed * direction,
    parallax: PARALLAX_BASE + scale * PARALLAX_PER_SCALE,
  };
}
