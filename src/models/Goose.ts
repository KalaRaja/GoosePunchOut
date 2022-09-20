import GooseState from "../enums";
import GooseFactory from "../factory/GooseFactory";
import { Coordinate, Speed } from "../types/position";
import { v4 as uuidv4 } from 'uuid';
import { getRandom } from "../utils";

export interface GooseArgs {
    scene: Phaser.Scene;
};

export default class Goose {
    physicsBody?: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
    scene: Phaser.Scene;
    state: GooseState;
    timeOfDeath: number = 0;
    id: string;
    isDyingSfxPlaying: boolean;

    get speed(): Speed {
        return { x: this.physicsBody.body.velocity.x  , y: this.physicsBody.body.velocity.y };
    }

    set speed(speed: Speed) {
        this.physicsBody.setVelocity(speed.x, speed.y);
    }

    get position(): Coordinate {
        return { x: this.physicsBody.x, y: this.physicsBody.y };
    }

    set position(position: Coordinate) {
        this.physicsBody.setPosition(position.x, position.y);
    }

    constructor(args: GooseArgs) {
        this.scene = args.scene
        this.state = GooseState.FLYING;
        this.id = uuidv4();
        this.isDyingSfxPlaying = false;

        this.physicsBody = this.scene.physics.add.sprite(0, 0, GooseFactory.sprite).setInteractive().setName(this.id);
        this.physicsBody.body.allowGravity = false;
        this.physicsBody.setCollideWorldBounds(true);
        this.physicsBody.body.onWorldBounds = true;
        this.physicsBody.scale = 1.5;
    }



    public fly(): void {
        this.isDyingSfxPlaying = false;
        this.physicsBody.anims.play(GooseFactory.animation.flying, true);
        
        this.scene.physics.world.wrap(this.physicsBody.body.gameObject, 0);
    }

    public die(): void {
        this.physicsBody.anims.play(GooseFactory.animation.dying, true);
        if (!this.isDyingSfxPlaying) {
            const random = getRandom([0, GooseFactory.ouchSfxN]);
            GooseFactory.sfx.ouches[random].object.play();
            this.isDyingSfxPlaying = true;
        }
    }

    public fall(): void {
        this.isDyingSfxPlaying = false;
        this.physicsBody.anims.play(GooseFactory.animation.falling, true);
    }

    public animate(time: number, dt: number) {
        if (this.state === GooseState.DYING) {
            this.die();
            if (this.timeOfDeath < GooseFactory.MAX_TIME_DYING) {
                this.timeOfDeath += dt;
                this.physicsBody.body.allowGravity = true;
            } else {
                this.state = GooseState.FALLING;
            }
        }

        if (this.state === GooseState.FALLING) {
            this.physicsBody.body.allowGravity = true;
            this.fall();
        }

        if (this.state === GooseState.FLYING) {
            this.fly();
            this.physicsBody.body.allowGravity = false;
        }
    }

    public destroy() {
        this.physicsBody.disableBody(true, true);
        this.physicsBody.destroy();
    }
}