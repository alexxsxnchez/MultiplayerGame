'use strict';

module.exports = class TestGameScene extends Phaser.Scene {
    preload() {
        this.load.image("tiles", "assets/MarioTilesetMin.png");
        this.load.tilemapTiledJSON("map", "assets/map_2.json");

        this.load.image('star', 'assets/star.png');
        this.load.image('bomb', 'assets/bomb.png');
        this.load.image('wall', 'assets/platform.png');

        this.load.spritesheet('smallmario', 'assets/SmallMarioSpritesheet.png', {
            frameWidth: 16,
            frameHeight: 16
        });
        this.load.spritesheet('bigmario', 'assets/BigMarioSpritesheet.png', {
            frameWidth: 16,
            frameHeight: 32
        });
    }

    create() {
        // Input
        this.input.gamepad.once('down', (pad) => {
            console.log('Controller detected.');
            this.pad = pad;
        }, this);
        this.cursors = this.input.keyboard.createCursorKeys();
        this.keySpace = this.input.keyboard.addKey('space');

        // Networking
        this.socket = io();

        this.socket.on('init', data => {
            console.log('init');
            this.players = {};
            this.obstacles = {};
            this.circles = {};
            const players = data["players"];
            for(let id in players) {
                const player = players[id];
                const sprite = this.add.sprite(player.x + 8, player.y + 16, 'bigmario');
                this.players[id] = sprite;
                if(id === this.socket.id) {
                    this.playerSprite = sprite;
                    // this.cameras.main.startFollow(this.playerSprite, true, 0.1);
                }	
            }
            const obstacles = data["obstacles"];
            for(let id in obstacles) {
                const obstacle = obstacles[id];
                const color = Phaser.Display.Color.RandomRGB().color;
                const rectangle = this.add.rectangle(obstacle.x, obstacle.y, obstacle.width, obstacle.height, color);
                this.obstacles[id] = rectangle;
            }
            const circles = data["circles"];
            for(let id in circles) {
                const circle = circles[id];
                const color = Phaser.Display.Color.RandomRGB().color;
                const circleShape = this.add.circle(circle.x, circle.y, circle.radius, color);
                this.circles[id] = circleShape;
            }
        });

        this.socket.on('newPlayer', data => {
            console.log('newPlayer');
            this.players[data.id] = this.add.sprite(data.x + 8, data.y + 16, 'bigmario');
        });

        this.socket.on('removePlayer', playerId => {
            console.log('removePlayer');
            this.players[playerId].destroy();
        });

        this.socket.on('state', data => {
            const players = data["players"];
            for(let id in players) {
                if(id in this.players) {
                    this.players[id].x = players[id].x + 8;
                    this.players[id].y = players[id].y + 16;
                }
            }
            const obstacles = data["obstacles"];
            for(let id in obstacles) {
                if(id in this.obstacles) {
                    this.obstacles[id].x = obstacles[id].x + obstacles[id].width / 2;
                    this.obstacles[id].y = obstacles[id].y + obstacles[id].height / 2;
                }
            }
            const circles = data["circles"];
            for(let id in circles) {
                if(id in this.circles) {
                    this.circles[id].x = circles[id].x;
                    this.circles[id].y = circles[id].y;
                }
            }
        });
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
