'use strict';

const express = require('express');
const ServerScene = require('./serverScene.js');

const app = express();
const port = process.env.PORT || 1000;

app.use(express.static('public'));

const server = app.listen(port, () => {
    console.log(`Listening on port ${port}`);
});

new ServerScene(server);
