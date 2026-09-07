import { describe, it, expect } from "vitest";
import { computeGameWidth } from "../../src/utils/viewport.js";

describe("computeGameWidth", () => {
  it("keeps the design width when the viewport matches the design aspect exactly", () => {
    const width = computeGameWidth({
      viewportWidth: 720,
      viewportHeight: 1560,
      designHeight: 1560,
      minAspect: 0.4615,
      maxAspect: 0.65,
    });

    expect(width).toBe(720);
  });

  it("widens the canvas to match a viewport that is proportionally wider than the design", () => {
    const width = computeGameWidth({
      viewportWidth: 900,
      viewportHeight: 1785,
      designHeight: 1560,
      minAspect: 0.4615,
      maxAspect: 0.65,
    });

    expect(width).toBe(787);
  });

  it("clamps to the max aspect for a viewport much wider than the design", () => {
    const width = computeGameWidth({
      viewportWidth: 1600,
      viewportHeight: 900,
      designHeight: 1560,
      minAspect: 0.4615,
      maxAspect: 0.65,
    });

    expect(width).toBe(1014);
  });

  it("clamps to the min aspect for a viewport narrower than the design", () => {
    const width = computeGameWidth({
      viewportWidth: 300,
      viewportHeight: 1000,
      designHeight: 1560,
      minAspect: 0.4615,
      maxAspect: 0.65,
    });

    expect(width).toBe(720);
  });
});
