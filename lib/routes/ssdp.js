const { Router } = require('express');
// const builder = require('xmlbuilder');
const { create } = require('xmlbuilder2');

// Start SSDP server
require('../ssdp')();

const app = new Router();

// const suffix = DEVICE_ID.replace(/\-/g, '').substr(0, 8); // 8 character id to simulate a real hdhomerun device name
// const deviceName = `${DEVICE_NAME}-${suffix}`;

app.get(SSDP_DEVICE_PATH, async (req, res) => {

  // const doc = create();
  // const root = doc.ele('urn:schemas-upnp-org:device-1-0', 'root');
  //
  // const specVersion = root.ele('specVersion');
  // specVersion.ele('major').txt('1');
  // specVersion.ele('minor').txt('0');
  //
  // const device = root.ele('device');
  // device.ele('deviceType').txt('urn:schemas-upnp-org:device:MediaServer:1');
  // device.ele('friendlyName').txt(deviceName);
  // device.ele('manufacturer').txt(HDHR_MANUFACTURER);
  // device.ele('modelName').txt(HDHR_MODEL);
  // device.ele('modelNumber').txt(HDHR_MODEL);
  // device.ele('UDN').txt(`uuid:${DEVICE_ID}`);
  // device.ele('URLBase').txt(HTTP_ENDPOINT);
  //
  // const xml = root.doc().end({ prettyPrint: true });

  const xml = `<root xmlns="urn:schemas-upnp-org:device-1-0">
      <specVersion>
          <major>1</major>
          <minor>0</minor>
      </specVersion>
      <device>
          <deviceType>urn:schemas-upnp-org:device:MediaServer:1</deviceType>
          <friendlyName>${DEVICE_NAME}</friendlyName>
          <manufacturer>${HDHR_MANUFACTURER}</manufacturer>
          <modelName>${HDHR_MODEL}</modelName>
          <modelNumber>${HDHR_MODEL}</modelNumber>
          <serialNumber/>
          <UDN>uuid:${DEVICE_ID}</UDN>
          <URLBase>${HTTP_ENDPOINT}</URLBase>
      </device>
  </root>`;

  res.set('Content-type', 'application/xml');
  res.send(xml);

});

module.exports = app;
