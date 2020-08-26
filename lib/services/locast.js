const got = require('got');
const moment = require('moment');
const db = require('../database')();
// const { epgWindow, sortByGuideNumber, log } = require('./utils');
const log = require('../utils/log');
const epgWindow = require('../utils/epgWindow');

const LOCAST_API = 'https://api.locastnet.org/api';
const GEO_JS_API = 'https://get.geojs.io/v1/ip/geo.json';

const fcc_stations = require('../../data/tv_stations.json');
const known_stations = require('../../data/known_stations.json');
const dma_mapping = require('../../data/fcc_dma_markets.json');
// TODO: map proper channel identifiers
// https://github.com/tgorgdotcom/locast2plex/blob/973198b61fba0c6a9f436963e7416b7acc16d34a/LocastService.py#L195
// this.fcc_market = dma_mapping[this.dma];

const gotclient = got.extend({
  prefixUrl: LOCAST_API
});

class Locast {
  constructor(options = {}) {
    this.config = {
      // cache user, location and dma for 30 min by default
      cacheTTL: 1800 * 1000,

      ...db.get('locast').value(),
      ...options
    };

    this.stations = [];

    this._userExpires = 0;
    this._locationExpires = 0;
    this._dmaExpires = 0;

  }
  isAvailable() {
    if (this.config.token) {
      return true;
    }
  }
  async login(username, password) {
    const json = { username, password };
    /*this.config.auth*/
    const res = await gotclient.post('user/login', { json }).json();
    if (res.token) {
      this.config.token = res.token;
      db.set('locast.token', this.config.token).write();
      return true;
    }
  }
  async token() {
    // if (!this.config.token) {
    //   await this.login();
    // }
    return this.config.token;
  }
  async request(req_path, options) {
    const token = await this.token();
    if (!token) {
      throw new Error('Unauthorized');
    }
    const headers = { 'Authorization': `Bearer ${token}`}
    return gotclient(req_path, { headers, ...options }).json();
  }
  async me() {
    if (!this.user || Date.now() > this._userExpires) {
      this.user = await this.request('user/me');
      log('locast', `User fetched as: ${this.user.name}`);
      this._userExpires = Date.now() + this.config.cacheTTL;
    }
    return this.user;
  }

  async getLocation() {
    if (!this.location || Date.now() > this._locationExpires) {
      this.location = await got(GEO_JS_API).json();
      const { latitude, longitude, city, region, country } = this.location;
      log('locast', `Location detected as: ${latitude},${longitude} (${city}, ${region}, ${country})`);
      this._locationExpires = Date.now() + this.config.cacheTTL;
    }
    return this.location;
    // return got(GEO_JS_API).json();
  }
  async getDMA() {
    if (!this.dma) {
      const { latitude, longitude, city, region, country } = await this.getLocation();
      const path = `watch/dma/${latitude}/${longitude}`;
      const { DMA } = await gotclient(path).json();
      this.dma = DMA;
    }
    return this.dma;
  }
  async getStreamUrl(station_id) {
    const { streamUrl } = await this.getStation(station_id);
    return streamUrl;
  }
  async getStation(station_id) {
    await this.validateUser();
    const { latitude, longitude } = await this.getLocation();
    return this.request(`watch/station/${station_id}/${latitude}/${longitude}`);
  }
  async validateUser() {
    await this.me();
    if (!this.user) {
      throw new Error('Unable to validate locast user');
    }
    const { didDonate, donationExpire } = this.user;
    if (!didDonate) {
      throw new Error('You first donate to Locast');
    }
    const expires = moment(donationExpire);
    if (moment().isAfter(expires)) {
      throw new Error('Your Locast donation period has expired');
    }

    await this.getLocation();
    if (!this.location) {
      throw new Error('Unable to determine location');
    }

    await this.getDMA();
    if (!this.dma) {
      throw new Error('Unable to determine DMA');
    }

  }
  async scanStations() {
    await this.validateUser();
    let noneChannel = 999
    const { start } = epgWindow();
    const searchParams = {}; //{ startTime: start };
    const stations = await this.request(`watch/epg/${this.dma}`);
    if (stations) {
      this.stations = stations.map((station, index) => {
        const matches = /([\d\.]+)\s([\w]+)/gi.exec(station.callSign);
        let channel;
        if (matches.length > 2) {
          channel = matches[1];
        } else {
          channel = noneChannel++;
        }
        return {
          ...station,
          iconUrl: station.logoUrl,
          guideNum: channel
        };
      });
    }
    // return this.stations;
  }
  serialize() {
    return this.stations.map(station => {
      return {
        'GuideNumber': station.guideNum,
        'GuideName': station.name,
        'HD': 1,
        'URL': `${HTTP_ENDPOINT}/mpegts/locast/${station.id}`,
        'Icon': station.logoUrl
      }
    });
  }
  epg() {
    let programs = this.stations.reduce((b, a) => {
      return [...b, ...a.listings
        // make sure we're only displaying the next 5 hours worth of guide data, otherwise the XML output is yuuge
        .filter(tl => {
          const start = moment(tl.startTime);
          const max = moment().add('6', 'hours');
          return start.isBefore(max);
        })
        .map(tl => {

        let {
          airdate,
          description: desc,
          duration,
          title,
          programId,
          releaseDate,
          startTime,
          episodeTitle,
          seasonNumber,
          episodeNumber
        } = tl;

        title = title || a.name || 'Unkown';

        return {
          desc,
          episodeNumber,
          guideNum: a.guideNum,
          start: startTime,
          stop: startTime + (duration * 1000),
          releaseDate,
          programId,
          seasonNumber,
          title
        }
      })];
    }, []);
    return [
      this.stations,
      programs
    ];
  }
}

module.exports = Locast;
