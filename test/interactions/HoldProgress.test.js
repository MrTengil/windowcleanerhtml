import { describe, it, expect } from "vitest";
import { HoldProgress } from "../../src/interactions/HoldProgress.js";

describe("HoldProgress", () => {
  it("reports zero progress before any time is tracked", () => {
    const hold = new HoldProgress({ targetDurationMs: 3000 });

    expect(hold.progressFraction()).toBe(0);
  });

  it("accumulates progress toward the target as time is tracked", () => {
    const hold = new HoldProgress({ targetDurationMs: 3000 });

    hold.trackTime(1000);

    expect(hold.progressFraction()).toBeCloseTo(1 / 3);
  });

  it("clamps progress at the target instead of overshooting, and completes", () => {
    const hold = new HoldProgress({ targetDurationMs: 3000 });

    hold.trackTime(5000);

    expect(hold.progressFraction()).toBe(1);
    expect(hold.isComplete()).toBe(true);
  });

  it("resets progress to zero on release, unlike ScrewProgress's persisted partial turns", () => {
    const hold = new HoldProgress({ targetDurationMs: 3000 });

    hold.trackTime(1000);
    hold.release();

    expect(hold.progressFraction()).toBe(0);
  });
});
