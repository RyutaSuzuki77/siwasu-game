import Phaser from "phaser";
import TitleScene from "./scenes/TitleScene";
import GameScene from "./scenes/GameScene";
import { GameOverScene } from "./scenes/GameOverScene";

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  backgroundColor: "#1e1e1e",

  scale: {
    mode: Phaser.Scale.FIT,        // 画面にフィット
    autoCenter: Phaser.Scale.CENTER_BOTH, // 中央寄せ
    width: 800,
    height: 600
  },

  physics: {
    default: "arcade",
    arcade: {
      gravity: { x: 0, y: 0 },
      debug: false
    }
  },

  scene: [TitleScene, GameScene, GameOverScene]
};


new Phaser.Game(config);