'use strict';

const AABB = require('./AABB.js');
const Circle = require('./Circle.js');
const { Collider } = require('./Collider.js');

class Factory {
    constructor(engine) {
        this.engine = engine;
        this._worldWalls = null;
    }

    AABB(minX=0, minY=0, maxX=1, maxY=1, { mass=1, isStatic=false, overlapOnly=false, isWorldBound=false }={}) {
        const aabb = new AABB(this.engine, minX, minY, maxX, maxY, mass, isStatic, overlapOnly);
        this.engine.physicsObjects.push(aabb);
        if(this._worldWalls && !isWorldBound) {
            this.collider(this._worldWalls, aabb);
        }
        return aabb;
    }

    circle(centerX=0, centerY=0, radius=1, { mass=1, isStatic=false, overlapOnly=false }={}) {
        const circle = new Circle(this.engine, centerX, centerY, radius, mass, isStatic, overlapOnly);
        this.engine.physicsObjects.push(circle);
        if(this._worldWalls) {
            this.collider(this._worldWalls, circle);
        }
        return circle;
    }

    collider(a, b, callback = () => {}) {
        const collider = new Collider(a, b, callback);
        this.engine.colliders.push(collider);
        return collider;
    }

    worldBounds(worldWidth, worldHeight) {
        const WORLD_BUFFER = 1000000;
        this._worldWalls = [
            this.AABB(-WORLD_BUFFER, 0, 0, worldHeight, {mass: 0, isStatic: true, isWorldBound: true}), // left
            this.AABB(0, -WORLD_BUFFER, worldWidth, 0, {mass: 0, isStatic: true, isWorldBound: true}), // top
            this.AABB(worldWidth, 0, worldWidth + WORLD_BUFFER, worldHeight, {mass: 0, isStatic: true, isWorldBound: true}), // right
            this.AABB(0, worldHeight, worldWidth, worldHeight + WORLD_BUFFER, {mass: 0, isStatic: true, isWorldBound: true}), // bottom
        ]
    }
};

module.exports = Factory;
