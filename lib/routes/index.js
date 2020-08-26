const guide = require('./guide');
const imagedata = require('./imagedata');
const mpegts = require('./mpegts');
const ssdp = require('./ssdp');
const tuner = require('./tuner');

const api = require('./protected/api');
const web = require('./protected/web');

module.exports = {
  guide,
  imagedata,
  mpegts,
  ssdp,
  tuner,
  protected: {
    api,
    web
  }
}
