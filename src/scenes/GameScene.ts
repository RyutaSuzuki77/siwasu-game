import Phaser from "phaser";

export default class GameScene extends Phaser.Scene {
    private player!: Phaser.Physics.Arcade.Sprite;
    private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
    private obstacles!: Phaser.Physics.Arcade.Group;
    private score = 0;
    private scoreText!: Phaser.GameObjects.Text;
    private timerText!: Phaser.GameObjects.Text;
    private minRandomX = 0;
    private maxRoundomX = 750;
    private dayTime: number;
    private day: number;
    private sunrise!: Phaser.GameObjects.Image;

    constructor() {
        super("GameScene");
        this.dayTime = 0;
        this.day = 1;
    }

    preload() {
      this.load.image("sea", "assets/images/background/sea.png");
      this.load.image("sunrise", "assets/images/background/sunrise.png");
      this.load.image("snow", "assets/images/background/snow.png");
      this.load.image("player_front", "assets/images/player/playerFront.png");
      this.load.spritesheet("player_run", "assets/images/player/playerRun.png", {
        frameWidth: 205,
        frameHeight: 280
      });
      this.load.audio("game_bgm", "assets/bgm/gameBgm.mp3");
    }

    create() {
      // BGM
      const bgm = this.sound.add("game_bgm", { loop: true, volume: 0.6 });
      bgm.play();

      // 背景
      const bg = this.add.image(0, 0, "sea").setOrigin(0, 0);
      bg.setDisplaySize(800, 600);

      this.sunrise = this.add.image(0, 0, "sunrise").setOrigin(0, 0);
      this.sunrise.setDisplaySize(800, 600);
      this.sunrise.setAlpha(0);

      // 雪のエフェクト
      this.add.particles(0, 0, "snow", {
        x: { min: 0, max: 800 },
        y: 0,
        lifespan: 5000,
        speedY: { min: 50, max: 120 },
        scale: { start: 0.01, end: 0 },
        quantity: 2
      });

      // プレイヤー
      this.player = this.physics.add.sprite(100, 400, "player_run")
        .setCollideWorldBounds(true)
        .setScale(0.5)
        .setOrigin(0.5, 1)
        .setGravityY(800)
        .setFrame(0);

      this.anims.create({
        key: "player_run",
        frames: this.anims.generateFrameNumbers("player_run", { start: 0, end: 3 }),
        frameRate: 8,
        repeat: -1
      });

      // 障害物グループ
      this.obstacles = this.physics.add.group();

      // タイマー表示
      this.timerText = this.add.text(620, 20, "Time: 12/1", {
        fontSize: "24px",
        color: "#fff"
      });

      this.time.addEvent({
        delay: 1000,
        loop: true,
        callback: () => {
          this.dayTime++;
          if (this.dayTime === 2) {
            this.day++;
            this.dayTime = 0;
          }

          if (this.day === 32) {
            this.tweens.add({
              targets: this.sunrise,
              alpha: 1,
              duration: 1000
            });
            return;
            // this.scene.restart();
          }
          this.timerText.setText(`Time: 12/${this.day}`);
        }
      });

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
        this.score += 1;
        this.obstacles.clear(true, true);
        this.scoreText.setText(`Score: ${this.score}`);
      });
    }

    update() {
      this.player.setVelocityX(0);
      // 右移動
      if (this.cursors.right?.isDown && this.player.body!.blocked.down) {
        this.player.anims.play("player_run", true);
        this.player.setFlipX(false);
        this.player.setVelocityX(300);
        return;
      }
      // 左移動
      if (this.cursors.left?.isDown && this.player.body!.blocked.down) {
        this.player.anims.play("player_run", true);
        this.player.setFlipX(true);
        this.player.setVelocityX(-300);
        return;
      }

      this.player.anims.stop();
      this.player.setTexture("player_front");
      this.player.setFlipX(false);
    }

    private spawnObstacle() {
      const types = ["work", "clean", "party"];
      const type = Phaser.Utils.Array.GetRandom(types);
      const rand = (Math.floor(Math.random() * (this.maxRoundomX - this.minRandomX + 1)) + this.minRandomX);

      const obstacle = this.obstacles.create(rand, 0, type) as Phaser.Physics.Arcade.Sprite;
      obstacle.setImmovable(true);
    }
}