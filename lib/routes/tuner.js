const { Router } = require('express');
const uuid = require('uuid');
const address = require('address');

const app = new Router();

app.get('/mpegts/:channel_id', (req, res) => {
  res.send();
});

app.get('/discover.json', async (req, res) => {
  res.json({
    'FriendlyName': DEVICE_NAME,
    'Manufacturer': HDHR_MANUFACTURER,
    'ModelNumber': HDHR_MODEL,
    'FirmwareName': HDHR_FIRMWARE_NAME,
    'FirmwareVersion': HDHR_FIRMWARE_VERSION,
    'DeviceID': DEVICE_ID,
    'DeviceAuth': 'tunefu',
    'TunerCount': 2,
    'ConditionalAccess': 1,
    'BaseURL': HTTP_ENDPOINT,
    'LineupURL': `${HTTP_ENDPOINT}/lineup.json`
  });
});
app.get('/lineup_status.json', (req, res) => {
  const { tuner } = req.app.locals;
  if (tuner.scanning) {
    res.json({
      'ScanInProgress': 1,
      'Progress': 50,
      'Found': 5
    })
  } else {
    res.json({
      'ScanInProgress': 0,
      'ScanPossible': 1,
      'Source': 'Antenna',
      'SourceList': [
        'Antenna'
      ]
    });
  }
});
app.get('/lineup.json', async (req, res) => {
  const { tuner } = req.app.locals;
  const lineup = await tuner.lineup();
  res.json(lineup);
});

app.post('/lineup.post', (req, res) => {
  const { tuner } = req.app.locals;
  const { scan, source } = req.query;
  console.log('Request to scan channels...');
  if (scan === 'start') {
    tuner.scan();
  }
  res.send('');
});

module.exports = app;
