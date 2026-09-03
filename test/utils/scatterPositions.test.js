import { describe, it, expect } from "vitest";
import { scatterPositions } from "../../src/utils/scatterPositions.js";

describe("scatterPositions", () => {
  it("returns the requested number of positions", () => {
    const positions = scatterPositions({ count: 3, width: 200, height: 200, minSpacing: 20 });

    expect(positions).toHaveLength(3);
  });

  it("keeps every pair of positions at least minSpacing apart", () => {
    const positions = scatterPositions({ count: 4, width: 300, height: 300, minSpacing: 40 });

    for (let i = 0; i < positions.length; i++) {
      for (let j = i + 1; j < positions.length; j++) {
        const distance = Math.hypot(positions[i].x - positions[j].x, positions[i].y - positions[j].y);

        expect(distance).toBeGreaterThanOrEqual(40);
      }
    }
  });

  it("keeps every position within the given width/height bounds around center", () => {
    const positions = scatterPositions({ count: 5, width: 200, height: 100, minSpacing: 10 });

    for (const position of positions) {
      expect(Math.abs(position.x)).toBeLessThanOrEqual(100);
      expect(Math.abs(position.y)).toBeLessThanOrEqual(50);
    }
  });

  it("still returns the requested count when the spacing can never be satisfied", () => {
    const positions = scatterPositions({
      count: 5,
      width: 200,
      height: 200,
      minSpacing: 1000,
      random: () => 0.5,
    });

    expect(positions).toHaveLength(5);
  });
});
