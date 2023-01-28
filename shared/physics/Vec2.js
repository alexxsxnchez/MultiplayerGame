'use strict';

const assert = require('assert').strict;

class Vec2 {
    constructor(x=0, y=0) {
        this.x = x;
        this.y = y;
        Object.freeze(this); // make this class immutable
    }

    X() {
        return new Vec2(this.x, 0);
    }

    Y() {
        return new Vec2(0, this.y);
    }

    replaceX(value) {
        return new Vec2(value, this.y);
    }

    replaceY(value) {
        return new Vec2(this.x, value);
    }

    add(other) {
        return new Vec2(this.x + other.x, this.y + other.y);
    }

    sub(other) {
        return new Vec2(this.x - other.x, this.y - other.y);
    }

    sMultiply(scalar) {
        return new Vec2(this.x * scalar, this.y * scalar);
    }

    sDivide(scalar) {
        return new Vec2(this.x / scalar, this.y / scalar);
    }

    neg() {
        return this.sMultiply(-1);
    }

    dot(other) {
        return this.x * other.x + this.y * other.y;
    }

    clamp(maxVec, minVec) {
        const x = Math.max(Math.min(this.x, maxVec.x), minVec.x);
        const y = Math.max(Math.min(this.y, maxVec.y), minVec.y);
        return new Vec2(x, y);
    }

    length() {
        return Math.sqrt(this.lengthSquared());
    }

    lengthSquared() {
        return this.x * this.x + this.y * this.y;
    }

    distance(other) {
        return Math.sqrt(this.distanceSquared(other));
    }

    distanceSquared(other) {
        const distX = this.x - other.x;
        const distY = this.y - other.y;
        return distX * distX + distY * distY;
    }

    normalize() {
        const length = this.length();
        if (length === 0) {
            return new Vec2();
        }
        return new Vec2(this.x / length, this.y / length);
    }

    equals(other) {
        return this.x === other.x && this.y === other.y;
    }

    round() {
        const x = Number(this.x.toFixed(5));
        const y = Number(this.y.toFixed(5));
        return new Vec2(x, y);
    }
};

module.exports = Vec2;
