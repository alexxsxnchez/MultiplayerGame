'use strict';

export default class Player {
	constructor(scene, playerInfo) {
		this.scene = scene;
		this.sprite = scene.physics.add.sprite(playerInfo.x, playerInfo.y, 'bigmario');
		//this.sprite.setTint(0x66FF66);
		//this.sprite.setDragX(10);
		this.sprite.setDragX(1000);
		//this.sprite.setDamping(true);
		this.sprite.setMaxVelocity(300, 400);
		this.sprite.setCollideWorldBounds(true);
		this.sprite.player = this;
		// drag of 1000 good for ice
		this.id = playerInfo.id;
		this.score = 0;
		this.hp = 2;
		this.prefix = 'big';
		this.oldPosition = {
			x: playerInfo.x,
			y: playerInfo.y,
			isSprinting: false
		};

		this.sprite.setSize(this.sprite.width - 2, this.sprite.height - 1);
		//scene.add.existing(this.sprite)
		//scene.physics.add.existing(this.sprite)

		//  Input Events
		this.cursors = scene.input.keyboard.createCursorKeys();
		this.keyW = scene.input.keyboard.addKey('W');
	}

	loseHealth() {
		this.hp--;
		if(this.hp === 0) {
			this.anim = 'dead';
			this.sprite.anims.play(this.anim);
			return true;
		}
		this.sprite.setSize(this.sprite.body.width, 15);
		this.sprite.setTexture('smallmario');
		this.prefix = 'sm';
		
		return false;
	}

	update() {
		if(Math.abs(this.sprite.body.velocity.x) === this.sprite.body.maxVelocity.x) {
			console.log("max!");
		}
		const sprite = this.sprite;
		const cursors = this.cursors;
		const pad = this.scene.pad;

		//sprite.setSize(14, this.hp == 2 ? 31 : 15);

		const isSprinting = sprite.body.onFloor() ? (this.keyW.isDown || (pad && pad.X)) : this.oldPosition.isSprinting;
		
		const acceleration = 200;//isSprinting ? 400 : 200;
		const maxVelocity = isSprinting ? 220 : 100;
		//const walkingSpeed = 140;//180;
		sprite.setMaxVelocity(maxVelocity, 400);
	
		if (cursors.left.isDown || (pad && pad.left)) {
			/*if (isSprinting) {
				sprite.setAccelerationX(-acceleration);
			} else {
				sprite.setAccelerationX(0);
				sprite.setVelocityX(-walkingSpeed);
			}*/
			if(sprite.body.velocity.x > 0) {
				sprite.setAccelerationX(0);
			} else {
				sprite.setAccelerationX(-acceleration);
			}
			//setVelocityX(-160 * multiplier);
			this.anim = this.prefix + '_walking';
			sprite.anims.play(this.anim, true);
			sprite.setFlipX(true);
	
		} else if (cursors.right.isDown || (pad && pad.right)) {
			/*if (isSprinting) {
				sprite.setAccelerationX(acceleration);
			} else {
				sprite.setAccelerationX(0);
				sprite.setVelocityX(walkingSpeed);
			}*/
			if(sprite.body.velocity.x < 0) {
				sprite.setAccelerationX(0);
			} else {
				sprite.setAccelerationX(acceleration);
			}
			//setVelocityX(160 * multiplier);
			this.anim = this.prefix + '_walking';
			sprite.anims.play(this.anim, true);
			sprite.setFlipX(false);
	
		} else {
			sprite.setAccelerationX(0);
			this.anim = this.prefix + '_idle';
			sprite.anims.play(this.anim, true);
	
		}
		if ((cursors.up.isDown || (pad && pad.A)) && sprite.body.onFloor()) {
			//setVelocityY(-330);
			//sprite.setVelocityY(-500);
			sprite.setVelocityY(-330);
		}
		if(cursors.down.isDown || (pad && pad.down)) {
			if(sprite.body.onFloor()) {
				//sprite.setSize(16, 16);
				//sprite.setTexture('smallmario');
			} else {
				const velocity = Math.max(sprite.body.velocity.y + 30, 30);
				sprite.setVelocityY(velocity);
			}
		}
		if(!sprite.body.onFloor()) {
			this.anim = this.prefix + '_jumping';
			sprite.anims.play(this.anim, true);
		}
		if (this.oldPosition && (sprite.x !== this.oldPosition.x || sprite.y !== this.oldPosition.y)) {
			this.scene.socket.emit('playerMovement', { x: sprite.x, y: sprite.y, anim: this.anim, score: this.score });
		}
	
		this.oldPosition = {
			x: sprite.x,
			y: sprite.y,
			isSprinting: isSprinting
		};
	}
};
