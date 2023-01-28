'use strict';

const assert = require('assert').strict;
const PhysicsObject = require('./PhysicsObject.js');

class Circle extends PhysicsObject {
    constructor(engine, centerX, centerY, radius, mass, isStatic, overlapOnly) {
        assert(radius > 0);
        super(engine, mass, isStatic, overlapOnly);
        this.setPosition(centerX, centerY);
        this.radius = radius;
    }
}

module.exports = Circle;
