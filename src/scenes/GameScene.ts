import Phaser from "phaser";

export default class GameScene extends Phaser.Scene {
    private player!: Phaser.Physics.Arcade.Sprite;
    private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
    private obstacles!: Phaser.Physics.Arcade.Group;
    private score = 0;
    private scoreText!: Phaser.GameObjects.Text;
    private minRandomX = 0;
    private maxRoundomX = 750;

    constructor() {
        super("GameScene");
    }

    create() {
        // 背景色
        this.cameras.main.setBackgroundColor("#1e1e1e");

        // プレイヤー
        this.player = this.physics.add.sprite(100, 450, "player")
            .setCollideWorldBounds(true)
            .setGravityY(800);

        // 障害物グループ
        this.obstacles = this.physics.add.group();

        // スコア表示
        this.scoreText = this.add.text(20, 20, "Score: 0", {
            fontSize: "24px",
            color: "#fff"
        });

        // キー入力
        this.cursors = this.input.keyboard!.createCursorKeys();

        // 障害物生成ループ
        this.time.addEvent({
            delay: 1200,
            loop: true,
            callback: () => this.spawnObstacle()
        });

        // 当たり判定
        this.physics.add.collider(this.player, this.obstacles, () => {
            this.scene.restart();
        });
    }

    update() {
      this.player.setVelocityX(0);
      // ジャンプ
      if (this.cursors.up?.isDown && this.player.body!.blocked.down) {
        this.player.setVelocityY(-450);
      }
      // 右移動
      if (this.cursors.right?.isDown && this.player.body!.blocked.down) {
        this.player.setVelocityX(100);
      }
      // 左移動
      if (this.cursors.left?.isDown && this.player.body!.blocked.down) {
        this.player.setVelocityX(-100);
      }

      // スコア加算
      this.score += 1;
      this.scoreText.setText(`Score: ${this.score}`);
    }

    private spawnObstacle() {
      const types = ["work", "clean", "party"];
      const type = Phaser.Utils.Array.GetRandom(types);
      const rand = (Math.floor(Math.random() * (this.maxRoundomX - this.minRandomX + 1)) + this.minRandomX);

      const obstacle = this.obstacles.create(rand, 0, type) as Phaser.Physics.Arcade.Sprite;
      obstacle.setImmovable(true);
    }
}