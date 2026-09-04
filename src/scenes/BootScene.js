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

    CLOUDS.forEach((cloud) => {
      this.load.image(cloud.textureKey, `assets/images/clouds/${cloud.file}`);
    });
  }

  create() {
    this.scene.start("MainMenuScene");
  }
}
