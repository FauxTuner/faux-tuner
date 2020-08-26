const low = require('lowdb');
const { v4: uuid } = require('uuid');
const FileSync = require('lowdb/adapters/FileSync');
const path = require('path');

const iptvDefaults = require('../data/default_iptv.json');

const databasePath = path.join(APP_DATA_PATH, 'settings.json');
console.log(databasePath);
const adapter = new FileSync(databasePath)
const db = low(adapter)

// Set some defaults (required if your JSON file is empty)
db.defaults({
  device_id: uuid(),
  locast: {
    current_location: {},
    token: null
  },
  iptv: iptvDefaults
}).write()

module.exports = () => {
  return db;
};
