import { describe, it, expect } from "vitest";
import { formatFloorLabel } from "../../src/ui/HUD.js";

describe("formatFloorLabel", () => {
  it("formats the current and total floor as 'Floor X/Y'", () => {
    const label = formatFloorLabel(3, 5);

    expect(label).toBe("Floor 3/5");
  });
});
