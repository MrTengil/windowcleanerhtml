import { describe, it, expect } from "vitest";
import { ScrewProgress } from "../../src/interactions/ScrewProgress.js";

describe("ScrewProgress", () => {
  it("reports zero progress before any rotation is tracked", () => {
    const screw = new ScrewProgress({ targetRotation: Math.PI });

    expect(screw.progressFraction()).toBe(0);
  });

  it("does not add progress from the very first tracked angle", () => {
    const screw = new ScrewProgress({ targetRotation: Math.PI });

    screw.trackAngle(0);

    expect(screw.progressFraction()).toBe(0);
  });

  it("adds progress for counter-clockwise motion between two tracked angles", () => {
    const screw = new ScrewProgress({ targetRotation: Math.PI });

    screw.trackAngle(0);
    screw.trackAngle(-Math.PI / 2);

    expect(screw.progressFraction()).toBeCloseTo(0.5);
  });

  it("clamps progress at the target instead of overshooting", () => {
    const screw = new ScrewProgress({ targetRotation: Math.PI / 2 });

    screw.trackAngle(0);
    screw.trackAngle(-Math.PI / 2);
    screw.trackAngle(-Math.PI);

    expect(screw.progressFraction()).toBe(1);
    expect(screw.isComplete()).toBe(true);
  });

  it("clamps progress at zero instead of going negative for clockwise motion", () => {
    const screw = new ScrewProgress({ targetRotation: Math.PI });

    screw.trackAngle(0);
    screw.trackAngle(Math.PI / 2);

    expect(screw.progressFraction()).toBe(0);
  });

  it("keeps existing progress after release, but starts the next angle fresh", () => {
    const screw = new ScrewProgress({ targetRotation: Math.PI });

    screw.trackAngle(0);
    screw.trackAngle(-Math.PI / 2);
    screw.release();
    screw.trackAngle(2.9);

    expect(screw.progressFraction()).toBeCloseTo(0.5);
  });
});
