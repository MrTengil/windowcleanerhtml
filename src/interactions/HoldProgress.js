export class HoldProgress {
  constructor({ targetDurationMs }) {
    this.targetDurationMs = targetDurationMs;
    this.elapsedMs = 0;
  }

  trackTime(deltaMs) {
    this.elapsedMs = Math.min(this.elapsedMs + deltaMs, this.targetDurationMs);
  }

  progressFraction() {
    return this.elapsedMs / this.targetDurationMs;
  }

  isComplete() {
    return this.elapsedMs >= this.targetDurationMs;
  }

  release() {
    this.elapsedMs = 0;
  }
}
