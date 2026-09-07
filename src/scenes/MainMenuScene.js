import { HOUSES } from "../config/houses.js";
import { TOOLS } from "../config/tools.js";
import { LIFTS } from "../config/lifts.js";

const CARD_WIDTH = 300;
const CARD_HEIGHT = 220;
const CARD_GAP = 20;
const GRID_TOP = 260;

const DEFAULT_LIFT_ID = "gondola";

export class MainMenuScene extends Phaser.Scene {
  constructor() {
    super("MainMenuScene");
  }

  create() {
    this.gridCenterX = this.scale.width / 2;

    this.add
      .text(this.gridCenterX, 140, "Vertical Shine", {
        fontSize: "48px",
        color: "#ffffff",
      })
      .setOrigin(0.5);

    HOUSES.forEach((house, index) => this.createHouseCard(house, index));

    this.createIconRow({
      title: "Toolbelt",
      y: 840,
      items: TOOLS,
    });

    this.createLiftGarage({ y: 1120 });
  }

  createLiftGarage({ y }) {
    if (!this.registry.has("selectedLiftId")) {
      this.registry.set("selectedLiftId", DEFAULT_LIFT_ID);
    }

    this.add
      .text(this.gridCenterX, y, "Lift Garage", { fontSize: "24px", color: "#ffffff" })
      .setOrigin(0.5);

    const iconSize = 64;
    const gap = 30;
    const totalWidth = LIFTS.length * iconSize + (LIFTS.length - 1) * gap;
    const startX = this.gridCenterX - totalWidth / 2 + iconSize / 2;
    const iconY = y + 50;

    this.liftSelectionBorders = {};

    LIFTS.forEach((lift, index) => {
      const x = startX + index * (iconSize + gap);
      const selectable = Boolean(lift.platformTextureKey);

      const icon = this.createItemIcon(lift, x, iconY, iconSize, { dimmed: !selectable });

      const border = this.add.rectangle(x, iconY, iconSize + 10, iconSize + 10);
      border.setStrokeStyle(3, 0xffffff, 1);
      border.setVisible(selectable && this.registry.get("selectedLiftId") === lift.id);
      this.liftSelectionBorders[lift.id] = border;

      const labelText = selectable ? lift.name : `${lift.name}\n(Coming soon)`;
      this.add
        .text(x, iconY + iconSize / 2 + 16, labelText, {
          fontSize: "14px",
          color: selectable ? "#c0c0c0" : "#707070",
          align: "center",
          wordWrap: { width: iconSize + gap - 10 },
        })
        .setOrigin(0.5, 0);

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

    const card = this.add.rectangle(x, y, CARD_WIDTH, CARD_HEIGHT, house.color, house.enabled ? 1 : 0.35);
    card.setStrokeStyle(2, 0xffffff, house.enabled ? 0.6 : 0.2);

    this.add
      .text(x, y - 60, house.name, { fontSize: "24px", color: "#ffffff" })
      .setOrigin(0.5);

    const statusLabel = house.enabled ? `${house.floors} floors  •  ${house.difficulty}` : "Coming soon";
    this.add
      .text(x, y - 20, statusLabel, { fontSize: "18px", color: "#e0e0e0" })
      .setOrigin(0.5);

    if (house.enabled) {
      card.setInteractive({ useHandCursor: true });
      card.on("pointerdown", () => this.scene.start("HouseCleanScene", { houseId: house.id }));
    }
  }

  createIconRow({ title, y, items }) {
    this.add
      .text(this.gridCenterX, y, title, { fontSize: "24px", color: "#ffffff" })
      .setOrigin(0.5);

    const iconSize = 64;
    const gap = 30;
    const totalWidth = items.length * iconSize + (items.length - 1) * gap;
    const startX = this.gridCenterX - totalWidth / 2 + iconSize / 2;
    const iconY = y + 50;

    items.forEach((item, index) => {
      const x = startX + index * (iconSize + gap);

      this.createItemIcon(item, x, iconY, iconSize);
      this.add
        .text(x, iconY + iconSize / 2 + 16, item.name, {
          fontSize: "14px",
          color: "#c0c0c0",
          align: "center",
          wordWrap: { width: iconSize + gap - 10 },
        })
        .setOrigin(0.5, 0);
    });
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
