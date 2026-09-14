import { HOUSES } from "../config/houses.js";
import { DIRT_TYPES } from "../config/dirtTypes.js";
import { TOOLS } from "../config/tools.js";
import { LIFTS } from "../config/lifts.js";
import { RevealTracker } from "../interactions/RevealTracker.js";
import { DirtSpot } from "../entities/DirtSpot.js";
import { HoldProgress } from "../interactions/HoldProgress.js";
import { BUBBLES } from "../config/bubbles.js";
import { segmentWorldY, hasScrolledOutOfView } from "../utils/worldScroll.js";
import { createCloudSpec } from "../utils/cloudSpec.js";
import { scatterPositions } from "../utils/scatterPositions.js";
import { computeSweepRotation } from "../utils/sweepRotation.js";
import { SweepSmoother } from "../interactions/SweepSmoother.js";
import { ScrewProgress } from "../interactions/ScrewProgress.js";
import { computeTiltedBoardWidth } from "../utils/boardTilt.js";
import { CLOUDS, CLOUD_FIRST_FLOOR } from "../config/clouds.js";
import { SPRAY_PATTERNS } from "../config/sprayPatterns.js";
import { computeSprayStage } from "../utils/computeSprayStage.js";
import { computeStickerStage } from "../utils/computeStickerStage.js";
import { formatFloorLabel } from "../ui/HUD.js";

const CANVAS_HEIGHT = 1560;

// How far in the camera is zoomed on the level — tweak this value to test
// framing, no other change needed.
const LEVEL_ZOOM = 1.15;

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
const BOARD_MIN_ANGLE_DEGREES = -15;
const BOARD_MAX_ANGLE_DEGREES = 15;
const BOARD_HINGE_ROTATION = 1.3;
const BOARD_HINGE_DURATION = 400;
const BOARD_FALL_DURATION = 500;
const BOARD_FALL_DISTANCE = CANVAS_HEIGHT;

const SCREW_DISPLAY_SIZE = 70;
const SCREW_HIT_RADIUS = 170;
const SCREW_PROGRESS_RADIUS = 50;
const SCREW_PROGRESS_STROKE = 6;
const SCREW_PROGRESS_COLOR = 0x4caf50;
const UNSCREW_TARGET_ROTATION = Math.PI * 4;
const SCREW_FALL_DISTANCE = 150;
const SCREW_FALL_DURATION = 350;

const TAPE_EDGE_WIDTH = 30;
const TAPE_OVERHANG = 80;
const TAPE_EDGE_NATIVE_WIDTH = 40;
const TAPE_EDGE_NATIVE_HEIGHT = 70;
const TAPE_FALL_DURATION = 500;
const TAPE_FALL_DISTANCE = CANVAS_HEIGHT;
const TAPE_MIN_PIECE_WIDTH = 20;

const TAPE_FLING_UP_DISTANCE = 50;
const TAPE_FLING_APART_DISTANCE = 40;
const TAPE_FLING_DURATION = 180;
const TAPE_FLING_ROTATION_MIN = 0.3;
const TAPE_FLING_ROTATION_MAX = 0.6;

const TAPE_FALL_APART_DISTANCE = 80;
const TAPE_FALL_ROTATION_MIN = 1.5 * Math.PI;
const TAPE_FALL_ROTATION_MAX = 2.5 * Math.PI;

const TOOL_ROW_ICON_SIZE = 128;
const TOOL_ROW_GLYPH_SIZE = 96;
const TOOL_ROW_GAP = 24;
const TOOL_ROW_Y = CANVAS_HEIGHT - 130;
const TOOL_ROW_LABEL_OFFSET_Y = TOOL_ROW_ICON_SIZE / 2 + 10;
const TOOL_ROW_BG_COLOR = 0x1a1a1a;
const TOOL_ROW_BG_ALPHA = 0.85;
const TOOL_ROW_OUTLINE_COLOR = 0xffffff;
const TOOL_ROW_OUTLINE_ALPHA = 0.5;
const TOOL_ROW_OUTLINE_WIDTH = 3;
const TOOL_ROW_SELECTED_OUTLINE_COLOR = 0x4caf50;
const TOOL_ROW_SELECTED_OUTLINE_WIDTH = 5;

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
// Bigger than a typical fingertip so it stays visible even centered exactly
// under the touch point, rather than rendering offset from it.
const DRAGGING_TOOL_ICON_SIZE = 160;

const SPRAY_STAGE_DURATION = 200;
const SPRAY_MAX_STAGE = 8;
const SPRAY_SPOT_RADIUS = 85;
const SPRAY_DECAL_DISPLAY_SIZE = 170;

const SPRAY_BOTTLE_EFFECT_WIDTH = 90;
const SPRAY_BOTTLE_NATIVE_ASPECT = 330 / 220;
const SPRAY_BOTTLE_EFFECT_RADIUS = 160;
const SPRAY_BOTTLE_EFFECT_DURATION = 360;
// The bottle art's own nozzle points up-and-right at roughly this angle when
// unrotated — used to aim the effect in at the spray target instead of away
// from it.
const SPRAY_BOTTLE_NOZZLE_ANGLE_DEGREES = -56;

const DIRT_SPOT_MARGIN = 80;
const DIRT_SPOT_MIN_SPACING = 160;
const DIRT_SPOT_DISPLAY_SIZE = 140;
const DIRT_SPOT_HIT_RADIUS = 60;
const DIRT_SPOT_SNAP_RADIUS = 90;

const POOP_BUBBLE_INTERVAL = 100;
const SPONGE_VIGOR_SCALE = 1.15;
const SPONGE_VIGOR_DURATION = 80;
// Radius equals the dragging tool icon's own diameter, so the ring's
// diameter ends up exactly double the sponge icon's.
const POOP_PROGRESS_RADIUS = DRAGGING_TOOL_ICON_SIZE;
const POOP_PROGRESS_STROKE = 6;
const POOP_PROGRESS_COLOR = 0x4caf50;
const BUBBLE_SPAWN_COUNT_PER_TICK = 3;
const BUBBLE_RISE_DISTANCE = 80;
const BUBBLE_FADE_DURATION = 700;
const BUBBLE_JITTER = 45;

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
    this.sprayHoldTimer = null;
    this.activeSprayDecal = null;
    this.activePoopSpot = null;
    this.poopBubbleElapsed = 0;
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

    // The level zoom must not also zoom the HUD (buttons/labels near the
    // canvas edges would be pushed out of view) — everything gameplay-
    // related is parented under worldContainer, which only the zoomed main
    // camera renders; HUD goes under hudContainer, rendered only by a plain
    // unzoomed uiCamera layered on top. Ignoring a container hides its
    // children too, and covers anything added to it later.
    this.worldContainer = this.add.container(0, 0);
    this.hudContainer = this.add.container(0, 0);
    this.cameras.main.setZoom(LEVEL_ZOOM);
    this.cameras.main.ignore(this.hudContainer);
    this.uiCamera = this.cameras.add(0, 0, this.canvasWidth, CANVAS_HEIGHT);
    this.uiCamera.ignore(this.worldContainer);

    this.buildSkyBackground();
    this.buildBuildingWall();
    this.buildHud();
    this.refreshToolRow();
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
    this.updatePoopHold(delta);
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
      this.worldContainer.add(image);

      this.clouds.push({
        image,
        driftSpeed: spec.driftSpeed,
        parallax: spec.parallax,
        worldY: screenY - this.scroll.offset * spec.parallax,
      });
    }

    this.worldContainer.sort("depth");
  }

  findEquippedTool() {
    const firstDirtType = DIRT_TYPES[this.house.dirtTypeIds[0]];

    return TOOLS.find((tool) => tool.id === firstDirtType.toolId);
  }

  buildSkyBackground() {
    const sky = this.add
      .rectangle(this.buildingX, CANVAS_HEIGHT / 2, this.canvasWidth, CANVAS_HEIGHT, SKY_COLOR)
      .setDepth(SKY_DEPTH);

    this.skyline = this.add
      .image(this.buildingX, 0, this.house.skylineTextureKey)
      .setOrigin(0.5, 0)
      .setDepth(SKYLINE_DEPTH);
    this.skylineBaseY = -this.skylineParallaxTravel();
    this.skyline.setDisplaySize(this.canvasWidth, CANVAS_HEIGHT + this.skylineParallaxTravel());
    this.skyline.y = this.skylineBaseY;

    this.worldContainer.add([sky, this.skyline]);
  }

  skylineParallaxTravel() {
    return (this.house.floors - 1) * SEGMENT_SPACING * SKYLINE_PARALLAX;
  }

  buildBuildingWall() {
    this.wall = this.add.tileSprite(this.buildingX, CANVAS_HEIGHT / 2, WALL_WIDTH, CANVAS_HEIGHT, this.house.wallTextureKey);
    this.worldContainer.add(this.wall);
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

    const pauseButton = this.add.rectangle(40, 40, 40, 40, 0x333333).setStrokeStyle(2, 0xffffff, 0.6).setDepth(HUD_DEPTH);
    const pauseLabel = this.add
      .text(40, 40, "II", { fontSize: "18px", color: "#ffffff" })
      .setOrigin(0.5)
      .setDepth(HUD_DEPTH);

    this.hudContainer.add([this.floorText, this.progressBarGraphics, pauseButton, pauseLabel]);
  }

  // Every tool is shown at once in a permanent row (outside the window's
  // bounds) instead of behind a bucket tap — see createToolRowIcon for the
  // square-backing + selection-outline treatment.
  refreshToolRow() {
    this.toolRowObjects?.forEach((object) => object.destroy());

    const totalWidth = TOOLS.length * TOOL_ROW_ICON_SIZE + (TOOLS.length - 1) * TOOL_ROW_GAP;
    const startX = this.buildingX - totalWidth / 2 + TOOL_ROW_ICON_SIZE / 2;

    this.toolRowObjects = TOOLS.flatMap((tool, index) =>
      this.createToolRowIcon(tool, startX + index * (TOOL_ROW_ICON_SIZE + TOOL_ROW_GAP), TOOL_ROW_Y),
    );
  }

  createToolRowIcon(tool, x, y) {
    const selected = tool.id === this.equippedTool.id;
    const outlineColor = selected ? TOOL_ROW_SELECTED_OUTLINE_COLOR : TOOL_ROW_OUTLINE_COLOR;
    const outlineWidth = selected ? TOOL_ROW_SELECTED_OUTLINE_WIDTH : TOOL_ROW_OUTLINE_WIDTH;

    const background = this.add
      .rectangle(x, y, TOOL_ROW_ICON_SIZE, TOOL_ROW_ICON_SIZE, TOOL_ROW_BG_COLOR, TOOL_ROW_BG_ALPHA)
      .setStrokeStyle(outlineWidth, outlineColor, selected ? 1 : TOOL_ROW_OUTLINE_ALPHA)
      .setInteractive({ useHandCursor: true })
      .setDepth(HUD_DEPTH);

    background.on("pointerdown", () => this.selectTool(tool));

    const glyph = this.createToolIcon(tool, x, y, TOOL_ROW_GLYPH_SIZE).setDepth(HUD_DEPTH + 1);

    const label = this.add
      .text(x, y + TOOL_ROW_LABEL_OFFSET_Y, tool.name, { fontSize: "12px", color: "#ffffff", align: "center" })
      .setOrigin(0.5, 0)
      .setDepth(HUD_DEPTH);

    this.hudContainer.add([background, glyph, label]);

    return [background, glyph, label];
  }

  createToolIcon(tool, x, y, size) {
    if (tool.iconTextureKey) {
      return this.add.image(x, y, tool.iconTextureKey).setDisplaySize(size, size);
    }

    return this.add.rectangle(x, y, size, size, tool.color);
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

    const label = this.add.text(40, 100, "Skip", { fontSize: "14px", color: "#ffffff" }).setOrigin(0.5).setDepth(HUD_DEPTH);

    button.on("pointerdown", () => this.debugSkipFloor());

    this.hudContainer.add([button, label]);
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
    this.worldContainer.add(this.liftContainer);
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

    // Decorative only — tools live in the permanent tool row now, not behind
    // a tap on the bucket.
    this.bucketImage = this.add
      .image(anchorX, anchorY, "lift-bucket")
      .setDisplaySize(BUCKET_DISPLAY_WIDTH, bucketDisplayHeight)
      .setOrigin(0.5, BUCKET_ORIGIN_Y);

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
    this.worldContainer.add(container);

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

    const dirtSpots = this.buildDirtSpots(container);

    const obstruction =
      Phaser.Math.Between(0, 1) === 0
        ? this.buildBoardObstruction(container)
        : this.buildPoliceTapeObstruction(container);

    const segment = { container, dirtMask, worldY, floor, obstruction, sprayDecals: [], dirtSpots };
    this.segments.push(segment);

    // Container doesn't auto-sort its children by depth like the Scene's
    // own display list does — it renders in insertion order, so each new
    // segment needs a re-sort to stay correctly behind the lift (see
    // LIFT_DEPTH) instead of just stacking on top by arrival order.
    this.worldContainer.sort("depth");

    return segment;
  }

  activateSegment(segment) {
    this.dirtMask = segment.dirtMask;
    this.revealTracker = new RevealTracker({ width: WINDOW_WIDTH, height: WINDOW_HEIGHT, cellSize: REVEAL_CELL_SIZE });
    this.floorComplete = false;
    this.activeObstruction = segment.obstruction;
    this.activeContainer = segment.container;
    this.sprayDecals = segment.sprayDecals;
    this.dirtSpots = segment.dirtSpots;
    this.stopSprayHold();
    this.stopPoopHold();

    this.drawProgressBar(0);
  }

  buildDirtSpots(container) {
    const spotTypes = this.house.dirtTypeIds
      .map((id) => DIRT_TYPES[id])
      .filter((dirtType) => dirtType.textureKey || dirtType.stages);

    const positions = scatterPositions({
      count: spotTypes.length,
      width: WINDOW_WIDTH - DIRT_SPOT_MARGIN * 2,
      height: WINDOW_HEIGHT - DIRT_SPOT_MARGIN * 2,
      minSpacing: DIRT_SPOT_MIN_SPACING,
    });

    return spotTypes.map((dirtType, index) => {
      const x = positions[index].x + WINDOW_WIDTH / 2;
      const y = positions[index].y + WINDOW_HEIGHT / 2;
      const { x: containerX, y: containerY } = this.toContainerLocal(x, y);

      const initialTextureKey = dirtType.textureKey ?? dirtType.stages[0].textureKey;
      const image = this.add
        .image(containerX, containerY, initialTextureKey)
        .setDisplaySize(DIRT_SPOT_DISPLAY_SIZE, DIRT_SPOT_DISPLAY_SIZE);
      container.add(image);

      const progressGraphics =
        dirtType.interactionType === "hold"
          ? this.add.graphics().setPosition(containerX, containerY).setVisible(false)
          : null;

      if (progressGraphics) {
        container.add(progressGraphics);
      }

      return {
        type: dirtType.id,
        x,
        y,
        cleared: false,
        image,
        progressGraphics,
        progress: this.createDirtSpotProgress(dirtType),
      };
    });
  }

  createDirtSpotProgress(dirtType) {
    if (dirtType.interactionType === "hold") {
      const [minMs, maxMs] = dirtType.holdDurationRange;

      return new HoldProgress({ targetDurationMs: Phaser.Math.Between(minMs, maxMs) });
    }

    return new DirtSpot({ hitsToClean: dirtType.hitsToClean });
  }

  buildBoardObstruction(container) {
    // Uniform scale on every axis — a non-uniform stretch fattens anything
    // drawn as a horizontal line in the source art, since a horizontal
    // line's thickness is a vertical measurement.
    const rowScale = BOARD_EDGE_WIDTH / BOARD_EDGE_NATIVE_WIDTH;
    const rowHeight = BOARD_EDGE_NATIVE_HEIGHT * rowScale;
    const boardWidth = WINDOW_WIDTH + BOARD_OVERHANG * 2;

    // Flat (unrotated) edge positions — these are where the board's ends
    // must still land horizontally after tilting, and what the screws
    // (siblings of boardPlank, so not rotated with it) anchor to.
    const flatEdgeLeftX = -boardWidth / 2 + BOARD_EDGE_WIDTH / 2;
    const flatEdgeRightX = boardWidth / 2 - BOARD_EDGE_WIDTH / 2;

    const angle = Phaser.Math.FloatBetween(
      Phaser.Math.DegToRad(BOARD_MIN_ANGLE_DEGREES),
      Phaser.Math.DegToRad(BOARD_MAX_ANGLE_DEGREES),
    );

    // The pieces themselves (local to boardPlank, which gets rotated as a
    // whole) need to be longer than boardWidth by exactly enough that,
    // once rotated, their horizontal reach still lands on boardWidth.
    const tiltedBoardWidth = computeTiltedBoardWidth({ boardWidth, angle });
    const middleWidth = tiltedBoardWidth - BOARD_EDGE_WIDTH * 2;
    const edgeLeftX = -tiltedBoardWidth / 2 + BOARD_EDGE_WIDTH / 2;
    const edgeRightX = tiltedBoardWidth / 2 - BOARD_EDGE_WIDTH / 2;

    const leftEdge = this.add.image(edgeLeftX, 0, "board-edge").setDisplaySize(BOARD_EDGE_WIDTH, rowHeight);
    const middle = this.add
      .tileSprite(0, 0, middleWidth, rowHeight, "board-middle")
      .setTileScale(rowScale, rowScale);
    const rightEdge = this.add
      .image(edgeRightX, 0, "board-edge")
      .setDisplaySize(BOARD_EDGE_WIDTH, rowHeight)
      .setFlipX(true);

    const boardPlank = this.add.container(0, 0, [leftEdge, middle, rightEdge]).setRotation(angle);
    container.add(boardPlank);

    const screws = [
      this.buildScrew(
        container,
        flatEdgeLeftX + BOARD_SCREW_NATIVE_OFFSET_X,
        flatEdgeLeftX * Math.tan(angle),
      ),
      this.buildScrew(
        container,
        flatEdgeRightX - BOARD_SCREW_NATIVE_OFFSET_X,
        flatEdgeRightX * Math.tan(angle),
      ),
    ];

    return { type: "board", boardPlank, screws, cleared: false };
  }

  buildScrew(container, x, y) {
    const image = this.add.image(x, y, "screw-front").setDisplaySize(SCREW_DISPLAY_SIZE, SCREW_DISPLAY_SIZE);
    const progressGraphics = this.add.graphics().setPosition(x, y);

    container.add([image, progressGraphics]);

    return {
      image,
      progressGraphics,
      progress: new ScrewProgress({ targetRotation: UNSCREW_TARGET_ROTATION }),
      done: false,
    };
  }

  buildPoliceTapeObstruction(container) {
    const rowScale = TAPE_EDGE_WIDTH / TAPE_EDGE_NATIVE_WIDTH;
    const rowHeight = TAPE_EDGE_NATIVE_HEIGHT * rowScale;
    const tapeWidth = WINDOW_WIDTH + TAPE_OVERHANG * 2;
    const middleWidth = tapeWidth - TAPE_EDGE_WIDTH * 2;
    const edgeLeftX = -tapeWidth / 2 + TAPE_EDGE_WIDTH / 2;
    const edgeRightX = tapeWidth / 2 - TAPE_EDGE_WIDTH / 2;

    const leftEdge = this.add.image(edgeLeftX, 0, "police-tape-edge").setDisplaySize(TAPE_EDGE_WIDTH, rowHeight);
    const middle = this.add
      .tileSprite(0, 0, middleWidth, rowHeight, "police-tape-middle")
      .setTileScale(rowScale, rowScale);
    const rightEdge = this.add
      .image(edgeRightX, 0, "police-tape-edge")
      .setDisplaySize(TAPE_EDGE_WIDTH, rowHeight)
      .setFlipX(true);

    const tapeContainer = this.add.container(0, 0, [leftEdge, middle, rightEdge]);
    container.add(tapeContainer);

    return {
      type: "police-tape",
      tapeContainer,
      tapeWidth,
      middleWidth,
      rowScale,
      rowHeight,
      edgeLeftX,
      edgeRightX,
      cutting: false,
      cleared: false,
      hasBeenAbove: false,
      hasBeenBelow: false,
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
    this.worldContainer.add(this.eraserBrush);
  }

  refreshDraggingToolIcon() {
    this.toolIcon?.destroy();

    this.toolIcon = this.createToolIcon(this.equippedTool, 0, 0, DRAGGING_TOOL_ICON_SIZE)
      .setVisible(false)
      .setDepth(1000);
    this.worldContainer.add(this.toolIcon);
    this.worldContainer.sort("depth");
    this.toolIconRestingScale = this.toolIcon.scaleX;
  }

  selectTool(tool) {
    this.equippedTool = tool;
    this.refreshToolRow();
    this.refreshDraggingToolIcon();
  }

  setupSwipeInput() {
    this.input.on("pointerdown", (pointer) => this.handlePointerDown(pointer));
    this.input.on("pointermove", (pointer) => this.handlePointerMove(pointer));
    this.input.on("pointerup", () => {
      this.toolIcon.setVisible(false);
      this.activeObstruction?.screws?.forEach((screw) => screw.progress.release());
      this.stopSprayHold();
      this.stopPoopHold();
    });
  }

  handlePointerDown(pointer) {
    this.sweepSmoother.reset();

    if (this.activeObstruction?.type === "police-tape") {
      this.activeObstruction.hasBeenAbove = false;
      this.activeObstruction.hasBeenBelow = false;
    }

    if (this.equippedTool.id === "spray-bottle") {
      this.startSprayHold(pointer);
    }

    if (this.equippedTool.id === "sponge") {
      this.startPoopHold(pointer);
    }

    this.updateToolIcon(pointer);
  }

  canInteractWithWindow(pointer) {
    return !this.isTransitioning && !this.activeObstruction && this.isInsideWindow(pointer);
  }

  startSprayHold(pointer) {
    if (!this.canInteractWithWindow(pointer)) {
      return;
    }

    const local = this.toWindowLocal(pointer.worldX, pointer.worldY);
    const target = this.findSprayTargetPosition(local.x, local.y);

    this.attachSprayDecal(this.findOrCreateSprayDecal(target.x, target.y));
    this.sprayHoldTimer = this.time.addEvent({
      delay: SPRAY_STAGE_DURATION,
      loop: true,
      callback: () => this.tickSprayHold(),
    });
  }

  tickSprayHold() {
    const pointer = this.input.activePointer;

    if (!pointer.isDown || this.equippedTool.id !== "spray-bottle" || !this.canInteractWithWindow(pointer)) {
      this.stopSprayHold();
      return;
    }

    const local = this.toWindowLocal(pointer.worldX, pointer.worldY);
    const target = this.findSprayTargetPosition(local.x, local.y);
    const nearestDecal = this.findOrCreateSprayDecal(target.x, target.y);

    if (nearestDecal !== this.activeSprayDecal) {
      this.attachSprayDecal(nearestDecal);
    }

    const elapsedMs = this.time.now - this.sprayHoldStartTime;
    const stage = computeSprayStage({ elapsedMs, stageDurationMs: SPRAY_STAGE_DURATION, maxStage: SPRAY_MAX_STAGE });

    this.setSprayDecalStage(this.activeSprayDecal, stage);
  }

  // Spraying near an uncleared dirt spot snaps to its exact center instead of
  // wherever the pointer happens to be — otherwise a spray decal can visibly
  // overlap the spot's (much larger) sprite while still failing the strict
  // center-to-center distance check sprayStageAt() uses, so it never actually
  // counts as sprayed.
  findSprayTargetPosition(x, y) {
    const nearbySpot = this.dirtSpots.find(
      (spot) => !spot.cleared && Phaser.Math.Distance.Between(x, y, spot.x, spot.y) <= DIRT_SPOT_SNAP_RADIUS,
    );

    return nearbySpot ? { x: nearbySpot.x, y: nearbySpot.y } : { x, y };
  }

  // Attaching to a decal that already has some stage resumes the hold clock
  // from that stage's own elapsed time instead of restarting at 0 — without
  // this, re-finding an existing decal (trivial right at its own edge, since
  // detecting "drifted away" and "found a nearby decal to reuse" share the
  // same radius) would make setSprayDecalStage briefly compute a lower stage
  // than the decal already reached, visibly destroying and rebuilding it.
  attachSprayDecal(decal) {
    this.activeSprayDecal = decal;
    this.sprayHoldStartTime = this.time.now - decal.stage * SPRAY_STAGE_DURATION;
  }

  stopSprayHold() {
    this.sprayHoldTimer?.remove();
    this.sprayHoldTimer = null;
    this.activeSprayDecal = null;
  }

  findOrCreateSprayDecal(x, y) {
    const existing = this.sprayDecals.find(
      (decal) => Phaser.Math.Distance.Between(x, y, decal.x, decal.y) <= SPRAY_SPOT_RADIUS,
    );

    if (existing) {
      return existing;
    }

    const decal = { x, y, stage: 0, layerImages: [] };
    this.sprayDecals.push(decal);

    return decal;
  }

  setSprayDecalStage(decal, stage) {
    if (stage <= decal.stage) {
      return;
    }

    for (let layer = decal.stage + 1; layer <= stage; layer++) {
      this.addSprayLayer(decal, layer);
    }

    decal.stage = stage;
  }

  // Each layer is kept, not swapped — the build-up assets are designed to
  // stack on the same spot (see their own doc comments), each layer getting
  // its own random rotation so the accumulated residue reads as organic
  // rather than identical rings stamped on top of each other.
  addSprayLayer(decal, layer) {
    const { x: containerX, y: containerY } = this.toContainerLocal(decal.x, decal.y);
    const sprayLayer = SPRAY_PATTERNS.find((pattern) => pattern.stage === layer);

    const image = this.add
      .image(containerX, containerY, sprayLayer.textureKey)
      .setDisplaySize(SPRAY_DECAL_DISPLAY_SIZE, SPRAY_DECAL_DISPLAY_SIZE)
      .setRotation(Phaser.Math.FloatBetween(0, Math.PI * 2));

    this.activeContainer.add(image);
    decal.layerImages.push(image);

    this.spawnSprayBottleEffect(decal);
  }

  // The only visual cue that spraying is happening — the tool icon itself is
  // hidden for the spray bottle (see updateToolIcon) and the decal builds up
  // right under the thumb. A bottle image flashes in from a random angle
  // around the target, aimed inward, each time a new layer lands.
  spawnSprayBottleEffect(decal) {
    const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
    const { x: containerX, y: containerY } = this.toContainerLocal(
      decal.x + Math.cos(angle) * SPRAY_BOTTLE_EFFECT_RADIUS,
      decal.y + Math.sin(angle) * SPRAY_BOTTLE_EFFECT_RADIUS,
    );
    const nozzleAngle = Phaser.Math.DegToRad(SPRAY_BOTTLE_NOZZLE_ANGLE_DEGREES);

    const bottle = this.add
      .image(containerX, containerY, "spray-bottle")
      .setDisplaySize(SPRAY_BOTTLE_EFFECT_WIDTH, SPRAY_BOTTLE_EFFECT_WIDTH * SPRAY_BOTTLE_NATIVE_ASPECT)
      .setRotation(angle + Math.PI - nozzleAngle)
      .setAlpha(0);

    this.activeContainer.add(bottle);

    this.tweens.add({
      targets: bottle,
      alpha: { from: 0, to: 1 },
      duration: SPRAY_BOTTLE_EFFECT_DURATION / 2,
      ease: "Sine.easeInOut",
      yoyo: true,
      onComplete: () => bottle.destroy(),
    });
  }

  startPoopHold(pointer) {
    if (!this.canInteractWithWindow(pointer)) {
      return;
    }

    const local = this.toWindowLocal(pointer.worldX, pointer.worldY);
    const spot = this.findCleanablePoopSpotNear(local.x, local.y);

    if (!spot) {
      return;
    }

    this.activePoopSpot = spot;
    this.poopBubbleElapsed = 0;
    this.startSpongeVigorousAnimation();
    spot.progressGraphics.setVisible(true);
    this.updatePoopProgressVisuals(spot);
  }

  findCleanablePoopSpotNear(x, y) {
    const dirtType = DIRT_TYPES["bird-poop"];

    return this.dirtSpots.find(
      (spot) =>
        spot.type === "bird-poop" &&
        !spot.cleared &&
        Phaser.Math.Distance.Between(x, y, spot.x, spot.y) <= DIRT_SPOT_HIT_RADIUS &&
        this.sprayStageAt(spot.x, spot.y) >= dirtType.requiredSprayStage,
    );
  }

  updatePoopHold(delta) {
    if (!this.activePoopSpot) {
      return;
    }

    const pointer = this.input.activePointer;
    const local = this.toWindowLocal(pointer.worldX, pointer.worldY);
    const stillHoldingSpot =
      pointer.isDown &&
      this.equippedTool.id === "sponge" &&
      this.canInteractWithWindow(pointer) &&
      Phaser.Math.Distance.Between(local.x, local.y, this.activePoopSpot.x, this.activePoopSpot.y) <=
        DIRT_SPOT_HIT_RADIUS;

    if (!stillHoldingSpot) {
      this.stopPoopHold();
      return;
    }

    this.activePoopSpot.progress.trackTime(delta);
    this.updatePoopProgressVisuals(this.activePoopSpot);

    this.poopBubbleElapsed += delta;
    if (this.poopBubbleElapsed >= POOP_BUBBLE_INTERVAL) {
      this.poopBubbleElapsed -= POOP_BUBBLE_INTERVAL;
      this.spawnHoldBubbles(this.activePoopSpot);
    }

    if (this.activePoopSpot.progress.isComplete()) {
      this.clearDirtSpot(this.activePoopSpot);
      this.stopPoopHold();
    }
  }

  updatePoopProgressVisuals(spot) {
    const fraction = spot.progress.progressFraction();

    spot.progressGraphics.clear();
    spot.progressGraphics.lineStyle(POOP_PROGRESS_STROKE, POOP_PROGRESS_COLOR, 1);
    spot.progressGraphics.beginPath();
    spot.progressGraphics.arc(0, 0, POOP_PROGRESS_RADIUS, -Math.PI / 2, -Math.PI / 2 - fraction * Math.PI * 2, true);
    spot.progressGraphics.strokePath();
  }

  stopPoopHold() {
    this.activePoopSpot?.progressGraphics.setVisible(false);
    this.activePoopSpot?.progress.release();
    this.activePoopSpot = null;
    this.stopSpongeVigorousAnimation();
  }

  startSpongeVigorousAnimation() {
    this.spongeVigorTween = this.tweens.add({
      targets: this.toolIcon,
      scale: this.toolIconRestingScale * SPONGE_VIGOR_SCALE,
      duration: SPONGE_VIGOR_DURATION,
      yoyo: true,
      repeat: -1,
    });
  }

  stopSpongeVigorousAnimation() {
    this.spongeVigorTween?.stop();
    this.spongeVigorTween = null;
    this.toolIcon.setScale(this.toolIconRestingScale);
  }

  spawnHoldBubbles(spot) {
    for (let i = 0; i < BUBBLE_SPAWN_COUNT_PER_TICK; i++) {
      this.spawnHoldBubble(spot);
    }
  }

  spawnHoldBubble(spot) {
    const bubbleSpec = Phaser.Utils.Array.GetRandom(BUBBLES);
    const jitterX = Phaser.Math.Between(-BUBBLE_JITTER, BUBBLE_JITTER);
    const jitterY = Phaser.Math.Between(-BUBBLE_JITTER, BUBBLE_JITTER);
    const { x: containerX, y: containerY } = this.toContainerLocal(spot.x + jitterX, spot.y + jitterY);

    const bubble = this.add
      .image(containerX, containerY, bubbleSpec.textureKey)
      .setDisplaySize(bubbleSpec.displaySize, bubbleSpec.displaySize);
    this.activeContainer.add(bubble);

    this.tweens.add({
      targets: bubble,
      y: bubble.y - BUBBLE_RISE_DISTANCE,
      alpha: 0,
      duration: BUBBLE_FADE_DURATION,
      onComplete: () => bubble.destroy(),
    });
  }

  updateToolIcon(pointer) {
    if (this.isTransitioning || !pointer.isDown) {
      this.toolIcon.setVisible(false);
      return;
    }

    const showToolIcon = this.equippedTool.id !== "spray-bottle";
    const visible = this.activeObstruction ? showToolIcon : this.isInsideWindow(pointer) && showToolIcon;

    this.toolIcon.setVisible(visible);
    this.toolIcon.setPosition(pointer.worldX, pointer.worldY);
  }

  handlePointerMove(pointer) {
    this.updateToolIcon(pointer);

    if (this.isTransitioning || !pointer.isDown) {
      return;
    }

    if (this.activeObstruction) {
      this.handleObstructionPointerMove(pointer);
      return;
    }

    if (!this.isInsideWindow(pointer)) {
      return;
    }

    if (this.equippedTool.rotatesWithSweep) {
      this.rotateToolTowardSweep(pointer);
    }

    // Holding on a bird-poop spot is a dedicated interaction on its own —
    // any incidental cursor movement needed just to keep the tool icon
    // updated shouldn't also wipe the generic dust mask underneath it.
    if (this.equippedTool.canCleanWindow === false || this.activePoopSpot) {
      return;
    }

    // Phaser only caches worldX/worldY for the pointer's current position, not
    // its previous one, so the erase path's start point is converted by hand.
    const previousWorld = this.cameras.main.getWorldPoint(pointer.prevPosition.x, pointer.prevPosition.y);
    const from = this.toWindowLocal(previousWorld.x, previousWorld.y);
    const to = this.toWindowLocal(pointer.worldX, pointer.worldY);

    this.eraseAlongPath(from, to);
    this.updateRevealProgress();
  }

  handleObstructionPointerMove(pointer) {
    if (this.activeObstruction.type === "board") {
      this.handleBoardScrewdriverMove(pointer);
      return;
    }

    if (this.activeObstruction.type === "police-tape") {
      this.handleTapeSwipeMove(pointer);
    }
  }

  handleBoardScrewdriverMove(pointer) {
    if (this.equippedTool.id !== "screwdriver") {
      return;
    }

    let engagingScrew = false;

    for (const screw of this.activeObstruction.screws) {
      if (screw.done) {
        continue;
      }

      const screwWorldX = this.windowCenterX + screw.image.x;
      const screwWorldY = WINDOW_Y + screw.image.y;
      const distance = Phaser.Math.Distance.Between(pointer.worldX, pointer.worldY, screwWorldX, screwWorldY);

      if (distance > SCREW_HIT_RADIUS) {
        screw.progress.release();
        continue;
      }

      engagingScrew = true;
      const angle = Math.atan2(pointer.worldY - screwWorldY, pointer.worldX - screwWorldX);

      screw.progress.trackAngle(angle);
      this.updateScrewVisuals(screw);

      if (screw.progress.isComplete()) {
        this.completeScrew(screw);
      }
    }

    // Anchored on the screw itself while engaged instead of the free-
    // following cursor, so the thumb doesn't obscure which screw is turning.
    this.toolIcon.setVisible(!engagingScrew);
  }

  handleTapeSwipeMove(pointer) {
    const obstruction = this.activeObstruction;

    if (this.equippedTool.id !== "scissors" || obstruction.cutting) {
      return;
    }

    const localX = pointer.worldX - this.windowCenterX;
    const localY = pointer.worldY - WINDOW_Y;
    const tapeHalfHeight = obstruction.rowHeight / 2;

    if (Math.abs(localX) > obstruction.tapeWidth / 2) {
      return;
    }

    if (localY < -tapeHalfHeight) {
      obstruction.hasBeenAbove = true;
    } else if (localY > tapeHalfHeight) {
      obstruction.hasBeenBelow = true;
    }

    if (obstruction.hasBeenAbove && obstruction.hasBeenBelow) {
      obstruction.cutting = true;
      this.completeTapeCut(obstruction, localX);
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
      // Which way "swings down" depends on which side the pivot is on: the
      // free end sits at a positive local x if the left screw remains,
      // negative if the right one does, and the sign of the added rotation
      // has to match so the free end moves down (positive y) rather than up.
      obstruction.hingeDirection = remainingScrew === obstruction.screws[0] ? 1 : -1;

      this.pivotBoardPlank(obstruction.boardPlank, remainingScrew);
      this.animateBoardHinge(obstruction.boardPlank, obstruction.hingeDirection);
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

    // A rotated container's rendered position is origin + rotate(localCoord,
    // rotation), so compensating for an origin change means rotating the
    // offset by the container's own current rotation before subtracting it
    // — a plain dx/dy subtraction only holds when rotation is 0.
    const angle = boardPlank.rotation;
    const rotatedDx = dx * Math.cos(angle) + dy * Math.sin(angle);
    const rotatedDy = -dx * Math.sin(angle) + dy * Math.cos(angle);

    boardPlank.x = remainingScrew.image.x;
    boardPlank.y = remainingScrew.image.y;

    boardPlank.list.forEach((child) => {
      child.x -= rotatedDx;
      child.y -= rotatedDy;
    });
  }

  animateBoardHinge(boardPlank, hingeDirection) {
    this.tweens.add({
      targets: boardPlank,
      rotation: boardPlank.rotation + hingeDirection * BOARD_HINGE_ROTATION,
      duration: BOARD_HINGE_DURATION,
      ease: "Back.easeOut",
    });
  }

  animateBoardFall(obstruction) {
    this.tweens.killTweensOf(obstruction.boardPlank);

    this.tweens.add({
      targets: obstruction.boardPlank,
      y: obstruction.boardPlank.y + BOARD_FALL_DISTANCE,
      rotation: obstruction.boardPlank.rotation + obstruction.hingeDirection * BOARD_HINGE_ROTATION,
      duration: BOARD_FALL_DURATION,
      ease: "Cubic.easeIn",
      onComplete: () => {
        obstruction.boardPlank.destroy();
        obstruction.cleared = true;
        this.activeObstruction = null;
      },
    });
  }

  completeTapeCut(obstruction, cutX) {
    const clampedCutX = Phaser.Math.Clamp(
      cutX,
      -obstruction.middleWidth / 2 + TAPE_MIN_PIECE_WIDTH,
      obstruction.middleWidth / 2 - TAPE_MIN_PIECE_WIDTH,
    );

    const { leftHalf, rightHalf } = this.splitTapeAt(obstruction, clampedCutX);

    obstruction.leftHalf = leftHalf;
    obstruction.rightHalf = rightHalf;

    this.animateTapeHalfAway(obstruction, leftHalf, -1);
    this.animateTapeHalfAway(obstruction, rightHalf, 1);
  }

  splitTapeAt(obstruction, cutX) {
    const parent = obstruction.tapeContainer.parentContainer;
    const { rowScale, rowHeight, middleWidth, tapeWidth, edgeLeftX, edgeRightX } = obstruction;

    const leftMiddleWidth = cutX + middleWidth / 2;
    const leftMiddleCenterX = (-middleWidth / 2 + cutX) / 2;
    const rightMiddleWidth = middleWidth / 2 - cutX;
    const rightMiddleCenterX = (cutX + middleWidth / 2) / 2;

    const leftEdge = this.add.image(edgeLeftX, 0, "police-tape-edge").setDisplaySize(TAPE_EDGE_WIDTH, rowHeight);
    const leftMiddle = this.add
      .tileSprite(leftMiddleCenterX, 0, leftMiddleWidth, rowHeight, "police-tape-middle")
      .setTileScale(rowScale, rowScale);
    const rightMiddle = this.add
      .tileSprite(rightMiddleCenterX, 0, rightMiddleWidth, rowHeight, "police-tape-middle")
      .setTileScale(rowScale, rowScale);
    const rightEdge = this.add
      .image(edgeRightX, 0, "police-tape-edge")
      .setDisplaySize(TAPE_EDGE_WIDTH, rowHeight)
      .setFlipX(true);

    // Recenter each half's children on its own visual midpoint so rotating
    // the container (for the fling) spins around the piece's own center
    // instead of the window's center — the same offset-compensation trick
    // pivotBoardPlank uses for the board's hinge.
    const leftHalf = this.add.container(0, 0, [leftEdge, leftMiddle]);
    const leftHalfCenterX = (-tapeWidth / 2 + cutX) / 2;
    leftHalf.list.forEach((child) => (child.x -= leftHalfCenterX));
    leftHalf.x = leftHalfCenterX;

    const rightHalf = this.add.container(0, 0, [rightMiddle, rightEdge]);
    const rightHalfCenterX = (cutX + tapeWidth / 2) / 2;
    rightHalf.list.forEach((child) => (child.x -= rightHalfCenterX));
    rightHalf.x = rightHalfCenterX;

    parent.add([leftHalf, rightHalf]);
    obstruction.tapeContainer.destroy();

    return { leftHalf, rightHalf };
  }

  animateTapeHalfAway(obstruction, half, direction) {
    const startX = half.x;
    const startY = half.y;
    const flingRotation = direction * Phaser.Math.FloatBetween(TAPE_FLING_ROTATION_MIN, TAPE_FLING_ROTATION_MAX);
    const fallRotation =
      flingRotation + direction * Phaser.Math.FloatBetween(TAPE_FALL_ROTATION_MIN, TAPE_FALL_ROTATION_MAX);

    this.tweens.chain({
      targets: half,
      tweens: [
        {
          x: startX + direction * TAPE_FLING_APART_DISTANCE,
          y: startY - TAPE_FLING_UP_DISTANCE,
          rotation: flingRotation,
          duration: TAPE_FLING_DURATION,
          ease: "Back.easeOut",
        },
        {
          x: startX + direction * (TAPE_FLING_APART_DISTANCE + TAPE_FALL_APART_DISTANCE),
          y: startY - TAPE_FLING_UP_DISTANCE + TAPE_FALL_DISTANCE,
          rotation: fallRotation,
          duration: TAPE_FALL_DURATION,
          ease: "Cubic.easeIn",
          onComplete: () => {
            half.destroy();
            this.finishTapeRemoval(obstruction);
          },
        },
      ],
    });
  }

  finishTapeRemoval(obstruction) {
    if (obstruction.cleared) {
      return;
    }

    obstruction.cleared = true;
    this.activeObstruction = null;
  }

  rotateToolTowardSweep(pointer) {
    // Direction only, from raw screen-space movement — a uniform camera zoom
    // scales dx/dy equally, so the angle this feeds into is unaffected and
    // there's no need to convert to world coordinates here.
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
      Math.abs(pointer.worldX - this.windowCenterX) <= WINDOW_WIDTH / 2 &&
      Math.abs(pointer.worldY - WINDOW_Y) <= WINDOW_HEIGHT / 2
    );
  }

  toWindowLocal(x, y) {
    return {
      x: Phaser.Math.Clamp(x - this.windowLeft, 0, WINDOW_WIDTH),
      y: Phaser.Math.Clamp(y - WINDOW_TOP, 0, WINDOW_HEIGHT),
    };
  }

  // Converts a toWindowLocal-space point (0..WINDOW_WIDTH/HEIGHT, top-left
  // origin) into the active segment container's own local space (origin at
  // the window's center) — the same origin the dirtMask render texture itself
  // is anchored at.
  toContainerLocal(x, y) {
    return {
      x: WINDOW_OFFSET_X - WINDOW_WIDTH / 2 + x,
      y: -WINDOW_HEIGHT / 2 + y,
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
      this.wipeDirtSpotsNear(x, y);
      this.eraseSprayDecalsNear(x, y);
    }
  }

  eraseSprayDecalsNear(x, y) {
    for (let i = this.sprayDecals.length - 1; i >= 0; i--) {
      const decal = this.sprayDecals[i];

      if (
        Phaser.Math.Distance.Between(x, y, decal.x, decal.y) > SPRAY_SPOT_RADIUS ||
        this.decalGuardsUnclearedSpot(decal)
      ) {
        continue;
      }

      decal.layerImages.forEach((image) => image.destroy());
      this.sprayDecals.splice(i, 1);

      if (this.activeSprayDecal === decal) {
        this.stopSprayHold();
      }
    }
  }

  // A decal sitting on a dirt spot that still needs its spray precondition
  // (hand-prints' wipe, bird-poop's hold) must survive the very wiping/
  // holding it's gating — otherwise the first successful step both consumes
  // the decal and destroys it, so the remaining hits/hold-time can never be
  // reached. Once the spot is actually cleared, clearDirtSpot() erases its
  // decal explicitly instead.
  decalGuardsUnclearedSpot(decal) {
    return this.dirtSpots.some(
      (spot) => !spot.cleared && Phaser.Math.Distance.Between(decal.x, decal.y, spot.x, spot.y) <= SPRAY_SPOT_RADIUS,
    );
  }

  wipeDirtSpotsNear(x, y) {
    for (const spot of this.dirtSpots) {
      const dirtType = DIRT_TYPES[spot.type];

      if (
        spot.cleared ||
        dirtType.interactionType !== "wipe" ||
        !dirtType.toolIds.includes(this.equippedTool.id) ||
        Phaser.Math.Distance.Between(x, y, spot.x, spot.y) > DIRT_SPOT_HIT_RADIUS ||
        this.sprayStageAt(spot.x, spot.y) < dirtType.requiredSprayStage
      ) {
        continue;
      }

      spot.progress.registerTap();
      this.updateWipeStageImage(spot, dirtType);

      if (spot.progress.isClean()) {
        this.clearDirtSpot(spot);
      }
    }
  }

  // Some wipe-type dirt (stickers) shows progress by swapping its own
  // sprite through a sequence of stage images instead of a progress bar;
  // hand-prints declares no `stages`, so this is a no-op for it.
  updateWipeStageImage(spot, dirtType) {
    if (!dirtType.stages) {
      return;
    }

    const stage = computeStickerStage({
      hitsRemaining: spot.progress.hitsRemaining,
      hitsToClean: dirtType.hitsToClean,
      stageCount: dirtType.stages.length,
    });

    spot.image.setTexture(dirtType.stages[stage - 1].textureKey);
  }

  sprayStageAt(x, y) {
    const decal = this.sprayDecals.find(
      (candidate) => Phaser.Math.Distance.Between(x, y, candidate.x, candidate.y) <= SPRAY_SPOT_RADIUS,
    );

    return decal?.stage ?? 0;
  }

  clearDirtSpot(spot) {
    spot.cleared = true;
    spot.image.destroy();
    spot.progressGraphics?.destroy();
    this.eraseSprayDecalsNear(spot.x, spot.y);
    this.updateRevealProgress();
  }

  updateRevealProgress() {
    this.drawProgressBar(this.revealTracker.revealedFraction());

    if (
      !this.floorComplete &&
      this.revealTracker.isFullyRevealed(REVEAL_THRESHOLD) &&
      !this.activeObstruction &&
      this.allDirtSpotsCleared()
    ) {
      this.floorComplete = true;
      this.fadeOutRemainingDirt();
    }
  }

  allDirtSpotsCleared() {
    return this.dirtSpots.every((spot) => spot.cleared);
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
    this.isTransitioning = true;

    const backdrop = this.add
      .rectangle(this.buildingX, CANVAS_HEIGHT / 2, this.canvasWidth, CANVAS_HEIGHT, 0x000000, 0.7)
      .setDepth(100);
    const title = this.add
      .text(this.buildingX, 580, "Level Complete", { fontSize: "40px", color: "#ffffff" })
      .setOrigin(0.5)
      .setDepth(101);

    const menuButton = this.add
      .rectangle(this.buildingX, 660, 200, 60, 0x4caf50)
      .setInteractive({ useHandCursor: true }).setDepth(101);
    const menuLabel = this.add
      .text(this.buildingX, 660, "Menu", { fontSize: "24px", color: "#ffffff" })
      .setOrigin(0.5)
      .setDepth(101);

    menuButton.on("pointerdown", () => this.scene.start("MainMenuScene"));

    this.hudContainer.add([backdrop, title, menuButton, menuLabel]);
  }
}
