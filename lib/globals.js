const path = require('path');
const address = require('address');
const makeDir = require('make-dir');
const envPaths = require('env-paths');

const paths = envPaths('faux-tuner', { suffix: 'data' });
makeDir.sync(paths.data);
global.APP_DATA_PATH = paths.data;
global.IMAGE_DATA_PATH = path.join(APP_DATA_PATH, 'images');
makeDir.sync(IMAGE_DATA_PATH);

const db = require('./database')();
global.DEVICE_ID = db.get('device_id').value();

global.HTTP_PORT = 3130;
global.IP_ADDR = address.ip();
global.HTTP_ENDPOINT = `http://${IP_ADDR}:${HTTP_PORT}`;
global.DEVICE_UUID_FILE = '/home/pi/tuner/device_uuid';

global.SSDP_DEVICE_PATH = '/device.xml';

const suffix = DEVICE_ID.replace(/\-/g, '').substr(0, 8); // 8 character random id appended to simulate a real hdhomerun device name
global.DEVICE_NAME = `FauxTuner ${suffix}`;
global.HDHR_MANUFACTURER = 'Silicondust';
global.HDHR_MODEL = 'HDHR3-US'; //HDHR4-2US
global.HDHR_FIRMWARE_NAME = 'hdhomerun3_atsc';
global.HDHR_FIRMWARE_VERSION = '20150826';

global.APP_DIR = path.resolve(`${__dirname}/../node_modules/faux-tuner-ui/build`);
