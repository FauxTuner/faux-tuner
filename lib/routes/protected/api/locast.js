const { Router } = require('express');

// const db = require('../database')();

const app = new Router();

app.get('/status', async (req, res) => {
  let authenicated = false;
  let user;
  const { tuner } = req.app.locals;
  try {
    user = await tuner.locast.me();
    authenicated = !!user;
  } catch(error) {
    console.log(error);
  }
  res.json({ authenicated, user });
});
app.post('/login', async (req, res) => {
  const { tuner } = req.app.locals;
  // const { locast } = req.app.locals.tuner;
  const { username, password } = req.body;
  try {
    const result = await tuner.locast.login(username, password);
    if (result) {
      // re-scan channels after a successful login
      tuner.scan();
      res.json({ success: true });
    } else {
      res.status(400).json({ error: 'Unable to login using those credentials' });
    }
  } catch(error) {
    res.status(400).json({ error: error.message });
  }
  // await locast.login().then(result => {
  //   res.json({ result });
  // }).catch(error => {
  //   res.json({ error: error.message });
  // });
});

module.exports = app;
