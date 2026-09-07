import { describe, it, expect } from "vitest";
import { SweepSmoother } from "../../src/interactions/SweepSmoother.js";

describe("SweepSmoother", () => {
  it("snaps to the first sample with nothing yet to blend against", () => {
    const smoother = new SweepSmoother({ timeConstant: 100 });

    smoother.addSample({ dx: 10, dy: 4, time: 0 });

    expect(smoother.averageDelta()).toEqual({ dx: 10, dy: 4 });
  });

  it("blends a second sample toward the new delta instead of snapping to it", () => {
    const smoother = new SweepSmoother({ timeConstant: 100 });

    smoother.addSample({ dx: 10, dy: 0, time: 0 });
    smoother.addSample({ dx: 0, dy: 0, time: 100 });

    const { dx, dy } = smoother.averageDelta();

    expect(dx).toBeCloseTo(3.6788, 3);
    expect(dy).toBeCloseTo(0, 3);
  });

  it("snaps to the next sample after a reset instead of blending against pre-reset state", () => {
    const smoother = new SweepSmoother({ timeConstant: 100 });

    smoother.addSample({ dx: 10, dy: 0, time: 0 });
    smoother.reset();
    smoother.addSample({ dx: 5, dy: 5, time: 999 });

    expect(smoother.averageDelta()).toEqual({ dx: 5, dy: 5 });
  });
});
