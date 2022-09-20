import Phaser from 'phaser';

export default {
    type: Phaser.AUTO,
    parent: 'game',
    width: 1366,
    height: 768,
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 400 },
            debug: false
        }
    },
   scale: {
        autoCenter: Phaser.Scale.CENTER_BOTH
    },
    audio: {
        disableWebAudio: true
    }
};