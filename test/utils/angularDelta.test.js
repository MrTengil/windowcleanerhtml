import { describe, it, expect } from "vitest";
import { computeAngularDelta } from "../../src/utils/angularDelta.js";

describe("computeAngularDelta", () => {
  it("returns the plain difference for a simple clockwise step", () => {
    const delta = computeAngularDelta({ from: 0, to: Math.PI / 2 });

    expect(delta).toBeCloseTo(Math.PI / 2);
  });

  it("takes the short way around when the angles wrap past ±π", () => {
    const delta = computeAngularDelta({ from: 3, to: -3 });

    expect(delta).toBeCloseTo(2 * Math.PI - 6);
  });
});
