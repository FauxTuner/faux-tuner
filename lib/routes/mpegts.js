const { Router } = require('express');
const got = require('got');
const HLS2MPEGTS = require('../hls2mpegts');
const { Parser } = require('m3u8-parser');
const m3u8 = require('m3u8');
const { StreamItem } = m3u8;
const { spawn } = require('child_process');
const log = require('../utils/log');
const relativeToUri = require('../utils/relativeToUri');

const app = new Router();

async function parseM3U8(req_uri) {
  log('m3u8', req_uri);
  return new Promise((resolve, reject) => {
    const parser = m3u8.createStream();
    const stream = got.stream(req_uri);

    let lowestBitrate = null;
    parser.on('item', function(item) {
      // relativeToUri(item.get('uri'), req_uri)
      // console.log(item.get('type'), item);
      const type = item.get('type') || 'unkown';
      if (!/subtitles/gi.test(type)) {
        const uri = item.get('uri');
        const bandwidth = item.get('bandwidth');
        if (!lowestBitrate || lowestBitrate.get('bandwidth') > bandwidth) {
          lowestBitrate = item;
        }
        // console.log(bandwidth, uri);
        // log('m3u8', bandwidth);
        // item.set('uri', relativeToUri(item.get('uri'), req_uri));
      }
    });
    parser.on('m3u', function(m3u) {
      // fully parsed m3u file
      if (lowestBitrate) {
        const uri = relativeToUri(lowestBitrate.get('uri'), req_uri);
        log('m3u8', `Found: ${uri}`);
        log('m3u8', `Found: ${lowestBitrate.get('bandwidth')}`);
        return resolve(uri);
      }
      log('m3u8', `No playlist detected, using master playlist: ${req_uri}`);
      resolve(req_uri);
    });
    stream.pipe(parser);
  });


  // const parser = new Parser();
  // parser.push(response);
  // parser.end();
  // const { manifest: { playlists } } = parser;
  // // return parser.manifest;
  // if (playlists && playlists.length > 0) {
  //   const bestStream = getQualityLevel(playlists);
  //
  // }
}
function getQualityLevel(playlists, resolutionLimit, bandwidthLimit = 0) {

  // return playlists
  // .map(item => {
  //   const { attributes } = item;
  //   const bandwidth = attributes['BANDWIDTH'] || -1;
  //   return {
  //     bandwidth,
  //     ...item,
  //   }
  // })
  // .sort((a, b) => a.bandwidth > b.bandwidth ? -1 : 1)
  // .reduce((b, a) => {
  //   if (!b) {
  //     b = a;
  //   }
  //   if (bandwidthLimit > 0 && a.bandwidth <= bandwidthLimit) {
  //     b = a;
  //   }
  //   return b;
  // }, null);
}


app.get('/mpegts/:provider/:channel_id', async (req, res) => {
  const { provider, channel_id } = req.params;
  const streamUrl = await req.app.locals.tuner.getStreamUrl(provider, channel_id);
  if (!streamUrl) {
    return res.sendStatus(404);
  }
  res.set('Content-Type', 'video/MP2T');

  // const inputPlaylistUri = await parseM3U8(streamUrl);
  // if (!inputPlaylistUri) {
  //   throw new Error('Unable to find playlist URL');
  // }
  // console.log('OK', inputPlaylistUri);
  // const child = spawn('ffmpeg', [
  //   // '-fflags', '+igndts',
  //   '-i', inputPlaylistUri,
  //   '-loglevel', 'warning',
  //   '-c', 'copy',
  //   '-map', '0:v:0',
  //   '-map', '0:a:0',
  //   '-c:v', 'copy',
  //   '-c:a', 'copy',
  //   '-f', 'mpegts',
  //   'pipe:1'
  // ]);
  // child.stderr.on('data', data => {
  //   log('ffmpeg', `${data}`);
  // })
  // child.on('exit', code => {
  //   log('ffmepg', `exited ${code}`);
  // })
  // res.on('close', () => {
  //   child.kill();
  // });
  // child.stdout.pipe(res);

  const hls2mpegts = new HLS2MPEGTS(streamUrl);
  hls2mpegts.pipe(res);

  res.on('close', () => {
    hls2mpegts.quit();
  });

});

module.exports = app;
