import Phaser from "phaser";

export class GameOverScene extends Phaser.Scene {
  private score: number = 0;
  private idText!: Phaser.GameObjects.Text;
  private inputId: string = "";
  private rankingContainer!: Phaser.GameObjects.Container;
  private submitButton!: Phaser.GameObjects.Text;
  private submitText!: Phaser.GameObjects.Text;

  constructor() {
    super("GameOverScene");
  }

  init(data: { score: number }) {
    this.score = data.score;
  }

  create() {
    this.add.text(100, 50, `Your Score: ${this.score}`, {
      fontSize: "28px",
      color: "#fff"
    });

    // Id入力欄（Phaser 内）
    const input = document.getElementById("idInput") as HTMLInputElement;

    this.idText = this.add.text(100, 120, "Enter Id...", {
      fontSize: "20px",
      color: "#888",
      backgroundColor: "#000",
      padding: { left: 4, right: 4, top: 2, bottom: 2 }
    });

    // タップしたら input を表示
    this.idText.setInteractive().on("pointerdown", () => {
      input.style.display = "block";
      input.focus();
      input.value = this.inputId;
    });

    input.addEventListener("input", () => {
      this.inputId = input.value;
      this.idText.setText(this.inputId || "Enter Id...");
    });

    input.addEventListener("blur", () => {
      input.style.top = "-1000px";
      input.style.left = "-1000px";
    });

    this.input.on("pointerdown", (_pointer: Phaser.Input.Pointer, currentlyOver: Phaser.GameObjects.GameObject[]) => {
      // idText をタップしたときは blur しない
      if (currentlyOver.includes(this.idText)) return;

      input.blur();
    });

    // Submit ボタン
    this.submitButton = this.add.text(100, 170, "[ Submit Score ]", {
      fontSize: "22px",
      color: "#ff0"
    })
      .setInteractive()
      .on("pointerdown", () => this.submitScore());

    // ランキング表示用コンテナ
    this.rankingContainer = this.add.container(0, 0);

    // Play Again
    this.add.text(100, 550, "Play Again", {
      fontSize: "24px",
      color: "#0f0"
    })
      .setInteractive()
      .on("pointerdown", () => {
        this.scene.start("TitleScene");
      });
  }

  async submitScore() {
    this.submitButton.disableInteractive();
    this.submitText = this.add.text(100, 250, `Submitting...`, {
      fontSize: "28px",
      color: "#500dfbff"
    });
    const id = this.inputId || "Anonymous";

    await fetch("https://14ifr6yz83.execute-api.us-east-1.amazonaws.com/dev/scores", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, score: String(this.score).padStart(6, "0") }) // 6桁ゼロ埋め(あまり良くないがString型でカラム定義してソート出来ないから仕方ない)
    });

    this.loadRanking();
  }

  async loadRanking() {
    const res = await fetch("https://14ifr6yz83.execute-api.us-east-1.amazonaws.com/dev/scores");
    const scores = await res.json();

    this.submitText.destroy();

    // 前回のランキングを消す
    this.rankingContainer.removeAll(true);

    this.add.text(100, 220, "--- Ranking ---", {
      fontSize: "22px",
      color: "#fff"
    });

    scores
      .forEach((s: any, i: number) => {
        const t = this.add.text(
          100,
          260 + i * 24,
          `${i + 1}. ${s.id}: ${Number(s.score)}`,
          { fontSize: "18px", color: "#fff" }
        );
        this.rankingContainer.add(t);
      });
  }
}