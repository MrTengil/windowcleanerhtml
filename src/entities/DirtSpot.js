export class DirtSpot {
  constructor({ hitsToClean }) {
    this.hitsRemaining = hitsToClean;
  }

  registerTap() {
    this.hitsRemaining -= 1;
  }

  isClean() {
    return this.hitsRemaining <= 0;
  }
}
