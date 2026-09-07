import { describe, it, expect } from "vitest";
import { computeSweepRotation } from "../../src/utils/sweepRotation.js";

describe("computeSweepRotation", () => {
  it("returns null when there is no movement", () => {
    const rotation = computeSweepRotation({ dx: 0, dy: 0 });

    expect(rotation).toBeNull();
  });

  it("points the icon's blade-up art rightward when sweeping right", () => {
    const rotation = computeSweepRotation({ dx: 1, dy: 0 });

    expect(rotation).toBeCloseTo(Math.PI / 2);
  });

  it("points the icon's blade-up art downward when sweeping down", () => {
    const rotation = computeSweepRotation({ dx: 0, dy: 1 });

    expect(rotation).toBeCloseTo(Math.PI);
  });
});
