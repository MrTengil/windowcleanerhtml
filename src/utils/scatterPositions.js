const MAX_ATTEMPTS_PER_POINT = 100;

function randomPoint(width, height, random) {
  return {
    x: (random() - 0.5) * width,
    y: (random() - 0.5) * height,
  };
}

function isFarEnough(candidate, placed, minSpacing) {
  return placed.every((point) => Math.hypot(candidate.x - point.x, candidate.y - point.y) >= minSpacing);
}

export function scatterPositions({ count, width, height, minSpacing, random = Math.random }) {
  const positions = [];

  for (let i = 0; i < count; i++) {
    let candidate = randomPoint(width, height, random);
    let attempts = 0;

    while (!isFarEnough(candidate, positions, minSpacing) && attempts < MAX_ATTEMPTS_PER_POINT) {
      candidate = randomPoint(width, height, random);
      attempts += 1;
    }

    positions.push(candidate);
  }

  return positions;
}
