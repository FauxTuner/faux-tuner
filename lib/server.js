const express = require('express');
const path = require('path');

// const tuner = require('faux-tuner-ui');
// console.log(tuner);
require('../lib/globals');

const Tuner = require('./tuner');
const routes = require('./routes');

const app = express();

app.locals.tuner = new Tuner();


app.use(routes.guide);
app.use(routes.mpegts);
app.use(routes.ssdp);
app.use(routes.tuner);
app.use('/imagedata', routes.imagedata);

app.use('/api', routes.protected.api);
app.use('/web', routes.protected.web); // public web application

module.exports = app;
