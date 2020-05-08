'use strict';

import Player from "./player.js";

export default class MainPlayer extends Player {
	constructor(scene, players, playerInfo) {
		super(scene, players, playerInfo);
		
	}

	update() {
		const sprite = this.sprite;
		const cursors = this.cursors;
		const pad = this.scene.pad;
		const isSprinting = (this.keyW.isDown || (pad && pad.X));
		const onGround = sprite.body.blocked.down;
		const acceleration = onGround ? 600 : 600;
	
		if (cursors.left.isDown || (pad && pad.left)) {
			if (isSprinting) {
				sprite.setAccelerationX(-acceleration);
			} else {
				sprite.setAccelerationX(0);
				sprite.setVelocityX(-160);
			}
			//sprite.setVelocityX(-160 * multiplier);
			sprite.anims.play('left', true);
			sprite.anim = 'left';
	
		} else if (cursors.right.isDown || (pad && pad.right)) {
			if (isSprinting) {
				sprite.setAccelerationX(acceleration);
			} else {
				sprite.setAccelerationX(0);
				sprite.setVelocityX(160);
			}
			//sprite.setVelocityX(160 * multiplier);
			sprite.anims.play('right', true);
			sprite.anim = 'right';
	
		} else {
			sprite.setAccelerationX(0);
			sprite.anims.play('turn');
			sprite.anim = 'turn';
	
		}
		if ((cursors.up.isDown || (pad && pad.A)) && sprite.body.touching.down) {
			//sprite.setVelocityY(-330);
			sprite.setVelocityY(-500);
		}
		if((cursors.down.isDown || (pad && pad.down)) && !sprite.body.touching.down) {
			const velocity = Math.max(sprite.body.velocity.y + 30, 30);
			sprite.setVelocityY(velocity);
		}
		if (sprite.oldPosition && (sprite.x !== sprite.oldPosition.x || sprite.y !== sprite.oldPosition.y)) {
			this.scene.socket.emit('playerMovement', { x: sprite.x, y: sprite.y, anim: sprite.anim });
		}
	
		sprite.oldPosition = {
			x: sprite.x,
			y: sprite.y
		};
	}
};
