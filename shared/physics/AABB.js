'use strict';

const assert = require('assert').strict;
const PhysicsObject = require('./PhysicsObject.js');
const Circle = require('./Circle.js');
const Vec2 = require('./Vec2.js');

class AABB extends PhysicsObject {
    constructor(minX, minY, maxX, maxY, engine, isStatic) {
        assert(minX < maxX && minY < maxY);
        super(engine, isStatic);
        this.minBound = new Vec2();
        this.maxBound = new Vec2();
        this.width = maxX - minX;
        this.height = maxY - minY;
        this.setPosition(minX, minY);
    }

    update(delta) {
        super.update(delta);
        this._updateBoundsFromPosition();
    }

    setPosition(x, y) {
        super.setPosition(x, y);
        this._updateBoundsFromPosition();
    }

    _updateBoundsFromPosition() {
        this.minBound = new Vec2(this.position.x, this.position.y);
        this.maxBound = new Vec2(this.position.x + this.width, this.position.y + this.height);
    }

    intersectsAABB(aabb) {
        return this.minBound.x < aabb.maxBound.x &&
            this.maxBound.x > aabb.minBound.x &&
            this.minBound.y < aabb.maxBound.y &&
            this.maxBound.y > aabb.minBound.y;
    }

    intersectsCircle(circle) {
        console.log("AABB on Circle");
        return false;
    }
};

module.exports = AABB;
