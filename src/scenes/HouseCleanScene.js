import { HOUSES } from "../config/houses.js";
import { DIRT_TYPES } from "../config/dirtTypes.js";
import { TOOLS } from "../config/tools.js";
import { LIFTS } from "../config/lifts.js";
import { RevealTracker } from "../interactions/RevealTracker.js";
import { segmentWorldY, hasScrolledOutOfView } from "../utils/worldScroll.js";
import { createCloudSpec } from "../utils/cloudSpec.js";
import { CLOUDS, CLOUD_FIRST_FLOOR } from "../config/clouds.js";
import { formatFloorLabel } from "../ui/HUD.js";

const CANVAS_WIDTH = 720;
const CANVAS_HEIGHT = 1560;

const BUILDING_X = CANVAS_WIDTH / 2;
const WINDOW_Y = 800;
const WINDOW_WIDTH = 420;
const WINDOW_HEIGHT = 520;
const WINDOW_OFFSET_X = 30;
const WINDOW_CENTER_X = BUILDING_X + WINDOW_OFFSET_X;
const WINDOW_LEFT = WINDOW_CENTER_X - WINDOW_WIDTH / 2;
const WINDOW_TOP = WINDOW_Y - WINDOW_HEIGHT / 2;

const SKY_COLOR = 0x87ceeb;
const SKYLINE_PARALLAX = 0.25;
const SKY_DEPTH = -30;
const SKYLINE_DEPTH = -20;
const CLOUD_DEPTH = -10;
const CLOUD_COUNT = 5;
const CLOUD_BAND_TOP = -60;
const CLOUD_BAND_BOTTOM = 220;

const WALL_WIDTH = 640;
const GROUND_HEIGHT = 300;
const GROUND_Y = CANVAS_HEIGHT - GROUND_HEIGHT / 2;
const ROOF_Y = 200;
const ROOF_HEIGHT = 104;
const LIFT_Y = 1180;
const HUD_DEPTH = 100;

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
    this.clouds = [];
  }

  create() {
    this.equippedTool = this.findEquippedTool();

    this.buildSkyBackground();
    this.buildBuildingWall();
    this.buildHud();
    this.buildToolbelt();
    this.buildLift();

    const firstFloor = this.spawnFloorSegment(1);
    this.ensureFloorSpawned(2);

    this.buildEraserBrush();
    this.buildToolIcon();
    this.setupSwipeInput();
    this.activateSegment(firstFloor);
  }

  update(time, delta) {
    for (const segment of this.segments) {
      segment.container.y = segment.worldY + this.scroll.offset;
    }

    this.updateWall();
    this.skyline.y = this.skylineBaseY + this.scroll.offset * SKYLINE_PARALLAX;

    this.driftClouds(delta);
  }

  updateWall() {
    const wallTop = this.roofLineY();
    const wallHeight = CANVAS_HEIGHT - wallTop;

    if (this.wall.height !== wallHeight) {
      this.wall.setSize(WALL_WIDTH, wallHeight);
    }

    this.wall.y = wallTop + wallHeight / 2;
    // Keep the brick phase locked to world space as the wall's top edge moves.
    this.wall.tilePositionY = wallTop - this.scroll.offset;
  }

  roofLineY() {
    const topSegment = this.segments.find((segment) => segment.floor === this.house.floors);

    if (!topSegment) {
      return 0;
    }

    const roofBottom = topSegment.container.y + (ROOF_Y - WINDOW_Y) + ROOF_HEIGHT / 2;

    return Phaser.Math.Clamp(roofBottom, 0, CANVAS_HEIGHT);
  }

  driftClouds(delta) {
    for (const cloud of this.clouds) {
      const halfWidth = cloud.image.displayWidth / 2;

      cloud.image.x += cloud.driftSpeed * (delta / 1000);
      cloud.image.y = cloud.worldY + this.scroll.offset * cloud.parallax;

      if (cloud.driftSpeed > 0 && cloud.image.x - halfWidth > CANVAS_WIDTH) {
        cloud.image.x = -halfWidth;
      } else if (cloud.driftSpeed < 0 && cloud.image.x + halfWidth < 0) {
        cloud.image.x = CANVAS_WIDTH + halfWidth;
      }

      if (cloud.image.y - cloud.image.displayHeight / 2 > CANVAS_HEIGHT) {
        cloud.worldY = CLOUD_BAND_TOP - this.scroll.offset * cloud.parallax;
      }
    }
  }

  spawnClouds() {
    const random = () => Math.random();

    for (let i = 0; i < CLOUD_COUNT; i++) {
      const spec = createCloudSpec({ clouds: CLOUDS, random });
      const screenY = Phaser.Math.Linear(CLOUD_BAND_TOP, CLOUD_BAND_BOTTOM, Math.random());
      const image = this.add
        .image(Math.random() * CANVAS_WIDTH, screenY, spec.textureKey)
        .setScale(spec.scale)
        .setAlpha(spec.alpha)
        .setDepth(CLOUD_DEPTH);

      this.clouds.push({
        image,
        driftSpeed: spec.driftSpeed,
        parallax: spec.parallax,
        worldY: screenY - this.scroll.offset * spec.parallax,
      });
    }
  }

  findEquippedTool() {
    const firstDirtType = DIRT_TYPES[this.house.dirtTypeIds[0]];

    return TOOLS.find((tool) => tool.id === firstDirtType.toolId);
  }

  buildSkyBackground() {
    this.add.rectangle(BUILDING_X, CANVAS_HEIGHT / 2, CANVAS_WIDTH, CANVAS_HEIGHT, SKY_COLOR).setDepth(SKY_DEPTH);

    this.skyline = this.add
      .image(BUILDING_X, 0, this.house.skylineTextureKey)
      .setOrigin(0.5, 0)
      .setDepth(SKYLINE_DEPTH);
    this.skylineBaseY = -this.skylineParallaxTravel();
    this.skyline.setDisplaySize(CANVAS_WIDTH, CANVAS_HEIGHT + this.skylineParallaxTravel());
    this.skyline.y = this.skylineBaseY;
  }

  skylineParallaxTravel() {
    return (this.house.floors - 1) * SEGMENT_SPACING * SKYLINE_PARALLAX;
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
      .setOrigin(0.5)
      .setDepth(HUD_DEPTH);

    this.progressBarGraphics = this.add.graphics().setDepth(HUD_DEPTH);
    this.drawProgressBar(0);

    this.add.rectangle(40, 40, 40, 40, 0x333333).setStrokeStyle(2, 0xffffff, 0.6).setDepth(HUD_DEPTH);
    this.add.text(40, 40, "II", { fontSize: "18px", color: "#ffffff" }).setOrigin(0.5).setDepth(HUD_DEPTH);
  }

  buildToolbelt() {
    this.createToolIcon(680, 40, 50, { withBorder: true }).setDepth(HUD_DEPTH);
    this.add
      .text(680, 70, this.equippedTool.name, { fontSize: "12px", color: "#ffffff", align: "center" })
      .setOrigin(0.5, 0)
      .setDepth(HUD_DEPTH);
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

  spawnFloorSegment(floor) {
    const worldY = segmentWorldY({
      floor,
      restingY: WINDOW_Y,
      spacing: SEGMENT_SPACING,
    });
    const container = this.add.container(BUILDING_X, worldY + this.scroll.offset);

    const pane = this.add
      .rectangle(WINDOW_OFFSET_X, 0, WINDOW_WIDTH, WINDOW_HEIGHT, 0x9fd3e8)
      .setStrokeStyle(4, 0xffffff, 0.8);
    container.add(pane);

    const dirtMask = this.add
      .renderTexture(WINDOW_OFFSET_X - WINDOW_WIDTH / 2, -WINDOW_HEIGHT / 2, WINDOW_WIDTH, WINDOW_HEIGHT)
      .setOrigin(0, 0);
    container.add(dirtMask);
    dirtMask.fill(DIRT_MASK_COLOR, 1);

    if (floor === 1) {
      const ground = this.add
        .image(0, GROUND_Y - WINDOW_Y, this.house.groundTextureKey)
        .setDisplaySize(CANVAS_WIDTH, GROUND_HEIGHT);
      container.add(ground);
    }

    if (floor === this.house.floors) {
      container.add(this.add.image(0, ROOF_Y - WINDOW_Y, this.house.roofTextureKey));
    }

    const segment = { container, dirtMask, worldY, floor };
    this.segments.push(segment);

    return segment;
  }

  activateSegment(segment) {
    this.dirtMask = segment.dirtMask;
    this.revealTracker = new RevealTracker({ width: WINDOW_WIDTH, height: WINDOW_HEIGHT, cellSize: REVEAL_CELL_SIZE });
    this.floorComplete = false;

    this.drawProgressBar(0);
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

    const nextSegment = this.segments.find((segment) => segment.floor === this.currentFloor);
    this.activateSegment(nextSegment);
    this.ensureFloorSpawned(this.currentFloor + 1);

    this.tweens.add({
      targets: this.scroll,
      offset: this.scroll.offset + SEGMENT_SPACING,
      duration: SCROLL_DURATION,
      ease: "Cubic.easeInOut",
      onComplete: () => {
        this.cullScrolledSegments();

        if (this.currentFloor > CLOUD_FIRST_FLOOR && this.clouds.length === 0) {
          this.spawnClouds();
        }

        this.isTransitioning = false;
      },
    });
  }

  ensureFloorSpawned(floor) {
    const alreadySpawned = this.segments.some((segment) => segment.floor === floor);

    if (floor <= this.house.floors && !alreadySpawned) {
      this.spawnFloorSegment(floor);
    }
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
