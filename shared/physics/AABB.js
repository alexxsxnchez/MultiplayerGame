'use strict';

const assert = require('assert').strict;
const PhysicsObject = require('./PhysicsObject.js');
const Vec2 = require('./Vec2.js');

class AABB extends PhysicsObject {
    constructor(engine, minX, minY, maxX, maxY, mass, isStatic, overlapOnly) {
        assert(minX < maxX && minY < maxY);
        super(engine, mass, isStatic, overlapOnly);
        this.minBound = new Vec2();
        this.maxBound = new Vec2();
        this.width = maxX - minX;
        this.height = maxY - minY;
        this.setPosition(minX, minY);
        this.top = false;
        this.bottom = false;
        this.left = false;
        this.right = false;
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
};

module.exports = AABB;
