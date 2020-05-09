'use strict';

const EventEmitter = require('events').EventEmitter;
const AABB = require('./AABB.js');
const Circle = require('./Circle.js');
const Collider = require('./Collider.js');
const Vec2 = require('./Vec2.js');

class PhysicsFactory {
    constructor(engine) {
        this.engine = engine;
        this.physicsObjects = engine.physicsObjects;
        this.colliders = engine.colliders;
    }

    collider(a, b, callback = () => {}) {
        const collider = new Collider(a, b, callback);
        this.colliders.push(collider);
        return collider;
    }

    AABB(minX=0, minY=0, maxX=1, maxY=1, isStatic=false) {
        const aabb = new AABB(minX, minY, maxX, maxY, this.engine, isStatic);
        this.physicsObjects.push(aabb);
        return aabb;
    }

    circle(centerX=0, centerY=0, radius=1, isStatic=false) {
        const circle = new Circle(centerX, centerY, radius, this.engine, isStatic);
        this.physicsObjects.push(circle);
        return circle;
    }
};

class Engine extends EventEmitter {

    constructor(config = {}) {
        super();
        this.gravity = new Vec2(0, 0);
        if(config.gravity) {
            this.gravity.x = config.gravity.x || 0;
            this.gravity.y = config.gravity.y || 0;
        }
        this.physicsObjects = [];
        this.colliders = [];
        this.add = new PhysicsFactory(this);
        this.maxFPS = config.maxFPS || 60;
        this.timestep = 1000 / this.maxFPS;
    }

    update(delta) {
        let collisions = [];
        for(let physicsObject of this.physicsObjects) {
            physicsObject.update(delta);
        }
        for(let collider of this.colliders) {
            collisions = collisions.concat(collider.findCollisions());
        }
        this.resolveCollisions(collisions);
    }

    resolveCollisions(collisions) {
        for(let collision of collisions) {
            const a = collision.a;
            const b = collision.b;
            const callback = collision.callback;
            if(a.isStatic && b.isStatic) {
                continue;
            }
            if(a instanceof AABB && b instanceof AABB) {
                this.resolveAABBOnAABBCollision(a, b, callback);
            } else if(a instanceof Circle && b instanceof Circle) {
                this.resolveCircleOnCircleCollision(a, b, callback);
            } else if(a instanceof AABB) {
                this.resolveAABBOnCircleCollision(a, b, callback);
            } else {
                this.resolveAABBOnCircleCollision(b, a, callback);
            }
        }
    }

    resolveAABBOnAABBCollision(a, b, callback) {
        const overlapBias = 4;

        //let separateOnY = false;
        // first try to separate on y-axis
        let overlapY = 0;
        if(a._dy !== 0 || b._dy !== 0) {
            if(a._dy > b._dy) {
                // a is going down and/or b is going up
                overlapY = a.maxBound.y - b.minBound.y;
            } else {
                // a is going up and/or b is going down
                overlapY = a.minBound.y - b.maxBound.y;
            }
            const maxOverlapY = Math.abs(a._dy - b._dy) + overlapBias;
            if(Math.abs(overlapY) > maxOverlapY) {
                overlapY = 0;
            } else {
                if(overlapY > 0) {
                    a.bottom = true;
                } else {
                    b.bottom = true;
                }
            }
        }
        // try to separate on x-axis
        let overlapX = 0;
        //if(true || !separateOnY) {
        if(a._dx !== 0 || b._dx !== 0) {
            if(a._dx > b._dx) {
                // a is going right and/or b is going left
                overlapX = a.maxBound.x - b.minBound.x;
            } else {
                // a is going left and/or b is going right
                overlapX = a.minBound.x - b.maxBound.x;
            }
            const maxOverlapX = Math.abs(a._dx - b._dx) + overlapBias;
            if(Math.abs(overlapX) > maxOverlapX) {
                overlapX = 0;
            }
        }

        if(overlapX || overlapY) {
            callback;
        }

        if(!a.isStatic && !b.isStatic) {
            overlapX /= 2;
            overlapY /= 2;
        }
        if(!a.isStatic) {
            a.position.x -= overlapX;
            a.position.y -= overlapY;
            a.velocity.x = 0;
            a.velocity.y = 0;
            a._updateBoundsFromPosition();
        }
        if(!b.isStatic) {
            b.position.x += overlapX;
            b.position.y += overlapY;
            b.velocity.x = 0;
            b.velocity.y = 0;
            b._updateBoundsFromPosition();
        }

/*
        if((collision.aDirection.equals(new Vec2(0, 1)) && a.velocity.y > 0) ||
            (collision.aDirection.equals(new Vec2(0, -1)) && a.velocity.y < 0)) {
                a.acceleration.y = 0;
                a.velocity.y = 0;
        } else if((collision.aDirection.equals(new Vec2(1, 0)) && a.velocity.x > 0) ||
            (collision.aDirection.equals(new Vec2(-1, 0)) && a.velocity.x < 0)) {
                a.acceleration.x = 0;
                a.velocity.x = 0;
        }
        if((collision.bDirection.equals(new Vec2(0, 1)) && b.velocity.y > 0) ||
            (collision.bDirection.equals(new Vec2(0, -1)) && b.velocity.y < 0)) {
                b.acceleration.y = 0;
                b.velocity.y = 0;
        } else if((collision.bDirection.equals(new Vec2(1, 0)) && b.velocity.x > 0) ||
            (collision.bDirection.equals(new Vec2(-1, 0)) && b.velocity.x < 0)) {
                b.acceleration.x = 0;
                b.velocity.x = 0;
        }

        // idea here is that static masses (mass === 0) don't move their positions
        // other masses share the position change needed to get rid of penetration
        // need to figure out which direction to move based off collision side

        // but actually maybe should just be in opposite direction of velocity (at least
        // for object that caused collision)
        /*if(a.mass === 0) {
            b.position
        }*/
    }

    resolveCircleOnCircleCollision(a, b, callback) {
        const distance = a.center.distance(b.center);
        let overlap = (a.radius + b.radius) - distance;
        
        const nx = ((b.center.x - a.center.x) / distance);
        const ny = ((b.center.y - a.center.y) / distance);
        const p = a.velocity.x * nx + a.velocity.y * ny - b.velocity.x * nx - b.velocity.y * ny;

        if(!a.isStatic) {
            a.velocity.x -= p * nx;
            a.velocity.y -= p * ny;
        }
        if(!b.isStatic) {
            b.velocity.x += p * nx;
            b.velocity.y += p * ny;
        }

        const dvx = b.velocity.x - a.velocity.x;
        const dvy = b.velocity.y - a.velocity.y;
        const angleCollision = Math.atan2(dvy, dvx);
    
        if(!a.isStatic && !b.isStatic) {
            overlap /= 2;
        }
        if(!a.isStatic) {
            a.position.x += (a.velocity.x * this.timestep) - (overlap * Math.cos(angleCollision));
            a.position.y += (a.velocity.y * this.timestep) - (overlap * Math.sin(angleCollision));
            a._updateCenterFromPosition();
        }
        if(!b.isStatic) {
            b.position.x += (b.velocity.x * this.timestep) + (overlap * Math.cos(angleCollision));
            b.position.y += (b.velocity.y * this.timestep) + (overlap * Math.sin(angleCollision));
            b._updateCenterFromPosition();
        }
        callback();
    }

    resolveAABBOnCircleCollision(aabb, circle, callback) {

    }

    async sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async start() {
        const timestep = this.timestep;
        let stopped = false;
        let delta = 0;
        let prev = Date.now() - timestep;
        while(!stopped) {
            const now = Date.now();
            delta += now - prev;
            if(delta < timestep) {
                await this.sleep(timestep);
                continue;
            }
            this.emit('preUpdate');
            prev = now;
            let numUpdateSteps = 0;
            while(delta >= timestep) {
                this.update(timestep);
                delta -= timestep;
                numUpdateSteps++;
                if(numUpdateSteps > 240) {
                    // panic
                    console.log('panic');
                    delta = 0;
                    break;
                }
            }
            this.emit('postUpdate');
        }
    }

    removeObject(object) {
        const index = this.physicsObjects.findIndex(element => {
            element.id === object.id
        });
        if(index >= 0) {
            this.physicsObjects.splice(index, 1);
        }
        for(let collider of this.colliders) {
            collider.removeObject(object);
        }
    }
};

module.exports = Engine;
