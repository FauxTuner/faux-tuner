const Locast = require('./services/locast');
const PlutoTV = require('./services/plutotv');
const IpTV = require('./services/iptv');
const { sortByGuideNumber } = require('./utils/sorts');
const log = require('./utils/log');

// const locast = new Locast();
// const plutotv = new PlutoTV();
// const iptv = new IpTV();

class Tuner {
  constructor(options = {}) {
    this.scanning = false;
    this.scanInterval = 1800 * 1000; // every 30 min update channels and guide
// 1800
    this.locast = new Locast();
    this.plutotv = new PlutoTV();
    this.iptv = new IpTV();

    // initial channel scan...
    this.scanTask();

  }
  lineup() {
    return [
      ...this.iptv.serialize(),
      ...this.plutotv.serialize(),
      ...this.locast.serialize()
    ].sort(sortByGuideNumber);
  }
  async guide() {
    const [iptvChannels, iptvPrograms] = this.iptv.epg();
    const [plutoChannels, plutoPrograms] = this.plutotv.epg();

    let locastChannels = [];
    let locastPrograms = [];
    if (this.locast.isAvailable()) {
      [locastChannels, locastPrograms] = this.locast.epg();
    }

    const channels = [
      ...iptvChannels,
      ...plutoChannels,
      ...locastChannels
    ].sort(sortByGuideNumber);

    const programs = [
      ...iptvPrograms,
      ...plutoPrograms,
      ...locastPrograms
    ].sort(sortByGuideNumber);

    return {
      channels,
      programs
    };
  }
  async getStreamUrl(provider, channel_id) {
    let streamUrl;
    if (provider === 'iptv') {
      streamUrl = await this.iptv.getStreamUrl(channel_id)
    } else if (provider === 'locast') {
      streamUrl = await this.locast.getStreamUrl(channel_id)
    } else if (provider === 'plutotv') {
      streamUrl = await this.plutotv.getStreamUrl(channel_id)
    } else {
      throw new Error('Unkown stream provider');
    }
    return streamUrl;
  }
  async scanTask() {
    try {
      await this.scan();
      setTimeout(this.scanTask.bind(this), this.scanInterval);
    } catch(error) {
      log('tuner', error);
    }
  }
  async scan() {
    this.scanning = true;
    log('tuner', 'Scanning... Updating channels and guide data');

    await this.iptv.scanStations();

    await this.plutotv.scanStations();

    if (this.locast.isAvailable()) {
      await this.locast.scanStations();
    }

    this.scanning = false;
  }
}

module.exports = Tuner;
