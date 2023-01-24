'use strict';

const assert = require('assert').strict;
const PhysicsObject = require('./PhysicsObject.js');
const AABB = require('./AABB.js');
const Vec2 = require('./Vec2.js');

class Circle extends PhysicsObject {
    constructor(centerX, centerY, radius, engine, isStatic) {
        assert(radius > 0);
        super(engine, isStatic);
        this.setPosition(centerX, centerY);
        this.radius = radius;
    }

    intersectsAABB(aabb) {
        console.log("Circle on AABB");
        return false;
    }

    intersectsCircle(otherCircle) {
        return this.position.distanceSquared(otherCircle.position) < Math.pow(this.radius + otherCircle.radius, 2);
    }
}

module.exports = Circle;
