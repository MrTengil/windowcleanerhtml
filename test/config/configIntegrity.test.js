import { describe, it, expect } from "vitest";
import { HOUSES } from "../../src/config/houses.js";
import { DIRT_TYPES } from "../../src/config/dirtTypes.js";
import { TOOLS } from "../../src/config/tools.js";
import { LIFTS } from "../../src/config/lifts.js";

describe("config integrity", () => {
  const playableHouses = HOUSES.filter((house) => house.enabled);

  it("every playable house's dirt type ids exist in DIRT_TYPES", () => {
    const dirtTypeIds = new Set(Object.keys(DIRT_TYPES));

    for (const house of playableHouses) {
      for (const dirtTypeId of house.dirtTypeIds) {
        expect(dirtTypeIds.has(dirtTypeId)).toBe(true);
      }
    }
  });

  it("every playable house's lift id exists in LIFTS", () => {
    const liftIds = new Set(LIFTS.map((lift) => lift.id));

    for (const house of playableHouses) {
      expect(liftIds.has(house.liftId)).toBe(true);
    }
  });

  it("every dirt type's tool id exists in TOOLS", () => {
    const toolIds = new Set(TOOLS.map((tool) => tool.id));

    for (const dirtType of Object.values(DIRT_TYPES)) {
      expect(toolIds.has(dirtType.toolId)).toBe(true);
    }
  });

  it("scissors cannot clean the window", () => {
    const scissors = TOOLS.find((tool) => tool.id === "scissors");

    expect(scissors.canCleanWindow).toBe(false);
  });

  it("the screwdriver cannot clean the window", () => {
    const screwdriver = TOOLS.find((tool) => tool.id === "screwdriver");

    expect(screwdriver.canCleanWindow).toBe(false);
  });

  it("the spray bottle cannot clean the window", () => {
    const sprayBottle = TOOLS.find((tool) => tool.id === "spray-bottle");

    expect(sprayBottle.canCleanWindow).toBe(false);
  });
});
