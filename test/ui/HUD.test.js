import { describe, it, expect } from "vitest";
import { formatFloorLabel } from "../../src/ui/HUD.js";

describe("formatFloorLabel", () => {
  it("formats the current and total floor as 'Floor X/Y'", () => {
    const label = formatFloorLabel(3, 5);

    expect(label).toBe("Floor 3/5");
  });

  it("formats just the current floor when there is no total (the infinite house)", () => {
    const label = formatFloorLabel(7, null);

    expect(label).toBe("Floor 7");
  });
});
