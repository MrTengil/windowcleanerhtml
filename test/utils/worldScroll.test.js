import { describe, it, expect } from "vitest";
import { segmentWorldY, hasScrolledOutOfView } from "../../src/utils/worldScroll.js";

describe("segmentWorldY", () => {
  it("places the first floor at the resting position", () => {
    const worldY = segmentWorldY({ floor: 1, restingY: 460, spacing: 768 });

    expect(worldY).toBe(460);
  });

  it("places the second floor one spacing above the resting position", () => {
    const worldY = segmentWorldY({ floor: 2, restingY: 460, spacing: 768 });

    expect(worldY).toBe(460 - 768);
  });
});

describe("hasScrolledOutOfView", () => {
  it("keeps a segment sitting at its resting position", () => {
    const outOfView = hasScrolledOutOfView({
      worldY: 460,
      offset: 0,
      canvasHeight: 1280,
      spacing: 768,
    });

    expect(outOfView).toBe(false);
  });

  it("discards a segment scrolled more than one spacing past the bottom edge", () => {
    const outOfView = hasScrolledOutOfView({
      worldY: 460,
      offset: 768 * 3,
      canvasHeight: 1280,
      spacing: 768,
    });

    expect(outOfView).toBe(true);
  });

  it("keeps the previous floor while it is still peeking at the bottom", () => {
    const outOfView = hasScrolledOutOfView({
      worldY: 460,
      offset: 768,
      canvasHeight: 1280,
      spacing: 768,
    });

    expect(outOfView).toBe(false);
  });
});
