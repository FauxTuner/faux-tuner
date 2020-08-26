#!/usr/bin/env node
require('../lib/globals');
const { argv } = require('yargs');
const forever = require('forever');
const { Monitor } = require('forever');
const pkg = require('../package.json')

const script = `${__dirname}/server.js`;
const usage = `
Usage:
faux-tuner [start|stop|status]
`;
const PUID = 'faux-tuner';

function runningStatus(faux) {
  let status = '⚪️ STOPPED';
  let isRunning = faux && faux.running;
  if (isRunning) {
    status = '🟢 RUNNING';
  }
  console.log(`${pkg.name} v${pkg.version}`);
  console.log('');
  console.log(`     Status:  ${status}`);
  if (isRunning) {
    console.log(`     Web UI:  ${HTTP_ENDPOINT}`);
    console.log(`XMLTV Guide:  ${HTTP_ENDPOINT}/guide.xml`);
  }
  console.log('');
}

async function sleep(ms) {
  return new Promise((resolve, reject) => {
    setTimeout(resolve, ms);
  });
}

async function waitForStart() {
  return new Promise(async (resolve, reject) => {
    const faux = await findProcess();
    if (faux && faux.running) {
      runningStatus(faux);
      return resolve(faux);
    }
    await sleep(250);
    return waitForStart();
  });
}

function findProcess(list) {
  return new Promise((resolve, reject) => {
    forever.list(false, (err, list) => {
      let faux = list && list.find(({ uid }) => uid === PUID);
      resolve(faux);
    });
  });
}
const actions = {
  start: async () => {
    const child = forever.startDaemon(script, { uid: PUID });
    // forever.startServer(child);
    await waitForStart();
  },
  stop: () => {
    const result = forever.stopAll();
    result.on('error', (e) => {
      runningStatus();
    });
    result.on('stopAll', () => {
      runningStatus();
    });
  },
  status: async () => {
    const faux = await findProcess();
    runningStatus(faux);
  }
};

(async () => {
  const action = argv._[0];
  if (typeof actions[action] === 'function') {
    await actions[action]();
  } else {
    console.log(usage);
  }
})();
