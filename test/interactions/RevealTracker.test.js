import { describe, it, expect } from "vitest";
import { RevealTracker } from "../../src/interactions/RevealTracker.js";

describe("RevealTracker", () => {
  it("reports zero revealed fraction before anything is marked", () => {
    const tracker = new RevealTracker({ width: 100, height: 100, cellSize: 50 });

    expect(tracker.revealedFraction()).toBe(0);
  });

  it("reports the fraction of cells revealed after marking one", () => {
    const tracker = new RevealTracker({ width: 100, height: 100, cellSize: 50 });

    tracker.markRevealedAt(10, 10);

    expect(tracker.revealedFraction()).toBe(0.25);
  });

  it("does not double-count marking the same cell twice", () => {
    const tracker = new RevealTracker({ width: 100, height: 100, cellSize: 50 });

    tracker.markRevealedAt(10, 10);
    tracker.markRevealedAt(20, 20);

    expect(tracker.revealedFraction()).toBe(0.25);
  });

  it("is not fully revealed when the fraction is below the threshold", () => {
    const tracker = new RevealTracker({ width: 100, height: 100, cellSize: 50 });

    tracker.markRevealedAt(10, 10);

    expect(tracker.isFullyRevealed(0.9)).toBe(false);
  });

  it("is fully revealed once the fraction reaches the threshold", () => {
    const tracker = new RevealTracker({ width: 100, height: 100, cellSize: 50 });

    tracker.markRevealedAt(10, 10);
    tracker.markRevealedAt(60, 10);
    tracker.markRevealedAt(10, 60);
    tracker.markRevealedAt(60, 60);

    expect(tracker.isFullyRevealed(0.9)).toBe(true);
  });
});
