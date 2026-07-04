import Phaser from "phaser";

export default class TitleScene extends Phaser.Scene {
  constructor() {
    super("TitleScene");
  }
  preload() {
    this.load.image("title", "assets/images/background/title.png");
  }

  create() {
    const bg = this.add.image(150, 0, "title").setOrigin(0, 0);
    bg.setDisplaySize(500, 600);

    // スタート指示（点滅）
    const startText = this.add.text(400, 300, "Press SPACE to Start", {
      fontSize: "32px",
      color: "#fcf9f9ff",
      stroke: "#000",
      strokeThickness: 4
    }).setOrigin(0.5);

    this.tweens.add({
      targets: startText,
      alpha: { from: 1, to: 0.2 },
      duration: 700,
      yoyo: true,
      repeat: -1
    });

    // ベストスコア表示
    const best = localStorage.getItem("siwasu_best");
    if (best) {
      this.add.text(400, 350, `BEST SCORE: ${Number(best)}`, {
        fontSize: "22px",
        color: "#ffd700",
        fontStyle: "bold",
        stroke: "#000",
        strokeThickness: 3
      }).setOrigin(0.5);
    }

    // スペースキー入力
    this.input.keyboard?.on("keydown-SPACE", () => {
      this.scene.start("GameScene");
    });
    // スマホ対応
    this.input.on('pointerdown', () => {
      this.scene.start("GameScene");
    });

  }
}
