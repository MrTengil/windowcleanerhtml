import { computeAngularDelta } from "../utils/angularDelta.js";

export class ScrewProgress {
  constructor({ targetRotation }) {
    this.targetRotation = targetRotation;
    this.rotationProgress = 0;
    this.lastAngle = null;
  }

  trackAngle(angle) {
    if (this.lastAngle === null) {
      this.lastAngle = angle;
      return;
    }

    const delta = computeAngularDelta({ from: this.lastAngle, to: angle });

    this.rotationProgress = Math.min(Math.max(this.rotationProgress - delta, 0), this.targetRotation);
    this.lastAngle = angle;
  }

  release() {
    this.lastAngle = null;
  }

  progressFraction() {
    return this.rotationProgress / this.targetRotation;
  }

  isComplete() {
    return this.rotationProgress >= this.targetRotation;
  }
}
