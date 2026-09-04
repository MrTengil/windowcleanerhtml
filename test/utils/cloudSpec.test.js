import { describe, it, expect } from "vitest";
import { createCloudSpec } from "../../src/utils/cloudSpec.js";

const CLOUDS = [
  { textureKey: "cloud-a" },
  { textureKey: "cloud-b" },
  { textureKey: "cloud-c" },
];

function sequence(values) {
  let index = 0;

  return () => values[Math.min(index++, values.length - 1)];
}

describe("createCloudSpec", () => {
  it("picks the first cloud texture at the bottom of the random range", () => {
    const spec = createCloudSpec({ clouds: CLOUDS, random: () => 0 });

    expect(spec.textureKey).toBe("cloud-a");
  });

  it("picks the last cloud texture at the top of the random range", () => {
    const spec = createCloudSpec({ clouds: CLOUDS, random: () => 0.999999 });

    expect(spec.textureKey).toBe("cloud-c");
  });

  it("scales the cloud to the minimum at the bottom of the random range", () => {
    const spec = createCloudSpec({ clouds: CLOUDS, random: () => 0 });

    expect(spec.scale).toBe(0.35);
  });

  it("gives a larger cloud a larger parallax so closer clouds fall faster", () => {
    // Draw order: texture, scale, alpha, drift magnitude, direction.
    const distant = createCloudSpec({ clouds: CLOUDS, random: sequence([0, 0, 0, 0, 0]) });
    const close = createCloudSpec({ clouds: CLOUDS, random: sequence([0, 0.999999, 0, 0, 0]) });

    expect(close.parallax).toBeGreaterThan(distant.parallax);
  });

  it("drifts some clouds leftward and others rightward", () => {
    const leftward = createCloudSpec({ clouds: CLOUDS, random: sequence([0, 0, 0, 0, 0]) });
    const rightward = createCloudSpec({ clouds: CLOUDS, random: sequence([0, 0, 0, 0, 0.9]) });

    expect(Math.sign(leftward.driftSpeed)).toBe(-1);
    expect(Math.sign(rightward.driftSpeed)).toBe(1);
  });

  it("keeps clouds translucent even at the top of the random range", () => {
    const spec = createCloudSpec({ clouds: CLOUDS, random: () => 0.999999 });

    expect(spec.alpha).toBeGreaterThan(0);
    expect(spec.alpha).toBeLessThan(1);
  });
});
