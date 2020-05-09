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
        this.minBound.x = this.position.x;
        this.maxBound.x = this.position.x + this.width;
        this.minBound.y = this.position.y;
        this.maxBound.y = this.position.y + this.height;
    }

    intersectsAABB(other) {
        return this.minBound.x < other.maxBound.x && 
            this.maxBound.x > other.minBound.x &&
            this.minBound.y < other.maxBound.y &&
            this.maxBound.y > other.minBound.y;
    }

    intersectsCircle(other) {
        console.log("AABB on Circle");
        return false;
    }
};

module.exports = AABB;
