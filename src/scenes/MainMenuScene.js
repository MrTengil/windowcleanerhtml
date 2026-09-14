import { HOUSES } from "../config/houses.js";
import { LIFTS } from "../config/lifts.js";

const CARD_WIDTH = 300;
const CARD_HEIGHT = 220;
const CARD_GAP = 20;
const GRID_TOP = 260;
const CARD_CORNER_RADIUS = 16;
// Keeps a thumbnail's square corners tucked inside the card's rounded
// frame instead of poking past it.
const CARD_THUMBNAIL_INSET = 14;
const CARD_LABEL_BACKDROP_HEIGHT = 90;
const SKYLINE_NATIVE_WIDTH = 1024;
const CARD_TITLE_BOTTOM_MARGIN = 60;
const CARD_STATUS_BOTTOM_MARGIN = 24;

// The infinite house renders as its own full-width tile below the 2x2
// grid instead of awkwardly filling the grid's leftover slot — visually
// marking it as a different mode, not just another building.
const INFINITE_CARD_WIDTH = CARD_WIDTH * 2 + CARD_GAP;
const INFINITE_CARD_Y = 850;

const DEFAULT_LIFT_ID = "gondola";

const SETTINGS_BUTTON_Y = 1010;
const SETTINGS_BUTTON_WIDTH = 200;
const SETTINGS_BUTTON_HEIGHT = 56;
const SETTINGS_BUTTON_CORNER_RADIUS = 12;

const SETTINGS_PANEL_WIDTH = 420;
const SETTINGS_PANEL_HEIGHT = 300;
const SETTINGS_PANEL_CORNER_RADIUS = 20;
const SETTINGS_BACKDROP_DEPTH = 500;
const SETTINGS_PANEL_DEPTH = 501;
const SETTINGS_CONTENT_DEPTH = 502;

export class MainMenuScene extends Phaser.Scene {
  constructor() {
    super("MainMenuScene");
  }

  create() {
    this.gridCenterX = this.scale.width / 2;

    this.buildBackground();

    this.add
      .text(this.gridCenterX, 140, "Vertical Shine", {
        fontSize: "48px",
        color: "#ffffff",
      })
      .setOrigin(0.5);

    HOUSES.filter((house) => !house.infinite).forEach((house, index) => this.createHouseCard(house, index));

    const infiniteHouse = HOUSES.find((house) => house.infinite);

    if (infiniteHouse) {
      this.createInfiniteHouseCard(infiniteHouse);
    }

    if (!this.registry.has("selectedLiftId")) {
      this.registry.set("selectedLiftId", DEFAULT_LIFT_ID);
    }

    this.buildSettingsButton();
  }

  buildBackground() {
    this.add.image(this.scale.width / 2, this.scale.height / 2, "menu-background");
  }

  buildSettingsButton() {
    const x = this.gridCenterX;
    const y = SETTINGS_BUTTON_Y;
    const left = x - SETTINGS_BUTTON_WIDTH / 2;
    const top = y - SETTINGS_BUTTON_HEIGHT / 2;

    const button = this.add.graphics();
    button.fillStyle(0x2a2a2a, 0.85);
    button.fillRoundedRect(left, top, SETTINGS_BUTTON_WIDTH, SETTINGS_BUTTON_HEIGHT, SETTINGS_BUTTON_CORNER_RADIUS);
    button.lineStyle(2, 0xffffff, 0.5);
    button.strokeRoundedRect(left, top, SETTINGS_BUTTON_WIDTH, SETTINGS_BUTTON_HEIGHT, SETTINGS_BUTTON_CORNER_RADIUS);

    this.add.text(x, y, "Settings", { fontSize: "20px", color: "#ffffff" }).setOrigin(0.5);

    const hitArea = this.add
      .rectangle(x, y, SETTINGS_BUTTON_WIDTH, SETTINGS_BUTTON_HEIGHT, 0x000000, 0)
      .setInteractive({ useHandCursor: true });
    hitArea.on("pointerdown", () => this.openSettings());
  }

  openSettings() {
    if (this.settingsObjects) {
      return;
    }

    const centerX = this.scale.width / 2;
    const centerY = this.scale.height / 2;
    const panelLeft = centerX - SETTINGS_PANEL_WIDTH / 2;
    const panelTop = centerY - SETTINGS_PANEL_HEIGHT / 2;

    const backdrop = this.add
      .rectangle(centerX, centerY, this.scale.width, this.scale.height, 0x000000, 0.7)
      .setInteractive()
      .setDepth(SETTINGS_BACKDROP_DEPTH);
    backdrop.on("pointerdown", () => this.closeSettings());

    const panel = this.add.graphics().setDepth(SETTINGS_PANEL_DEPTH);
    panel.fillStyle(0x1c1c24, 0.97);
    panel.fillRoundedRect(panelLeft, panelTop, SETTINGS_PANEL_WIDTH, SETTINGS_PANEL_HEIGHT, SETTINGS_PANEL_CORNER_RADIUS);
    panel.lineStyle(2, 0xffffff, 0.5);
    panel.strokeRoundedRect(panelLeft, panelTop, SETTINGS_PANEL_WIDTH, SETTINGS_PANEL_HEIGHT, SETTINGS_PANEL_CORNER_RADIUS);

    // Blocks the panel body from also counting as a backdrop click (Phaser
    // only dispatches pointerdown to the topmost hit target, so an
    // interactive no-op here is enough to stop it reaching the backdrop).
    const panelHitArea = this.add
      .rectangle(centerX, centerY, SETTINGS_PANEL_WIDTH, SETTINGS_PANEL_HEIGHT, 0x000000, 0)
      .setInteractive()
      .setDepth(SETTINGS_PANEL_DEPTH);

    this.settingsObjects = [backdrop, panel, panelHitArea];
    this.buildLiftGarage({ centerX, y: panelTop + 50 });

    const hint = this.add
      .text(centerX, panelTop + SETTINGS_PANEL_HEIGHT - 24, "Tap outside to close", {
        fontSize: "13px",
        color: "#909090",
      })
      .setOrigin(0.5)
      .setDepth(SETTINGS_CONTENT_DEPTH);
    this.settingsObjects.push(hint);
  }

  closeSettings() {
    this.settingsObjects?.forEach((object) => object.destroy());
    this.settingsObjects = null;
  }

  buildLiftGarage({ centerX, y }) {
    const title = this.add
      .text(centerX, y, "Lift Garage", { fontSize: "24px", color: "#ffffff" })
      .setOrigin(0.5)
      .setDepth(SETTINGS_CONTENT_DEPTH);
    this.settingsObjects.push(title);

    const iconSize = 64;
    const gap = 30;
    const totalWidth = LIFTS.length * iconSize + (LIFTS.length - 1) * gap;
    const startX = centerX - totalWidth / 2 + iconSize / 2;
    const iconY = y + 60;

    this.liftSelectionBorders = {};

    LIFTS.forEach((lift, index) => {
      const x = startX + index * (iconSize + gap);
      const selectable = Boolean(lift.platformTextureKey);

      const icon = this.createItemIcon(lift, x, iconY, iconSize, { dimmed: !selectable }).setDepth(
        SETTINGS_CONTENT_DEPTH,
      );

      const border = this.add.rectangle(x, iconY, iconSize + 10, iconSize + 10).setDepth(SETTINGS_CONTENT_DEPTH);
      border.setStrokeStyle(3, 0xffffff, 1);
      border.setVisible(selectable && this.registry.get("selectedLiftId") === lift.id);
      this.liftSelectionBorders[lift.id] = border;

      const labelText = selectable ? lift.name : `${lift.name}\n(Coming soon)`;
      const label = this.add
        .text(x, iconY + iconSize / 2 + 16, labelText, {
          fontSize: "13px",
          color: selectable ? "#c0c0c0" : "#707070",
          align: "center",
          wordWrap: { width: iconSize + gap - 10 },
        })
        .setOrigin(0.5, 0)
        .setDepth(SETTINGS_CONTENT_DEPTH);

      this.settingsObjects.push(icon, border, label);

      if (selectable) {
        icon.setInteractive({ useHandCursor: true });
        icon.on("pointerdown", () => this.selectLift(lift.id));
      }
    });
  }

  selectLift(liftId) {
    this.registry.set("selectedLiftId", liftId);

    Object.entries(this.liftSelectionBorders).forEach(([id, border]) => {
      border.setVisible(id === liftId);
    });
  }

  createHouseCard(house, index) {
    const column = index % 2;
    const row = Math.floor(index / 2);
    const x = this.gridCenterX + (column === 0 ? -1 : 1) * (CARD_GAP / 2 + CARD_WIDTH / 2);
    const y = GRID_TOP + row * (CARD_HEIGHT + CARD_GAP) + CARD_HEIGHT / 2;
    const statusLabel = house.enabled ? `${house.floors} floors  •  ${house.difficulty}` : "Coming soon";

    this.drawHouseTile({ house, x, y, width: CARD_WIDTH, height: CARD_HEIGHT, statusLabel });
  }

  createInfiniteHouseCard(house) {
    const x = this.gridCenterX;
    const y = INFINITE_CARD_Y;
    const statusLabel = `∞ floors  •  ${house.difficulty}`;

    this.drawHouseTile({ house, x, y, width: INFINITE_CARD_WIDTH, height: CARD_HEIGHT, statusLabel });
  }

  drawHouseTile({ house, x, y, width, height, statusLabel }) {
    const left = x - width / 2;
    const top = y - height / 2;
    const alpha = house.enabled ? 1 : 0.35;

    const card = this.add.graphics();
    card.fillStyle(house.color, alpha);
    card.fillRoundedRect(left, top, width, height, CARD_CORNER_RADIUS);
    card.lineStyle(2, 0xffffff, house.enabled ? 0.6 : 0.2);
    card.strokeRoundedRect(left, top, width, height, CARD_CORNER_RADIUS);

    if (house.skylineTextureKey) {
      const thumbnailWidth = width - CARD_THUMBNAIL_INSET * 2;
      const thumbnailHeight = height - CARD_THUMBNAIL_INSET * 2;
      const thumbnailLeft = x - thumbnailWidth / 2;
      const thumbnailTop = top + CARD_THUMBNAIL_INSET;
      const thumbnailScale = thumbnailWidth / SKYLINE_NATIVE_WIDTH;

      // Scaled to the thumbnail's width, anchored by its bottom edge so the
      // buildings (near the bottom of the source art) show rather than the
      // empty sky above them — then clipped to the thumbnail box with a
      // mask, since the scaled art is taller than the box.
      const image = this.add
        .image(x, thumbnailTop + thumbnailHeight, house.skylineTextureKey)
        .setOrigin(0.5, 1)
        .setScale(thumbnailScale);

      const maskShape = this.make
        .graphics({ add: false })
        .fillStyle(0xffffff)
        .fillRect(thumbnailLeft, thumbnailTop, thumbnailWidth, thumbnailHeight);
      image.setMask(maskShape.createGeometryMask());

      // A dark band behind the title/status text so it stays legible over
      // the artwork, matching a level-select tile look.
      const labelBackdropY = top + height - CARD_LABEL_BACKDROP_HEIGHT / 2;
      this.add
        .rectangle(x, labelBackdropY, width - CARD_THUMBNAIL_INSET * 2, CARD_LABEL_BACKDROP_HEIGHT, 0x000000, 0.45)
        .setOrigin(0.5);
    }

    const bottom = top + height;

    this.add
      .text(x, bottom - CARD_TITLE_BOTTOM_MARGIN, house.name, { fontSize: "24px", color: "#ffffff" })
      .setOrigin(0.5);

    this.add
      .text(x, bottom - CARD_STATUS_BOTTOM_MARGIN, statusLabel, { fontSize: "18px", color: "#e0e0e0" })
      .setOrigin(0.5);

    if (house.enabled) {
      const hitArea = this.add.rectangle(x, y, width, height, 0x000000, 0).setInteractive({ useHandCursor: true });
      hitArea.on("pointerdown", () => this.scene.start("HouseCleanScene", { houseId: house.id }));
    }
  }

  createItemIcon(item, x, y, size, { dimmed = false } = {}) {
    const textureKey = item.iconTextureKey ?? item.platformTextureKey;
    const alpha = dimmed ? 0.35 : 1;

    if (textureKey) {
      return this.add.image(x, y, textureKey).setDisplaySize(size, size).setAlpha(alpha);
    }

    return this.add.rectangle(x, y, size, size, item.color, alpha);
  }
}
