export const DIRT_TYPES = {
  dust: {
    id: "dust",
    interactionType: "tap",
    toolId: "squeegee",
    hitsToClean: 2,
    color: 0xd8d8c0,
  },
  "bird-poop": {
    id: "bird-poop",
    interactionType: "hold",
    toolIds: ["sponge"],
    requiredSprayStage: 4,
    holdDurationMs: 3000,
    color: 0xf5f5f5,
    textureKey: "dirt-bird-poop",
    file: "bird_poop.svg",
  },
  "hand-prints": {
    id: "hand-prints",
    interactionType: "wipe",
    toolIds: ["squeegee", "sponge"],
    requiredSprayStage: 1,
    hitsToClean: 6,
    color: 0xc9b8a8,
    textureKey: "dirt-hand-prints",
    file: "hand_prints.svg",
  },
};
