'use strict';

const Engine = require("../../shared/physics/Engine.js");
const Vec2 = require("../../shared/physics/Vec2.js");

module.exports = class TestGameScene extends Phaser.Scene {
    preload() {
        this.load.image("tiles", "assets/MarioTilesetMin.png");
        this.load.tilemapTiledJSON("map", "assets/map_2.json");

        this.load.image('star', 'assets/star.png');
        this.load.image('bomb', 'assets/bomb.png');

        this.load.spritesheet('smallmario', 'assets/SmallMarioSpritesheet.png', {
            frameWidth: 16,
            frameHeight: 16
        });
        this.load.spritesheet('bigmario', 'assets/BigMarioSpritesheet.png', {
            frameWidth: 16,
            frameHeight: 32
        });
        // this.engine = new Engine();
    }

    create() {
        // Input
        this.input.gamepad.once('down', (pad) => {
            console.log('Controller detected.');
            this.pad = pad;
        }, this);
        this.cursors = this.input.keyboard.createCursorKeys();
        this.keySpace = this.input.keyboard.addKey('space');

        this.players = {};

        const obstacle = this.add.sprite(400, 400, 'bomb');
        obstacle.setDisplaySize(128, 128);

        // Networking
        this.socket = io();

        this.socket.on('init', data => {
            console.log('init');
            for(let id in data) {
                const x = data.x;
                const y = data.y;
                //const sprite = this.add.sprite(x + 8, y + 16, 'bigmario');
                const sprite = this.add.sprite(x, y, 'bomb');
                sprite.setDisplaySize(64, 64);
                this.players[id] = sprite;
                if(id === this.socket.id) {
                    this.playerSprite = sprite;
                    // this.cameras.main.startFollow(this.playerSprite, true, 0.1);
                }	
            }
        });

        this.socket.on('newPlayer', data => {
            console.log('newPlayer');
            const x = data.x;
            const y = data.y;
            //this.players[data.id] = this.add.sprite(x + 8, y + 16, 'bigmario');
            this.players[data.id] = this.add.sprite(x, y, 'bomb');
            this.players[data.id].setDisplaySize(64, 64);
        });

        this.socket.on('removePlayer', playerId => {
            console.log('removePlayer');
            this.players[playerId].destroy();
        });

        this.socket.on('state', data => {
            /*if(this.player && this.playerSprite) {
                this.player.position.x = data.x;
                this.player.position.y = data.y;
                this.playerSprite.x = data.x + this.player.width / 2;
                this.playerSprite.y = data.y + this.player.height / 2;
            }*/
            for(let id in data) {
                if(id in this.players) {
                    this.players[id].x = data[id].x + 8;
                    this.players[id].y = data[id].y + 16;
                }
            }
        });

        /*
        this.physicsObject1 = this.engine.add.AABB(new Vec2(0, 0), new Vec2(16, 32), { velocity: new Vec2(0.01, 0.01) });
        this.physSprite = this.add.sprite(8, 16, 'bigmario');
        this.physicsObject2 = this.engine.add.AABB(new Vec2(100, 100), new Vec2(116, 116));
        //this.cameras.main.startFollow(this.physSprite, true, 0.1);
        this.physSprite2 = this.add.sprite(108, 108, 'smallmario');
        this.engine.add.collider(this.physicsObject1, this.physicsObject2);
*/
        //engine.on('postUpdate', engine.render);
        
    }

    update() {
        const cursors = this.cursors;
        const pad = this.pad;
        const input = {
            left: false,
            right: false,
            up: false,
            down: false
        };
        if (cursors.left.isDown || (pad && pad.left)) {
            input.left = true;
        }
        if (cursors.right.isDown || (pad && pad.right)) {
            input.right = true;
        }
        if (cursors.up.isDown || (pad && pad.up)) {
            input.up = true;
        }
        if (cursors.down.isDown || (pad && pad.down)) {
            input.down = true;
        }
        this.socket.emit('input', input);
    }
}