'use strict';

const socket = require('socket.io');
const Engine = require('../shared/physics/engine.js');
const Vec2 = require('../shared/physics/Vec2.js');

class Game {
    constructor(server) {
        this.io = socket(server);
        this.players = {};
        this.engine = new Engine({
            gravity: { y: 0 }//0.01 }
        });
        this.engine.on('postUpdate', () => {
            const state = this.getState();
            this.io.emit('state', state);
        });

        this.io.on('connection', socket => {
            const id = socket.id;
            console.log(`socket connected: ${id}`);

            const player = this.createPlayer(id);

            socket.on('input', input => {
                // eventually need to put this on queue of incoming packets.
                const hSpeed = 0.3;
                const vSpeed = 0.3;//2;
                if(input.left || input.right) {
                    player.velocity.x = input.left ? -hSpeed : hSpeed; 
                } else {
                    player.velocity.x = 0;
                }
                if(input.up || input.down) {
                    player.velocity.y = input.up ? -vSpeed : vSpeed;
                } else {
                    player.velocity.y = 0;
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
                this.engine.removeObject(this.players[id]);
                delete this.players[id];
                this.io.emit('removePlayer', id);
            });
            const state = this.getState();
            const playerData = {
                id,
                x: player.position.x,
                y: player.position.y
            }
            socket.emit('init', state);
            socket.broadcast.emit('newPlayer', playerData);
        });

    }

    start() {
        this.init();
        this.engine.start();
    }

    init() {
        this.playerBodies = [];
        this.engine.add.collider(this.playerBodies, this.playerBodies);
        //const world = this.engine.add.AABB(new Vec2(0, 300), new Vec2(800, 500), { isStatic: true });
        //this.engine.add.collider(this.playerBodies, world);
        const obstacle = this.engine.add.circle(new Vec2(400, 400), 64, { isStatic: true });
        this.engine.add.collider(this.playerBodies, obstacle);
    }

    createPlayer(id) {
        const x = Math.round(Math.random() * 700 + 50);
        const y = Math.round(Math.random() * 300 - 40);
        const width = 16;
        const height = 32;
        //const player = this.engine.add.AABB(new Vec2(x, y), new Vec2(x + width, y + height));
        const player = this.engine.add.circle(new Vec2(x, y), 32);
        //player.maxSpeed = 0.5;
        player.maxVelocityX = 0.5;
        this.players[id] = player;
        this.playerBodies.push(player);
        return player;
    }
    
    getState() {
        const state = {};
        for(let id in this.players) {
            const playerPosition = this.players[id].position;
            state[id] = {
                x: playerPosition.x,
                y: playerPosition.y
            }
        }
        return state;
    }
    
};


/*
io.on('connection', socket => {
    console.log('socket connected');
    
    //socket.emit('currentPlayers', players);
    
    //socket.on('newClient', () => {
        createPlayer(socket);
        socket.emit('currentPlayers', players);
        socket.broadcast.emit('newPlayer', players[socket.id]);
    //});
    socket.on('playerMovement', (data) => {
        // todo: sanitize data
        players[socket.id].x = data.x;
        players[socket.id].y = data.y;
        players[socket.id].anim = data.anim;
        players[socket.id].score = data.score;
        // try io.emit()
        socket.broadcast.emit('playerMoved', players[socket.id]);
    });
    socket.on('disconnect', () => {
        console.log('socket disconnected');
        delete players[socket.id];
        io.emit('removePlayer', socket.id);
    });
});
*/
module.exports = Game;
