import { HOUSES } from "../config/houses.js";
import { DIRT_TYPES } from "../config/dirtTypes.js";
import { TOOLS } from "../config/tools.js";
import { LIFTS } from "../config/lifts.js";
import { RevealTracker } from "../interactions/RevealTracker.js";
import { segmentWorldY, hasScrolledOutOfView } from "../utils/worldScroll.js";
import { createCloudSpec } from "../utils/cloudSpec.js";
import { computeSweepRotation } from "../utils/sweepRotation.js";
import { SweepSmoother } from "../interactions/SweepSmoother.js";
import { ScrewProgress } from "../interactions/ScrewProgress.js";
import { CLOUDS, CLOUD_FIRST_FLOOR } from "../config/clouds.js";
import { formatFloorLabel } from "../ui/HUD.js";

const CANVAS_HEIGHT = 1560;

const WINDOW_Y = 800;
const WINDOW_WIDTH = 420;
const WINDOW_HEIGHT = 520;
const WINDOW_OFFSET_X = 0;
const WINDOW_TOP = WINDOW_Y - WINDOW_HEIGHT / 2;

const BOARD_EDGE_WIDTH = 30;
const BOARD_OVERHANG = 80;
const BOARD_EDGE_NATIVE_WIDTH = 50;
const BOARD_EDGE_NATIVE_HEIGHT = 100;
const BOARD_SCREW_NATIVE_OFFSET_X = 2;
const BOARD_HINGE_ROTATION = 1.3;
const BOARD_HINGE_DURATION = 400;
const BOARD_FALL_DURATION = 500;
const BOARD_FALL_DISTANCE = CANVAS_HEIGHT;

const SCREW_DISPLAY_SIZE = 70;
const SCREW_HIT_RADIUS = 70;
const SCREW_PROGRESS_RADIUS = 50;
const SCREW_PROGRESS_STROKE = 6;
const SCREW_PROGRESS_COLOR = 0x4caf50;
const UNSCREW_TARGET_ROTATION = Math.PI * 4;
const SCREW_FALL_DISTANCE = 150;
const SCREW_FALL_DURATION = 350;

const HUD_RIGHT_MARGIN = 40;

const SKY_COLOR = 0x87ceeb;
const SKYLINE_PARALLAX = 0.25;
const SKY_DEPTH = -30;
const SKYLINE_DEPTH = -20;
const CLOUD_DEPTH = -10;
const LIFT_DEPTH = 10;
const CLOUD_COUNT = 5;
const CLOUD_BAND_TOP = -60;
const CLOUD_BAND_BOTTOM = 220;

const WALL_WIDTH = 640;
const GROUND_HEIGHT = 300;
const GROUND_Y = CANVAS_HEIGHT - GROUND_HEIGHT / 2;
const ROOF_Y = 200;
const ROOF_HEIGHT = 104;
const LIFT_Y = 1280;
const HUD_DEPTH = 100;

const DIRT_MASK_COLOR = 0x8a7f6a;
const BRUSH_RADIUS = 100;
const ERASE_STEP_DISTANCE = 12;
const REVEAL_CELL_SIZE = 40;
const REVEAL_THRESHOLD = 0.99;
const DIRT_FADE_DURATION = 300;
const SWEEP_TIME_CONSTANT = 100;

const WALL_TILE_HEIGHT = 384;
const SEGMENT_SPACING = WALL_TILE_HEIGHT * 2;
const SCROLL_DURATION = 700;

const PROGRESS_BAR_X = 160;
const PROGRESS_BAR_Y = 80;
const PROGRESS_BAR_WIDTH = 400;
const PROGRESS_BAR_HEIGHT = 16;

const ROPE_TOP_OVERSHOOT = 60;
const LIFT_PLATFORM_SPECS = {
  gondola: {
    nativeWidth: 640,
    nativeHeight: 250,
    displayWidth: 900,
    ropeAnchorY: 26,
    ropeWidth: 10,
    ropeAnchorsX: [160, 480],
    ropeBehindPlatform: true,
    bucketAnchor: { x: 320, y: 20 },
  },
  "hanging-board": {
    nativeWidth: 520,
    nativeHeight: 175,
    displayWidth: 760,
    ropeAnchorY: 15,
    ropeWidth: 12,
    ropeAnchorsX: [95, 425],
    ropeBehindPlatform: true,
    bucketAnchor: { x: 260, y: 120 },
  },
};

const BUCKET_BASE_WIDTH = 90;
const BUCKET_SCALE = 1.55;
const BUCKET_DISPLAY_WIDTH = BUCKET_BASE_WIDTH * BUCKET_SCALE;
const BUCKET_NATIVE_ASPECT = 220 / 200;
const BUCKET_ORIGIN_Y = 0.1;

const TOOL_SELECTOR_BACKDROP_DEPTH = 1500;
const TOOL_SELECTOR_PANEL_DEPTH = 1600;
const TOOL_SELECTOR_ICON_SIZE = 50;
const TOOL_SELECTOR_GAP = 30;
const TOOL_SELECTOR_PANEL_PADDING = 40;
const TOOL_SELECTOR_PANEL_HEIGHT = 140;

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

  computeLayout() {
    this.canvasWidth = this.scale.width;
    this.buildingX = this.canvasWidth / 2;
    this.windowCenterX = this.buildingX + WINDOW_OFFSET_X;
    this.windowLeft = this.windowCenterX - WINDOW_WIDTH / 2;
  }

  create() {
    this.equippedTool = this.findEquippedTool();
    this.computeLayout();

    this.buildSkyBackground();
    this.buildBuildingWall();
    this.buildHud();
    this.refreshToolbeltDisplay();
    this.buildLift();

    const firstFloor = this.spawnFloorSegment(1);
    this.ensureFloorSpawned(2);

    this.buildEraserBrush();
    this.sweepSmoother = new SweepSmoother({ timeConstant: SWEEP_TIME_CONSTANT });
    this.refreshDraggingToolIcon();
    this.buildDebugSkipButton();
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

      if (cloud.driftSpeed > 0 && cloud.image.x - halfWidth > this.canvasWidth) {
        cloud.image.x = -halfWidth;
      } else if (cloud.driftSpeed < 0 && cloud.image.x + halfWidth < 0) {
        cloud.image.x = this.canvasWidth + halfWidth;
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
        .image(Math.random() * this.canvasWidth, screenY, spec.textureKey)
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
    this.add.rectangle(this.buildingX, CANVAS_HEIGHT / 2, this.canvasWidth, CANVAS_HEIGHT, SKY_COLOR).setDepth(SKY_DEPTH);

    this.skyline = this.add
      .image(this.buildingX, 0, this.house.skylineTextureKey)
      .setOrigin(0.5, 0)
      .setDepth(SKYLINE_DEPTH);
    this.skylineBaseY = -this.skylineParallaxTravel();
    this.skyline.setDisplaySize(this.canvasWidth, CANVAS_HEIGHT + this.skylineParallaxTravel());
    this.skyline.y = this.skylineBaseY;
  }

  skylineParallaxTravel() {
    return (this.house.floors - 1) * SEGMENT_SPACING * SKYLINE_PARALLAX;
  }

  buildBuildingWall() {
    this.wall = this.add.tileSprite(this.buildingX, CANVAS_HEIGHT / 2, WALL_WIDTH, CANVAS_HEIGHT, this.house.wallTextureKey);
  }

  buildHud() {
    this.floorText = this.add
      .text(this.buildingX, 40, formatFloorLabel(this.currentFloor, this.house.floors), {
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

  refreshToolbeltDisplay() {
    const toolbeltX = this.canvasWidth - HUD_RIGHT_MARGIN;

    this.toolbeltIcon?.destroy();
    this.toolbeltLabel?.destroy();

    this.toolbeltIcon = this.createToolIcon(this.equippedTool, toolbeltX, 40, 50, { withBorder: true }).setDepth(
      HUD_DEPTH,
    );
    this.toolbeltLabel = this.add
      .text(toolbeltX, 70, this.equippedTool.name, { fontSize: "12px", color: "#ffffff", align: "center" })
      .setOrigin(0.5, 0)
      .setDepth(HUD_DEPTH);
  }

  createToolIcon(tool, x, y, size, { withBorder }) {
    if (tool.iconTextureKey) {
      return this.add.image(x, y, tool.iconTextureKey).setDisplaySize(size, size);
    }

    const rectangle = this.add.rectangle(x, y, size, size, tool.color);

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

  buildDebugSkipButton() {
    const button = this.add
      .rectangle(40, 100, 80, 36, 0x555555)
      .setStrokeStyle(2, 0xffffff, 0.6)
      .setInteractive({ useHandCursor: true })
      .setDepth(HUD_DEPTH);

    this.add.text(40, 100, "Skip", { fontSize: "14px", color: "#ffffff" }).setOrigin(0.5).setDepth(HUD_DEPTH);

    button.on("pointerdown", () => this.debugSkipFloor());
  }

  debugSkipFloor() {
    if (this.isTransitioning || this.currentFloor > this.house.floors) {
      return;
    }

    this.advanceFloor();
  }

  buildLift() {
    const selectedLiftId = this.registry.get("selectedLiftId") ?? this.house.liftId;
    const lift =
      LIFTS.find((candidate) => candidate.id === selectedLiftId) ??
      LIFTS.find((candidate) => candidate.id === this.house.liftId);

    this.liftContainer = this.add.container(this.buildingX, LIFT_Y).setDepth(LIFT_DEPTH);
    this.liftBaseX = this.buildingX;
    this.liftBaseY = LIFT_Y;

    if (!lift.platformTextureKey) {
      this.liftContainer.add(this.add.rectangle(0, 0, 600, 40, lift.color));
      return;
    }

    const spec = LIFT_PLATFORM_SPECS[lift.id];
    const scaleFactor = spec.displayWidth / spec.nativeWidth;
    const displayHeight = spec.nativeHeight * scaleFactor;
    const platformTopY = -displayHeight / 2;

    const platform = this.add
      .image(0, 0, lift.platformTextureKey)
      .setDisplaySize(spec.displayWidth, displayHeight);

    const ropes = spec.ropeAnchorsX.map((localX) => {
      const anchorX = -spec.displayWidth / 2 + localX * scaleFactor;
      const anchorY = platformTopY + spec.ropeAnchorY * scaleFactor;
      // Anchor is local to liftContainer (origin at LIFT_Y), but the rope
      // still needs to reach the top of the screen in absolute coordinates.
      const ropeHeight = LIFT_Y + anchorY + ROPE_TOP_OVERSHOOT;

      return this.add
        .tileSprite(anchorX, anchorY, spec.ropeWidth, ropeHeight, lift.ropeTextureKey)
        .setOrigin(0.5, 1);
    });

    // Containers render children in the order added, so this preserves the
    // "rope behind platform" layering you had via setDepth before.
    if (spec.ropeBehindPlatform) {
      this.liftContainer.add([...ropes, platform]);
    } else {
      this.liftContainer.add([platform, ...ropes]);
    }

    this.buildBucket(spec, scaleFactor, platformTopY);
  }

  buildBucket(spec, scaleFactor, platformTopY) {
    const anchorX = -spec.displayWidth / 2 + spec.bucketAnchor.x * scaleFactor;
    const anchorY = platformTopY + spec.bucketAnchor.y * scaleFactor;
    const bucketDisplayHeight = BUCKET_DISPLAY_WIDTH * BUCKET_NATIVE_ASPECT;

    this.bucketImage = this.add
      .image(anchorX, anchorY, "lift-bucket")
      .setDisplaySize(BUCKET_DISPLAY_WIDTH, bucketDisplayHeight)
      .setOrigin(0.5, BUCKET_ORIGIN_Y)
      .setInteractive({ useHandCursor: true });

    this.bucketImage.on("pointerdown", () => this.openToolSelector());

    // Added last so it renders on top regardless of each lift's own
    // ropeBehindPlatform ordering.
    this.liftContainer.add(this.bucketImage);
  }

  animateLiftBounce() {
    const dropAmplitude = Phaser.Math.Between(30, 50);
    const settleAmplitude = Phaser.Math.Between(6, 14);
    const dropDuration = Phaser.Math.Between(300, 400);
    const settleDuration = Phaser.Math.Between(150, 200);

    const tweens = [
      { y: this.liftBaseY + dropAmplitude, duration: dropDuration, ease: "Sine.easeOut", yoyo: true },
      { y: this.liftBaseY - settleAmplitude, duration: settleDuration, ease: "Sine.easeOut", yoyo: true },
    ];

    this.tweens.chain({ targets: this.liftContainer, tweens });
  }

  animateBucketSwing() {
    if (!this.bucketImage) {
      return;
    }

    const swingAmplitude = Phaser.Math.FloatBetween(0.2, 0.35);
    const settleAmplitude = Phaser.Math.FloatBetween(0.03, 0.08);
    const swingDuration = Phaser.Math.Between(300, 400);
    const settleDuration = Phaser.Math.Between(150, 200);

    const tweens = [
      { rotation: swingAmplitude, duration: swingDuration, ease: "Sine.easeOut", yoyo: true },
      { rotation: -settleAmplitude, duration: settleDuration, ease: "Sine.easeOut", yoyo: true },
    ];

    this.tweens.chain({ targets: this.bucketImage, tweens });
  }

  spawnFloorSegment(floor) {
    const worldY = segmentWorldY({
      floor,
      restingY: WINDOW_Y,
      spacing: SEGMENT_SPACING,
    });
    const container = this.add.container(this.buildingX, worldY + this.scroll.offset);

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
        .setDisplaySize(this.canvasWidth, GROUND_HEIGHT);
      container.add(ground);
    }

    if (floor === this.house.floors) {
      container.add(this.add.image(0, ROOF_Y - WINDOW_Y, this.house.roofTextureKey));
    }

    const obstruction = this.buildBoardObstruction(container);

    const segment = { container, dirtMask, worldY, floor, obstruction };
    this.segments.push(segment);

    return segment;
  }

  activateSegment(segment) {
    this.dirtMask = segment.dirtMask;
    this.revealTracker = new RevealTracker({ width: WINDOW_WIDTH, height: WINDOW_HEIGHT, cellSize: REVEAL_CELL_SIZE });
    this.floorComplete = false;
    this.activeObstruction = segment.obstruction;

    this.drawProgressBar(0);
  }

  buildBoardObstruction(container) {
    // Uniform scale on every axis — a non-uniform stretch fattens anything
    // drawn as a horizontal line in the source art, since a horizontal
    // line's thickness is a vertical measurement.
    const rowScale = BOARD_EDGE_WIDTH / BOARD_EDGE_NATIVE_WIDTH;
    const rowHeight = BOARD_EDGE_NATIVE_HEIGHT * rowScale;
    const boardWidth = WINDOW_WIDTH + BOARD_OVERHANG * 2;
    const middleWidth = boardWidth - BOARD_EDGE_WIDTH * 2;
    const edgeLeftX = -boardWidth / 2 + BOARD_EDGE_WIDTH / 2;
    const edgeRightX = boardWidth / 2 - BOARD_EDGE_WIDTH / 2;

    const leftEdge = this.add.image(edgeLeftX, 0, "board-edge").setDisplaySize(BOARD_EDGE_WIDTH, rowHeight);
    const middle = this.add
      .tileSprite(0, 0, middleWidth, rowHeight, "board-middle")
      .setTileScale(rowScale, rowScale);
    const rightEdge = this.add
      .image(edgeRightX, 0, "board-edge")
      .setDisplaySize(BOARD_EDGE_WIDTH, rowHeight)
      .setFlipX(true);

    const boardPlank = this.add.container(0, 0, [leftEdge, middle, rightEdge]);
    container.add(boardPlank);

    const screws = [
      this.buildScrew(container, edgeLeftX + BOARD_SCREW_NATIVE_OFFSET_X),
      this.buildScrew(container, edgeRightX - BOARD_SCREW_NATIVE_OFFSET_X),
    ];

    return { boardPlank, screws, cleared: false };
  }

  buildScrew(container, x) {
    const image = this.add.image(x, 0, "screw-front").setDisplaySize(SCREW_DISPLAY_SIZE, SCREW_DISPLAY_SIZE);
    const progressGraphics = this.add.graphics().setPosition(x, 0);

    container.add([image, progressGraphics]);

    return {
      image,
      progressGraphics,
      progress: new ScrewProgress({ targetRotation: UNSCREW_TARGET_ROTATION }),
      done: false,
    };
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

  refreshDraggingToolIcon() {
    this.toolIcon?.destroy();

    this.toolIcon = this.createToolIcon(this.equippedTool, 0, 0, BRUSH_RADIUS * 2, { withBorder: false })
      .setVisible(false)
      .setDepth(1000);
  }

  openToolSelector() {
    if (this.toolSelectorObjects) {
      return;
    }

    const centerX = this.buildingX;
    const centerY = CANVAS_HEIGHT / 2;
    const totalWidth = TOOLS.length * TOOL_SELECTOR_ICON_SIZE + (TOOLS.length - 1) * TOOL_SELECTOR_GAP;
    const startX = centerX - totalWidth / 2 + TOOL_SELECTOR_ICON_SIZE / 2;

    const backdrop = this.add
      .rectangle(centerX, CANVAS_HEIGHT / 2, this.canvasWidth, CANVAS_HEIGHT, 0x000000, 0.6)
      .setInteractive()
      .setDepth(TOOL_SELECTOR_BACKDROP_DEPTH);

    backdrop.on("pointerdown", () => this.closeToolSelector());

    const panel = this.add
      .rectangle(
        centerX,
        centerY,
        totalWidth + TOOL_SELECTOR_PANEL_PADDING * 2,
        TOOL_SELECTOR_PANEL_HEIGHT,
        0x222222,
        0.95,
      )
      .setStrokeStyle(2, 0xffffff, 0.6)
      .setInteractive()
      .setDepth(TOOL_SELECTOR_PANEL_DEPTH);

    panel.on("pointerdown", () => {});

    this.toolSelectorObjects = [backdrop, panel];

    TOOLS.forEach((tool, index) => {
      const x = startX + index * (TOOL_SELECTOR_ICON_SIZE + TOOL_SELECTOR_GAP);
      const y = centerY - 20;

      const icon = this.createToolIcon(tool, x, y, TOOL_SELECTOR_ICON_SIZE, {
        withBorder: tool.id === this.equippedTool.id,
      })
        .setInteractive({ useHandCursor: true })
        .setDepth(TOOL_SELECTOR_PANEL_DEPTH + 1);

      icon.on("pointerdown", () => this.selectTool(tool));

      const label = this.add
        .text(x, y + TOOL_SELECTOR_ICON_SIZE / 2 + 10, tool.name, { fontSize: "12px", color: "#ffffff", align: "center" })
        .setOrigin(0.5, 0)
        .setDepth(TOOL_SELECTOR_PANEL_DEPTH + 1);

      this.toolSelectorObjects.push(icon, label);
    });
  }

  closeToolSelector() {
    this.toolSelectorObjects?.forEach((object) => object.destroy());
    this.toolSelectorObjects = null;
  }

  selectTool(tool) {
    this.equippedTool = tool;
    this.refreshToolbeltDisplay();
    this.refreshDraggingToolIcon();
    this.closeToolSelector();
  }

  setupSwipeInput() {
    this.input.on("pointerdown", () => this.sweepSmoother.reset());
    this.input.on("pointermove", (pointer) => this.handlePointerMove(pointer));
    this.input.on("pointerup", () => {
      this.toolIcon.setVisible(false);
      this.activeObstruction?.screws.forEach((screw) => screw.progress.release());
    });
  }

  handlePointerMove(pointer) {
    if (this.isTransitioning || !pointer.isDown) {
      this.toolIcon.setVisible(false);
      return;
    }

    if (this.activeObstruction) {
      this.toolIcon.setVisible(true);
      this.toolIcon.setPosition(pointer.x, pointer.y);
      this.handleObstructionPointerMove(pointer);
      return;
    }

    const insideWindow = this.isInsideWindow(pointer);
    this.toolIcon.setVisible(insideWindow);
    this.toolIcon.setPosition(pointer.x, pointer.y);

    if (!insideWindow) {
      return;
    }

    if (this.equippedTool.rotatesWithSweep) {
      this.rotateToolTowardSweep(pointer);
    }

    const from = this.toWindowLocal(pointer.prevPosition.x, pointer.prevPosition.y);
    const to = this.toWindowLocal(pointer.x, pointer.y);

    this.eraseAlongPath(from, to);
    this.updateRevealProgress();
  }

  handleObstructionPointerMove(pointer) {
    if (this.equippedTool.id !== "screwdriver") {
      return;
    }

    for (const screw of this.activeObstruction.screws) {
      if (screw.done) {
        continue;
      }

      const screwWorldX = this.windowCenterX + screw.image.x;
      const screwWorldY = WINDOW_Y + screw.image.y;
      const distance = Phaser.Math.Distance.Between(pointer.x, pointer.y, screwWorldX, screwWorldY);

      if (distance > SCREW_HIT_RADIUS) {
        screw.progress.release();
        continue;
      }

      const angle = Math.atan2(pointer.y - screwWorldY, pointer.x - screwWorldX);

      screw.progress.trackAngle(angle);
      this.updateScrewVisuals(screw);

      if (screw.progress.isComplete()) {
        this.completeScrew(screw);
      }
    }
  }

  updateScrewVisuals(screw) {
    const fraction = screw.progress.progressFraction();

    screw.image.rotation = -screw.progress.rotationProgress;

    screw.progressGraphics.clear();
    screw.progressGraphics.lineStyle(SCREW_PROGRESS_STROKE, SCREW_PROGRESS_COLOR, 1);
    screw.progressGraphics.beginPath();
    screw.progressGraphics.arc(0, 0, SCREW_PROGRESS_RADIUS, -Math.PI / 2, -Math.PI / 2 - fraction * Math.PI * 2, true);
    screw.progressGraphics.strokePath();
  }

  completeScrew(screw) {
    const obstruction = this.activeObstruction;

    screw.done = true;
    screw.progressGraphics.setVisible(false);
    this.animateScrewFall(screw);

    const remainingScrew = obstruction.screws.find((candidate) => !candidate.done);

    if (remainingScrew) {
      this.pivotBoardPlank(obstruction.boardPlank, remainingScrew);
      this.animateBoardHinge(obstruction.boardPlank);
    } else {
      this.animateBoardFall(obstruction);
    }
  }

  animateScrewFall(screw) {
    this.tweens.add({
      targets: screw.image,
      y: screw.image.y + SCREW_FALL_DISTANCE,
      alpha: 0,
      duration: SCREW_FALL_DURATION,
      ease: "Cubic.easeIn",
      onComplete: () => screw.image.setVisible(false),
    });
  }

  pivotBoardPlank(boardPlank, remainingScrew) {
    const dx = remainingScrew.image.x - boardPlank.x;
    const dy = remainingScrew.image.y - boardPlank.y;

    boardPlank.x = remainingScrew.image.x;
    boardPlank.y = remainingScrew.image.y;

    boardPlank.list.forEach((child) => {
      child.x -= dx;
      child.y -= dy;
    });
  }

  animateBoardHinge(boardPlank) {
    this.tweens.add({
      targets: boardPlank,
      rotation: BOARD_HINGE_ROTATION,
      duration: BOARD_HINGE_DURATION,
      ease: "Back.easeOut",
    });
  }

  animateBoardFall(obstruction) {
    this.tweens.killTweensOf(obstruction.boardPlank);

    this.tweens.add({
      targets: obstruction.boardPlank,
      y: obstruction.boardPlank.y + BOARD_FALL_DISTANCE,
      rotation: obstruction.boardPlank.rotation + BOARD_HINGE_ROTATION,
      duration: BOARD_FALL_DURATION,
      ease: "Cubic.easeIn",
      onComplete: () => {
        obstruction.boardPlank.destroy();
        obstruction.cleared = true;
        this.activeObstruction = null;
      },
    });
  }

  rotateToolTowardSweep(pointer) {
    this.sweepSmoother.addSample({
      dx: pointer.x - pointer.prevPosition.x,
      dy: pointer.y - pointer.prevPosition.y,
      time: pointer.time,
    });

    const rotation = computeSweepRotation(this.sweepSmoother.averageDelta());

    if (rotation !== null) {
      this.toolIcon.rotation = rotation;
    }
  }

  isInsideWindow(pointer) {
    return (
      Math.abs(pointer.x - this.windowCenterX) <= WINDOW_WIDTH / 2 && Math.abs(pointer.y - WINDOW_Y) <= WINDOW_HEIGHT / 2
    );
  }

  toWindowLocal(x, y) {
    return {
      x: Phaser.Math.Clamp(x - this.windowLeft, 0, WINDOW_WIDTH),
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

    if (!this.floorComplete && this.revealTracker.isFullyRevealed(REVEAL_THRESHOLD) && !this.activeObstruction) {
      this.floorComplete = true;
      this.fadeOutRemainingDirt();
    }
  }

  fadeOutRemainingDirt() {
    this.tweens.add({
      targets: this.dirtMask,
      alpha: 0,
      duration: DIRT_FADE_DURATION,
      onComplete: () => this.advanceFloor(),
    });
  }

  advanceFloor() {
    this.currentFloor += 1;

    if (this.currentFloor > this.house.floors) {
      this.showLevelComplete();
      return;
    }
    this.animateLiftBounce();
    this.animateBucketSwing();

    this.floorText.setText(formatFloorLabel(this.currentFloor, this.house.floors));
    this.playFloorTransition();
  }

  playFloorTransition() {
    this.isTransitioning = true;

    const nextSegment = this.segments.find((segment) => segment.floor === this.currentFloor);
    this.activateSegment(nextSegment);
    this.ensureFloorSpawned(this.currentFloor + 1);

    if (this.currentFloor + 1 > CLOUD_FIRST_FLOOR && this.clouds.length === 0) {
      this.spawnClouds();
    }

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

  ensureFloorSpawned(floor) {
    const alreadySpawned = this.segments.some((segment) => segment.floor === floor);

    if (floor <= this.house.floors && !alreadySpawned) {
      this.spawnFloorSegment(floor);
    }
  }

  showLevelComplete() {
    this.add.rectangle(this.buildingX, CANVAS_HEIGHT / 2, this.canvasWidth, CANVAS_HEIGHT, 0x000000, 0.7).setDepth(100);
    this.add
      .text(this.buildingX, 580, "Level Complete", { fontSize: "40px", color: "#ffffff" })
      .setOrigin(0.5).setDepth(101);

    const menuButton = this.add
      .rectangle(this.buildingX, 660, 200, 60, 0x4caf50)
      .setInteractive({ useHandCursor: true }).setDepth(101);
    this.add.text(this.buildingX, 660, "Menu", { fontSize: "24px", color: "#ffffff" }).setOrigin(0.5).setDepth(101);

    menuButton.on("pointerdown", () => this.scene.start("MainMenuScene"));
  }
}
