import Phaser from "phaser";
import GameScene from "./scenes/GameScene";

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
      gravity: { x: 0, y: 1000 },
      debug: false
    }
  },

  scene: [GameScene]
};


new Phaser.Game(config);