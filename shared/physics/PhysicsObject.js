'use strict';

const Vec2 = require('./Vec2.js');

class PhysicsObject {

	static counter = 0;

	constructor(engine, config = {}) {
		this.id = PhysicsObject.counter;
		PhysicsObject.counter += 1;
		this.engine = engine;
		this.isStatic = config.isStatic || false;
		this.position = config.position || new Vec2(0, 0);
		this.velocity = config.velocity || new Vec2(0, 0);
		this.acceleration = config.acceleration || new Vec2(0, 0);
		this.maxSpeed = config.maxSpeed || -1;
		this.maxVelocityX = config.maxVelocityX || -1;
		this.maxVelocityY = config.maxVelocityY || -1;
		//this.mass = config.mass || 0; // 0 implies infinite (cannot be moved in collisions)
		this._dx = 0;
		this._dy = 0;
		this.bottom = false;
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

		this.roundValues();
	}

	roundValues() {
		this.position.round();
		this.velocity.round();
		this.acceleration.round();
	}
};

module.exports = PhysicsObject;
