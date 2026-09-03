export class Window {
  constructor({ dirtSpots }) {
    this.dirtSpots = dirtSpots;
  }

  isClean() {
    return this.dirtSpots.every((spot) => spot.isClean());
  }
}
