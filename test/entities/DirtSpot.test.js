import { describe, it, expect } from "vitest";
import { DirtSpot } from "../../src/entities/DirtSpot.js";

describe("DirtSpot", () => {
  it("is not clean when just created", () => {
    const spot = new DirtSpot({ hitsToClean: 1 });

    expect(spot.isClean()).toBe(false);
  });

  it("becomes clean after registering a tap when only one hit is needed", () => {
    const spot = new DirtSpot({ hitsToClean: 1 });

    spot.registerTap();

    expect(spot.isClean()).toBe(true);
  });

  it("is not yet clean after only one tap when two hits are needed", () => {
    const spot = new DirtSpot({ hitsToClean: 2 });

    spot.registerTap();

    expect(spot.isClean()).toBe(false);
  });
});
