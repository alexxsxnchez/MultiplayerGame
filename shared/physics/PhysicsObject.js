'use strict';

const Vec2 = require('./Vec2.js');
const { clamp } = require('./Util.js');

class PhysicsObject {

    static counter = 0;

    constructor(engine, isStatic, mass=0) {
        if (this.constructor == PhysicsObject) {
            throw new Error("Abstract classes can't be instantiated.");
        }
        this.id = PhysicsObject.counter;
        PhysicsObject.counter += 1;
        this.engine = engine;
        this.isStatic = isStatic;
        this.position = new Vec2();
        this.velocity = new Vec2();
        this.acceleration = new Vec2();
        this.maxSpeed = -1;
        this.maxVelocityX = -1;
        this.maxVelocityY = -1;
        this.maxVelocity = new Vec2(-1, -1); // negative numbers implies infinite
        this.restitution = 0;
        this.im = mass === 0 ? 0 : 1 / mass; // 0 implies infinite (cannot be moved in collisions)
        this._dx = 0;
        this._dy = 0;
        this.bottom = false;
    }

    intersectsAABB() {
        throw new Error("Method 'intersectsAABB()' must be implemented.");
    }

    intersectsCircle() {
        throw new Error("Method 'intersectsCircle()' must be implemented.");
    }

    setPosition(x, y) {
        this.position = new Vec2(x, y).round();
    }

    setVelocity(x, y) {
        this.velocity = new Vec2(x, y).round();
    }

    setAcceleration(x, y) {
        this.acceleration = new Vec2(x, y).round();
    }

    update(delta) {
        if(this.isStatic) {
            return;
        }
        this.bottom = false;

        const velChangeX = (this.acceleration.x + this.engine.gravity.x) * delta;
        const velChangeY = (this.acceleration.y + this.engine.gravity.y) * delta;
        this.velocity = this.velocity.add(new Vec2(velChangeX, velChangeY));

        // max velocity

        // if(this.maxVelocityX === 0) {
        //     this.velocity.x = 0;
        // } else if(this.maxVelocityX > 0) {
        //     // bug here: what if velocity.x is negative, but larger in magnitude than maxvelocity? Then we set to maxvelocity which is always positive...
        //     this.velocity.x = this.maxVelocityX > Math.abs(this.velocity.x) ? this.velocity.x : this.maxVelocityX;
        // }
        // if(this.maxVelocityY === 0) {
        //     this.velocity.y = 0;
        // } else if(this.maxVelocityY > 0) {
        //     // same bug as above^
        //     this.velocity.y = Math.abs(this.maxVelocityY) > Math.abs(this.velocity.y) ? this.velocity.y : this.maxVelocityY;
        // }
        // could use clamp function from Vec2 class, but what if only one of
        let clampVelX = this.velocity.x;
        if(this.maxVelocityX >= 0) {
            clampVelX = clamp(this.velocity.x, this.maxVelocityX, -this.maxVelocityX);
        }
        let clampVelY = this.velocity.y;
        if(this.maxVelocityY >= 0) {
            clampVelY = clamp(this.velocity.y, this.maxVelocityY, -this.maxVelocityY);
        }
        this.velocity = new Vec2(clampVelX, clampVelY);

        // max speed
        if(this.maxSpeed === 0) {
            this.velocity = new Vec2();
        } else if(this.maxSpeed > 0) {
            const length = this.velocity.length();
            if(length > 0) {
                const multiplier = this.maxSpeed / length;
                const maxVelocity = this.velocity.sMultiply(multiplier);
                this.velocity = this.velocity.clamp(maxVelocity, maxVelocity.neg());
                // // same bug as above
                // this.velocity.x = Math.abs(maxVelocity.x) > Math.abs(this.velocity.x) ? this.velocity.x : maxVelocity.x;
                // this.velocity.y = Math.abs(maxVelocity.y) > Math.abs(this.velocity.y) ? this.velocity.y : maxVelocity.y;
            }
        }
        this._dx = this.velocity.x * delta;
        this._dy = this.velocity.y * delta;

        this.position = this.position.add(new Vec2(this._dx, this._dy));

        this._roundValues();
    }

    _roundValues() {
        this.position = this.position.round();
        this.velocity = this.velocity.round();
        this.acceleration = this.acceleration.round();
    }
};

module.exports = PhysicsObject;
