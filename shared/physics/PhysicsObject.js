'use strict';

const Vec2 = require('./Vec2.js');
const { clamp } = require('./Util.js');

class PhysicsObject {

    static counter = 0;

    constructor(engine, mass, isStatic, overlapOnly) {
        if (this.constructor == PhysicsObject) {
            throw new Error("Abstract classes can't be instantiated.");
        }
        this.id = PhysicsObject.counter;
        PhysicsObject.counter += 1;
        this.engine = engine;
        this.isStatic = isStatic;
        this.overlapOnly = overlapOnly;
        this.position = new Vec2();
        this.velocity = new Vec2();
        this.acceleration = new Vec2();
        this.maxSpeed = -1; // implies infinite
        this.maxVelocityX = -1; // implies infinite
        this.maxVelocityY = -1; // implies infinite
        this.restitution = 0;
        this.friction = 0;
        this.im = mass === 0 || isStatic ? 0 : 1 / mass; // can have infinite mass object moving, but cannot have static object that is not infinite mass
    }

    intersectsAABB() {
        throw new Error("Method 'intersectsAABB()' must be implemented.");
    }

    intersectsCircle() {
        throw new Error("Method 'intersectsCircle()' must be implemented.");
    }

    setPosition(x, y) {
        //x /= this.engine.unitSize;
        //y /= this.engine.unitSize;
        this.position = new Vec2(x, y).round();
    }

    setVelocity(x, y) {
        //x /= this.engine.unitSize;
        //y /= this.engine.unitSize;
        this.velocity = new Vec2(x, y).round();
    }

    setAcceleration(x, y) {
        //x /= this.engine.unitSize;
        //y /= this.engine.unitSize;
        this.acceleration = new Vec2(x, y).round();
    }

    update(delta) {
        if(this.isStatic) {
            return;
        }
        this.top = false;
        this.bottom = false;
        this.left = false;
        this.right = false;

        // update velocity due to acceleration and gravity
        const velChangeX = (this.acceleration.x + this.engine.gravity.x) * delta;
        const velChangeY = (this.acceleration.y + this.engine.gravity.y) * delta;
        this.velocity = this.velocity.add(new Vec2(velChangeX, velChangeY));

        // clamp to max velocity
        let clampVelX = this.velocity.x;
        if(this.maxVelocityX >= 0) {
            clampVelX = clamp(this.velocity.x, this.maxVelocityX, -this.maxVelocityX);
        }
        let clampVelY = this.velocity.y;
        if(this.maxVelocityY >= 0) {
            clampVelY = clamp(this.velocity.y, this.maxVelocityY, -this.maxVelocityY);
        }
        this.velocity = new Vec2(clampVelX, clampVelY);

        // clamp to max speed
        if(this.maxSpeed === 0) {
            this.velocity = new Vec2();
        } else if(this.maxSpeed > 0) {
            const length = this.velocity.length();
            if(length > 0) {
                const multiplier = this.maxSpeed / length;
                const maxVelocity = this.velocity.sMultiply(multiplier);
                this.velocity = this.velocity.clamp(maxVelocity, maxVelocity.neg());
            }
        }

        // update position due to velocity
        this.position = this.position.add(this.velocity.sMultiply(delta));

        this._roundValues();
    }

    _roundValues() {
        this.position = this.position.round();
        if (this.velocity.lengthSquared() < 1) {
            this.velocity = new Vec2();
        } else {
            this.velocity = this.velocity.round();
        }
        this.acceleration = this.acceleration.round();
    }
};

module.exports = PhysicsObject;
