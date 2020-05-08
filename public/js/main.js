'use strict';

//import TestGameScene from "./testGameScene.js";
const TestGameScene = require("./testGameScene.js");

const width = 800;
const config = {
    type: Phaser.AUTO,
    width: width,
    height: 600,
    /*physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 800 },//1000 },
            debug: false
        }
    },*/
    input: {
        gamepad: true
    },
    pixelArt: true,
    roundPixels: true,
    scene: new TestGameScene(),
    parent: document.getElementById('parent')
};

const game = new Phaser.Game(config);
