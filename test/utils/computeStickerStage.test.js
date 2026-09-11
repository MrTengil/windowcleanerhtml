import { describe, it, expect } from "vitest";
import { computeStickerStage } from "../../src/utils/computeStickerStage.js";

describe("computeStickerStage", () => {
  it("returns the first stage when no hits have registered yet", () => {
    const stage = computeStickerStage({ hitsRemaining: 16, hitsToClean: 16, stageCount: 4 });

    expect(stage).toBe(1);
  });

  it("advances to the next stage once enough hits land", () => {
    const stage = computeStickerStage({ hitsRemaining: 12, hitsToClean: 16, stageCount: 4 });

    expect(stage).toBe(2);
  });

  it("clamps at the final stage once fully clean", () => {
    const stage = computeStickerStage({ hitsRemaining: 0, hitsToClean: 16, stageCount: 4 });

    expect(stage).toBe(4);
  });
});
