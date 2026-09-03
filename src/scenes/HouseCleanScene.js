import { HOUSES } from "../config/houses.js";
import { DIRT_TYPES } from "../config/dirtTypes.js";
import { LIFTS } from "../config/lifts.js";
import { DirtSpot } from "../entities/DirtSpot.js";
import { Window } from "../entities/Window.js";
import { handleTap } from "../interactions/TapInteraction.js";
import { formatFloorLabel } from "../ui/HUD.js";

const WINDOW_X = 360;
const WINDOW_Y = 460;
const WINDOW_WIDTH = 480;
const WINDOW_HEIGHT = 560;
const SPOT_SIZE = 70;
const SPOT_OFFSETS = [
  { dx: -100, dy: -120 },
  { dx: 100, dy: -120 },
  { dx: -100, dy: 80 },
  { dx: 100, dy: 80 },
];

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
  }

  create() {
    this.buildHud();
    this.buildLift();
    this.buildWindowPane();
    this.spawnDirtSpots();
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
    this.add
      .rectangle(WINDOW_X, WINDOW_Y, WINDOW_WIDTH, WINDOW_HEIGHT, 0x9fd3e8)
      .setStrokeStyle(4, 0xffffff, 0.8);
  }

  spawnDirtSpots() {
    this.spotViews = SPOT_OFFSETS.map((offset, index) => this.createDirtSpotView(offset, index));
    this.window = new Window({ dirtSpots: this.spotViews.map((view) => view.domainSpot) });

    this.drawProgressBar(0);
  }

  createDirtSpotView(offset, index) {
    const dirtTypeId = this.house.dirtTypeIds[index % this.house.dirtTypeIds.length];
    const dirtType = DIRT_TYPES[dirtTypeId];
    const domainSpot = new DirtSpot({ hitsToClean: dirtType.hitsToClean });

    const graphic = this.add.rectangle(
      WINDOW_X + offset.dx,
      WINDOW_Y + offset.dy,
      SPOT_SIZE,
      SPOT_SIZE,
      dirtType.color,
    );
    graphic.setInteractive({ useHandCursor: true });
    graphic.on("pointerdown", () => this.onSpotTapped(domainSpot, graphic));

    return { domainSpot, graphic };
  }

  onSpotTapped(domainSpot, graphic) {
    const result = handleTap(domainSpot);

    if (result.becameClean) {
      this.tweens.add({
        targets: graphic,
        scale: 0,
        alpha: 0,
        duration: 200,
        onComplete: () => graphic.destroy(),
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

    this.floorText.setText(formatFloorLabel(this.currentFloor, this.house.floors));
    this.spawnDirtSpots();
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
