'use strict';


/// not used


const assert = require('assert').strict;
const AABB = require('./AABB.js');
const Circle = require('./Circle.js');

class Body {

	intersects(other) {
		if(other instanceof AABB) {
			return this._intersectsAABB(other);
		}
		if(other instanceof Circle) {
			return this._intersectsCircle(other);
		}
		assert.fail("Unknown class type");
	}

	__intersectsAABB() {
		assert.fail('Cannot use this method from base class!');
	}

	__intersectsCircle() {
		assert.fail('Cannot use this method from base class!');
	}
};

module.exports = Body;
