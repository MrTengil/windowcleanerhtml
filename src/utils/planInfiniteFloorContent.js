const OBSTRUCTION_TYPES = ["board", "police-tape"];
const DIRT_TYPE_IDS = ["bird-poop", "hand-prints", "sticker"];
const OBSTRUCTION_COUNT_WEIGHTS = [
  { count: 0, weight: 0.5 },
  { count: 1, weight: 0.35 },
  { count: 2, weight: 0.15 },
];
const MAX_DIRT_COUNT = 3;

function pickObstructionCount(random) {
  const roll = random();
  let cumulative = 0;

  for (const { count, weight } of OBSTRUCTION_COUNT_WEIGHTS) {
    cumulative += weight;

    if (roll < cumulative) {
      return count;
    }
  }

  return OBSTRUCTION_COUNT_WEIGHTS[OBSTRUCTION_COUNT_WEIGHTS.length - 1].count;
}

export function planInfiniteFloorContent({ random }) {
  const obstructionCount = pickObstructionCount(random);
  const obstructionTypes = Array.from(
    { length: obstructionCount },
    () => OBSTRUCTION_TYPES[Math.floor(random() * OBSTRUCTION_TYPES.length)],
  );

  let dirtCount = Math.floor(random() * (MAX_DIRT_COUNT + 1));

  // Every floor needs at least one thing — if both rolls came up empty,
  // fall back to a single dirt spot rather than an empty floor.
  if (obstructionCount === 0 && dirtCount === 0) {
    dirtCount = 1;
  }

  const dirtTypeIds = Array.from(
    { length: dirtCount },
    () => DIRT_TYPE_IDS[Math.floor(random() * DIRT_TYPE_IDS.length)],
  );

  return { obstructionTypes, dirtTypeIds };
}
