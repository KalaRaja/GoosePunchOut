import Goose, { GooseArgs } from '../models/Goose';

interface Animation {
    flying: string;
    dying: string;
    falling: string;
};

interface sfxType {
    key: string;
    object: Phaser.Sound.BaseSound;
}

interface Sfx {
    ouches: sfxType[];
}


export default class GooseFactory {

    public static animation: Animation = { flying: 'gooseFlying', dying: 'gooseDying', falling: 'gooseFalling'};
    public static sprite: string = 'goose';

    public static sfx: Sfx = {
        ouches: [
            {key: 'ouch1', object: undefined},
            {key: 'ouch2', object: undefined},
            {key: 'ouch3', object: undefined},
            {key: 'ouch4', object: undefined},
            {key: 'ouch5', object: undefined},
            {key: 'ouch6', object: undefined},
            {key: 'ouch7', object: undefined},
        ]
    };

    static get ouchSfxN(): number {
        return this.sfx.ouches.length;
    };

    public static MAX_TIME_DYING = 500;
    
    public static setupSprites(scene: Phaser.Scene) {
        scene.load.spritesheet(this.sprite, 
        './dist/assets/goose/spritesheet.png',
        { frameWidth: 50, frameHeight: 38}
        );

        this.sfx.ouches.forEach(ouch => {
            scene.load.audio(ouch.key, `./dist/assets/sfx/ouch/${ouch.key}.mp3`);
        });
    }

    public static createAnimations(scene: Phaser.Scene) {
        scene.anims.create({
            key: this.animation.flying,
            frames: scene.anims.generateFrameNumbers(this.sprite, { start: 10, end: 14 }),
            frameRate: 10,
            repeat: Phaser.FOREVER
        });

        scene.anims.create({
            key: this.animation.dying,
            frames: scene.anims.generateFrameNumbers(this.sprite, { start: 0, end: 7 }),
            frameRate: 10,
            repeat: Phaser.FOREVER
        });

        scene.anims.create({
            key: this.animation.falling,
            frames: scene.anims.generateFrameNumbers(this.sprite, { start: 8, end: 9 }),
            frameRate: 10,
            repeat: Phaser.FOREVER
        });

        this.sfx.ouches.forEach(ouch => {
            ouch.object = scene.sound.add(ouch.key);
        });
    }

    public static getGoose(args: GooseArgs): Goose {
        return new Goose(args);
    }
}