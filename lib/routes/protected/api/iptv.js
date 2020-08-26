const { Router } = require('express');
const got = require('got');
const path = require('path');
const { v4: uuid } = require('uuid');
const Jimp = require('jimp');

const db = require('../../../database')();

// const sharp = require('sharp');

function isValidUrl(url) {
  try {
    (new URL(url));
    return true;
  } catch(error) { }
}

async function processImage(image) {
  const imageId = `im-${uuid()}`;
  let buffer = image;
  if (image.indexOf('base64,') > -1) {
    const base64Data = image.split('base64,')[1];
    buffer = Buffer.from(base64Data, 'base64');
  // } else if (isValidUrl(image)) {
    // buffer = await got(image).buffer();
  }

  let outputFilename;
  if (buffer) {
    outputFilename = `${imageId}.png`;
    const image = await Jimp.read(buffer);

    // fit within 256x256
    if (image.bitmap.width > image.bitmap.height) {
      await image.resize(256, Jimp.AUTO);
    } else {
      await image.resize(Jimp.AUTO, 256);
    }
    const outputFilepath = path.join(IMAGE_DATA_PATH, outputFilename);
    await image.writeAsync(outputFilepath);
  }
  return outputFilename;

}

const app = new Router();

app.get('/channels', async (req, res) => {
  const stored = db.get('iptv').value();
  res.json({ channels: stored.channels });
});
app.post('/image', (req, res) => {
  res.json({ id: imageId });
});
app.post('/create', async (req, res) => {
  // const { iptv } = req.app.locals.tuner;
  const { name, description, image, url } = req.body;

  let iconUrl;
  if (image) {
    const imagePath = await processImage(image);
    iconUrl = `${HTTP_ENDPOINT}/imagedata/${imagePath}`;
  }
  const stored = db.get('iptv.channels').value();
  // const existing = Object.assign({}, stored);
  const nextGuide = Math.max(...stored.map(channel => parseInt(channel.guide)));

  const newChannel = {
    id: uuid(),
    guide: nextGuide,
    name,
    description,
    iconUrl,
    urls: [url]
  };
  // console.log(existing.channels);
  // existing.channels.push(newChannel);
  db.get('iptv.channels').push(newChannel).write();
  res.json({ channel: newChannel })
});

module.exports = app;
