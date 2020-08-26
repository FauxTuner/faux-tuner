const moment = require('moment');
const chalk = require('chalk');

function logMessage(prefix, ...args) {
  let line = prefix;
  if (args.length) {
    line = `[${prefix}] `;
    line += args.map((value, key) => {
      return typeof value === 'object' ? JSON.stringify(value, null, 1) : value.toString();
    });
  }
  return line;
}

function log(prefix, ...args) {
  let line = logMessage(prefix, ...args);
  const ts = moment().format('YYYY-MM-DD LTS')
  console.log(chalk.green(`${ts}: ${line}`));
}

log.prototype.error = (prefix, ...args) => {
  let line = logMessage(prefix, ...args);
  const ts = moment().format('YYYY-MM-DD LTS')
  console.log(chalk.red.bold(`${ts}: ${line}`));
}

module.exports = log;
