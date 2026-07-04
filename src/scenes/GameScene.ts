import Phaser from "phaser";

export default class GameScene extends Phaser.Scene {
    private player!: Phaser.Physics.Arcade.Sprite;
    private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
    private obstacles!: Phaser.Physics.Arcade.Group;
    private score = 0;
    private scoreText!: Phaser.GameObjects.Text;
    private timerText!: Phaser.GameObjects.Text;
    private comboText!: Phaser.GameObjects.Text;
    private minRandomX = 0;
    private maxRandomX = 750;
    private dayCount = 0;
    private day = 1;
    private spawnDelay = 800;
    // 落下速度 = base + perDay * 日数
    private fallSpeedBase = 100;
    private fallSpeedPerDay = 27;
    private combo = 0;
    private isGameOver = false;
    private newYearReached = false;
    private clone!: Phaser.Physics.Arcade.Sprite;
    private cloneActive = false;
    private cloneTimer?: Phaser.Time.TimerEvent;
    private cloneBlinkTimer?: Phaser.Time.TimerEvent;
    private sunrise!: Phaser.GameObjects.Image;
    private bgm!: Phaser.Sound.BaseSound;
    private isTouching = false;
    private touchX = 0;

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
      this.combo = 0;
      this.isGameOver = false;
      this.newYearReached = false;
      this.cloneActive = false;
      // BGM
      this.bgm = this.sound.add("game_bgm", { loop: true, volume: 0.6 });
      this.bgm.play();

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

      // 鏡餅テクスチャ（アセットがないので動的生成）
      this.createMochiTexture();

      // 分身（お餅を取ると出現。普段は無効化して非表示）
      this.clone = this.physics.add.sprite(400, 800, "player_run")
        .setCollideWorldBounds(true)
        .setScale(0.5)
        .setOrigin(0.5, 1)
        .setGravityY(800)
        .setFrame(0)
        .setTint(0xaaffee)
        .setAlpha(0)
        .setVisible(false);
      (this.clone.body as Phaser.Physics.Arcade.Body).enable = false;

      // 障害物グループ
      this.obstacles = this.physics.add.group();

      // タイマー表示
      this.timerText = this.add.text(620, 20, "Time: 12/1", {
        fontSize: "24px",
        color: "#fff",
        stroke: "#000",
        strokeThickness: 3
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

          if (this.day === 32 && !this.newYearReached) {
            this.newYearReached = true;
            this.tweens.add({
              targets: this.sunrise,
              alpha: 1,
              duration: 1000
            });
            snow.setVisible(false);
            this.timerText.setText("Time: 1/1");
            this.celebrateNewYear();
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
        color: "#fff",
        stroke: "#000",
        strokeThickness: 3
      });

      // コンボ表示（画面上部中央）
      this.comboText = this.add.text(400, 20, "", {
        fontSize: "26px",
        color: "#fff",
        fontStyle: "bold",
        stroke: "#000",
        strokeThickness: 4
      }).setOrigin(0.5, 0);

      // キー入力
      this.cursors = this.input.keyboard!.createCursorKeys();

      // 障害物生成ループ
      this.time.addEvent({
        delay: this.spawnDelay,
        callback: () => this.spawnObstacle(),
        loop: false
      });

      // 当たり判定（本体）
      this.physics.add.collider(this.player, this.obstacles, (_player, obstacle) => {
        if (this.isGameOver) return;

        const sprite = obstacle as Phaser.Physics.Arcade.Sprite;

        if (sprite.texture.key === "bomb") {
          this.hitBomb(sprite);
          return;
        }
        this.collectItem(sprite);
      });

      // 当たり判定（分身）: 爆弾は身代わりになって防ぐ
      this.physics.add.collider(this.clone, this.obstacles, (_clone, obstacle) => {
        if (this.isGameOver || !this.cloneActive) return;

        const sprite = obstacle as Phaser.Physics.Arcade.Sprite;

        if (sprite.texture.key === "bomb") {
          sprite.destroy();
          this.sound.play("bomb", { volume: 0.5 });
          this.deactivateClone(true);
          return;
        }
        this.collectItem(sprite);
      });

      // スマホ対応
      this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
        this.isTouching = true;
        this.touchX = pointer.x;
      });
      this.input.on('pointerup', () => {
        this.isTouching = false;
      });
    }

    update() {
      if (this.isGameOver) return;

      this.handleMovement();

      // 分身は本体と左右対称（ミラー）に動く
      if (this.cloneActive) {
        this.clone.setX(800 - this.player.x);
        this.clone.setFlipX(!this.player.flipX);
        if (this.player.anims.isPlaying) {
          this.clone.anims.play("player_run", true);
        } else {
          this.clone.anims.stop();
          this.clone.setTexture("player_front");
        }
      }

      // 画面外に出た障害物を削除（取り逃しはコンボリセット）
      this.obstacles.children.each((obj) => {
        const obstacle = obj as Phaser.Physics.Arcade.Sprite;

        if (obstacle.y > 650) {
          if (obstacle.texture.key !== "bomb" && this.combo > 0) {
            this.combo = 0;
            this.comboText.setText("");
          }
          obstacle.destroy();
        }

        return true;
      });
    }

    private handleMovement() {
      this.player.setVelocityX(0);
      // 右移動
      if (this.cursors.right?.isDown) {
        this.movePlayer("Right");
        return;
      }
      // 左移動
      if (this.cursors.left?.isDown) {
        this.movePlayer("Left");
        return;
      }

      if (this.isTouching) {
        if (this.touchX > this.scale.width / 2) {
          this.movePlayer("Right");
        } else {
          this.movePlayer("Left");
        }
        return;
      }

      this.player.anims.stop();
      this.player.setTexture("player_front");
      this.player.setFlipX(false);
    }

    private collectItem(sprite: Phaser.Physics.Arcade.Sprite) {
      const key = sprite.texture.key;
      const isGold = sprite.getData("gold") === true;

      let base: number;
      if (key === "mochi") {
        base = 5;
        this.activateClone();
      } else {
        base = key === "work" ? 1 : key === "clean" ? 2 : 3;
      }
      if (isGold) base = 10;

      // コンボが続くほど倍率アップ
      this.combo++;
      const mult = this.getComboMultiplier();
      const points = base * mult;
      this.score += points;

      this.sound.play("get_item", { volume: 0.6 });
      this.showScorePopup(sprite.x, sprite.y - 40, points, isGold || key === "mochi" || mult >= 2);
      this.updateComboText();

      sprite.destroy();
      this.scoreText.setText(`Score: ${this.score}`);
    }

    private createMochiTexture() {
      if (this.textures.exists("mochi")) return;
      const g = this.add.graphics();
      // 三方（台）
      g.fillStyle(0xcc8844);
      g.fillRect(10, 52, 50, 12);
      // 餅（下・上）
      g.fillStyle(0xffffff);
      g.fillEllipse(35, 44, 52, 26);
      g.fillEllipse(35, 28, 38, 20);
      // みかん＋葉
      g.fillStyle(0xff9900);
      g.fillCircle(35, 13, 9);
      g.fillStyle(0x338833);
      g.fillRect(31, 1, 8, 5);
      g.generateTexture("mochi", 70, 70);
      g.destroy();
    }

    private activateClone() {
      const body = this.clone.body as Phaser.Physics.Arcade.Body;

      // 効果中に再取得したら延長
      this.cloneTimer?.remove();
      this.cloneBlinkTimer?.remove();
      this.tweens.killTweensOf(this.clone);

      if (!this.cloneActive) {
        this.cloneActive = true;
        body.enable = true;
        this.clone.setPosition(800 - this.player.x, this.player.y);
      }
      this.clone.setVisible(true);
      this.clone.setAlpha(0.75);

      const label = this.add.text(this.player.x, this.player.y - 160, "分身！！", {
        fontSize: "36px",
        color: "#aaffee",
        fontStyle: "bold",
        stroke: "#000",
        strokeThickness: 5
      }).setOrigin(0.5);
      this.tweens.add({
        targets: label,
        y: label.y - 50,
        alpha: 0,
        duration: 1000,
        ease: "Cubic.easeOut",
        onComplete: () => label.destroy()
      });

      // 残り2秒で点滅して終了予告
      this.cloneBlinkTimer = this.time.delayedCall(8000, () => {
        this.tweens.add({
          targets: this.clone,
          alpha: 0.15,
          yoyo: true,
          repeat: -1,
          duration: 150
        });
      });
      this.cloneTimer = this.time.delayedCall(10000, () => this.deactivateClone(false));
    }

    private deactivateClone(sacrificed: boolean) {
      if (!this.cloneActive) return;
      this.cloneActive = false;

      this.cloneTimer?.remove();
      this.cloneBlinkTimer?.remove();
      this.tweens.killTweensOf(this.clone);
      (this.clone.body as Phaser.Physics.Arcade.Body).enable = false;

      if (sacrificed) {
        // 身代わり演出
        this.cameras.main.shake(200, 0.008);
        const label = this.add.text(this.clone.x, this.clone.y - 160, "身代わり！！", {
          fontSize: "36px",
          color: "#ffd700",
          fontStyle: "bold",
          stroke: "#000",
          strokeThickness: 5
        }).setOrigin(0.5);
        this.tweens.add({
          targets: label,
          y: label.y - 50,
          alpha: 0,
          duration: 1000,
          ease: "Cubic.easeOut",
          onComplete: () => label.destroy()
        });
      }

      this.tweens.add({
        targets: this.clone,
        alpha: 0,
        duration: sacrificed ? 150 : 400,
        onComplete: () => this.clone.setVisible(false)
      });
    }

    private getComboMultiplier() {
      if (this.combo >= 15) return 3;
      if (this.combo >= 5) return 2;
      return 1;
    }

    private updateComboText() {
      if (this.combo < 2) {
        this.comboText.setText("");
        return;
      }
      const mult = this.getComboMultiplier();
      this.comboText.setText(mult > 1 ? `${this.combo} COMBO! x${mult}` : `${this.combo} COMBO!`);
      this.comboText.setColor(mult >= 3 ? "#ff6b6b" : mult >= 2 ? "#ffd700" : "#ffffff");
      this.comboText.setScale(1.3);
      this.tweens.add({
        targets: this.comboText,
        scale: 1,
        duration: 150
      });
    }

    private showScorePopup(x: number, y: number, points: number, special: boolean) {
      const popup = this.add.text(x, y, `+${points}`, {
        fontSize: special ? "30px" : "22px",
        color: special ? "#ffd700" : "#ffffff",
        fontStyle: "bold",
        stroke: "#000",
        strokeThickness: 3
      }).setOrigin(0.5);

      this.tweens.add({
        targets: popup,
        y: y - 50,
        alpha: 0,
        duration: 700,
        ease: "Cubic.easeOut",
        onComplete: () => popup.destroy()
      });
    }

    private celebrateNewYear() {
      // 大晦日を生き延びたボーナス
      this.score += 100;
      this.scoreText.setText(`Score: ${this.score}`);
      this.showScorePopup(400, 300, 100, true);

      const ny = this.add.text(400, 220, "HAPPY NEW YEAR!", {
        fontSize: "48px",
        color: "#ffd700",
        fontStyle: "bold",
        stroke: "#000",
        strokeThickness: 6
      }).setOrigin(0.5).setScale(0);

      this.tweens.add({
        targets: ny,
        scale: 1,
        duration: 600,
        ease: "Back.easeOut",
        onComplete: () => {
          this.time.delayedCall(2000, () => {
            this.tweens.add({
              targets: ny,
              alpha: 0,
              duration: 800,
              onComplete: () => ny.destroy()
            });
          });
        }
      });
    }

    private hitBomb(bomb: Phaser.Physics.Arcade.Sprite) {
      this.isGameOver = true;
      bomb.destroy();

      this.sound.play("bomb", { volume: 1 });
      this.bgm.stop();

      // 爆発演出：シェイク＋赤フラッシュ＋静止
      this.cameras.main.shake(400, 0.02);
      this.cameras.main.flash(300, 255, 60, 60);
      this.player.setTint(0xff4444);
      this.player.anims.stop();
      this.physics.pause();

      this.time.delayedCall(800, () => {
        this.scene.start("GameOverScene", { score: this.score });
      });
    }

    private spawnObstacle() {
      if (this.isGameOver) return;

      const types = ["work", "clean", "party", "bomb"];
      // 5%で鏡餅（取ると分身）
      const type = Math.random() < 0.05 ? "mochi" : Phaser.Utils.Array.GetRandom(types);
      const rand = (Math.floor(Math.random() * (this.maxRandomX - this.minRandomX + 1)) + this.minRandomX);

      const obstacle = this.obstacles.create(rand, 0, type) as Phaser.Physics.Arcade.Sprite;

      obstacle
        .setOrigin(0.5, 1)
        .setScale(0.8)
        .setImmovable(true)
        .setVelocityY(this.fallSpeedBase + this.fallSpeedPerDay * this.day)
        .setSize(20, 20).setOffset(30, 30);

      // 低確率でゴールデンアイテム（+10点）
      if (type !== "bomb" && type !== "mochi" && Math.random() < 0.08) {
        obstacle.setData("gold", true);
        obstacle.setTint(0xffd700);
        this.tweens.add({
          targets: obstacle,
          alpha: { from: 1, to: 0.5 },
          yoyo: true,
          repeat: -1,
          duration: 200
        });
      }

      const nextDelay = Math.max(200, this.spawnDelay - this.day * 20);

      this.time.addEvent({
        delay: nextDelay,
        callback: () => this.spawnObstacle(),
        loop: false
      });
    }

    private movePlayer(direction: "Left" | "Right") {
      this.player.anims.play("player_run", true);
      if (direction === "Left") {
        this.player.setFlipX(true);
        this.player.setVelocityX(-500);
      } else if (direction === "Right") {
        this.player.setFlipX(false);
        this.player.setVelocityX(500);
      }
    }
}
