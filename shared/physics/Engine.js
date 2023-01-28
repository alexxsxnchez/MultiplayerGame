'use strict';

const assert = require('assert').strict;
const AABB = require('./AABB.js');
const Circle = require('./Circle.js');
const { Collision } = require('./Collider.js');
const Factory = require('./Factory.js');
const Vec2 = require('./Vec2.js');

class Engine {

    constructor(config={}) {
        this.physicsObjects = [];
        this.colliders = [];
        this.add = new Factory(this);
        this._recentCollisions = new Map();

        // process config # TODO default params deconstruct
        this.unitSize = config.unitSize || 1;
        assert(this.unitSize > 0);
        if(config.worldBounds) {
            this.add.worldBounds(config.worldBounds.x, config.worldBounds.y);
        }
        if(config.gravity) {
            this.gravity = new Vec2(config.gravity.x || 0, config.gravity.y || 0);
        } else {
            this.gravity = new Vec2();
        }
    }

    nextStep(delta) {
        let collisions = [];
        for(let physicsObject of this.physicsObjects) {
            physicsObject.update(delta);
        }
        for(let collider of this.colliders) {
            collisions = collisions.concat(collider.findCollisions());
        }

        this.resolveCollisions(collisions);
        this.processCallbacks(collisions);
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

    resolveCollisions(collisions) {
        for(let collision of collisions) {
            const a = collision.a;
            const b = collision.b;
            if((a.overlapOnly && !b.isStatic) || (b.overlapOnly && !a.isStatic)) {
                continue;
            } else if(a instanceof AABB && b instanceof AABB) {
                this.resolveAABBOnAABBCollision(a, b);
            } else if(a instanceof Circle && b instanceof Circle) {
                this.resolveCircleOnCircleCollision2(a, b);
            } else if(a instanceof AABB) {
                this.resolveAABBOnCircleCollision(a, b, collision.extra_data.contactPoint);
            } else {
                this.resolveAABBOnCircleCollision(b, a, collision.extra_data.contactPoint);
            }
        }
    }

    // https://research.ncl.ac.uk/game/mastersdegree/gametechnologies/previousinformation/physics6collisionresponse/2017%20Tutorial%206%20-%20Collision%20Response.pdf
    // https://2dengine.com/?p=collisions

    resolveAABBOnAABBCollision(a, b) {
        // first we need to find in which direction is the collision taking place (the side with smallest overlap)
        // the following values should all be positive (in _most_ cases -- a lot of "stacking" and strong 
        // penetration could cause a small negative overlap instead)
        const overlapLeftRight = a.maxBound.x - b.minBound.x;
        const overlapRightLeft = b.maxBound.x - a.minBound.x;
        const overlapTopBottom = a.maxBound.y - b.minBound.y;
        const overlapBottomTop = b.maxBound.y - a.minBound.y;

        const smallestOverlap = Math.min(Math.min(overlapLeftRight, overlapRightLeft), Math.min(overlapTopBottom, overlapBottomTop));

        let normal;
        if (smallestOverlap === overlapLeftRight) {
            normal = new Vec2(1, 0);
            a.right = true;
            b.left = true;
        } else if (smallestOverlap === overlapRightLeft) {
            normal = new Vec2(-1, 0);
            a.left = true;
            b.right = true;
        } else if (smallestOverlap === overlapTopBottom) {
            normal = new Vec2(0, 1);
            a.bottom = true;
            b.top = true;
        } else {
            normal = new Vec2(0, -1);
            a.top = true;
            b.bottom = true;
        }

        // the next step is to apply an instant impulse (can then determine velocity relative to each body's mass)
        const relativeVelocity = b.velocity.sub(a.velocity);
        const penetrationSpeed = relativeVelocity.dot(normal);

        // if objects are separating do nothing (separating if normal and relVel is in same direction)
        if(penetrationSpeed >= 0) {
            return;
        }

        // calculate average restitution (bounciness)
        const e = (a.restitution + b.restitution) / 2;

        // calculate and apply instant impulse
        const totalInvMass = a.im + b.im;
        const j = -(1 + e) * penetrationSpeed / totalInvMass;
        const impulse = normal.sMultiply(j);
        a.velocity = a.velocity.sub(impulse.sMultiply(a.im));
        b.velocity = b.velocity.add(impulse.sMultiply(b.im));

        // calculate and apply friction
        const friction = (a.friction + b.friction) / 2;
        const penetrationVelocity = normal.sMultiply(penetrationSpeed); // is almost always negative
        const tangentialVelocity = relativeVelocity.sub(penetrationVelocity);
        a.velocity = a.velocity.add(tangentialVelocity.sMultiply(friction * a.im / (totalInvMass)));
        b.velocity = b.velocity.sub(tangentialVelocity.sMultiply(friction * b.im / (totalInvMass)));

        // Use linear projection to move the objects out of each other by a 
        // `correctionPercent` amount to stop the "sinking effect"
        if(smallestOverlap > 0.1) {
            const correctionPercent = 0.8;
            const correction = normal.sMultiply(correctionPercent * smallestOverlap / totalInvMass);
            a.setPosition(a.position.x - correction.x * a.im, a.position.y - correction.y * a.im);
            b.setPosition(b.position.x + correction.x * b.im, b.position.y + correction.y * b.im);
        }

        a._roundValues();
        b._roundValues();
    }

    resolveCircleOnCircleCollision2(a, b) {
        const distance = b.position.sub(a.position);
        const normal = distance.normalize();
        const relativeVelocity = b.velocity.sub(a.velocity);
        const penetrationSpeed = relativeVelocity.dot(normal);

        if(penetrationSpeed >= 0) {
            return;
        }

        const e = (a.restitution + b.restitution) / 2;

        const totalInvMass = a.im + b.im;
        const j = -(1 + e) * penetrationSpeed / totalInvMass;
        const impulse = normal.sMultiply(j);
        a.velocity = a.velocity.sub(impulse.sMultiply(a.im));
        b.velocity = b.velocity.add(impulse.sMultiply(b.im));

        // TODO: friction (maybe not needed rly)

        const overlap = a.radius + b.radius - distance.length();
        if(overlap > 0.1) {
            const correctionPercent = 0.8;
            const correction = normal.sMultiply(correctionPercent * overlap / totalInvMass);
            a.setPosition(a.position.x - correction.x * a.im, a.position.y - correction.y * a.im);
            b.setPosition(b.position.x + correction.x * b.im, b.position.y + correction.y * b.im);
        }

        a._roundValues();
        b._roundValues();
    }
/*
    resolveCircleOnCircleCollision(a, b, delta) {
        const distance = a.center.distance(b.center);
        let overlap = (a.radius + b.radius) - distance;

        const nx = ((b.center.x - a.center.x) / distance);
        const ny = ((b.center.y - a.center.y) / distance);
        const p = a.velocity.x * nx + a.velocity.y * ny - b.velocity.x * nx - b.velocity.y * ny;

        if(!a.isStatic) {
            a.velocity = a.velocity.sub(new Vec2(p * nx, p * ny));
        }
        if(!b.isStatic) {
            b.velocity = b.velocity.add(new Vec2(p * nx, p * ny));
        }

        const dvx = b.velocity.x - a.velocity.x;
        const dvy = b.velocity.y - a.velocity.y;
        const angleCollision = Math.atan2(dvy, dvx);
    
        if(!a.isStatic && !b.isStatic) {
            overlap /= 2;
        }
        if(!a.isStatic) {
            const posXChange = (a.velocity.x * delta) - (overlap * Math.cos(angleCollision));
            const posYChange = (a.velocity.y * delta) - (overlap * Math.sin(angleCollision));
            a.position = a.position.add(new Vec2(posXChange, posYChange));
            a._updateCenterFromPosition();
        }
        if(!b.isStatic) {
            const posXChange = (b.velocity.x * delta) - (overlap * Math.cos(angleCollision));
            const posYChange = (b.velocity.y * delta) - (overlap * Math.sin(angleCollision));
            b.position = b.position.add(new Vec2(posXChange, posYChange));
            b._updateCenterFromPosition();
        }
    }
    */

    resolveAABBOnCircleCollision(aabb, circle, contactPoint) {
        const circleToContactPoint = circle.position.sub(contactPoint);
        const normal = circleToContactPoint.normalize();

        // set aabb touching points
        const v = contactPoint.sub(aabb.position);
        if(v.x === 0 && v.y !== 0 && v.y !== aabb.height) {
            aabb.left = true;
        } else if(v.x === aabb.width && v.y !== 0 && v.y !== aabb.height) {
            aabb.right = true;
        } else if(v.y === 0) { // give preference to top/bottom
            aabb.top = true;
        } else if(v.y === aabb.height) {
            aabb.bottom = true;
        }

        const relativeVelocity = circle.velocity.sub(aabb.velocity);
        const penetrationSpeed = relativeVelocity.dot(normal);


        if(penetrationSpeed >= 0) {
            return;
        }

        const e = (aabb.restitution + circle.restitution) / 2;

        const totalInvMass = aabb.im + circle.im;
        const j = -(1 + e) * penetrationSpeed / totalInvMass;
        const impulse = normal.sMultiply(j);
        aabb.velocity = aabb.velocity.sub(impulse.sMultiply(aabb.im));
        circle.velocity = circle.velocity.add(impulse.sMultiply(circle.im));

        // TODO: friction

        const overlap = circle.radius - circleToContactPoint.length();
        if(overlap > 0.1) {
            const correctionPercent = 0.8;
            const correction = normal.sMultiply(correctionPercent * overlap / totalInvMass);
            aabb.setPosition(aabb.position.x - correction.x * aabb.im, aabb.position.y - correction.y * aabb.im);
            circle.setPosition(circle.position.x + correction.x * circle.im, circle.position.y + correction.y * circle.im);
        }

        aabb._roundValues();
        circle._roundValues();
    }

    removeObject(object) {
        if(!object) {
            return;
        }
        const index = this.physicsObjects.findIndex(element => {
            return element.id === object.id
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
