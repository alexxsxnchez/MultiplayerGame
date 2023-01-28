'use strict';

const express = require('express');
const Game = require('./game.js');

const app = express();
const port = process.env.PORT || 1000;

app.use(express.static('public'));

const server = app.listen(port, () => {
    console.log(`Listening on port ${port}`);
});

new Game(server);
