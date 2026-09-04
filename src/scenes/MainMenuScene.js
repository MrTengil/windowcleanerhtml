import { HOUSES } from "../config/houses.js";
import { TOOLS } from "../config/tools.js";
import { LIFTS } from "../config/lifts.js";

const CARD_WIDTH = 300;
const CARD_HEIGHT = 220;
const CARD_GAP = 20;
const GRID_TOP = 260;
const GRID_CENTER_X = 360;

export class MainMenuScene extends Phaser.Scene {
  constructor() {
    super("MainMenuScene");
  }

  create() {
    this.add
      .text(GRID_CENTER_X, 140, "Vertical Shine", {
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

    this.createIconRow({
      title: "Lift Garage",
      y: 1120,
      items: LIFTS,
    });
  }

  createHouseCard(house, index) {
    const column = index % 2;
    const row = Math.floor(index / 2);
    const x = GRID_CENTER_X + (column === 0 ? -1 : 1) * (CARD_GAP / 2 + CARD_WIDTH / 2);
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
      .text(GRID_CENTER_X, y, title, { fontSize: "24px", color: "#ffffff" })
      .setOrigin(0.5);

    const iconSize = 64;
    const gap = 30;
    const totalWidth = items.length * iconSize + (items.length - 1) * gap;
    const startX = GRID_CENTER_X - totalWidth / 2 + iconSize / 2;
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

  createItemIcon(item, x, y, size) {
    if (item.iconTextureKey) {
      return this.add.image(x, y, item.iconTextureKey).setDisplaySize(size, size);
    }

    return this.add.rectangle(x, y, size, size, item.color);
  }
}
