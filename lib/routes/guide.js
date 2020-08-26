const { Router } = require('express');
// const builder = require('xmlbuilder');
const { create } = require('xmlbuilder2');
const moment = require('moment');

const app = new Router();

app.get('/guide.xml', async (req, res) => {

  const root = {
    tv: {
      '@': {
        'source-info-url': 'https://github.com/dudewheresmycode/faux-tuner',
        'source-info-name': 'FauxTuner',
        'generator-info-name': 'XMLTV/$Id: tv_grab_na_dd.in,v 1.70 2008/03/03 15:21:41 rmeden Exp $',
        'generator-info-url': 'http://www.xmltv.org/'
      },
      channel: [],
      programme: []
    }
  };

  const { channels, programs } = await req.app.locals.tuner.guide();
  root.tv.channel = channels.map(channel => {
    const channelId = channel.guideNum;
    let icon = {};
    if (channel.iconUrl) {
      icon = {
        'icon': {
          '@': { src: channel.iconUrl }
        }
      };
    }
    return {
      '@': { id: channelId },
      'display-name': channel.name,
      ...icon
    };
  });

  root.tv.programme = programs
    .sort((a, b) => moment(a.start).isAfter(moment(b.start)) ? 1 : -1 )
    .map(program => {

    const {
      episodeNumber,
      title,
      desc,
      start,
      seasonNumber,
      stop,
      subTitle,
      programId,
      guideNum,
      releaseDate
    } = program;

    const programmeEle = {
      '@': {
        start: moment(start).format('YYYYMMDDHHmmss ZZ'),
        stop: moment(stop).format('YYYYMMDDHHmmss ZZ'),
        channel: guideNum
      },
      title: {
        //'@': { lang: 'en' },
        '#': title
      },
      desc: {},
      audio: { 'stereo': { '#': 'stereo' } }
    };

    if (desc) {
      programmeEle.desc = {
        // '@': { lang: 'en' },
        '#': desc
      };
    }
    programmeEle['episode-num'] =[];
    if (programId) {
      programmeEle['episode-num'].push({
        '@': { system: 'dd_progid' },
        '#': programId
      });
    }
    if (subTitle) {
      programmeEle['sub-title'] = {
        '#': subTitle
      };
    }
    if (seasonNumber || episodeNumber) {
      let sn = seasonNumber; // ? seasonNumber.toString().padStart(2, '0') : null;
      let ep = episodeNumber; // ? episodeNumber.toString().padStart(2, '0') : null;
      let line = [];
      if (sn) {
        line.push(`S${sn}`);
        if (ep) {
          line.push(` E${ep}`);
        }
      } else if (episodeNumber) {
        line = episodeNumber;
      }

      if (line.length) {
        programmeEle['episode-num'].push({
          '@': { system: 'onscreen' },
          '#': line.join(' ')
        });
      }
    }
    if (releaseDate) {
      programmeEle.date = {
        '#': moment(releaseDate).format('YYYYMMDD')
      }
    }
    return programmeEle;
  });


  const xml = create({ encoding: 'UTF-8' }, root)
    .dtd({ sysID: 'xmltv.dtd' })
    .end({ prettyPrint: true });

  res.set('Content-Type', 'application/xml');
  res.set('Content-Length', xml.length);
  res.send(xml);

});

module.exports = app;
