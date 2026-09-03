import { describe, it, expect } from "vitest";
import { DirtSpot } from "../../src/entities/DirtSpot.js";
import { handleTap } from "../../src/interactions/TapInteraction.js";

describe("handleTap", () => {
  it("reports becameClean true when the tap finishes a one-hit spot", () => {
    const spot = new DirtSpot({ hitsToClean: 1 });

    const result = handleTap(spot);

    expect(result.becameClean).toBe(true);
  });

  it("reports becameClean false when the spot still needs more hits", () => {
    const spot = new DirtSpot({ hitsToClean: 2 });

    const result = handleTap(spot);

    expect(result.becameClean).toBe(false);
  });

  it("reports becameClean false when tapping a spot that was already clean", () => {
    const spot = new DirtSpot({ hitsToClean: 1 });
    handleTap(spot);

    const result = handleTap(spot);

    expect(result.becameClean).toBe(false);
  });
});
