'use strict';

const EventEmitter = require('events').EventEmitter;
const socket = require('socket.io');
const Engine = require('../shared/physics/engine.js');

class Game extends EventEmitter {
    constructor(server) {
        super();
        this.started = false;
        this.paused = false;
        this.io = socket(server);
        this.players = {};
        this.obstacles = {};
        this.circles = {};
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
                // eventually need to put this on queue of incoming packets.
                if(input.left || input.right) {
                    //player.acceleration = player.acceleration.replaceX(input.left ? -200 : 200);
                    player.velocity = player.velocity.replaceX(input.left ? -200 : 200);
                } else {
                    //player.acceleration = player.acceleration.replaceX(0);
                    player.velocity = player.velocity.replaceX(0);
                }
                if(input.up || input.down) {
                    //player.velocity.y = input.up ? -vSpeed : vSpeed;
                    if(input.up && player.bottom) {
                        player.velocity = player.velocity.replaceY(-250);
                    } else if(input.down) {
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
            if(!this.started) {
                this.start();
            }
        });

        this.initializeWorld();
    }

    initializeWorld() {
        this.playerBodies = [];
        this.engine.add.collider(this.playerBodies, this.playerBodies);
        this.obstacleBodies = [];
        this.engine.add.collider(this.obstacleBodies, this.obstacleBodies);
        this.engine.add.collider(this.playerBodies, this.obstacleBodies);

        // const obstacle = this.engine.add.AABB(300, 255, 350, 485, {mass:5});
        // obstacle.restitution = 1;
        // obstacle.friction = 0.05;
        // this.obstacles[obstacle.id] = obstacle;
        // this.obstacleBodies.push(obstacle);

        // const obstacle2 = this.engine.add.AABB(30, 190, 605, 200, {mass:2, overlapOnly: false});
        // obstacle2.restitution = 1;
        // obstacle2.friction = 0.05;
        // this.obstacles[obstacle2.id] = obstacle2;
        // this.obstacleBodies.push(obstacle2);

        // const obstacle3 = this.engine.add.AABB(25, 180, 600, 189);
        // obstacle3.restitution = 1;
        // obstacle3.friction = 0.05;
        // this.obstacles[obstacle3.id] = obstacle3;
        // this.obstacleBodies.push(obstacle3);

        const obstacle4 = this.engine.add.AABB(300, 250, 340, 270);
        obstacle4.restitution = 1;
        obstacle4.friction = 0.05;
        this.obstacles[obstacle4.id] = obstacle4;
        this.obstacleBodies.push(obstacle4);

        const obstacle5 = this.engine.add.AABB(350, 250, 390, 270);
        obstacle5.restitution = 1;
        obstacle5.friction = 0.05;
        this.obstacles[obstacle5.id] = obstacle5;
        this.obstacleBodies.push(obstacle5);

        const obstacle6 = this.engine.add.AABB(400, 250, 440, 270);
        obstacle6.restitution = 1;
        obstacle6.friction = 0.05;
        this.obstacles[obstacle6.id] = obstacle6;
        this.obstacleBodies.push(obstacle6);

        this.circleBodies = [];
        this.engine.add.collider(this.circleBodies, this.circleBodies);
        this.engine.add.collider(this.obstacleBodies, this.circleBodies);
        this.engine.add.collider(this.playerBodies, this.circleBodies);
        
        // const circle = this.engine.add.circle(400, 300, 25);
        // circle.restitution = 1;
        // circle.friction = 0.01;
        // this.circleBodies.push(circle);
        // this.circles[circle.id] = circle;
        // const circle2 = this.engine.add.circle(700, 60, 25);
        // circle2.restitution = 1;
        // circle2.friction = 0.01;
        // this.circleBodies.push(circle2);
        // this.circles[circle2.id] = circle2;
    }

    createPlayer(id) {
        const x = Math.round(Math.random() * 700 + 50);
        const y = Math.round(Math.random() * 300);
        const width = 16;
        const height = 32;
        const player = this.engine.add.AABB(x, y, x + width, y + height, {mass: 1.2});
        //player.maxSpeed = 500;
        player.maxVelocityX = 250;
        player.restitution = 0.1;
        //player.restitution = 1;
        player.friction = 0.05;
        this.players[id] = player;
        this.playerBodies.push(player);
        return player;
    }
    
    getState() {
        const state = {};
        state["players"] = {};
        state["obstacles"] = {};
        state["circles"] = {};
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
        for(let id in this.circles) {
            const circle = this.circles[id];
            state["circles"][id] = {
                x: circle.position.x,
                y: circle.position.y,
                radius: circle.radius,
            }
        }
        return state;
    }

    async sleep(s) {
        return new Promise(resolve => setTimeout(resolve, s*1000));
    }

    now() {
        return Date.now() / 1000 // in seconds
    }

    pause() {
        this.paused = !this.paused;
    }

    async start() {
        this.started = true;
        const timestep = this.timestep;
        this.paused = false;
        let delta = 0;
        let prev = this.now() - timestep;
        while(!this.paused) {
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
};

module.exports = Game;
