'use strict';

const assert = require('assert').strict;
const PhysicsObject = require('./PhysicsObject.js');
const AABB = require('./AABB.js');
const Vec2 = require('./Vec2.js');

class Circle extends PhysicsObject {
    constructor(center = new Vec2(0, 0), radius = 1, engine, config = {}) {
        assert(radius > 0);
        config.position = center;
        super(engine, config);
        this.center = center;
        this.radius = radius;
    }

    update(delta) {
        super.update(delta);
        this.updateCenterFromPosition();
    }

    updateCenterFromPosition() {
        this.center.x = this.position.x;
        this.center.y = this.position.y;
    }

    intersectsAABB(other) {
        console.log("Circle on AABB");
        return false;
    }

    intersectsCircle(other) {
        return this.center.distanceSquared(other.center) < Math.pow(this.radius + other.radius, 2);
    }
}

module.exports = Circle;
