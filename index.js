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
		app.get('/getLastPositionFromVF/:mmsi', function(request, response) {
		  self.getLocationFromVF(request.params.mmsi, function(result){
		  	response.send(result);
		  })
		});
		app.get('/getLastPositionFromMT/:mmsi', function(request, response) {
		  self.getLocationFromMT(request.params.mmsi, function(result){
		  	response.send(result);
		  })
		});
		app.get('/getLastPosition/:mmsi', function (req, res) {
		  //res.send(req.params);

		  self.getLocation(req.params.mmsi, function(result){
		  	res.send(result);
		  })
		})
		app.listen(app.get('port'), function() {
		  console.log('Node app is running on port', app.get('port'));
		});

	}
	this.getLocation = function(mmsi, cb){
		console.log(mmsi);
		var self = this;
		console.log('getting location for vehicle',mmsi);
		this.getLocationFromVF(mmsi,function(VFResult){

			console.log('got location from vf');
			self.getLocationFromMT(mmsi,function(MTResult){




				var vfDate = moment(VFResult.data.timestamp);
				var mtDate = moment(MTResult.data.timestamp);
				var secondsDiff = mtDate.diff(vfDate, 'seconds')
				console.log(secondsDiff)
				if(secondsDiff < 0){
					cb(VFResult);
				}else if(secondsDiff > 0){
					cb(MTResult);
				}else{
					cb(VFResult);
				}
			});

		});
	}
	this.getLocationFromVF = function(MMSI,cb){
		var url = 'https://www.vesselfinder.com/vessels/somestring-MMSI-'+MMSI;

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
		    var course_speed = $('.vfix-top:nth-of-type(2) .tparams tr:nth-of-type(9) .v3').text();
		    var course = course_speed.split('/')[0].replace('° ', '');
		    var speed = course_speed.split('/')[1].replace(' kn', '');
		    var lat_lon = $('.vfix-top:nth-of-type(2) .tparams tr:nth-of-type(10) .v3').text();
		    var lat = lat_lon. split('/')[0].replace(' N','');
		    var lon = lat_lon. split ('/') [1].replace(' E','');
		    var timestamp = new Date($('.vfix-top:nth-of-type(2) .tparams tr:nth-of-type(11) .v3').text()).toString();
			var unixtime = new Date($('.vfix-top:nth-of-type(2) .tparams tr:nth-of-type(11) .v3').text()).getTime()/1000;
		    cb({error:null,data:{ timestamp: timestamp, unixtime: unixtime, latitude:lat, longitude:lon, course:course, speed:speed.trim()}})
		  }else{
		  	console.log('error VF');
		  	//console.log(html);
		  	cb({error:'an unknown error occured'});
		  }
		});
	}
	this.getLocationFromMT = function(mmsi,cb){
		var url = 'https://www.marinetraffic.com/en/ais/details/ships/mmsi:'+mmsi+'';
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
		   
		    /*
			convert 1 hour, 11 minutes ago (2018-11-23 01:17 (UTC))
			to 2018-11-23 01:17 (UTC)
		    */
		   	var date_str = $('#tabs-last-pos .group-ib strong').first().text().match(/\(([^)]+)\)/)[1]+')';
			var timestamp = new Date(date_str).toString();
			var unixtime = new Date(date_str).getTime()/1000;

		   	var lat_lon = $('#tabs-last-pos .details_data_link').text().replace('°','').replace('°','');
		    var lat = lat_lon.split('/')[0];
		    var lon = lat_lon.split('/')[1];
null
		    var speed_course = $('#tabs-last-pos .group-ib:nth-child(6) strong').first().text();
		    var speed = speed_course.split('/')[0].replace('kn ','');
		    var course = speed_course.split('/')[1].replace('°','');
		    if(timestamp  && speed && lat && lon && course)
		   		cb({error:null,data:{ timestamp: timestamp.trim(), unixtime:unixtime, latitude:lat.trim(), longitude:lon.trim(),speed:speed,course:course.trim()}})
		   	else
		  		cb({error:'an unknown error occured'});
		  }else{
		  	cb({error:error});
		  }
		});
	}

}


api.init();

