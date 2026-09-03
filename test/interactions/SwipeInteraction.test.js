import { describe, it, expect } from "vitest";
import { SwipeProgress } from "../../src/interactions/SwipeInteraction.js";

describe("SwipeProgress", () => {
  it("does not earn a hit before enough distance accumulates", () => {
    const progress = new SwipeProgress({ distancePerHit: 50 });

    const earnedHit = progress.registerDistance(10);

    expect(earnedHit).toBe(false);
  });

  it("earns a hit once accumulated distance reaches the threshold", () => {
    const progress = new SwipeProgress({ distancePerHit: 50 });

    progress.registerDistance(30);
    const earnedHit = progress.registerDistance(30);

    expect(earnedHit).toBe(true);
  });

  it("carries over the remainder distance after earning a hit", () => {
    const progress = new SwipeProgress({ distancePerHit: 50 });
    progress.registerDistance(60);

    const earnedHit = progress.registerDistance(40);

    expect(earnedHit).toBe(true);
  });
});
