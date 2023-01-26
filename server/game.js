'use strict';

const EventEmitter = require('events').EventEmitter;
const socket = require('socket.io');
const Engine = require('../shared/physics/engine.js');

class Game extends EventEmitter {
    constructor(server) {
        super();
        this.io = socket(server);
        this.players = {};
        this.obstacles = {};
        this.engine = new Engine({
            gravity: { y: 500 },
            worldBounds: {
                x: 800,
                y: 600,
            }
        });
        this.maxFPS = 60;
        this.timestep = 1 / this.maxFPS;

        this.on('postUpdate', () => {
            const state = this.getState();
            this.io.emit('state', state);
        });

        this.io.on('connection', socket => {
            const id = socket.id;
            console.log(`socket connected: ${id}`);

            const player = this.createPlayer(id);

            socket.on('input', input => {
                //return;
                // eventually need to put this on queue of incoming packets.
                const hSpeed = 300;
                const vSpeed = 300;//2;
                if(input.left || input.right) {
                    // player.velocity = player.velocity.replaceX(input.left ? -hSpeed : hSpeed);
                    player.acceleration = player.acceleration.replaceX(input.left ? -400 : 400);
                } else {
                    player.velocity = player.velocity.replaceX(0);
                    player.acceleration = player.acceleration.replaceX(0);
                }
                if(input.up || input.down) {
                    //player.velocity.y = input.up ? -vSpeed : vSpeed;
                    if(input.up) {
                        player.velocity = player.velocity.replaceY(-210);
                    } else {
                        player.velocity = player.velocity.replaceY(210);
                    }
                } else {
                    //player.velocity = player.velocity.replaceY(0);
                }
                /*if(input.up) {
                    if(player.bottom) {
                        player.velocity.y = -vSpeed;
                    }
                }*/
                /*if(input.up || input.down) {
                    player.velocity.y = input.up ? -vSpeed : vSpeed;
                } else {
                    //player.velocity.y = 0;
                }*/
                /*
                const mapping = {
                    0: new Vec2(-0.001, 0),
                    1: new Vec2(0, -0.001),
                    2: new Vec2(0.001, 0),
                    3: new Vec2(0, 0.001),
                    4: new Vec2(0, 0)
                };
                const acceleration = mapping[direction];
                player.acceleration = acceleration;
                
                player.velocity = player.velocity = mapping[direction].sMultiply(1000);
                if(direction === 4) {
                    player.velocity.x = 0;
                    player.velocity.y = 0;
                }
                */
            });
            socket.on('disconnect', () => {
                console.log(`socket disconnected: ${id}`);
                console.log(`playerbodies count: ${this.playerBodies.length}`)
                this.engine.removeObject(this.players[id]);
                console.log(`playerbodies count after: ${this.playerBodies.length}`)
                delete this.players[id];

                this.io.emit('removePlayer', id);
            });
            const state = this.getState();
            socket.emit('init', state);
            const playerData = {
                id,
                x: player.position.x,
                y: player.position.y
            }
            socket.broadcast.emit('newPlayer', playerData);
            this.start();
        });

        this.initializeWorld();
    }

    initializeWorld() {
        this.playerBodies = [];
        this.engine.add.collider(this.playerBodies, this.playerBodies);
        this.obstacleBodies = [];
        this.engine.add.collider(this.obstacleBodies, this.obstacleBodies);
        this.engine.add.collider(this.playerBodies, this.obstacleBodies);

        const obstacle = this.engine.add.AABB(300, 255, 350, 485, false, 5);
        obstacle.restitution = 1;
        this.obstacles[obstacle.id] = obstacle;
        this.obstacleBodies.push(obstacle);

        const obstacle2 = this.engine.add.AABB(30,21, 605, 90, false, 2);
        obstacle2.restitution = 1;
        this.obstacles[obstacle2.id] = obstacle2;
        this.obstacleBodies.push(obstacle2);

        const obstacle3 = this.engine.add.AABB(25,1, 600, 28, false);
        obstacle3.restitution = 1;
        this.obstacles[obstacle3.id] = obstacle3;
        this.obstacleBodies.push(obstacle3);

    }

    async sleep(s) {
        return new Promise(resolve => setTimeout(resolve, s*1000));
    }

    now() {
        return Date.now() / 1000 // in seconds
    }

    async start() {
        const timestep = this.timestep;
        let stopped = false;
        let delta = 0;
        let prev = this.now() - timestep;
        while(!stopped) {
            const now = this.now();
            delta += now - prev;
            if(delta < timestep) {
                await this.sleep(timestep);
                continue;
            }
            this.emit('preUpdate');
            prev = now;
            let numUpdateSteps = 0;
            while(delta >= timestep) {
                this.engine.nextStep(timestep);
                //this.engine.nextStep(0.01666);
                delta -= timestep;
                numUpdateSteps++;
                if(numUpdateSteps > 240) {
                    // panic
                    console.error('panic');
                    this.engine.nextStep(delta);
                    delta = 0;
                }
            }
            this.emit('postUpdate');
        }
    }


    createPlayer(id) {
        const x = Math.round(Math.random() * 700 + 50);
        const y = Math.round(Math.random() * 300);
        const width = 16;
        const height = 32;
        const player = this.engine.add.AABB(x, y, x + width, y + height);
        //player.maxSpeed = 500;
        player.setVelocity(24, 0);
        player.maxVelocityX = 250;
        player.restitution = 0.1;
        this.players[id] = player;
        this.playerBodies.push(player);
        return player;
    }
    
    getState() {
        const state = {};
        state["players"] = {};
        state["obstacles"] = {};
        for(let id in this.players) {
            const playerPosition = this.players[id].position;
            state["players"][id] = {
                x: playerPosition.x,
                y: playerPosition.y
            }
        }
        for(let id in this.obstacles) {
            const obstacle = this.obstacles[id];
            state["obstacles"][id] = {
                x: obstacle.position.x,
                y: obstacle.position.y,
                width: obstacle.width,
                height: obstacle.height,
            }
        }
        return state;
    }
    
};

module.exports = Game;
