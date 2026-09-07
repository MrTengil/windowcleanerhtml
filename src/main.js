import { BootScene } from "./scenes/BootScene.js";
import { MainMenuScene } from "./scenes/MainMenuScene.js";
import { HouseCleanScene } from "./scenes/HouseCleanScene.js";
import { computeGameWidth } from "./utils/viewport.js";

const DESIGN_HEIGHT = 1560;
const MIN_ASPECT = 0.4615;
const MAX_ASPECT = 0.65;

const width = computeGameWidth({
  viewportWidth: window.innerWidth,
  viewportHeight: window.innerHeight,
  designHeight: DESIGN_HEIGHT,
  minAspect: MIN_ASPECT,
  maxAspect: MAX_ASPECT,
});

new Phaser.Game({
  type: Phaser.AUTO,
  parent: "game",
  width,
  height: DESIGN_HEIGHT,
  backgroundColor: "#14161c",
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  scene: [BootScene, MainMenuScene, HouseCleanScene],
});
