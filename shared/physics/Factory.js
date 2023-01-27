'use strict';

const AABB = require('./AABB.js');
const Circle = require('./Circle.js');
const { Collider } = require('./Collider.js');

class Factory {
    constructor(engine) {
        this.engine = engine;
        this.physicsObjects = engine.physicsObjects;
        this.colliders = engine.colliders;
    }

    AABB(minX=0, minY=0, maxX=1, maxY=1, isStatic=false, mass=1, isWorldBound=false) {
        const aabb = new AABB(minX, minY, maxX, maxY, this.engine, isStatic, mass);
        this.physicsObjects.push(aabb);
        if(this.engine.worldBoundExists && !isWorldBound) {
            this.collider(this.engine.worldWalls, aabb);
        }
        return aabb;
    }

    circle(centerX=0, centerY=0, radius=1, isStatic=false, mass=1) {
        const circle = new Circle(centerX, centerY, radius, this.engine, isStatic, mass);
        this.physicsObjects.push(circle);
        if(this.engine.worldBoundExists) {
            this.collider(this.engine.worldWalls, circle);
        }
        return circle;
    }

    collider(a, b, callback = () => {}) {
        const collider = new Collider(a, b, callback);
        this.colliders.push(collider);
        return collider;
    }
};

module.exports = Factory;
