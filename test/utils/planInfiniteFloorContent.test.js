import { describe, it, expect } from "vitest";
import { planInfiniteFloorContent } from "../../src/utils/planInfiniteFloorContent.js";

function sequence(values) {
  let index = 0;

  return () => values[Math.min(index++, values.length - 1)];
}

describe("planInfiniteFloorContent", () => {
  it("forces one dirt spot when every roll is at the bottom of its range", () => {
    const plan = planInfiniteFloorContent({ random: () => 0 });

    expect(plan.obstructionTypes).toEqual([]);
    expect(plan.dirtTypeIds).toEqual(["bird-poop"]);
  });

  it("picks the maximum obstruction and dirt count at the top of the random range, repeats allowed", () => {
    const plan = planInfiniteFloorContent({ random: () => 0.999999 });

    expect(plan.obstructionTypes).toEqual(["police-tape", "police-tape"]);
    expect(plan.dirtTypeIds).toEqual(["sticker", "sticker", "sticker"]);
  });

  it("picks exactly one obstruction for a roll in the middle bucket", () => {
    // Draw order: obstruction count, one roll per obstruction, dirt count,
    // one roll per dirt spot.
    const plan = planInfiniteFloorContent({ random: sequence([0.6, 0, 0.3, 0]) });

    expect(plan.obstructionTypes).toEqual(["board"]);
    expect(plan.dirtTypeIds).toEqual(["bird-poop"]);
  });

  it("allows a mix of different obstruction and dirt types on the same floor", () => {
    const plan = planInfiniteFloorContent({ random: sequence([0.99, 0, 0.99, 0.5, 0, 0.99]) });

    expect(plan.obstructionTypes).toEqual(["board", "police-tape"]);
    expect(plan.dirtTypeIds).toEqual(["bird-poop", "sticker"]);
  });
});
