// TODO: Implement custom user-added IPTV channels / URLs

const got = require('got');
const { v4: uuid } = require('uuid');
const moment = require('moment');
const db = require('../database')();

class IpTV {
  constructor(options = {}) {
    this.channelPrefix = 3000;
    this.config = { ...options };
    this.channels = [];
  }
  async scanStations() {
    // TODO: run a getHead on each m3u8 and drop channels with no valid streams
    const stored = db.get('iptv.channels').value();
    this.channels = stored.map(channel => {
      const mstart = moment().startOf('hour').subtract(1, 'hour');
      const { name, iconUrl } = channel;
      channel.guideNum = `${this.channelPrefix}.${channel.guide}`;
      channel.programs = [
        {
          title: name,
          iconUrl,
          start: mstart.toISOString(),
          stop: mstart.add(24, 'hours').toISOString(),
          desc: null
        }
      ];
      return channel;
    });

    // this.channels.forEach()
    // const { start, stop } = epgWindow();
    // // const m = moment().startOf('hour');
    // const searchParams = {
    //   'DNT': 0,
    //   start,
    //   stop,
    //   deviceId: DEVICE_ID,
    //   deviceMake: 'Chrome',
    //   deviceType: 'web',
    //   deviceVersion: '84.0.4147.125',
    //   sid: this.sid,
    //   appName: 'web',
    //   appVersion: '5.6.0-05e6d11bfce7210bc262d7e9f2a96fc738b8ad86'
    // };
    // const results = await got(GUIDE_URL, { searchParams }).json();
    // this.channels = results.channels.map(channel => {
    //   const { url: iconUrl } = channel.images
    //     .find(({ type }) => type === 'solidLogoPNG'); // || type === 'colorLogoPNG' || type === 'logo'
    //   channel.guideNum = `${this.channelPrefix}.${channel.number}`;
    //   channel.iconUrl = iconUrl;
    //   return channel;
    // });
  }
  getStreamUrl(channel_id) {
    const channel = this.channels.find(({ id }) => id === channel_id);
    // TODO: waterfall each stream on failure...
    return channel.urls.length && channel.urls[0]; //.find(({ type }) => type === 'hls');
  }
  serialize() {
    return this.channels.map(channel => {
      return {
        'GuideNumber': `${channel.guideNum}`,
        'GuideName': channel.name,
        'HD': 1,
        'URL': `${HTTP_ENDPOINT}/mpegts/iptv/${channel.id}`,
        'Icon': channel.iconUrl
      }
    });
  }
  epg() {
    let programs = this.channels.reduce((b, a) => {
      return [...b, ...a.programs.map(tl => {
        tl.guideNum = a.guideNum;
        return tl;
        // let { title, desc, start, stop } = tl;
        // return {
        //   desc,
        //   guideNum: a.guideNum,
        //   start,
        //   stop,
        //   title
        // }
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

module.exports = IpTV;
