'use strict';

const assert = require('assert').strict;
const { Collision } = require('./Collider.js');
const Vec2 = require('./Vec2.js');

class Engine {

    constructor(gravity={}) {
        this.physicsObjects = [];
        this.colliders = [];
        this._recentCollisions = new Map();
        this.gravity = new Vec2(gravity.x || 0, gravity.y || 0);

        // process config # TODO default params deconstruct
        // this.unitSize = config.unitSize || 1;
        // assert(this.unitSize > 0);
    }

    nextStep(delta) {
        // 1. update objects
        for(let physicsObject of this.physicsObjects) {
            physicsObject.update(delta);
        }

        // 2. find collisions
        const collisions = [];
        for(let collider of this.colliders) {
            collisions.push(...collider.findCollisions());
        }

        // 3. resolve each collision
        for(let collision of collisions) {
            const a = collision.a;
            const b = collision.b;
            if((a.overlapOnly && !b.isStatic) || (b.overlapOnly && !a.isStatic)) {
                continue;
            }
            this.resolveCollision(a, b, collision.normal, collision.overlap);
        }

        // 4. process all callbacks
        this.processCallbacks(collisions);
    }

    resolveCollision(a, b, normal, overlap) {
        // https://research.ncl.ac.uk/game/mastersdegree/gametechnologies/physicstutorials/5collisionresponse/Physics%20-%20Collision%20Response.pdf
        // https://research.ncl.ac.uk/game/mastersdegree/gametechnologies/previousinformation/physics6collisionresponse/2017%20Tutorial%206%20-%20Collision%20Response.pdf
        // https://2dengine.com/?p=collisions
        // https://gamedevelopment.tutsplus.com/tutorials/how-to-create-a-custom-2d-physics-engine-the-basics-and-impulse-resolution--gamedev-6331

        // First we need to calculate and apply an instant impulse.
        // To do that, we need the penetrationSpeed (relative velocity along the normal).
        const relativeVelocity = b.velocity.sub(a.velocity);
        const penetrationSpeed = relativeVelocity.dot(normal);

        // if objects are separating do nothing (separating if normal and relVel is in same direction)
        if(penetrationSpeed >= 0) {
            return;
        }

        // calculate average restitution (bounciness)
        const e = (a.restitution + b.restitution) / 2;

        // calculate and apply instant impulse
        // (objects with smaller mass get bigger portion of the impulse velocity)
        const totalInvMass = a.im + b.im;
        const j = -(1 + e) * penetrationSpeed / totalInvMass;
        const impulse = normal.sMultiply(j);
        a.velocity = a.velocity.sub(impulse.sMultiply(a.im));
        b.velocity = b.velocity.add(impulse.sMultiply(b.im));

        // calculate and apply friction
        const friction = (a.friction + b.friction) / 2;
        const penetrationVelocity = normal.sMultiply(penetrationSpeed);
        const tangentialVelocity = relativeVelocity.sub(penetrationVelocity);
        a.velocity = a.velocity.add(tangentialVelocity.sMultiply(friction * a.im / (totalInvMass)));
        b.velocity = b.velocity.sub(tangentialVelocity.sMultiply(friction * b.im / (totalInvMass)));

        // Use linear projection to move the objects out of each other by a 
        // `correctionPercent` amount to stop the "sinking effect"
        if(overlap > 0.1) {
            const correctionPercent = 0.8;
            const correction = normal.sMultiply(correctionPercent * overlap / totalInvMass);
            a.setPosition(a.position.x - correction.x * a.im, a.position.y - correction.y * a.im);
            b.setPosition(b.position.x + correction.x * b.im, b.position.y + correction.y * b.im);
        }

        a._roundValues();
        b._roundValues();
    }

    processCallbacks(collisions) {
        const collisionMemory = 5;
        for (let collision of collisions) {
            if (!this._recentCollisions.has(Collision.getPairString(collision.a, collision.b))) {
                collision.callback(collision.a, collision.b);
            }
            this._recentCollisions.set(Collision.getPairString(collision.a, collision.b), collisionMemory);
            this._recentCollisions.set(Collision.getPairString(collision.b, collision.a), collisionMemory);
        }
        const deleteArr = [];
        this._recentCollisions.forEach((val, key) => {
            if(val === 0) {
                deleteArr.push(key);
            } else {
                this._recentCollisions.set(key, val-1);
            }
        });
        deleteArr.forEach(val => {
            this._recentCollisions.delete(val);
        });
    }

    removeObject(obj) {
        if(!obj) {
            return;
        }
        const index = this.physicsObjects.findIndex(element => {
            return element.id === obj.id
        });
        if(index >= 0) {
            this.physicsObjects.splice(index, 1);
        }
        for(let collider of this.colliders) {
            collider.removeObject(obj);
        }
    }
};

module.exports = Engine;
