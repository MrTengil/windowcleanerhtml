import { describe, it, expect } from "vitest";
import { computeTiltedBoardWidth } from "../../src/utils/boardTilt.js";

describe("computeTiltedBoardWidth", () => {
  it("returns the width unchanged when there is no tilt", () => {
    const width = computeTiltedBoardWidth({ boardWidth: 580, angle: 0 });

    expect(width).toBe(580);
  });

  it("lengthens the board so its horizontal reach is preserved when tilted", () => {
    const width = computeTiltedBoardWidth({ boardWidth: 580, angle: Math.PI / 3 });

    expect(width).toBeCloseTo(1160);
  });
});
