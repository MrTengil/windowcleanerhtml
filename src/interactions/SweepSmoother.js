export class SweepSmoother {
  constructor({ timeConstant }) {
    this.timeConstant = timeConstant;
    this.smoothedDx = 0;
    this.smoothedDy = 0;
    this.lastSampleTime = null;
  }

  addSample({ dx, dy, time }) {
    if (this.lastSampleTime === null) {
      this.smoothedDx = dx;
      this.smoothedDy = dy;
    } else {
      const dt = time - this.lastSampleTime;
      const alpha = 1 - Math.exp(-dt / this.timeConstant);

      this.smoothedDx += (dx - this.smoothedDx) * alpha;
      this.smoothedDy += (dy - this.smoothedDy) * alpha;
    }

    this.lastSampleTime = time;
  }

  reset() {
    this.lastSampleTime = null;
  }

  averageDelta() {
    return { dx: this.smoothedDx, dy: this.smoothedDy };
  }
}
