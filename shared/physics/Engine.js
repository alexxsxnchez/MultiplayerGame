'use strict';

const assert = require('assert').strict;
const AABB = require('./AABB.js');
const Circle = require('./Circle.js');
const Factory = require('./Factory.js');
const Vec2 = require('./Vec2.js');

class Engine {

    constructor(config = {}) {
        if(config.gravity) {
            this.gravity = new Vec2(config.gravity.x || 0, config.gravity.y || 0);
        } else {
            this.gravity = new Vec2();
        }
        this.unitSize = config.unitSize || 1;
        assert(this.unitSize > 0);
        this.physicsObjects = [];
        this.colliders = [];
        this.add = new Factory(this);

        if(config.worldBounds) {
            const WORLD_BUFFER = 10000;
            this.worldBoundExists = true;
            this.worldWalls = [
                this.add.AABB(-WORLD_BUFFER, 0, 0, config.worldBounds.y, true, 0, true), // left
                this.add.AABB(0, -WORLD_BUFFER, config.worldBounds.x, 0, true, 0, true), // top
                this.add.AABB(config.worldBounds.x, 0, config.worldBounds.x + WORLD_BUFFER, config.worldBounds.y, true, 0, true), // right
                this.add.AABB(0, config.worldBounds.y, config.worldBounds.x, config.worldBounds.y + WORLD_BUFFER, true, 0, true), // bottom
            ]
        } else {
            this.worldBoundExists = false;
            this.worldWalls = null;
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

        const resolvedCollisions = this.resolveCollisions(collisions);

        // run callbacks
        for (let collision of resolvedCollisions) {
            //console.log(`${collision.a.id} collided with ${collision.b.id}`);
            collision.callback();
        }
    }

    resolveCollisions(collisions, delta) {
        const resolvedCollisions = [];

        for(let collision of collisions) {
            const a = collision.a;
            const b = collision.b;
            let resolved = false;

            if(a instanceof AABB && b instanceof AABB) {
                resolved = this.resolveAABBOnAABBCollision3(a, b);
            } else if(a instanceof Circle && b instanceof Circle) {
                resolved = this.resolveCircleOnCircleCollision(a, b, delta);
            } else if(a instanceof AABB) {
                resolved = this.resolveAABBOnCircleCollision(a, b, delta);
            } else {
                resolved = this.resolveAABBOnCircleCollision(b, a, delta);
            }
            
            if (resolved) {
                resolvedCollisions.push(collision);
            }
        }
        return resolvedCollisions;
    }

    // https://research.ncl.ac.uk/game/mastersdegree/gametechnologies/previousinformation/physics6collisionresponse/2017%20Tutorial%206%20-%20Collision%20Response.pdf
    // https://2dengine.com/?p=collisions

    resolveAABBOnAABBCollision3(a, b) {        
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
        } else if (smallestOverlap === overlapRightLeft) {
            normal = new Vec2(-1, 0);
        } else if (smallestOverlap === overlapTopBottom) {
            normal = new Vec2(0, 1);
        } else {
            normal = new Vec2(0, -1);
        }

        // the next step is to apply an instant impulse (can then determine velocity relative to each body's mass)
        const relativeVelocity = b.velocity.sub(a.velocity);
        const penetrationSpeed = relativeVelocity.dot(normal);

        // if objects are separating do nothing (separating if normal and relVel is in same direction)
        if(penetrationSpeed >= 0) {
            return false;
        }

        // calculate average restitution (bounciness)
        const e = (a.restitution + b.restitution) / 2;

        // calculate and apply instant impulse
        const totalInvMass = a.im + b.im;
        const j = -(1 + e) * penetrationSpeed / totalInvMass;
        const impulse = normal.sMultiply(j);
        a.velocity = a.velocity.sub(impulse.sMultiply(a.im));
        b.velocity = b.velocity.add(impulse.sMultiply(b.im));

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
        return true;
    }
/*
    resolveAABBOnAABBCollision2(a, b, delta, callback) {
        // need penetration vector (direction is perpendicular to the collision face) -> component of relative velocity vector
        // normal vector is the normalized version of penetration vector
        // tangential vector is the other component of relative velocity vector (used for friction)

        const relativeVelocity = a.velocity.sub(b.velocity);
        let overlapX = 0;
        let overlapY = 0;

        const overlapLeftRight = a.maxBound.x - b.minBound.x;
        const overlapRightLeft = a.minBound.x - b.maxBound.x;

        if(relativeVelocity.x > 0) { // a is going right and/or b is going left
            overlapX = overlapLeftRight;
        } else if(relativeVelocity.x < 0) {
            overlapX = overlapRightLeft; // a is going left and/or b is going right
        } else {
            // objects seem to be overlapping with zero relative velocity, so use which overlap is closer to 0
            overlapX = Math.abs(overlapLeftRight) > Math.abs(overlapRightLeft) ? overlapRightLeft : overlapLeftRight;
        }
        const overlapTopBottom = a.maxBound.y - b.minBound.y;
        const overlapBottomTop = a.minBound.y - b.maxBound.y;
        if(relativeVelocity.y > 0) { // a is going down and/or b is going up
            overlapY = overlapTopBottom;
        } else if(relativeVelocity.y < 0) {
            overlapY = overlapBottomTop; // a is going up and/or b is going down
        } else {
            // objects seem to be overlapping with zero relative velocity, so use which overlap is closer to 0
            overlapY = Math.abs(overlapTopBottom) > Math.abs(overlapBottomTop) ? overlapBottomTop : overlapTopBottom;
        }

        if(Math.abs(overlapX) > Math.abs(overlapY)) {

        }

    }


    resolveAABBOnAABBCollision(a, b, delta, callback) {
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
            callback();
        }

        if(!a.isStatic && !b.isStatic) {
            overlapX /= 2;
            overlapY /= 2;
        }
        if(!a.isStatic) {
            a.position = a.position.sub(new Vec2(overlapX, overlapY));
            let newVelX = a.velocity.x;
            let newVelY = a.velocity.y;
            if(overlapX) {
                newVelX = -a.velocity.x * b.restitution;
            }
            if(overlapY) {
                newVelY = -a.velocity.y * b.restitution;
            }
            a.velocity = new Vec2(newVelX, newVelY);

            a._updateBoundsFromPosition();
        }
        if(!b.isStatic) {
            b.position = b.position.add(new Vec2(overlapX, overlapY));
            let newVelX = b.velocity.x;
            let newVelY = b.velocity.y;
            if(overlapX) {
                newVelX = -b.velocity.x * a.restitution;
            }
            if(overlapY) {
                newVelY = -b.velocity.y * a.restitution;
            }
            b.velocity = new Vec2(newVelX, newVelY);

            b._updateBoundsFromPosition();
        }


        // if((collision.aDirection.equals(new Vec2(0, 1)) && a.velocity.y > 0) ||
        //     (collision.aDirection.equals(new Vec2(0, -1)) && a.velocity.y < 0)) {
        //         a.acceleration.y = 0;
        //         a.velocity.y = 0;
        // } else if((collision.aDirection.equals(new Vec2(1, 0)) && a.velocity.x > 0) ||
        //     (collision.aDirection.equals(new Vec2(-1, 0)) && a.velocity.x < 0)) {
        //         a.acceleration.x = 0;
        //         a.velocity.x = 0;
        // }
        // if((collision.bDirection.equals(new Vec2(0, 1)) && b.velocity.y > 0) ||
        //     (collision.bDirection.equals(new Vec2(0, -1)) && b.velocity.y < 0)) {
        //         b.acceleration.y = 0;
        //         b.velocity.y = 0;
        // } else if((collision.bDirection.equals(new Vec2(1, 0)) && b.velocity.x > 0) ||
        //     (collision.bDirection.equals(new Vec2(-1, 0)) && b.velocity.x < 0)) {
        //         b.acceleration.x = 0;
        //         b.velocity.x = 0;
        // }

        // idea here is that static masses (mass === 0) don't move their positions
        // other masses share the position change needed to get rid of penetration
        // need to figure out which direction to move based off collision side

        // but actually maybe should just be in opposite direction of velocity (at least
        // for object that caused collision)
        // if(a.mass === 0) {
        //    b.position
        // }
    }
*/
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
        return true;
    }

    resolveAABBOnCircleCollision(aabb, circle, delta) {
        return false;
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
