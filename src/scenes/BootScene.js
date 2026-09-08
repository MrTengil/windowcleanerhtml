import { CLOUDS } from "../config/clouds.js";

export class BootScene extends Phaser.Scene {
  constructor() {
    super("BootScene");
  }

  preload() {
    this.load.image("brick-town-wall", "assets/images/brick-town/brick_floor_tile.svg");
    this.load.image("brick-town-ground", "assets/images/brick-town/sidewalk_ground.svg");
    this.load.image("brick-town-roof", "assets/images/brick-town/brick_roof.svg");
    this.load.image("brick-town-skyline", "assets/images/brick-town/skyline_background.svg");
    this.load.image("squeegee", "assets/images/tools/squeegee.svg");

    this.load.image("lift-gondola", "assets/images/lift/gondola.svg");
    this.load.image("lift-hanging-board", "assets/images/lift/hanging_board.svg");
    this.load.image("lift-rope-cable", "assets/images/lift/rope_cable_tile.svg");
    this.load.image("lift-rope-tan", "assets/images/lift/rope_tan_tile.svg");
    this.load.image("lift-bucket", "assets/images/lift/bucket.svg");

    CLOUDS.forEach((cloud) => {
      this.load.image(cloud.textureKey, `assets/images/clouds/${cloud.file}`);
    });
  }

  create() {
    this.scene.start("MainMenuScene");
  }
}
