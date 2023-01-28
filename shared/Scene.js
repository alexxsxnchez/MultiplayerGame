'use strict';

const Engine = require('./physics/engine.js');
const Factory = require('./physics/Factory.js');

class Scene {

    constructor(config={}) {
        super();
        this.started = false;
        this.paused = false;
        this._engine = new Engine(config.gravity);
        this.add = new Factory(this._engine);

        if(config.worldBounds) {
            this.add.worldBounds(config.worldBounds.x, config.worldBounds.y);
        }

        this._maxFPS = 60;
        this._timestep = 1 / this._maxFPS;
    }

    start() {
        this.preload();
        this.create();
        this._gameLoop();
    }

    removeObject(obj) {
        this._engine.removeObject(obj);
    }

    async _sleep(s) {
        return new Promise(resolve => setTimeout(resolve, s*1000));
    }

    _now() {
        return Date.now() / 1000 // in seconds
    }

    async _gameLoop() {
        this.started = true;
        this.paused = false;
        const timestep = this._timestep;
        let delta = 0;
        let prev = this._now() - timestep;
        while(!this.paused) {
            const now = this._now();
            delta += now - prev;
            if(delta < timestep) {
                await this._sleep(timestep);
                continue;
            }
            this.preUpdate();
            prev = now;
            let numUpdateSteps = 0;
            while(delta >= timestep) {
                this._engine.nextStep(timestep);
                delta -= timestep;
                numUpdateSteps++;
                if(numUpdateSteps > 240) {
                    // panic
                    console.error('panic');
                    this._engine.nextStep(delta);
                    delta = 0;
                }
            }
            this.postUpdate();
        }
    }

    pause() {
        this.paused = true;
    }

    preload() {
        throw new Error("Method 'preload()' must be implemented.");
    }

    create() {
        throw new Error("Method 'create()' must be implemented.");
    }

    preUpdate() {
        throw new Error("Method 'preUpdate()' must be implemented.");
    }

    postUpdate() {
        throw new Error("Method 'postUpdate()' must be implemented.");
    }
}

module.exports = Scene;
