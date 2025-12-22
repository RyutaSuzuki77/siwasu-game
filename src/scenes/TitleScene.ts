import Phaser from "phaser";

export default class StartScene extends Phaser.Scene {
  private startText!: Phaser.GameObjects.Text;
  constructor() {
    super("StartScene");
  }
  preload() {
    this.load.image("title", "assets/images/background/title.png");
  }

  create() {
    const bg = this.add.image(150, 0, "title").setOrigin(0, 0);
    bg.setDisplaySize(500, 600);

    // スタート指示
    this.startText = this.add.text(400, 300, "Press SPACE to Start", {
      fontSize: "32px",
      color: "#fcf9f9ff"
    }).setOrigin(0.5);

    // スペースキー入力
    this.input.keyboard?.on("keydown-SPACE", () => {
      this.scene.start("GameScene");
    });
  }
}