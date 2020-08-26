const { Readable } = require('stream');
const got = require('got');
const { spawn } = require('child_process');
const path = require('path');
const { Parser } = require('m3u8-parser');
const ivToHex = require('./utils/ivToHex');
const log = require('./utils/log');
const crypto = require('crypto');

class BandwidthMonitor {
  constructor() {
    this.history = [];
  }
  push(ms, bytes) {
    const bytesPerSec = bytes / (ms / 1000);
    this.history.push({ bytesPerSec, ms, bytes });
    // log('HLS2MPEGTS', `downloaded segment ${bytes} bytes in ${ms}ms at a rate of ${bytesPerSec} bytes/s`);

    // only keep the 20 most recent events
    if (this.history.length > 20) {
      this.history = this.history.slice(-20);
    }
  }
  averageBytesPerSec() {
    return this.history.reduce((b, a) => {
      return b + a.bytesPerSec;
    }, 0) / this.history.length;
  }
}


class HLS2MPEGTS extends Readable {
  constructor(hlsUrl, options = {}) {
    super();
    this.options = {
      refreshInterval: 5000,
      ...options
    };
    this.hlsUrl = hlsUrl;
    // this.masterPlaylist = null;
    this.stream = null;
    this.activeStreamUrl = null;
    this.segments = [];
    this.active = true;
    this.bytesRead = 0;
    this._firstSegment = true;
    this.bwMonitor = new BandwidthMonitor();
    this.parse(this.hlsUrl);
  }
  _read(bytes) { }
  _destroy() { }

  async handleSegmentList(manifest, mediaSequence) {
    const segments = manifest.segments
      .map((segment, segmentIndex) => {
        const index = mediaSequence + segmentIndex;
        return { ...segment, index };
      })
      // grab .ts files
      // only grab segments with positive durations
      // only push new segments
      .filter((seg, index) => {
        return /\.ts/ig.test(seg.uri) &&
          seg.duration > 0 &&
          !this.segments.some(_seg => seg.uri===_seg.uri && seg.index===_seg.index);
      });
    // console.log(segments.slice(-1)[0]);
    await this.pushNewSegments(segments, mediaSequence);

  }
  adaptiveQualityCheck() {
    if (this.masterPlaylist) {
      const variant = this.getQualityLevel(this.masterPlaylist);
      if (variant) {
        const variantUri = this.relativePathToUrl(variant.uri, this.masterPlaylistUrl);
        if (variantUri != this.activeStreamUrl) {
          console.log('new variant found!', variantUri);
          this.activeStreamUrl = variantUri;
        }
      }
    }
  }
  async fetchPlaylist() {
    this.adaptiveQualityCheck();
    if (this.activeStreamUrl) {
      await this.parse(this.activeStreamUrl);
    } else {
      log('HLS2MPEGTS', 'no streams found in HLS playlist :[');
    }
  }
  async parse(inputUri) {
    const manifest = await this.fetch_m3u8(inputUri);
    const { mediaSequence, playlists, segments } = manifest;
    if (segments && segments.length) {
      // Manifest has segments, start the concat train! Choo choo!
      if (!this.activeStreamUrl) { // detected on first run
        this.activeStreamUrl = inputUri;
      }

      await this.handleSegmentList(manifest, mediaSequence);

      if (this.active) { // make sure it's still active after our async calls before we setTimeout again
        this._refreshTimeout = setTimeout(this.refresh.bind(this), this.options.refreshInterval);
      }
    } else if (playlists && playlists.length) {
      log('HLS2MPEGTS', 'Found playlists');
      // Looks like a master playlist, let's grab a playlist
      this.masterPlaylistUrl = inputUri;
      this.masterPlaylist = manifest;
      await this.fetchPlaylist();
    } else {
      log.error('HLS2MPEGTS', 'No segments or playlists found :[');
    }
  }
  async refresh() {
    if (this.active) { // make sure it's active to run
      // TODO: Properly handle segments to avoid sending duplicates
      // this.adaptiveQualityCheck();
      await this.parse(this.activeStreamUrl);
    }
  }
  async decrypt(encryptedSegment, key) {
    const keyBuffer = await got(key.uri).buffer();
    const keyHex = keyBuffer.toString('binary');
    const ivHex = ivToHex(key.iv);
    return new Promise(async (resolve, reject) => {
      const decipher = crypto.createDecipheriv('aes-128-cbc', keyBuffer, Buffer.from(ivHex, 'hex'));
      let chunks = [];
      decipher.on('readable', () => {
        let chunk;
        while (null !== (chunk = decipher.read())) {
          chunks.push(chunk);
        }
      });
      decipher.on('end', () => {
        const buffer = Buffer.concat(chunks);
        resolve(buffer);
      });
      decipher.write(encryptedSegment);
      decipher.end();
    });

  }
  async pushNewSegments(segments, mediaSequence) {
    // let segmentIndex = -1;
    for(let segment of segments) {
      const { key } = segment;
      if (key) {
        // Some services use AES-128 based "DRM", so we need to decrypt the segment
        if (key.method === 'AES-128') {
          const encryptedSegment = await this.fetchSegment(segment);
          const decrypted = await this.decrypt(encryptedSegment, key);
          this.push(decrypted);
        } else {
          throw new Error(`Key system unsupported (${key.method})`);
        }
      } else {
        const buffer = await this.fetchSegment(segment);
        this.push(buffer);
      }
      // const index = mediaSequence + segmentIndex++;
      this.segments.push({ ...segment });
    }

  }
  async fetchSegment(segment) {
    const segment_url = this.relativePathToUrl(segment.uri, this.activeStreamUrl);
    const monitorStartTime = Date.now();
    const buffer = await got(segment_url, {
      retry: {
        limit: 3,
        calculateDelay: ({ attemptCount, retryOptions, error, computedValue }) => {
          return computedValue + (attemptCount * 500);
        },
        methods: ['GET'],
        statusCodes: [408, 413, 429, 500, 502, 503, 504, 521, 522, 524, 404]
      },
      hooks: {
        beforeRetry: [
          (options, error, retryCount) => {
            log.warn('HLS2MPEGTS', error.message);
            log('HLS2MPEGTS', `Retry Segment - retryCount:${retryCount}`);
          }
        ]
      }
    }).buffer().catch(error => {
      log('HLS2MPEGTS', error);
    });

    const took_ms = Date.now() - monitorStartTime;
    this.bwMonitor.push(took_ms, buffer.length);
    const bandwidthNeeded = buffer.length / segment.duration;
    const currentAvg = this.bwMonitor.averageBytesPerSec();

    // console.log('current: ', (currentAvg / 1000).toFixed(2), 'KB/s');
    // console.log('needed: ', (bandwidthNeeded/1000).toFixed(2), 'KB/s');

    return buffer;
  }
  async fetch_m3u8(req_uri) {
    const response = await got(req_uri).text();
    const parser = new Parser();
    parser.push(response);
    parser.end();
    return parser.manifest;
  }
  relativePathToUrl(inputUri, playlistUrl) {
    inputUri = decodeURIComponent(inputUri);
    try {
      return new URL(inputUri);
      // return playlistUrl.toString();
    } catch(error) {
      if (error.code === 'ERR_INVALID_URL') {
        // likely a relative path?
        const newPlaylistUrl = new URL(playlistUrl);
        const prefix = path.dirname(newPlaylistUrl.pathname);
        const pathParts = inputUri.indexOf('?') > -1 ? inputUri.split('?') : [inputUri];
        newPlaylistUrl.pathname = inputUri.startsWith('/') ? inputUri : path.join(prefix, pathParts[0]);
        if (pathParts.length > 0) {
          newPlaylistUrl.search = new URLSearchParams(pathParts[1]);
        }
        return newPlaylistUrl.toString();
      }
    }
  }
  // TODO: Allow user quality preference
  getQualityLevel({ playlists }) {
    // return first in playlist if we don't have any bandwidth info yet...
    // this is the default behavior for HLS playback (https://dougsillars.com/2017/10/26/how-hls-adaptive-bitrate-works/)
    if (this.bwMonitor.history.length < 2) {
      return playlists[0];
    }
    const currentAvg = this.bwMonitor.averageBytesPerSec();

    // sort list by bandwidth in accending order
    playlists = playlists.sort((a, b) => (a.attributes.BANDWIDTH > b.attributes.BANDWIDTH ? 1 : -1))

    // select candidates that are under the current bandwidth average
    const candidates = playlists.filter(item => ((item.attributes.BANDWIDTH / 8) <= currentAvg)); // convert BANDWIDTH from bits to bytes

    // console.log(candidates);
    if (candidates.length > 0) {
      // return the highest bitrate stream we can playback
      return candidates.pop();
    }
    // no canidates found, return the lowest quality stream to be safe
    return playlists[0];

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
  quit() {
    this.active = false;
    clearTimeout(this._refreshTimeout);
    this.segments = [];
    // this._firstSegment = false;
  }
}

module.exports = HLS2MPEGTS;
