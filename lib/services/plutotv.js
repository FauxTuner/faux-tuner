// TODO: Implement PlutoTV

// https://service-channels.clusters.pluto.tv/v1/guide
// ?start=2020-08-20T13%3A00%3A00-06%3A00
// &stop=2020-08-20T17%3A00%3A00-06%3A00
// &deviceId=ef976919-8352-459e-8726-6e75fd3a5aab
// &deviceMake=Chrome
// &deviceType=web
// &deviceVersion=84.0.4147.125
// &DNT=0
// &sid=6954e3c9-0ffe-4f0c-bef9-b51a512d58e8
// &appName=web
// &appVersion=5.6.0-05e6d11bfce7210bc262d7e9f2a96fc738b8ad86

const GUIDE_URL = 'https://service-channels.clusters.pluto.tv/v1/guide';

const got = require('got');
const { v4: uuid } = require('uuid');
const moment = require('moment');
const db = require('../database')();
const log = require('../utils/log');
const epgWindow = require('../utils/epgWindow');

class PlutoTV {
  constructor(options = {}) {
    this.channelPrefix = 2000;
    this.config = { ...options };
    this.channels = [];
    this.sid = uuid();
  }
  async scanStations() {
    const { start, stop } = epgWindow();
    // const m = moment().startOf('hour');
    const searchParams = {
      'DNT': 0,
      start,
      stop,
      deviceId: DEVICE_ID,
      deviceMake: 'Chrome',
      deviceType: 'web',
      deviceVersion: '84.0.4147.125',
      sid: this.sid,
      appName: 'web',
      appVersion: '5.6.0-05e6d11bfce7210bc262d7e9f2a96fc738b8ad86'
    };
    const results = await got(GUIDE_URL, { searchParams }).json();
    this.channels = results.channels.map(channel => {
      const { url: iconUrl } = channel.images
        .find(({ type }) => type === 'solidLogoPNG'); // || type === 'colorLogoPNG' || type === 'logo'
      channel.guideNum = `${this.channelPrefix}.${channel.number}`;
      channel.iconUrl = iconUrl;
      return channel;
    });
  }
  getStreamUrl(channel_id) {
    const channel = this.channels.find(({ id }) => id === channel_id);
    const { url: hlsStream } = channel.stitched.urls.find(({ type }) => type === 'hls');
    return hlsStream;
  }
  serialize() {
    return this.channels.map(channel => {
      return {
        'GuideNumber': `${channel.guideNum}`,
        'GuideName': channel.name,
        'HD': 1,
        'URL': `${HTTP_ENDPOINT}/mpegts/plutotv/${channel.id}`,
        'Icon': channel.iconUrl
      }
    });
  }
  epg() {
    let programs = this.channels.reduce((b, a) => {
      return [...b, ...a.timelines.map(tl => {
        let {
          title,
          episode,
          start,
          stop
        } = tl;

        title = title || (episode && episode.name) || 'Unkown Airing';

        const desc = episode && episode.description;
        return {
          desc,
          guideNum: a.guideNum,
          start,
          subTitle: episode.name,
          stop,
          title,
          releaseDate: episode.originalReleaseDate,
          episodeNumber: episode.number
        }
      })];
    }, []);
    return [
      this.channels,
      programs
    ];
    // return this.channels.map(channel => {
    //   channel.timelines
    //   channel.id
    // })
    // .map(channel => {
    //   return {
    //     programs: channel.timelines
    //   }
    // });
  }
}

module.exports = PlutoTV;
