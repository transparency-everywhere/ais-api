var express = require('express');

var request = require('request');
var cheerio = require('cheerio');
var moment = require('moment');
var path = require('path');


var app = express();

app.set('port', (process.env.PORT || 5000))


var api = new function(){

	this.init = function(){
		var self = this;
		app.get('/', function(request, response) {
		  response.sendFile(path.join(__dirname + '/index.html'));
		});
		app.get('/getLastPositionFromVF/:imo', function(request, response) {
		  self.getLocationFromVF(request.params.imo, function(result){
		  	response.send(result);
		  })
		});
		app.get('/getLastPositionFromMT/:mmsi', function(request, response) {
		  self.getLocationFromMT(request.params.mmsi, function(result){
		  	response.send(result);
		  })
		});
		app.get('/getLastPosition/:mmsi/:imo', function (req, res) {
		  //res.send(req.params);

		  self.getLocation(req.params.mmsi, req.params.imo, function(result){
		  	res.send(result);
		  })
		})
		app.listen(app.get('port'), function() {
		  console.log('Node app is running on port', app.get('port'));
		});

	}
	this.getLocation = function(mmsi, imo, cb){
		console.log(mmsi,imo);
		var self = this;
		console.log('getting location for vehicle',mmsi, imo);
		this.getLocationFromVF(imo,function(VFResult){

			console.log('got location fro vf');
			self.getLocationFromMT(mmsi,function(MTResult){




				var vfDate = moment(VFResult.timestamp);
				var mtDate = moment(MTResult.timestamp);
				var secondsDiff = mtDate.diff(vfDate, 'seconds')
				console.log(secondsDiff)
				if(secondsDiff < 0){
					cb(VFResult);
				}else if(secondsDiff > 0){
					cb(mtDate);
				}else{
					cb(VFResult);
				}
			});

		});
	}
	this.getLocationFromVF = function(IMO,cb){
		var url = 'https://www.vesselfinder.com/vessels/somestring-IMO-'+IMO;

		var options = {
		  url: url,
		  headers: {
		    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.8; rv:24.0) Gecko/20100101 Firefox/24.0',
		    'Content-Type' : 'application/x-www-form-urlencoded' 
		  }
		};
		request(options, function (error, response, html) {
		  if (!error && response.statusCode == 200 || response.statusCode == 403) {
		    //console.log(html);
		    var $ = cheerio.load(html);
		   
		    var timestamp = $('#last_report_ts').text();
		    var lat = $('span[itemprop="latitude"]').text();
		    var lon = $('span[itemprop="longitude"]').text();
		    //console.log($('span.small-7.columns.value').text());
		    cb({error:null,data:{ timestamp: timestamp, latitude:lat, longitude:lon}})
		  }else{
		  	cb({error:'an unknown error occured'});
		  }
		});
	}
	this.getLocationFromMT = function(mmsi,cb){
		var url = 'https://www.marinetraffic.com/en/ais/index/positions/all/mmsi:'+mmsi+'';
		console.log(url);
		var options = {
		  url: url,
		  headers: {
		    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.8; rv:24.0) Gecko/20100101 Firefox/24.0',
		    'Content-Type' : 'application/x-www-form-urlencoded' 
		  }
		};
		request(options, function (error, response, html) {
		  if (!error && response.statusCode == 200 || response.statusCode == 403) {
		    //console.log(html);
		    var $ = cheerio.load(html);
		   
		    var tds = [], times = [];
		    $('.filters_results_table tr td').each(function(i, elem) {
			  tds[i] = $(this).text();
			});

		    $('.filters_results_table tr td time').each(function(i, elem) {
			  times[i] = parseInt($(this).text()+'000');
			});

		    var timestamp = new Date(times[1]).toString();
		    var source = tds[1];
		    var speed = tds[2];
		    var lat = tds[3];
		    var lon = tds[4];
		    var course = tds[5];
		    //console.log($('span.small-7.columns.value').text());
		    if(timestamp && source && speed && lat && lon && course)
		   		cb({error:null,data:{ timestamp: timestamp.trim(), latitude:lat.trim(), longitude:lon.trim()}})

		  	cb({error:'an unknown error occured'});
		  }else{
		  	cb({error:error});
		  }
		});
	}

}


api.init();

