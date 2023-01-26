'use strict';

const AABB = require('./AABB.js');

class Collision {
    constructor(a, b, callback) {
        this.a = a;
        this.b = b;
        this.callback = callback;
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
                if(a === b || pairs.has(`${b.id},${a.id}`) || (a.im === 0 && b.im === 0)) {
                    continue;
                }
                const intersects = b instanceof AABB ? a.intersectsAABB(b) : a.intersectsCircle(b);
                if(intersects) {
                    const collision = new Collision(a, b, this.callback);
                    collisions.push(collision);
                }
                pairs.add(`${a.id},${b.id}`);
            }
        }
        return collisions;
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

module.exports = Collider;
