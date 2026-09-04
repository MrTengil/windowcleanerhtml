import { BootScene } from "./scenes/BootScene.js";
import { MainMenuScene } from "./scenes/MainMenuScene.js";
import { HouseCleanScene } from "./scenes/HouseCleanScene.js";

new Phaser.Game({
  type: Phaser.AUTO,
  parent: "game",
  width: 720,
  height: 1560,
  backgroundColor: "#14161c",
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  scene: [BootScene, MainMenuScene, HouseCleanScene],
});
