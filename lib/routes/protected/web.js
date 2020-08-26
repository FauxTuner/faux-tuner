const express = require('express');
const path = require('path');
const authMiddleware = require('../../middleware/auth');
const app = new express.Router();

app.use(authMiddleware);

app.use(express.static(APP_DIR));
app.get('/*', (req, res) => {
  res.sendFile(path.join(APP_DIR, 'index.html'));
});

module.exports = app;
