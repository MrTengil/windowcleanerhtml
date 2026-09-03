import { HOUSES } from "../config/houses.js";
import { DIRT_TYPES } from "../config/dirtTypes.js";
import { TOOLS } from "../config/tools.js";
import { LIFTS } from "../config/lifts.js";
import { DirtSpot } from "../entities/DirtSpot.js";
import { Window } from "../entities/Window.js";
import { handleTap } from "../interactions/TapInteraction.js";
import { SwipeProgress } from "../interactions/SwipeInteraction.js";
import { scatterPositions } from "../utils/scatterPositions.js";
import { formatFloorLabel } from "../ui/HUD.js";

const WINDOW_X = 360;
const WINDOW_Y = 460;
const WINDOW_WIDTH = 480;
const WINDOW_HEIGHT = 560;
const SPOT_SIZE = 70;
const SPOT_COUNT = 4;
const SPOT_MIN_SPACING = SPOT_SIZE * 1.2;
const DISTANCE_PER_HIT = 60;
const FLOOR_TRANSITION_OFFSET = 150;
const FLOOR_TRANSITION_DURATION = 350;

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
    this.spotViews = [];
    this.isTransitioning = false;
  }

  create() {
    this.equippedTool = this.findEquippedTool();

    this.buildSkyBackground();
    this.buildHud();
    this.buildToolbelt();
    this.buildLift();
    this.buildWindowPane();
    this.buildToolIcon();
    this.setupSwipeInput();
    this.spawnDirtSpots();
  }

  findEquippedTool() {
    const firstDirtType = DIRT_TYPES[this.house.dirtTypeIds[0]];

    return TOOLS.find((tool) => tool.id === firstDirtType.toolId);
  }

  buildSkyBackground() {
    const sky = this.add.graphics();
    sky.fillGradientStyle(0x87ceeb, 0x87ceeb, 0x3a5a7a, 0x3a5a7a, 1);
    sky.fillRect(0, 0, 720, 1280);
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
    this.add
      .rectangle(680, 40, 50, 50, this.equippedTool.color)
      .setStrokeStyle(3, 0xffffff, 0.9);
    this.add
      .text(680, 70, this.equippedTool.name, { fontSize: "12px", color: "#ffffff", align: "center" })
      .setOrigin(0.5, 0);
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

    this.add.rectangle(360, 880, 600, 40, lift.color);
  }

  buildWindowPane() {
    this.floorContainer = this.add.container(WINDOW_X, WINDOW_Y);

    const pane = this.add
      .rectangle(0, 0, WINDOW_WIDTH, WINDOW_HEIGHT, 0x9fd3e8)
      .setStrokeStyle(4, 0xffffff, 0.8);

    this.floorContainer.add(pane);
  }

  buildToolIcon() {
    this.toolIcon = this.add
      .rectangle(0, 0, 36, 36, this.equippedTool.color)
      .setVisible(false)
      .setDepth(1000);

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

    const distance = Phaser.Math.Distance.Between(
      pointer.prevPosition.x,
      pointer.prevPosition.y,
      pointer.x,
      pointer.y,
    );

    for (const view of this.spotViews) {
      if (view.domainSpot.isClean() || !this.pointerOverSpot(pointer, view)) {
        continue;
      }

      if (view.swipeProgress.registerDistance(distance)) {
        this.onSpotHit(view);
      }
    }
  }

  isInsideWindow(pointer) {
    return (
      Math.abs(pointer.x - WINDOW_X) <= WINDOW_WIDTH / 2 && Math.abs(pointer.y - WINDOW_Y) <= WINDOW_HEIGHT / 2
    );
  }

  pointerOverSpot(pointer, view) {
    return Math.abs(pointer.x - view.worldX) <= SPOT_SIZE / 2 && Math.abs(pointer.y - view.worldY) <= SPOT_SIZE / 2;
  }

  spawnDirtSpots() {
    const positions = scatterPositions({
      count: SPOT_COUNT,
      width: WINDOW_WIDTH - SPOT_SIZE,
      height: WINDOW_HEIGHT - SPOT_SIZE,
      minSpacing: SPOT_MIN_SPACING,
    });

    this.spotViews = positions.map((position, index) => this.createDirtSpotView(position, index));
    this.window = new Window({ dirtSpots: this.spotViews.map((view) => view.domainSpot) });

    this.drawProgressBar(0);
  }

  createDirtSpotView(position, index) {
    const dirtTypeId = this.house.dirtTypeIds[index % this.house.dirtTypeIds.length];
    const dirtType = DIRT_TYPES[dirtTypeId];
    const domainSpot = new DirtSpot({ hitsToClean: dirtType.hitsToClean });

    const graphic = this.add.rectangle(position.x, position.y, SPOT_SIZE, SPOT_SIZE, dirtType.color);
    this.floorContainer.add(graphic);

    return {
      domainSpot,
      graphic,
      worldX: WINDOW_X + position.x,
      worldY: WINDOW_Y + position.y,
      swipeProgress: new SwipeProgress({ distancePerHit: DISTANCE_PER_HIT }),
    };
  }

  onSpotHit(view) {
    const result = handleTap(view.domainSpot);

    if (result.becameClean) {
      this.tweens.add({
        targets: view.graphic,
        scale: 0,
        alpha: 0,
        duration: 200,
        onComplete: () => view.graphic.destroy(),
      });
    }

    this.updateProgress();

    if (this.window.isClean()) {
      this.time.delayedCall(300, () => this.advanceFloor());
    }
  }

  updateProgress() {
    const cleanedCount = this.spotViews.filter((view) => view.domainSpot.isClean()).length;

    this.drawProgressBar(cleanedCount / this.spotViews.length);
  }

  advanceFloor() {
    this.currentFloor += 1;

    if (this.currentFloor > this.house.floors) {
      this.showLevelComplete();
      return;
    }

    this.playFloorTransition(() => {
      this.floorText.setText(formatFloorLabel(this.currentFloor, this.house.floors));
      this.spawnDirtSpots();
    });
  }

  playFloorTransition(onExitComplete) {
    this.isTransitioning = true;

    this.tweens.add({
      targets: this.floorContainer,
      y: WINDOW_Y + FLOOR_TRANSITION_OFFSET,
      alpha: 0,
      duration: FLOOR_TRANSITION_DURATION,
      ease: "Cubic.easeIn",
      onComplete: () => {
        onExitComplete();
        this.floorContainer.y = WINDOW_Y - FLOOR_TRANSITION_OFFSET;

        this.tweens.add({
          targets: this.floorContainer,
          y: WINDOW_Y,
          alpha: 1,
          duration: FLOOR_TRANSITION_DURATION,
          ease: "Cubic.easeOut",
          onComplete: () => {
            this.isTransitioning = false;
          },
        });
      },
    });
  }

  showLevelComplete() {
    this.add.rectangle(360, 640, 720, 1280, 0x000000, 0.7);
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
