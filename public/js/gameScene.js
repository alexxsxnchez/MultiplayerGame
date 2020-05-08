'use strict';

import Player from "./player.js";

export default class GameScene extends Phaser.Scene {

    /*
        Consider using custom physics code that is in "shared" directory that can be used
        in both client and server code

    */

    preload() {
        //this.load.image("tiles", "assets/NES - Super Mario Bros - Tileset.png");	
        //this.load.tilemapTiledJSON("map", "assets/map_1.json");

        this.load.image("tiles", "assets/MarioTilesetMin.png");
        this.load.tilemapTiledJSON("map", "assets/map_2.json");

        //this.load.image('sky', 'assets/sky.png');
        //this.load.image('ground', 'assets/platform.png');
        this.load.image('star', 'assets/star.png');
        this.load.image('bomb', 'assets/bomb.png');
        /*this.load.spritesheet('dude', 'assets/dude.png', { 
            frameWidth: 32, 
            frameHeight: 48 
        });
        this.load.spritesheet('mario', 'assets/MarioSpriteSheet.png', {
            frameWidth: 16,
            frameHeight: 32
        });*/
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
        this.input.gamepad.once('down', (pad) => {
            console.log('Controller detected.');
            this.pad = pad;
        }, this);
    
        this.createWorld();
        this.createAnimations();
    
        // create sprite groups
        this.players = this.add.group();
        //  Some stars to collect, 12 in total, evenly spaced 70 pixels apart along the x axis
        this.stars = this.physics.add.group({
            key: 'star',
            repeat: 11,
            setXY: { x: 12, y: 0, stepX: 70 }
        });

        this.stars.children.iterate(star => {
            //  Give each star a slightly different bounce
            star.setBounceY(Phaser.Math.FloatBetween(0.4, 0.8));
            star.setCollideWorldBounds(true);
        });

        this.bombs = this.physics.add.group();
        //createBomb();

        // Players
        this.physics.add.collider(this.players, this.foreground);
        this.physics.add.collider(this.players, this.dynamic, this.hitDynamicBlock, null, this);
        this.physics.add.overlap(this.players, this.coins);
        this.physics.add.collider(this.players, this.players);
        this.physics.add.overlap(this.players, this.stars, this.collectStar, null, this);
        this.physics.add.collider(this.players, this.bombs, this.hitBomb, null, this);
        // Stars
        this.physics.add.collider(this.stars, this.foreground);
        this.physics.add.collider(this.stars, this.dynamic);
        // Bombs
        this.physics.add.collider(this.bombs, this.foreground);
        this.physics.add.collider(this.bombs, this.dynamic);
    
        // Networking
    /*
    
        Should prob make all players part of same group to have all physics affect them. Then if no input from
        other player happens, there is no event emitted, even though the players could still be moving without input (like falling).
        That falling can be calculated on client without having to have an event emitted.
    
        Though what if new player joins while other players are moving but not entering input. Then client/server of positions will
        be out of sync until other players enter input to update positions. Does performance suffer if event is emitted every movement
        regardless of input?
    
        Or what if emitted only input. And clients receives the input of other players. And clients all simlulate where other players
        are by using input of other players.
    
    */
    
        this.socket = io();
        //this.socket.emit('newClient');
        
        this.socket.on('currentPlayers', (playersInfo) => {
            console.log(`Got a currentPlayers event`);
            Object.keys(playersInfo).forEach(id => {
                if(id === this.socket.id) {
                    this.mainPlayer = new Player(this, playersInfo[id]);
                    this.cameras.main.startFollow(this.mainPlayer.sprite, true, 0.1);
                    this.players.add(this.mainPlayer.sprite);
                } else {
                    this.players.add(new Player(this, playersInfo[id]).sprite);
                }
            });
        });
    
        this.socket.on('newPlayer', player => {
            this.players.add(new Player(this, player).sprite);
        });
    
        this.socket.on('removePlayer', playerId => {
            for(const player of this.players.children.getArray()) {
                if(player.id === playerId) {
                    player.destroy();
                    break;
                }
            }
        });
    
        this.socket.on('playerMoved', playerInfo => {
            for(const player of this.players.getChildren()) {
                if(player.id === playerInfo.id) {
                    player.setPosition(playerInfo.x, playerInfo.y);
                    player.anims.play(playerInfo.anim, true);
                    if(player.sprite.score != playerInfo.score) {
                        updateOtherPlayerScore(playerInfo.score);
                    }
                }
            }
        });
    }
    
    update() {
        if (this.gameOver || !this.mainPlayer) {
            return;
        }
        this.mainPlayer.update();
        // with physics engine, access current state, and just render
    }

    createAnimations() {
        /*
        //  Our player animations, turning, walking left and walking right.
        this.anims.create({
            key: 'left',
            frames: this.anims.generateFrameNumbers('dude', { start: 0, end: 3 }),
            frameRate: 10,
            repeat: -1
        });
    
        this.anims.create({
            key: 'turn',
            frames: [ { key: 'dude', frame: 4 } ],
            frameRate: 20
        });
    
        this.anims.create({
            key: 'right',
            frames: this.anims.generateFrameNumbers('dude', { start: 5, end: 8 }),
            frameRate: 10,
            repeat: -1
        });
        */
        this.anims.create({
            key: 'sm_idle',
            frames: [ { key: 'smallmario', frame: 0 } ],
            frameRate: 20
        });

        this.anims.create({
            key: 'sm_walking',
            frames: this.anims.generateFrameNumbers('smallmario', { start: 1, end: 3 }),
            frameRate: 15,
            repeat: -1
        });

        this.anims.create({
            key: 'sm_jumping',
            frames: [ { key: 'smallmario', frame: 4 } ],
            frameRate: 20
        });

        this.anims.create({
            key: 'dead',
            frames: [ { key: 'smallmario', frame: 5 } ],
            frameRate: 20
        });
        this.anims.create({
            key: 'big_idle',
            frames: [ { key: 'bigmario', frame: 0 } ],
            frameRate: 20
        });

        this.anims.create({
            key: 'big_walking',
            frames: this.anims.generateFrameNumbers('bigmario', { start: 1, end: 3 }).reverse(),
            frameRate: 15,
            repeat: -1
        });

        this.anims.create({
            key: 'big_jumping',
            frames: [ { key: 'bigmario', frame: 4 } ],
            frameRate: 20
        });
    }
    
    createWorld() {
        const map = this.make.tilemap({ key: 'map' });
        const tileset = map.addTilesetImage("MarioTilesetMin", "tiles");
        this.sky = map.createStaticLayer("Sky", tileset, 0, 0);
        this.background = map.createStaticLayer("Background", tileset, 0, 0);
        this.foreground = map.createStaticLayer("Foreground", tileset, 0, 0);
        this.dynamic = map.createDynamicLayer('Dynamic', tileset, 0, 0);
        this.coins = map.createDynamicLayer('Coins', tileset, 0, 0);

        const coinIndex = 11;
        this.coins.setTileIndexCallback(coinIndex, this.collectCoin, this);

        const camera = this.cameras.main;
        this.myScoreText = this.add.text(camera.centerX - camera.width / 4, camera.centerY - camera.height / 4, 'My Score: 0', { fontSize: '16px', fill: '#000' });
        this.myScoreText.setScrollFactor(0);
        this.otherScoreText = this.add.text(camera.centerX - camera.width / 4, camera.centerY - camera.height / 4 + 16, 'Other Score: 0', { fontSize: '16px', fill: '#000' });
        this.otherScoreText.setScrollFactor(0);

        camera.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
        camera.setZoom(2);
        this.physics.world.setBounds(0, 0, map.widthInPixels, map.heightInPixels);

        //this.foreground.setCollision(collides);
        //this.foreground.setCollisionByProperty({ "collides": true });
        this.foreground.setCollisionByExclusion(-1);
        this.dynamic.setCollisionByExclusion(-1);
        //this.coins.setCollisionByExclusion(-1);

        // can use "createFromTile" method to create sprites from tile (like enemies)
        
    }
    
    collectStar(player, star) {
        star.disableBody(true, true);
    
        if(player === this.mainPlayer.sprite) {
            //  Add and update the score
            player.player.score += 10;
            this.myScoreText.setText('My Score: ' + player.player.score);
        }
    
        if (this.stars.countActive(true) === 0) {
            //  A new batch of stars to collect
            this.stars.children.iterate(function (child) {
    
                child.enableBody(true, child.x, 0, true, true);
    
            });
    
            this.createBomb();
        }
    }
    
    createBomb() {
        console.log('bomb');
        const x = Phaser.Math.Between(0, 800);
        const bomb = this.bombs.create(x, 0, 'bomb');
        bomb.setBounce(1);
        bomb.setCollideWorldBounds(true);
        bomb.setVelocity(Phaser.Math.Between(-200, 200), 20);
        bomb.allowGravity = true;
    }

    collectCoin(_, coin) {
        this.coins.removeTileAt(coin.x, coin.y);
        //coin.disableBody(true, true);
    }

    hitDynamicBlock(player, block) {
        // if sprite collides with two tiles, engine always picks the left.
        const x = player.body.center.x;
        const right = block.pixelX + block.width;
        if(x > right) {
            block = this.dynamic.getTileAt(block.x + 1, block.y) || block;
        }
        switch(block.index) {
            case 14:
                this.hitQuestion(player, block);
                break;
            case 15:
                this.hitBrick(player, block);
                break;
        }
    }

    hitQuestion(player, question) {
        if(player.body.onCeiling()) {
            console.log('question block hit');
            //this.dynamic.removeTileAt(question.x, question.y);
            //this.dynamic.putTileAt(16, question.x, question.y);
            this.dynamic.replaceByIndex(14, 16, question.x, question.y, 1, 1);
        }
    }

    hitBrick(player, brick) {
        if(player.body.onCeiling()) {
            console.log('brick hit');
            this.dynamic.removeTileAt(brick.x, brick.y);
        }
    }
    
    hitBomb(player, bomb) {
        bomb.destroy();
        const isDead = player.player.loseHealth();
        if(isDead) {
            this.physics.pause();
        
            //player.setTint(0xff0000);
        
            //this.cameras.main.shakeEffect = ;
            
            this.gameOver = true;
        }
    }

    updateOtherPlayerScore(score) {
        this.otherScoreText.setText('Other Score: ' + score);
    }
};
