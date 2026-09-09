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
    this.load.image("screwdriver", "assets/images/tools/screwdriver.svg");
    this.load.image("scissors", "assets/images/tools/scissors.svg");

    this.load.image("lift-gondola", "assets/images/lift/gondola.svg");
    this.load.image("lift-hanging-board", "assets/images/lift/hanging_board.svg");
    this.load.image("lift-rope-cable", "assets/images/lift/rope_cable_tile.svg");
    this.load.image("lift-rope-tan", "assets/images/lift/rope_tan_tile.svg");
    this.load.image("lift-bucket", "assets/images/lift/bucket.svg");

    this.load.image("board-edge", "assets/images/obstructions/board_edge.svg");
    this.load.image("board-middle", "assets/images/obstructions/board_middle.svg");
    this.load.image("screw-front", "assets/images/obstructions/screw_front.svg");

    CLOUDS.forEach((cloud) => {
      this.load.image(cloud.textureKey, `assets/images/clouds/${cloud.file}`);
    });
  }

  create() {
    this.scene.start("MainMenuScene");
  }
}
