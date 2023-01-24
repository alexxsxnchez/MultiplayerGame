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
    // also if a and b are same array, some improvements can be made
    findCollisions() {
        const collisions = [];
        for(let a of this.groupA) {
            for(let b of this.groupB) {
                if(a === b) {
                    continue;
                }
                const intersects = b instanceof AABB ? a.intersectsAABB(b) : a.intersectsCircle(b);
                if(intersects) {
                    const collision = new Collision(a, b, this.callback);
                    collisions.push(collision);
                }
            }
        }
        return collisions;
    }

    removeObject(object) {
        let index = this.groupA.findIndex(element => {
            element.id === object.id
        });
        if(index >= 0) {
            this.groupA.splice(index, 1);
        }
        index = this.groupB.findIndex(element => {
            element.id === object.id
        });
        if(index >= 0) {
            this.groupB.splice(index, 1);
        }
    }
};

module.exports = Collider;
