import { HOUSES } from "../config/houses.js";
import { DIRT_TYPES } from "../config/dirtTypes.js";
import { TOOLS } from "../config/tools.js";
import { LIFTS } from "../config/lifts.js";
import { RevealTracker } from "../interactions/RevealTracker.js";
import { segmentWorldY, hasScrolledOutOfView } from "../utils/worldScroll.js";
import { formatFloorLabel } from "../ui/HUD.js";

const CANVAS_WIDTH = 720;
const CANVAS_HEIGHT = 1560;

const BUILDING_X = CANVAS_WIDTH / 2;
const WINDOW_Y = 560;
const WINDOW_WIDTH = 480;
const WINDOW_HEIGHT = 560;
const WINDOW_CENTER_X = BUILDING_X;
const WINDOW_LEFT = WINDOW_CENTER_X - WINDOW_WIDTH / 2;
const WINDOW_TOP = WINDOW_Y - WINDOW_HEIGHT / 2;

const SKY_COLOR = 0x87ceeb;

const WALL_WIDTH = 640;
const GROUND_HEIGHT = 300;
const GROUND_Y = CANVAS_HEIGHT - GROUND_HEIGHT / 2;
const ROOF_Y = 200;
const LIFT_Y = 1000;

const DIRT_MASK_COLOR = 0x8a7f6a;
const BRUSH_RADIUS = 100;
const ERASE_STEP_DISTANCE = 12;
const REVEAL_CELL_SIZE = 40;
const REVEAL_THRESHOLD = 0.99;

const WALL_TILE_HEIGHT = 384;
const SEGMENT_SPACING = WALL_TILE_HEIGHT * 2;
const SCROLL_DURATION = 700;

const PROGRESS_BAR_X = 160;
const PROGRESS_BAR_Y = 80;
const PROGRESS_BAR_WIDTH = 400;
const PROGRESS_BAR_HEIGHT = 16;

export class HouseCleanScene extends Phaser.Scene {
  constructor() {
    super("HouseCleanScene");
  }

  init(data) {
    this.house = HOUSES.find((house) => house.id === data.houseId);
    this.currentFloor = 1;
    this.isTransitioning = false;
    this.floorComplete = false;
    this.scroll = { offset: 0 };
    this.segments = [];
  }

  create() {
    this.equippedTool = this.findEquippedTool();

    this.buildSkyBackground();
    this.buildBuildingWall();
    this.buildHud();
    this.buildToolbelt();
    this.buildLift();

    this.spawnFloorSegment();

    this.buildEraserBrush();
    this.buildToolIcon();
    this.setupSwipeInput();
    this.resetFloor();
  }

  update() {
    for (const segment of this.segments) {
      segment.container.y = segment.worldY + this.scroll.offset;
    }

    this.wall.tilePositionY = -this.scroll.offset;
  }

  findEquippedTool() {
    const firstDirtType = DIRT_TYPES[this.house.dirtTypeIds[0]];

    return TOOLS.find((tool) => tool.id === firstDirtType.toolId);
  }

  buildSkyBackground() {
    this.add.rectangle(BUILDING_X, CANVAS_HEIGHT / 2, CANVAS_WIDTH, CANVAS_HEIGHT, SKY_COLOR);
  }

  buildBuildingWall() {
    this.wall = this.add.tileSprite(BUILDING_X, CANVAS_HEIGHT / 2, WALL_WIDTH, CANVAS_HEIGHT, this.house.wallTextureKey);
  }

  buildHud() {
    this.floorText = this.add
      .text(360, 40, formatFloorLabel(this.currentFloor, this.house.floors), {
        fontSize: "28px",
        color: "#ffffff",
      })
      .setOrigin(0.5);

    this.progressBarGraphics = this.add.graphics();
    this.drawProgressBar(0);

    this.add.rectangle(40, 40, 40, 40, 0x333333).setStrokeStyle(2, 0xffffff, 0.6);
    this.add.text(40, 40, "II", { fontSize: "18px", color: "#ffffff" }).setOrigin(0.5);
  }

  buildToolbelt() {
    this.createToolIcon(680, 40, 50, { withBorder: true });
    this.add
      .text(680, 70, this.equippedTool.name, { fontSize: "12px", color: "#ffffff", align: "center" })
      .setOrigin(0.5, 0);
  }

  createToolIcon(x, y, size, { withBorder }) {
    if (this.equippedTool.iconTextureKey) {
      return this.add.image(x, y, this.equippedTool.iconTextureKey).setDisplaySize(size, size);
    }

    const rectangle = this.add.rectangle(x, y, size, size, this.equippedTool.color);

    if (withBorder) {
      rectangle.setStrokeStyle(3, 0xffffff, 0.9);
    }

    return rectangle;
  }

  drawProgressBar(fraction) {
    this.progressBarGraphics.clear();
    this.progressBarGraphics.fillStyle(0x333333, 1);
    this.progressBarGraphics.fillRect(PROGRESS_BAR_X, PROGRESS_BAR_Y, PROGRESS_BAR_WIDTH, PROGRESS_BAR_HEIGHT);
    this.progressBarGraphics.fillStyle(0x4caf50, 1);
    this.progressBarGraphics.fillRect(PROGRESS_BAR_X, PROGRESS_BAR_Y, PROGRESS_BAR_WIDTH * fraction, PROGRESS_BAR_HEIGHT);
  }

  buildLift() {
    const lift = LIFTS.find((candidate) => candidate.id === this.house.liftId);

    this.add.rectangle(BUILDING_X, LIFT_Y, 600, 40, lift.color);
  }

  spawnFloorSegment() {
    const worldY = segmentWorldY({
      floor: this.currentFloor,
      restingY: WINDOW_Y,
      spacing: SEGMENT_SPACING,
    });
    const container = this.add.container(BUILDING_X, worldY + this.scroll.offset);

    const pane = this.add
      .rectangle(0, 0, WINDOW_WIDTH, WINDOW_HEIGHT, 0x9fd3e8)
      .setStrokeStyle(4, 0xffffff, 0.8);
    container.add(pane);

    const dirtMask = this.add
      .renderTexture(-WINDOW_WIDTH / 2, -WINDOW_HEIGHT / 2, WINDOW_WIDTH, WINDOW_HEIGHT)
      .setOrigin(0, 0);
    container.add(dirtMask);

    if (this.currentFloor === 1) {
      container.add(this.add.image(0, GROUND_Y - WINDOW_Y, this.house.groundTextureKey));
    }

    if (this.currentFloor === this.house.floors) {
      container.add(this.add.image(0, ROOF_Y - WINDOW_Y, this.house.roofTextureKey));
    }

    this.segments.push({ container, worldY });
    this.dirtMask = dirtMask;
  }

  cullScrolledSegments() {
    this.segments = this.segments.filter((segment) => {
      const outOfView = hasScrolledOutOfView({
        worldY: segment.worldY,
        offset: this.scroll.offset,
        canvasHeight: CANVAS_HEIGHT,
        spacing: SEGMENT_SPACING,
      });

      if (outOfView) {
        segment.container.destroy();
      }

      return !outOfView;
    });
  }

  buildEraserBrush() {
    this.eraserBrush = this.add.circle(0, 0, BRUSH_RADIUS, 0xffffff).setVisible(false);
  }

  buildToolIcon() {
    this.toolIcon = this.createToolIcon(0, 0, 36, { withBorder: false }).setVisible(false).setDepth(1000);

    this.tweens.add({ targets: this.toolIcon, scale: 1.2, yoyo: true, repeat: -1, duration: 220 });
  }

  setupSwipeInput() {
    this.input.on("pointermove", (pointer) => this.handlePointerMove(pointer));
    this.input.on("pointerup", () => this.toolIcon.setVisible(false));
  }

  handlePointerMove(pointer) {
    if (this.isTransitioning || !pointer.isDown) {
      this.toolIcon.setVisible(false);
      return;
    }

    const insideWindow = this.isInsideWindow(pointer);
    this.toolIcon.setVisible(insideWindow);
    this.toolIcon.setPosition(pointer.x, pointer.y);

    if (!insideWindow) {
      return;
    }

    const from = this.toWindowLocal(pointer.prevPosition.x, pointer.prevPosition.y);
    const to = this.toWindowLocal(pointer.x, pointer.y);

    this.eraseAlongPath(from, to);
    this.updateRevealProgress();
  }

  isInsideWindow(pointer) {
    return (
      Math.abs(pointer.x - WINDOW_CENTER_X) <= WINDOW_WIDTH / 2 && Math.abs(pointer.y - WINDOW_Y) <= WINDOW_HEIGHT / 2
    );
  }

  toWindowLocal(x, y) {
    return {
      x: Phaser.Math.Clamp(x - WINDOW_LEFT, 0, WINDOW_WIDTH),
      y: Phaser.Math.Clamp(y - WINDOW_TOP, 0, WINDOW_HEIGHT),
    };
  }

  eraseAlongPath(from, to) {
    const distance = Phaser.Math.Distance.Between(from.x, from.y, to.x, to.y);
    const steps = Math.max(1, Math.ceil(distance / ERASE_STEP_DISTANCE));

    for (let i = 1; i <= steps; i++) {
      const t = i / steps;
      const x = Phaser.Math.Linear(from.x, to.x, t);
      const y = Phaser.Math.Linear(from.y, to.y, t);

      this.dirtMask.erase(this.eraserBrush, x, y);
      this.revealTracker.markRevealedInRadius(x, y, BRUSH_RADIUS);
    }
  }

  updateRevealProgress() {
    this.drawProgressBar(this.revealTracker.revealedFraction());

    if (!this.floorComplete && this.revealTracker.isFullyRevealed(REVEAL_THRESHOLD)) {
      this.floorComplete = true;
      this.time.delayedCall(300, () => this.advanceFloor());
    }
  }

  resetFloor() {
    this.dirtMask.clear();
    this.dirtMask.fill(DIRT_MASK_COLOR, 1);

    this.revealTracker = new RevealTracker({ width: WINDOW_WIDTH, height: WINDOW_HEIGHT, cellSize: REVEAL_CELL_SIZE });
    this.floorComplete = false;

    this.drawProgressBar(0);
  }

  advanceFloor() {
    this.currentFloor += 1;

    if (this.currentFloor > this.house.floors) {
      this.showLevelComplete();
      return;
    }

    this.floorText.setText(formatFloorLabel(this.currentFloor, this.house.floors));
    this.playFloorTransition();
  }

  playFloorTransition() {
    this.isTransitioning = true;

    this.spawnFloorSegment();
    this.resetFloor();

    this.tweens.add({
      targets: this.scroll,
      offset: this.scroll.offset + SEGMENT_SPACING,
      duration: SCROLL_DURATION,
      ease: "Cubic.easeInOut",
      onComplete: () => {
        this.cullScrolledSegments();
        this.isTransitioning = false;
      },
    });
  }

  showLevelComplete() {
    this.add.rectangle(BUILDING_X, CANVAS_HEIGHT / 2, CANVAS_WIDTH, CANVAS_HEIGHT, 0x000000, 0.7);
    this.add
      .text(360, 580, "Level Complete", { fontSize: "40px", color: "#ffffff" })
      .setOrigin(0.5);

    const menuButton = this.add
      .rectangle(360, 660, 200, 60, 0x4caf50)
      .setInteractive({ useHandCursor: true });
    this.add.text(360, 660, "Menu", { fontSize: "24px", color: "#ffffff" }).setOrigin(0.5);

    menuButton.on("pointerdown", () => this.scene.start("MainMenuScene"));
  }
}
