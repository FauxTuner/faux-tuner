const express = require('express');
const fauxTuner = require('../');

const app = express();

app.use(fauxTuner);

app.listen(8001, () => {
  console.log('listening...');
});
