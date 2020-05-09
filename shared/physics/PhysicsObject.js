'use strict';

const Vec2 = require('./Vec2.js');

class PhysicsObject {

    static counter = 0;

    constructor(engine, isStatic) {
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
        // this.mass = 0; // 0 implies infinite (cannot be moved in collisions)
        this._dx = 0;
        this._dy = 0;
        this.bottom = false;
    }

    setPosition(x, y) {
        this.position.x = x;
        this.position.y = y;
        this.position.round();
    }

    setVelocity(x, y) {
        this.velocity.x = x;
        this.velocity.y = y;
        this.velocity.round();
    }

    setAcceleration(x, y) {
        this.acceleration.x = x;
        this.acceleration.y = y;
        this.acceleration.round();
    }

    update(delta) {
        if(this.isStatic) {
            return;
        }
        this.bottom = false;

        this.velocity.x += (this.acceleration.x + this.engine.gravity.x) * delta;
        this.velocity.y += (this.acceleration.y + this.engine.gravity.y) * delta;
        // max velocity
        if(this.maxVelocityX === 0) {
            this.velocity.x = 0;
        } else if(this.maxVelocityX > 0) {
            this.velocity.x = Math.abs(this.maxVelocityX) > Math.abs(this.velocity.x) ? this.velocity.x : this.maxVelocityX;
        }
        if(this.maxVelocityY === 0) {
            this.velocity.y = 0;
        } else if(this.maxVelocityY > 0) {
            this.velocity.y = Math.abs(this.maxVelocityY) > Math.abs(this.velocity.y) ? this.velocity.y : this.maxVelocityY;
        }
        // max speed
        if(this.maxSpeed === 0) {
            this.velocity.x = 0;
            this.velocity.y = 0;
        } else if(this.maxSpeed > 0) {
            const length = this.velocity.length();
            if(length > 0) {
                const multiplier = this.maxSpeed / length;
                const maxVelocity = this.velocity.sMultiply(multiplier);
                this.velocity.x = Math.abs(maxVelocity.x) > Math.abs(this.velocity.x) ? this.velocity.x : maxVelocity.x;
                this.velocity.y = Math.abs(maxVelocity.y) > Math.abs(this.velocity.y) ? this.velocity.y : maxVelocity.y;
            }
        }
        this._dx = this.velocity.x * delta;
        this._dy = this.velocity.y * delta;

        this.position.x += this._dx;
        this.position.y += this._dy;

        this._roundValues();
    }

    _roundValues() {
        this.position.round();
        this.velocity.round();
        this.acceleration.round();
    }
};

module.exports = PhysicsObject;
