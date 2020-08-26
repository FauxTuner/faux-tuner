const express = require('express');
const basicAuth = require('express-basic-auth');

const authMiddleware = basicAuth({
    users: {
      'admin': 'fauxtuner'
    },
    challenge: true,
    realm: 'f40xt0n3r1777a'
});

module.exports = authMiddleware;
