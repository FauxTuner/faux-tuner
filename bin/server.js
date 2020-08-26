#!/usr/bin/env node

const server = require('../lib/server');
const log = require('../lib/utils/log');

server.listen(HTTP_PORT, () => {
  log('app', `Server running at: ${HTTP_ENDPOINT}`);
});
