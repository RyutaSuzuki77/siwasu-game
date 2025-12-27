import Phaser from "phaser";

export class GameOverScene extends Phaser.Scene {
  private score: number = 0;
  private idText!: Phaser.GameObjects.Text;
  private inputId: string = "";
  private rankingContainer!: Phaser.GameObjects.Container;
  private submitButton!: Phaser.GameObjects.Text;

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
    this.add.text(100, 120, "Id:", { fontSize: "20px", color: "#fff" });

    this.idText = this.add.text(180, 120, "Enter Id...", {
      fontSize: "20px",
      color: "#888", // placeholder っぽい薄い色
      backgroundColor: "#000",
      padding: { left: 4, right: 4, top: 2, bottom: 2 }
    });

    // キーボード入力
    let isPlaceholder = true;

    this.input.keyboard!.on("keydown", (e: KeyboardEvent) => {
      if (isPlaceholder) {
        this.idText.setText("");
        this.idText.setColor("#0f0");
        isPlaceholder = false;
      }

      if (e.key === "Backspace") {
        this.inputId = this.inputId.slice(0, -1);
      } else if (e.key.length === 1) {
        this.inputId += e.key;
      }

      this.idText.setText(this.inputId);
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
    this.add.text(100, 450, "Play Again", {
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
    const id = this.inputId || "Anonymous";

    await fetch("https://kfolcvadjl.execute-api.us-east-1.amazonaws.com/dev/scores", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, score: this.score })
    });

    this.loadRanking();
  }

  async loadRanking() {
    const res = await fetch("https://kfolcvadjl.execute-api.us-east-1.amazonaws.com/dev/scores");
    const scores = await res.json();

    // 前回のランキングを消す
    this.rankingContainer.removeAll(true);

    this.add.text(100, 220, "--- Ranking ---", {
      fontSize: "22px",
      color: "#fff"
    });

    scores
      .sort((a: any, b: any) => b.score - a.score)
      .slice(0, 10)
      .forEach((s: any, i: number) => {
        const t = this.add.text(
          100,
          260 + i * 24,
          `${i + 1}. ${s.id}: ${s.score}`,
          { fontSize: "18px", color: "#fff" }
        );
        this.rankingContainer.add(t);
      });
  }
}