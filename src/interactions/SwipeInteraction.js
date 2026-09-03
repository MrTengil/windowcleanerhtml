export class SwipeProgress {
  constructor({ distancePerHit }) {
    this.distancePerHit = distancePerHit;
    this.accumulatedDistance = 0;
  }

  registerDistance(distance) {
    this.accumulatedDistance += distance;

    if (this.accumulatedDistance < this.distancePerHit) {
      return false;
    }

    this.accumulatedDistance -= this.distancePerHit;

    return true;
  }
}
