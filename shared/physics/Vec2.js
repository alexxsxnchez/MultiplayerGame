'use strict';

class Vec2 {
	constructor(x, y) {
		this.x = x;
		this.y = y;
	}

	add(other) {
		return new Vec2(this.x + other.x, this.y + other.y);
	}

	sMultiply(scalar) {
		return new Vec2(this.x * scalar, this.y * scalar);
	}

	sDivide(scalar) {
		return new Vec2(this.x / scalar, this.y / scalar);
	}

	length() {
		return Math.sqrt(this.x * this.x + this.y * this.y);
	}

	distance(other) {
		return Math.sqrt(this.distanceSquared(other));
	}

	distanceSquared(other) {
		const distX = this.x - other.x;
		const distY = this.y - other.y;
		return distX * distX + distY * distY;
	}

	equals(other) {
		return this.x === other.x && this.y === other.y;
	}

	round() {
		this.x = Number(this.x.toFixed(5));
		this.y = Number(this.y.toFixed(5));
	}
};

module.exports = Vec2;
