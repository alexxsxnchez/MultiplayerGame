'use strict';

function clamp(val, max, min) {
    return Math.max(Math.min(val, max), min);
}

module.exports = {
    clamp,
}
