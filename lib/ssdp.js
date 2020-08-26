const { Router } = require('express');
const { Server, Client } = require('node-ssdp');

let ssdpServer;

module.exports = () => {
  if (!ssdpServer) {
    ssdpServer = new Server({
        location: {
          port: HTTP_PORT,
          path: SSDP_DEVICE_PATH
        },
        udn: `uuid:${DEVICE_ID}`
    });

    ssdpServer.addUSN('upnp:rootdevice');
    ssdpServer.addUSN('urn:schemas-upnp-org:device:MediaServer:1');
    // QUESTION: Are these needed? I don't really understand SSDP...
    ssdpServer.addUSN('urn:schemas-upnp-org:service:ContentDirectory:1');
    ssdpServer.addUSN('urn:schemas-upnp-org:service:ConnectionManager:1');

    // Start the SSDP server
    ssdpServer.start();

    process.on('exit', function(){
      ssdpServer.stop() // advertise shutting down and stop listening
    });
  }
  return ssdpServer;
}
