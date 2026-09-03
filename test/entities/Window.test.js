import { describe, it, expect } from "vitest";
import { Window } from "../../src/entities/Window.js";

function dirtSpotStub(isClean) {
  return { isClean: () => isClean };
}

describe("Window", () => {
  it("is not clean when it has a dirty spot", () => {
    const window = new Window({ dirtSpots: [dirtSpotStub(false)] });

    expect(window.isClean()).toBe(false);
  });

  it("is clean when all of its dirt spots are clean", () => {
    const window = new Window({ dirtSpots: [dirtSpotStub(true), dirtSpotStub(true)] });

    expect(window.isClean()).toBe(true);
  });
});
