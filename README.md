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

### Documentation
Additional guides and documentation is available in our [wiki](https://github.com/FauxTuner/faux-tuner/wiki).

- [Plex-Media-Server-Setup](https://github.com/FauxTuner/faux-tuner/wiki/Plex-Media-Server-Setup)


### Basic Usage

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

You can also use faux-tuner in your own projects as a standalone library.

#### Simple Server Example
```javascript
const fauxTuner = require('faux-tuner');

fau#xTuner.listen(3130, () => {
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
