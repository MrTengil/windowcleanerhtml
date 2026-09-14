import { CLOUDS } from "../config/clouds.js";
import { SPRAY_PATTERNS } from "../config/sprayPatterns.js";
import { DIRT_TYPES } from "../config/dirtTypes.js";
import { BUBBLES } from "../config/bubbles.js";

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
    this.load.image("sponge", "assets/images/tools/sponge.svg");
    this.load.image("spray-bottle", "assets/images/tools/spray_bottle.svg");

    this.load.image("lift-gondola", "assets/images/lift/gondola.svg");
    this.load.image("lift-hanging-board", "assets/images/lift/hanging_board.svg");
    this.load.image("lift-rope-cable", "assets/images/lift/rope_cable_tile.svg");
    this.load.image("lift-rope-tan", "assets/images/lift/rope_tan_tile.svg");
    this.load.image("lift-bucket", "assets/images/lift/bucket.svg");

    this.load.image("board-edge", "assets/images/obstructions/board_edge.svg");
    this.load.image("board-middle", "assets/images/obstructions/board_middle.svg");
    this.load.image("screw-front", "assets/images/obstructions/screw_front.svg");
    this.load.image("police-tape-edge", "assets/images/obstructions/police_tape_edge.svg");
    this.load.image("police-tape-middle", "assets/images/obstructions/police_tape_middle.svg");

    CLOUDS.forEach((cloud) => {
      this.load.image(cloud.textureKey, `assets/images/clouds/${cloud.file}`);
    });

    SPRAY_PATTERNS.forEach((sprayPattern) => {
      this.load.image(sprayPattern.textureKey, `assets/images/spray-patterns/build-up/${sprayPattern.file}`);
    });

    Object.values(DIRT_TYPES)
      .filter((dirtType) => dirtType.textureKey)
      .forEach((dirtType) => {
        this.load.image(dirtType.textureKey, `assets/images/dirt/${dirtType.file}`);
      });

    Object.values(DIRT_TYPES)
      .flatMap((dirtType) => dirtType.stages ?? [])
      .forEach((stage) => {
        this.load.image(stage.textureKey, `assets/images/dirt/${stage.file}`);
      });

    BUBBLES.forEach((bubble) => {
      this.load.image(bubble.textureKey, `assets/images/bubbles/${bubble.file}`);
    });
  }

  create() {
    this.buildMenuBackgroundTexture();
    this.scene.start("MainMenuScene");
  }

  // Graphics.fillGradientStyle isn't reliably supported by Phaser's Canvas
  // renderer (this game runs Canvas, not WebGL) — drawing the gradient onto
  // a real 2D canvas context and using it as a texture works regardless of
  // renderer. Built once here since MainMenuScene re-runs create() every
  // time it's (re)entered.
  buildMenuBackgroundTexture() {
    const width = this.scale.width;
    const height = this.scale.height;
    const canvasTexture = this.textures.createCanvas("menu-background", width, height);
    const ctx = canvasTexture.getContext();
    const gradient = ctx.createLinearGradient(0, 0, 0, height);

    gradient.addColorStop(0, "#3d5a99");
    gradient.addColorStop(1, "#14161c");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
    canvasTexture.refresh();
  }
}
