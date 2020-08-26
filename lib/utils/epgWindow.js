const moment = require('moment');

function epgWindow() {
  const m = moment().startOf('hour');
  return {
    start: m.toISOString(),
    stop: m.add(4, 'hours').toISOString(),
  }
}
module.exports = epgWindow;
