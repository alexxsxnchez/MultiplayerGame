'use strict';

const AABB = require('./AABB.js');
const Vec2 = require('./Vec2.js');

class Collision {
    constructor(a, b, callback, extra_data={}) {
        this.a = a;
        this.b = b;
        this.callback = callback;
        this.extra_data = extra_data;
    }

    static getPairString(a, b) {
        return `${a.id}:${b.id}`;
    }
}

class Collider {
    constructor(a, b, callback = () => {}) {
        this.groupA = a instanceof Array ? a : [a];
        this.groupB = b instanceof Array ? b : [b];
        this.callback = callback;
    }

    // TODO: can do this more efficiently
    // could do broad / narrow search
    // sort and sweep algo
    findCollisions() {
        const collisions = [];
        const pairs = new Set();
        for(let a of this.groupA) {
            for(let b of this.groupB) {
                if(a === b || pairs.has(Collision.getPairString(b, a)) || (a.im === 0 && b.im === 0)) {
                    continue;
                }
                let collision;
                if(a instanceof AABB) {
                    if(b instanceof AABB) {
                        collision = this.AABBIntersectsAABB(a, b, this.callback);
                    } else {
                        collision = this.CircleIntersectsAABB(b, a, this.callback, true);
                    }
                } else {
                    if(b instanceof AABB) {
                        collision = this.CircleIntersectsAABB(a, b, this.callback, false);
                    } else {
                        collision = this.CircleIntersectsCircle(a, b, this.callback);
                    }
                }
                if(collision) {
                    collisions.push(collision);
                }
                pairs.add(Collision.getPairString(a, b));
            }
        }
        return collisions;
    }

    AABBIntersectsAABB(a, b, callback) {
        const intersects = a.minBound.x < b.maxBound.x &&
            a.maxBound.x > b.minBound.x &&
            a.minBound.y < b.maxBound.y &&
            a.maxBound.y > b.minBound.y;
        if(intersects) {
            return new Collision(a, b, callback);
        }
        return null;
    }


    CircleIntersectsAABB(circle, aabb, callback, orderReversed) {
        const halfExtents = new Vec2(aabb.width/2, aabb.height/2);
        const aabbCenter = aabb.position.add(halfExtents);
        const difference = circle.position.sub(aabbCenter);
        const contactPoint = difference.clamp(halfExtents, halfExtents.neg()).add(aabbCenter);
        const intersects = contactPoint.distanceSquared(circle.position) < Math.pow(circle.radius, 2);
        if(intersects) {
            const extra_data = {
                "contactPoint": contactPoint,
            };
            if(orderReversed) {
                return new Collision(aabb, circle, callback, extra_data);
            }
            return new Collision(circle, aabb, callback, extra_data);
        }
        return null;
    }

    CircleIntersectsCircle(a, b, callback) {
        const intersects = a.position.distanceSquared(b.position) < Math.pow(a.radius + b.radius, 2);
        if(intersects) {
            return new Collision(a, b, callback);
        }
        return null;
    }

    removeObject(object) {
        let index = this.groupA.findIndex(element => {
            return element.id === object.id
        });
        if(index >= 0) {
            this.groupA.splice(index, 1);
        }
        index = this.groupB.findIndex(element => {
            return element.id === object.id
        });
        if(index >= 0) {
            this.groupB.splice(index, 1);
        }
    }
};

module.exports = { Collider, Collision };
