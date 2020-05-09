'use strict';

const assert = require('assert').strict;
const PhysicsObject = require('./PhysicsObject.js');
const AABB = require('./AABB.js');
const Vec2 = require('./Vec2.js');

class Circle extends PhysicsObject {
    constructor(centerX, centerY, radius, engine, isStatic) {
        assert(radius > 0);
        super(engine, isStatic);
        this.center = new Vec2();
        this.setPosition(centerX, centerY);
        this.radius = radius;
    }

    update(delta) {
        super.update(delta);
        this._updateCenterFromPosition();
    }

    setPosition(x, y) {
        super.setPosition(x, y);
        this._updateCenterFromPosition();
    }

    _updateCenterFromPosition() {
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
