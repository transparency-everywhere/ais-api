var express = require('express');
var path = require('path');
var api = require('./api');

function init() {
  var app = express();

  app.set('port', (process.env.PORT || 5000))

  app.get('/', function(request, response) {
    response.sendFile(path.join(__dirname + '/index.html'));
  });
  app.get('/getLastPositionFromVF/:mmsi', function(request, response) {
    api.getLocationFromVF(request.params.mmsi, function(result){
      response.send(result);
    })
  });
  app.get('/getLastPositionFromMT/:mmsi', function(request, response) {
    api.getLocationFromMT(request.params.mmsi, function(result){
      response.send(result);
    })
  });
  app.get('/getLastPosition/:mmsi', function (req, res) {
    //res.send(req.params);

    api.getLocation(req.params.mmsi, function(result){
      res.send(result);
    })
  })
  app.listen(app.get('port'), function() {
    console.log('Node app is running on port', app.get('port'));
  });
}

module.exports = {
  init: init,
};
