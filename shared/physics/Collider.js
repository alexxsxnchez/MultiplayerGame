'use strict';

const AABB = require('./AABB.js');
const Circle = require('./Circle.js');
const Vec2 = require('./Vec2.js');

class Collision {
    constructor(a, b, callback, normal, overlap) {
        this.a = a;
        this.b = b;
        this.callback = callback;
        this.normal = normal;
        this.overlap = overlap;
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
        const checkedPairs = new Set();
        for(let a of this.groupA) {
            for(let b of this.groupB) {
                if(a === b || checkedPairs.has(Collision.getPairString(b, a)) || (a.im === 0 && b.im === 0)) {
                    continue;
                }
                let collision;
                if(a instanceof AABB && b instanceof AABB) {
                    collision = this.AABBIntersectsAABB(a, b, this.callback);
                } else if(a instanceof Circle && b instanceof Circle) {
                    collision = this.CircleIntersectsCircle(a, b, this.callback);
                } else if(a instanceof Circle) {
                    collision = this.CircleIntersectsAABB(a, b, this.callback, false);
                } else {
                    collision = this.CircleIntersectsAABB(b, a, this.callback, true);
                }
                if(collision) {
                    collisions.push(collision);
                }
                checkedPairs.add(Collision.getPairString(a, b));
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
            // first we need to find in which direction is the collision taking place (the side with smallest overlap)
            // the following values should all be positive (in _most_ cases -- a lot of "stacking" and strong 
            // penetration could cause a small negative overlap instead)
            const overlapLeftRight = a.maxBound.x - b.minBound.x;
            const overlapRightLeft = b.maxBound.x - a.minBound.x;
            const overlapTopBottom = a.maxBound.y - b.minBound.y;
            const overlapBottomTop = b.maxBound.y - a.minBound.y;

            const overlap = Math.min(Math.min(overlapLeftRight, overlapRightLeft), Math.min(overlapTopBottom, overlapBottomTop));
            let normal;
            if (overlap === overlapLeftRight) {
                normal = new Vec2(1, 0);
                a.right = true;
                b.left = true;
            } else if (overlap === overlapRightLeft) {
                normal = new Vec2(-1, 0);
                a.left = true;
                b.right = true;
            } else if (overlap === overlapTopBottom) {
                normal = new Vec2(0, 1);
                a.bottom = true;
                b.top = true;
            } else {
                normal = new Vec2(0, -1);
                a.top = true;
                b.bottom = true;
            }

            return new Collision(a, b, callback, normal, overlap);
        }
        return null;
    }

    CircleIntersectsCircle(a, b, callback) {
        const intersects = a.position.distanceSquared(b.position) < Math.pow(a.radius + b.radius, 2);
        if(intersects) {
            const distance = b.position.sub(a.position);
            const distanceLength = distance.length();
            const normal = new Vec2(distance.x / distanceLength, distance.y / distanceLength);
            const overlap = a.radius + b.radius - distanceLength;
            return new Collision(a, b, callback, normal, overlap);
        }
        return null;
    }

    CircleIntersectsAABB(circle, aabb, callback, orderReversed) {
        // https://learnopengl.com/In-Practice/2D-Game/Collisions/Collision-Detection
        const halfExtents = new Vec2(aabb.width/2, aabb.height/2);
        const aabbCenter = aabb.position.add(halfExtents);
        const difference = circle.position.sub(aabbCenter);
        const contactPoint = difference.clamp(halfExtents, halfExtents.neg()).add(aabbCenter);
        const intersects = contactPoint.distanceSquared(circle.position) < Math.pow(circle.radius, 2);
        if(intersects) {
            const contactPointToCircle = circle.position.sub(contactPoint);
            const contactPointToCircleLength = contactPointToCircle.length();
            const normal = new Vec2(contactPointToCircle.x / contactPointToCircleLength, contactPointToCircle.y / contactPointToCircleLength);
            const overlap = circle.radius - contactPointToCircleLength;

            // set aabb touching points
            const posToContactPoint = contactPoint.sub(aabb.position);
            if(posToContactPoint.x === 0 && posToContactPoint.y !== 0 && posToContactPoint.y !== aabb.height) {
                aabb.left = true;
            } else if(posToContactPoint.x === aabb.width && posToContactPoint.y !== 0 && posToContactPoint.y !== aabb.height) {
                aabb.right = true;
            } else if(posToContactPoint.y === 0) { // give preference to top/bottom
                aabb.top = true;
            } else if(posToContactPoint.y === aabb.height) {
                aabb.bottom = true;
            }

            if(orderReversed) {
                return new Collision(aabb, circle, callback, normal, overlap);
            }
            return new Collision(circle, aabb, callback, normal, overlap);
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
