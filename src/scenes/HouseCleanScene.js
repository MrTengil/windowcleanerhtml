import { HOUSES } from "../config/houses.js";
import { DIRT_TYPES } from "../config/dirtTypes.js";
import { TOOLS } from "../config/tools.js";
import { LIFTS } from "../config/lifts.js";
import { RevealTracker } from "../interactions/RevealTracker.js";
import { formatFloorLabel } from "../ui/HUD.js";

const WINDOW_X = 360;
const WINDOW_Y = 460;
const WINDOW_WIDTH = 480;
const WINDOW_HEIGHT = 560;
const WINDOW_LEFT = WINDOW_X - WINDOW_WIDTH / 2;
const WINDOW_TOP = WINDOW_Y - WINDOW_HEIGHT / 2;

const WALL_Y = 480;
const WALL_WIDTH = 640;
const WALL_HEIGHT = 860;

const DIRT_MASK_COLOR = 0x8a7f6a;
const BRUSH_RADIUS = 28;
const ERASE_STEP_DISTANCE = 12;
const REVEAL_CELL_SIZE = 40;
const REVEAL_THRESHOLD = 0.99;

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
    this.isTransitioning = false;
    this.floorComplete = false;
  }

  create() {
    this.equippedTool = this.findEquippedTool();

    this.buildSkyBackground();
    this.buildBuildingWall();
    this.buildHud();
    this.buildToolbelt();
    this.buildLift();
    this.buildWindowPane();
    this.buildDirtMask();
    this.buildToolIcon();
    this.setupSwipeInput();
    this.resetFloor();
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

  buildBuildingWall() {
    this.add.rectangle(WINDOW_X, WALL_Y, WALL_WIDTH, WALL_HEIGHT, this.house.color);
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

  buildDirtMask() {
    this.dirtMask = this.add
      .renderTexture(-WINDOW_WIDTH / 2, -WINDOW_HEIGHT / 2, WINDOW_WIDTH, WINDOW_HEIGHT)
      .setOrigin(0, 0);
    this.floorContainer.add(this.dirtMask);

    this.eraserBrush = this.add.circle(0, 0, BRUSH_RADIUS, 0xffffff).setVisible(false);
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

    const from = this.toWindowLocal(pointer.prevPosition.x, pointer.prevPosition.y);
    const to = this.toWindowLocal(pointer.x, pointer.y);

    this.eraseAlongPath(from, to);
    this.updateRevealProgress();
  }

  isInsideWindow(pointer) {
    return (
      Math.abs(pointer.x - WINDOW_X) <= WINDOW_WIDTH / 2 && Math.abs(pointer.y - WINDOW_Y) <= WINDOW_HEIGHT / 2
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

    this.playFloorTransition(() => {
      this.floorText.setText(formatFloorLabel(this.currentFloor, this.house.floors));
      this.resetFloor();
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
