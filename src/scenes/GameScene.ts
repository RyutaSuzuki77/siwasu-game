import Phaser from "phaser";

export default class GameScene extends Phaser.Scene {
    private player!: Phaser.Physics.Arcade.Sprite;
    private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
    private obstacles!: Phaser.Physics.Arcade.Group;
    private score = 0;
    private scoreText!: Phaser.GameObjects.Text;
    private timerText!: Phaser.GameObjects.Text;
    private minRandomX = 0;
    private maxRandomX = 750;
    private dayCount = 0;
    private day = 1;
    private spawnDelay = 800;
    private sunrise!: Phaser.GameObjects.Image;

    constructor() {
      super("GameScene");
    }

    preload() {
      this.load.image("sea", "assets/images/background/sea.png");
      this.load.image("sunrise", "assets/images/background/sunrise.png");
      this.load.image("snow", "assets/images/background/snow.png");
      this.load.image("clean", "assets/images/object/clean.png");
      this.load.image("work", "assets/images/object/work.png");
      this.load.image("party", "assets/images/object/party.png");
      this.load.image("bomb", "assets/images/object/bomb.png");
      this.load.image("player_front", "assets/images/player/playerFront.png");
      this.load.spritesheet("player_run", "assets/images/player/playerRun.png", {
        frameWidth: 205,
        frameHeight: 280
      });
      this.load.audio("game_bgm", "assets/sounds/bgm/gameBgm.mp3");
      this.load.audio("get_item", "assets/sounds/effects/get.mp3");
      this.load.audio("bomb", "assets/sounds/effects/bomb.mp3");
    }

    create() {
      // 初期化
      this.day = 1;
      this.dayCount = 0;
      this.score = 0;
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
      const snow = this.add.particles(0, 0, "snow", {
        x: { min: 0, max: 800 },
        y: 0,
        lifespan: 5000,
        speedY: { min: 50, max: 120 },
        scale: { start: 0.01, end: 0 },
        quantity: 2
      });

      // プレイヤー
      this.player = this.physics.add.sprite(400, 800, "player_run")
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
          this.dayCount++;
          if (this.dayCount === 2) {
            this.day++;
            this.dayCount = 0;
          }

          if (this.day === 32) {
            this.tweens.add({
              targets: this.sunrise,
              alpha: 1,
              duration: 1000
            });
            snow.setVisible(false);
          }

          if (this.day >= 32) {
            return;
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
        delay: this.spawnDelay,
        callback: () => this.spawnObstacle(),
        loop: false
      });

      // 当たり判定
      this.physics.add.collider(this.player, this.obstacles, (_player, obstacle) => {
        const sprite = obstacle as Phaser.Physics.Arcade.Sprite;
        const key = sprite.texture.key;

        switch (key) {
          case "work":
            this.score += 1;
            this.sound.add("get_item", { loop: false, volume: 0.6 }).play();
            break;
          case "clean":
            this.score += 2;
            this.sound.add("get_item", { loop: false, volume: 0.6 }).play();
            break;
          case "party":
            this.score += 3;
            this.sound.add("get_item", { loop: false, volume: 0.6 }).play();
            break;
          case "bomb":
            this.sound.add("bomb", { loop: false, volume: 1 }).play();
            bgm.stop();
            this.scene.start("GameOverScene", { score: this.score });
            break;
        }
        obstacle.destroy();
        this.scoreText.setText(`Score: ${this.score}`);
      });
    }

    update() {
      this.player.setVelocityX(0);
      // 右移動
      if (this.cursors.right?.isDown && this.player.body!.blocked.down) {
        this.player.anims.play("player_run", true);
        this.player.setFlipX(false);
        this.player.setVelocityX(500);
        return;
      }
      // 左移動
      if (this.cursors.left?.isDown && this.player.body!.blocked.down) {
        this.player.anims.play("player_run", true);
        this.player.setFlipX(true);
        this.player.setVelocityX(-500);
        return;
      }

      this.player.anims.stop();
      this.player.setTexture("player_front");
      this.player.setFlipX(false);
    }

    private spawnObstacle() {
      const types = ["work", "clean", "party", "bomb"];
      const type = Phaser.Utils.Array.GetRandom(types);
      const rand = (Math.floor(Math.random() * (this.maxRandomX - this.minRandomX + 1)) + this.minRandomX);

      const obstacle = this.obstacles.create(rand, 0, type) as Phaser.Physics.Arcade.Sprite;

      obstacle
        .setOrigin(0.5, 1)
        .setScale(0.8)
        .setImmovable(true)
        .setVelocityY(50 * this.day)
        .setSize(20, 20).setOffset(30, 30);

      const nextDelay = Math.max(200, this.spawnDelay - this.day * 20);

      this.time.addEvent({
        delay: nextDelay,
        callback: () => this.spawnObstacle(),
        loop: false
      });

    }
}