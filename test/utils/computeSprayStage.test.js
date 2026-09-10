import { describe, it, expect } from "vitest";
import { computeSprayStage } from "../../src/utils/computeSprayStage.js";

describe("computeSprayStage", () => {
  it("returns 0 when no time has elapsed", () => {
    const stage = computeSprayStage({ elapsedMs: 0, stageDurationMs: 200, maxStage: 4 });

    expect(stage).toBe(0);
  });

  it("advances one stage once a full stage duration has elapsed", () => {
    const stage = computeSprayStage({ elapsedMs: 200, stageDurationMs: 200, maxStage: 4 });

    expect(stage).toBe(1);
  });

  it("clamps at maxStage no matter how much more time has elapsed", () => {
    const stage = computeSprayStage({ elapsedMs: 10000, stageDurationMs: 200, maxStage: 4 });

    expect(stage).toBe(4);
  });
});
