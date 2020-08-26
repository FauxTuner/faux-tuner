const express = require('express');
const authMiddleware = require('../../middleware/auth');

const iptv = require('./api/iptv');
const locast = require('./api/locast');

const app = new express.Router();

app.use(authMiddleware);
app.use(express.json());
app.use('/iptv', iptv);
app.use('/locast', locast);

module.exports = app;
