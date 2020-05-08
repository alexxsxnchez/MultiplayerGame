'use strict';

const assert = require('assert').strict;
const PhysicsObject = require('./PhysicsObject.js');
const Circle = require('./Circle.js');
const Vec2 = require('./Vec2.js');

class AABB extends PhysicsObject {
	constructor(minBound = new Vec2(0, 0), maxBound = new Vec2(1, 1), engine, config = {}) {
		assert(minBound.x < maxBound.x && minBound.y < maxBound.y);
		config.position = minBound;
		super(engine, config);
		this.minBound = minBound;
		this.maxBound = maxBound;
		this.width = maxBound.x - minBound.x;
		this.height = maxBound.y - minBound.y;
	}

	update(delta) {
		super.update(delta);
		this.updateBoundsFromPosition();
	}

	updateBoundsFromPosition() {
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
