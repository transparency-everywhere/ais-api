const express = require('express');
const path = require('path');

const api = require('./api');

function init() {
  const app = express();

  app.set('port', (process.env.PORT || 5000))

  app.get('/', (request, response) => {
    response.sendFile(path.join(__dirname + '/index.html'));
  });

  app.get('/getLastPositionFromVF/:mmsi', (req, res) => {
    api.getLocationFromVF(req.params.mmsi, (result) => {
      res.send(result);
    });
  });

  app.get('/getLastPositionFromMT/:mmsi', (req, res) => {
    api.getLocationFromMT(req.params.mmsi, (result) => {
      res.send(result);
    });
  });

  app.get('/getLastPosition/:mmsi', (req, res) => {
    api.getLocation(req.params.mmsi, (result) => {
      res.send(result);
    });
  })

  app.listen(app.get('port'), function() {
    console.log('Node app is running on port', app.get('port'));
  });
}

module.exports = {
  init: init,
};
