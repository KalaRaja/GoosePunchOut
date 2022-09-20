import Phaser, { DOM } from 'phaser';
import GooseState from '../enums';
import GooseFactory from '../factory/GooseFactory';
import Goose from '../models/Goose';
import { getRandom } from '../utils';

const LEVELUP_PUNCH_COUNT = 10;
const LEVELUP_SPEED_INCREMENT = 30;
const LEVELUP_STAMINA_INCREMENT = 10;
const INITIAL_STAMINA = 20;
const MAX_GEESE = 10;
const MIN_STREAK = 3;

interface Metric {
  score: MetricDetail;
  stamina: MetricDetail;
  level: MetricDetail;
}

interface MetricDetail{
  value: number;
  label: string;
  gameObject: Phaser.GameObjects.Text;
  style: Phaser.Types.GameObjects.Text.TextStyle;
}

interface StreakSounds {
  monsterKill: Phaser.Sound.BaseSound;
  tripleKill: Phaser.Sound.BaseSound;
  dominating: Phaser.Sound.BaseSound;
  ultraKill: Phaser.Sound.BaseSound;
  ludicrousKill: Phaser.Sound.BaseSound;
  godlike: Phaser.Sound.BaseSound;
}

class Game extends Phaser.Scene {
  geese: Goose[];
  cursors: Phaser.Types.Input.Keyboard.CursorKeys;
  metric: Metric;
  punchCountPerLevel: number;
  punchSoundObject: Phaser.Sound.BaseSound;
  missedPunchSoundObject: Phaser.Sound.BaseSound;
  streakSoundObjects: StreakSounds;
  levelUpSoundObject: Phaser.Sound.BaseSound;
  streak: number;
  isGameOver: boolean;
  gameBackdrop: Phaser.GameObjects.Image;
  gameOverBakcdrop: Phaser.GameObjects.Image;
  gameOverSoundObject: Phaser.Sound.BaseSound;
  streakBorkenSoundObject: Phaser.Sound.BaseSound;

  constructor() {
    super('game');
    this.geese = [];
    this.isGameOver = false;

    this.metric = {
      score: {
        value: 0,
        label: "Score",
        gameObject: undefined,
        style:  {
          color: '#000000',
          fontSize: '48px'
        }
      },
      stamina: {
        value: INITIAL_STAMINA,
        label: "Stamina",
        gameObject: undefined,
        style:  {
          color: '#000000',
          fontSize: '48px'
        }
      },
      level: {
        value: 1,
        label: "Level",
        gameObject: undefined,
        style:  {
          color: '#000000',
          fontSize: '48px'
        }
      }
    };

    this.streakSoundObjects = {
      tripleKill: undefined,
      monsterKill: undefined,
      ultraKill: undefined,
      ludicrousKill: undefined,
      dominating: undefined,
      godlike: undefined
    };

    this.punchCountPerLevel = 0;
    this.streak = 0;
  }

  preload() { 
    GooseFactory.setupSprites(this);

    this.load.image('backdrop', './dist/assets/backdrop.jpg');
    this.load.image('backdropGameOver', './dist/assets/backdropgameover.jpg');
    
    this.load.audio('punch', './dist/assets/sfx/punch.wav');
    this.load.audio('missedPunch', './dist/assets/sfx/missedpunch.mp3');

    this.load.audio('levelUp', './dist/assets/sfx/levelup.mp3')
    
    this.load.audio('monsterKill', './dist/assets/sfx/streaks/monsterkill.mp3');
    this.load.audio('dominating', './dist/assets/sfx/streaks/dominating.mp3');
    this.load.audio('tripleKill', './dist/assets/sfx/streaks/triplekill.mp3');
    this.load.audio('ultraKill', './dist/assets/sfx/streaks/ultrakill.mp3');
    this.load.audio('ludicrousKill', './dist/assets/sfx/streaks/ludicrousKill.mp3');
    this.load.audio('godlike', './dist/assets/sfx/streaks/godlike.mp3');

    this.load.audio('gameOver', './dist/assets/sfx/gameover.mp3');

    this.load.audio('streakBroken', './dist/assets/sfx/ohno.mp3');
  }

  create() {
    this.gameBackdrop = this.add.image(this.sys.canvas.width / 2, this.sys.canvas.height / 2, 'backdrop').setInteractive();
    this.gameBackdrop.on('pointerdown', this.handleGooseMisclick.bind(this));

    this.gameOverBakcdrop = this.add.image(this.sys.canvas.width / 2, this.sys.canvas.height / 2, 'backdropGameOver').setInteractive();
    this.gameOverBakcdrop.on('pointerdown', this.handleGameOverScreenClick.bind(this));

    this.input.setDefaultCursor('url(./dist/assets/boxing.png), pointer');

    this.processGameStart();  

    this.cursors = this.input.keyboard.createCursorKeys();

    this.streakSoundObjects.tripleKill = this.sound.add('tripleKill');
    this.streakSoundObjects.monsterKill = this.sound.add('monsterKill');
    this.streakSoundObjects.ultraKill = this.sound.add('ultraKill');
    this.streakSoundObjects.dominating = this.sound.add('dominating');
    this.streakSoundObjects.ludicrousKill = this.sound.add('ludicrousKill');
    this.streakSoundObjects.godlike = this.sound.add('godlike');

    this.gameOverSoundObject = this.sound.add('gameOver');

    this.streakBorkenSoundObject = this.sound.add('streakBroken');

    this.levelUpSoundObject = this.sound.add('levelUp');

    this.punchSoundObject =  this.sound.add('punch');
    this.missedPunchSoundObject = this.sound.add('missedPunch');

    this.physics.world.setBoundsCollision(false, false, false, true);
    this.physics.world.on('worldbounds', this.handleWorldBoundCollision.bind(this));
    
    this.add.text(50, 10, this.metric.score.label.toString(), this.metric.score.style);
    this.add.text(50, 60, this.metric.stamina.label.toString(), this.metric.stamina.style);

    this.metric.score.gameObject = this.add.text(300, 10, this.metric.score.value.toString(), this.metric.score.style);
    this.metric.stamina.gameObject = this.add.text(300, 60, this.metric.stamina.value.toString(), this.metric.stamina.style);

    GooseFactory.createAnimations(this);
    this.geese = this.generateGeese(MAX_GEESE);
  }

  update(time: number, dt: number) {
    this.geese.forEach(Goose => Goose.animate(time, dt));
  }

  private handleWorldBoundCollision(body: any) {
    if (body.blocked.down) {
      const gooseToDestory = this.geese.find(goose => goose.id === body.gameObject.name);
      gooseToDestory?.destroy();
      this.geese = this.geese.filter(goose => goose !== gooseToDestory);
      this.geese.push(...this.generateGeese(1));
    }
  }

  private generateGeese(n: number): Goose[] {
    const geese = [];
    for (let i = 1; i<=n; i++) {
      const goose = GooseFactory.getGoose(
        {
          scene: this,
        }
      );

      this.setGooseInteractions(goose);
      goose.speed = { x: getRandom([50, 200]) + (this.metric.level.value * LEVELUP_SPEED_INCREMENT), y: 0 };
      goose.position = { x: 50, y: getRandom([10, this.sys.canvas.height]) };
      geese.push(goose);
    }
    return geese;
  }

  private setGooseInteractions(goose: Goose) {
    goose.physicsBody.on('pointerdown', () => this.handleGooseclick(goose));
  }

  private handleGooseMisclick() {
    if (this.streak >= MIN_STREAK) {
      this.streakBorkenSoundObject.play();
    }

    this.streak = 0;
    this.missedPunchSoundObject.play();
    this.metric.stamina.value -= 1;
    this.metric.stamina.gameObject.setText(this.metric.stamina.value.toString());

    if (this.metric.stamina.value <= 0 && !this.isGameOver) {
      this.processGameOver();
      this.isGameOver = true;
    }
  }

  private handleGooseclick(goose: Goose) {
    this.streak += 1;
    this.announceStreak();
    this.metric.score.value += this.metric.level.value;
    this.metric.score.gameObject.setText(this.metric.score.value.toString());
    this.punchCountPerLevel += 1;
    this.checkAndPerformLevelUp();
    goose.state = GooseState.DYING;
    this.punchSoundObject.play();
    goose.physicsBody.off('pointerdown');
  }

  private handleGameOverScreenClick() {
    this.isGameOver = false;
    this.metric.level.value = 1;
    this.metric.stamina.value = INITIAL_STAMINA;
    this.metric.score.value = 0;
    this.metric.score.gameObject.setText(this.metric.score.value.toString());

    this.geese.forEach(goose => {
      goose.speed = { x: goose.speed.x + this.metric.level.value * LEVELUP_SPEED_INCREMENT, y: 0 };
    });

    this.processGameStart();
  }

  private checkAndPerformLevelUp() {
    if (this.punchCountPerLevel >= LEVELUP_PUNCH_COUNT) {
      this.punchCountPerLevel = 0
      this.levelUpSoundObject.play();
      this.metric.level.value += 1;
      this.metric.stamina.value += LEVELUP_STAMINA_INCREMENT;
      this.metric.stamina.gameObject.setText(this.metric.stamina.value.toString());

      this.geese.forEach(goose => {
        goose.speed = { x: goose.speed.x + this.metric.level.value * LEVELUP_SPEED_INCREMENT, y: 0};
      });
    }
  }

  private announceStreak() {
    switch(this.streak) {
      case 3: this.streakSoundObjects.tripleKill.play(); break;
      case 7: this.streakSoundObjects.monsterKill.play(); break;
      case 11: this.streakSoundObjects.ultraKill.play(); break;
      case 15: this.streakSoundObjects.ludicrousKill.play(); break;
      case 19: this.streakSoundObjects.dominating.play(); break;
      case 24: this.streakSoundObjects.godlike.play(); break;
    }
  }

  private processGameOver() {
    this.gameOverSoundObject.play();
    this.geese.forEach(goose => goose.physicsBody.setVisible(false));
    this.gameBackdrop.setVisible(false);
    this.gameOverBakcdrop.setVisible(true);
  }

  private processGameStart() {
    this.geese.forEach(goose => goose.physicsBody.setVisible(true));
    this.gameBackdrop.setVisible(true);
    this.gameOverBakcdrop.setVisible(false);
  }
}

export default Game;
