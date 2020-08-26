const express = require('express');

const app = new express.Router();

app.use(express.static(IMAGE_DATA_PATH));

module.exports = app;
