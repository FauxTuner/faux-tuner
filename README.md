## `faux-tuner`

A virtual tuner card and EPG guide for online live TV sources like PlutoTV and Locast. Designed to work with Plex Media Server's [Live TV / DVR](https://www.plex.tv/tv/) feature.

Largely inspired by (and parts shamelessy stolen from) [locast2plex](https://github.com/tgorgdotcom/locast2plex).


##### Services
- PlutoTV
- Locast
- IPTV / HLS Streams (coming soon)
- Redbox Live TV (coming soon)
  https://www.redbox.com/stream-free-live-tv


### Installation
```
npm install -g https://github.com/FauxTuner/faux-tuner.git
```
> If you get a permission error, you may need to use `sudo`:<br>`sudo npm install -g faux-tuner`


### CLI Commands

**Start**
```bash
faux-tuner start
```
**Status**
```bash
faux-tuner status
```
**Stop**
```bash
faux-tuner stop
```

### Simple Server Example
```javascript
const fauxTuner = require('faux-tuner');

fauxTuner.listen(3130, () => {
  console.log('Server listening at localhost:3130');
});
```


### Express Middleware Example
```javascript
const express = require('express');
const fauxTuner = require('faux-tuner');
const app = express();

app.use(fauxTuner);

app.listen(3130, () => {
  console.log('Server listening at localhost:3130');
});

```

## Documentation
Additional guides and documentation is available in our [wiki](https://github.com/FauxTuner/faux-tuner/wiki).

- [Plex-Media-Server-Setup](https://github.com/FauxTuner/faux-tuner/wiki/Plex-Media-Server-Setup)

## Setting up Services

First configure and enable your Live TV providers using the FauxTuner web interface. You can access these at `http://localhost:3130/web/` once your installation of Faux Tuner is up and running.

> **Default Web UI Login:**<br>
> Username: `admin`<br>
> Password: `fauxtuner`<br>


#### Locast
1. Login to the faux-tuner web UI.
1. Click on the Lodash secion.
1. Enter your login credentials.

> An active Locast account is required to access this service. Learn more at https://locast.org


#### PlutoTV
